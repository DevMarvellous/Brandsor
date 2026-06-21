import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { getUidFromBearer } from "@/lib/apiAuth";
import { errorResponse } from "@/lib/apiErrors";
import { parseJsonBody } from "@/lib/parseJsonBody";
import { requiredString, normalizeOptionalString } from "@/lib/apiValidation";
import { checkRateLimit } from "@/lib/rateLimit";
import {
  buildUniqueSlug,
  normalizeBrandState,
  textToGuidelinesDoc,
  slugify,
} from "@/lib/brands";
import { generateBrandStarter } from "@/lib/gemini";

export const dynamic = "force-dynamic";

const BODY_MAX_BYTES = 8192;
const MAX_NAME = 200;
const MAX_TAGLINE = 500;
const MAX_IDEA = 1000;
const MAX_TONE = 200;
const RATE_WINDOW_MS = 60_000;
const RATE_MAX = 20;

export async function POST(req: Request) {
  try {
    const limited = checkRateLimit(req, "brands-create", RATE_MAX, RATE_WINDOW_MS);
    if (!limited.allowed) {
      return errorResponse(
        "RATE_LIMITED",
        "Too many requests. Please try again later.",
        429,
        { "Retry-After": "60" }
      );
    }

    const uid = await getUidFromBearer(req);
    if (!uid) {
      return errorResponse("UNAUTHORIZED", "Unauthorized", 401);
    }

    const parsed = await parseJsonBody<{
      name?: unknown;
      tagline?: unknown;
      idea?: unknown;
      tone?: unknown;
    }>(req, BODY_MAX_BYTES);
    if (!parsed.ok) return parsed.response;

    const name = requiredString(parsed.data.name, MAX_NAME);
    if (!name) {
      return errorResponse("BAD_REQUEST", "Missing or invalid brand name.", 400);
    }
    const tagline = normalizeOptionalString(parsed.data.tagline, MAX_TAGLINE);
    const idea = normalizeOptionalString(parsed.data.idea, MAX_IDEA);
    const tone = normalizeOptionalString(parsed.data.tone, MAX_TONE);

    // Reserve a unique slug: pull the existing collisions for this base, then let
    // buildUniqueSlug pick a free, non-reserved variant.
    const base = slugify(name) || "brand";
    const { data: existing, error: slugErr } = await supabaseAdmin
      .from("brands")
      .select("slug")
      .ilike("slug", `${base}%`);
    if (slugErr) throw slugErr;
    const taken = new Set((existing ?? []).map((r: { slug: string }) => r.slug));
    let slug = buildUniqueSlug(name, taken);

    // Best-effort AI Brand Starter: runs only when created from AI generation
    // (when `idea` is present). Any failure (throttle, parse error, upstream)
    // degrades to an empty starter — the brand is still created. We do NOT retry;
    // that would just burn shared quota.
    let starterApplied = false;
    let palette: { name?: string; hex: string }[] = [];
    let taglines: string[] = [];
    let guidelines: unknown = null;
    let recommendedTypographyId: string | undefined;
    if (idea) {
      try {
        const starter = await generateBrandStarter(name, idea, tone);
        palette = starter.palette;
        taglines = starter.taglines ?? [];
        guidelines = textToGuidelinesDoc(starter.guidelineText);
        recommendedTypographyId = starter.recommendedTypographyId;
        starterApplied = true;
      } catch (err) {
        console.warn("AI Brand Starter skipped:", (err as Error)?.name || err);
      }
    }

    // User-supplied tagline (from direct creation or manual override) takes
    // precedence; if also AI-generated taglines exist, they're ignored.
    const state = normalizeBrandState({
      taglines: tagline ? [tagline] : taglines,
      palette,
      typography: null,
      recommendedTypographyId,
      guidelines,
      logoAssetId: null,
    });

    // Insert; on the rare slug race (unique violation) retry once with a suffix.
    let insert = await supabaseAdmin
      .from("brands")
      .insert({ owner_id: uid, slug, name, is_public: false, state })
      .select("id, slug")
      .single();

    if (insert.error?.code === "23505") {
      slug = `${slug}-${Math.floor(1000 + Math.random() * 9000)}`;
      insert = await supabaseAdmin
        .from("brands")
        .insert({ owner_id: uid, slug, name, is_public: false, state })
        .select("id, slug")
        .single();
    }
    if (insert.error) throw insert.error;

    return NextResponse.json({
      id: insert.data.id,
      slug: insert.data.slug,
      starterApplied,
    });
  } catch (error) {
    console.error("Error creating brand:", error);
    return errorResponse("INTERNAL_ERROR", "Internal Server Error", 500);
  }
}
