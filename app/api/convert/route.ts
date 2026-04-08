import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const ext = file.name.toLowerCase().split(".").pop();
    const isHeic = ext === "heic" || ext === "heif" ||
      file.type === "image/heic" || file.type === "image/heif";

    let jpegBuffer: Buffer;

    if (isHeic) {
      // Use heic-convert (pure JS, no native deps - works on Vercel)
      const convert = (await import("heic-convert")).default;
      const result = await convert({
        buffer: buffer,
        format: "JPEG",
        quality: 0.95,
      });
      jpegBuffer = Buffer.from(result);
    } else {
      // For non-HEIC, use Sharp
      const sharp = (await import("sharp")).default;
      jpegBuffer = await sharp(buffer)
        .jpeg({ quality: 95 })
        .resize(2048, 2048, { fit: "inside", withoutEnlargement: true })
        .toBuffer();
    }

    const base64 = jpegBuffer.toString("base64");

    return NextResponse.json({
      base64,
      mimeType: "image/jpeg",
      filename: file.name.replace(/\.[^.]+$/, ".jpg"),
    });
  } catch (error) {
    console.error("Image conversion error:", error);
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { error: `Failed to convert image: ${msg}` },
      { status: 500 }
    );
  }
}
