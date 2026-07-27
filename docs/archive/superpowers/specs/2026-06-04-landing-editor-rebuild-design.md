# 落地页编辑器重构（第一步：仅编辑层）— 设计

日期：2026-06-04
分支：preview

## 背景

项目正基于新的落地页 schema（`types/schema.draft.ts`，`LandingPageDraft` + 15 类区块 + `SECTION_REGISTRY` + `validateSections`）分步重构。本设计覆盖**第一步：编辑器的编辑层**，在隔离的新文件夹内全新实现，不触碰现有 `components/`、`types/schema.ts`、`lib/schema.zod.ts`。

## 目标与边界

**做：** 一个可交互的 `LandingPageDraft` 编辑器——15 类区块表单 + hero/footer/floatingButton + 区块增删/拖拽排序 + 必须性校验提示；右侧实时显示产出的 `LandingPageDraft` JSON。

**不做（留待后续步骤）：** 渲染器/实时预览、持久化、发布、媒体上传。`ImageField` 仅 `url + alt` 文本输入。

**约束：**
- Tailwind only，无自定义 CSS / 无内联样式；现代简洁风格；使用 Tailwind 内置中性色板，自包含。
- 不复用 `components/ui`（shadcn）。
- 不引入支付/电商/交易语义。
- 校验/验收：`npm run lint`（零错误）+ `tsc --noEmit`。按测试约束，**不新增 spec/单测文件**。

## 关键决策

- **schema 来源**：编辑器 `import` 现有 `types/schema.draft.ts`，单一事实源，不复制类型。
- **区块身份**：schema 的 `sections` 无 id；编辑器工作模型为 `EditorSection = LandingSection & { _key: string }`，提供稳定的选中 / 排序 / React key。`toDraft(state)` selector 剥离 `_key`，保证产出的 `LandingPageDraft` JSON 干净。
- **架构（方案 A）**：注册表驱动调度 + reducer store + 手写表单。
- **拖拽**：复用已有依赖 `react-dnd` + `react-dnd-html5-backend`（不新增依赖），并提供上/下按钮兜底。

## 架构

- **Store**：`EditorProvider`（`useReducer` + Context），`state = { draft, sectionKeys, selectedId }`。
  actions：`selectNode / updateNode / addSection / removeSection / moveSection / toggleFloatingButton`。
- **节点身份**：`hero` / `footer` / `floatingButton` 单例，固定字符串 id；section 用 `_key`（与 `sectionKeys[]` 同步维护）。
- **表单注册表**：`SECTION_FORM_REGISTRY: Record<LandingSectionType, FormComponent>`；复用 `SECTION_REGISTRY`（label/required/singleton）驱动左栏列表、添加菜单（singleton 且已存在则置灰）、删除守卫。
- **校验**：`validateSections(draft.sections)` + 顶层必填 → `ValidationBar` 非阻塞提示。

## 文件结构

```
landing-editor/
  Editor.tsx                 # 顶层：DndProvider + EditorProvider + 布局
  sampleDraft.ts             # 初始可用的 LandingPageDraft 种子
  store/editorStore.tsx      # context + reducer + actions + selectors(toDraft)
  registry/sectionForms.tsx  # LandingSectionType -> 表单组件 映射
  ui/                        # 全新 Tailwind 原子
    Field.tsx TextInput.tsx TextArea.tsx Select.tsx
    Button.tsx Card.tsx ImageField.tsx RepeatableList.tsx
  forms/                     # 18 个节点表单
    HeroForm FooterForm FloatingButtonForm
    StatsForm PlansForm ProductsForm BeforeAfterForm ProcessForm
    TrustForm FeaturesForm ReviewsForm StoryForm CountdownForm FaqForm GuaranteeForm
  components/                # BlockList BlockListItem AddSectionMenu
                             # EditorDetail EditorLayout JsonOutputPanel ValidationBar
app/editor-next/page.tsx     # "use client" 薄入口，渲染 <Editor />
```

## 交互与数据流

- **左栏**：顶部固定 `Hero` 卡 → 中间 `sections`（拖拽排序 + 上/下按钮，可删）→ 底部固定 `Footer` 卡；其下 `FloatingButton`（开关式可选）。底部「+ 添加区块」按注册表列出。
- **右栏**：渲染 `selectedId` 对应节点表单；`(value, onChange)` 模式，改动经 `dispatch(updateNode)`。
- **JSON 面板**：实时 `toDraft(state)`。
- **删除守卫**：hero/footer 不可删；删 section 致 `core-value` 组空 → ValidationBar 红字提示（不阻断）。
- 嵌套/可重复结构（plans 价值点、reviews 评价项、前后对比项、faq 问答等）统一用 `RepeatableList<T>`（增删/排序 + 渲染 prop）。

## 验收

- 浏览器 `/editor-next`：可增删/排序区块、编辑各模块字段、JSON 实时更新、删空 core-value 组有提示、hero/footer 不可删、singleton 区块不可重复添加。
- `npm run lint` 零错误；`tsc --noEmit` 通过。
