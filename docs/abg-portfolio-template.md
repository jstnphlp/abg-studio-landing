# ABG Studios — Portfolio Template

The public homepage at `/` is an editorial studio portfolio with a demo-only booking UI. The original authenticated Next.js/Supabase starter remains in place.

## Chrome hero — browser rendered, no Blender or external library

The ABG Studios hero now uses the lettering traced from the supplied brand reference instead of generic HTML fonts.

- `public/brand/abg-logo-fallback.svg` contains the standalone vector logo. This renders immediately, even without JavaScript or WebGL.
- `public/brand/chrome-logo.js` progressively enhances the logo in WebGL2. It rasterizes the SVG's alpha silhouette into a signed-distance field using a CPU Euclidean distance transform, then ray marches a rounded, extruded 3D shape. Surface normals reflect a procedural studio of softbox and strip lighting that moves subtly with time and pointer position.
- `src/app/page.tsx` mounts the canvas and fallback SVG above the booking card.
- `src/app/portfolio.css` controls framing, transition, responsive sizing, and fallback behavior.

There is no Blender export, texture CDN, Three.js package, subscription, or other external runtime dependency for this effect. All code and artwork are part of this repository.

**Limits:** This is a procedural extrusion and reflective shading of traced, image-derived letter outlines. It is not an artist-sculpted mesh, and cannot promise a pixel-for-pixel match to the earlier AI-generated reference. A clean master SVG from the studio would improve the letter edges.

## Performance and accessibility

- The render surface is capped in pixel dimensions and animation targets a modest frame rate.
- `prefers-reduced-motion` renders one still frame rather than continuous animation.
- The renderer stops work when off-screen or in a background tab.
- If the SVG, WebGL2, or shader fails to initialize, the native SVG logo remains visible.
- The accessible brand text is provided by the containing image role and label.

Before production, visually test WebGL rendering on real Chrome, Firefox, Safari/iOS, and integrated GPUs. This automated environment does not provide WebGL2, so live shader fidelity could not be verified here. The still fallback was inspected in desktop and mobile browser layouts.

## Existing template functionality

Public portfolio sections, placeholder services and concept work, and demo booking remain unchanged. The booking form validates inputs locally but does not store, transmit, reserve, or confirm appointments. Do not treat sample time options as availability.

Authentication, customer management, Supabase migrations, RLS, and starter initialization are unchanged.

## Run and verify

```sh
pnpm install --frozen-lockfile
pnpm dev
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

Visit `http://localhost:3000/` and verify the logo, booking layout, mobile sizing, and reduced-motion fallback.
