# Original Blender composition in black chrome

The hero uses the existing `public/brand/abg-logo.glb` and editable source
`design/brand/abg-logo.blend`. Neither file is changed. The 20 exported objects
retain every vertex, counter, flourish, overlap, spacing and local transform.
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

## Existing export limitation

The supplied chrome mesh was sampled from outlines and retains small surface and
edge irregularities. The high-contrast white reflections make these visible even
in a 1200 px render. Supersampling reduces pixel stair-stepping and the .11
roughness softens highlight boundaries, but fully straightening the remaining
waviness would require changing the geometry. The requested exact model is
preserved. The fallback has fixed reflections; browser lighting changes slowly.
