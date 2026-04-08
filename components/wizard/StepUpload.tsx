"use client";
import { useCarouselStore } from "@/hooks/useCarouselStore";
import { DropZone } from "@/components/upload/DropZone";
import { ImagePreviewGrid } from "@/components/upload/ImagePreviewGrid";
import { Button } from "@/components/ui/button";
import { fileToBase64, processImage, generateId } from "@/lib/image-utils";
import { ArrowRight, Loader2 } from "lucide-react";
import { useState } from "react";

export function StepUpload() {
  const { uploadedImages, addImages, removeImage, nextStep } = useCarouselStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFiles = async (files: File[]) => {
    const remaining = 10 - uploadedImages.length;
    const toProcess = files.slice(0, remaining);
    if (toProcess.length === 0) return;

    setLoading(true);
    setError(null);

    const results = [];
    for (const file of toProcess) {
      try {
        const resized = await processImage(file);
        const { base64, mimeType } = await fileToBase64(resized);
        results.push({
          id: generateId(),
          base64,
          mimeType,
          filename: file.name,
          previewUrl: `data:${mimeType};base64,${base64}`,
        });
      } catch (err) {
        console.error(`Failed to process ${file.name}:`, err);
        setError(`Falha ao processar ${file.name}. Tente outro formato.`);
      }
    }

    if (results.length > 0) {
      addImages(results);
    }
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Envie suas imagens</h2>
        <p className="text-muted-foreground mt-1">
          Envie fotos de produtos, assets de marca ou qualquer imagem para o carrossel.
        </p>
      </div>

      <DropZone onFiles={handleFiles} disabled={loading || uploadedImages.length >= 10} />

      {loading && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin" />
          Processando imagens...
        </div>
      )}

      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}

      <ImagePreviewGrid images={uploadedImages} onRemove={removeImage} />

      {uploadedImages.length > 0 && (
        <div className="flex justify-between items-center">
          <p className="text-sm text-muted-foreground">
            {uploadedImages.length}/10 imagens
          </p>
          <Button onClick={nextStep} size="lg" disabled={loading}>
            Continuar <ArrowRight className="ml-2 w-4 h-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
