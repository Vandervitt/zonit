// landing-editor/sampleDraft.ts
// 编辑器初始种子：一个结构有效（含 core-value 组成员 features）的 LandingPageDraft。
import type { LandingSection } from "@/types/schema.draft";
import type { EditorState } from "./store/editorStore";
import { withKeys } from "./store/editorStore";
import { createHero, createFooter } from "./store/defaults";

export function createInitialState(): EditorState {
  const sections: LandingSection[] = [
    {
      type: "features",
      data: {
        title: "为什么选择我们",
        subtitle: "三个核心理由",
        items: [
          { icon: "✨", title: "专业团队", description: "10 年行业经验，快速响应你的咨询。" },
          { icon: "⚡", title: "极速响应", description: "10 分钟内回复，不错过每个机会。" },
        ],
      },
    },
    {
      type: "faq",
      data: {
        title: { icon: "❓", text: "常见问题" },
        items: [{ question: "如何开始？", answer: "点击咨询按钮，与我们的顾问聊一聊。" }],
      },
    },
  ];

  return {
    hero: createHero(),
    footer: createFooter(),
    floatingButton: null,
    sections: withKeys(sections),
    selectedId: "hero",
  };
}
