import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { getUidFromBearer } from "@/lib/apiAuth";
import { errorResponse } from "@/lib/apiErrors";
import { normalizeBrandState } from "@/lib/brands";
import { brandAssetPublicUrl } from "@/lib/storage";

export const dynamic = "force-dynamic";

// Dashboard read path: all of the caller's brands, most-recently-updated first,
// trimmed to what a card needs (name, slug, visibility, a palette preview, logo URL).
export async function GET(req: Request) {
  try {
    const uid = await getUidFromBearer(req);
    if (!uid) return errorResponse("UNAUTHORIZED", "Unauthorized", 401);

    const { data: brands, error } = await supabaseAdmin
      .from("brands")
      .select("id, name, slug, is_public, state, updated_at")
      .eq("owner_id", uid)
      .order("updated_at", { ascending: false });
    if (error) throw error;

    const rows = brands ?? [];

    // Batch-resolve logo asset paths in one query rather than N lookups.
    const logoIds = rows
      .map((b) => normalizeBrandState(b.state).logoAssetId)
      .filter((id): id is string => Boolean(id));
    const pathById = new Map<string, string>();
    if (logoIds.length > 0) {
      const { data: assets } = await supabaseAdmin
        .from("assets")
        .select("id, storage_path")
        .in("id", logoIds);
      for (const a of assets ?? []) pathById.set(a.id, a.storage_path);
    }

    const items = rows.map((b) => {
      const state = normalizeBrandState(b.state);
      const path = state.logoAssetId ? pathById.get(state.logoAssetId) : undefined;
      return {
        id: b.id,
        name: b.name,
        slug: b.slug,
        is_public: b.is_public,
        updated_at: b.updated_at,
        palette: state.palette.slice(0, 5),
        logoUrl: path ? brandAssetPublicUrl(path) : null,
      };
    });

    return NextResponse.json({ items });
  } catch (error) {
    console.error("Error listing brands:", error);
    return errorResponse("INTERNAL_ERROR", "Internal Server Error", 500);
  }
}
