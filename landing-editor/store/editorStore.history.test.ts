import { describe, it, expect } from "vitest";
import { historyReducer, initHistory, type HistoryState } from "./editorStore";
import { fromDraft } from "../sampleDraft";
import type { LandingPageDraft } from "@/types/schema.draft";

const draft: LandingPageDraft = {
  hero: { title: "T0", cta: { text: "C", link: "https://wa.me/1" } },
  sections: [],
  footer: {
    brandName: "B",
    copyrightYear: "2026",
    contactEmail: "hi@a.com",
    privacyPolicy: "p",
    termsOfService: "t",
  },
};

function setup(): HistoryState {
  return initHistory(fromDraft(draft));
}

/** 派发一次 hero 标题修改（now 控制合并窗口判定）。 */
function editTitle(h: HistoryState, title: string, now: number): HistoryState {
  return historyReducer(h, { kind: "updateHero", value: { ...h.present.hero, title } }, now);
}

describe("historyReducer 撤销/重做", () => {
  it("内容修改入历史，undo 回到上一版，redo 前进", () => {
    let h = setup();
    h = editTitle(h, "T1", 0);
    h = editTitle(h, "T2", 5000);
    expect(h.present.hero.title).toBe("T2");

    h = historyReducer(h, { kind: "undo" }, 10_000);
    expect(h.present.hero.title).toBe("T1");
    h = historyReducer(h, { kind: "undo" }, 10_000);
    expect(h.present.hero.title).toBe("T0");
    h = historyReducer(h, { kind: "redo" }, 10_000);
    expect(h.present.hero.title).toBe("T1");
  });

  it("无可撤销/重做时为 no-op", () => {
    let h = setup();
    expect(historyReducer(h, { kind: "undo" }, 0)).toBe(h);
    expect(historyReducer(h, { kind: "redo" }, 0)).toBe(h);
    h = editTitle(h, "T1", 0);
    h = historyReducer(h, { kind: "undo" }, 5000);
    expect(historyReducer(h, { kind: "undo" }, 5000)).toBe(h);
  });

  it("select 不产生历史记录", () => {
    let h = setup();
    h = editTitle(h, "T1", 0);
    h = historyReducer(h, { kind: "select", id: "footer" }, 5000);
    expect(h.present.selectedId).toBe("footer");
    h = historyReducer(h, { kind: "undo" }, 5000);
    expect(h.present.hero.title).toBe("T0"); // 撤销跳过 select，直接回内容上一版
  });

  it("新修改清空 redo 栈", () => {
    let h = setup();
    h = editTitle(h, "T1", 0);
    h = historyReducer(h, { kind: "undo" }, 5000);
    h = editTitle(h, "T1b", 10_000);
    expect(historyReducer(h, { kind: "redo" }, 10_000)).toBe(h); // redo 已被清空
    expect(h.present.hero.title).toBe("T1b");
  });

  it("同目标连续输入在合并窗口内不堆叠历史（一次 undo 回到输入前）", () => {
    let h = setup();
    h = editTitle(h, "T", 0);
    h = editTitle(h, "Ty", 200);
    h = editTitle(h, "Typ", 400);
    h = historyReducer(h, { kind: "undo" }, 1000);
    expect(h.present.hero.title).toBe("T0");
  });

  it("超出合并窗口的同目标修改各自入历史", () => {
    let h = setup();
    h = editTitle(h, "T1", 0);
    h = editTitle(h, "T2", 5000); // 窗口外
    h = historyReducer(h, { kind: "undo" }, 10_000);
    expect(h.present.hero.title).toBe("T1");
  });

  it("replaceDraft（AI 一键成页）入历史，可一步撤销恢复原内容", () => {
    let h = setup();
    const generated: LandingPageDraft = { ...draft, hero: { ...draft.hero, title: "AI Generated" } };
    h = historyReducer(h, { kind: "replaceDraft", draft: generated }, 0);
    expect(h.present.hero.title).toBe("AI Generated");
    h = historyReducer(h, { kind: "undo" }, 5000);
    expect(h.present.hero.title).toBe("T0");
  });

  it("历史容量封顶 50，溢出丢最旧", () => {
    let h = setup();
    for (let i = 1; i <= 60; i++) h = editTitle(h, `T${i}`, i * 5000); // 全部窗口外
    expect(h.past.length).toBe(50);
    for (let i = 0; i < 100; i++) h = historyReducer(h, { kind: "undo" }, 999_999);
    expect(h.present.hero.title).toBe("T10"); // 最旧 10 条已被丢弃
  });
});
