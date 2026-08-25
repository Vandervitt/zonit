/** 判断一次 Cmd/Ctrl+Z（或 Shift+Cmd/Ctrl+Z）是否应转发给编辑器的全局 undo/redo。
 *
 *  弹窗（AI 一键成页、发布设置等 antd Modal）内的表单字段不是编辑器 draft 的一部分，
 *  但 EditorToolbar 的撤销监听挂在 window 上、不看事件目标。如果不做这个判断，
 *  用户在弹窗里按 Cmd/Ctrl+Z（哪怕只是想撤销打字）也会被拦截并转发成编辑器整页
 *  undo，把上一次 replaceDraft（例如 AI 生成结果）悄悄撤销掉——编辑器 UI 上不
 *  容易注意到，autosave 又会把撤销后的内容当真实内容落库，发布出去的就是被
 *  撤销后的旧内容。
 *
 *  判据：事件目标落在任意 role="dialog" 元素内时不转发。antd Modal（rc-dialog）
 *  统一用这个 role，不依赖具体某个弹窗组件的开关状态，能一并盖住所有弹窗。
 */
export function shouldForwardUndoRedo(target: EventTarget | null): boolean {
  const el = target as { closest?: (selector: string) => unknown } | null;
  if (!el || typeof el.closest !== "function") return true;
  return !el.closest('[role="dialog"]');
}
