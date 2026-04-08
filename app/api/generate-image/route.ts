import { NextResponse } from "next/server";
import { getGeminiClient, MODELS } from "@/lib/gemini";
import { buildImageGenPrompt } from "@/lib/prompts";

export async function POST(request: Request) {
  try {
    const { prompt, referenceImages, previousSlides, brandColors, format } =
      await request.json();

    const ai = getGeminiClient();
    const imagePrompt = buildImageGenPrompt(prompt, brandColors, format);

    // Build content parts: reference images + previous slides for consistency + prompt
    const parts: Array<{ inlineData: { mimeType: string; data: string } } | { text: string }> = [];

    // Add reference images (original uploads) for context - send all for variety
    if (referenceImages && referenceImages.length > 0) {
      for (const img of referenceImages) {
        parts.push({
          inlineData: { mimeType: img.mimeType, data: img.base64 },
        });
      }
    }

    // Add previous slides for visual consistency
    if (previousSlides && previousSlides.length > 0) {
      for (const prevBase64 of previousSlides.slice(-2)) {
        parts.push({
          inlineData: { mimeType: "image/png", data: prevBase64 },
        });
      }
    }

    parts.push({ text: imagePrompt });

    const response = await ai.models.generateContent({
      model: MODELS.imageGen,
      contents: parts,
      config: {
        responseModalities: ["TEXT", "IMAGE"],
      },
    });

    // Extract the generated image from response
    const candidates = response.candidates;
    if (!candidates || candidates.length === 0) {
      throw new Error("No candidates in response");
    }

    const responseParts = candidates[0].content?.parts || [];
    for (const part of responseParts) {
      if (part.inlineData) {
        return NextResponse.json({
          image: part.inlineData.data,
          mimeType: part.inlineData.mimeType,
        });
      }
    }

    throw new Error("No image generated in response");
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("[generate-image] Error:", msg);
    const apiError = error as Record<string, unknown>;
    if (apiError.status) console.error("[generate-image] Status:", apiError.status);
    if (apiError.errorDetails) console.error("[generate-image] Details:", JSON.stringify(apiError.errorDetails));
    return NextResponse.json(
      { error: `Image generation failed: ${msg}` },
      { status: 500 }
    );
  }
}
