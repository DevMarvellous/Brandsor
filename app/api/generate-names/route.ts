import { NextResponse } from "next/server";
import { generateBrandNames } from "@/lib/gemini";
import { errorResponse } from "@/lib/apiErrors";
import { parseJsonBody } from "@/lib/parseJsonBody";
import {
  normalizeOptionalString,
  requiredString,
} from "@/lib/apiValidation";
import { checkRateLimit } from "@/lib/rateLimit";

const CACHE_TTL_MS = 5 * 60 * 1000;
const CACHE_MAX_ENTRIES = 200;
const BODY_MAX_BYTES = 32_768;
const RATE_WINDOW_MS = 60_000;
const RATE_MAX = 30;

/** Bounded in-memory cache (evicts oldest keys when full). */
const requestCache = new Map<string, { time: number; data: { items: unknown[] } }>();

function cacheSet(
  key: string,
  entry: { time: number; data: { items: unknown[] } }
) {
  if (requestCache.size >= CACHE_MAX_ENTRIES && !requestCache.has(key)) {
    const oldest = requestCache.keys().next().value;
    if (oldest !== undefined) requestCache.delete(oldest);
  }
  requestCache.set(key, entry);
}

export async function POST(req: Request) {
  try {
    const limited = checkRateLimit(req, "generate-names", RATE_MAX, RATE_WINDOW_MS);
    if (!limited.allowed) {
      return errorResponse(
        "RATE_LIMITED",
        "Too many requests. Please try again later.",
        429,
        { "Retry-After": "60" }
      );
    }

    const parsed = await parseJsonBody<{
      idea?: unknown;
      industry?: unknown;
      tone?: unknown;
    }>(req, BODY_MAX_BYTES);
    if (!parsed.ok) return parsed.response;

    const idea = requiredString(parsed.data.idea, 1000);
    if (!idea) {
      return errorResponse(
        "BAD_REQUEST",
        "Invalid idea: must be a non-empty string up to 1000 characters.",
        400
      );
    }

    const industry = normalizeOptionalString(parsed.data.industry, 200);
    const tone = normalizeOptionalString(parsed.data.tone, 200);

    const cacheKey = `${idea}-${industry}-${tone}`;
    const cached = requestCache.get(cacheKey);
    const now = Date.now();

    if (cached && now - cached.time < CACHE_TTL_MS) {
      return NextResponse.json(cached.data);
    }

    let resultItems: unknown[] | null = null;
    let attempts = 0;
    while (attempts < 2) {
      try {
        const result = await generateBrandNames(idea, industry, tone);

        let parsedArray: unknown[] | null = null;
        if (Array.isArray(result)) {
          parsedArray = result;
        } else if (result && typeof result === "object") {
          const values = Object.values(result);
          for (const val of values) {
            if (Array.isArray(val)) {
              parsedArray = val;
              break;
            }
          }
        }

        if (parsedArray && parsedArray.length > 0) {
          resultItems = parsedArray;
          break;
        }
        throw new Error("Invalid format from AI. Result was not an array.");
      } catch {
        attempts++;
        if (attempts >= 2) {
          console.error("API Error generating names after retries");
          return errorResponse(
            "UPSTREAM_ERROR",
            "Failed to generate names. Please try again.",
            502
          );
        }
      }
    }

    const responseData = { items: resultItems as unknown[] };
    cacheSet(cacheKey, { time: now, data: responseData });

    return NextResponse.json(responseData);
  } catch (error) {
    console.error("API Error generating names:", error);
    return errorResponse(
      "INTERNAL_ERROR",
      "Internal Server Error",
      500
    );
  }
}
