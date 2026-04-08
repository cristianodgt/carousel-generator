"use client";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Copy, Check, RefreshCw, Loader2, MessageSquare } from "lucide-react";
import type { CaptionData, AnalysisResult, CarouselConfig } from "@/lib/types";

interface CaptionEditorProps {
  caption: CaptionData;
  onUpdate: (caption: CaptionData) => void;
  analysis: AnalysisResult;
  config: CarouselConfig;
  slideContents: { title: string; body: string }[];
}

export function CaptionEditor({ caption, onUpdate, analysis, config, slideContents }: CaptionEditorProps) {
  const [copied, setCopied] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editText, setEditText] = useState(caption.fullCaption);

  async function handleCopy() {
    await navigator.clipboard.writeText(caption.fullCaption);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleRegenerate() {
    setRegenerating(true);
    try {
      const res = await fetch("/api/generate-caption", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ analysis, config, slideContents }),
      });
      if (res.ok) {
        const { caption: newCaption } = await res.json();
        onUpdate(newCaption);
        setEditText(newCaption.fullCaption);
      }
    } catch {
      // Keep existing
    } finally {
      setRegenerating(false);
    }
  }

  function handleSaveEdit() {
    onUpdate({ ...caption, fullCaption: editText });
    setEditMode(false);
  }

  const charCount = caption.fullCaption.length;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <MessageSquare className="w-5 h-5" /> Legenda para Instagram
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="outline">{charCount} chars</Badge>
            <Badge variant="outline">{caption.hashtags.length} hashtags</Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Preview da primeira linha (como aparece no feed) */}
        <div className="bg-muted rounded-lg p-3">
          <p className="text-xs text-muted-foreground mb-1">Preview no feed (primeira linha visivel):</p>
          <p className="font-medium text-sm">{caption.hook}</p>
          <p className="text-xs text-muted-foreground">...mais</p>
        </div>

        {/* Full caption */}
        {editMode ? (
          <div className="space-y-2">
            <Textarea
              value={editText}
              onChange={(e) => setEditText(e.target.value)}
              rows={12}
              className="font-mono text-sm"
            />
            <div className="flex gap-2">
              <Button size="sm" onClick={handleSaveEdit}>Salvar</Button>
              <Button size="sm" variant="outline" onClick={() => { setEditMode(false); setEditText(caption.fullCaption); }}>
                Cancelar
              </Button>
            </div>
          </div>
        ) : (
          <div
            onClick={() => setEditMode(true)}
            className="bg-background border rounded-lg p-4 cursor-text hover:border-primary/50 transition-colors"
          >
            <pre className="whitespace-pre-wrap text-sm font-sans leading-relaxed">
              {caption.fullCaption}
            </pre>
          </div>
        )}

        {/* Hashtags */}
        <div className="flex flex-wrap gap-2">
          {caption.hashtags.map((tag) => (
            <Badge key={tag} variant="secondary" className="text-xs">
              {tag}
            </Badge>
          ))}
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Button onClick={handleCopy} variant="default" className="flex-1">
            {copied ? (
              <>
                <Check className="w-4 h-4 mr-2" /> Copiado!
              </>
            ) : (
              <>
                <Copy className="w-4 h-4 mr-2" /> Copiar Legenda
              </>
            )}
          </Button>
          <Button onClick={handleRegenerate} variant="outline" disabled={regenerating}>
            {regenerating ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
