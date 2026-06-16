# 编辑器实时预览设计稿（渲染器 × 编辑器结合）

- 日期：2026-06-16
- 范围：在 `/editor-next` 编辑器中，将右栏的「JSON 实时产出」面板替换为「实时预览」面板，使用户能边编辑边看到渲染器输出的真实落地页效果。
- 依赖：复用既有渲染器 `landing-renderer/LandingPage.tsx`（零改动）与编辑器 store 的 `toDraft()`。

## 1. 目标与范围

- 在 `/editor-next` 实现「编辑表单 → 实时预览」闭环：任意字段改动即时反映到预览。
- 预览呈现**真实桌面落地页效果**（非压缩变形），支持桌面/移动宽度切换。
- **彻底移除** JSON 产出面板（不保留切换）。

### 非目标（YAGNI）
- 不接持久化 / 发布（预览只读内存 state）。
- 不做预览内的点击编辑（inline editing）；编辑仍走中栏表单。
- 不改动渲染器内部任何组件。
- 不引入第三方 iframe 库（如 react-frame-component）。

## 2. 已确认决策

1. **布局**：右栏 JSON 面板 → 实时预览面板（方案 A）。三栏骨架不变：左 BlockList / 中 EditorDetail / 右 PreviewPane。JSON 面板删除、不保留。
2. **承载**：iframe + `transform: scale()`（方案 A）。iframe 以固定真实宽度渲染，按面板宽缩放。
3. **行内样式豁免**：缩放/宽高本质为运行时动态值，无法用静态 Tailwind class 表达。仅 `PreviewFrame` 的 iframe/外层容器允许动态 `style`（transform/width/height），代码注释标明「编辑器工具链局部豁免，不影响落地页 Tailwind-only」。渲染器内部与其余组件零行内样式。

## 3. 架构与数据流

```
EditorProvider (既有 useReducer state)
  └─ EditorLayout
       ├─ 左：BlockList（不变）
       ├─ 中：EditorDetail（不变）
       └─ 右：PreviewPane（新，替换 JsonOutputPanel）
              ├─ useEditorState() → toDraft() → draft: LandingPageDraft
              ├─ 设备宽度 state：桌面 1280 / 移动 390
              └─ <PreviewFrame virtualWidth={width}>
                    <LandingPage page={draft} />     ← 复用渲染器，零改动
                 </PreviewFrame>
```

数据流：编辑器 dispatch → state 变 → PreviewPane 重渲染 → `toDraft()` 产出新 draft → 经 React **portal** 渲染进 iframe body → 实时更新。同一棵 React 树，无序列化、无 postMessage、无 JSON 中转。

## 4. 组件设计

### 4.1 PreviewFrame（新，通用，唯一允许局部行内样式）
`landing-editor/components/PreviewFrame.tsx`（"use client"）

- Props：`{ virtualWidth: number; children: ReactNode }`
- 机制：
  1. 渲染 `<iframe>`；`onLoad` 后取 `iframe.contentDocument`。
  2. **样式注入**：克隆父文档 `<head>` 内所有 `<style>` 与 `<link rel="stylesheet">` 到 iframe `<head>`，使同一套 Tailwind class 在 iframe 内生效。再挂一个 `MutationObserver` 监听父 `<head>` 变化（Turbopack dev / HMR 新增 `<style>` 时同步追加），兜底避免预览缺样式。
  3. **portal**：`createPortal(children, iframe.contentDocument.body)`。body 未就绪时不挂载，`onLoad` 后再挂。
  4. **缩放**：iframe 固定 `width = virtualWidth`；外层容器用 `ResizeObserver` 测实际宽 W；`scale = W / virtualWidth`，对 iframe 施加 `transform: scale(s)` + `transform-origin: top left`（动态行内样式，注释豁免）。iframe 高度 = `iframe.contentDocument.body.scrollHeight`（内容自适应，亦可用 ResizeObserver 监听 body）；外层占位高 = `scrollHeight × scale`，避免缩放后留白/截断。
- 清理：卸载时断开 ResizeObserver / MutationObserver。

### 4.2 PreviewPane（新，业务面板）
`landing-editor/components/PreviewPane.tsx`（"use client"）

- `useEditorState()` → `toDraft(state)` → `draft`。
- 本地 state：`device: "desktop" | "mobile"`，映射 `virtualWidth` 1280 / 390。
- 渲染：面板头部（标题「实时预览」+ 桌面/移动切换按钮）+ `<PreviewFrame virtualWidth={virtualWidth}><LandingPage page={draft} /></PreviewFrame>`。
- 切换按钮用 Tailwind class 切换激活态（静态 class，不涉及豁免）。

### 4.3 EditorLayout（修改）
`landing-editor/components/EditorLayout.tsx`

- 右栏 `<JsonOutputPanel/>` → `<PreviewPane/>`。
- 右栏加宽给预览更多空间：现 `w-[380px]` → `w-[440px]`（或视觉权重调整）。保留 `lg:block` 与否按实现时观感定，但必须保证大屏可见。

### 4.4 删除 JsonOutputPanel
`landing-editor/components/JsonOutputPanel.tsx` —— 删除前 `grep -rn "JsonOutputPanel"` 确认仅 EditorLayout 引用，改完即删文件。

## 5. proxy 可访问性

`/editor-next` 当前不在 `lib/proxy/auth-proxy.ts` 的 `PUBLIC_PATHS`，未登录访问会被重定向到 `/login`。将 `"/editor-next"` 加入 `PUBLIC_PATHS`（与 `/preview-next` 同理：新 schema 编辑器工具链，仅操作内存样例数据、无数据访问），使其可公开访问、e2e 免登录加载。

## 6. client / server 与水合

- PreviewPane、PreviewFrame 均 `"use client"`；iframe 内容在 mount 后经 portal 挂载，无 SSR/水合参与。编辑器整体本就是 client（`Editor.tsx` "use client"）。
- 渲染器在 client 上下文渲染无碍：纯展示、无 server-only API；`Countdown` 已是 client 组件。

## 7. 约束遵循

- **Tailwind only**：除 §2.3 注释豁免的 PreviewFrame 动态 transform/width/height 外，无自定义 CSS、无内联 style。
- **非交易**：不引入任何交易语义（仅预览既有渲染器输出）。
- **proxy.ts** 为中间件（项目约定），本次仅在 `auth-proxy` 的 PUBLIC_PATHS 增一项。
- 提交信息：中文 Conventional Commits，**不带任何 AI 署名**。

## 8. 测试与验证

新增 `e2e/editor-next-preview.spec.ts`（Playwright，无需数据库）：
1. 加载 `/editor-next`，确认 200、右栏存在 preview iframe。
2. **实时性证明**：iframe 内出现样例 Hero 标题「Skincare that actually fits your skin」；在中栏 Hero 标题输入框改写为新值；断言 iframe 内文本更新为新值 → 证明「编辑 → 实时预览」闭环。

门禁：`npx tsc --noEmit`（无新增错误，repo 既有 8 个 `templates/template/` 错误不计）+ `pnpm lint`（无新增）+ 上述 e2e 通过 + 浏览器人工核对（编辑实时反映、`fixed` 悬浮按钮限制在 iframe 内、缩放正常、设备切换生效）。

## 9. 风险与对策

- **样式缺失（HMR）**：首次克隆 head 样式 + MutationObserver 持续同步。
- **iframe 时序**：等 `onLoad`/`contentDocument` ready 再 portal；body 未就绪不挂。
- **缩放高度**：以 body.scrollHeight × scale 设外层占位高，避免截断/留白。
- **e2e 跨 iframe 定位**：用 Playwright `frameLocator` 进入 iframe 断言文本。
```
