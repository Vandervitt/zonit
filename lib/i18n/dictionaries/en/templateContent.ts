// 模板详情页的派生内容句式。`{name}` / `{industry}` / `{archetype}` / `{conversion}`
// 会被替换为该模板的实际值，使每页文案天然不同。
export const templateContent = {
  sectionHero: "Hero",
  sectionLeadForm: "Lead capture form",
  /**
   * 编辑器区块标签（SECTION_REGISTRY 的 label 仅有中文）→ 英文展示名。
   * 缺键回退原 label，新增区块不会渲染成空白。
   */
  sectionLabels: {
    数据展示: "Stats",
    套餐: "Plans",
    产品: "Products",
    前后对比: "Before & after",
    服务流程: "Process",
    信任: "Trust signals",
    特性: "Features",
    评价: "Reviews",
    产品故事: "Brand story",
    倒计时: "Countdown",
    常见问题: "FAQ",
    安全保障: "Guarantee",
  } as Record<string, string | undefined>,

  detailMeta: {
    title: "{name} — {industry} lead-gen landing page template | Zap Bridge",
    description:
      "{tagline} {conversion} capture, ad-ready structure, and a compliant footer out of the box — swap the content, connect your own brand domain, and publish in minutes.",
  },

  introFallback:
    "{name} is a {archetype} landing page template for {industry}, where visitors complete their inquiry over {conversion}. Ad-ready structure and a compliant footer come out of the box — pick it, swap the content, connect your own brand domain, and publish.",

  whoFor:
    "Built for advertisers and agencies running {industry} lead generation overseas and capturing inquiries over {conversion} — a particularly good fit for {archetype} campaigns.",

  howToUse: [
    {
      step: "Pick the template",
      detail: "Click “Start with this template” and {name} loads into the editor as your starting draft.",
    },
    {
      step: "Edit content · connect a domain",
      detail:
        "Swap the copy, images, and selling points, configure the CTA and lead capture form, then connect your own brand domain.",
    },
    {
      step: "Publish and run ads",
      detail:
        "Publish in one click — DNS and the HTTPS certificate are configured for you. Connect your pixels and conversion forwarding, and you're ready to drive traffic.",
    },
  ],

  faqs: [
    {
      q: "Can I change anything in the {name} template?",
      a: "Yes. Copy, images, colours, and section order can all be swapped in the visual editor to match your own brand and selling points — no code required.",
    },
    {
      q: "How do visitors reach me and leave their details?",
      a: "This template captures leads over {conversion}: a visitor taps the CTA on the landing page to start a {conversion} conversation or submit the form, and the lead lands in your dashboard.",
    },
    {
      q: "Is publishing to my own domain complicated?",
      a: "Not at all. Pick the template, edit the content, then connect your own brand domain — DNS and the HTTPS certificate are configured automatically, and you're live in minutes.",
    },
    {
      q: "Is running ads to this template compliant?",
      a: "The template ships with a compliant footer (privacy policy and terms links) and stays non-transactional as a lead-gen page. Agency plans add anti-duplication, lowering the odds that same-template pages get flagged as duplicates by ad platforms.",
    },
  ],
};
