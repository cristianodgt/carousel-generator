import { NextResponse } from "next/server";
import { getGeminiClient, MODELS } from "@/lib/gemini";
import { ANALYSIS_PROMPT } from "@/lib/prompts";

export async function POST(request: Request) {
  try {
    const { images } = await request.json();

    if (!images || images.length === 0) {
      return NextResponse.json({ error: "No images provided" }, { status: 400 });
    }

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ error: "GEMINI_API_KEY not configured" }, { status: 500 });
    }

    const ai = getGeminiClient();

    // SDK expects contents as PartUnion[] - each part is either {text} or {inlineData: {data, mimeType}}
    const parts = [
      ...images.map((img: { base64: string; mimeType: string }) => ({
        inlineData: { mimeType: img.mimeType, data: img.base64 },
      })),
      { text: ANALYSIS_PROMPT },
    ];

    console.log("[analyze] Sending", images.length, "images to Gemini, total parts:", parts.length);

    const response = await ai.models.generateContent({
      model: MODELS.text,
      contents: parts,
    });

    const text = response.text || "";
    console.log("[analyze] Gemini response length:", text.length);
    const cleanJson = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    const analysis = JSON.parse(cleanJson);

    return NextResponse.json({ analysis });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    const stack = error instanceof Error ? error.stack : "";
    console.error("[analyze] Error:", msg);
    console.error("[analyze] Stack:", stack);
    // Check for API-specific error details
    const apiError = error as Record<string, unknown>;
    if (apiError.status) console.error("[analyze] Status:", apiError.status);
    if (apiError.statusText) console.error("[analyze] StatusText:", apiError.statusText);
    if (apiError.errorDetails) console.error("[analyze] Details:", JSON.stringify(apiError.errorDetails));
    return NextResponse.json(
      { error: `Analysis failed: ${msg}` },
      { status: 500 }
    );
  }
}
