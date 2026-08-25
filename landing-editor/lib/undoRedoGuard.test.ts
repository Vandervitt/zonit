// 复现：AI 一键成页弹窗（antd Modal）内的表单字段不是编辑器 draft 的一部分，
// 但 EditorToolbar 的 Cmd/Ctrl+Z 监听挂在 window 上、不看事件目标，弹窗内任何一次
// Cmd/Ctrl+Z（哪怕只是想撤销打字）都会被拦截并转发成编辑器整页 undo，把上一次
// replaceDraft（AI 生成结果）悄悄撤销掉，autosave 又会把撤销后的内容当真实内容落库。
import { describe, it, expect } from "vitest";
import { shouldForwardUndoRedo } from "./undoRedoGuard";

describe("shouldForwardUndoRedo", () => {
  it("事件目标落在 role=dialog 弹窗内 → 不转发，交还给弹窗/浏览器自己处理撤销", () => {
    const dialogEl = {};
    const target = { closest: (sel: string) => (sel === '[role="dialog"]' ? dialogEl : null) };
    expect(shouldForwardUndoRedo(target as unknown as EventTarget)).toBe(false);
  });

  it("事件目标不在任何弹窗内 → 正常转发给编辑器 undo/redo", () => {
    const target = { closest: () => null };
    expect(shouldForwardUndoRedo(target as unknown as EventTarget)).toBe(true);
  });

  it("target 为 null（非元素触发）→ 默认转发，不阻断正常快捷键", () => {
    expect(shouldForwardUndoRedo(null)).toBe(true);
  });
});
