export const antiban = {
  meta: {
    title: "Anti-duplication — stop same-template pages from looking cloned | Zap Bridge",
    description:
      "Near-identical pages get flagged as duplicate content by ad platforms, bringing rejections and throttling. Zap Bridge builds anti-duplication into the Agency plan: your content stays exactly as written while the page's structural fingerprint is scattered, lowering the odds that same-template pages are judged duplicates — reshuffle any time in one click.",
    ogTitle: "Anti-duplication — stop same-template pages from looking cloned",
    ogDescription:
      "Same content, different structure. Scatter the structural fingerprint for advertisers running at scale, and lower the odds of a false duplicate-detection hit — this is not cloaking, it is a guardrail for legitimate advertisers.",
  },
  hero: {
    badge: "Agency anti-duplication",
    titleLine1: "One template, ten advertisers",
    titleLine2: "Don't let duplicate detection mistake you for a clone",
    subtitle:
      "The deepest fear in overseas paid acquisition isn't low volume — it's near-identical pages getting flagged as duplicates, throttled, or caught in a chain ban. Zap Bridge's anti-duplication engine gives every published page its own structural variant: content stays identical for everyone, while the odds of a duplicate-detection hit drop sharply.",
    ctaPrimary: "Start free",
    ctaSecondary: "See the Agency plan",
  },
  fears: {
    kicker: "// the cost of a shared template",
    title: "The moment you're flagged, the trouble comes in a chain",
    desc: "Starting from a ready-made template is efficiency — but when countless advertisers ship near-identical pages, platform similarity detection strings them together.",
    items: {
      review: {
        title: "Duplicate detection, ad rejected",
        desc: "Many advertisers reuse one template, so the generated HTML ends up nearly identical. Platform similarity detection reads it as low-quality duplicate content and rejects the ad outright.",
      },
      throttle: {
        title: "Throttling and demotion",
        desc: "Even after approval, a near-identical fingerprint drags down your quality score: impressions get suppressed, cost per action climbs, and budget burns on a throttled page while conversions never take off.",
      },
      chainBan: {
        title: "Account linkage and bans",
        desc: "Platforms treat pages with close fingerprints as the work of a single operator. One page gets flagged, and the pages that 'look like it' — along with their ad accounts — get shut down alongside it. This is the chain ban every media buyer dreads.",
      },
    },
  },
  mechanisms: {
    kicker: "// fingerprint scattering engine",
    title: "Same content, different structure",
    desc: "At publish time, the structural fingerprint is scattered deterministically from the page seed. If a page gets flagged or throttled, one click reshuffles it into a fresh structural variant.",
    items: {
      dom: {
        title: "DOM structure jitter",
        desc: "Semantically neutral wrapper layers are injected at section boundaries, changing the DOM tree shape and its serialized hash — zero visual side effects, while byte-level duplicate matching stops working.",
      },
      salt: {
        title: "Attribute and meta salting",
        desc: "Data attributes on section roots, generated class identifiers, and the order and presence of non-essential head meta all shift with the seed, scattering both attribute and page-head fingerprints.",
      },
      layout: {
        title: "Layout and hero variants",
        desc: "The same seed drives hero layout, spacing rhythm, and discrete swaps between equivalent Tailwind classes. A tested, finite variant set — enough to scatter perceptual hashes without breaking the design.",
      },
      deterministic: {
        title: "Deterministic, cacheable, reshufflable",
        desc: "The fingerprint derives purely from the seed: every render of a page is identical, so it stays cacheable with no hydration mismatch. If a page gets flagged, swap the seed in one click and scatter it again — your escape hatch.",
      },
    },
  },
  ethics: {
    title: "This isn't cloaking — it's a guardrail for legitimate advertisers",
    desc: "We do not differentiate content between review crawlers and real users. Anti-duplication operates only on the page's structural fingerprint layer, and never touches a single word of what you're telling your audience.",
    points: [
      "Real visitors and review crawlers are served exactly the same content — nothing hidden, swapped, or disguised.",
      "Only the markup and layout fingerprint that differs between advertisers is scattered; your copy, pricing, and assets stay exactly as you entered them.",
      "Built solely for legitimate non-transactional lead pages: so honest advertisers aren't mistaken for each other's clones just because they share a template.",
    ],
  },
  agencyCta: {
    title: "Anti-duplication is what makes the Agency plan hold up",
    desc: "Running at volume — many advertisers, many pages in parallel — the real risk is getting linked together and taken down as a group. Anti-duplication is built into the Agency plan: every published page carries its own structural variant and can be reshuffled at any time, lowering the risk that pages get associated and flagged in bulk.",
    ctaPrimary: "Explore the Agency plan",
    ctaSecondary: "Create a page free first",
  },
};
