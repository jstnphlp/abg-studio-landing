# Chrome contour refinement

Baseline: commit `1ccf112`, approved source `design/brand/abg-logo.blend`.
The approved source remains unchanged; working copy: `design/brand/abg-logo-refined.blend`.

## Cause and comparison

The old builder first rasterized the original cubic outlines into a binary mask
at .016 scene-unit pitch, then used a distance transform and marching cubes. The
saved meshes had eight Smooth iterations and a .65 Decimate ratio. Smooth shading
and display supersampling could not remove the baked outline and normal waves.

The original Decimate-enabled and disabled GLBs were rendered through the same
production renderer at 1800 x 1212, reduced motion, identical materials and lights.
Both showed the same ascender waves. Projected silhouette IoU between those two
variants is 99.55–99.94%, confirming decimation is secondary to sampling.
[Decimation comparison](decimation-comparison.png).

## Correction

The five existing source curves supply the boundaries directly. Adaptive cubic
subdivision has a .00004 scene-unit conservative chord-error limit and .012 maximum
segment length. Original handles, anchor positions and counters are not edited.
Constrained Delaunay triangles retain every boundary segment. A finite-element
torsion field supplies smooth shallow relief without distance-field medial ridges;
maximum depth is retained separately for each object. Recovered gradients give
smooth surface normals without modifying the boundary or averaging away terminals.

Interior rim-to-rim chords are split so front/back surfaces share only their true
outer and counter rims, producing closed manifold surfaces, including thin tips.
No Decimate modifier is used on the new meshes. The other fifteen objects remain
bit-for-bit identical in decoded vertex/index attributes and retain their transforms.
The five replaced objects retain their transforms and original material slots.

The refined blend includes hidden original sampled meshes and the untouched
editable cubic curves. The runtime renderer, material helper, viewport layout,
booking/calendar, navbar and theme implementation are unchanged (protected hashes).

## Evidence

- [a before/after](a-before-after.png)
- [b before/after](b-before-after.png)
- [g before/after](g-before-after.png)
- [Complete refined composition](refined.png)
- [Original modifier inspection](diagnostic.json)
- [Topology and exported-position hashes](topology.json)
- [Curve-error bounds and mesh sizes](refined-metrics.json)
- [Projected silhouette comparisons](silhouette-validation.json)

Before: **373,190 triangles / 7,092,200 bytes**. After: **238,540 triangles /
4,668,664 bytes**. Five closed manifold chrome objects; no non-manifold edges;
positive signed volume and normalized finite normals. The original 20-object
inventory and material split remain intact.

The new boundary follows the original stored curves, rather than the pixel-sized
inflation of the old binary mask. Median contour delta from the old export is
.34–.45 pixels in the original 828 px reference coordinates. The 99th percentile
is .90–1.10 pixels. Two narrow source notches near a's (302,287) and g's (628,346)
were filled by old sampling: their tips differ by up to 5.12 and 7.54 reference
pixels, respectively. These are restored original curve features, not new cuts.
The true cubic chord-error bound is recorded separately from triangulation drift.

## Reproduce

All paths below are relative to the repository root. Offline Python dependencies
and versions are recorded in `refined-build.json`; install numpy, scipy, shapely,
triangle and Pillow if needed. These are asset-build tools, not web dependencies.

1. Blender background: `--python design/brand/refinement/inspect_logo.py`.
2. `python design/brand/refinement/refine.py`.
3. Blender background: `--python design/brand/refinement/export_refined.py`.
4. `python design/brand/refinement/validate.py`.
5. Copy the candidate `docs/verification/logo-refinement/refined.glb` to
   `public/brand/abg-logo.glb` after reviewing the comparison captures.
6. With the local app running, `node scripts/capture-logo-refinement.mjs before no-decimate refined`.
7. `node scripts/capture-logo-fallback.mjs`; encode its transparent PNG to
   `public/brand/abg-logo-black-chrome.webp` with Pillow, WebP quality 94, method 6.

The inspection and refinement scripts bind intermediate data to the approved
blend and curve SHA-256. Export rejects stale input hashes. Intermediate NPZ/GLB
files and logs are ignored by Git and regenerated from the preserved source.
`before.glb` is the baseline GLB from `1ccf112` copied for the diagnostic renders.

The actual-GLB tests validate the shipped positions against the refinement mesh
hashes, normalized normals, triangle/vertex counts, all twenty transforms and all
fifteen unaffected objects. The fallback is the same production browser scene at
rest, retaining black chrome and transparent alpha. Thin hairlines can still be
subpixel at small sizes; no claim of mathematically infinite display resolution.

## Completed checks

- Lint and TypeScript: passed.
- Vitest: 34 tests in 14 files passed; Node script tests: 4 passed (38 total).
- Production build: passed with one worker to limit memory use.
- Production-renderer browser checks: desktop, mobile, reduced motion, moving
  reflections, offscreen pause, WebGL/model-load failure fallback, booking request
  navigation, no horizontal overflow and no JavaScript errors: passed.
- Approved source, renderer, material helper, layout, booking, navigation and theme
  hashes: unchanged. Current asset hashes are recorded in `assets.json`.
- Fallback: 1200 x 808 RGBA WebP, 92,606 bytes; about 77% of opaque pixels are dark
  gray or black, with about 12% bright white highlights. See `fallback-metrics.json`.

Browser screenshots/results are under `browser/`. Original historical verification
captures remain historical; the relevant asset-protection manifests now intentionally
expect the new GLB hash. No Git commit, push or deployment was performed.
