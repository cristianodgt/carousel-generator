import { NextResponse } from "next/server";
import sharp from "sharp";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    // Convert any image format to JPEG using Sharp
    const jpegBuffer = await sharp(buffer)
      .jpeg({ quality: 95 })
      .resize(2048, 2048, { fit: "inside", withoutEnlargement: true })
      .toBuffer();

    const base64 = jpegBuffer.toString("base64");

    return NextResponse.json({
      base64,
      mimeType: "image/jpeg",
      filename: file.name.replace(/\.[^.]+$/, ".jpg"),
    });
  } catch (error) {
    console.error("Image conversion error:", error);
    return NextResponse.json(
      { error: "Failed to convert image" },
      { status: 500 }
    );
  }
}
