import type { LandingSectionType } from "@/types/schema.draft";

/** 单个可填文案槽位：path 为 draft 内定位路径，id 为其字符串形式。 */
export interface Slot {
  id: string;                 // 如 "hero.title" / "sections.2.data.items.0.q"
  path: (string | number)[];  // 与 id 对应的结构化路径
  label: string;              // 给模型的人类可读标签（取末段 key）
  text: string;               // 当前文案
}

/** 模型回填结果：按 id 给出新文案。 */
export interface FilledSlot {
  id: string;
  text: string;
}

/** 整页生成的引导表单输入。 */
export interface GenerationBrief {
  productName: string;
  description: string;
  targetAudience?: string;
  tone?: string;
  keyBenefits?: string[];
  ctaGoal?: string;
  language?: string;
  pastedIntro?: string;
  autoImages?: boolean; // 自动配图（Unsplash）；缺省视为开启
}

/** 区块改写请求。 */
export interface RewriteRequest {
  sectionType: LandingSectionType | "hero" | "footer";
  field: string;
  currentText: string;
  instruction?: string;
  brief?: Partial<GenerationBrief>;
}

export interface RewriteResult {
  candidates: string[];
}
