# 编辑器实时预览 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在 `/editor-next` 右栏用「实时预览」替换「JSON 产出」面板，使编辑表单的任何改动经渲染器即时呈现真实落地页效果。

**Architecture:** 新增通用 `PreviewFrame`（iframe + 父文档样式克隆 + React portal + ResizeObserver 缩放，唯一允许局部动态行内样式）承载渲染器；新增业务 `PreviewPane`（`useEditorState()→toDraft()→<LandingPage>`，含桌面/移动宽度切换）；改 `EditorLayout` 右栏接入并加宽；删除 `JsonOutputPanel`；`/editor-next` 加入 proxy 公开路径。同一棵 React 树经 portal 直达 iframe，state 变更即时反映，无序列化。

**Tech Stack:** Next.js 16（App Router，client 组件）、React `createPortal`、`ResizeObserver`/`MutationObserver`、Tailwind v4（`@source` 覆盖全仓库）、既有渲染器 `landing-renderer/`、Playwright e2e（`frameLocator` 跨 iframe）。

**前置约定：**
- 项目无单测 runner；逐组件验证 = `npx tsc --noEmit`（repo 既有 8 个 `templates/template/` 错误不计，门禁＝无新增）+ `pnpm lint`（既有 error/warning 不计，门禁＝无新增）；端到端 = Playwright e2e。
- 当前分支 `preview`（非保护分支，可提交）。commit 用中文 Conventional Commits，**不带任何 AI 署名 / Co-Authored-By**。
- 仅 `PreviewFrame` 的 iframe/外层容器允许动态 `style`（transform/width/height，本质运行时值），须带注释说明「编辑器工具链局部豁免，不影响落地页 Tailwind-only」。其余一律 Tailwind class。
- 编辑器主题 token（`landing-editor/editor-theme.css`）：`bg-panel`/`bg-canvas`/`border-edge`/`text-ink`/`text-ink-muted`/`bg-brand-600` 等，PreviewPane 头部沿用。

---

## 文件结构

```
landing-editor/components/
  PreviewFrame.tsx     新增 · 通用 iframe 承载（样式克隆 + portal + 缩放）；唯一动态行内样式点
  PreviewPane.tsx      新增 · 业务面板（toDraft + LandingPage + 设备切换 + 头部）
  EditorLayout.tsx     修改 · 右栏 JsonOutputPanel → PreviewPane，并加宽
  JsonOutputPanel.tsx  删除
lib/proxy/auth-proxy.ts  修改 · PUBLIC_PATHS 增加 "/editor-next"
e2e/editor-next-preview.spec.ts  新增 · 实时预览冒烟 + 实时性证明
```

---

## Task 1: PreviewFrame —— 通用 iframe 承载

**Files:**
- Create: `landing-editor/components/PreviewFrame.tsx`

- [ ] **Step 1: 写 PreviewFrame.tsx**

```tsx
"use client";
// landing-editor/components/PreviewFrame.tsx
// 通用 iframe 承载：把 children 渲染进隔离 iframe，并按外层容器宽度缩放，
// 使落地页以「真实桌面宽度」渲染后等比缩入面板。
// 注意：本文件是编辑器工具链中唯一允许动态行内样式的地方——缩放比例 / iframe 宽高
// 均为运行时计算值，无法用静态 Tailwind class 表达，故对 iframe 与外层容器使用
// 动态 style（transform/width/height）。此豁免仅限预览 chrome，不影响落地页 Tailwind-only。
import { useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

/** 把父文档 <head> 的样式（<style> 与 <link rel=stylesheet>）克隆进 iframe <head>。 */
function syncHeadStyles(doc: Document) {
  const head = doc.head;
  // 清掉旧克隆，避免重复
  head.querySelectorAll("[data-preview-style]").forEach((n) => n.remove());
  const nodes = document.head.querySelectorAll('style, link[rel="stylesheet"]');
  nodes.forEach((node) => {
    const clone = node.cloneNode(true) as HTMLElement;
    clone.setAttribute("data-preview-style", "");
    head.appendChild(clone);
  });
}

export function PreviewFrame({ virtualWidth, children }: { virtualWidth: number; children: ReactNode }) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const outerRef = useRef<HTMLDivElement>(null);
  const [body, setBody] = useState<HTMLElement | null>(null);
  const [scale, setScale] = useState(1);
  const [contentHeight, setContentHeight] = useState(0);

  // iframe onLoad：注入样式 + 暴露 body 作为 portal 容器
  const handleLoad = () => {
    const doc = iframeRef.current?.contentDocument;
    if (!doc) return;
    syncHeadStyles(doc);
    setBody(doc.body);
  };

  // 父文档 head 变化（Turbopack dev / HMR 新增 <style>）时同步到 iframe
  useEffect(() => {
    const mo = new MutationObserver(() => {
      const doc = iframeRef.current?.contentDocument;
      if (doc) syncHeadStyles(doc);
    });
    mo.observe(document.head, { childList: true, subtree: true });
    return () => mo.disconnect();
  }, []);

  // 外层宽度变化 → 计算缩放比
  useEffect(() => {
    const el = outerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const w = entries[0].contentRect.width;
      setScale(w / virtualWidth);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [virtualWidth]);

  // iframe 内容高度变化 → 调整占位高
  useEffect(() => {
    if (!body) return;
    const measure = () => setContentHeight(body.scrollHeight);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(body);
    return () => ro.disconnect();
  }, [body]);

  return (
    <div ref={outerRef} className="h-full w-full overflow-auto bg-canvas">
      {/* 占位容器：高度 = 缩放后的内容高度，避免截断/留白（动态值 → 行内样式豁免） */}
      <div style={{ height: contentHeight * scale }}>
        <iframe
          ref={iframeRef}
          onLoad={handleLoad}
          title="落地页实时预览"
          className="border-0 bg-white"
          style={{
            width: virtualWidth,
            height: contentHeight || "100%",
            transform: `scale(${scale})`,
            transformOrigin: "top left",
          }}
        />
      </div>
      {body && createPortal(children, body)}
    </div>
  );
}
```

- [ ] **Step 2: 类型校验 + lint**

Run: `npx tsc --noEmit && pnpm lint`
Expected: PASS（无新增错误；`PreviewFrame` 不应触发新 lint 报错）

- [ ] **Step 3: 提交**

```bash
git add landing-editor/components/PreviewFrame.tsx
git commit -m "feat(editor): 新增通用 iframe 预览承载 PreviewFrame"
```

---

## Task 2: PreviewPane —— 业务预览面板

**Files:**
- Create: `landing-editor/components/PreviewPane.tsx`

- [ ] **Step 1: 写 PreviewPane.tsx**

```tsx
"use client";
// landing-editor/components/PreviewPane.tsx
// 右栏实时预览面板：订阅编辑器 state，经 toDraft 产出 LandingPageDraft，
// 用渲染器 LandingPage 在隔离 iframe 内实时呈现。支持桌面/移动宽度切换。
import { useState } from "react";
import { useEditorState, toDraft } from "../store/editorStore";
import { LandingPage } from "@/landing-renderer/LandingPage";
import { PreviewFrame } from "./PreviewFrame";

type Device = "desktop" | "mobile";
const DEVICE_WIDTH: Record<Device, number> = { desktop: 1280, mobile: 390 };

export function PreviewPane() {
  const state = useEditorState();
  const draft = toDraft(state);
  const [device, setDevice] = useState<Device>("desktop");

  const tab = (d: Device, label: string) => (
    <button
      type="button"
      onClick={() => setDevice(d)}
      className={
        "rounded-md px-2.5 py-1 text-xs font-medium transition " +
        (device === d ? "bg-brand-600 text-white" : "text-ink-soft hover:bg-canvas")
      }
    >
      {label}
    </button>
  );

  return (
    <div className="flex h-full flex-col bg-canvas">
      <div className="flex shrink-0 items-center justify-between border-b border-edge bg-panel px-4 py-2.5">
        <span className="text-xs font-medium text-ink">实时预览</span>
        <div className="flex items-center gap-1">
          {tab("desktop", "桌面")}
          {tab("mobile", "移动")}
        </div>
      </div>
      <div className="min-h-0 flex-1">
        <PreviewFrame virtualWidth={DEVICE_WIDTH[device]}>
          <LandingPage page={draft} />
        </PreviewFrame>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: 类型校验 + lint**

Run: `npx tsc --noEmit && pnpm lint`
Expected: PASS（无新增错误）

- [ ] **Step 3: 提交**

```bash
git add landing-editor/components/PreviewPane.tsx
git commit -m "feat(editor): 新增实时预览面板 PreviewPane（含设备切换）"
```

---

## Task 3: EditorLayout 接入预览并加宽，删除 JsonOutputPanel

**Files:**
- Modify: `landing-editor/components/EditorLayout.tsx`
- Delete: `landing-editor/components/JsonOutputPanel.tsx`

- [ ] **Step 1: 确认 JsonOutputPanel 仅被 EditorLayout 引用**

Run: `grep -rn "JsonOutputPanel" landing-editor app`
Expected: 仅出现在 `landing-editor/components/EditorLayout.tsx` 与 `landing-editor/components/JsonOutputPanel.tsx` 自身。若有其他引用，停止并报告。

- [ ] **Step 2: 改写 EditorLayout.tsx 全文为：**

```tsx
"use client";
// landing-editor/components/EditorLayout.tsx
import { BlockList } from "./BlockList";
import { EditorDetail } from "./EditorDetail";
import { PreviewPane } from "./PreviewPane";
import { ValidationBar } from "./ValidationBar";

export function EditorLayout() {
  return (
    <div className="flex h-screen flex-col bg-canvas">
      <header className="flex shrink-0 items-center gap-3 border-b border-edge bg-panel px-5 py-3">
        <h1 className="text-sm font-semibold text-ink">
          落地页编辑器 <span className="font-normal text-ink-muted">/ 新 schema</span>
        </h1>
        <div className="flex-1" />
        <ValidationBar />
      </header>
      <div className="flex flex-1 overflow-hidden">
        <aside className="w-72 shrink-0 overflow-hidden border-r border-edge bg-panel">
          <BlockList />
        </aside>
        <main className="w-[420px] shrink-0 overflow-hidden border-r border-edge bg-panel">
          <EditorDetail />
        </main>
        <aside className="min-w-0 flex-1 overflow-hidden">
          <PreviewPane />
        </aside>
      </div>
    </div>
  );
}
```

说明：原中栏 EditorDetail 为 `flex-1`、右栏 JSON 为固定 `380px`。现改为中栏表单固定 `420px`、右栏预览 `flex-1`（占据剩余全部空间，给预览最大宽度），符合「右栏加宽」意图。

- [ ] **Step 3: 删除 JsonOutputPanel.tsx**

```bash
git rm landing-editor/components/JsonOutputPanel.tsx
```

- [ ] **Step 4: 类型校验 + lint**

Run: `npx tsc --noEmit && pnpm lint`
Expected: PASS（无新增错误；无对已删文件的悬挂引用）

- [ ] **Step 5: 提交**

```bash
git add landing-editor/components/EditorLayout.tsx
git commit -m "feat(editor): 右栏接入实时预览并移除 JSON 产出面板"
```

---

## Task 4: /editor-next 设为公开路径

**Files:**
- Modify: `lib/proxy/auth-proxy.ts`

- [ ] **Step 1: 在 PUBLIC_PATHS 中加入 "/editor-next"**

将 `lib/proxy/auth-proxy.ts` 的 `PUBLIC_PATHS` 数组从：

```ts
export const PUBLIC_PATHS = [
  "/login",
  "/register",
  "/pricing",
  "/site",
  "/preview-next",
  "/api/auth",
  "/api/register",
  "/api/templates",
];
```

改为（在 `"/preview-next",` 后新增一行 `"/editor-next",`）：

```ts
export const PUBLIC_PATHS = [
  "/login",
  "/register",
  "/pricing",
  "/site",
  "/preview-next",
  "/editor-next",
  "/api/auth",
  "/api/register",
  "/api/templates",
];
```

仅改这一个数组，其它不动。

- [ ] **Step 2: 类型校验**

Run: `npx tsc --noEmit`
Expected: 无新增错误。

- [ ] **Step 3: 提交**

```bash
git add lib/proxy/auth-proxy.ts
git commit -m "feat(editor): 将 /editor-next 加入公开路径以便免登录预览"
```

---

## Task 5: e2e 实时预览冒烟 + 实时性证明

**Files:**
- Create: `e2e/editor-next-preview.spec.ts`

- [ ] **Step 1: 写 e2e（先失败——此前预览未接好/路由未公开）**

```ts
// e2e/editor-next-preview.spec.ts
import { test, expect } from "@playwright/test";

test.describe("editor-next 实时预览", () => {
  test("编辑 Hero 标题即时反映到预览 iframe", async ({ page }) => {
    const res = await page.goto("/editor-next");
    expect(res?.status()).toBe(200);

    // 右栏预览 iframe 存在，且默认选中 Hero 表单
    const frame = page.frameLocator('iframe[title="落地页实时预览"]');
    // 预览初始呈现样例 Hero 标题
    await expect(frame.getByRole("heading", { name: /Skincare that actually fits/i })).toBeVisible();

    // 中栏 Hero 标题输入框：填入新标题
    // HeroForm 的「主标题」字段，定位其输入框（标签文案「主标题」）
    const titleInput = page.getByLabel("主标题");
    await titleInput.fill("Brand new hero headline");

    // 预览 iframe 实时更新为新标题
    await expect(frame.getByRole("heading", { name: "Brand new hero headline" })).toBeVisible();
    // 旧标题不再出现
    await expect(frame.getByRole("heading", { name: /Skincare that actually fits/i })).toHaveCount(0);
  });
});
```

> 实现注意：若 `page.getByLabel("主标题")` 无法命中（HeroForm 标签文案或关联方式不同），先打开 `landing-editor/forms/HeroForm.tsx` 与 `landing-editor/ui/Field.tsx` 确认主标题字段的实际 label 文案与 input 关联方式（`<label htmlFor>` 或包裹），据实把定位器改为能稳定命中该输入框（如 `getByRole("textbox", { name: ... })` 或先 `getByText` 定位字段再取其 input）。断言意图不变：改主标题 → 预览同步。

- [ ] **Step 2: 运行 e2e 验证失败（接入前）**

Run: `pnpm test:e2e e2e/editor-next-preview.spec.ts`
Expected: 在 Task 1–4 完成前会 FAIL（iframe 不存在或路由重定向到 /login）。若 Task 1–4 已先完成，则直接验证 PASS。

- [ ] **Step 3: 运行 e2e 验证通过（接入后）**

Run: `pnpm test:e2e e2e/editor-next-preview.spec.ts`
Expected: PASS（iframe 显示样例标题 → 改输入 → iframe 更新为新标题）。
若失败：读报错。常见原因——(a) 定位器未命中输入框，按 Step 1 注意事项调整；(b) iframe 样式未注入导致文本不可见，检查 PreviewFrame 的 `syncHeadStyles`；(c) 预览更新有延迟，可加 `await expect(...).toBeVisible()` 的自动重试已足够，勿手动 sleep。

- [ ] **Step 4: 提交**

```bash
git add e2e/editor-next-preview.spec.ts
git commit -m "test(editor): 新增编辑器实时预览端到端用例"
```

---

## Task 6: 全量门禁 + 浏览器人工核对

**Files:** 无（验证任务）

- [ ] **Step 1: 类型 + lint 全量**

Run: `npx tsc --noEmit && pnpm lint`
Expected: 无新增错误（既有 `templates/template/` 错误与既有 lint 问题不计）。

- [ ] **Step 2: e2e 全量（确认未破坏既有用例）**

Run: `pnpm test:e2e e2e/preview-next.spec.ts e2e/editor-next-preview.spec.ts`
Expected: 两个文件用例均 PASS。

- [ ] **Step 3: 浏览器人工核对**

Run: `pnpm dev`，访问 `http://localhost:3001/editor-next`
逐项确认：
1. 右栏显示实时预览（非 JSON）；整页缩放后完整可见、无横向溢出。
2. 在中栏改 Hero 标题/副标题，预览即时更新。
3. 切换左侧不同区块编辑其字段，预览对应区块即时更新。
4. 悬浮按钮 `fixed` 限制在预览 iframe 内，未逃逸到整个编辑器视口。
5. 点「移动」切换为 390 宽，预览变窄、按移动断面排布；点「桌面」复原。
6. 浏览器 console 无新增报错（尤其无水合/样式缺失警告）。

- [ ] **Step 4（如人工核对发现问题）：** 按 systematic-debugging 修复后回到 Step 1 复跑；若全部通过则本任务完成，无需提交（纯验证）。

---

## 计划自审

- **spec 覆盖：** §3 架构=T1+T2+T3；§4.1 PreviewFrame=T1；§4.2 PreviewPane（toDraft/设备切换/头部）=T2；§4.3 EditorLayout 接入+加宽=T3；§4.4 删除 JsonOutputPanel=T3；§5 proxy 公开路径=T4；§6 client/水合（全 client + portal mount 后挂载）=T1/T2 实现内含；§7 约束（Tailwind-only + 豁免注释 + 非交易 + 无 AI 署名）=T1 注释 + 各 commit；§8 测试（冒烟+实时性+门禁+人工）=T5+T6；§9 风险（样式克隆/MutationObserver、iframe 时序、缩放高度、frameLocator）=T1 实现 + T5 定位器。无遗漏。
- **占位扫描：** 无 TBD/TODO；每个改代码 step 均含完整代码与命令；T5 定位器有「据实调整」的明确兜底而非占位。
- **类型/命名一致性：** `PreviewFrame({virtualWidth,children})` 在 T1 定义、T2 调用一致；`PreviewPane()` 在 T2 定义、T3 引入一致；`toDraft`/`useEditorState` 来自既有 store（已存在）；`LandingPage({page,theme?})` 来自既有渲染器；iframe `title="落地页实时预览"` 在 T1 设置、T5 用同一字符串定位一致；`DEVICE_WIDTH` 桌面 1280/移动 390 与 spec §4.2 一致；PUBLIC_PATHS 新增项 `"/editor-next"` 与 spec §5 一致。
```
