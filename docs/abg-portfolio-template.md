# ABG Studios — Portfolio Template

This branch adds a public editorial ABG Studios portfolio and **demo-only booking interface** to the existing Next.js business-app starter.

## Included
- Public homepage with chrome-inspired lettering, a pale silver ripple hero background, studio introduction, service placeholders, conceptual portfolio pieces, and booking-request preview.
- Responsive split-layout hero (booking card on the right at desktop).
- Editable example content in `src/config/portfolio.ts`.
- A live Blender GLB hero rendered by `src/features/brand/components/hero-logo.tsx`.
- Staff-login link into the unchanged authenticated application.

## Demo limitations
The copy, services, work studies, and booking time choices are illustrative and NOT verified studio offerings or availability. The form validates input and shows a local preview only. It does not save, transmit, confirm, or reserve any appointments. Do not use it for real customer bookings before adding a proper backend, consent/privacy notices, rate limits, and live availability.

## Blender integration
1. Edit the approved source in `design/brand/abg-logo.blend`.
2. Export only the logo objects with modifiers applied to `public/brand/abg-logo.glb`.
3. The client renderer uses orthographic framing and studio reflections. No image or video fallback is included.
4. Verify mobile framing, loading, reduced motion, and performance.

See [the logo feature notes](features/brand-logo.md) for material, motion, and lifecycle details.

## Run and verify
Follow the original README for installation and Supabase setup. The public landing page does not require a logged-in session.

```sh
pnpm install --frozen-lockfile
pnpm dev
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

## Keep the starter reusable
No changes were made to authentication, Supabase migrations, RLS, customer management, scripts, or template initialization. The package retains its original starter identity and setup tools. This is an ABG-specific visual variant, not a replacement of the generic starter for unrelated businesses.
