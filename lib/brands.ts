// Brandsor brand data model — types, app-layer `state` validation, and slug helpers.
//
// The `state` JSONB on the `brands` row is validated HERE (not via Postgres CHECK
// constraints) so the shape can evolve with a code deploy instead of a migration.
// Every write path that touches `state` should pass user input through
// `normalizeBrandState()` before persisting. See CLAUDE.md "Brand data model".

import { FONT_PAIRINGS } from "@/lib/fontPairings";

// ============================================================
// Types
// ============================================================

export interface PaletteColor {
  /** Optional human label, e.g. "Primary". */
  name?: string;
  /** Hex string including the leading "#", normalized to lowercase. */
  hex: string;
}

export interface Typography {
  /** Google Font family name for headings. */
  headingFont: string;
  /** Google Font family name for body copy. */
  bodyFont: string;
}

/**
 * The full structured state of a brand. Stored as JSONB on `brands.state`.
 * `guidelines` is a TipTap document (opaque JSON) or null when empty.
 * `logoAssetId` references `assets.id` — never the binary itself.
 */
export interface BrandState {
  taglines: string[];
  /** Alternate name ideas — a brainstorming list, never the real `brands.name`.
   *  Promoting one to the real name is a manual retype, not automatic. */
  altNames: string[];
  palette: PaletteColor[];
  typography: Typography | null;
  /** AI Brand Starter's typography suggestion — a hint shown in the picker, never
   *  auto-applied. References a `FONT_PAIRINGS` id (lib/fontPairings.ts). */
  recommendedTypographyId: string | null;
  guidelines: unknown;
  logoAssetId: string | null;
}

/** A row from the `brands` table. */
export interface Brand {
  id: string;
  owner_id: string;
  slug: string;
  name: string;
  is_public: boolean;
  state: BrandState;
  created_at: string;
  updated_at: string;
}

/** A row from the `brand_snapshots` table. */
export interface BrandSnapshot {
  id: string;
  brand_id: string;
  owner_id: string;
  label: string | null;
  state: BrandState;
  created_at: string;
}

// ============================================================
// State factory + validation
// ============================================================

/** A blank, valid brand state — used as the floor when creating/normalizing. */
export function emptyBrandState(): BrandState {
  return {
    taglines: [],
    altNames: [],
    palette: [],
    typography: null,
    recommendedTypographyId: null,
    guidelines: null,
    logoAssetId: null,
  };
}

const HEX_RE = /^#[0-9a-f]{6}$/;
const MAX_PALETTE_COLORS = 12;
const MAX_TAGLINE = 200;
const MAX_TAGLINES = 10;
const MAX_ALT_NAME = 100;
const MAX_ALT_NAMES = 5;
const MAX_FONT = 100;

function normalizeHex(value: unknown): string | null {
  if (typeof value !== "string") return null;
  let hex = value.trim().toLowerCase();
  if (!hex.startsWith("#")) hex = `#${hex}`;
  // Expand shorthand (#abc -> #aabbcc) before validating.
  if (/^#[0-9a-f]{3}$/.test(hex)) {
    hex = `#${hex[1]}${hex[1]}${hex[2]}${hex[2]}${hex[3]}${hex[3]}`;
  }
  return HEX_RE.test(hex) ? hex : null;
}

function normalizePalette(value: unknown): PaletteColor[] {
  if (!Array.isArray(value)) return [];
  const out: PaletteColor[] = [];
  for (const entry of value) {
    if (out.length >= MAX_PALETTE_COLORS) break;
    if (!entry || typeof entry !== "object") continue;
    const hex = normalizeHex((entry as Record<string, unknown>).hex);
    if (!hex) continue;
    const rawName = (entry as Record<string, unknown>).name;
    const color: PaletteColor = { hex };
    if (typeof rawName === "string" && rawName.trim()) {
      color.name = rawName.trim().slice(0, 60);
    }
    out.push(color);
  }
  return out;
}

function normalizeTaglines(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  const out: string[] = [];
  for (const item of value) {
    if (out.length >= MAX_TAGLINES) break;
    if (typeof item === "string" && item.trim()) {
      out.push(item.trim().slice(0, MAX_TAGLINE));
    }
  }
  return out;
}

function normalizeAltNames(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  const out: string[] = [];
  for (const item of value) {
    if (out.length >= MAX_ALT_NAMES) break;
    if (typeof item === "string" && item.trim()) {
      out.push(item.trim().slice(0, MAX_ALT_NAME));
    }
  }
  return out;
}

const FONT_PAIRING_IDS = new Set(FONT_PAIRINGS.map((p) => p.id));

function normalizeRecommendedTypographyId(value: unknown): string | null {
  return typeof value === "string" && FONT_PAIRING_IDS.has(value) ? value : null;
}

function normalizeTypography(value: unknown): Typography | null {
  if (!value || typeof value !== "object") return null;
  const obj = value as Record<string, unknown>;
  const headingFont =
    typeof obj.headingFont === "string" ? obj.headingFont.trim().slice(0, MAX_FONT) : "";
  const bodyFont =
    typeof obj.bodyFont === "string" ? obj.bodyFont.trim().slice(0, MAX_FONT) : "";
  if (!headingFont && !bodyFont) return null;
  return { headingFont, bodyFont };
}

/**
 * Coerce arbitrary input (client body, AI Brand Starter draft, snapshot blob) into a
 * valid `BrandState`. Drops anything malformed rather than throwing — the floor is
 * always a usable, storable state. `guidelines` is passed through opaquely (TipTap
 * JSON) but capped to objects/null so it can't smuggle in a giant primitive.
 */
export function normalizeBrandState(input: unknown): BrandState {
  const base = emptyBrandState();
  if (!input || typeof input !== "object") return base;
  const obj = input as Record<string, unknown>;

  return {
    taglines: normalizeTaglines(obj.taglines),
    altNames: normalizeAltNames(obj.altNames),
    palette: normalizePalette(obj.palette),
    typography: normalizeTypography(obj.typography),
    recommendedTypographyId: normalizeRecommendedTypographyId(obj.recommendedTypographyId),
    guidelines:
      obj.guidelines && typeof obj.guidelines === "object" ? obj.guidelines : null,
    logoAssetId: typeof obj.logoAssetId === "string" ? obj.logoAssetId : null,
  };
}

/**
 * Wrap plain paragraph text in a minimal TipTap document so an AI Brand Starter
 * guideline (a plain string) can be stored in `state.guidelines` and later opened
 * directly in the TipTap editor. Empty text yields an empty paragraph.
 */
export function textToGuidelinesDoc(text: string): {
  type: "doc";
  content: unknown[];
} {
  const trimmed = text.trim();
  return {
    type: "doc",
    content: [
      {
        type: "paragraph",
        content: trimmed ? [{ type: "text", text: trimmed }] : [],
      },
    ],
  };
}

// ============================================================
// Slugs
// ============================================================

/**
 * Reserved slugs that must never be assigned to a brand. Covers existing top-level
 * routes plus framework/reserved paths. The public profile lives at `/b/[slug]`, so
 * `b` itself is reserved too. Keep in sync with app/ top-level directories.
 */
export const RESERVED_SLUGS = new Set<string>([
  "api",
  "auth",
  "admin",
  "b",
  "contact",
  "credits",
  "dashboard",
  "profile",
  "saved",
  "settings",
  "_next",
]);

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const MAX_SLUG = 60;

/** Turn an arbitrary brand name into a candidate slug. Returns "" if nothing usable. */
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, MAX_SLUG)
    .replace(/-+$/g, "");
}

export function isReservedSlug(slug: string): boolean {
  return RESERVED_SLUGS.has(slug);
}

/** A slug is valid if it's well-formed, within length, and not reserved. */
export function isValidSlug(slug: string): boolean {
  if (slug.length < 1 || slug.length > MAX_SLUG) return false;
  if (!SLUG_RE.test(slug)) return false;
  return !isReservedSlug(slug);
}

/**
 * Given a base name and a set of slugs already taken, produce a unique, valid slug.
 * Falls back to "brand" when the name slugifies to nothing, and appends -2, -3, ...
 * on collision (or when the base is reserved).
 */
export function buildUniqueSlug(name: string, taken: Set<string>): string {
  let base = slugify(name);
  if (!base || isReservedSlug(base)) base = base ? `${base}-brand` : "brand";
  base = base.slice(0, MAX_SLUG).replace(/-+$/g, "");

  if (!taken.has(base) && isValidSlug(base)) return base;

  for (let n = 2; ; n++) {
    const suffix = `-${n}`;
    const candidate = `${base.slice(0, MAX_SLUG - suffix.length)}${suffix}`;
    if (!taken.has(candidate) && isValidSlug(candidate)) return candidate;
  }
}
