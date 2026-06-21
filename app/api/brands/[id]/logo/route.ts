import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { getUidFromBearer } from "@/lib/apiAuth";
import { errorResponse } from "@/lib/apiErrors";
import { parseJsonBody } from "@/lib/parseJsonBody";
import {
  ALLOWED_LOGO_MIME,
  MAX_LOGO_BYTES,
  brandAssetPublicUrl,
} from "@/lib/storage";

export const dynamic = "force-dynamic";

const BODY_MAX_BYTES = 2048;

// Registers a logo the client has ALREADY uploaded to Storage (client → Storage
// directly, to keep binaries off Vercel). Creates an immutable `assets` row and
// points the brand's state.logoAssetId at it. We validate the path is owned by the
// caller so a user can't claim someone else's object.
export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const uid = await getUidFromBearer(req);
    if (!uid) return errorResponse("UNAUTHORIZED", "Unauthorized", 401);

    const parsed = await parseJsonBody<{
      storagePath?: unknown;
      mimeType?: unknown;
      sizeBytes?: unknown;
    }>(req, BODY_MAX_BYTES);
    if (!parsed.ok) return parsed.response;

    const storagePath =
      typeof parsed.data.storagePath === "string" ? parsed.data.storagePath : "";
    const mimeType = typeof parsed.data.mimeType === "string" ? parsed.data.mimeType : "";
    const sizeBytes =
      typeof parsed.data.sizeBytes === "number" ? parsed.data.sizeBytes : 0;

    if (!storagePath || !mimeType) {
      return errorResponse("BAD_REQUEST", "Missing logo metadata.", 400);
    }
    if (!ALLOWED_LOGO_MIME.includes(mimeType as (typeof ALLOWED_LOGO_MIME)[number])) {
      return errorResponse("BAD_REQUEST", "Unsupported image type.", 400);
    }
    if (sizeBytes > MAX_LOGO_BYTES) {
      return errorResponse("BAD_REQUEST", "Image is too large (max 2MB).", 400);
    }
    // Path must live under the caller's own prefix: `{uid}/{brandId}/...`
    if (!storagePath.startsWith(`${uid}/${params.id}/`)) {
      return errorResponse("BAD_REQUEST", "Invalid storage path.", 400);
    }

    // Verify the brand exists and is owned by the caller.
    const { data: brand, error: selErr } = await supabaseAdmin
      .from("brands")
      .select("id, owner_id, state")
      .eq("id", params.id)
      .maybeSingle();
    if (selErr) throw selErr;
    if (!brand || brand.owner_id !== uid) {
      return errorResponse("BAD_REQUEST", "Not found", 404);
    }

    const { data: asset, error: insErr } = await supabaseAdmin
      .from("assets")
      .insert({
        brand_id: brand.id,
        owner_id: uid,
        storage_path: storagePath,
        mime_type: mimeType,
        size_bytes: sizeBytes,
      })
      .select("id")
      .single();
    if (insErr) throw insErr;

    // Point the brand's state at the new asset. (Old asset rows stay immutable —
    // snapshots that referenced them keep working.)
    const newState = { ...(brand.state ?? {}), logoAssetId: asset.id };
    const { error: updErr } = await supabaseAdmin
      .from("brands")
      .update({ state: newState })
      .eq("id", brand.id);
    if (updErr) throw updErr;

    return NextResponse.json({
      assetId: asset.id,
      logoUrl: brandAssetPublicUrl(storagePath),
    });
  } catch (error) {
    console.error("Error registering logo:", error);
    return errorResponse("INTERNAL_ERROR", "Internal Server Error", 500);
  }
}
