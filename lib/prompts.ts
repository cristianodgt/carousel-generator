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
4. **imagePrompt**: A DETAILED description of how to enhance and style this slide's photo. Think of it as a photo retouching and styling brief.

For each imagePrompt, describe:
- Which reference photo to use: Specify which uploaded image/pose to feature (distribute evenly across slides - use ALL uploaded images, not just 1-2)
- Enhancement: How to improve lighting (studio softbox, rim light, natural window light), color grading (warm, cool, vibrant)
- Background: How to clean/improve the background (blur, replace with clean studio backdrop, simplify)
- Styling: Any styling changes (better composition, crop, angle, props)
- Mood: "${config.tone}" aesthetic feel
- Color accent: How to subtly incorporate brand colors ${config.brandColors.join(', ')}

IMPORTANT RULES for imagePrompt:
- Each slide must feature a DIFFERENT reference photo/look — distribute ALL uploaded images across slides
- Describe photo enhancements, not graphic designs
- Do NOT include any text, letters, words or numbers in the image
- Focus on making the photos look like professional studio/editorial shots
- Max 150 words per imagePrompt

## Slide Structure Guidelines
- Slide 1: Hook/Cover - Most attention-grabbing, establishes the topic
- Slides 2-${config.slideCount - 1}: Value delivery - Each slide = one key point
- Slide ${config.slideCount}: CTA - Call to action, conclusion

Return ONLY a valid JSON array, no markdown fences. Example format:
[{"slideNumber": 1, "title": "...", "body": "...", "cta": "", "imagePrompt": "..."}]`;
}

export function buildImageGenPrompt(imagePromptJson: string, brandColors: string[], format: 'square' | 'portrait'): string {
  const aspectRatio = format === 'square' ? '1:1' : '4:5';

  return `You are a professional photo retoucher. Your job is to ENHANCE the reference photo provided.

Creative brief:
${imagePromptJson}

CRITICAL RULES — DO NOT VIOLATE:
1. KEEP THE EXACT SAME PERSON from the reference photo. Do NOT change the person's face, body type, skin color, hair, ethnicity, age, or any physical features. The person in the output MUST be identical to the person in the reference photo.
2. KEEP THE EXACT SAME CLOTHING AND ACCESSORIES. Do NOT change, modify, or replace any clothing items, colors, patterns, fabrics, shoes, bags, or accessories. These are products for sale — they must appear exactly as in the original photo.
3. This is a PHOTO ENHANCEMENT job, not a replacement or recreation. You are retouching the existing photo, not generating a new one.

ENHANCEMENT INSTRUCTIONS:
- Improve lighting to simulate professional studio softbox lighting
- Enhance color grading: richer, more vibrant colors while keeping natural skin tones
- Clean and simplify the background (soft blur or clean studio backdrop)
- Improve overall composition and framing
- Subtle professional retouching (reduce distractions, enhance details)
- Brand color accents: ${brandColors.join(', ')} — subtly incorporate in environment/props
- Aspect ratio: ${aspectRatio}
- Make it look like a professional fashion/product editorial shoot
- Do NOT add any text, letters, words, or numbers to the image
- Keep the bottom 25% slightly darker (subtle gradient) for text overlay space

REMEMBER: The person MUST remain exactly the same. Same face, same body, same features. Only enhance the photo quality.

Generate the enhanced photo now.`;
}
