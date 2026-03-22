import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY || "";

// FIX 1: Removed invalid second argument
const genAI = new GoogleGenerativeAI(apiKey);

export const generateBrandNames = async (idea: string, industry: string = "", tone: string = "") => {
  if (!apiKey) throw new Error("GEMINI_API_KEY is not configured");

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
