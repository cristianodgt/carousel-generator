import { NextResponse } from "next/server";
import sharp from "sharp";

export async function POST(request: Request) {
  try {
    const { image, text, format, brandColors, slideNumber } =
      await request.json();

    const width = 1080;
    const height = format === "square" ? 1080 : 1350;

    // Decode the base64 image
    const imageBuffer = Buffer.from(image, "base64");

    // Resize to exact dimensions
    const resized = await sharp(imageBuffer)
      .resize(width, height, { fit: "cover", position: "center" })
      .png()
      .toBuffer();

    // Create SVG overlay with text
    const primaryColor = brandColors?.[0] || "#FFFFFF";
    const escapedTitle = escapeXml(text.title || "");
    const escapedBody = escapeXml(text.body || "");
    const escapedCta = escapeXml(text.cta || "");

    const gradientHeight = Math.round(height * 0.45);
    const textStartY = height - gradientHeight + 60;

    let svgContent = `
      <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="rgba(0,0,0,0)" />
            <stop offset="40%" stop-color="rgba(0,0,0,0.4)" />
            <stop offset="100%" stop-color="rgba(0,0,0,0.85)" />
          </linearGradient>
        </defs>
        <rect x="0" y="${height - gradientHeight}" width="${width}" height="${gradientHeight}" fill="url(#grad)" />
    `;

    // Title
    if (escapedTitle) {
      svgContent += `
        <text x="${width / 2}" y="${textStartY}" text-anchor="middle"
          font-family="Arial, Helvetica, sans-serif" font-size="48" font-weight="bold"
          fill="white" letter-spacing="1">
          ${wrapText(escapedTitle, 20)}
        </text>
      `;
    }

    // Body
    if (escapedBody) {
      const bodyY = textStartY + (escapedTitle ? 70 : 0);
      svgContent += `
        <text x="${width / 2}" y="${bodyY}" text-anchor="middle"
          font-family="Arial, Helvetica, sans-serif" font-size="28"
          fill="rgba(255,255,255,0.9)">
          ${wrapText(escapedBody, 35)}
        </text>
      `;
    }

    // CTA button
    if (escapedCta) {
      const ctaY = height - 80;
      const ctaWidth = Math.min(escapedCta.length * 22 + 60, width - 100);
      svgContent += `
        <rect x="${(width - ctaWidth) / 2}" y="${ctaY - 30}" width="${ctaWidth}" height="50" rx="25"
          fill="${primaryColor}" />
        <text x="${width / 2}" y="${ctaY + 5}" text-anchor="middle"
          font-family="Arial, Helvetica, sans-serif" font-size="24" font-weight="bold"
          fill="white">
          ${escapedCta}
        </text>
      `;
    }

    // Slide number indicator
    svgContent += `
      <text x="${width - 40}" y="50" text-anchor="end"
        font-family="Arial, Helvetica, sans-serif" font-size="20" font-weight="bold"
        fill="rgba(255,255,255,0.7)">
        ${slideNumber}
      </text>
    `;

    svgContent += `</svg>`;

    const svgBuffer = Buffer.from(svgContent);

    // Composite SVG over image
    const composed = await sharp(resized)
      .composite([{ input: svgBuffer, top: 0, left: 0 }])
      .png()
      .toBuffer();

    const composedBase64 = composed.toString("base64");

    return NextResponse.json({ composedImage: composedBase64 });
  } catch (error) {
    console.error("Compose error:", error);
    return NextResponse.json(
      { error: "Failed to compose image" },
      { status: 500 }
    );
  }
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function wrapText(text: string, maxCharsPerLine: number): string {
  const words = text.split(" ");
  const lines: string[] = [];
  let currentLine = "";

  for (const word of words) {
    if ((currentLine + " " + word).trim().length > maxCharsPerLine) {
      if (currentLine) lines.push(currentLine.trim());
      currentLine = word;
    } else {
      currentLine = (currentLine + " " + word).trim();
    }
  }
  if (currentLine) lines.push(currentLine.trim());

  return lines
    .map((line, i) => `<tspan x="540" dy="${i === 0 ? 0 : '1.3em'}">${line}</tspan>`)
    .join("");
}
