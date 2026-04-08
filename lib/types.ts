export interface UploadedImage {
  id: string;
  base64: string;
  mimeType: string;
  filename: string;
  previewUrl: string;
}

export interface AnalysisResult {
  products: string[];
  dominantColors: string[];
  mood: string;
  category: string;
  suggestedAudience: string;
  suggestedGoal: string;
  rawDescription: string;
}

export interface CarouselConfig {
  audience: string;
  tone: 'professional' | 'playful' | 'luxury' | 'educational' | 'minimal' | 'bold';
  goal: 'product-launch' | 'testimonial' | 'educational' | 'behind-the-scenes' | 'promotion' | 'storytelling';
  brandColors: string[];
  slideCount: number;
  format: 'square' | 'portrait';
  additionalInstructions: string;
  // Caption config
  niche: string;
  language: 'pt-BR' | 'en';
  hookType: 'curiosity' | 'problem' | 'contrarian' | 'story' | 'list' | 'question';
  ctaType: 'save' | 'share' | 'comment' | 'dm';
  keywordSeo: string;
  fixedHashtags: string[];
}

export interface CarouselSlide {
  id: string;
  slideNumber: number;
  title: string;
  body: string;
  cta: string;
  imagePrompt: string;
  generatedImageBase64: string | null;
  composedImageBase64: string | null;
  status: 'pending' | 'generating' | 'done' | 'error';
}

export interface CaptionData {
  hook: string;
  context: string;
  valueBlock: string;
  ctaPrimary: string;
  ctaSecondary: string;
  hashtags: string[];
  fullCaption: string;
}

export type Format = 'square' | 'portrait';
export type GenerationPhase = 'idle' | 'analyzing' | 'generating-text' | 'generating-images' | 'composing' | 'generating-caption' | 'done' | 'error';
