// Convert HEIC files by sending them to the server-side API route
// Uses heic-convert (pure JS) on the server - supports modern iPhone HEIC variants

export async function convertHeicToJpeg(file: File): Promise<Blob> {
  console.log("[HEIC] Sending to server for conversion:", file.name, "size:", file.size);

  const formData = new FormData();
  formData.append("file", file);

  const response = await fetch("/api/convert", {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({ error: "Server error" }));
    throw new Error(data.error || `Server returned ${response.status}`);
  }

  const data = await response.json();
  console.log("[HEIC] Server conversion successful, result size:", data.base64.length);

  // Convert base64 back to Blob
  const byteString = atob(data.base64);
  const bytes = new Uint8Array(byteString.length);
  for (let i = 0; i < byteString.length; i++) {
    bytes[i] = byteString.charCodeAt(i);
  }

  return new Blob([bytes], { type: "image/jpeg" });
}
