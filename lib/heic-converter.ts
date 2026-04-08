// Load heic2any from CDN at runtime, bypassing Next.js/Turbopack bundler issues
// This avoids WASM bundling problems that cause heic2any to fail when imported as a module

let heic2anyLoaded: ((options: { blob: Blob; toType: string; quality: number }) => Promise<Blob | Blob[]>) | null = null;
let loadingPromise: Promise<void> | null = null;

function loadHeic2any(): Promise<void> {
  if (heic2anyLoaded) return Promise.resolve();
  if (loadingPromise) return loadingPromise;

  loadingPromise = new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://cdn.jsdelivr.net/npm/heic2any@0.0.4/dist/heic2any.min.js";
    script.onload = () => {
      // heic2any attaches to window as a global
      const win = window as unknown as { heic2any: typeof heic2anyLoaded };
      if (win.heic2any) {
        heic2anyLoaded = win.heic2any;
        resolve();
      } else {
        reject(new Error("heic2any loaded but not found on window"));
      }
    };
    script.onerror = () => reject(new Error("Failed to load HEIC decoder"));
    document.head.appendChild(script);
  });

  return loadingPromise;
}

export async function convertHeicToJpeg(file: File): Promise<Blob> {
  await loadHeic2any();
  if (!heic2anyLoaded) throw new Error("HEIC decoder not available");

  const result = await heic2anyLoaded({
    blob: file,
    toType: "image/jpeg",
    quality: 0.95,
  });

  return Array.isArray(result) ? result[0] : result;
}
