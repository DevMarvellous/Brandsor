import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { getUidFromBearer } from "@/lib/apiAuth";
import { errorResponse } from "@/lib/apiErrors";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const uid = await getUidFromBearer(req);
    if (!uid) {
      return errorResponse("UNAUTHORIZED", "Unauthorized", 401);
    }

    // Record usage for analytics only. Generation is no longer gated behind a
    // free-tier paywall — abuse is bounded by the per-IP rate limit on
    // /api/generate-names.
    const { error } = await supabaseAdmin.rpc("increment_generation_count", {
      p_uid: uid,
    });
    if (error) throw error;

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Error tracking generation:", error);
    return errorResponse("INTERNAL_ERROR", "Internal Server Error", 500);
  }
}

export async function GET(req: Request) {
  try {
    const uid = await getUidFromBearer(req);
    if (!uid) {
      return errorResponse("UNAUTHORIZED", "Unauthorized", 401);
    }

    const { data, error } = await supabaseAdmin
      .from("profiles")
      .select("generation_count")
      .eq("id", uid)
      .maybeSingle();
    if (error) throw error;

    return NextResponse.json({ used: data?.generation_count ?? 0 });
  } catch (error) {
    console.error("Error getting generation count:", error);
    return errorResponse("INTERNAL_ERROR", "Internal Server Error", 500);
  }
}
