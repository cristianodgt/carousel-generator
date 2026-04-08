export function generateId(): string {
  return Math.random().toString(36).substring(2, 15);
}

const OUTPUT_TYPE = "image/jpeg";

function isHeic(file: File): boolean {
  if (file.type === "image/heic" || file.type === "image/heif") return true;
  const ext = file.name.toLowerCase().split(".").pop();
  return ext === "heic" || ext === "heif";
}

async function convertHeicToJpeg(file: File): Promise<File> {
  const heic2any = (await import("heic2any")).default;
  const blob = await heic2any({ blob: file, toType: OUTPUT_TYPE, quality: 0.955 });
  const resultBlob = Array.isArray(blob) ? blob[0] : blob;
  const newName = file.name.replace(/\.[^.]+$/, ".jpg");
  return new File([resultBlob], newName, { type: OUTPUT_TYPE });
}

export async function fileToBase64(file: File): Promise<{ base64: string; mimeType: string }> {
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

export async function processImage(file: File, maxDimension = 2048): Promise<File> {
  // Step 1: Convert HEIC/HEIF to JPEG first
  let workingFile = file;
  if (isHeic(file)) {
    try {
      workingFile = await convertHeicToJpeg(file);
    } catch (err) {
      console.error("HEIC conversion failed:", err);
      throw new Error(`Nao foi possivel converter ${file.name}. Tente salvar como JPG antes de enviar.`);
    }
  }

  // Step 2: Resize and normalize to JPEG via canvas
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    const url = URL.createObjectURL(workingFile);

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
          if (blob) {
            const newName = workingFile.name.replace(/\.[^.]+$/, ".jpg");
            resolve(new File([blob], newName, { type: OUTPUT_TYPE }));
          } else {
            resolve(workingFile);
          }
        },
        OUTPUT_TYPE,
        0.95
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error(`Nao foi possivel processar ${file.name}. Formato nao suportado.`));
    };

    img.src = url;
  });
}
