export function generateId(): string {
  return Math.random().toString(36).substring(2, 15);
}

const OUTPUT_TYPE = "image/jpeg";

function isHeic(file: File): boolean {
  if (file.type === "image/heic" || file.type === "image/heif") return true;
  const ext = file.name.toLowerCase().split(".").pop();
  return ext === "heic" || ext === "heif";
}

export function isImageFile(file: File): boolean {
  if (file.type && file.type.startsWith("image/")) return true;
  const ext = file.name.toLowerCase().split(".").pop();
  const imageExtensions = ["jpg", "jpeg", "png", "webp", "gif", "heic", "heif", "bmp", "tiff", "avif"];
  return imageExtensions.includes(ext || "");
}

// Convert image server-side via Sharp (handles HEIC, HEIF, AVIF, TIFF, etc.)
async function convertOnServer(file: File): Promise<{ base64: string; mimeType: string; filename: string }> {
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch("/api/convert", { method: "POST", body: formData });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Unknown error" }));
    throw new Error(err.error || "Server conversion failed");
  }
  return res.json();
}

// Convert image client-side via Canvas (fast, works for JPG/PNG/WebP)
function convertOnClient(file: File, maxDimension: number): Promise<{ base64: string; mimeType: string; filename: string }> {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    const url = URL.createObjectURL(file);

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
        (blob) => {
          if (!blob) { reject(new Error("Canvas toBlob failed")); return; }
          const reader = new FileReader();
          reader.onload = () => {
            const dataUrl = reader.result as string;
            const base64 = dataUrl.split(",")[1];
            resolve({
              base64,
              mimeType: OUTPUT_TYPE,
              filename: file.name.replace(/\.[^.]+$/, ".jpg"),
            });
          };
          reader.onerror = () => reject(new Error("FileReader failed"));
          reader.readAsDataURL(blob);
        },
        OUTPUT_TYPE,
        0.95
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Browser cannot decode this image format"));
    };

    img.src = url;
  });
}

export async function processImage(file: File, maxDimension = 2048): Promise<{
  base64: string;
  mimeType: string;
  filename: string;
}> {
  // HEIC/HEIF: always convert server-side (browsers can't decode it except Safari)
  if (isHeic(file)) {
    return convertOnServer(file);
  }

  // Standard formats: try client-side first (faster), fallback to server
  try {
    return await convertOnClient(file, maxDimension);
  } catch {
    // If canvas fails (exotic format), try server-side
    return convertOnServer(file);
  }
}
