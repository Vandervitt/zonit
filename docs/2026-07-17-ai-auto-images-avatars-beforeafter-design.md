# AI 自动配图扩展：对比图 + 评价头像

日期：2026-07-17 · 分支：feat_20260716_模板选择弹窗重构

## 背景

`feat: AI 一键成页支持自动配图（Unsplash）`（commit 3277272）落地了自动配图，但 `deriveImageSlots`
刻意用 `SKIP_KEYS`(avatar/beforeImage/afterImage/poster) 与 `SKIP_SECTION_TYPES`(reviews/beforeAfter)
把这些图位整体排除，理由是随机图会造成「伪证据」。生成后这些图位保留占位图，观感不完整。

用户决策（2026-07-17）：
- **对比图 before/after 用「AI 选 Unsplash 检索词」方式**填充（非 AI 生成成对图）。
- 范围额外包含**评价区真人头像 avatar**；不含视频封面 poster、不含评价内容配图 `content.image`。
- **生成时重点向用户提示合规/信任风险**（头像=图库陌生人肖像充当客户；对比图=两张素材凑对，一致性有上限）。

## 目标与非目标

目标：一键成页时，before/after 对与评价头像也由模型出检索词、经现有 Unsplash→Blob 管线填充，
并在保证「成对可信」与「头像不撞脸」前提下写回 src/alt；生成 UI 显著提示这些图为图库素材需替换。

非目标：不接入文生图；不碰 poster 与 `reviews.content.image`；不改渲染器结构。

## 改动

### 1) `lib/ai/images.ts` — 槽位打 kind 标签，精准放开目标图位

- `ImageSlot` 增加 `kind: "generic" | "avatar" | "before" | "after"` 与 `pairId?: string`
  （before/after 同一 `BeforeAfterItem` 用其 item 路径作分组键）。
- 放开枚举：`beforeAfter` 段的 `beforeImage`→kind `before`、`afterImage`→kind `after`（同 item 共享 pairId）；
  `reviews` 段的 `avatar`→kind `avatar`。**仍跳过** `poster` 及 `reviews.*.content.image`。
- `MAX_AUTO_IMAGES` 8→12；截断改为**成对安全**：不切断 before/after 对（要么整对进、要么都不进），
  避免只填 before 不填 after 的破碎观感。

### 2) `buildImageQueryPrompt` — 成对 / 人像感知

- before/after 对：提示模型这两个 id 属**同一组对比**，检索词须为**同一主体/场景**、仅在「问题态→结果态」
  上不同（如 `cluttered garage` ↔ `organized garage`），保持视觉一致；不得选到无关画面。
- avatar：检索词为**人物头像/headshot**，贴合评价人设，且**每个头像必须是不同的人**；
  alt 描述为客户肖像。

### 3) `buildImageReplacements` + 路由 resolver — 头像不撞脸 & 人像取向

- `buildImageReplacements` 的 resolve 回调签名扩展为 `(query, slot)`，让路由据 `slot.kind` 分流。
- avatar：用 `orientation=squarish` 检索，**绕过按检索词去重的缓存**，并用头像计数器从结果池
  （`per_page` 拉多张）轮取不同结果——即使模型给出相同检索词，也让不同评价人拿到不同脸。
- generic / before / after：维持现有去重与 landscape 行为。
- `lib/media/unsplash.ts` 的 `searchPhotos` / `searchTopPhoto` 增加 `orientation` 参数（默认 landscape）。

### 4) 生成 UI 合规提示（`GenerateBriefDialog.tsx`）

- `autoImages` 勾选项 `extra` 文案补充：含评价头像与对比图，均为图库素材、非真实客户/案例。
- 生成中 `REVIEW_TIPS` 轮播强化「评价、头像、对比图为图库/占位素材，务必替换为真实素材」一条，
  使其在生成过程中显著出现。

## 兜底（不变）

全程尽力而为：`autoImages===false` 或未配 Unsplash key 直接跳过；任一步失败回退文本版 draft。

## 测试（TDD，`lib/ai/images.test.ts` 已有基础）

先写失败用例再实现：
- `deriveImageSlots` 对 before/after 与 avatar 输出正确 kind、pairId；仍跳过 poster / content.image。
- 成对安全截断：cap 处于一对中间时，该对整体被排除。
- `buildImageReplacements`：avatar 槽不进共享去重缓存（相同 query 仍分别解析、取不同结果）。
- `buildImageQueryPrompt`：包含成对约束与人像约束文案。
- 现有 generic 行为回归不破。

分层验证门槛：vitest（含新用例）+ tsc + eslint + build；浏览器 E2E 验证一键成页真实填充。
