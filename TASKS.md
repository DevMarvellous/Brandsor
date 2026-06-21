# Tasks for the founder

## Supabase setup

- [x] Create a Supabase project
- [x] Run migrations `0001_init.sql`, `0002_brands.sql`, `0003_usernames.sql`
- [x] Storage: `brand-assets` bucket created
- [x] Auth: Google provider enabled, Site URL + redirect URLs set
- [x] Run `supabase/migrations/0004_gemini_rate_limit.sql` (durable Gemini rate limiter, RLS
  enabled with no policies — service role only)
- [x] Copy keys from Project Settings → API into Vercel env vars (incl. `GEMINI_API_KEY_STARTER`)

## Before you test

- [x] **Wipe test data:** deleted via Supabase Dashboard → Authentication → Users. Re-register
  with Google to test from a clean slate.

## Automated + non-auth verification (2026-06-21, Claude pass)

Ran an automated pass + non-auth browser smoke + static review of the unverified 2026-06-21
changes. What's now confirmed (vs. what still needs your Google sign-in to verify):

- [x] `pnpm test` — 32 passed (6 files). `pnpm build` — exit 0, all 20 routes compiled, types
  valid, 10 static pages generated.
- [x] Public profile: `/b/<nonexistent-slug>` returns **404** (not 403/500) — confirmed live.
- [x] Landing `/`, `/dashboard`, `/auth`, `/contact`, `/credits` all return 200 SSR; landing
  meta/title/structured-data present and free of "version" wording.
- [x] Anonymous 2-try demo logic reviewed in [app/dashboard/page.tsx](app/dashboard/page.tsx) +
  [lib/anonLimits.ts](lib/anonLimits.ts): 2 free generations, 3rd attempt blocks the API and
  shows the sign-in nudge. (Logic correct; a live click-through still worth doing in a private
  window.)
- [x] Static review passed for: Navbar self-link hiding, landing `showSignIn` flash fix,
  GuidelinesEditor `onMouseDown` fix (all 5 buttons), Google account picker
  (`prompt: "select_account"`), authed card-export route (Bearer + ownership + 404), and all 3
  Gemini call sites correctly gated through `acquireGeminiSlot`.

⚠️ **OG image + PNG card export can't be tested on Windows local dev.** Both
([app/b/[slug]/opengraph-image.tsx](app/b/[slug]/opengraph-image.tsx) and
[app/api/brands/[id]/card/route.tsx](app/api/brands/[id]/card/route.tsx)) go through
`next/og`'s `ImageResponse`, which fails on Windows dev with `TypeError: Invalid URL` when
loading its own bundled default font (a known `@vercel/og` Windows-dev path bug — not Brandsor
code, and it does NOT affect the Vercel/Linux production build). **Verify both on a Vercel
preview/production deploy**, not locally.

⚠️ Minor: `pnpm lint` has no ESLint config, so `next lint` drops into an interactive setup
prompt and can't run. Type-checking still happens inside `pnpm build` (which passes). Decide
later whether to add an ESLint config — not a blocker.

## Smoke test

- [ ] `pnpm dev` → sign in → land on workspaces hub → "Generate with AI" or "I already have a
  name" → Create Brand → upload logo, set palette/fonts/guidelines/taglines → Save Snapshot →
  make public → open `/b/<slug>` → confirm OG preview in a DM link **(test OG on a deploy, not
  local — see caveat above)**
- [ ] Try the anonymous demo in a private window (2 free generations, then a sign-in prompt)
- [ ] On a phone: check a long display name, many palette colors, and several taglines don't
  break the layout

## Code-complete, awaiting your test pass (as of 2026-06-21)

Everything below is implemented and `pnpm build` + `pnpm test` are clean, but **none of it has
been verified in a real browser yet** — don't treat anything here as confirmed-working until
you've actually clicked through it. Full root-cause detail for each lives in CLAUDE.md (search
for the matching dated section heading) — this is just the test checklist.

From the **2026-06-20 polish round**:
- [ ] Dashboard refresh bug — create a brand, save, navigate back to the dashboard (in-app, not a
  hard refresh) and confirm it shows up without manually reloading.
- [ ] Leaving a workspace with unsaved changes shows "Save / Leave without saving", and choosing
  "Leave" asks "are you sure?" before navigating away.
- [ ] "Just save a name idea" on the dashboard generates + saves a name/tagline without entering
  the full editor.
- [ ] "Generate more with AI" next to taglines / palette / "Other name ideas" in the workspace
  editor adds suggestions without overwriting what's already there.
- [ ] Typography picker collapses to your selection + a "Change" button after you pick one.
- [ ] Visual check: light-mode borders are visible (not too faint), primary color reads as warm
  orange (`#F2A900`), and there's a full-screen loading overlay during brand creation.

From **2026-06-21**:
- [ ] "+ Create Workspace" button opens a modal with both create paths (AI gen / your own name);
  "Just save a name idea" sits next to it as its own smaller bordered button.
- [ ] Visit `/` while signed in (e.g. click the Brandsor logo from the dashboard) — should land
  you on the dashboard without a "Sign in" flash first. Navbar shouldn't show a "Dashboard" link
  while already on the dashboard, or "Credits" while already on Credits.
- [ ] Guidelines editor: click Bold (or Italic) with no text selected, then type — text should
  stay bold/italic as a normal toggle, without needing to keep the mouse pressed. (This was the
  fix for "I have to hold the button down while typing.")
- [ ] In a workspace, try both Export buttons ("Download card (PNG)" and "Download data (JSON)")
  and confirm they download with the right brand data, including for a brand that's still private.
- [ ] Sign out, then sign in again — Google should now always show its account picker instead of
  silently reusing the last session.

## Images (designer)

- [ ] `public/icon-192.png` — 192×192, maskable
- [ ] `public/icon-512.png` — 512×512, maskable
- [ ] `public/og-image.png` — 1200×630
- [ ] `public/og-whatsapp.png` — 400×400
- [ ] Once added, list them in `public/manifest.json` icons array

## Soon

- [ ] Confirm golden path works on production, not just local

## Later

- [ ] Native desktop app via Tauri — not worth it pre-users, PWA install covers desktop for now
- [ ] Revisit generation rate limits if Gemini cost/abuse becomes a signal
- [ ] Pick an email provider (Resend or similar) when real notification emails are needed
