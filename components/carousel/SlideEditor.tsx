"use client";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCw } from "lucide-react";
import type { CarouselSlide } from "@/lib/types";

interface SlideEditorProps {
  slide: CarouselSlide;
  open: boolean;
  onClose: () => void;
  onUpdate: (id: string, partial: Partial<CarouselSlide>) => void;
  format: "square" | "portrait";
  brandColors: string[];
}

export function SlideEditor({ slide, open, onClose, onUpdate, format, brandColors }: SlideEditorProps) {
  const [title, setTitle] = useState(slide.title);
  const [body, setBody] = useState(slide.body);
  const [cta, setCta] = useState(slide.cta);
  const [regenerating, setRegenerating] = useState(false);

  const imageData = slide.composedImageBase64 || slide.generatedImageBase64;

  async function handleSaveText() {
    onUpdate(slide.id, { title, body, cta });

    // Re-compose with new text
    if (slide.generatedImageBase64) {
      try {
        const res = await fetch("/api/compose", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            image: slide.generatedImageBase64,
            text: { title, body, cta },
            format,
            brandColors,
            slideNumber: slide.slideNumber,
            totalSlides: 0,
          }),
        });
        if (res.ok) {
          const { composedImage } = await res.json();
          onUpdate(slide.id, { title, body, cta, composedImageBase64: composedImage });
        }
      } catch {
        // Keep existing composed image
      }
    }
  }

  async function handleRegenerateImage() {
    setRegenerating(true);
    try {
      const res = await fetch("/api/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: slide.imagePrompt,
          referenceImages: [],
          previousSlides: [],
          brandColors,
          format,
        }),
      });
      if (res.ok) {
        const { image } = await res.json();
        onUpdate(slide.id, { generatedImageBase64: image });

        // Re-compose
        const composeRes = await fetch("/api/compose", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            image,
            text: { title, body, cta },
            format,
            brandColors,
            slideNumber: slide.slideNumber,
            totalSlides: 0,
          }),
        });
        if (composeRes.ok) {
          const { composedImage } = await composeRes.json();
          onUpdate(slide.id, { composedImageBase64: composedImage });
        }
      }
    } catch {
      // Keep existing
    } finally {
      setRegenerating(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Slide {slide.slideNumber}</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className={`${format === "square" ? "aspect-square" : "aspect-[4/5]"} rounded-lg overflow-hidden bg-muted`}>
            {imageData ? (
              <img
                src={`data:image/png;base64,${imageData}`}
                alt={`Slide ${slide.slideNumber}`}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                Sem imagem
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div>
              <Label>Titulo</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>
            <div>
              <Label>Corpo</Label>
              <Textarea value={body} onChange={(e) => setBody(e.target.value)} rows={3} />
            </div>
            <div>
              <Label>CTA</Label>
              <Input value={cta} onChange={(e) => setCta(e.target.value)} placeholder="Apenas no ultimo slide" />
            </div>

            <div className="flex gap-2">
              <Button onClick={handleSaveText} className="flex-1">
                Salvar Texto
              </Button>
              <Button variant="outline" onClick={handleRegenerateImage} disabled={regenerating}>
                {regenerating ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <RefreshCw className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
