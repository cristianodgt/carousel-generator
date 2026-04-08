// Client-side text overlay composition using Canvas API
// Avoids Vercel serverless font issues (Fontconfig not available)

interface ComposeOptions {
  imageBase64: string;
  text: { title: string; body: string; cta: string };
  format: "square" | "portrait";
  brandColors: string[];
  slideNumber: number;
  totalSlides: number;
}

export async function composeSlideClient(options: ComposeOptions): Promise<string> {
  const { imageBase64, text, format, brandColors, slideNumber, totalSlides } = options;
  const width = 1080;
  const height = format === "square" ? 1080 : 1350;

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d")!;

  // Load and draw the base image
  const img = await loadImage(`data:image/png;base64,${imageBase64}`);
  // Cover the canvas
  const imgRatio = img.width / img.height;
  const canvasRatio = width / height;
  let sx = 0, sy = 0, sw = img.width, sh = img.height;
  if (imgRatio > canvasRatio) {
    sw = img.height * canvasRatio;
    sx = (img.width - sw) / 2;
  } else {
    sh = img.width / canvasRatio;
    sy = (img.height - sh) / 2;
  }
  ctx.drawImage(img, sx, sy, sw, sh, 0, 0, width, height);

  // Draw gradient overlay on bottom 45%
  const gradientHeight = Math.round(height * 0.45);
  const gradient = ctx.createLinearGradient(0, height - gradientHeight, 0, height);
  gradient.addColorStop(0, "rgba(0,0,0,0)");
  gradient.addColorStop(0.4, "rgba(0,0,0,0.4)");
  gradient.addColorStop(1, "rgba(0,0,0,0.85)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, height - gradientHeight, width, gradientHeight);

  const textStartY = height - gradientHeight + 80;
  let currentY = textStartY;

  // Title
  if (text.title) {
    ctx.font = "bold 48px 'Segoe UI', Arial, Helvetica, sans-serif";
    ctx.fillStyle = "white";
    ctx.textAlign = "center";
    ctx.letterSpacing = "1px";
    const titleLines = wrapTextCanvas(ctx, text.title, width - 120);
    for (const line of titleLines) {
      ctx.fillText(line, width / 2, currentY);
      currentY += 58;
    }
    currentY += 10;
  }

  // Body
  if (text.body) {
    ctx.font = "28px 'Segoe UI', Arial, Helvetica, sans-serif";
    ctx.fillStyle = "rgba(255,255,255,0.9)";
    ctx.textAlign = "center";
    const bodyLines = wrapTextCanvas(ctx, text.body, width - 100);
    for (const line of bodyLines) {
      ctx.fillText(line, width / 2, currentY);
      currentY += 36;
    }
    currentY += 15;
  }

  // CTA button
  if (text.cta) {
    const primaryColor = brandColors?.[0] || "#FFFFFF";
    const ctaY = Math.max(currentY + 10, height - 100);
    ctx.font = "bold 24px 'Segoe UI', Arial, Helvetica, sans-serif";
    const ctaWidth = Math.min(ctx.measureText(text.cta).width + 60, width - 100);
    const ctaHeight = 50;

    // Button background
    ctx.fillStyle = primaryColor;
    ctx.beginPath();
    roundRect(ctx, (width - ctaWidth) / 2, ctaY - 30, ctaWidth, ctaHeight, 25);
    ctx.fill();

    // Button text
    ctx.fillStyle = "white";
    ctx.textAlign = "center";
    ctx.fillText(text.cta, width / 2, ctaY + 5);
  }

  // Slide number
  ctx.font = "bold 20px 'Segoe UI', Arial, Helvetica, sans-serif";
  ctx.fillStyle = "rgba(255,255,255,0.7)";
  ctx.textAlign = "center";
  ctx.fillText(`${slideNumber}/${totalSlides}`, width - 50, 45);

  // Export as base64 (without the data:image/png;base64, prefix)
  const dataUrl = canvas.toDataURL("image/png", 1.0);
  return dataUrl.split(",")[1];
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Failed to load image"));
    img.src = src;
  });
}

function wrapTextCanvas(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let currentLine = "";

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    const metrics = ctx.measureText(testLine);
    if (metrics.width > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }
  if (currentLine) lines.push(currentLine);
  return lines;
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
}
