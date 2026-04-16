import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";
import { getUidFromBearer } from "@/lib/apiAuth";
import { errorResponse } from "@/lib/apiErrors";
import { parseJsonBody } from "@/lib/parseJsonBody";
import { requiredString } from "@/lib/apiValidation";

const BODY_MAX_BYTES = 8192;
const MAX_NAME = 200;
const MAX_TAGLINE = 500;

export async function POST(req: Request) {
  try {
    const uid = await getUidFromBearer(req);
    if (!uid) {
      return errorResponse("UNAUTHORIZED", "Unauthorized", 401);
    }

    const parsed = await parseJsonBody<{ name?: unknown; tagline?: unknown }>(
      req,
      BODY_MAX_BYTES
    );
    if (!parsed.ok) return parsed.response;

    const name = requiredString(parsed.data.name, MAX_NAME);
    const tagline = requiredString(parsed.data.tagline, MAX_TAGLINE);

    if (!name || !tagline) {
      return errorResponse(
        "BAD_REQUEST",
        "Missing or invalid name or tagline.",
        400
      );
    }

    const docRef = adminDb.collection("saved_names").doc();
    await docRef.set({
      userId: uid,
      name,
      tagline,
      createdAt: new Date(),
    });

    return NextResponse.json({ success: true, id: docRef.id });
  } catch (error) {
    console.error("Error saving name:", error);
    return errorResponse("INTERNAL_ERROR", "Internal Server Error", 500);
  }
}
