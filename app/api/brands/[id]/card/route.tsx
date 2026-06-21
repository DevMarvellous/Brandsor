import { supabaseAdmin } from "@/lib/supabase/admin";
import { getUidFromBearer } from "@/lib/apiAuth";
import { errorResponse } from "@/lib/apiErrors";
import { renderBrandCardImage } from "@/lib/brandCardImage";

export const dynamic = "force-dynamic";

// Authenticated brand-card export — unlike the public OG image at
// /b/[slug]/opengraph-image, this works for private (not-yet-public) brands too,
// since it's gated on ownership rather than `is_public`.
export async function GET(req: Request, { params }: { params: { id: string } }) {
  const uid = await getUidFromBearer(req);
  if (!uid) return errorResponse("UNAUTHORIZED", "Unauthorized", 401);

  const { data: brand, error } = await supabaseAdmin
    .from("brands")
    .select("name, owner_id, state")
    .eq("id", params.id)
    .maybeSingle();
  if (error) return errorResponse("INTERNAL_ERROR", "Internal Server Error", 500);

  // 404 (not 403) for missing or not-owned — don't leak existence.
  if (!brand || brand.owner_id !== uid) {
    return errorResponse("BAD_REQUEST", "Not found", 404);
  }

  return renderBrandCardImage({
    name: brand.name,
    tagline: brand.state?.taglines?.[0] ?? null,
    palette: brand.state?.palette ?? [],
  });
}
