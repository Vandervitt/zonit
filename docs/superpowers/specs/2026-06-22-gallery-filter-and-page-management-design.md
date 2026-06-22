# 设计：模板画廊筛选 + 落地页复制与行内改名（子项 A）

| | |
|---|---|
| 文档类型 | 设计 spec |
| 状态 | 待评审 |
| 日期 | 2026-06-22 |
| 分支 | `feat_20260622_画廊筛选与页面管理` |
| 关联 | 产品功能缺口拆分（A–G 七子项）中的子项 A；后续子项各自独立 spec |

## 背景与目标

模板画廊（`/admin/editor`）已积累丰富分类元数据（`tier/category/archetype/conversion/risk/tone`），但 UI 零筛选、33+ 套平铺；落地页列表能删除/取消发布,但缺投手高频需要的「复制变体」与「快速改名」。本子项以最低成本补齐这两处日常体验。

成功标准：
- 画廊可按 行业 / 范式 / 转化方式 三维 + 名称搜索快速定位模板。
- 落地页列表可一键复制为草稿、可行内改名。

## 范围

**做**：画廊三维筛选 + 名称搜索（纯前端）；落地页复制（复制为草稿）；列表行内改名。

**不做**：模板搬入数据库（MVP 保持编译期静态打包，见 Future Work）；按 风险/情绪/梯队 筛选；批量操作；版本历史；A/B 实验编排。

## 第 1 块：模板画廊筛选（纯前端，无新接口）

### 数据来源
画廊数据来自静态 `landing-editor/samples/registry.ts` 的 `TEMPLATES: TemplateMeta[]`，build 时打入客户端 bundle，运行时零查询。筛选纯客户端过滤，不新增接口、不碰 DB。

### 标签中文标签映射（registry.ts 内新增）
`tags.category` 为英文 slug，需展示用中文标签：

| category | 中文标签 |
|---|---|
| beauty | 美妆个护 |
| apparel | 服饰配饰 |
| gadget | 3C 数码 |
| home | 家居家纺 |
| supplement | 健康保健 |
| toys-baby | 玩具母婴 |
| medical | 医疗 |
| home-improvement | 家装 |

- `archetype` 已是中文，直接用。
- `conversion` slug → 展示名映射：`whatsapp→WhatsApp`、`form→表单`、`telegram→Telegram`、`phone→电话`、`email→邮件`。

> 映射以「从 `TEMPLATES` 实际出现的值动态去重」为数据源、再查映射表取中文，避免硬编码出现不存在的选项；映射表缺键时回退原始 slug。

### 纯函数（便于单测）
```
filterTemplates(
  metas: TemplateMeta[],
  f: { category?: string; archetype?: string; conversion?: string; query?: string },
): TemplateMeta[]
```
- 三维之间 AND；空/未选维度视为不约束。
- `category` 比对 `tags.category`；`archetype` 比对 `tags.archetype`；`conversion` 命中 `tags.conversion` 数组任一。
- `query` 对 `name + tagline + industry` 拼接串做不区分大小写子串匹配；空串不约束。

### UI（`TemplateGallery.tsx`，Tailwind-only，不引 antd）
- 标题区下方一行筛选栏：三个原生 `<select>`（行业 / 范式 / 转化，各含「全部」项）+ 一个名称搜索 `<input>`。
- 选项由 `TEMPLATES` 动态去重生成（保证只列实际存在的值）。
- 过滤结果为空时显示空态文案「没有匹配的模板」+「清空筛选」按钮（重置全部筛选状态）。
- 仅本地 `useState`，无副作用、无请求。

## 第 2 块：落地页复制 + 行内改名

### store（`lib/landing-pages/store.ts`）
- `duplicateLandingPage(id, userId): Promise<LandingPageRow | null>`
  - 取源页（按 userId 隔离）；不存在返回 null。
  - INSERT 新行：`name = "{原名} 副本"`、`status='draft'`、`slug=null`、`data` 整体拷贝、新 id、新时间戳。
  - 返回新行。
- `renameLandingPage(id, userId, name): Promise<LandingPageRow | null>`
  - 仅 `UPDATE landing_pages SET name=$ , updated_at=now() WHERE id=$ AND user_id=$`；返回更新后行或 null。

### 接口
- `POST /api/landing-pages/[id]/duplicate`
  - 鉴权（与现有一致，未登录 401）。
  - **复用套餐数量上限检查**：与 `POST /api/landing-pages` 相同逻辑，达上限返回 403（`LIMIT_EXCEEDED`）。
  - 调 `duplicateLandingPage`；源页不存在/不属于该用户 → 404。
  - 成功 201 返回新行。
- `PATCH /api/landing-pages/[id]`（同一 route 文件新增 PATCH 导出）
  - 鉴权；body `{ name: string }`，校验：trim 后非空、长度 1–100 字符（超限/空返回 400 `BAD_REQUEST`）。
  - 调 `renameLandingPage`；未命中 404；成功 200 返回更新行。
  - 轻量：不要求回传 `data`（区别于现有 `PUT { name, data }`）。

### 列表页（`app/admin/(workspace)/landing-pages/page.tsx`，antd Table）
- 操作列新增「复制」：调 duplicate → 成功后刷新列表 + `message.success`；403 时提示已达上限并引导升级（与新建一致）。
- 名称列改为可行内编辑（antd `Typography.Text` 的 `editable`）：提交时 PATCH → 成功后本地更新该行 `name`；失败 toast 并回退显示。

## 测试

- **单测（vitest）**：`filterTemplates` 纯函数（各维度单独/组合/空筛选/大小写/数组命中/空结果）。
- **DB 单测（`RUN_DB_E2E` 门控）**：`duplicateLandingPage`（副本为草稿、slug 空、data 一致、命名）、`renameLandingPage`（仅改名、用户隔离）。
- **e2e（happy path，沿用 Dev Login + pg 清理）**：
  - 画廊：选行业+范式+转化、输入关键词 → 结果集变化、命中预期模板；清空筛选恢复全量。
  - 列表：对一页执行「复制」→ 出现「{原名} 副本」草稿行；行内改名 → 名称更新。

## 风险与边界

- 复制必为草稿（已发布态绑定域名+slug，不可盲复制）——语义上线即对齐。
- 复制受套餐上限约束，避免绕过 `POST /api/landing-pages` 的限制。
- 行内改名失败需回退显示，避免乐观更新与服务端不一致。
- Tailwind-only 约束：画廊筛选栏不得引 antd 或自定义 CSS。

## Future Work（非本子项）

- **模板搬入 pgsql**：MVP 阶段保持编译期静态打包（类型安全 + 跟随 git 版本管理）；后期若需运营在线增改模板，再作为独立子项迁入数据库（含运行时校验、迁移、缩略图/草稿存储）。
- 清理死表 `preset_templates`（迁移 007/009 遗留，全仓零引用）。
- 画廊更多维度筛选（风险/情绪/梯队）、批量操作。
