# Light and dark appearance

The navbar contains a keyboard-accessible Dark mode switch. Light is the default
and uses the clean off-white background requested for the black-chrome presentation. Dark switches the hero to a
restrained star field and gives the navbar/editorial text sufficient contrast.
The booking card stays bright, with its existing controls, validation and states.
The hero logo also responds: dark mode uses lighter gray metallic `abg` and white
`STUDIOS`; light mode restores black chrome and dark `STUDIOS`. The right sculpture,
navbar star, refined geometry and hero composition remain unchanged. Theme changes
update existing material uniforms and select a prefiltered neutral studio fill;
they do not remount the booking form or the 3D renderer, fetch the GLB again, or
allocate new materials. Both reflection maps share the same white studio cards.
Reduced-motion mode redraws immediately when the theme changes. Context recovery
reads the current theme, including preferences restored from local storage.

Devices without WebGL use matching transparent renders: the original light-mode
fallback and `public/brand/abg-logo-dark-mode.webp`, captured from the same refined
model and production renderer at rest. Their alpha silhouettes are identical.

The preference is stored locally under `abg-appearance` as exactly `light` or `dark`.
An inline head initializer applies the saved value before body paint to avoid a
flash of the opposite background. React uses a server-safe external-store snapshot
and the root suppresses only the intentional theme attribute hydration difference.
Storage denial gracefully keeps the switch usable without persistence; storage
events synchronize the preference between tabs. No personal data is stored.

Selectors are namespaced to `data-abg-theme` and the public `.abg-site`, so the
authenticated app's own theme styles are unaffected. Stars have deterministic
positions, no added WebGL context, and cannot intercept input. Existing reduced-
motion styling disables twinkling and switch transitions. There is no splash,
server data, new dependency, permission, tenancy, or database change.

Verify both themes, reload persistence, keyboard control, blocked storage, reduced
motion, mobile navbar fit and retained booking input/3D canvas when toggling.

Validation completed: lint, TypeScript, 35 Vitest tests plus 4 Node script tests,
and production build passed. Local Edge checks covered desktop, 390 px mobile,
reduced motion, unavailable storage, reload persistence, keyboard switching and
preserved booking state, with no JavaScript/hydration errors or overflow. Evidence
and light/dark screenshots are in `docs/verification/appearance/`. Run
`node scripts/verify-appearance.mjs` against the local server to repeat that check.

Logo theme verification is recorded separately under `docs/verification/logo-theme/`.
`node scripts/verify-logo-theme.mjs` checks the same-canvas update, preserved booking
input, persisted dark appearance and matching fallback on desktop/mobile and with
WebGL unavailable. Material tests confirm exact light-mode restoration without
allocating replacement geometry or material instances.
