import { NextResponse } from "next/server";
import sharp from "sharp";

// Deterministic photo enhancement using Sharp
// Does NOT use AI — preserves the person and clothing 100%
export async function POST(request: Request) {
  try {
    const { image, format } = await request.json();

    const width = 1080;
    const height = format === "square" ? 1080 : 1350;

    const imageBuffer = Buffer.from(image, "base64");

    const enhanced = await sharp(imageBuffer)
      .resize(width, height, { fit: "cover", position: "attention" })
      // Subtle professional enhancement
      .modulate({
        brightness: 1.05,    // Slightly brighter
        saturation: 1.15,    // More vivid colors
      })
      .sharpen({ sigma: 1.2, m1: 0.8, m2: 0.3 }) // Light sharpening
      .png({ quality: 95 })
      .toBuffer();

    return NextResponse.json({
      image: enhanced.toString("base64"),
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("[enhance] Error:", msg);
    return NextResponse.json(
      { error: `Enhancement failed: ${msg}` },
      { status: 500 }
    );
  }
}
