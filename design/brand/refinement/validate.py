"""Compare projected footprints and record contour error; system Python."""
from pathlib import Path
import json,numpy as np,cv2

ROOT=Path(__file__).resolve().parents[3];OUT=ROOT/'docs/verification/logo-refinement'
items=json.loads((OUT/'source-curves.json').read_text());report=[]
pitch=.0015
for item in items:
    models={label:np.load(OUT/f"{item['stem']}-{label}.npz") for label in ['decimate','no-decimate','refined']}
    allxy=np.concatenate([m['vertices'][:,:2] for m in models.values()]);origin=allxy.min(axis=0)-.02;size=np.ceil((allxy.max(axis=0)-origin+.02)/pitch).astype(int)
    masks={}
    for label,m in models.items():
        pts=np.round((m['vertices'][:,:2]-origin)/pitch).astype(np.int32)
        mask=np.zeros((size[1],size[0]),dtype=np.uint8)
        for f in m['faces']:cv2.fillConvexPoly(mask,pts[f],1)
        masks[label]=mask
    old=masks['decimate'];new=masks['refined'];no=masks['no-decimate']
    boundaries={}
    for label,mask in masks.items():
        contours,_=cv2.findContours(mask,cv2.RETR_LIST,cv2.CHAIN_APPROX_NONE)
        line=np.ones_like(mask)
        cv2.drawContours(line,contours,-1,0,1)
        boundaries[label]=(line==0)
    d_old=cv2.distanceTransform((~boundaries['decimate']).astype(np.uint8),cv2.DIST_L2,5)
    d_new=cv2.distanceTransform((~boundaries['refined']).astype(np.uint8),cv2.DIST_L2,5)
    a=d_old[boundaries['refined']]*pitch/.014;b=d_new[boundaries['decimate']]*pitch/.014
    distance=np.concatenate([a,b])
    row={'name':item['mesh'],'refined_vs_before_iou':float(np.sum(old&new)/np.sum(old|new)),
        'decimate_vs_disabled_iou':float(np.sum(old&no)/np.sum(old|no)),
        'boundary_delta_reference_pixels':{'median':float(np.median(distance)),'p99':float(np.percentile(distance,99)),'max':float(distance.max())}}
    assert row['boundary_delta_reference_pixels']['p99']<1.25,row
    assert row['boundary_delta_reference_pixels']['max']<8,row
    assert row['refined_vs_before_iou']>.78,row
    f=models['refined']['faces'];v=models['refined']['vertices'];normal=models['refined']['normals']
    assert np.isfinite(v).all() and np.isfinite(normal).all()
    assert np.max(np.abs(np.linalg.norm(normal,axis=1)-1))<1e-5
    edges=np.sort(np.concatenate([f[:,[0,1]],f[:,[1,2]],f[:,[2,0]]]),axis=1)
    _,counts=np.unique(edges,axis=0,return_counts=True);assert np.all(counts==2),item['mesh']
    report.append(row);print(row,flush=True)
(OUT/'silhouette-validation.json').write_text(json.dumps(report,indent=2))
