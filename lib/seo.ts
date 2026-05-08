import OpenAI from "openai";
import type {
  LandingPageTemplate,
  OptionalBlock,
  SeoMeta,
} from "@/types/schema";

type GeneratedSeo = Pick<
  SeoMeta,
  "title" | "description" | "ogTitle" | "ogDescription"
>;

interface GenerateSeoOptions {
  canonicalUrl: string;
}

const LEAD_LANGUAGE_REPLACEMENTS: Array<[RegExp, string]> = [
  [/\bbuy\b/gi, "contact"],
  [/\border\b/gi, "request"],
  [/\bcheckout\b/gi, "contact"],
  [/\bpayment\b/gi, "consultation"],
  [/\brefund\b/gi, "support"],
  [/\bcash on delivery\b/gi, "contact support"],
  [/\bpricing\b/gi, "consultation"],
];

const SYSTEM_PROMPT = `You generate SEO metadata for overseas lead-generation landing pages.

Return a JSON object with exactly these string keys:
- title
- description
- ogTitle
- ogDescription

Rules:
- The page goal is lead generation: contact, consultation, quote, booking, WhatsApp, Telegram, phone, email, or form submission.
- Do not write ecommerce, payment, checkout, order, cart, subscription, refund, or cash-on-delivery copy.
- Do not invent ratings, reviews, media logos, certifications, guarantees, or locations.
- Keep title under 60 characters when possible.
- Keep description under 155 characters when possible.
- Use natural search-result copy for humans, not keyword stuffing.`;

const allBlocks = (template: LandingPageTemplate): OptionalBlock[] => [
  ...(template.blocks ?? []),
];

function cleanText(value: string | undefined): string {
  if (!value) return "";
  return LEAD_LANGUAGE_REPLACEMENTS.reduce(
    (text, [pattern, replacement]) => text.replace(pattern, replacement),
    value.replace(/\s+/g, " ").trim(),
  );
}

function limit(value: string, max: number): string {
  const text = cleanText(value);
  if (text.length <= max) return text;
  return text.slice(0, max - 1).trimEnd();
}

function firstNonEmpty(...values: Array<string | undefined>): string {
  return values.map(cleanText).find(Boolean) ?? "";
}

function findOgImage(template: LandingPageTemplate): string | undefined {
  if (template.hero.media?.type === "image") return template.hero.media.src;
  if (template.hero.background.type === "image") return template.hero.background.value;

  for (const option of template.offer?.options ?? []) {
    if (option.image) return option.image;
  }

  for (const block of allBlocks(template)) {
    if (block.type === "AuthorityStory" && block.data.image?.src) return block.data.image.src;
    if (block.type === "Reviews") {
      const image = block.data.items.find(item => item.proofImage)?.proofImage;
      if (image) return image;
    }
  }

  return undefined;
}

function summarizeTemplate(template: LandingPageTemplate) {
  const blocks = allBlocks(template);
  const faq = blocks.find(block => block.type === "FAQ");
  const features = blocks.find(block => block.type === "Features");

  return {
    brandName: template.footer.brandName,
    locale: template.pageMeta?.locale,
    market: template.pageMeta?.market,
    hero: {
      title: template.hero.title,
      subtitle: template.hero.subtitle,
      badge: template.hero.badge,
      cta: template.hero.cta.text,
      stats: template.hero.stats?.map(item => item.value ? `${item.value} ${item.label}` : item.label).slice(0, 4),
    },
    offer: template.offer ? {
      title: template.offer.title,
      subtitle: template.offer.subtitle,
      options: template.offer.options.slice(0, 3).map(option => ({
        name: option.name,
        description: option.description,
        valueProps: option.valueProps.slice(0, 4),
        cta: option.cta.text,
      })),
    } : undefined,
    howItWorks: template.howItWorks?.steps.slice(0, 3).map(step => ({
      title: step.title,
      description: step.description,
    })),
    features: features?.type === "Features"
      ? features.data.items.slice(0, 6).map(item => ({
          title: item.title,
          description: item.description,
        }))
      : undefined,
    leadForm: template.leadForm
      ? {
          title: template.leadForm.title,
          submitText: template.leadForm.submitText,
        }
      : undefined,
    faq: faq?.type === "FAQ"
      ? faq.data.items.slice(0, 4).map(item => item.question)
      : undefined,
  };
}

function fallbackSeo(template: LandingPageTemplate): GeneratedSeo {
  const brandName = cleanText(template.footer.brandName);
  const heroTitle = cleanText(template.hero.title);
  const offerTitle = cleanText(template.offer?.title);
  const primaryAction = firstNonEmpty(
    template.hero.cta.text,
    template.offer?.options[0]?.cta.text,
    "Contact us",
  );
  const title = limit(
    brandName && heroTitle ? `${brandName} | ${heroTitle}` : firstNonEmpty(heroTitle, offerTitle, brandName),
    60,
  );
  const description = limit(
    firstNonEmpty(
      `${template.hero.subtitle} ${primaryAction}.`,
      `${offerTitle}. Contact ${brandName} for consultation.`,
    ),
    155,
  );

  return {
    title,
    description,
    ogTitle: limit(firstNonEmpty(heroTitle, title), 70),
    ogDescription: limit(firstNonEmpty(template.hero.subtitle, description), 180),
  };
}

function parseGeneratedSeo(raw: string): GeneratedSeo | null {
  const parsed = JSON.parse(raw) as Partial<Record<keyof GeneratedSeo, unknown>>;
  if (
    typeof parsed.title !== "string" ||
    typeof parsed.description !== "string" ||
    typeof parsed.ogTitle !== "string" ||
    typeof parsed.ogDescription !== "string"
  ) {
    return null;
  }

  return {
    title: limit(parsed.title, 70),
    description: limit(parsed.description, 170),
    ogTitle: limit(parsed.ogTitle, 80),
    ogDescription: limit(parsed.ogDescription, 200),
  };
}

async function generateAiSeo(template: LandingPageTemplate): Promise<GeneratedSeo | null> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;

  const client = new OpenAI({ apiKey });
  const response = await client.chat.completions.create({
    model: "gpt-4o-mini",
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      {
        role: "user",
        content: JSON.stringify(summarizeTemplate(template)),
      },
    ],
  });

  const raw = response.choices[0]?.message?.content;
  return raw ? parseGeneratedSeo(raw) : null;
}

export async function generateSeoMeta(
  template: LandingPageTemplate,
  options: GenerateSeoOptions,
): Promise<SeoMeta> {
  const ogImage = findOgImage(template);
  const fallback = fallbackSeo(template);

  try {
    const aiSeo = await generateAiSeo(template);
    if (aiSeo) {
      return {
        ...aiSeo,
        canonicalUrl: options.canonicalUrl,
        ogImage,
        robots: "index,follow",
        generatedAt: new Date().toISOString(),
      };
    }
  } catch {
    // Publishing should never fail because SEO generation failed.
  }

  return {
    ...fallback,
    canonicalUrl: options.canonicalUrl,
    ogImage,
    robots: "index,follow",
    generatedAt: new Date().toISOString(),
  };
}

export async function withGeneratedSeo(
  template: LandingPageTemplate,
  options: GenerateSeoOptions,
): Promise<LandingPageTemplate> {
  const seo = await generateSeoMeta(template, options);
  return {
    ...template,
    pageMeta: {
      ...template.pageMeta,
      seo,
    },
  };
}
