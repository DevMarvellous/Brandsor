import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { getUidFromBearer } from "@/lib/apiAuth";
import { errorResponse } from "@/lib/apiErrors";
import { parseJsonBody } from "@/lib/parseJsonBody";
import { requiredString } from "@/lib/apiValidation";
import { normalizeBrandState, isValidSlug, slugify } from "@/lib/brands";
import { brandAssetPublicUrl } from "@/lib/storage";

export const dynamic = "force-dynamic";

const BODY_MAX_BYTES = 64_000; // guidelines (TipTap JSON) can be sizeable
const MAX_NAME = 200;

/** Resolve the public URL of a brand's current logo asset, or null. */
async function resolveLogoUrl(state: { logoAssetId?: string | null }): Promise<string | null> {
  const assetId = state?.logoAssetId;
  if (!assetId) return null;
  const { data } = await supabaseAdmin
    .from("assets")
    .select("storage_path")
    .eq("id", assetId)
    .maybeSingle();
  return data?.storage_path ? brandAssetPublicUrl(data.storage_path) : null;
}

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const uid = await getUidFromBearer(req);
    if (!uid) return errorResponse("UNAUTHORIZED", "Unauthorized", 401);

    const { data: brand, error } = await supabaseAdmin
      .from("brands")
      .select("*")
      .eq("id", params.id)
      .maybeSingle();
    if (error) throw error;

    // 404 (not 403) for missing or not-owned — don't leak existence.
    if (!brand || brand.owner_id !== uid) {
      return errorResponse("BAD_REQUEST", "Not found", 404);
    }

    const logoUrl = await resolveLogoUrl(brand.state);
    const { count: versionCount } = await supabaseAdmin
      .from("brand_snapshots")
      .select("id", { count: "exact", head: true })
      .eq("brand_id", params.id);
    return NextResponse.json({ brand, logoUrl, versionCount: versionCount ?? 0 });
  } catch (error) {
    console.error("Error fetching brand:", error);
    return errorResponse("INTERNAL_ERROR", "Internal Server Error", 500);
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const uid = await getUidFromBearer(req);
    if (!uid) return errorResponse("UNAUTHORIZED", "Unauthorized", 401);

    const parsed = await parseJsonBody<{
      name?: unknown;
      slug?: unknown;
      is_public?: unknown;
      state?: unknown;
    }>(req, BODY_MAX_BYTES);
    if (!parsed.ok) return parsed.response;

    // Verify ownership first.
    const { data: brand, error: selErr } = await supabaseAdmin
      .from("brands")
      .select("id, owner_id, slug")
      .eq("id", params.id)
      .maybeSingle();
    if (selErr) throw selErr;
    if (!brand || brand.owner_id !== uid) {
      return errorResponse("BAD_REQUEST", "Not found", 404);
    }

    const update: Record<string, unknown> = {};

    if (parsed.data.name !== undefined) {
      const name = requiredString(parsed.data.name, MAX_NAME);
      if (!name) return errorResponse("BAD_REQUEST", "Invalid brand name.", 400);
      update.name = name;
    }

    if (parsed.data.is_public !== undefined) {
      if (typeof parsed.data.is_public !== "boolean") {
        return errorResponse("BAD_REQUEST", "is_public must be a boolean.", 400);
      }
      update.is_public = parsed.data.is_public;
    }

    if (parsed.data.state !== undefined) {
      update.state = normalizeBrandState(parsed.data.state);
    }

    if (parsed.data.slug !== undefined) {
      const raw = typeof parsed.data.slug === "string" ? parsed.data.slug.trim().toLowerCase() : "";
      const requested = slugify(raw);
      if (!isValidSlug(requested)) {
        return errorResponse(
          "BAD_REQUEST",
          "That URL is invalid or reserved. Use lowercase letters, numbers, and hyphens.",
          400
        );
      }
      if (requested !== brand.slug) {
        // Ensure uniqueness; if taken, surface a clear conflict rather than silently
        // suffixing a slug the user explicitly typed.
        const { data: clash } = await supabaseAdmin
          .from("brands")
          .select("id")
          .eq("slug", requested)
          .maybeSingle();
        if (clash) {
          return errorResponse("BAD_REQUEST", "That URL is already taken.", 409);
        }
        update.slug = requested;
      }
    }

    if (Object.keys(update).length === 0) {
      return errorResponse("BAD_REQUEST", "Nothing to update.", 400);
    }

    const { data: updated, error: updErr } = await supabaseAdmin
      .from("brands")
      .update(update)
      .eq("id", params.id)
      .select("*")
      .single();
    if (updErr) throw updErr;

    const logoUrl = await resolveLogoUrl(updated.state);
    return NextResponse.json({ brand: updated, logoUrl });
  } catch (error) {
    console.error("Error updating brand:", error);
    return errorResponse("INTERNAL_ERROR", "Internal Server Error", 500);
  }
}
