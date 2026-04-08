"use client";
import { useCarouselStore } from "@/hooks/useCarouselStore";
import { DropZone } from "@/components/upload/DropZone";
import { ImagePreviewGrid } from "@/components/upload/ImagePreviewGrid";
import { Button } from "@/components/ui/button";
import { fileToBase64, resizeImageClient, generateId } from "@/lib/image-utils";
import { ArrowRight } from "lucide-react";
import { useState } from "react";

export function StepUpload() {
  const { uploadedImages, addImages, removeImage, nextStep } = useCarouselStore();
  const [loading, setLoading] = useState(false);

  const handleFiles = async (files: File[]) => {
    const remaining = 10 - uploadedImages.length;
    const toProcess = files.slice(0, remaining);
    if (toProcess.length === 0) return;

    setLoading(true);
    const processed = await Promise.all(
      toProcess.map(async (file) => {
        const resized = await resizeImageClient(file);
        const { base64, mimeType } = await fileToBase64(resized);
        return {
          id: generateId(),
          base64,
          mimeType,
          filename: file.name,
          previewUrl: `data:${mimeType};base64,${base64}`,
        };
      })
    );
    addImages(processed);
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
