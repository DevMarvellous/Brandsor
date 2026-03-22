import { NextResponse } from "next/server";
import { generateBrandNames } from "@/lib/gemini";

// In-memory simple cache + rate limiting map
// In production, redis or similar should be used
const requestCache = new Map<string, { time: number, data: any }>();
const requestQueue = new Map<string, number>();

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { idea, industry, tone } = body;

    if (!idea || typeof idea !== 'string' || idea.length > 1000) {
      return NextResponse.json({ error: "Invalid idea description length" }, { status: 400 });
    }

    // IP or generic rate limiting logic could be added here
    // Caching identical prompts
    const cacheKey = `${idea}-${industry || ''}-${tone || ''}`;
    const cached = requestCache.get(cacheKey);
    const now = Date.now();
    
    if (cached && (now - cached.time) < 5 * 60 * 1000) {
      // Return cached results
      return NextResponse.json(cached.data);
    }

    // Retry logic
    let resultItems = null;
    let attempts = 0;
    while (attempts < 2) {
      try {
        const result = await generateBrandNames(idea, industry, tone);
        
        let parsedArray = null;
        if (Array.isArray(result)) {
           parsedArray = result;
        } else if (result && typeof result === 'object') {
           // check if it's wrapped in an object like { names: [...] }
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
        } else {
          throw new Error("Invalid format from AI. Result was not an array.");
        }
      } catch (e) {
        attempts++;
        if (attempts >= 2) throw e;
      }
    }

    const responseData = { items: resultItems };

    // Save to cache
    requestCache.set(cacheKey, { time: now, data: responseData });

    return NextResponse.json(responseData);

  } catch (error: any) {
    console.error("API Error generating names:", error);
    return NextResponse.json({ error: "Failed to generate names", details: error.message }, { status: 500 });
  }
}
