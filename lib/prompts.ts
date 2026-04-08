import type { AnalysisResult, CarouselConfig } from "./types";

export const ANALYSIS_PROMPT = `You are an expert visual analyst for social media marketing. Analyze these images carefully and return a JSON object with the following fields:

{
  "products": ["array of specific product/item descriptions seen in the images"],
  "dominantColors": ["array of hex color codes (#RRGGBB) of the 3-5 most prominent colors"],
  "mood": "overall mood/feeling (e.g. 'warm and inviting', 'modern and sleek', 'playful and vibrant')",
  "category": "business category (e.g. 'food & restaurant', 'fashion', 'beauty', 'tech', 'fitness', 'home decor', 'services')",
  "suggestedAudience": "ideal target audience description",
  "suggestedGoal": "best carousel goal for this content",
  "rawDescription": "detailed description of what you see across all images"
}

Be specific about visual details, textures, and brand elements. Return ONLY valid JSON, no markdown fences.`;

export function buildContentPrompt(analysis: AnalysisResult, config: CarouselConfig): string {
  const formatDimensions = config.format === 'square' ? '1080x1080 (1:1)' : '1080x1350 (4:5)';

  return `You are an expert social media content strategist and visual designer. Based on the analysis of uploaded images and user configuration, create a complete carousel plan.

## Image Analysis Context
- Products/Items: ${analysis.products.join(', ')}
- Dominant Colors: ${analysis.dominantColors.join(', ')}
- Mood: ${analysis.mood}
- Category: ${analysis.category}

## User Configuration
- Target Audience: ${config.audience}
- Tone: ${config.tone}
- Goal: ${config.goal}
- Brand Colors: ${config.brandColors.join(', ')}
- Number of Slides: ${config.slideCount}
- Format: ${formatDimensions}
- Additional Instructions: ${config.additionalInstructions || 'None'}

## Instructions
Generate a JSON array of ${config.slideCount} slide objects. Each slide must have:

1. **title**: Short, impactful title for the slide (max 6 words). This will be overlaid on the image.
2. **body**: Supporting text (max 20 words). This will be overlaid on the image.
3. **cta**: Call-to-action text for the last slide only (max 4 words), empty string for other slides.
4. **imagePrompt**: A DETAILED structured prompt for generating the slide image using Gemini image generation. Follow the 7-component formula:

For each imagePrompt, write it as a JSON object with these fields:
- instruction: One-line description of the scene
- subject: What appears in the image (specific details, materials, textures)
- scene: Setting, key elements, background, foreground
- lighting: Light source, direction, quality, color temperature
- composition: Shot type (close-up, wide, overhead), camera angle
- mood: Atmosphere and feeling
- color_palette: Use the brand colors: ${config.brandColors.join(', ')}
- style: "${config.tone}" aesthetic, modern social media design
- negative: "sharp focus throughout, clean composition, professional quality"

IMPORTANT RULES for imagePrompt:
- Do NOT include any text in the image description - text is overlaid separately
- Do NOT use keywords like "4K", "8K", "masterpiece", "best quality", "trending on ArtStation"
- Use specific sensory details (textures, materials, temperatures)
- Each slide should feel connected but distinct
- Maintain visual consistency across all slides
- Use narrative prose, not comma-separated tags
- Max 200 words per imagePrompt

## Slide Structure Guidelines
- Slide 1: Hook/Cover - Most attention-grabbing, establishes the topic
- Slides 2-${config.slideCount - 1}: Value delivery - Each slide = one key point
- Slide ${config.slideCount}: CTA - Call to action, conclusion

Return ONLY a valid JSON array, no markdown fences. Example format:
[{"slideNumber": 1, "title": "...", "body": "...", "cta": "", "imagePrompt": "..."}]`;
}

export function buildImageGenPrompt(imagePromptJson: string, brandColors: string[], format: 'square' | 'portrait'): string {
  const aspectRatio = format === 'square' ? '1:1' : '4:5';

  return `Generate a professional social media carousel slide image based on this creative brief:

${imagePromptJson}

Technical requirements:
- Aspect ratio: ${aspectRatio}
- Brand color palette: ${brandColors.join(', ')}
- Style: Modern, clean, professional social media design
- The image must have NO text, NO letters, NO words, NO numbers rendered in it
- Leave space at the bottom third for text overlay (slightly darker/gradient area)
- Sharp focus throughout, clean composition
- Professional quality suitable for Instagram

Generate the image now.`;
}
