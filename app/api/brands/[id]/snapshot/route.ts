import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { getUidFromBearer } from "@/lib/apiAuth";
import { errorResponse } from "@/lib/apiErrors";
import { parseJsonBody } from "@/lib/parseJsonBody";
import { normalizeOptionalString } from "@/lib/apiValidation";

export const dynamic = "force-dynamic";

const BODY_MAX_BYTES = 1024;
const MAX_LABEL = 120;

// "Save Version" — copy the brand's CURRENT persisted state into an immutable
// snapshot. This is the moat: a version is a cheap row, not a multi-table transaction.
// The workspace persists edits via PATCH first, so the snapshot captures what's saved.
export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const uid = await getUidFromBearer(req);
    if (!uid) return errorResponse("UNAUTHORIZED", "Unauthorized", 401);

    const parsed = await parseJsonBody<{ label?: unknown }>(req, BODY_MAX_BYTES);
    if (!parsed.ok) return parsed.response;
    const label = normalizeOptionalString(parsed.data.label, MAX_LABEL) || null;

    const { data: brand, error: selErr } = await supabaseAdmin
      .from("brands")
      .select("id, owner_id, state")
      .eq("id", params.id)
      .maybeSingle();
    if (selErr) throw selErr;
    if (!brand || brand.owner_id !== uid) {
      return errorResponse("BAD_REQUEST", "Not found", 404);
    }

    const { data: snapshot, error: insErr } = await supabaseAdmin
      .from("brand_snapshots")
      .insert({
        brand_id: brand.id,
        owner_id: uid,
        label,
        state: brand.state,
      })
      .select("id, label, created_at")
      .single();
    if (insErr) throw insErr;

    return NextResponse.json({ snapshot });
  } catch (error) {
    console.error("Error saving snapshot:", error);
    return errorResponse("INTERNAL_ERROR", "Internal Server Error", 500);
  }
}
