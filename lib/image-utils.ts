export function generateId(): string {
  return Math.random().toString(36).substring(2, 15);
}

const OUTPUT_TYPE = "image/jpeg";

function isHeic(file: File): boolean {
  if (file.type === "image/heic" || file.type === "image/heif") return true;
  const ext = file.name.toLowerCase().split(".").pop();
  return ext === "heic" || ext === "heif";
}

async function convertHeicToJpeg(file: File): Promise<Blob> {
  // Dynamic import with explicit handling for CJS default export
  const mod = await import("heic2any");
  const heic2any = mod.default || mod;
  const result = await (heic2any as (options: { blob: Blob; toType: string; quality: number }) => Promise<Blob | Blob[]>)({
    blob: file,
    toType: OUTPUT_TYPE,
    quality: 0.95,
  });
  return Array.isArray(result) ? result[0] : result;
}

export async function fileToBase64(file: File | Blob): Promise<{ base64: string; mimeType: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const base64 = dataUrl.split(",")[1];
      const mimeType = dataUrl.split(";")[0].split(":")[1] || OUTPUT_TYPE;
      resolve({ base64, mimeType });
    };
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}

export function isImageFile(file: File): boolean {
  if (file.type && file.type.startsWith("image/")) return true;
  const ext = file.name.toLowerCase().split(".").pop();
  const imageExtensions = ["jpg", "jpeg", "png", "webp", "gif", "heic", "heif", "bmp", "tiff", "avif"];
  return imageExtensions.includes(ext || "");
}

function canvasResize(blob: Blob, fileName: string, maxDimension: number): Promise<File> {
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
          if (result) {
            const newName = fileName.replace(/\.[^.]+$/, ".jpg");
            resolve(new File([result], newName, { type: OUTPUT_TYPE }));
          } else {
            reject(new Error("Canvas toBlob returned null"));
          }
        },
        OUTPUT_TYPE,
        0.95
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Image decode failed"));
    };

    img.src = url;
  });
}

export async function processImage(file: File, maxDimension = 2048): Promise<File> {
  // For HEIC files: convert first, then resize via canvas
  if (isHeic(file)) {
    try {
      const jpegBlob = await convertHeicToJpeg(file);
      return await canvasResize(jpegBlob, file.name, maxDimension);
    } catch (err) {
      console.error("HEIC conversion error:", err);
      // Try direct canvas as fallback (works in Safari which natively supports HEIC)
      try {
        return await canvasResize(file, file.name, maxDimension);
      } catch {
        throw new Error(`Nao foi possivel converter ${file.name}. Tente converter para JPG antes de enviar.`);
      }
    }
  }

  // For standard formats: resize via canvas
  return canvasResize(file, file.name, maxDimension);
}
