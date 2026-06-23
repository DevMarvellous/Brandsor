import { NextResponse } from "next/server";
import { generateBrandNames, GeminiThrottledError } from "@/lib/gemini";
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

// Trim/lowercase/collapse whitespace so near-duplicate inputs ("Coffee shop "
// vs "coffee shop") hit the same cache entry instead of issuing a fresh call.
function normalizeForKey(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

class UpstreamGenerationError extends Error {}

/** Shares one upstream call across concurrent identical requests — two users
 *  submitting the same idea at the same moment burn one Gemini slot, not two. */
const inFlight = new Map<string, Promise<{ items: unknown[] }>>();

async function generateWithRetry(
  idea: string,
  industry: string,
  tone: string
): Promise<{ items: unknown[] }> {
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
        return { items: parsedArray };
      }
      throw new Error("Invalid format from AI. Result was not an array.");
    } catch (err) {
      if (err instanceof GeminiThrottledError) throw err;
      attempts++;
      if (attempts >= 2) {
        console.error("API Error generating names after retries");
        throw new UpstreamGenerationError("Failed to generate names after retries");
      }
    }
  }
  throw new UpstreamGenerationError("Failed to generate names after retries");
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

    const cacheKey = `${normalizeForKey(idea)}-${normalizeForKey(industry)}-${normalizeForKey(tone)}`;
    const now = Date.now();
    const cached = requestCache.get(cacheKey);
    if (cached && now - cached.time < CACHE_TTL_MS) {
      return NextResponse.json(cached.data);
    }

    let promise = inFlight.get(cacheKey);
    if (!promise) {
      promise = generateWithRetry(idea, industry, tone);
      inFlight.set(cacheKey, promise);
      // Drop from the in-flight map once settled. The trailing .catch swallows
      // THIS bookkeeping chain's copy of any rejection so it can't surface as an
      // unhandled rejection — which, under Node's default handling, can crash the
      // warm serverless instance and make a later, unrelated request 500. Every
      // caller awaiting `promise` below still receives the real rejection and
      // maps it to a clean 429/502.
      promise.finally(() => inFlight.delete(cacheKey)).catch(() => {});
    }

    const responseData = await promise;
    cacheSet(cacheKey, { time: now, data: responseData });
    return NextResponse.json(responseData);
  } catch (error) {
    if (error instanceof GeminiThrottledError) {
      return errorResponse(
        "RATE_LIMITED",
        "Brandsor's AI is at capacity right now. Please try again in a moment.",
        429,
        { "Retry-After": "20" }
      );
    }
    if (error instanceof UpstreamGenerationError) {
      return errorResponse(
        "UPSTREAM_ERROR",
        "Failed to generate names. Please try again.",
        502
      );
    }
    console.error("API Error generating names:", error);
    return errorResponse(
      "INTERNAL_ERROR",
      "Internal Server Error",
      500
    );
  }
}
