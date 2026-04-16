import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";
import { getUidFromBearer } from "@/lib/apiAuth";
import { errorResponse } from "@/lib/apiErrors";

const MAX_FREE_GENERATIONS = 3;

export async function POST(req: Request) {
  try {
    const uid = await getUidFromBearer(req);
    if (!uid) {
      return errorResponse("UNAUTHORIZED", "Unauthorized", 401);
    }

    // Get current generation count
    const userDoc = await adminDb.collection("users").doc(uid).get();
    const userData = userDoc.data();
    const currentCount = userData?.generationCount || 0;

    if (currentCount >= MAX_FREE_GENERATIONS) {
      return NextResponse.json({ 
        allowed: false, 
        remaining: 0,
        message: "You've used all your free test generations. Join our waitlist for full access!"
      });
    }

    // Increment generation count
    await adminDb.collection("users").doc(uid).set({
      generationCount: currentCount + 1,
      lastGenerationAt: new Date()
    }, { merge: true });

    return NextResponse.json({ 
      allowed: true, 
      remaining: MAX_FREE_GENERATIONS - (currentCount + 1),
      used: currentCount + 1
    });

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

    const userDoc = await adminDb.collection("users").doc(uid).get();
    const userData = userDoc.data();
    const currentCount = userData?.generationCount || 0;

    return NextResponse.json({ 
      used: currentCount,
      remaining: Math.max(0, MAX_FREE_GENERATIONS - currentCount),
      allowed: currentCount < MAX_FREE_GENERATIONS
    });

  } catch (error) {
    console.error("Error getting generation count:", error);
    return errorResponse("INTERNAL_ERROR", "Internal Server Error", 500);
  }
}
