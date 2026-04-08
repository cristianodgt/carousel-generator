"use client";
import { useState } from "react";
import { useCarouselStore } from "@/hooks/useCarouselStore";
import { SlideCard } from "@/components/carousel/SlideCard";
import { SlideEditor } from "@/components/carousel/SlideEditor";
import { CaptionEditor } from "@/components/caption/CaptionEditor";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Download, RotateCcw } from "lucide-react";
import type { CarouselSlide } from "@/lib/types";

export function StepPreview() {
  const {
    slides, config, analysis, caption, updateSlide, setCaption, prevStep, reset,
  } = useCarouselStore();
  const [editingSlide, setEditingSlide] = useState<CarouselSlide | null>(null);

  async function handleDownload() {
    const JSZip = (await import("jszip")).default;
    const zip = new JSZip();

    slides.forEach((slide) => {
      const imageData = slide.composedImageBase64 || slide.generatedImageBase64;
      if (imageData) {
        zip.file(`slide-${slide.slideNumber}.png`, imageData, { base64: true });
      }
    });

    if (caption) {
      zip.file("legenda.txt", caption.fullCaption);
    }

    const blob = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "carrossel.zip";
    a.click();
    URL.revokeObjectURL(url);
  }

  const slideContents = slides.map((s) => ({ title: s.title, body: s.body }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Preview do Carrossel</h2>
          <p className="text-muted-foreground mt-1">
            Clique em um slide para editar. Baixe tudo como ZIP.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={reset}>
            <RotateCcw className="w-4 h-4 mr-2" /> Novo
          </Button>
          <Button onClick={handleDownload}>
            <Download className="w-4 h-4 mr-2" /> Baixar ZIP
          </Button>
        </div>
      </div>

      {/* Carousel preview */}
      <div className="overflow-x-auto pb-4">
        <div className="flex gap-4" style={{ scrollSnapType: "x mandatory" }}>
          {slides.map((slide) => (
            <SlideCard
              key={slide.id}
              slide={slide}
              format={config.format}
              onClick={() => setEditingSlide(slide)}
            />
          ))}
        </div>
      </div>

      {/* Caption */}
      {caption && analysis && (
        <CaptionEditor
          caption={caption}
          onUpdate={setCaption}
          analysis={analysis}
          config={config}
          slideContents={slideContents}
        />
      )}

      {/* Navigation */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={prevStep}>
          <ArrowLeft className="mr-2 w-4 h-4" /> Voltar
        </Button>
      </div>

      {/* Slide editor dialog */}
      {editingSlide && (
        <SlideEditor
          slide={editingSlide}
          open={!!editingSlide}
          onClose={() => setEditingSlide(null)}
          onUpdate={updateSlide}
          format={config.format}
          brandColors={config.brandColors}
        />
      )}
    </div>
  );
}
