"use client";
import { useCarouselStore } from "@/hooks/useCarouselStore";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Loader2, CheckCircle, XCircle } from "lucide-react";
import { useEffect, useRef } from "react";
import { generateId } from "@/lib/image-utils";
import { composeSlideClient } from "@/lib/client-composer";
import type { CarouselSlide } from "@/lib/types";

export function StepGenerate() {
  const {
    uploadedImages, analysis, config, generationPhase, generationProgress,
    slides, setSlides, updateSlide, setGenerationPhase, setGenerationProgress,
    setCaption, nextStep, prevStep,
  } = useCarouselStore();
  const startedRef = useRef(false);

  useEffect(() => {
    if (startedRef.current || generationPhase === "done") return;
    startedRef.current = true;
    runGeneration();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function runGeneration() {
    try {
      // Phase 1: Generate text content via AI
      setGenerationPhase("generating-text");
      setGenerationProgress(10);

      const contentRes = await fetch("/api/generate-content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ analysis, config }),
      });
      if (!contentRes.ok) throw new Error("Falha na geracao de conteudo");
      const { slides: slideContents } = await contentRes.json();

      const initialSlides: CarouselSlide[] = slideContents.map(
        (s: { slideNumber: number; title: string; body: string; cta: string; imagePrompt: string }, i: number) => ({
          id: generateId(),
          slideNumber: i + 1,
          title: s.title,
          body: s.body,
          cta: s.cta,
          imagePrompt: s.imagePrompt,
          generatedImageBase64: null,
          composedImageBase64: null,
          status: "pending" as const,
        })
      );
      setSlides(initialSlides);
      setGenerationProgress(25);

      // Phase 2: Enhance original photos (Sharp - deterministic, preserves person 100%)
      // Distribute uploaded images across slides
      setGenerationPhase("generating-images");

      for (let i = 0; i < initialSlides.length; i++) {
        const slide = initialSlides[i];
        updateSlide(slide.id, { status: "generating" });

        // Pick the uploaded image for this slide (cycle through them)
        const imgIndex = i % uploadedImages.length;
        const sourceImage = uploadedImages[imgIndex];

        try {
          // Enhance photo via Sharp (crop, brightness, saturation, sharpen)
          const enhanceRes = await fetch("/api/enhance", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              image: sourceImage.base64,
              format: config.format,
            }),
          });

          if (enhanceRes.ok) {
            const { image } = await enhanceRes.json();
            updateSlide(slide.id, { generatedImageBase64: image, status: "done" });
          } else {
            // Fallback: use original image directly
            updateSlide(slide.id, { generatedImageBase64: sourceImage.base64, status: "done" });
          }
        } catch {
          // Fallback: use original image directly
          updateSlide(slide.id, { generatedImageBase64: sourceImage.base64, status: "done" });
        }

        const progress = 25 + ((i + 1) / initialSlides.length) * 30;
        setGenerationProgress(Math.round(progress));
      }

      // Phase 3: Compose text overlays on images (client-side Canvas)
      setGenerationPhase("composing");
      setGenerationProgress(60);

      // Re-read slides from store to get the enhanced images
      const currentSlides = useCarouselStore.getState().slides;

      for (let i = 0; i < currentSlides.length; i++) {
        const slide = currentSlides[i];
        const baseImage = slide.generatedImageBase64;
        if (!baseImage) continue;

        try {
          const composedBase64 = await composeSlideClient({
            imageBase64: baseImage,
            text: { title: slide.title, body: slide.body, cta: slide.cta },
            format: config.format,
            brandColors: config.brandColors,
            slideNumber: i + 1,
            totalSlides: currentSlides.length,
          });
          updateSlide(slide.id, { composedImageBase64: composedBase64 });
        } catch (err) {
          console.error(`[compose] Slide ${i + 1} error:`, err);
        }
      }
      setGenerationProgress(80);

      // Phase 4: Generate caption
      setGenerationPhase("generating-caption");
      try {
        const captionRes = await fetch("/api/generate-caption", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            analysis,
            config,
            slideContents: slideContents.map((s: { title: string; body: string }) => ({
              title: s.title,
              body: s.body,
            })),
          }),
        });

        if (captionRes.ok) {
          const { caption } = await captionRes.json();
          setCaption(caption);
        }
      } catch {
        // Caption generation is non-critical
      }

      setGenerationPhase("done");
      setGenerationProgress(100);

      // Auto-advance to preview
      setTimeout(() => nextStep(), 1000);
    } catch (e) {
      console.error(e);
      setGenerationPhase("error");
    }
  }

  const phaseLabels: Record<string, string> = {
    idle: "Preparando...",
    analyzing: "Analisando imagens...",
    "generating-text": "Gerando textos do carrossel...",
    "generating-images": "Aprimorando fotos...",
    composing: "Compondo slides com texto...",
    "generating-caption": "Gerando legenda otimizada...",
    done: "Concluido!",
    error: "Erro na geracao",
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Gerando seu carrossel</h2>
        <p className="text-muted-foreground mt-1">
          A IA esta criando textos e legenda. Suas fotos originais serao usadas com aprimoramento profissional.
        </p>
      </div>

      <Card>
        <CardContent className="py-8 space-y-6">
          <div className="flex items-center gap-3">
            {generationPhase === "error" ? (
              <XCircle className="w-5 h-5 text-destructive" />
            ) : generationPhase === "done" ? (
              <CheckCircle className="w-5 h-5 text-green-500" />
            ) : (
              <Loader2 className="w-5 h-5 animate-spin text-primary" />
            )}
            <span className="text-lg font-medium">{phaseLabels[generationPhase]}</span>
          </div>

          <Progress value={generationProgress} className="h-3" />

          {slides.length > 0 && (
            <div className="grid grid-cols-5 gap-2">
              {slides.map((slide) => (
                <div
                  key={slide.id}
                  className={`
                    aspect-square rounded-lg flex items-center justify-center text-sm font-bold
                    ${slide.status === "done" ? "bg-green-100 text-green-700" : ""}
                    ${slide.status === "generating" ? "bg-primary/10 text-primary animate-pulse" : ""}
                    ${slide.status === "pending" ? "bg-muted text-muted-foreground" : ""}
                    ${slide.status === "error" ? "bg-destructive/10 text-destructive" : ""}
                  `}
                >
                  {slide.status === "generating" ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : slide.status === "done" ? (
                    <CheckCircle className="w-4 h-4" />
                  ) : slide.status === "error" ? (
                    <XCircle className="w-4 h-4" />
                  ) : (
                    slide.slideNumber
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {generationPhase === "error" && (
        <div className="flex justify-between">
          <Button variant="outline" onClick={() => { startedRef.current = false; prevStep(); }}>
            <ArrowLeft className="mr-2 w-4 h-4" /> Voltar
          </Button>
          <Button onClick={() => { startedRef.current = false; runGeneration(); }}>
            Tentar Novamente
          </Button>
        </div>
      )}
    </div>
  );
}
