import { GoogleGenerativeAI } from "@google/generative-ai";
import { supabaseAdmin } from "@/lib/supabase/admin";

const apiKey = process.env.GEMINI_API_KEY || "";
// Optional dedicated key for the AI Brand Starter. Falls back to the main key
// when unset (the default — most setups only have one key).
const starterApiKey = process.env.GEMINI_API_KEY_STARTER || apiKey;
const usingDedicatedStarterKey = !!process.env.GEMINI_API_KEY_STARTER;

const genAI = new GoogleGenerativeAI(apiKey);
const starterGenAI = usingDedicatedStarterKey ? new GoogleGenerativeAI(starterApiKey) : genAI;

// Gemini's free tier caps out around 10 requests/minute. When both features
// share one key (no GEMINI_API_KEY_STARTER set — the default), they also share
// that single real quota pool, so their LOCAL self-throttle budgets are split
// out of one conservative 8 RPM ceiling rather than each getting a full 8 (which
// would let combined traffic blow past Google's real cap). `names` gets the
// larger share since it's higher-volume (includes anonymous demo traffic);
// `starter` keeps a small guaranteed reserve so a burst of demo generations
// can't starve the call that matters most for conversion. If
// GEMINI_API_KEY_STARTER is set — ideally from a separate Google Cloud project,
// verify in AI Studio, since two keys under the same project may still share one
// pool — starter gets its own full budget instead.
const NAMES_RPM_LIMIT = 6;
const STARTER_RPM_LIMIT = usingDedicatedStarterKey ? 8 : 2;
const WINDOW_SECONDS = 60;

export class GeminiThrottledError extends Error {
  constructor() {
    super("Gemini global rate limit reached. Try again shortly.");
    this.name = "GeminiThrottledError";
  }
}

/**
 * Atomically check-and-increment a durable, Postgres-backed counter for `bucket`
 * (see supabase/migrations/0004_gemini_rate_limit.sql). Replaces a prior
 * in-memory counter, which only held per warm Vercel function instance — under
 * concurrent traffic spread across multiple instances, the real combined call
 * rate to Google could exceed the intended cap even though each instance thought
 * it was under budget on its own. Fails OPEN (allows the call) if the DB check
 * itself errors — a rate-limiter outage shouldn't take down generation entirely,
 * matching the existing "never block, just skip on failure" pattern used by the
 * AI Brand Starter below.
 */
async function acquireGeminiSlot(bucket: string, limit: number): Promise<boolean> {
  const { data, error } = await supabaseAdmin.rpc("acquire_gemini_slot", {
    p_bucket: bucket,
    p_limit: limit,
    p_window_seconds: WINDOW_SECONDS,
  });
  if (error) {
    console.error("Gemini rate-limit check failed, failing open:", error);
    return true;
  }
  return !!data;
}

export const generateBrandNames = async (idea: string, industry: string = "", tone: string = "") => {
  if (!apiKey) throw new Error("GEMINI_API_KEY is not configured");
  if (!(await acquireGeminiSlot("names", NAMES_RPM_LIMIT))) throw new GeminiThrottledError();

  const model = genAI.getGenerativeModel({
    // FIX 2: Use '-latest' or 'gemini-1.5-flash-002' to avoid 404s
    model: "gemini-2.5-flash",
    generationConfig: {
      temperature: 0.8,
      // FIX 3: Cast to 'any' to stop the TypeScript "known properties" error
      responseMimeType: "application/json",
    } as any
  });

  const prompt = `Return EXACTLY a JSON Array containing 20 objects with fields 'name' and 'tagline'. 
  Names must be short, brandable, pronounceable, and unique.
  
  Business Idea: ${idea}
  Industry: ${industry}
  Tone: ${tone}

  Format: [ { "name": "example", "tagline": "example" }, ... ]`;

  try {
    const result = await model.generateContent(prompt);
    const text = result.response.text();

    // With responseMimeType, Gemini won't use markdown blocks (```json)
    // so we can usually parse the text directly.
    return JSON.parse(text.trim());
  } catch (error: any) {
    console.error("Error generating brand names with Gemini", error);
    throw new Error(error.message || "Failed to generate brand names");
  }
}

// ---------------------------------------------------------------------------
// AI Brand Starter — drafts a starter palette + one-paragraph voice guideline
// when a brand is created from a generated name. ONE Gemini call, on demand
// (only when the user actually creates a brand, not on every name generation),
// so it spends the least possible shared free-tier quota. Goes through its own
// `acquireGeminiSlot("starter", ...)` bucket (see above) so a burst of
// anonymous name-generation traffic can't starve it. Callers should treat
// failure (throttle or otherwise) as "skip the starter" rather than retrying —
// the brand still gets created with an empty state.
// ---------------------------------------------------------------------------

export interface BrandStarter {
  palette: { name?: string; hex: string }[];
  taglines: string[];
  guidelineText: string;
  recommendedTypographyId?: string;
}

export const generateBrandStarter = async (
  name: string,
  idea: string = "",
  tone: string = ""
): Promise<BrandStarter> => {
  if (!starterApiKey) throw new Error("GEMINI_API_KEY is not configured");
  if (!(await acquireGeminiSlot("starter", STARTER_RPM_LIMIT))) throw new GeminiThrottledError();

  const model = starterGenAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    generationConfig: {
      temperature: 0.7,
      responseMimeType: "application/json",
    } as any,
  });

  const typographyOptions =
    "poppins-inter, playfair-inter, montserrat-merriweather, spacegrotesk-inter, " +
    "dmserif-dmsans, fraunces-nunito, archivo-libre, sora-ibmplex, " +
    "bricolage-worksans, lora-sourcesans";

  const prompt = `You are a brand designer. For the brand below, return EXACTLY a JSON object:
{ "palette": [ { "name": "Primary", "hex": "#1a2b3c" } ], "taglines": [ "tagline 1", "tagline 2" ], "guideline": "...", "recommendedTypographyId": "poppins-inter" }

Rules:
- "palette": 4 to 5 cohesive, on-brand colors. Each "hex" MUST be a valid 6-digit hex string with a leading #.
- "taglines": 2-3 short, memorable taglines or mottos for this brand (max 200 chars each).
- "guideline": ONE short paragraph (2-4 sentences) describing the brand's voice and tone.
- "recommendedTypographyId": Pick ONE from this list based on the brand's personality: ${typographyOptions}

Brand name: ${name}
What it is: ${idea}
Desired tone: ${tone}`;

  const result = await model.generateContent(prompt);
  const text = result.response.text();
  const parsed = JSON.parse(text.trim());

  return {
    palette: Array.isArray(parsed?.palette) ? parsed.palette : [],
    taglines: Array.isArray(parsed?.taglines) ? parsed.taglines : [],
    guidelineText: typeof parsed?.guideline === "string" ? parsed.guideline : "",
    recommendedTypographyId: typeof parsed?.recommendedTypographyId === "string" ? parsed.recommendedTypographyId : undefined,
  };
};

// ---------------------------------------------------------------------------
// AI assist — generates a few MORE suggestions for one field on an existing
// brand (taglines, alt-name ideas, or palette colors), on demand, additive
// only (callers add picks to their existing list, never overwrite). Shares
// the "starter" bucket/key above — this is the founder's chosen way to cap
// usage, no separate per-brand counter needed.
// ---------------------------------------------------------------------------

export type AssistField = "taglines" | "altNames" | "palette";

export const generateBrandAssist = async (
  name: string,
  field: AssistField,
  existing: string[]
): Promise<string[] | { name?: string; hex: string }[]> => {
  if (!starterApiKey) throw new Error("GEMINI_API_KEY is not configured");
  if (!(await acquireGeminiSlot("starter", STARTER_RPM_LIMIT))) throw new GeminiThrottledError();

  const model = starterGenAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    generationConfig: { temperature: 0.85, responseMimeType: "application/json" } as any,
  });

  const avoid = existing.length
    ? ` Already have: ${existing.join(", ")}. Don't repeat these or anything too similar.`
    : "";

  if (field === "palette") {
    const prompt = `You are a brand designer. Suggest 4 NEW colors for the brand "${name}" that
would fit alongside its existing palette.${avoid}
Return EXACTLY a JSON array: [ { "name": "Accent", "hex": "#1a2b3c" } ]
Each "hex" MUST be a valid 6-digit hex string with a leading #.`;
    const result = await model.generateContent(prompt);
    const parsed = JSON.parse(result.response.text().trim());
    return Array.isArray(parsed) ? parsed : [];
  }

  const label = field === "taglines" ? "taglines or mottos" : "alternate name ideas";
  const prompt = `You are a brand namer. Suggest 4 NEW ${label} for the brand "${name}".${avoid}
Return EXACTLY a JSON array of strings: ["idea 1", "idea 2", "idea 3", "idea 4"]`;
  const result = await model.generateContent(prompt);
  const parsed = JSON.parse(result.response.text().trim());
  return Array.isArray(parsed) ? parsed.filter((x: unknown): x is string => typeof x === "string") : [];
};
