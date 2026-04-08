import { NextResponse } from "next/server";
import { getGeminiClient, MODELS } from "@/lib/gemini";
import { buildCaptionPrompt } from "@/lib/caption-prompts";
import type { AnalysisResult, CarouselConfig } from "@/lib/types";

export async function POST(request: Request) {
  try {
    const { analysis, config, slideContents } = (await request.json()) as {
      analysis: AnalysisResult;
      config: CarouselConfig;
      slideContents: { title: string; body: string }[];
    };

    const ai = getGeminiClient();
    const prompt = buildCaptionPrompt(analysis, config, slideContents);

    const response = await ai.models.generateContent({
      model: MODELS.text,
      contents: prompt,
    });

    const text = response.text || "";
    const cleanJson = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    const caption = JSON.parse(cleanJson);

    return NextResponse.json({ caption });
  } catch (error) {
    console.error("Caption generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate caption" },
      { status: 500 }
    );
  }
}
