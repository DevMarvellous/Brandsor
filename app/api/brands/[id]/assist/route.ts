import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { getUidFromBearer } from "@/lib/apiAuth";
import { errorResponse } from "@/lib/apiErrors";
import { parseJsonBody } from "@/lib/parseJsonBody";
import { generateBrandAssist, GeminiThrottledError, type AssistField } from "@/lib/gemini";
import { normalizeBrandState } from "@/lib/brands";

export const dynamic = "force-dynamic";

const BODY_MAX_BYTES = 256;
const FIELDS: AssistField[] = ["taglines", "altNames", "palette"];

// Generates a few MORE suggestions for one field on an existing brand —
// additive only; the caller (workspace UI) decides what to add, this never
// writes to the brand itself.
export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const uid = await getUidFromBearer(req);
    if (!uid) return errorResponse("UNAUTHORIZED", "Unauthorized", 401);

    const parsed = await parseJsonBody<{ field?: unknown }>(req, BODY_MAX_BYTES);
    if (!parsed.ok) return parsed.response;

    const field = parsed.data.field;
    if (typeof field !== "string" || !FIELDS.includes(field as AssistField)) {
      return errorResponse("BAD_REQUEST", "Invalid field.", 400);
    }

    const { data: brand, error } = await supabaseAdmin
      .from("brands")
      .select("owner_id, name, state")
      .eq("id", params.id)
      .maybeSingle();
    if (error) throw error;
    if (!brand || brand.owner_id !== uid) {
      return errorResponse("BAD_REQUEST", "Not found", 404);
    }

    const state = normalizeBrandState(brand.state);
    const existing =
      field === "palette" ? state.palette.map((c) => c.hex) : state[field as "taglines" | "altNames"];

    const suggestions = await generateBrandAssist(brand.name, field as AssistField, existing);
    return NextResponse.json({ suggestions });
  } catch (err) {
    if (err instanceof GeminiThrottledError) {
      return errorResponse(
        "RATE_LIMITED",
        "Brandsor's AI is at capacity right now. Please try again in a moment.",
        429,
        { "Retry-After": "20" }
      );
    }
    console.error("Error generating brand assist suggestions:", err);
    return errorResponse("INTERNAL_ERROR", "Internal Server Error", 500);
  }
}
