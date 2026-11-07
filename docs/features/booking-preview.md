# Sequential booking preview

The public hero presents one step at a time: date, name, preferred time, optional
notes/photos, and request preview. Back and Continue preserve entered values and
attachments. Preview request advances to the final summary inside the card, with
Back to edit. There is no modal or reservation submission.

Each step has a comfortable body area and progress indicator so the logo and
booking card fit a normal desktop viewport. Short screens and phones retain
natural scrolling instead of cropping or shrinking controls.

The existing calendar selects dates in Manila conventions; examples of times do
not imply availability. Dates, names, times and notes use Zod validation. Up to
four JPG, PNG, or WebP photos of at most 5 MB each have local thumbnails and removal
controls. Photos appear in the final step; blob URLs are released on removal or
unmount. Nothing is uploaded, persisted, sent, or reserved. No access, tenancy,
authorization or database changes are involved. Service/email fields are replaced
by this requested sequence.

Verify forward/back navigation, preserved fields/photos, date-first gating,
preview content, photo count/type/size limits, and URL cleanup. Run repository
lint, typecheck, tests and build. Do not run browser/E2E checks by default.
