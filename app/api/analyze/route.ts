import { NextResponse } from "next/server";
import { getGeminiClient, MODELS } from "@/lib/gemini";
import { ANALYSIS_PROMPT } from "@/lib/prompts";

export async function POST(request: Request) {
  try {
    const { images } = await request.json();

    if (!images || images.length === 0) {
      return NextResponse.json({ error: "No images provided" }, { status: 400 });
    }

    const ai = getGeminiClient();

    const contents = [
      ...images.map((img: { base64: string; mimeType: string }) => ({
        inlineData: { mimeType: img.mimeType, data: img.base64 },
      })),
      { text: ANALYSIS_PROMPT },
    ];

    const response = await ai.models.generateContent({
      model: MODELS.text,
      contents,
    });

    const text = response.text || "";
    const cleanJson = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    const analysis = JSON.parse(cleanJson);

    return NextResponse.json({ analysis });
  } catch (error) {
    console.error("Analysis error:", error);
    return NextResponse.json(
      { error: "Failed to analyze images" },
      { status: 500 }
    );
  }
}
