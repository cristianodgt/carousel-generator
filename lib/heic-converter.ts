// Load heic2any from CDN at runtime, bypassing Next.js/Turbopack bundler
// heic2any uses libheif compiled to JS - works in all browsers including Chrome

type Heic2AnyFn = (options: { blob: Blob; toType: string; quality: number }) => Promise<Blob | Blob[]>;

let heic2anyFn: Heic2AnyFn | null = null;
let loadPromise: Promise<void> | null = null;

function loadHeic2any(): Promise<void> {
  if (heic2anyFn) return Promise.resolve();
  if (loadPromise) return loadPromise;

  loadPromise = new Promise<void>((resolve, reject) => {
    // Try multiple CDN sources for reliability
    const urls = [
      "https://unpkg.com/heic2any@0.0.4/dist/heic2any.js",
      "https://cdn.jsdelivr.net/npm/heic2any@0.0.4/dist/heic2any.js",
    ];

    let urlIndex = 0;

    function tryLoad() {
      if (urlIndex >= urls.length) {
        reject(new Error("Nao foi possivel carregar o decoder HEIC de nenhum CDN"));
        return;
      }

      const script = document.createElement("script");
      script.src = urls[urlIndex];
      script.onload = () => {
        const win = window as unknown as Record<string, unknown>;
        if (typeof win.heic2any === "function") {
          heic2anyFn = win.heic2any as Heic2AnyFn;
          console.log("[HEIC] Decoder loaded from", urls[urlIndex]);
          resolve();
        } else {
          console.warn("[HEIC] Script loaded but heic2any not found on window, trying next CDN");
          urlIndex++;
          tryLoad();
        }
      };
      script.onerror = () => {
        console.warn("[HEIC] Failed to load from", urls[urlIndex]);
        urlIndex++;
        tryLoad();
      };
      document.head.appendChild(script);
    }

    tryLoad();
  });

  return loadPromise;
}

export async function convertHeicToJpeg(file: File): Promise<Blob> {
  console.log("[HEIC] Starting conversion for", file.name, "size:", file.size);

  await loadHeic2any();
  if (!heic2anyFn) throw new Error("HEIC decoder nao disponivel");

  console.log("[HEIC] Decoder ready, converting...");

  const result = await heic2anyFn({
    blob: file,
    toType: "image/jpeg",
    quality: 0.95,
  });

  const blob = Array.isArray(result) ? result[0] : result;
  console.log("[HEIC] Conversion done, result size:", blob.size);
  return blob;
}
