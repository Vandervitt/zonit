# admin 端国际化（中 / 英）设计

## 背景与要推翻的旧决策

`lib/plans.ts` 文件头此前写着：

> 由下方展示层函数按 locale 组装——公开营销面出双语，**/admin 后台固定取中文**。

营销站国际化（PR#115）时刻意把后台排除在外，因为当时客户全是中文使用者。现在平台子域发布上线、
英文面开始进人，后台满屏中文等于把已有能力对英文用户藏起来。本次改造推翻这条决策，
该注释必须同步改写——它是被 `planEntitlementLines(locale)` 等展示层函数实际依赖的口径说明。

## 范围

| 面 | 中文文案量 | 本次是否做 |
|---|---|---|
| `app/admin/` 工作台 8 页 + `_shell` | 781 行 | ✅ |
| `landing-editor/` 编辑器 | 630 行 / 50 文件 | ✅ |
| 帮助中心 12 章 | 1166 行长文 | ✅ |
| `lib/email.ts` 邮件模板 + `app/api/` 错误信息 | 122 行 | ✅ |
| `app/super-admin/` | 163 行 | ❌ 内部超管工具，保持中文 |
| 生成的落地页内容 | — | ❌ 面向租户访客，另有 schema 与 `PageContact` 体系 |

## 架构决策

### D1：admin 字典独立成体系，不并入营销站主 `Dictionary`

`components/marketing/LocaleSwitcher.tsx:5` 是**客户端组件且直接 `import { getDictionary }`**。
若把 admin 文案作为新切片加进主 `Dictionary`，约 2700 行 admin 文案 ×2 语言会被打进营销站
首页的客户端 bundle——而首页 LCP 是专门优化过的（3.74s → 0.32s，见 PR#74/#75）。

故新建 `lib/i18n/admin/`，自有 `AdminDictionary` 类型与 `getAdminDictionary()`。
复用的是营销站字典的**手法**（按业务域切片、`en` 为事实源、`zh` 用 `satisfies` 编译期对齐），
不是它的**对象**。两套字典互不 import。

### D2：`/admin` URL 不变，不做 `/zh/admin` 镜像

营销站的 `/zh` 镜像树是为「同一内容两个 URL 都要被搜索引擎收录」设计的，配套整套
canonical / hreflang / og:locale（`lib/seo/site.ts`）。后台是登录态私有页，没有这个诉求；
`e2e/i18n.spec.ts:261` 还有一条守卫用例要求 `/zh/admin` 必须 404。镜像树在这里只有成本没有收益。

### D3：locale 存 `users.locale`，服务端解析后经 Context 下传

admin 9 个业务页里 8 个是整页 `"use client"`，且 `layout.tsx` 拿不到 `children` 的 props 通道
（`children` 由 Next 路由系统注入），**逐页传 props 不可行，只能走 Context + hook**。

解析优先级（`resolveAdminLocale`）：

```
users.locale（DB，用户显式选择）  →  zb_locale cookie（注册来源）  →  defaultLocale (en)
```

- **存量用户**：迁移 046 把现有行 backfill 成 `'zh'`，绝不改变老客户下次登录看到的界面。
- **新用户**：`users.locale` 保持 `NULL`，由 layout 在渲染时读 `zb_locale` cookie 兜底——
  刚注册完浏览器还带着他浏览营销站时的语言，效果等同于"跟随注册来源"。

  **刻意不在注册路径写这一列**：建号发生在 `auth.ts` 的 `signIn` 回调与
  `lib/auth/provision.ts` 里，要拿 cookie 就得在 `auth.ts` 引 `next/headers`。
  而 `auth.ts` 被 `proxy.ts`（中间件）import，把 `next/headers` 拖进中间件 bundle
  有打挂中间件的风险——中间件挂了是全站 404，代价远大于这点收益。
  代价是用户在显式选择语言前换设备会回落到默认语言，可接受。
- 列**可空**而非带 default：`NULL` 表达「此人从未表过态」，与「显式选了 en」可区分。
  若给 default 值，新用户会被静默钉到某个语言而无从分辨是不是他自己选的。

### D4：插值用函数式字典值，不引入 i18n 库

本项目此前**完全没有插值机制**（唯一的 `fillCounts` 是针对 `{templates}` 的一次性特判）。
admin 有大量「共 N 条线索」「N 天后到期」这类文案。方案是让字典值可以是函数：

```ts
// en
leadCount: (n: number) => `${n} lead${n === 1 ? "" : "s"}`,
// zh
leadCount: (n: number) => `共 ${n} 条线索`,
```

`satisfies AdminDictionary` 会连函数签名一起校验——中英两份参数不一致照样编译报错。
英文复数由函数自己处理，够用且零依赖。引入 next-intl 的 ICU 能力这里用不上，
代价却是让全站长期维护两套 i18n 机制。

### D5：日期有三条独立路径，必须一起切

1. antd `ConfigProvider locale`（`AdminProviders.tsx:16` 硬编码 `zhCN`）→ 分页器、Popconfirm、DatePicker 面板
2. `dayjs` 全局 locale（**当前全仓从未设置**，是既有盲点）→ `format()` 的星期名等
3. 裸 `new Date(t).toLocaleString()`（`landing-pages/page.tsx:223`、`leads/page.tsx:371` 等）
   → 不受前两者影响，格式随运行环境漂移

第 3 条统一收敛到 `formatDateTime(value, locale)` 工具函数。

## E2E 策略

被翻译的恰恰是可访问名本身，`getByRole("link", { name: "邮件" })` 在英文下必然失效。
仓库里已有正解且已被同一事故催生过一次——`e2e/otp-auth.spec.ts:60-64`：

> ⚠️ 文案从字典取，不写死中文：登录页国际化（PR#115）后 /login 默认是**英文**面，
> 原用例的中文 label 从那时起就再也匹配不上。字典是唯一事实源。

沿用它，并区分**定位**与**断言**：

- **定位**：`getByRole("link", { name: t.leads.contact.email })` —— 引用字典，保住可访问性选择器；
  仅当元素确实没有稳定可访问名时才加 `data-testid`。
- **断言**：关键文案的正确性断言**写死字面量**，钉在 zh。断言也引字典就成了永真断言
  （字典写错照样绿），违反 CLAUDE.md「禁止照抄实现逻辑当断言」。
- **语言钉死**：测试账号在 `e2e/helpers/db.ts` 的 fixture 里显式写 `locale='zh'`，
  不依赖 cookie 或 `Accept-Language`（会随 CI 环境漂移）。
- **双语覆盖**：主流程钉 zh 跑全量 + 一条 admin 双语冒烟 spec（切换器 / 关键页英文渲染）。
  整套跑两遍语言收益递减而 CI 时间翻倍——全量 E2E 本来就有 dev 冷编译首跑大面积红的问题。
- **防漏译**：新增一条 vitest 静态守卫，扫 `app/admin`/`landing-editor` 源码，
  剥掉注释后若 JSX 文本或 antd props 里仍有中文字面量则失败。人工走查 2700 行文案必然漏。

## 交付顺序

| PR | 内容 |
|---|---|
| 1 | 基座：迁移 046 + session 带 locale + `AdminLocaleProvider` + antd/dayjs 联动 + 设置页切换器 + `useAdminT()`；先只接 `_shell` 验证链路 |
| 2 | 工作台 8 页 |
| 3 | landing-editor |
| 4 | 帮助中心双语 |
| 5 | 邮件模板 + API 错误信息 |
| 6 | E2E 定位改造 + 双语冒烟 + 漏译守卫 |

## 风险

- **迁移 046 + session 契约**动到鉴权面，PR1 单独交付并单独走生产验证。
- 邮件异步发送无请求上下文，收件人 locale 必须随查询一起从 DB 带出（PR5 的核心约束）。
- 改 admin 文案会打穿现有 20 个 E2E spec；PR2-5 期间 E2E 处于已知红态，PR6 收口。
  每个 PR 内先保证 vitest 全绿。
