# Brandsor — Context for Claude

## What this is

Brandsor is pivoting from an AI brand-name generator + waitlist into **"GitHub for brands"** —
every brand gets a repository (logo, palette, typography, tone, guidelines) with **version
control / snapshots** and a **public brand-profile URL** as a portfolio/credibility surface.

Solo founder, ~$0 budget, target run cost <$10/mo. v1 must ship in 60–90 days — no feature
creep before real users touch it.

**ICP (v1):** indie founders and freelance designers who create brand identities repeatedly
(one per side project/client) and want a credible, shareable artifact — not small businesses
(don't care about versioning) and not agencies (needs team collaboration, out of v1). This is
already the generator's existing audience — no audience pivot needed, just extended value.

**Golden path (the one loop that has to work):** sign in → land on the **workspaces hub**
(dashboard) → **"Create Workspace"** (choose "I already have a name" or "Generate with AI") →
workspace (logo, palette, typography, taglines, guidelines) → **Save Snapshot** → toggle public →
share the link. If a new user can't reach a shared public profile in one sitting, v1 has failed
regardless of feature count. (Pre-2026-06-20 this was generator-first — see "Post-pivot
workspace-hub redesign" below for why and what changed.)

**v1 scope IN:**
- Workspaces hub as the signed-in landing page — empty state when you have zero brands, a card
  grid once you have any, a "continue where you left off" highlight once you have 3+
- Brand workspace creation — manually ("I already have a name") or via AI generation; only
  **Name** is required either way. Manual creation starts fully blank; AI-gen pre-fills palette +
  taglines (see AI Brand Starter below)
- **AI Brand Starter** — when creating a brand from a generated name (never on manual creation),
  Gemini drafts a starter palette, a few tagline options, a one-paragraph brand-voice guideline,
  and a typography *recommendation hint* (shown as a badge, selection stays manual) — all
  editable drafts, not final — reuses the existing Gemini integration, kills blank-page friction
- Logo/asset upload (Supabase Storage) — always user-inserted, empty by default, never AI
  (AI logo generation is a future-budget item, not v1)
- Color palette: picker + a handful of presets — **not** a full palette-builder lab
- Typography: ~10 curated Google Font pairings — **not** a full typography manager
  (custom font upload/weights is scope creep for v1)
- Brand taglines/mottos: a list (max 10), user-added or AI-generated, all editable/deletable
  regardless of origin
- Brand guidelines rich text editor (TipTap)
- Version snapshots (save-only, no restore yet) — the moat, though not marketed with that word
  (see redesign section)
- Public brand profile URL, SSR + per-brand OG image — the growth loop
- Dashboard showing all your brands as cards
- Public/private toggle per brand (RLS-enforced)

**v1 scope OUT:** forking/templates, team collaboration, third-party integrations, billing,
analytics, snapshot restore, comments on profiles, custom font uploads, full palette lab.

**The 3 things that determine if this wins:**
1. Versioning has to actually work — it's the moat, not "upload a logo and pick colors."
2. Public profiles need social pull — portfolio credibility + a "Created with Brandsor" growth
   loop + per-brand OG images for link previews.
3. Ship fast. The enemy is feature creep before anyone uses it.

## Where things stand right now (2026-06-21)

v1 is code-complete (see "Build sequence" below) and has been through several rounds of
post-pivot polish — see the dated sections below for the full history. **Nothing from
2026-06-21 has been tested by the founder yet** (create-workspace modal restructure, navbar/
landing-page auth-state fixes, the guidelines bold/italic fix, workspace export, Google account
picker). All of it is implemented and `pnpm build`/`pnpm test` clean, but unverified in an actual
browser — a prior TASKS.md entry briefly and incorrectly claimed one of these was
founder-confirmed; that was wrong and has been corrected. Treat everything dated 2026-06-21 as
**implemented, not verified** until the founder says otherwise. [TASKS.md](TASKS.md) has the live
retest checklist — check it before claiming something works.

## Stack

- **Next.js 14 (App Router)** + TypeScript + Tailwind, deployed on **Vercel**. Brand color is
  the Tailwind `primary` token = warm orange-amber `#F2A900` (updated 2026-06-20 from `#F5B700`
  for a more orange tint; use `bg-primary`/`text-primary`, not a raw hex); the
  `theme-color`/`msapplication-TileColor` metas, the PWA manifest, and the PalettePicker default
  swatch all use `#F2A900` too (unified). Dark mode is `darkMode: 'class'` with a manual
  [ThemeToggle](components/ThemeToggle.tsx) in the navbar; a no-flash inline script in
  [app/layout.tsx](app/layout.tsx) sets `.dark` pre-paint from `localStorage` (falling back to
  OS preference). The public profile (`/b/[slug]`) has no navbar/toggle but still honors the
  saved/OS theme via that script.
- **Supabase** (Postgres + Auth + Storage + RLS) — migrated off Firebase on 2026-06-19.
  - Why: versioning/diffing fits JSONB much better than Firestore subcollections; RLS gives a
    one-line public/private policy; Postgres `UNIQUE` solves slug reservation for free; Firebase
    Storage now forces the Blaze plan (card on file) even at zero usage, Supabase doesn't.
- **Google Gemini** (`gemini-2.5-flash`, `@google/generative-ai`), **free tier**. Note: Google AI
  Studio API keys now have the format `AQ.XXXX...` (changed from the older `AIzaSy...` prefix
  some time before 2026-06-20 — confirmed directly in the AI Studio "API key details" UI, don't
  assume a key is invalid just because it doesn't start with `AIzaSy`). For
  brand-name generation — [lib/gemini.ts](lib/gemini.ts). Free tier is ~10 requests/min
  *shared globally across the one API key, not per-user* (Google has tightened this
  repeatedly through 2026 — check actual quota in AI Studio rather than trust a hardcoded
  number). To avoid leaking raw upstream 429s, every Gemini call site self-throttles via
  `acquireGeminiSlot(bucket, limit)` in lib/gemini.ts — any new Gemini call must go through
  this gate. As of 2026-06-20 this is a **durable, Postgres-backed counter** (migration
  [0004_gemini_rate_limit.sql](supabase/migrations/0004_gemini_rate_limit.sql), `acquire_gemini_slot`
  SQL function, called via `supabaseAdmin.rpc(...)`) — NOT an in-memory variable, because an
  in-memory counter only holds per warm Vercel function instance, not truly globally across
  concurrent instances. There are two independent buckets so anonymous name-generation bursts
  can't starve brand-creation calls: `"names"` (6 RPM) and `"starter"` (2 RPM by default,
  conservatively split out of one 8 RPM ceiling since both buckets share one real Google quota
  pool by default). Setting `GEMINI_API_KEY_STARTER` gives the starter bucket its own dedicated
  key and a full 8 RPM budget — but only yields a truly independent quota pool if that key comes
  from a **separate Google Cloud project**; verify in AI Studio before relying on it, since two
  keys under the same project may still share one pool. The rate-limit check fails OPEN (allows
  the call) if the DB check itself errors — a limiter outage shouldn't take down generation
  entirely. Throttled calls throw `GeminiThrottledError`, which routes should catch and turn into
  a 429 with `Retry-After` (see [app/api/generate-names/route.ts](app/api/generate-names/route.ts)
  for the pattern) — do not retry on this error, retrying just burns more of the shared budget.
  `/api/generate-names` also normalizes its cache key (trim/lowercase/collapse whitespace) and
  de-dupes concurrent identical requests in-flight (one upstream call shared, not one per
  caller) to cut avoidable Gemini calls further.
- **pnpm** package manager.
- **Vitest** for tests (`pnpm test`).
- Brand workspace/profile deps (added in the v1 build): `react-colorful` (palette picker),
  `@tiptap/react` + `@tiptap/starter-kit` + `@tiptap/pm` (guidelines editor), `@tiptap/html`
  (server-side guideline rendering on the public profile), `@tailwindcss/typography` (prose
  styling). Per-brand share images use the **built-in `next/og` `ImageResponse`** — no
  `@vercel/og` package needed on Next 14.

## PWA / installability

Brandsor is an installable PWA (no app stores). [public/manifest.json](public/manifest.json)
(standalone, `start_url: /dashboard`), a conservative service worker
([public/sw.js](public/sw.js)) registered in production by
[components/ServiceWorkerRegister.tsx](components/ServiceWorkerRegister.tsx), and a subtle,
dismissible [components/InstallPrompt.tsx](components/InstallPrompt.tsx) (one-tap install on
Android/desktop via `beforeinstallprompt`; an instructional hint on iOS since Apple blocks
programmatic install). The prompt is suppressed for 7 days after dismissal and hidden on `/b/`
public profiles. The SW never caches `/api/*` or cross-origin (Supabase/Gemini/fonts) so it
can't serve stale or another user's data. App icon is [public/icon.svg](public/icon.svg) (the
0-byte PNG icons are a known asset bug — see TASKS.md). Native desktop (.exe/.dmg via Tauri) is
deliberately deferred until there's usage signal.

## User accounts

- **Usernames** (added 2026-06-20): every signed-in user must set a unique username before using
  the app — enforced by [components/UsernameGate.tsx](components/UsernameGate.tsx), mounted in
  [app/layout.tsx](app/layout.tsx). It checks the caller's own `profiles.username` (RLS already
  allows reading your own row) and renders a **full-screen blocking modal** (can't be dismissed)
  if it's null. Not gated on any specific page — works everywhere because it's mounted once in
  the root layout. Has zero effect on anonymous visitors (only ever checks when a session exists).
  - Storage: `profiles.username` (nullable) + `profiles.username_changed_at`, added in
    [supabase/migrations/0003_usernames.sql](supabase/migrations/0003_usernames.sql). Uniqueness
    is case-insensitive via `create unique index on profiles (lower(username))`.
  - Validation in [lib/usernames.ts](lib/usernames.ts): 3-20 chars, lowercase letters/numbers/
    underscores, reserved-word blocklist. **Not used in any URL** — purely a display identity
    (shown in the navbar), so changing it can never break a link or reference elsewhere; there is
    exactly one copy of the value (the DB row), nothing caches or duplicates it.
  - API: [app/api/profile/username/route.ts](app/api/profile/username/route.ts) — `GET ?u=` for
    live availability checks (debounced from the gate UI), `PATCH { username }` to set/change.
    First-time set is free; changing an existing username is rate-limited to once every
    `USERNAME_CHANGE_COOLDOWN_DAYS` (7) via `username_changed_at` — a no-op casing-only change
    (e.g. `Alice` → `alice`) is exempt from the cooldown. Both the availability check and the
    uniqueness check use `ilike` with the candidate **escaped** (`escapeLike()` in the route) —
    usernames allow `_`, which is a SQL wildcard in `ilike`/`like`, so it must be escaped or
    `john_doe` would falsely match `johnxdoe`.
- **Navbar avatar** (added 2026-06-20): replaced the generic person-icon circle with a
  two-letter initials badge derived from the signed-in user's **Google display name** (e.g.
  "Marvellous Adepoju" → "MA"), via [lib/initials.ts](lib/initials.ts). Deliberately NOT tied to
  the username above. No profile-picture upload — Storage is free-tier and that cost wasn't
  justified for this.
- **Generation is a free demo, capped at 2 tries while signed out** (added 2026-06-20):
  `/api/generate-names` never required auth at the API layer; only the dashboard's client code
  used to block anonymous callers entirely. Now anonymous visitors get
  `ANON_GENERATION_LIMIT` (2) free generations — tracked client-side via
  [lib/anonLimits.ts](lib/anonLimits.ts) (localStorage, a soft conversion nudge, not a security
  boundary — clearing storage resets it, which is fine). On the 3rd attempt,
  [app/dashboard/page.tsx](app/dashboard/page.tsx) shows an inline "sign in to keep going"
  invitation instead of calling the API. Signed-in users are never capped. Saving a name or
  creating a brand still require sign-in regardless (checked independently at those actions,
  unchanged). Usage tracking (`/api/track-generation`) is skipped for anonymous calls since
  there's no account to attribute it to.
  - **Demo placement (marketing decision, 2026-06-20):** the demo is kept understated, not
    headlined — the product is "build & version a brand," not "free name generator." The landing
    ([app/page.tsx](app/page.tsx)) leads with "Start Building" (→ sign-in) and carries one quiet
    secondary link under the hero CTA, "or try generating a few names first" (→ `/dashboard`,
    where the 2-try anon flow lives). No demo UI above that. This was an explicit A/B choice
    (chosen B = small low-key link, over A = full sign-in wall with no landing demo).
  - **Versioning is no longer headlined in public copy (founder's call, 2026-06-20):** the
    landing page ([app/page.tsx](app/page.tsx)) no longer mentions version control anywhere
    (hero, steps, features, structured data) — copy was rewritten in plainer language around
    "build a complete brand identity + share it." The Save Version feature itself still exists in
    the workspace; it's just not marketed. (Internally versioning is still the technical moat per
    the vision above — this is a messaging decision, not a scope cut.)

## Post-pivot workspace-hub redesign (2026-06-20)

Testing surfaced product/UX debt from the old generator+waitlist product, plus a mismatch
between the intended creation flow and what the code actually did. This pass (Stages 1–3 of a
6-stage plan; Stages 4–5 below are still pending, Stage 6/PWA explicitly deferred):

- **Removed the legacy "Saved Names" feature entirely** — nav link, `/saved` page,
  `/api/save-name`, `/api/get-saved`, `/api/delete-name` all deleted. Superseded by "Create Brand
  from This" (you create a workspace, you don't separately "save a name"). The `saved_names`
  table is left as orphaned debt (zero cost, same pattern as orphaned Storage objects).
- **Scrubbed remaining "version"/"GitHub for brands" wording** from user-facing copy: the PWA
  manifest, site meta description, the auth page, the OG-image fallback, and the workspace's
  save buttons/toasts (now "Save Snapshot" / "Snapshot saved ✓" instead of "Save Version" /
  "Version saved"). CLAUDE.md itself still uses "version control"/"snapshots" internally — this
  was a user-facing-copy and product-framing decision, not a rename of the underlying
  `brand_snapshots` table or `/snapshot` API route.
- **Dashboard is now a workspaces hub for signed-in users**, not generator-first: empty state at
  zero brands, a `BrandCard` grid once you have any, a "Continue where you left off" highlight
  once you have 3+. New [components/workspace/CreateWorkspaceChooser.tsx](components/workspace/CreateWorkspaceChooser.tsx)
  branches "I already have a name" (→ `CreateBrandDirect`) vs. "Generate with AI" (→
  `GeneratorForm` → pick a result → "Create Brand from This") instead of always showing both
  forms stacked. Anonymous (signed-out) `/dashboard` is unchanged — still the 2-try demo.
- **`BrandState.tagline` (string) → `taglines` (string array, max 10)** end to end — data model,
  create route, workspace editor (add/remove/edit rows), public profile, OG image.
- **AI Brand Starter now only runs on the AI-generation path** — gated on `idea` being present in
  the create request (only "Create Brand from This" ever supplies one; `CreateBrandDirect` never
  does). Manual creation now produces a fully empty workspace instead of always getting an
  AI-filled palette/guideline.
- **AI Brand Starter prompt extended** to also return a few tagline options and a
  `recommendedTypographyId` — shown as a "Recommended" badge in
  [components/workspace/TypographyPicker.tsx](components/workspace/TypographyPicker.tsx); typography
  selection itself stays manual, this is only a hint.
- **Gemini quota hardening** — see the Stack section above for the durable rate-limiter and
  per-feature bucket details.
- **Stage 0 (DB wipe) is founder-executed**, not run by Claude — see TASKS.md. Confirmed via
  migration FK checks that deleting all `auth.users` rows cascades cleanly through
  profiles/brands/assets/snapshots.
- Stage 4 (mobile responsive audit) and Stage 5 (animation/feel polish) shipped later the same
  day — see "Workspace UX fixes & polish round 2" below for what they covered, since the founder's
  first real test surfaced a fresh round of issues immediately after. Stage 6 (PWA work) is still
  explicitly deferred by the founder, not scoped into either redesign.

## Workspace UX fixes & polish round 2 (2026-06-20)

The founder's first real test pass after the redesign above surfaced a dashboard bug and several
concrete UX requests. Investigation found the "missing workspace" bug was NOT data loss — brand
creation already persists synchronously; the dashboard just wasn't refetching.

- **Dashboard refresh bug — actually fixed 2026-06-21.** The round-2 fix below (re-fetching on
  `window` `focus`/`document.visibilitychange`) turned out to be **insufficient**: the founder's
  test pass still showed new workspaces missing. Root cause — every "back to dashboard" path in
  [app/brands/[id]/page.tsx](app/brands/[id]/page.tsx) uses `router.push("/dashboard")`, same-tab
  client-side navigation, which never fires `focus`/`visibilitychange` (those only fire on actual
  tab/window switches). The real fix is in [next.config.mjs](next.config.mjs):
  `experimental.staleTimes: { dynamic: 0, static: 0 }`, which disables Next's client-side Router
  Cache reuse window so *any* in-app navigation to `/dashboard` re-renders fresh instead of
  reusing a cached instance. The focus/visibilitychange listeners are still in place too (harmless
  belt-and-suspenders for tab-switch cases) but were never the actual fix for the reported bug.
  Separately, fixed a related but distinct issue: the dashboard rendered the "Create your first
  brand workspace" empty state the instant sign-in was confirmed, even before the brands fetch had
  resolved (since `brands` defaults to `[]`) — so it could flash (or dwell, on a slow connection)
  for users who do have workspaces. Added a `brandsLoaded` flag gating the empty-state copy until
  the fetch actually completes; shows the existing skeleton-grid loading pattern in between.
- ~~Dashboard refresh bug fixed~~ (2026-06-20, superseded by the entry above): brands-fetch used
  to run only in a mount-only `useEffect`, fixed by re-fetching on `window` `focus` and
  `document.visibilitychange` in addition to mount. Left as a historical note since it explains
  why those listeners exist in the code even though they weren't the real fix.
- **Leave-without-saving is now a custom 2-step modal** instead of `window.confirm`:
  [components/workspace/UnsavedChangesModal.tsx](components/workspace/UnsavedChangesModal.tsx) —
  "Save" / "Leave without saving", and choosing the latter asks "Are you sure?" before actually
  navigating away. The brand row is never deleted; it just stays at whatever was last saved. (The
  browser's own `beforeunload` warning for tab-close/refresh is unchanged — browsers don't allow a
  custom dialog there.)
- **Lightweight "just save a name" option** —
  [components/workspace/QuickNameSave.tsx](components/workspace/QuickNameSave.tsx), a de-emphasized
  link on the dashboard that expands inline (no navigation) into a one-line idea input + generate
  + save. Reuses `/api/generate-names` and `/api/brands/create` (without an `idea` field, so the AI
  Starter never fires) — saves a normal `brands` row with just name + tagline, no redirect into the
  full editor. Explicitly **not** a revival of the removed Saved Names feature — it's a lighter
  entry point into the same brand model, not a parallel system.
- **Post-creation AI assist** — [components/workspace/AiAssistButton.tsx](components/workspace/AiAssistButton.tsx)
  + [app/api/brands/[id]/assist/route.ts](app/api/brands/[id]/assist/route.ts) +
  `generateBrandAssist()` in [lib/gemini.ts](lib/gemini.ts): a "Generate more with AI" action next
  to taglines, "Other name ideas", and palette inside the workspace editor. Returns a few fresh
  suggestions the founder clicks to *add* — existing entries are never overwritten. Shares the
  existing `"starter"` Gemini rate-limit bucket (the founder's chosen way to cap usage) — no new
  per-brand counter.
- **New field — `BrandState.altNames`** (string array, max 5, in
  [lib/brands.ts](lib/brands.ts)): "Other name ideas," a pure brainstorming list shown in the
  workspace editor with the same add/remove-row pattern as taglines. Never overwrites the real
  `brands.name` — promoting one is a manual retype, no auto-promote button (kept intentionally
  simple; flagged to the founder as an assumption, not yet corrected).
- **Typography picker collapses** once a pairing is selected
  ([components/workspace/TypographyPicker.tsx](components/workspace/TypographyPicker.tsx)) — shows
  just the selected pairing + a "Change" button instead of all 10 full-preview cards at all times.
- **Guidelines bold/italic**: investigated, no bug found in
  [components/workspace/GuidelinesEditor.tsx](components/workspace/GuidelinesEditor.tsx) on static
  review (toolbar wiring, TipTap commands, active-state checks, and `app/globals.css` all checked
  out). Left as-is pending an exact repro from the founder — not guess-fixed.
- **Visual polish**: `border-gray-200` → `border-gray-300` everywhere paired with
  `dark:border-gray-700`/`800` (light-mode section borders were too faint to see); primary color
  `#F5B700` → `#F2A900` (warmer/more orange, per the founder's request) in every hardcoded location
  — see the Stack section above; a new [components/FullScreenLoader.tsx](components/FullScreenLoader.tsx)
  overlay for the brand-creation → redirect transition (previously only had a small in-button
  spinner). Smaller in-context actions (Save, generate, upload) intentionally kept their existing
  inline spinners rather than switching to full-screen treatment.
- No browser/screenshot tool was available this session either, so border/color/spacing changes
  are unverified visually — confirm once testing resumes.

## Create-workspace entry point restructured (2026-06-21)

The founder's next test pass flagged that the two-card `CreateWorkspaceChooser` grid was always
visible on the dashboard (not behind a "+" button as planned), and that the de-emphasized
"Just save a name idea" link read as lumped in with the main workspace-creation area rather than
clearly secondary.

- **Dashboard now shows a single primary "+ Create Workspace" button** (filled, `bg-primary`)
  instead of the always-visible chooser grid. Clicking it opens `CreateWorkspaceChooser` inside a
  centered modal (same overlay vocabulary as `UnsavedChangesModal`/`UsernameGate`:
  `fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm`, inner card
  `max-w-2xl ... rounded-2xl border ... shadow-2xl`, wider than the `max-w-sm` auth modals since
  it has to fit the full generator/manual-create forms). The modal unmounts on close, so
  `CreateWorkspaceChooser`'s internal `"choose" | "manual" | "ai"` mode always resets to
  `"choose"` the next time it opens — no extra `key` prop needed.
- `handleGenerate` in [app/dashboard/page.tsx](app/dashboard/page.tsx) now returns
  `Promise<boolean>` (success/failure) so a `handleGenerateFromModal` wrapper can close the modal
  only on success, revealing the existing results grid underneath where the modal was.
  `handleCreateBrandFromModal` closes the modal immediately since manual creation redirects away
  via `FullScreenLoader` regardless of outcome.
- `QuickNameSave` now renders as its own bordered (not filled) button next to the primary button
  — per the founder's explicit ask, "it should have its own button, but not as MAIN as the
  workspace" — instead of a plain underlined text link. Its expanded panel is `w-full` so it drops
  to its own row under the button pair rather than fighting them for flex space.
- `pnpm build` + `pnpm test` both clean after this change.

## Navbar / landing-page auth-state fixes (2026-06-21)

The founder observed that navigating to `/` while signed in "kinda logs you out," and that the
navbar shows a "Dashboard" link even while already on the dashboard.

- **Root cause of the `/` issue:** [app/page.tsx](app/page.tsx) is a standalone marketing page
  with its **own** hardcoded nav (not the shared [components/Navbar.tsx](components/Navbar.tsx))
  that rendered a "Sign in" link unconditionally on first paint, before the async session check
  resolved — even for a signed-in user who'll be auto-redirected to `/dashboard` a moment later.
  That unconditional "Sign in" flash is what reads as a logout; nothing was actually clearing the
  session. Fixed by gating the "Sign in" link on a new `showSignIn` state that's only set `true`
  once the session check actually resolves to "no session" — a signed-in visitor now sees neither
  "Sign in" nor a flash of the marketing nav before the redirect to `/dashboard` fires; an
  anonymous visitor sees "Sign in" appear within tens of ms (imperceptible) instead of always.
- **Navbar self-links:** [components/Navbar.tsx](components/Navbar.tsx) now reads `usePathname()`
  and hides the "Dashboard" link when already on `/dashboard` and the "Credits" link when already
  on `/credits` (desktop + mobile menu both), instead of always showing every nav link regardless
  of the current page.
- Confirmed via code read that sign-out (`supabase.auth.signOut()`) → sign-in-again
  (`signInWithOAuth` full-page Google redirect) has no app-side friction; Google auto-selecting
  the browser's existing Google account on the OAuth screen is normal Google session behavior
  (separate from Brandsor's own session), not something this app controls or needs to "fix."
  [public/sw.js](public/sw.js) was also re-checked — it's network-first for navigations and never
  caches `/api/*`, so the PWA service worker isn't a source of stale-auth friction either.
- `pnpm build` + `pnpm test` both clean after this change.

## Guidelines editor bold/italic fix (2026-06-21)

The founder's actual repro: bold/italic only "stuck" while holding the mouse button down on the
toolbar button while typing — confirming the suspicion flagged (but not chased) last session.
- **Root cause:** [components/workspace/GuidelinesEditor.tsx](components/workspace/GuidelinesEditor.tsx)
  toolbar buttons only handled `onClick`. With no text selected, `mousedown` on a button outside
  the editor's contenteditable can steal focus/collapse the ProseMirror selection *before* the
  `onClick` handler's `.focus().toggleBold().run()` ever runs — so the "stored mark" for the next
  typed character only survives as long as the selection hasn't been disturbed, i.e. while still
  mid-press. Heading/list buttons didn't show this because those toggle the current block
  immediately (no "stored mark for future typing" involved).
- **Fix:** added `onMouseDown={(e) => e.preventDefault()}` to all five toolbar buttons (Bold,
  Italic, Heading, bullet list, numbered list) to stop that focus-steal before it happens — the
  standard fix for this class of TipTap toolbar bug.
- `pnpm build` clean after this change (no test coverage for this component — pure UI fix).

## Workspace export (PNG + JSON) (2026-06-21)

Founder asked about downloading a workspace as an image or file, and about a custom file format.
Decision: ship the cheap reuse-what-exists version now (PNG card + JSON dump); a real custom
import/export schema is parked on the backlog ([[brandsor-roadmap]] in memory), not built — it
needs schema/versioning design and doesn't serve the v1 golden path.

- **Shared image renderer** — [lib/brandCardImage.tsx](lib/brandCardImage.tsx) extracts the
  1200×630 `next/og` `ImageResponse` JSX that used to live only in
  [app/b/[slug]/opengraph-image.tsx](app/b/[slug]/opengraph-image.tsx) into
  `renderBrandCardImage({ name, tagline, palette })`, so both call sites stay in sync.
- **New authenticated route** — [app/api/brands/[id]/card/route.tsx](app/api/brands/[id]/card/route.tsx)
  (GET, Bearer + ownership check, same 404-not-403 pattern as
  [app/api/brands/[id]/route.ts](app/api/brands/[id]/route.ts)). Exists *because* the public OG
  image route is gated on `is_public` and silently falls back to a generic "Brandsor" placeholder
  for private brands — this route lets an owner download their card before ever making the brand
  public.
- **Workspace UI** — a new "Export" section in
  [app/brands/[id]/page.tsx](app/brands/[id]/page.tsx) (after "Public profile") with two buttons:
  "Download card (PNG)" (fetches the new route with the Bearer token client-side, then triggers a
  `Blob`/`URL.createObjectURL` download — never puts the token in a URL) and "Download data
  (JSON)" (pure client-side `Blob` dump of `{ name, slug, ...state }`, no network call).
- **Google account picker** — also added `queryParams: { prompt: "select_account" }` to
  `signInWithOAuth` in [lib/auth.ts](lib/auth.ts) (separate small ask from the same conversation)
  so Google always shows its account chooser on sign-in instead of silently reusing the last
  session — makes switching Google accounts one click instead of hunting for "use another
  account" inside Google's UI.
- `pnpm build` + `pnpm test` both clean after this change.

## Conventions

**API routes** (`app/api/*/route.ts`) follow one shape:
- Auth via `Authorization: Bearer <supabase access token>` header, verified server-side with
  `getUidFromBearer(req)` ([lib/apiAuth.ts](lib/apiAuth.ts)) → returns the Supabase user id or
  `null`.
- All Postgres access from route handlers goes through `supabaseAdmin`
  ([lib/supabase/admin.ts](lib/supabase/admin.ts)) — the service-role client, bypasses RLS, so
  routes must check ownership/authorization themselves (see
  [app/api/brands/[id]/route.ts](app/api/brands/[id]/route.ts) for the pattern: read the row,
  compare `owner_id`, then act — a missing/not-owned row returns 404, never 403).
- Errors return a consistent envelope via `errorResponse(code, message, status, headers?)`
  ([lib/apiErrors.ts](lib/apiErrors.ts)) → `{ error: { code, message } }`.
- Request bodies are size-capped and validated via
  [lib/parseJsonBody.ts](lib/parseJsonBody.ts) / [lib/apiValidation.ts](lib/apiValidation.ts).
- Per-IP rate limiting via [lib/rateLimit.ts](lib/rateLimit.ts) (in-memory `Map`, resets on cold
  start — fine at current scale, not durable across instances).
- Routes that read the auth header must export `export const dynamic = "force-dynamic"` or
  Next.js logs a dynamic-server-usage warning during static generation.

**Client-side auth/data:**
- `supabase` (anon key) client lives in [lib/supabase/client.ts](lib/supabase/client.ts);
  `getAccessToken()` is the standard way to grab the current session token before calling an
  API route.
- Google sign-in is a **full-page OAuth redirect** ([lib/auth.ts](lib/auth.ts)), not a popup —
  this differs from the old Firebase flow. Session state is read via
  `supabase.auth.getSession()` + `supabase.auth.onAuthStateChange(...)`.
- Never import [lib/supabase/admin.ts](lib/supabase/admin.ts) into client code — service-role
  key bypasses RLS entirely.

**Path alias:** `@/*` → repo root (see [tsconfig.json](tsconfig.json)).

## Brand data model (agreed, not yet built — Phase 2)

Decided: **denormalized**, not normalized subcollections/tables per field. Reasoning: Brandsor's
dominant read paths (dashboard list, public profile render, snapshotting) all want "the whole
brand" in one read; only granular field edits want narrow writes, and Postgres/JSONB
field-scoped updates handle that fine.

- `brands` table: `owner_id uuid references auth.users(id) on delete cascade`, `slug` (UNIQUE,
  reserve via transaction or DB constraint), `is_public`, and a single `state` JSONB column
  holding `taglines` (string array, max 10), `altNames` (string array, max 5 — "Other name ideas,"
  a brainstorming list, never the real `brands.name`), palette, typography, a
  `recommendedTypographyId` hint (AI suggestion only — selection stays manual), guidelines (TipTap
  JSON), and a reference (id) to the current logo asset — never the binary itself.
- `assets`: immutable, content-addressed, stored in Supabase Storage; brands reference asset ids
  so snapshots never duplicate binaries. `brand_id references brands(id) on delete cascade`.
- `brand_snapshots`: a cheap immutable copy of `state` at a point in time — `{ state, created_at,
  label }`. This is what makes versioning actually cheap instead of a multi-table transaction.
  `brand_id references brands(id) on delete cascade`.
- RLS: `is_public OR owner_id = auth.uid()` is the entire public/private toggle.
- Known deferred problem: deleting a brand doesn't garbage-collect its orphaned Storage assets in
  v1 (negligible cost, explicit debt). Row deletes (brand → assets/snapshots) cascade at the DB
  level so this debt is scoped to Storage objects only, not orphaned rows.
- `state` JSONB is validated at the **app layer** (TypeScript types + [lib/brands.ts](lib/brands.ts)),
  not via Postgres CHECK constraints — keeps schema changes to a code deploy instead of a
  migration while the shape is still evolving.

**Public profile URLs:** `/b/[slug]`. Slug is user-editable, defaults to a slugified brand name
with a numeric suffix on collision (`my-brand`, `my-brand-2`, ...). Reserved-word blocklist (must
reject as slugs): `api`, `auth`, `dashboard`, `admin`, `b`, `profile`, `saved`, `settings`,
`_next`, plus anything matching an existing top-level route. A request for a private or
nonexistent slug both render **404**, never 403 — don't leak whether a slug exists.

**Storage:** one bucket, `brand-assets`. Public read, owner-only write (Storage RLS policy keyed
on `owner_id`/path prefix matching `auth.uid()`). Cap ~2MB per file. MIME allowlist: PNG, JPEG,
SVG, WebP. Bucket needs to be created manually in the Supabase dashboard (see TASKS.md).

**OG images:** rendered on-demand per request via the built-in `next/og` `ImageResponse` at
`/b/[slug]/opengraph-image` (Next.js convention) — not pre-generated or stored, so there's nothing
to invalidate when a brand's state changes. The actual 1200×630 JSX template is shared via
`renderBrandCardImage()` in [lib/brandCardImage.tsx](lib/brandCardImage.tsx), also used by the
authenticated `/api/brands/[id]/card` export route (see "Workspace export" below) so a private,
not-yet-public brand can still be downloaded as a card image.

**Operational note:** Supabase free tier has no point-in-time recovery — daily backups only, and
only on paid tiers at all on some plans. Informational for now; revisit if/when real user data
volume makes this matter.

## Build sequence (current plan, replaces the old inherited 10-phase prompt)

1. ✅ Schema + RLS (`brands`, `assets`, `brand_snapshots`) + [lib/brands.ts](lib/brands.ts) —
   migration [supabase/migrations/0002_brands.sql](supabase/migrations/0002_brands.sql).
2. ✅ "Create Brand from This" on generator results (wires the AI Brand Starter call) —
   [app/api/brands/create/route.ts](app/api/brands/create/route.ts), button in
   [components/ResultCard.tsx](components/ResultCard.tsx).
3. ✅ Brand workspace page — logo upload, palette picker, typography picker, TipTap guidelines,
   "Save"/"Save Version" — [app/brands/[id]/page.tsx](app/brands/[id]/page.tsx) +
   [app/api/brands/[id]/](app/api/brands/[id]/) (GET/PATCH, /snapshot, /logo).
4. ✅ Public profile page — SSR + OG image — [app/b/[slug]/page.tsx](app/b/[slug]/page.tsx) +
   [app/b/[slug]/opengraph-image.tsx](app/b/[slug]/opengraph-image.tsx).
5. ✅ Dashboard → brand cards — [app/api/brands/route.ts](app/api/brands/route.ts) (list) +
   [components/BrandCard.tsx](components/BrandCard.tsx); "Your Brands" section in the dashboard.
6. ✅ Nav — the existing **Dashboard** link already routes to the brands hub (the dashboard
   doubles as brand list + generator), so no new nav links were added (avoids clutter).

**v1 build complete (code).** Remaining to go live = the founder's setup in TASKS.md (run
migrations, create the Storage bucket, set env vars) — no further code phases are queued.

**Implementation notes (phases 1–6):**
- Public profile (`/b/[slug]`) reads via [lib/publicBrand.ts](lib/publicBrand.ts) (service-role,
  constrained to `is_public = true`); missing AND private both `notFound()` → 404, never 403.
  Guidelines (TipTap JSON) render server-side via `@tiptap/html` (zero client JS on that page).
- OG images use the built-in `next/og` `ImageResponse` (no `@vercel/og` dep), system font (no
  font fetch), rendered on demand — nothing stored or invalidated.
- The dashboard brands list resolves all logo asset URLs in ONE batched `assets` query, not N.

**Implementation notes (phases 1–3):**
- Brand API routes follow the existing Bearer + `supabaseAdmin` + ownership-check pattern. A
  missing/not-owned brand returns 404, never 403 (don't leak existence).
- `state` JSONB is normalized through `normalizeBrandState()` on every write path.
- Logo binaries upload **client → Supabase Storage directly** (anon key + session; owner-only
  write via the `{uid}/...` path-prefix RLS policy) so bytes never hit a Vercel function;
  `/api/brands/[id]/logo` only registers the resulting `assets` row + repoints `state.logoAssetId`.
- AI Brand Starter is best-effort: one Gemini call via `acquireGeminiSlot()`, and any failure
  (throttle/parse/upstream) degrades to an empty starter — never retried, never blocks creation.
- Typography = curated pairings in [lib/fontPairings.ts](lib/fontPairings.ts); only the families
  in use are loaded via Google Fonts CSS.

## Commands

```
pnpm dev      # local dev server
pnpm build    # production build — run after every phase of work
pnpm test     # vitest run
pnpm lint     # next lint
```

Always run `pnpm build` (and `pnpm test` if touching API routes / lib) before considering a
phase done — catches type errors and Next.js static/dynamic route issues early.

## Environment

See [.env.example](.env.example). Required: `GEMINI_API_KEY`, `NEXT_PUBLIC_SUPABASE_URL`,
`NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`. The Supabase client modules fall
back to placeholder values when env is unset so `pnpm build` never fails on missing secrets —
only real API calls need real credentials.

Founder manages the Supabase project/dashboard/OAuth config themselves — don't run cloud
provisioning tools (Supabase MCP project/org calls) without being asked; just write the code and
SQL migrations and hand off setup steps.

## Working agreements

- Act as startup founder + system software architect: give honest trade-offs and a clear
  recommendation, flag risk, but the founder makes the final call. Don't relitigate decisions
  already made (e.g. build-first over validate-first was an explicit, considered choice).
- No feature creep beyond what the current phase needs. Three similar lines beat a premature
  abstraction.
- Migrations live in [supabase/migrations/](supabase/migrations/), numbered sequentially
  (`0001_init.sql`, `0002_...`). The founder runs them manually in the Supabase SQL editor (no
  CLI/CI wiring yet).
- Outstanding human setup steps belong in [TASKS.md](TASKS.md), not buried in chat — keep it
  current as phases land.
- **When a requirement is ambiguous or not explicitly stated, ask before building** — don't guess
  at product decisions (e.g. UX flow for a new feature, whether something is permanent vs.
  editable). Low-stakes implementation details (validation rules, exact copy) are fine to decide
  and just mention.
- **Keep this file (CLAUDE.md) current after every meaningful change** — it's the recovery point
  if chat history is cleared. Update it in the same turn the change lands, not as a later cleanup
  pass.
