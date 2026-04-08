import { convertHeicToJpeg } from "./heic-converter";

export function generateId(): string {
  return Math.random().toString(36).substring(2, 15);
}

const OUTPUT_TYPE = "image/jpeg";

function isHeic(file: File): boolean {
  const type = (file.type || "").toLowerCase();
  if (type === "image/heic" || type === "image/heif") return true;
  const ext = file.name.toLowerCase().split(".").pop();
  return ext === "heic" || ext === "heif";
}

export function isImageFile(file: File): boolean {
  if (file.type && file.type.startsWith("image/")) return true;
  const ext = file.name.toLowerCase().split(".").pop();
  const imageExtensions = ["jpg", "jpeg", "png", "webp", "gif", "heic", "heif", "bmp", "tiff", "avif"];
  return imageExtensions.includes(ext || "");
}

function canvasToResult(
  blob: Blob,
  fileName: string,
  maxDimension: number
): Promise<{ base64: string; mimeType: string; filename: string }> {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    const url = URL.createObjectURL(blob);

    img.onload = () => {
      URL.revokeObjectURL(url);
      const { width, height } = img;
      const needsResize = width > maxDimension || height > maxDimension;
      const scale = needsResize ? maxDimension / Math.max(width, height) : 1;

      const canvas = document.createElement("canvas");
      canvas.width = Math.round(width * scale);
      canvas.height = Math.round(height * scale);
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      canvas.toBlob(
        (result) => {
          if (!result) { reject(new Error("Canvas export falhou")); return; }
          const reader = new FileReader();
          reader.onload = () => {
            const dataUrl = reader.result as string;
            resolve({
              base64: dataUrl.split(",")[1],
              mimeType: OUTPUT_TYPE,
              filename: fileName.replace(/\.[^.]+$/, ".jpg"),
            });
          };
          reader.onerror = () => reject(new Error("Leitura do arquivo falhou"));
          reader.readAsDataURL(result);
        },
        OUTPUT_TYPE,
        0.95
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Navegador nao conseguiu decodificar a imagem"));
    };

    img.src = url;
  });
}

export async function processImage(
  file: File,
  maxDimension = 2048
): Promise<{ base64: string; mimeType: string; filename: string }> {
  console.log("[processImage]", file.name, "type:", file.type, "isHeic:", isHeic(file));

  if (isHeic(file)) {
    // HEIC: decode via heic2any CDN, then render to canvas as JPEG
    let jpegBlob: Blob;
    try {
      jpegBlob = await convertHeicToJpeg(file);
    } catch (err: unknown) {
      const detail = err instanceof Error ? err.message : String(err);
      throw new Error(`Conversao HEIC falhou: ${detail}`);
    }

    try {
      return await canvasToResult(jpegBlob, file.name, maxDimension);
    } catch (err: unknown) {
      const detail = err instanceof Error ? err.message : String(err);
      throw new Error(`Canvas apos HEIC falhou: ${detail}`);
    }
  }

  // Standard formats: canvas directly
  return canvasToResult(file, file.name, maxDimension);
}
