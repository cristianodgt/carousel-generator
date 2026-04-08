"use client";
import { useCarouselStore } from "@/hooks/useCarouselStore";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Loader2, CheckCircle, XCircle } from "lucide-react";
import { useEffect, useRef } from "react";
import { generateId } from "@/lib/image-utils";
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
      // Phase 1: Generate text content
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
      setGenerationProgress(20);

      // Phase 2: Generate images sequentially (for consistency + rate limits)
      setGenerationPhase("generating-images");
      const generatedImages: string[] = [];

      for (let i = 0; i < initialSlides.length; i++) {
        const slide = initialSlides[i];
        updateSlide(slide.id, { status: "generating" });

        try {
          // Send the reference image for this specific slide (distribute across slides)
          // Plus 1-2 others for style consistency
          const primaryImageIndex = i % uploadedImages.length;
          const slideRefImages = [
            uploadedImages[primaryImageIndex],
            ...uploadedImages.filter((_, idx) => idx !== primaryImageIndex).slice(0, 1),
          ].map((img) => ({ base64: img.base64, mimeType: img.mimeType }));

          const imageRes = await fetch("/api/generate-image", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              prompt: slide.imagePrompt,
              referenceImages: slideRefImages,
              previousSlides: generatedImages.slice(-1),
              brandColors: config.brandColors,
              format: config.format,
            }),
          });

          if (!imageRes.ok) throw new Error(`Falha no slide ${i + 1}`);
          const { image } = await imageRes.json();

          generatedImages.push(image);
          updateSlide(slide.id, { generatedImageBase64: image, status: "done" });
        } catch {
          updateSlide(slide.id, { status: "error" });
        }

        const progress = 20 + ((i + 1) / initialSlides.length) * 50;
        setGenerationProgress(Math.round(progress));
      }

      // Phase 3: Compose (overlay text on images)
      setGenerationPhase("composing");
      setGenerationProgress(75);

      for (let i = 0; i < initialSlides.length; i++) {
        const slide = initialSlides[i];
        const genImage = generatedImages[i];
        if (!genImage) continue;

        try {
          const composeRes = await fetch("/api/compose", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              image: genImage,
              text: { title: slide.title, body: slide.body, cta: slide.cta },
              format: config.format,
              brandColors: config.brandColors,
              slideNumber: i + 1,
              totalSlides: initialSlides.length,
            }),
          });

          if (composeRes.ok) {
            const { composedImage } = await composeRes.json();
            updateSlide(slide.id, { composedImageBase64: composedImage });
          }
        } catch {
          // Keep the un-composed image as fallback
        }
      }
      setGenerationProgress(85);

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
    "generating-images": "Gerando imagens dos slides...",
    composing: "Compondo slides finais...",
    "generating-caption": "Gerando legenda otimizada...",
    done: "Concluido!",
    error: "Erro na geracao",
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Gerando seu carrossel</h2>
        <p className="text-muted-foreground mt-1">
          A IA esta criando textos, imagens e legenda para seu carrossel.
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
