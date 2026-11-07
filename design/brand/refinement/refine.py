"""Offline refinement from the ORIGINAL stored cubic paths, never retracing a raster.
Run with system Python: numpy scipy shapely triangle. No website dependency.
"""
from pathlib import Path
import json, math, hashlib, sys, scipy
import numpy as np
import shapely
from shapely.geometry import Polygon
from shapely.ops import polylabel
import triangle
from scipy.sparse import coo_matrix
from scipy.sparse.linalg import spsolve

ROOT=Path(__file__).resolve().parents[3]
OUT=ROOT/'docs/verification/logo-refinement'
items=json.loads((OUT/'source-curves.json').read_text())
provenance=json.loads((OUT/'provenance.json').read_text())
assert provenance['approved_blend_sha256']==hashlib.sha256((ROOT/'design/brand/abg-logo.blend').read_bytes()).hexdigest()
assert provenance['curves_sha256']==hashlib.sha256((OUT/'source-curves.json').read_bytes()).hexdigest()

def sample_curve(spline):
    result=[];error_bounds=[]
    def split(p,depth=0):
        chord=np.linalg.norm(p[3]-p[0]); deviation=max(np.linalg.norm(p[1]-(p[0]*2+p[3])/3),np.linalg.norm(p[2]-(p[0]+p[3]*2)/3))
        if depth>=18 and (chord>.012 or deviation>.00004):raise ValueError('Cubic subdivision did not converge')
        if chord<=.012 and deviation<=.00004:
            delta=p[3]-p[0];length2=np.dot(delta,delta)
            t=np.clip((p[1:3]-p[0])@delta/max(length2,1e-24),0,1)
            # A Bezier lies in its control hull, giving a conservative distance
            # bound to this chord, independent of raster/sampling comparisons.
            error_bounds.append(float(np.linalg.norm(p[1:3]-(p[0]+t[:,None]*delta),axis=1).max()))
            result.append(p[0]);return
        a=(p[:-1]+p[1:])/2;b=(a[:-1]+a[1:])/2;c=(b[0]+b[1])/2
        split(np.array([p[0],a[0],b[0],c]),depth+1)
        split(np.array([c,b[1],a[2],p[3]]),depth+1)
    for a,b in zip(spline,spline[1:]+spline[:1]):
        split(np.array([a['p'][:2],a['r'][:2],b['l'][:2],b['p'][:2]],dtype=float))
    points=np.array(result);mask=np.linalg.norm(points-np.roll(points,1,axis=0),axis=1)>1e-8
    return points[mask],max(error_bounds)

report=[]
for item in items:
    sampled=[sample_curve(s) for s in item['splines']]
    contours=[p for p,error in sampled];cubic_bound=max(error for p,error in sampled)
    assert cubic_bound<=.00004
    # Determine shell/counters by area; retain the stored paths verbatim.
    contours.sort(key=lambda p:abs(Polygon(p).area),reverse=True)
    poly=Polygon(contours[0],contours[1:])
    if not poly.is_valid:raise ValueError((item['name'],shapely.is_valid_reason(poly)))
    vertices=np.concatenate(contours)
    segments=[];holes=[];offset=0
    for index,c in enumerate(contours):
        segments.extend((offset+i,offset+(i+1)%len(c)) for i in range(len(c)))
        offset+=len(c)
        if index:
            p=polylabel(Polygon(c),tolerance=.0001);holes.append((p.x,p.y))
    data={'vertices':vertices,'segments':np.array(segments)}
    if holes:data['holes']=np.array(holes)
    # Boundary chord error <= .00004 scene units, about .003 reference pixels.
    # No silhouette simplification or post-hoc edge decimation.
    t=triangle.triangulate(data,'pq28a0.00018D')
    xy=t['vertices'];faces=t['triangles']
    boundary=np.unique(t['segments'])
    # Every interior chord between two rim vertices needs an interior midpoint:
    # otherwise front and back meet along that chord and form a four-face edge.
    rim=set(boundary.tolist());segments={tuple(sorted(e)) for e in t['segments']}
    positions=xy.tolist();midpoints={};refined=[]
    for face in faces:
        polygon=[]
        for a,b in zip(face,np.roll(face,-1)):
            polygon.append(int(a));edge=tuple(sorted((a,b)))
            if a in rim and b in rim and edge not in segments:
                if edge not in midpoints:
                    midpoints[edge]=len(positions);positions.append(((xy[a]+xy[b])/2).tolist())
                polygon.append(midpoints[edge])
        if len(polygon)>3 or all(i in rim for i in face):
            center=len(positions);positions.append(xy[face].mean(axis=0).tolist())
            refined.extend((polygon[i],polygon[(i+1)%len(polygon)],center) for i in range(len(polygon)))
        else:refined.append(face)
    xy=np.array(positions);faces=np.array(refined)
    n=len(xy)
    def cross2(a,b):return a[:,0]*b[:,1]-a[:,1]*b[:,0]
    p=xy[faces];cross=cross2(p[:,1]-p[:,0],p[:,2]-p[:,0]);area=np.abs(cross)/2
    flip=cross<0;faces[flip]=faces[flip][:,[0,2,1]]
    p=xy[faces];cross=cross2(p[:,1]-p[:,0],p[:,2]-p[:,0]);area=cross/2
    grads=np.stack([np.stack([p[:,1,1]-p[:,2,1],p[:,2,0]-p[:,1,0]],axis=1),np.stack([p[:,2,1]-p[:,0,1],p[:,0,0]-p[:,2,0]],axis=1),np.stack([p[:,0,1]-p[:,1,1],p[:,1,0]-p[:,0,0]],axis=1)],axis=1)/cross[:,None,None]
    ke=np.einsum('tix,tjx,t->tij',grads,grads,area)
    rows=np.repeat(faces,3,axis=1).ravel();cols=np.tile(faces,(1,3)).ravel()
    K=coo_matrix((ke.ravel(),(rows,cols)),shape=(n,n)).tocsr()
    rhs=np.zeros(n);np.add.at(rhs,faces.ravel(),np.repeat(area/3,3))
    boundary=np.unique(t['segments']);inner=np.ones(n,dtype=bool);inner[boundary]=False
    # Smooth torsion field, zero on exact outlines. Unlike nearest-distance
    # inflation this has no medial-axis ridges to break the chrome reflections.
    u=np.zeros(n);u[inner]=spsolve(K[inner][:,inner],rhs[inner]);u=np.maximum(u,0)
    original=np.load(OUT/f"{item['stem']}-no-decimate.npz")
    height=float(np.abs(original['vertices'][:,2]).max())
    scale=height/math.sqrt(u.max());z=scale*np.sqrt(u)
    tri_gradient=np.einsum('ti,tix->tx',u[faces],grads)
    gradient=np.zeros((n,2));weight=np.zeros(n)
    for j in range(3):
        np.add.at(gradient,faces[:,j],tri_gradient*area[:,None]);np.add.at(weight,faces[:,j],area)
    gradient/=weight[:,None]
    # Polynomial gradient recovery removes triangulation-direction noise from
    # normals without moving any boundary or surface vertex.
    neighbors=[set() for _ in range(n)]
    for a,b,c in faces:
        neighbors[a].update([b,c]);neighbors[b].update([a,c]);neighbors[c].update([a,b])
    recovered=np.empty_like(gradient)
    for i in range(n):
        adjacent=set(neighbors[i]);adjacent.add(i)
        for j in neighbors[i]:adjacent.update(neighbors[j])
        index=np.array(sorted(adjacent));q=xy[index]-xy[i];distance=np.linalg.norm(q,axis=1)
        w=np.exp(-3*(distance/max(distance.max(),1e-8))**2)
        A=np.column_stack([np.ones(len(q)),q,q[:,0]**2,q[:,0]*q[:,1],q[:,1]**2])
        coeff=np.linalg.lstsq(A*w[:,None],u[index]*w,rcond=1e-9)[0]
        recovered[i]=coeff[1:3]
    # The normal follows F=z^2-scale^2*u=0, including the vertical tangent at rim.
    normal=np.column_stack([-scale*scale*recovered,2*z]);length=np.linalg.norm(normal,axis=1)
    if np.any(length<1e-14):raise ValueError('Undefined surface normal at a tip')
    normal/=length[:,None]
    top=np.column_stack([xy,z]);all_vertices=np.concatenate([top,np.column_stack([xy,-z])])
    all_normals=np.concatenate([normal,normal*np.array([1,1,-1])])
    all_faces=np.concatenate([faces,faces[:,[0,2,1]]+n])
    # Share the front/back rim so the mesh is a closed manifold, with no seam.
    remap=np.arange(2*n);remap[boundary+n]=boundary
    all_faces=remap[all_faces];used=np.unique(all_faces)
    compact=np.full(2*n,-1,dtype=int);compact[used]=np.arange(len(used));all_faces=compact[all_faces]
    all_vertices=all_vertices[used];all_normals=all_normals[used]
    np.savez_compressed(OUT/f"{item['stem']}-refined.npz",vertices=all_vertices.astype(np.float32),faces=all_faces.astype(np.int32),normals=all_normals.astype(np.float32))
    # Planar footprint comes directly from the stored cubics, not the old raster.
    distances=shapely.distance(shapely.points(xy[boundary]),poly.boundary)
    row={'name':item['mesh'],'vertices':len(all_vertices),'triangles':len(all_faces),'constrained_boundary_drift':float(np.max(distances)),'cubic_chord_error_upper_bound':cubic_bound,'max_depth':height,'contours':len(contours),'bounds':[all_vertices.min(axis=0).tolist(),all_vertices.max(axis=0).tolist()]}
    report.append(row);print(row,flush=True)
(OUT/'refined-metrics.json').write_text(json.dumps(report,indent=2))
(OUT/'refined-build.json').write_text(json.dumps({'approved_blend_sha256':provenance['approved_blend_sha256'],'curves_sha256':provenance['curves_sha256'],'dependencies':{'python':sys.version.split()[0],'numpy':np.__version__,'scipy':scipy.__version__,'shapely':shapely.__version__,'triangle':triangle.__version__},'meshes':{item['stem']:hashlib.sha256((OUT/f"{item['stem']}-refined.npz").read_bytes()).hexdigest() for item in items}},indent=2))
