import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";
import { getUidFromBearer } from "@/lib/apiAuth";
import { errorResponse } from "@/lib/apiErrors";

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return errorResponse("BAD_REQUEST", "Missing document id", 400);
    }

    const uid = await getUidFromBearer(req);
    if (!uid) {
      return errorResponse("UNAUTHORIZED", "Unauthorized", 401);
    }

    const docRef = adminDb.collection("saved_names").doc(id);
    const doc = await docRef.get();

    if (!doc.exists || doc.data()?.userId !== uid) {
      return errorResponse("FORBIDDEN", "Forbidden or not found", 403);
    }

    await docRef.delete();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting name:", error);
    return errorResponse("INTERNAL_ERROR", "Internal Server Error", 500);
  }
}
