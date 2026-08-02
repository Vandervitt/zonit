# 留资渠道通用化 · 设计

**状态**：待实施　**分支**：`refactor_20260801_留资渠道通用化`　**日期**：2026-08-01

把留资渠道从「烘焙在模板里的裸字符串」改造成「页面级单一真源 + 引用」，让用户在自己的页面上选择用什么渠道接客户。

## 1. 问题

### 1.1 渠道不是一个概念

全库 160 个 CTA 落点，`link` 字段直接写死 URL：

| 落点指向 | 数量 |
|---|---|
| 模板内 `WHATSAPP` 常量（占位假号） | 88 |
| 字面量 URL（Instagram 等二级链接） | 40 |
| `#lead-form` 锚点 | 25 |
| `PHONE` / `MAILTO` | 7 |

页面上没有任何地方回答「这个页面用什么渠道接客户」。渠道信息被复制在 N 个字符串里，改一次号码要改 N 处。

`types/schema.draft.ts` 的注释把这个偏见写死了：`leadForm?: LeadForm; // 兜底留资表单（可选）`，`LeadForm` 定义处写着「默认关；转化优先走深链」。

### 1.2 现有补丁只覆盖两处

`landing-editor/lib/contactIssues.ts` 的 `blankPrimaryCtaLinks()` 在模板实例化时置空 `hero.cta.link` 与 `floatingButton.link`，逼用户填自己的联系方式。

实测实例化后的 draft（`test/fixtures/drafts-pre-contact.json`，165 个落点）：

| 落点状态 | 数量 |
|---|---|
| 已置空 | 87 |
| 其他 URL（Instagram 等二级链接） | 37 |
| `#lead-form` 锚点（`isPageAnchor` 跳过置空） | 28 |
| **保留模板占位号（whatsapp 11 + tel 2）** | **13** |

那 13 处是漏网：用户填完首屏 CTA，某些区块的按钮仍指着 `+1555…`。发布门槛的 `PLACEHOLDER_CONTACTS` 全文扫描会拦住不让发，但用户得逐个手工找出来改。

> 注：早期评估曾按源码里的 `link: WHATSAPP` 常量引用数估为「约 86 处漏网」，那个口径高估了一个量级 —— 多数落点在实例化时已被置空。以本表为准。

### 1.3 模板主转化的分布只是症状

| 梯队 | 主转化（`conversion[0]`） |
|---|---|
| t1 电商种草 31 套 | WhatsApp 31 / 表单 0 |
| t2 线索类 21 套 | 表单 13 / WhatsApp 7 / 电话 1 |

t1 全走 WhatsApp 是 `docs/lead-capture-channels.md` 既定的设计意图（COD 询单市场习惯），不是缺陷。真正的问题是**渠道由模板决定而不是由用户决定** —— 靠逐套调整模板配比治标不治本。

### 1.4 需求早已存在

`landing-editor/components/GenerateBriefDialog.tsx:43` 的 `CTA_CHANNELS` 多选已经在问用户想要哪些渠道，但答案只拼进 prompt 喂给 LLM 写文案，没有落到任何结构化字段 —— 因为当时没有能承接它的模型。

## 2. 已定决策

| # | 决策 | 取舍 |
|---|---|---|
| 1 | 页面级单一真源 + 引用（非创建向导一次性填充） | 改一处，160 个落点同步生效 |
| 2 | 主渠道占主 CTA，其余渠道自动就位 | 用户只做 2 个选择，不逐位置配置 |
| 3 | 模板渠道中立，CTA 文案跟随渠道 | 代价：52 套模板要补写多渠道文案 |
| 4 | 全量迁移（含 `published_data` 快照） | 代码只留一条路径；需配套备份、dry-run、等价性判据、回滚 |
| 5 | 渠道选择交给用户，配引导文案与理由 | 平台不做静默决策 —— 用户未必是专业投手 |

决策 5 推翻了设计过程中一版 `{ kind: "instant" }` 自动回退方案：那是在用「跟进成功率」这种只有投手才懂的理由替用户排序。

## 3. 数据模型

### 3.1 页面级真源

```ts
/** 留资渠道。form = 页内表单，其余 = 外部深链。 */
export type LeadChannel = "form" | "whatsapp" | "phone" | "email" | "telegram";

/** 页面联系方式：全页 CTA 的单一真源。 */
export interface PageContact {
  /** 主转化渠道。hero 主 CTA 与所有 target:"primary" 的 CTA 都指向它。 */
  primary: LeadChannel;
  /** 外部渠道的值。格式与线索侧同一套：号码 E.164、telegram 裸用户名。 */
  whatsapp?: string;
  phone?: string;
  email?: string;
  telegram?: string;
}
```

置于 `LandingPageDraft` 顶层，**必填**（全量迁移后不存在旧数据）。

两个刻意的取舍：

- **扁平不嵌套** —— 形状与 `LeadPayload` 一致，可直接喂给已有的 `contactLinks()` 拼装逻辑。
- **表单启用状态不在此重复** —— 仍由 `leadForm.enabled` 表达，避免两处都能声明「表单开没开」。`primary === "form"` 时必须 `leadForm.enabled`，由校验保证。

### 3.2 CTA 改为引用

```ts
export type CtaTarget =
  | { kind: "primary" }                         // 跟随主渠道（绝大多数落点）
  | { kind: "channel"; channel: LeadChannel }   // 钉死某渠道（悬浮按钮）
  | { kind: "url"; url: string };               // 二级外链（Instagram 等 40 处）

export interface CtaButton {
  text: string;                                          // 仍是确定字符串
  textByChannel?: Partial<Record<LeadChannel, string>>;  // 模板资产
  textEdited?: boolean;                                  // 用户手改过则为 true
  target: CtaTarget;
}
```

`text` 保持必填 `string`，现有读 `cta.text` 的代码一行不改。

### 3.3 文案跟随放在编辑器，不放渲染器

切渠道时**由编辑器把 `textByChannel[新渠道]` 写进 `text`**，而非渲染时解析。

| | 编辑器写入（采用） | 渲染时解析（否决） |
|---|---|---|
| 渲染器 | 只认 `text` 一个字符串 | 要带一套文案回退链 |
| 所见即所得 | 编辑器所见即快照内容 | 快照存全集，显示要算 |
| 代价 | 跟随逻辑集中在编辑器一处 | 逻辑分散进渲染器 |

`textEdited` 为真时不再覆盖用户手改的文案。

> **已知取舍**：切渠道不会对已发布页立即生效，需重新发布。这与 `published_data` 是不可变快照的既有语义一致。

### 3.4 各落点的 target 归属

| 落点 | target |
|---|---|
| `hero.cta` | `primary` |
| `hero.secondaryCta` | `url`（二级链接） |
| `plans[].cta` / 区块内 CTA | `primary` |
| `floatingButton` | `channel`（用户明确选，见 4.3） |

160 个落点里需要用户操心的是 **0 个** —— 全部由 `contact.primary` 一个选择驱动。

### 3.5 页脚字段废弃

`FooterSection.contactEmail: string` 删除 —— 它是 `contact.email` 的重复表达，正属于本次要消灭的分散真源。页脚改为渲染 `contact` 中所有已填、且未在主 CTA / 悬浮按钮出现过的渠道。

## 4. 解析与就位

### 4.1 解析器

```ts
// landing-renderer/lib/resolveCta.ts
export function resolveCtaHref(target: CtaTarget, contact: PageContact): string | null;
```

| `target` | 解析结果 |
|---|---|
| `{ kind: "url" }` | 原样返回 |
| `{ kind: "primary" }` | 按 `contact.primary` 解析 |
| `{ kind: "channel", channel }` | 按指定渠道解析 |

渠道 → href：`form` → `#lead-form`（复用 `LEAD_FORM_ANCHOR_ID`）；其余交给共享的 `lib/contact/channel-href.ts`。

**返回 `null` 时该 CTA 不渲染**，而非渲染成 `<a href="">`。这修掉一个现存毛病：绕过发布门槛时页面上会出现点了没反应的按钮。

### 4.2 共享链接拼装

抽出 `lib/contact/channel-href.ts`：渠道 + 值 → `{ href, external }`，由落地页 `resolveCtaHref()` 与后台一键联系 `lib/leads/contact-links.ts` 共用。现在是两份逻辑。

label 不进共享层 —— 后台是中文按钮（「拨号」「邮件」），落地页是英文 CTA 文案，各管各的。

### 4.3 多渠道就位的边界

| 用户明确决定（2 个选择） | 平台自动处理 |
|---|---|
| 主渠道是什么 | 160 个 CTA 落点的连接 |
| 悬浮按钮挂哪个渠道 | 表单插入位置、页脚罗列、文案跟随 |

悬浮按钮实例化时给默认值（主渠道是即时类则同主渠道，否则取已填的第一个即时渠道），但该默认值在面板中**可见且可改**，不是藏在解析器里的规则。

## 5. 编辑器与创建流程

### 5.1 落点：对齐现有结构

编辑器现为左栏 `BlockList` + 右栏 `EditorDetail` 按选中 id 渲染表单，固定项已有 `HERO` / `FOOTER` / `FLOATING` / `LEADFORM` / `BRANDING` / `SEO`。新增一个固定项：

```
左栏
  ├─ 📞 联系方式        ← 新增，置于 Hero 之上
  ├─ Hero
  ├─ ...sections...
  ├─ 页脚 Footer
  ├─ 留资表单
  └─ 悬浮按钮
```

对应 `landing-editor/forms/ContactForm.tsx`，沿用其他 form 的 `value` / `onChange` / dispatch 模式。置于 Hero 之上是因为它是全页 CTA 的上游 —— 位置本身表达依赖关系。

### 5.2 什么时候问：不阻断，但第一眼就是它

新建页面进编辑器时**默认选中「联系方式」面板**而非 Hero。不做阻断式向导：

1. 渠道随时可改，不是一次性决定，没理由做成不可跳过的关卡；
2. 想先看模板长什么样的用户，被弹窗拦住会直接退出。

原 `blankPrimaryCtaLinks` 那个「靠置空字段逼用户填」的意图，改由「默认选中面板 + 发布门槛校验」承接 —— 引导在前、拦截在后。

### 5.3 引导文案

这是本次改造的产品价值所在。只交出选择权而不解释，等于把难题原样丢回给诊所老板。每个选项带**适用场景 + 代价**，用非营销语言：

| 渠道 | 引导文案 |
|---|---|
| **留资表单** | 访客填写姓名和联系方式，你在后台收到完整线索。适合需要先了解情况才能报价的生意 —— 装修、B2B 采购、留学咨询、医美面诊。代价：访客要多花半分钟，但你拿到的信息更完整。 |
| **WhatsApp** | 访客点一下直接和你聊天。适合 WhatsApp 普及的市场，或一两句话就能问清楚的生意。**代价：聊天发生在你自己手机里，平台只能统计有多少人点了，帮不了你记录和提醒。** |
| **电话** | 访客点一下直接拨号。适合急单生意 —— 管道漏水、开锁、搬家、空调抢修。 |
| **邮箱** | 适合正式的 B2B 询盘往来。 |
| **Telegram** | 适合部分东欧、中亚市场与跨境行业。 |

面板顶部总引导：

> 不确定选哪个？先问自己：**客户第一次联系你时，你需要先知道些什么才能报价？**
> 需要 → 选留资表单。不需要，聊两句就能谈 → 选 WhatsApp 或电话。
> 两个都想要也可以：主按钮用表单，悬浮按钮挂 WhatsApp。

WhatsApp 那条代价必须写出来。它就是平台的测量不对称（只有表单线索能进收件箱），如实告知比藏着好，也是引导用户考虑「主推表单 + 悬浮 WhatsApp」组合的诚实理由。

面板为单选决定主渠道，但**每个渠道的值都可填** —— 填了就在页脚出现。主渠道的值必填。

### 5.4 AI 生成路径收口

`GenerateBriefDialog` 的 `CTA_CHANNELS` 多选改为写入 `contact`：勾选的渠道进对应字段，第一个作为 `primary`。仍可继续喂 prompt（让 LLM 写出匹配渠道的文案），但**结构化字段成为真源**。两条创建路径（选模板 / AI 生成）落到同一模型。

## 6. 迁移

### 6.1 `migrations/039_contact_channels.js`

推断规则（从现有 draft 反推 `contact`）：

| 来源 | 推断 |
|---|---|
| `hero.cta.link` = `#lead-form` | `primary: "form"` |
| = `wa.me/<num>` | `primary: "whatsapp"`，`contact.whatsapp = +<num>` |
| = `tel:` / `mailto:` / `t.me/` | 同理 |
| = `""`（被 `blankPrimaryCtaLinks` 置空，39 套） | 见下方「空链接的兜底」 |
| `footer.contactEmail` | → `contact.email` |

各 CTA 的 `link` → `target`：与主渠道 href 相同 → `{kind:"primary"}`；与其他已收录渠道相同 → `{kind:"channel"}`；**其余一律 `{kind:"url"}` 原样保留**。

**空链接的兜底**：`blankPrimaryCtaLinks` 只清非锚点链接（`isPageAnchor` 跳过 `#lead-form`），所以**空链接必然原本是 WhatsApp / tel 这类深链，绝不可能是表单**。若按「空 → 看 `leadForm.enabled`」兜底会推出 `primary: "form"` —— 而 PR #144 之后 52 套模板全部启用了表单，那会把原本解析为空的 CTA 变成 `#lead-form`，直接破坏等价性。

正确规则：空链接时 `primary` 取一个**值为空**的渠道（解析结果同样是 `null`，等价成立）。渠道类型从该 draft 内残留的其他渠道链接推断（如仍有 `tel:` 则取 `phone`），推不出则默认 `whatsapp`。用户在阶段 2 的面板里再填真实值。

> **硬规则**：同一页面出现两个不同 WhatsApp 号是可能的（用户手改过其中一个），迁移**不得强行归一** —— 那会静默改变线上页面行为。识别不了的原样搬成 `url`，宁可留一个未接入新模型的落点，也不能改掉客户正在投放的页面。

### 6.2 安全措施

1. **备份**：`CREATE TABLE landing_pages_backup_pre_contact AS SELECT * FROM landing_pages`，随迁移提交；回滚脚本从它恢复。
2. **先查行数**：执行前统计生产 `status='published'` 实际张数并报给决策人过目。个位数与三位数的风险量级不同。
3. **Dry-run**：默认只输出转换报告（每张页面 before/after CTA 清单 + 无法识别的落点），加 `--apply` 才写库。
4. **验收判据**：

   > 对每一张页面，**旧模型下所有 CTA 的 `(text, href)` 集合**必须与**新模型经 `resolveCtaHref` 算出的集合**逐一相等。

   本次只改 CTA 的文案与链接，该判据既完整又可自动跑，不依赖人眼看页面。任一张不相等即中止迁移。

## 7. 校验重构

**分两步删，不能一次做完**：`cta.link` 字段在阶段 1 就消失了，读它的代码同期必须改；但阶段 1 的完成定义是「行为什么都没变」，所以先做**等价改写**，阶段 2 才真正删除。

| 目标 | 阶段 1（等价改写，行为不变） | 阶段 2（删除） |
|---|---|---|
| `blankPrimaryCtaLinks()`（`registry.drafts.ts:81` 调用） | 改为清空 `contact` 里主渠道对应的值 —— 与「置空 `hero.cta.link`」语义等价 | 整个函数删除，改由「默认选中联系方式面板 + 发布门槛」承接 |
| `PLACEHOLDER_CONTACTS` 全文扫描 | 保留（此时模板占位号已收敛进 `contact`，扫描仍能命中） | 删除 —— 号码只存一处、必填、过 E.164 校验，占位号无处可藏 |
| `collectContactIssueItems` 对 `hero.cta.link` 空值与锚点落点的三处校验 | 改为等价地校验 `contact.primary` 有值、且 `primary==="form"` 时表单已启用 | 并入下方新校验表，旧函数删除 |

**阶段 2 新增**（全部作用于 `contact` 一个对象）：

| 规则 | 复用 |
|---|---|
| `primary` 对应渠道必须有值 | — |
| `primary === "form"` 时 `leadForm.enabled` 必须为真 | 替代原 `anchorTargetIssue` |
| 号码必须 E.164 | `lib/leads/contact-format.ts` 的 `isE164` |
| telegram 必须能归一 | 同上的 `normalizeTelegram` |
| `{kind:"channel"}` 引用的渠道必须有值 | 否则该 CTA 不渲染，需提示 |

占位假号从此无处可藏：号码只存一处、必填、过 E.164 校验，模板里的 `+1555…` 常量在阶段 1 随模板改造一并消失。

`validateLink` 保留但缩小职责：只管 `{kind:"url"}` 的二级外链，继续拦交易语义（非交易红线不放松）。渠道类 target 不再经过它。

## 8. 测试策略

### 8.1 `resolveCtaHref` —— TDD

矩阵：3 种 `target.kind` × 5 个渠道 × {值正常 / 值缺失 / 格式非法}。重点：

- 值缺失返回 `null`（不是空字符串，不是 `#`）
- `wa.me` 必须去掉 E.164 的 `+`（`contact-links.ts:36` 踩过）
- `{kind:"url"}` 原样返回不加工

### 8.2 迁移转换器 —— TDD

`convertDraft(oldDraft) → newDraft` 是纯函数。测试喂 52 套模板 draft 与边界样本：空 `hero.cta.link`、同页两个不同 WhatsApp 号、无法识别的 `example.com` 链接。

### 8.3 等价性回归 —— 必须跑在冻结 fixture 上

6.2 的验收判据落成测试。**坑**：阶段 1 结束后旧模型读取代码即删除，测试无法再「用旧代码算一遍」。故必须跑在**冻结 fixture** 上 —— 迁移前把 52 套模板 draft + 生产快照样本导出成 JSON 存进仓库，测试直接读 JSON 的 `link` 字段取旧 href，与新模型算出的比对。fixture 是死数据，不随代码演进失效，同时充当回滚对照物。

### 8.4 全库结构回归

扩展 `landing-editor/samples/templates.structure.test.ts`：

- 每套模板必须有 `contact`，且 `primary` 对应渠道有值
- CTA 的 `target` 不得再出现指向渠道的裸 URL（防改造漏网）
- 阶段 3 追加：`textByChannel` 必须覆盖该模板声明支持的全部渠道

### 8.5 E2E

| 用例 | 断言 |
|---|---|
| 切主渠道 | 主 CTA 的 href 与文案同时跟着变 |
| 表单主 + 悬浮 WhatsApp | 能发布、表单能提交、线索落库 |
| 发布门槛 | 主渠道未填值时拦截，提示指向联系方式面板 |
| 手改文案后切渠道 | 文案**不**被覆盖（`textEdited` 生效） |

定位一律 `getByRole` / `getByLabel`；面板的渠道单选需在实现时即具备可访问名称，不得事后补 `data-testid`。

### 8.6 视觉走查

五种渠道 × 主/悬浮组合的落地页截图，放 `.playwright-mcp/refactor_20260801_留资渠道通用化/`。重点检查主渠道为表单时，页面尾部表单与悬浮 WhatsApp 是否打架。

## 9. 分阶段

| 阶段 | 内容 | 完成定义 |
|---|---|---|
| **1. 地基** | `PageContact` schema + `resolveCta` + 渲染器改造 + 迁移脚本 + 52 套模板机械转成引用。**`textByChannel` 本阶段一律留空**，`text` 原样保留现有文案 —— 保证「什么都没变」 | 迁移跑完，线上已发布页渲染产物**逐张 diff 为空**；`contact` 面板未上线，用户感知不到变化 |
| **2. 能力** | `ContactForm` 面板 + 引导文案 + 悬浮按钮渠道选择 + 校验重构（7 节表格的「阶段 2」列） | 用户能真的切渠道 |
| **3. 打磨** | 52 套补齐 `textByChannel` + `GenerateBriefDialog` 收口 + 画廊筛选语义调整 | 切渠道时文案跟着变 |

阶段 1 的验收标准是**「什么都没变」** —— 纯表示形式重构。这让最危险的一步（含快照的全量迁移）拥有客观、可自动化的正确性判据，与新功能的正确性彻底分开。

## 10. 附带收益

本次改造删除两处「存在只是因为渠道没有真源」的补丁：

- `blankPrimaryCtaLinks` —— 靠置空 2 个字段逼用户填号码，覆盖不全（约 86 处漏网）
- `PLACEHOLDER_CONTACTS` —— 靠发布时全文扫 `1555…` 兜底

两者均在阶段 2 删除（阶段 1 先做等价改写，见 7 节）。

同时合并两份重复的链接拼装逻辑（落地页 CTA 与后台一键联系）。

## 11. 影响的既有约定

`docs/lead-capture-channels.md` 需同步更新：

- 「兜底留资表单 / 转化优先走深链」的定位改为渠道对等，由用户选择
- 「hero CTA 与悬浮按钮一律不动，表单纯属第二通道」（PR #144 的做法）被本设计取代
- `conversion[0] === "form"` 触发 `hero.cta.link` 必须为 `#lead-form` 的结构约束，改由 `contact.primary` 表达

`registry.ts` 的 `conversion` 标签语义从「事实声明」降为「默认推荐」，画廊筛选器文案需相应调整。
