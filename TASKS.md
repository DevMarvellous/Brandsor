# Tasks for the founder

## Smoke test (sign in and click through once)

- [ ] Sign in → workspaces hub → create a brand (AI gen or your own name) → upload logo, set
  palette/fonts/guidelines/taglines → Save Snapshot → make public → open `/b/<slug>` and confirm
  the link-preview image shows up in a DM.
- [ ] Anonymous demo in a private window (2 free generations, then a sign-in prompt).
- [ ] Delete a workspace from both the dashboard card "⋯" menu and the workspace Danger zone, and
  the public / change-link confirmations behave.
- [ ] On a phone: a long display name, many palette colors, and several taglines don't break the
  layout.

## Images (designer)

- [ ] `public/icon-192.png` — 192×192, maskable
- [ ] `public/icon-512.png` — 512×512, maskable
- [ ] `public/og-image.png` — 1200×630
- [ ] `public/og-whatsapp.png` — 400×400
- [ ] Once added, list them in `public/manifest.json` icons array

## Soon

- [ ] Confirm the golden path works on production, not just local

## Later

- [ ] Native desktop app via Tauri — not worth it pre-users, PWA install covers desktop for now
- [ ] Revisit generation rate limits if Gemini cost/abuse becomes a signal
- [ ] Pick an email provider (Resend or similar) when real notification emails are needed
