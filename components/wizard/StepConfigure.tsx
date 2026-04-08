"use client";
import { useCarouselStore } from "@/hooks/useCarouselStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, ArrowRight, Loader2, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";

export function StepConfigure() {
  const {
    uploadedImages, analysis, config, setAnalysis, updateConfig, nextStep, prevStep,
  } = useCarouselStore();
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!analysis && uploadedImages.length > 0 && !analyzing) {
      runAnalysis();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function downscaleBase64(base64: string, mimeType: string, maxDim = 512): Promise<string> {
    return new Promise((resolve) => {
      const img = new window.Image();
      img.onload = () => {
        const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext("2d")!;
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL("image/jpeg", 0.6);
        resolve(dataUrl.split(",")[1]);
      };
      img.onerror = () => resolve(base64); // fallback to original
      img.src = `data:${mimeType};base64,${base64}`;
    });
  }

  async function runAnalysis() {
    setAnalyzing(true);
    setError(null);
    try {
      // Downscale images for analysis (512px, low quality) to stay under Vercel 4.5MB body limit
      const smallImages = await Promise.all(
        uploadedImages.map(async (img) => ({
          base64: await downscaleBase64(img.base64, img.mimeType),
          mimeType: "image/jpeg",
        }))
      );

      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ images: smallImages }),
      });
      if (!res.ok) throw new Error("Falha na analise");
      const data = await res.json();
      setAnalysis(data.analysis);
      // Auto-fill config from analysis
      if (data.analysis) {
        updateConfig({
          audience: data.analysis.suggestedAudience || "",
          niche: data.analysis.category || "",
          keywordSeo: data.analysis.category || "",
          brandColors: data.analysis.dominantColors?.slice(0, 3) || ["#000000", "#FFFFFF"],
        });
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro desconhecido");
    } finally {
      setAnalyzing(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Configure seu carrossel</h2>
        <p className="text-muted-foreground mt-1">
          A IA analisou suas imagens. Ajuste as configuracoes abaixo.
        </p>
      </div>

      {analyzing && (
        <Card>
          <CardContent className="flex items-center gap-3 py-6">
            <Loader2 className="w-5 h-5 animate-spin text-primary" />
            <span>Analisando suas imagens com IA...</span>
          </CardContent>
        </Card>
      )}

      {error && (
        <Card className="border-destructive">
          <CardContent className="py-4 text-destructive">
            {error}
            <Button variant="outline" size="sm" className="ml-4" onClick={runAnalysis}>
              Tentar novamente
            </Button>
          </CardContent>
        </Card>
      )}

      {analysis && (
        <Card className="bg-primary/5 border-primary/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Sparkles className="w-4 h-4" /> Analise da IA
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>{analysis.rawDescription}</p>
            <div className="flex flex-wrap gap-2 mt-2">
              <Badge variant="secondary">{analysis.category}</Badge>
              <Badge variant="secondary">{analysis.mood}</Badge>
              {analysis.dominantColors.map((c) => (
                <Badge key={c} variant="outline" className="gap-1">
                  <span className="w-3 h-3 rounded-full inline-block" style={{ backgroundColor: c }} />
                  {c}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <Label>Publico-alvo</Label>
            <Input
              value={config.audience}
              onChange={(e) => updateConfig({ audience: e.target.value })}
              placeholder="Ex: Mulheres 25-35 interessadas em skincare"
            />
          </div>

          <div>
            <Label>Tom / Estilo</Label>
            <Select value={config.tone} onValueChange={(v) => updateConfig({ tone: v as CarouselConfig["tone"] })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="professional">Profissional</SelectItem>
                <SelectItem value="playful">Divertido</SelectItem>
                <SelectItem value="luxury">Luxo</SelectItem>
                <SelectItem value="educational">Educativo</SelectItem>
                <SelectItem value="minimal">Minimalista</SelectItem>
                <SelectItem value="bold">Ousado</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Objetivo do Carrossel</Label>
            <Select value={config.goal} onValueChange={(v) => updateConfig({ goal: v as CarouselConfig["goal"] })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="product-launch">Lancamento de Produto</SelectItem>
                <SelectItem value="testimonial">Depoimento</SelectItem>
                <SelectItem value="educational">Educativo</SelectItem>
                <SelectItem value="behind-the-scenes">Bastidores</SelectItem>
                <SelectItem value="promotion">Promocao</SelectItem>
                <SelectItem value="storytelling">Storytelling</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Formato</Label>
            <Select value={config.format} onValueChange={(v) => updateConfig({ format: v as "square" | "portrait" })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="square">Quadrado (1080x1080)</SelectItem>
                <SelectItem value="portrait">Retrato (1080x1350)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Numero de Slides: {config.slideCount}</Label>
            <Slider
              value={[config.slideCount]}
              onValueChange={(val) => updateConfig({ slideCount: Array.isArray(val) ? val[0] : val })}
              min={3}
              max={10}
              step={1}
              className="mt-2"
            />
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <Label>Cores da Marca</Label>
            <div className="flex gap-2 mt-1">
              {config.brandColors.map((color, i) => (
                <input
                  key={i}
                  type="color"
                  value={color}
                  onChange={(e) => {
                    const newColors = [...config.brandColors];
                    newColors[i] = e.target.value;
                    updateConfig({ brandColors: newColors });
                  }}
                  className="w-10 h-10 rounded cursor-pointer border-0"
                />
              ))}
              {config.brandColors.length < 4 && (
                <button
                  onClick={() => updateConfig({ brandColors: [...config.brandColors, "#888888"] })}
                  className="w-10 h-10 rounded border-2 border-dashed border-muted-foreground/30 flex items-center justify-center text-muted-foreground hover:border-primary/50"
                >
                  +
                </button>
              )}
            </div>
          </div>

          <div>
            <Label>Nicho / Segmento</Label>
            <Input
              value={config.niche}
              onChange={(e) => updateConfig({ niche: e.target.value })}
              placeholder="Ex: Gastronomia, Moda, Tech"
            />
          </div>

          <div>
            <Label>Keyword SEO</Label>
            <Input
              value={config.keywordSeo}
              onChange={(e) => updateConfig({ keywordSeo: e.target.value })}
              placeholder="Palavra-chave para descoberta organica"
            />
          </div>

          <div>
            <Label>Idioma da Legenda</Label>
            <Select value={config.language} onValueChange={(v) => updateConfig({ language: v as "pt-BR" | "en" })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="pt-BR">Portugues (BR)</SelectItem>
                <SelectItem value="en">English</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Tipo de Hook</Label>
            <Select value={config.hookType} onValueChange={(v) => updateConfig({ hookType: v as CarouselConfig["hookType"] })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="curiosity">Curiosidade</SelectItem>
                <SelectItem value="problem">Problema-Solucao</SelectItem>
                <SelectItem value="contrarian">Contrario</SelectItem>
                <SelectItem value="story">Historia</SelectItem>
                <SelectItem value="list">Lista/Numeros</SelectItem>
                <SelectItem value="question">Pergunta</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Tipo de CTA</Label>
            <Select value={config.ctaType} onValueChange={(v) => updateConfig({ ctaType: v as CarouselConfig["ctaType"] })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="save">Salvar</SelectItem>
                <SelectItem value="share">Compartilhar</SelectItem>
                <SelectItem value="comment">Comentar</SelectItem>
                <SelectItem value="dm">DM</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Instrucoes Adicionais</Label>
            <Textarea
              value={config.additionalInstructions}
              onChange={(e) => updateConfig({ additionalInstructions: e.target.value })}
              placeholder="Qualquer instrucao extra para a IA..."
              rows={3}
            />
          </div>
        </div>
      </div>

      <div className="flex justify-between">
        <Button variant="outline" onClick={prevStep}>
          <ArrowLeft className="mr-2 w-4 h-4" /> Voltar
        </Button>
        <Button onClick={nextStep} size="lg" disabled={analyzing || !analysis}>
          Gerar Carrossel <ArrowRight className="ml-2 w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

// Type import for inline usage
import type { CarouselConfig } from "@/lib/types";
