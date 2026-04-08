"use client";
import { create } from "zustand";
import type {
  UploadedImage,
  AnalysisResult,
  CarouselConfig,
  CarouselSlide,
  CaptionData,
  GenerationPhase,
} from "@/lib/types";

interface CarouselState {
  currentStep: number;
  uploadedImages: UploadedImage[];
  analysis: AnalysisResult | null;
  config: CarouselConfig;
  generationPhase: GenerationPhase;
  generationProgress: number;
  slides: CarouselSlide[];
  caption: CaptionData | null;

  setStep: (step: number) => void;
  nextStep: () => void;
  prevStep: () => void;
  addImages: (images: UploadedImage[]) => void;
  removeImage: (id: string) => void;
  setAnalysis: (analysis: AnalysisResult) => void;
  updateConfig: (partial: Partial<CarouselConfig>) => void;
  setGenerationPhase: (phase: GenerationPhase) => void;
  setGenerationProgress: (progress: number) => void;
  setSlides: (slides: CarouselSlide[]) => void;
  updateSlide: (id: string, partial: Partial<CarouselSlide>) => void;
  setCaption: (caption: CaptionData) => void;
  reset: () => void;
}

const defaultConfig: CarouselConfig = {
  audience: "",
  tone: "professional",
  goal: "product-launch",
  brandColors: ["#000000", "#FFFFFF"],
  slideCount: 5,
  format: "square",
  additionalInstructions: "",
  niche: "",
  language: "pt-BR",
  hookType: "curiosity",
  ctaType: "save",
  keywordSeo: "",
  fixedHashtags: [],
};

export const useCarouselStore = create<CarouselState>((set) => ({
  currentStep: 0,
  uploadedImages: [],
  analysis: null,
  config: defaultConfig,
  generationPhase: "idle",
  generationProgress: 0,
  slides: [],
  caption: null,

  setStep: (step) => set({ currentStep: step }),
  nextStep: () => set((s) => ({ currentStep: Math.min(s.currentStep + 1, 3) })),
  prevStep: () => set((s) => ({ currentStep: Math.max(s.currentStep - 1, 0) })),
  addImages: (images) =>
    set((s) => ({ uploadedImages: [...s.uploadedImages, ...images] })),
  removeImage: (id) =>
    set((s) => ({
      uploadedImages: s.uploadedImages.filter((img) => img.id !== id),
    })),
  setAnalysis: (analysis) => set({ analysis }),
  updateConfig: (partial) =>
    set((s) => ({ config: { ...s.config, ...partial } })),
  setGenerationPhase: (phase) => set({ generationPhase: phase }),
  setGenerationProgress: (progress) => set({ generationProgress: progress }),
  setSlides: (slides) => set({ slides }),
  updateSlide: (id, partial) =>
    set((s) => ({
      slides: s.slides.map((slide) =>
        slide.id === id ? { ...slide, ...partial } : slide
      ),
    })),
  setCaption: (caption) => set({ caption }),
  reset: () =>
    set({
      currentStep: 0,
      uploadedImages: [],
      analysis: null,
      config: defaultConfig,
      generationPhase: "idle",
      generationProgress: 0,
      slides: [],
      caption: null,
    }),
}));
