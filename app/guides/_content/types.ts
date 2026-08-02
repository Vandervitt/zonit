// 获客指南内容模型：文章以结构化块描述，由 GuideArticleView 统一渲染（纯 Tailwind）。
// 内容与展示分离，新增/修改文章只改 _content/articles/*，不动组件。
// 块类型对 SEO/GEO 友好：list/table/faq 天然利于富媒体与 AI 摘要抽取；faq 块另生成 FAQPage 结构化数据。

export type GuideBlock =
  | { t: "p"; text: string }
  | { t: "list"; items: string[] }
  | { t: "steps"; items: { title: string; desc?: string }[] }
  | { t: "table"; head: string[]; rows: string[][] }
  | { t: "callout"; tone: "info" | "warning" | "success"; text: string }
  | { t: "faq"; items: { q: string; a: string }[] };

export interface GuideSection {
  /** 锚点 id（利于目录与深链） */
  id: string;
  heading: string;
  blocks: GuideBlock[];
}

export interface GuideArticle {
  slug: string;
  /** H1 + meta 标题基底 */
  title: string;
  /** meta description + 列表卡片 + Article.description（≤ ~155 字） */
  description: string;
  /** 目标关键词（仅内部备注 / 可选 meta，不强依赖） */
  keywords?: string[];
  /**
   * 所属行业（= tags.category 的 slug）。填了它，本文与对应行业页互相内链：
   * 文末 CTA 指向该行业页，行业页反向指回本文，形成「行业文 → 行业页 → 模板页」漏斗。
   * 值必须是注册表里真实存在的行业，由 guides-industry.test.ts 守护。
   */
  industry?: string;
  /**
   * 文末主 CTA 落点覆盖。缺省行为：有 industry 则指向该行业页，否则指向模板库。
   * 投放合规簇（簇 A）面向的是投手与代运营，他们读完要找的是反同质化能力，
   * 把他们丢进模板库是折损一次转化——故这类文章显式指向 /anti-ban。
   */
  ctaTarget?: "anti-ban";
  /** ISO 日期，用于 Article 结构化数据与展示 */
  datePublished: string;
  dateModified?: string;
  /** 首段导语 */
  intro: string;
  sections: GuideSection[];
  /** 官方参考资料（提升可信度 / E-E-A-T / GEO）；URL 须为核实过的真实官方来源。 */
  references?: { label: string; url: string }[];
}
