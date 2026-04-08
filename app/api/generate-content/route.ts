import { NextResponse } from "next/server";
import { getGeminiClient, MODELS } from "@/lib/gemini";
import { buildContentPrompt } from "@/lib/prompts";
import type { AnalysisResult, CarouselConfig } from "@/lib/types";

export async function POST(request: Request) {
  try {
    const { analysis, config } = (await request.json()) as {
      analysis: AnalysisResult;
      config: CarouselConfig;
    };

    const ai = getGeminiClient();
    const prompt = buildContentPrompt(analysis, config);

    const response = await ai.models.generateContent({
      model: MODELS.text,
      contents: prompt,
    });

    const text = response.text || "";
    const cleanJson = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    const slides = JSON.parse(cleanJson);

    return NextResponse.json({ slides });
  } catch (error) {
    console.error("Content generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate content" },
      { status: 500 }
    );
  }
}
