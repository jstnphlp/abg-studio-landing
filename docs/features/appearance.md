# Light and dark appearance

The navbar contains a keyboard-accessible Dark mode switch. Light is the default
and uses the clean off-white background requested for the black-chrome presentation. Dark switches the hero to a
restrained star field and gives the navbar/editorial text sufficient contrast.
The booking card stays bright, with its existing controls, validation and states.
Chrome materials, the right sculpture, navbar star and hero composition remain
unchanged. Theme changes do not remount the booking form or the 3D renderer.

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

Validation completed: lint, TypeScript, 32 Vitest tests plus 4 Node script tests,
and production build passed. Local Edge checks covered desktop, 390 px mobile,
reduced motion, unavailable storage, reload persistence, keyboard switching and
preserved booking state, with no JavaScript/hydration errors or overflow. Evidence
and light/dark screenshots are in `docs/verification/appearance/`. Run
`node scripts/verify-appearance.mjs` against the local server to repeat that check.
