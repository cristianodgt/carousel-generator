export function generateId(): string {
  return Math.random().toString(36).substring(2, 15);
}

const SUPPORTED_OUTPUT_TYPE = "image/jpeg";

export async function fileToBase64(file: File): Promise<{ base64: string; mimeType: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const base64 = dataUrl.split(",")[1];
      const mimeType = dataUrl.split(";")[0].split(":")[1] || SUPPORTED_OUTPUT_TYPE;
      resolve({ base64, mimeType });
    };
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}

export function isImageFile(file: File): boolean {
  // Check MIME type
  if (file.type && file.type.startsWith("image/")) return true;
  // Fallback: check extension for mobile browsers that don't set type
  const ext = file.name.toLowerCase().split(".").pop();
  const imageExtensions = ["jpg", "jpeg", "png", "webp", "gif", "heic", "heif", "bmp", "tiff", "avif"];
  return imageExtensions.includes(ext || "");
}

export async function resizeImageClient(file: File, maxDimension = 1500): Promise<File> {
  // Always convert to JPEG via canvas to handle HEIC, HEIF, and other exotic formats
  return new Promise((resolve) => {
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

      // Always output as JPEG (universally supported by all browsers)
      canvas.toBlob(
        (blob) => {
          if (blob) {
            const newName = file.name.replace(/\.[^.]+$/, ".jpg");
            resolve(new File([blob], newName, { type: SUPPORTED_OUTPUT_TYPE }));
          } else {
            // Fallback: return original file
            resolve(file);
          }
        },
        SUPPORTED_OUTPUT_TYPE,
        0.9
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      // If the browser can't decode the image (e.g., HEIC on some browsers),
      // try reading it as-is and let the server handle conversion
      console.warn(`Browser cannot decode ${file.name}, using original file`);
      resolve(file);
    };

    img.src = url;
  });
}
