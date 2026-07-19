// 帮助中心内容模型：章节以结构化数据描述，由 HelpChapter 统一渲染。
// 内容与展示分离，新增/修改帮助内容只改 _content/chapters/*，不动组件。

export type HelpBlock =
  | { t: "p"; text: string }
  | { t: "list"; items: string[] }
  | { t: "steps"; items: { title: string; desc?: string }[] }
  | { t: "table"; head: string[]; rows: string[][] }
  | { t: "callout"; tone: "info" | "warning" | "success"; text: string }
  | { t: "faq"; items: { q: string; a: string }[] };

export interface HelpSection {
  id: string;
  heading: string;
  blocks: HelpBlock[];
}

export interface HelpChapterData {
  slug: string;
  /** 侧边目录与页面标题 */
  title: string;
  /** 概览页卡片上的一句话简介 */
  summary: string;
  intro?: string;
  sections: HelpSection[];
}
