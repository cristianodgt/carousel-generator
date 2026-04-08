import type { AnalysisResult, CarouselConfig } from "./types";

const HOOK_TEMPLATES = {
  curiosity: {
    'pt-BR': [
      'Ninguém fala sobre isso, mas...',
      'Isso mudou completamente como eu vejo {topic}...',
      'O verdadeiro motivo por trás de {topic} não é o que você pensa...',
    ],
    en: [
      'Nobody talks about this, but...',
      'This changed everything about how I see {topic}...',
      'The real reason behind {topic} isn\'t what you think...',
    ],
  },
  problem: {
    'pt-BR': [
      'Pare de cometer esse erro se você quer {outcome}',
      'Lutando com {topic}? Aqui está o que realmente funciona...',
      '{topic} está te custando {consequence}. Corrija agora.',
    ],
    en: [
      'Stop making this mistake if you want {outcome}',
      'Struggling with {topic}? Here\'s what actually works...',
      '{topic} is costing you {consequence}. Fix it now.',
    ],
  },
  contrarian: {
    'pt-BR': [
      '{belief} está na verdade prejudicando seu {outcome}',
      'Opinião impopular: {statement}',
      'Todo mundo diz {advice}. Aqui está por que estão errados...',
    ],
    en: [
      '{belief} is actually hurting your {outcome}',
      'Unpopular opinion: {statement}',
      'Everyone says {advice}. Here\'s why they\'re wrong...',
    ],
  },
  story: {
    'pt-BR': [
      'Há 3 anos, eu tomei uma decisão que mudou tudo...',
      'Eu quase desisti até perceber isso...',
      'Então, isso acabou de acontecer...',
    ],
    en: [
      'Three years ago, I made a decision that changed everything...',
      'I almost gave up until I realized this...',
      'So, this just happened...',
    ],
  },
  list: {
    'pt-BR': [
      '{number} erros que eu vejo com {topic}',
      '{number} sinais de que seu {thing} não está funcionando',
      '{number} coisas que eu gostaria de saber antes sobre {topic}',
    ],
    en: [
      '{number} mistakes I see with {topic}',
      '{number} signs your {thing} isn\'t working',
      '{number} things I wish I knew earlier about {topic}',
    ],
  },
  question: {
    'pt-BR': [
      'E se {assumption} estivesse completamente errada?',
      'Sim ou não: {statement}?',
      'Por que ninguém fala sobre {topic}?',
    ],
    en: [
      'What if {assumption} was completely wrong?',
      'Yes or no: {statement}?',
      'Why does nobody talk about {topic}?',
    ],
  },
};

const CTA_TEMPLATES = {
  save: {
    'pt-BR': 'Salve esse post para consultar depois',
    en: 'Save this post for later',
  },
  share: {
    'pt-BR': 'Envie para alguém que precisa ver isso',
    en: 'Send this to someone who needs to see it',
  },
  comment: {
    'pt-BR': 'Comente qual dica vai aplicar primeiro',
    en: 'Comment which tip you\'ll try first',
  },
  dm: {
    'pt-BR': 'Mande "QUERO" no DM para receber o material completo',
    en: 'DM "WANT" to get the full guide',
  },
};

const FORMULAS = [
  'value-packed',
  'relatable',
  'behind-the-scenes',
  'urgency',
  'carousel-specific',
  'mini-blog',
  'quick-engagement',
] as const;

export function buildCaptionPrompt(
  analysis: AnalysisResult,
  config: CarouselConfig,
  slideContents: { title: string; body: string }[]
): string {
  const lang = config.language || 'pt-BR';
  const hookExamples = HOOK_TEMPLATES[config.hookType]?.[lang] || HOOK_TEMPLATES.curiosity[lang];
  const ctaTemplate = CTA_TEMPLATES[config.ctaType]?.[lang] || CTA_TEMPLATES.save[lang];

  return `You are an expert Instagram content strategist specialized in organic growth. Generate a complete, ready-to-post Instagram caption for a carousel post.

## Context
- Business category: ${analysis.category}
- Products/Items: ${analysis.products.join(', ')}
- Target audience: ${config.audience}
- Tone: ${config.tone}
- Niche: ${config.niche || analysis.category}
- SEO Keyword: ${config.keywordSeo || analysis.category}
- Language: ${lang === 'pt-BR' ? 'Brazilian Portuguese' : 'English'}

## Carousel Content Summary
${slideContents.map((s, i) => `Slide ${i + 1}: ${s.title} - ${s.body}`).join('\n')}

## Caption Structure (HVC Formula)
Follow this EXACT structure:

1. **HOOK** (first line, max 10 words) - This is the most critical line. It must stop the scroll. Use one of these patterns as inspiration:
${hookExamples.map(h => `   - "${h}"`).join('\n')}

2. **CONTEXT** (1 sentence expanding the hook, include the keyword "${config.keywordSeo || analysis.category}" naturally)

3. **VALUE BLOCK** (2-4 sentences delivering the promise of the carousel content, summarize key points)

4. **PRIMARY CTA** targeting ${config.ctaType}: "${ctaTemplate}"

5. **SECONDARY CTA** (optional, for comments/engagement)

6. **HASHTAGS** (3-5 total, MAX 5):
   - 2 niche-specific hashtags for "${config.niche || analysis.category}"
   - 1-2 topic-specific hashtags
   ${config.fixedHashtags?.length ? `- Always include these brand hashtags: ${config.fixedHashtags.join(' ')}` : ''}

## CRITICAL RULES FOR ORGANIC GROWTH
- Saves and shares matter MORE than likes for algorithm distribution
- Instagram limits to 5 hashtags MAX (since Dec 2025)
- Keywords IN the caption matter more than hashtags for discovery
- Instagram content is indexed by Google since Jul 2025 - SEO matters
- Carousels have 1.92% avg engagement - the algorithm re-shows them to people who didn't swipe
- Hooks determine in 1.7 seconds if users engage or scroll past
- Specific CTAs generate 3x more action than generic ones
- Use line breaks every 1-2 sentences for readability
- 3-5 emojis max, avoid in hook line

## Output Format
Return a JSON object with these fields:
{
  "hook": "the hook line",
  "context": "the context sentence",
  "valueBlock": "the value block (use \\n for line breaks)",
  "ctaPrimary": "primary CTA",
  "ctaSecondary": "secondary CTA",
  "hashtags": ["#tag1", "#tag2", "#tag3"],
  "fullCaption": "the complete caption formatted and ready to copy-paste (with line breaks as \\n)"
}

Return ONLY valid JSON, no markdown fences.`;
}
