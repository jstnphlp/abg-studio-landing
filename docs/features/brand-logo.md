# Original Blender composition in black chrome

The hero uses the existing `public/brand/abg-logo.glb` and editable source
`design/brand/abg-logo.blend`, which remains unchanged as the approved backup.
The production GLB now comes from the separate `design/brand/abg-logo-refined.blend`.
Only the five lowercase chrome surfaces have refined tessellation; all 20 objects
retain their placement, and the other fifteen retain identical geometry. Original
Bezier boundaries preserve the lettering, counters, flourishes and overlaps.
The previous runtime relief scaling and white-trim shifts have been removed.
Only the root glTF orientation correction, centering, camera presentation and
instance materials are applied. No font, tracing, SVG wordmark or remodeling.

`lib/black-chrome.ts` clones the hierarchy and changes instance materials only.
Chrome lowercase lettering uses neutral linear RGB .13, metallic 1 and roughness
.11. Uppercase lettering is near-black glossy metal, while the existing white
trim keeps its original geometry and material separation. No source material is
mutated. White rectangular reflection cards in a nearly black studio are baked
into a transparent-scene PMREM environment; this creates real white reflections
across the original beveled surfaces rather than painted outlines or glow.

The camera keeps an orthographic front view and fills the left hero region. The
light hero is now clean off-white; the existing theme switch retains its dark
star-field choice. The 40/60 desktop split, right chrome sculpture, booking flow,
navbar star, editorial text, and remaining sections are preserved.

The existing theme switch changes the logo appearance in place. Dark mode uses
linear .42 neutral gray for the metallic lowercase and off-white `STUDIOS` with
neutral studio fill; light mode restores the black-chrome settings above. Source
geometry, object placement, white trim and material instances are retained. A
matching dark-mode WebP supports the same static fallback behavior. See
[appearance notes](appearance.md) and `docs/verification/logo-theme/`.

Slow environment rotation shifts studio reflections. Gentle pointer tilt stays
under a few degrees. Rendering pauses offscreen or in background tabs, and reduced
motion draws only on demand. Save-Data disables idle animation. A minimum 2x
pixel ratio, capped at 2.5x, improves thin-highlight coverage on 1x screens.

`public/brand/abg-logo-black-chrome.webp` is a transparent 1200 x 808 static capture
of the exact same browser scene at rest. It displays during initialization and if
WebGL/model loading/context recovery fails. The live canvas hides it only after
rendering. There is no splash, display timer or interaction gate. Cached parsed
geometry is reused across mounts; instance materials, environment targets and
renderer resources are disposed during cleanup.

Verification evidence is in `docs/verification/black-chrome/`: original Blender
inspection, protected file hashes, render comparison, screenshots, fallback alpha
and color metrics, and browser results. The actual-GLB unit test verifies shared
vertex/index buffers and identical local transforms for every object. Browser
checks cover desktop/mobile, moving reflections, offscreen pause, reduced motion,
WebGL failure, model failure, booking navigation, no overflow and JS errors.

## Contour refinement

The latest refinement removes the coarse raster-distance geometry behind the
visible waviness. Decimate-on/off close-ups confirmed that disabling Decimate
alone did not solve it. The five chrome meshes now use the original stored cubic
paths, constrained triangulation, a smooth shallow relief field and custom
recovered normals. No font, raster tracing, lettering redesign, or runtime smoothing
is used. Original cubic control points, object placements, uppercase letters and
white offset geometry remain unchanged.

The source blend is retained byte-for-byte. The refinement copy includes hidden
original sampled meshes for comparison. Production geometry has 238,540 triangles
and a 4,668,664-byte GLB, down from 373,190 triangles and 7,092,200 bytes. The static
WebP has been regenerated from the unchanged Three.js renderer. All five replacement
meshes are closed manifolds with outward winding and unit normals.

See [the refinement report](../verification/logo-refinement/REPORT.md) for cause,
measurements, before/after captures and reproduction. At the subpixel level the
old raster export and the original cubic paths differ: median contour change is
about .35?.45 reference pixels, and 99% stays within about 1.1 pixels. Two narrow
source V-notches, previously filled by the raster grid, are restored at their
original curve coordinates. Very thin hairlines remain limited by display pixel
resolution, but the mesh no longer contains the earlier sampled stair steps.
