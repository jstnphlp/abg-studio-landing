# Booking chrome frame

The existing right hero column contains an absolutely positioned decorative image
behind the booking panel. On desktop this column spans the full hero height. On
stacked tablet/mobile layouts the sculpture stays with the booking region, leaving
the original wordmark and editorial content clear. Three-percent vertical overscan
and right-edge clipping avoid a floating-object or image-rectangle appearance.

The original exported `web/hero-right-chrome.webp` from
`C:/Users/JAC/abg-studios-chrome/assets/chrome/ASSET_HANDOFF.md` is copied unchanged
to `public/chrome/hero-right-chrome.webp` (1200 x 2000 RGBA, about 153 KiB).
Next Image serves it unoptimized to retain the supplied alpha and exact RGB
compression instead of re-encoding the reflections. The original PNG is available
at `abg-studios-chrome/assets/chrome/web/hero-right-chrome.png`; its 1800 x 3000
production master is `assets/chrome/renders/hero-right-chrome.png` in that project.

The delivered GLB is preserved at `public/chrome/hero-right-chrome.glb` for possible
future interaction. It is not imported, preloaded, or rendered. If used later, the
handoff's `web/abg-chrome-studio.hdr` is required for suitable lighting. The secondary
`web/section-chrome-accent.webp` remains in the source asset project and is not
integrated or treated as typography.

The frame uses right-center cover cropping without stretching, is hidden from
assistive technology, and cannot intercept pointer events. A near-opaque bright
panel and explicit stacking keep all calendar/form states legible. The source
wordmark, navbar star, background, headline and booking logic are unchanged. No
new loading gate, splash, dependencies, data, authorization or database changes.

The preview reflections and transparent edges were inspected before integration.
The export intentionally cuts the outer edge and end folds, and thin reflection
streaks soften at small display sizes. This is the handoff's static Cycles view,
without parallax or interactive lighting. The high-resolution PNG is not needed
for this integration; WebP has the same alpha and visually accurate reflections.

Verify 1440, 1280, 768 and 390 px layouts, pointer hit testing, date/name/time/notes/
photo/preview navigation and validation, no horizontal overflow, no splash and no
JavaScript errors. Run project lint, typecheck, tests and production build. Captures
and source-preservation hashes are under `docs/verification/booking-chrome/`.
