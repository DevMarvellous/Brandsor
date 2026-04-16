import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";
import { errorResponse } from "@/lib/apiErrors";
import { parseJsonBody } from "@/lib/parseJsonBody";
import { requiredString, isValidEmail } from "@/lib/apiValidation";

const BODY_MAX_BYTES = 4096;
const MAX_EMAIL = 320;

export async function POST(req: Request) {
  try {
    const parsed = await parseJsonBody<{ email?: unknown }>(req, BODY_MAX_BYTES);
    if (!parsed.ok) return parsed.response;

    const email = requiredString(parsed.data.email, MAX_EMAIL);
    if (!email) {
      return errorResponse(
        "BAD_REQUEST",
        "Email is required.",
        400
      );
    }

    if (!isValidEmail(email)) {
      return errorResponse(
        "BAD_REQUEST",
        "Please provide a valid email address.",
        400
      );
    }

    // Check if email already exists
    const existingDoc = await adminDb
      .collection("waitlist")
      .where("email", "==", email.toLowerCase())
      .limit(1)
      .get();

    if (!existingDoc.empty) {
      return NextResponse.json({ 
        success: true, 
        message: "You're already on the waitlist!",
        exists: true 
      });
    }

    // Add to waitlist
    const docRef = adminDb.collection("waitlist").doc();
    await docRef.set({
      email: email.toLowerCase(),
      createdAt: new Date(),
      ip: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown',
      userAgent: req.headers.get('user-agent') || 'unknown',
    });

    return NextResponse.json({ 
      success: true, 
      message: "Successfully joined the waitlist!",
      exists: false 
    });
  } catch (error) {
    console.error("Error adding to waitlist:", error);
    return errorResponse("INTERNAL_ERROR", "Internal Server Error", 500);
  }
}

export async function GET(req: Request) {
  try {
    // Simple endpoint to view waitlist count (optional)
    const snapshot = await adminDb.collection("waitlist").count().get();
    const count = snapshot.data().count;

    return NextResponse.json({ 
      success: true, 
      count,
      message: `Join ${count}+ people waiting for Brandsor!`
    });
  } catch (error) {
    console.error("Error getting waitlist count:", error);
    return errorResponse("INTERNAL_ERROR", "Internal Server Error", 500);
  }
}
