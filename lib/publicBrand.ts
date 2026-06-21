import "server-only";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { brandAssetPublicUrl } from "@/lib/storage";
import { normalizeBrandState, type BrandState } from "@/lib/brands";

export interface PublicBrand {
  name: string;
  slug: string;
  state: BrandState;
  logoUrl: string | null;
  updatedAt: string;
}

/**
 * Fetch a brand for its public profile. Returns null for a missing OR private
 * brand — callers render BOTH as 404 so a request can't tell whether a slug exists.
 * Read with the service-role client but constrained to `is_public = true`.
 */
export async function getPublicBrand(slug: string): Promise<PublicBrand | null> {
  const { data: brand, error } = await supabaseAdmin
    .from("brands")
    .select("name, slug, state, updated_at")
    .eq("slug", slug)
    .eq("is_public", true)
    .maybeSingle();
  if (error || !brand) return null;

  const state = normalizeBrandState(brand.state);

  let logoUrl: string | null = null;
  if (state.logoAssetId) {
    const { data: asset } = await supabaseAdmin
      .from("assets")
      .select("storage_path")
      .eq("id", state.logoAssetId)
      .maybeSingle();
    if (asset?.storage_path) logoUrl = brandAssetPublicUrl(asset.storage_path);
  }

  return {
    name: brand.name,
    slug: brand.slug,
    state,
    logoUrl,
    updatedAt: brand.updated_at,
  };
}
