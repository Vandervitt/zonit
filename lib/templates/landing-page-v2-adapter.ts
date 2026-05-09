import type {
  AnyLandingPageTemplate,
  LandingPageDesignConfig,
  LandingPageTemplate,
  LandingPageTemplateV2,
  ModuleDefinition,
  ModuleLayoutConfig,
  OptionalBlock,
} from "@/types/schema";

const MODULE_LABELS: Record<string, string> = {
  Hero: "首屏主视觉",
  Offer: "咨询入口",
  HowItWorks: "联系流程",
  LeadForm: "表单线索",
  MicroFooter: "页脚",
  StickyCta: "全站浮动 CTA",
  Features: "服务卖点",
  Reviews: "用户评价",
  TrustBanner: "信任条",
  PainPoints: "痛点共鸣",
  LeadMagnet: "留资钩子",
  ProofCases: "证明案例",
  VisualGallery: "视觉图库",
  Metrics: "指标证明",
  LogoWall: "Logo 墙",
  AuthorityStory: "权威背书",
  FAQ: "常见问题",
  Countdown: "倒计时",
  Assurance: "服务承诺",
};

function moduleOf(module: Omit<ModuleDefinition, "enabled"> & { enabled?: boolean }): ModuleDefinition {
  return {
    enabled: true,
    label: MODULE_LABELS[module.type],
    ...module,
  };
}

function legacyDesign(template: LandingPageTemplate): LandingPageDesignConfig {
  return {
    mode: template.themeConfig.mode,
    palette: {
      primary: template.themeConfig.primaryColor,
      accent: template.themeConfig.accentColor,
    },
    typography: {
      family: template.themeConfig.fontFamily,
    },
    radius: template.themeConfig.borderRadius ?? "md",
    density: template.themeConfig.spacing ?? "normal",
    buttonStyle: "solid",
    imageStyle: "rounded",
  };
}

function legacyLayout(template: LandingPageTemplate): LandingPageTemplateV2["layout"] {
  const modules: Record<string, ModuleLayoutConfig> = {};

  if (template.hero.layout === "split") {
    modules.hero = { alignment: "left", mediaPosition: "right", height: "large" };
  } else {
    modules.hero = { alignment: "center", height: "large" };
  }

  return {
    pageWidth: "normal",
    sectionSpacing: template.themeConfig.spacing ?? "normal",
    modules,
    hero: modules.hero,
  };
}

export function isLandingPageTemplateV2(template: AnyLandingPageTemplate): template is LandingPageTemplateV2 {
  return "version" in template && template.version === 2 && "modules" in template && "content" in template;
}

export function toLandingPageTemplateV2(template: AnyLandingPageTemplate): LandingPageTemplateV2 {
  if (isLandingPageTemplateV2(template)) return template;
  if (template.schemaVersion === 2 && template.modules && template.content && template.design) {
    return {
      templateId: template.templateId,
      templateName: template.templateName,
      version: 2,
      pageMeta: template.pageMeta,
      primaryConversion: template.primaryConversion,
      modules: template.modules,
      content: template.content,
      design: template.design,
      layout: template.layout,
      integrations: template.integrations,
    };
  }

  const modules: ModuleDefinition[] = [
    moduleOf({ id: "hero", type: "Hero", contentKey: "hero", variant: template.hero.layout ?? "default" }),
  ];
  const content: LandingPageTemplateV2["content"] = {
    hero: template.hero,
    footer: template.footer,
  };

  if (template.offer) {
    modules.push(moduleOf({ id: "offer", type: "Offer", contentKey: "offer" }));
    content.offer = template.offer;
  }

  if (template.howItWorks) {
    modules.push(moduleOf({ id: "howItWorks", type: "HowItWorks", contentKey: "howItWorks" }));
    content.howItWorks = template.howItWorks;
  }

  for (const block of template.blocks ?? []) {
    modules.push(moduleOf({
      id: block.id,
      type: block.type,
      contentKey: block.id,
    }));
    content[block.id] = block.data;
  }

  if (template.leadForm) {
    modules.push(moduleOf({ id: "leadForm", type: "LeadForm", contentKey: "leadForm" }));
    content.leadForm = template.leadForm;
  }

  modules.push(moduleOf({ id: "footer", type: "MicroFooter", contentKey: "footer" }));

  if (template.stickyCta) {
    modules.push(moduleOf({ id: "stickyCta", type: "StickyCta", contentKey: "stickyCta" }));
    content.stickyCta = template.stickyCta;
  }

  return {
    templateId: template.templateId,
    templateName: template.templateName,
    version: 2,
    pageMeta: template.pageMeta,
    primaryConversion: template.primaryConversion,
    modules,
    content,
    design: legacyDesign(template),
    layout: legacyLayout(template),
    integrations: {
      leadFormId: template.leadForm?.id,
      analytics: template.pageMeta?.analytics,
    },
  };
}

export function toLegacyLandingPageTemplate(
  template: LandingPageTemplateV2,
  fallback: LandingPageTemplate,
): LandingPageTemplate {
  const optionalBlocks: OptionalBlock[] = [];

  for (const moduleConfig of template.modules) {
    const content = template.content[moduleConfig.contentKey];
    if (!moduleConfig.enabled || !content) continue;

    if (
      moduleConfig.type !== "Hero" &&
      moduleConfig.type !== "Offer" &&
      moduleConfig.type !== "HowItWorks" &&
      moduleConfig.type !== "LeadForm" &&
      moduleConfig.type !== "MicroFooter" &&
      moduleConfig.type !== "StickyCta"
    ) {
      optionalBlocks.push({
        id: moduleConfig.id,
        type: moduleConfig.type,
        data: content as OptionalBlock["data"],
      } as OptionalBlock);
    }
  }

  return {
    ...fallback,
    schemaVersion: 2,
    pageMeta: template.pageMeta,
    primaryConversion: template.primaryConversion,
    hero: (template.content.hero ?? fallback.hero) as LandingPageTemplate["hero"],
    offer: template.content.offer as LandingPageTemplate["offer"],
    howItWorks: template.content.howItWorks as LandingPageTemplate["howItWorks"],
    footer: (template.content.footer ?? fallback.footer) as LandingPageTemplate["footer"],
    blocks: optionalBlocks,
    leadForm: template.content.leadForm as LandingPageTemplate["leadForm"],
    stickyCta: template.content.stickyCta as LandingPageTemplate["stickyCta"],
    modules: template.modules,
    content: template.content,
    design: template.design,
    layout: template.layout,
    integrations: template.integrations,
    themeConfig: {
      mode: template.design.mode,
      primaryColor: template.design.palette.primary,
      accentColor: template.design.palette.accent,
      fontFamily: template.design.typography?.family,
      borderRadius: template.design.radius,
      spacing: template.design.density,
    },
  };
}

export function setModuleContent(
  template: LandingPageTemplateV2,
  module: ModuleDefinition,
  content: LandingPageTemplateV2["content"][string],
): LandingPageTemplateV2 {
  return {
    ...template,
    content: {
      ...template.content,
      [module.contentKey]: content,
    },
  };
}

export function setModuleLayout(
  template: LandingPageTemplateV2,
  moduleId: string,
  layout: ModuleLayoutConfig,
): LandingPageTemplateV2 {
  return {
    ...template,
    layout: {
      ...template.layout,
      modules: {
        ...template.layout?.modules,
        [moduleId]: layout,
      },
      [moduleId]: layout,
    },
  };
}
