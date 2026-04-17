import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";
import { errorResponse } from "@/lib/apiErrors";
import { parseJsonBody } from "@/lib/parseJsonBody";
import { requiredString, isValidEmail } from "@/lib/apiValidation";
import { checkRateLimit } from "@/lib/rateLimit";

const BODY_MAX_BYTES = 16_384;
const RATE_WINDOW_MS = 60 * 60 * 1000;
const RATE_MAX = 10;

const MAX_NAME = 120;
const MAX_EMAIL = 254;
const MAX_MESSAGE = 5000;

export async function POST(req: Request) {
  try {
    const limited = checkRateLimit(req, "feedback", RATE_MAX, RATE_WINDOW_MS);
    if (!limited.allowed) {
      return errorResponse(
        "RATE_LIMITED",
        "Too many feedback submissions. Please try again later.",
        429,
        { "Retry-After": "3600" }
      );
    }

    const parsed = await parseJsonBody<{
      name?: unknown;
      email?: unknown;
      message?: unknown;
    }>(req, BODY_MAX_BYTES);
    if (!parsed.ok) return parsed.response;

    const name = requiredString(parsed.data.name, MAX_NAME);
    const email = requiredString(parsed.data.email, MAX_EMAIL);
    const message = requiredString(parsed.data.message, MAX_MESSAGE);

    if (!name || !email || !message) {
      return errorResponse(
        "BAD_REQUEST",
        "Missing or invalid fields. Check lengths and formats.",
        400
      );
    }

    if (!isValidEmail(email)) {
      return errorResponse("BAD_REQUEST", "Invalid email address.", 400);
    }

    const docRef = adminDb.collection("feedback").doc();
    await docRef.set({
      name,
      email,
      message,
      createdAt: new Date(),
    });

    return NextResponse.json({ success: true, id: docRef.id });
  } catch (error) {
    console.error("Error saving feedback:", error);
    return errorResponse("INTERNAL_ERROR", "Internal Server Error", 500);
  }
}
