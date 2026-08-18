# 更名工程影响面盘点：Zap Bridge → Urgizat

日期：2026-08-18　　状态：仅盘点，未执行改动

## 总量

代码库（排除 `node_modules`/`.next`/`.git`/lockfile）共 **407 处 / 131 文件**命中品牌串。

| 变体 | 处数 | 文件数 |
| --- | --- | --- |
| `Zap Bridge` | 163 | 70 |
| `zapbridge` | 194 | 65 |
| `ZapBridge` | 4 | 4 |
| `zapbridge.tech` | 67 | 26 |
| `zapbridge.site` | 56 | 11 |
| `zapbridge.xyz` | 6 | 2 |

其中 **`docs/archive` 占 75 处 / 28 文件，属历史记录，不改**。实际需要处理的约 330 处。

## 按风险分层

### A. 高风险 —— 会影响线上用户

1. **平台子域 `*.zapbridge.site` 已有真实发布页**。`domains` 表存的是完整主机名（`is_platform_subdomain` 标记，见 `migrations/038_add_platform_subdomain.js`）。

   经核查，**存量子域的解析完全不依赖 `PLATFORM_SUBDOMAIN_ROOT`**：`acme.zapbridge.site` 走 `isCustomDomain()` → `resolveTenantRoute()` → domains 表查询，与根域配置无关（`lib/domains/subdomain.ts` 头部注释已写明这一设计）。该环境变量只有三个使用点：

   | 位置 | 用途 | 切换根域后的后果 |
   | --- | --- | --- |
   | `lib/proxy/tenant-proxy.ts:38-42` | apex 重定向到主域 | 旧 apex 落进租户解析，可能露出历史遗留绑定 |
   | `app/api/domains/route.ts:50-51` | 阻止用户手动添加 `*.{root}` | 旧根可被抢注；因通配 DNS 指向平台，DNS 验证会真的通过 |
   | `app/api/domains/platform-subdomain/route.ts:19,71` | 分配新子域 | 预期行为，新分配本就该走新根 |

   **所以不需要「双根并存」的分配逻辑**，只需把旧根降级为「遗留根」：加一个 `PLATFORM_SUBDOMAIN_LEGACY_ROOTS`（逗号分隔），让前两项对新根与遗留根都生效，第三项只认新根。改动量约 20 行。

### A2. 界面上的旧域字样

要求是「旧域保持可用，但界面不再出现任何旧域字样」。分两类：

**硬编码文案 —— 只有 7 处，直接改：**

| 文件 | 内容 |
| --- | --- |
| `components/marketing/legal-content/zh.ts:18` / `en.ts:19` | 隐私政策正文写死 “通过 zapbridge.tech 及相关子域名提供” |
| `app/admin/(workspace)/help/_content/chapters/{zh,en}/faq.ts:120` | support 邮箱 |
| `lib/i18n/admin/dictionaries/{zh,en}/shell.ts` | support 邮箱 |
| `app/super-admin/settings/FounderContactForm.tsx:76` | 输入框 placeholder |

（另有 2 处在 `app/api/domains/route.ts:47`、`app/api/domains/platform-subdomain/route.ts:18` 的代码注释里，不属界面。）

**渲染的用户数据 —— 需要决策：**

存量用户的 `x.zapbridge.site` 是他们真实的发布地址，会出现在：

- `app/admin/(workspace)/domains/page.tsx` —— 域名列表
- `app/admin/(workspace)/page.tsx` —— 工作台
- `lib/onboarding/checklist.ts` —— 上手清单「拿到发布地址」

这些地址**正在客户的广告里跑**。要同时满足「旧域可用」与「界面无旧域」，唯一解是**给存量子域签发新根的同名地址，旧地址 301 到新地址，界面只显示新地址**。

代价与风险：
- 需要为遗留根加一条子域级 301（tenant-proxy 里新增一个分支，比 apex 重定向复杂一点）
- 广告落地页多一跳重定向，部分投放平台对重定向链有审查
- 需要先知道生产环境实际有多少条 `is_platform_subdomain = true` 的记录；生产 DB 连接串在 Vercel 是 sensitive 取不到，需用户执行一次查询确认量级

若存量数量很小（个位数），逐条人工处理比写迁移逻辑更划算。**此项待定，不影响其余工作先行。**

### A3. 其他

2. **`support@zapbridge.tech` 出现在 8 个文件**（帮助中心 FAQ 中英、admin shell 中英、超管设置占位符、seed 脚本、测试）。邮件路由在 ImprovMX/Resend 侧，改地址前要先把新域的收发链路验证通。`EMAIL_FROM` 是环境变量，代码不用改。

3. **主域 301**。`zapbridge.tech` → `urgizat.com` 需要全站重定向，否则已被索引的行业中间层（24 张 SSG）、12 篇行业文、5 篇合规簇文章全部丢失。当前品牌信号极低（三个月 47 次展现），SEO 损失很小——**这是改名成本最低的时间窗**。

### B. 中风险 —— 需要逐处改且有守卫测试

4. **品牌名 `Zap Bridge` 的界面露出是四端不是三端**：

   | 端 | 处数 | 说明 |
   | --- | --- | --- |
   | 营销站 | 86 | 最大头，`templateIndustry.ts` 中英各 12 处、法务正文各 8 处 |
   | 邮件 | 10 | `lib/i18n/emails/{zh,en}.ts` |
   | admin 后台 | 11 | |
   | **落地页（租户端）** | 5 | ⚠️ 容易漏 |
   | 超管 | 2 | |

   落地页那 5 处最需要注意——它印在**客户的公开页面上**，对外露出最广：
   - `landing-renderer/Watermark.tsx` —— Free/Starter 套餐右下角「Made with Zap Bridge」角标，共 3 处（含 `aria-label`）
   - `landing-renderer/variant.ts:48` —— 反同质化检测的 `META_TOKENS = ["Zap Bridge", "Zap Bridge Sites", …]`，改名后旧 token 要保留还是替换需确认（存量已发布页的 meta 里可能还带旧 token）
   - `landing-renderer/tracking/sinks.ts:63` —— 注释

5. **`lib/i18n` 是重灾区，79 处 / 28 文件**。`brand: "Zap Bridge"` 虽在 `lib/i18n/dictionaries/{en,zh}/common.ts:2` 定义为事实源，但**大量文案把品牌名硬编码进了句子里**，密度最高的是 `templateIndustry.ts`（中英各 12 处）、`emails/{zh,en}.ts`（各 5 处）、`auth.ts`（各 4 处）。改名时应顺手把这些改成引用 `common.brand`，否则下次再改还是散的。

6. **17 个测试文件断言了品牌串或域名**，改名会一起变红：
   ```
   app/robots.test.ts          app/sitemap.test.ts
   lib/seo/sitemap-entries.test.ts   lib/domain.test.ts
   lib/host.test.ts            lib/domains/subdomain.test.ts
   lib/proxy/tenant-proxy.test.ts    lib/proxy/locale-proxy.test.ts
   lib/tools/robots.test.ts    lib/leads/origin-guard.test.ts
   lib/contact/channel-href.test.ts  lib/auth/trusted-email.test.ts
   landing-renderer/variant.test.ts  landing-renderer/tracking/sinks.test.ts
   app/api/domains/route.test.ts     app/api/domains/platform-subdomain/route.test.ts
   e2e/helpers/db.ts
   ```
   这些不是负担而是安全网——它们会精确指出哪些位置漏改。

7. **硬编码兜底值**：`lib/seo/site.ts:14` 的 `process.env.NEXT_PUBLIC_APP_URL || "https://zapbridge.tech"`。生产由 Vercel 注入，但兜底值要同步改。

8. **自检器 User-Agent**：`lib/tools/fetch-page.ts:205` 的 `ZapBridgeLandingPageCheck/1.0 (+https://zapbridge.tech/tools/landing-page-check)`——对外可见，会出现在被检测站点的日志里。

9. **法务文本**：`components/marketing/legal-content/{zh,en}.ts` 的隐私政策正文写死了「Zap Bridge（通过 zapbridge.tech 及相关子域名提供）」。改名等于修改已生效的法律文件，需要标注版本与生效日期，不能静默替换。

### C. 低风险 —— 改一次就完

10. `package.json:2` 的 `"name": "zapbridge"`
11. `docker-compose.yml` 的 `POSTGRES_DB: zapbridge`（仅本地开发库，改动伴随本地重建）
12. `README.md:1` 标题
13. `components/brand/BrandMark.tsx` 与 `public/brand-mark.svg`（视觉资产，需重做）
14. `CLAUDE.md` 及 `docs/` 下非 archive 的说明文档

## 仓库之外必须同步的项

代码只是一部分，以下都不在 grep 结果里：

| 系统 | 动作 |
| --- | --- |
| Vercel | 添加 `urgizat.com` 域名、更新 `NEXT_PUBLIC_APP_URL`、配置旧域 301；**加环境变量后必须 redeploy 才生效** |
| DNS | `urgizat.com` 解析；`zapbridge.tech`/`.site` 保留 |
| Resend / ImprovMX | 新域收发验证、`EMAIL_FROM` 切换 |
| Google Search Console | 新增 property；**历史数据不迁移**，品牌信号从零重建 |
| Dodo Payments | webhook URL、结账页展示的品牌名 |
| Sentry | 项目名 |
| GitHub | 仓库名（`Vandervitt/zonit`，本来就与品牌不一致，可一并处理） |

## 建议的执行顺序

1. 先把仓库外的基础设施搭好（DNS、Vercel 域名、邮件链路），确认新域可访问
2. 加 `PLATFORM_SUBDOMAIN_LEGACY_ROOTS`，把旧根降级为遗留根（约 20 行），先上线，验证存量 `*.zapbridge.site` 不受影响、旧 apex 仍重定向、旧根仍不可被抢注
3. 做代码内的文案替换（四端 + 邮件），顺手把硬编码品牌串收敛到 `common.brand`；旧域硬编码那 7 处一并清掉
4. 跑全量测试，用那 17 个测试文件当漏改检测器
5. 切主域 301 并提交 GSC
6. 存量子域是否迁移到新根（见 A2）单独决策，与上述步骤解耦

第 2 步与第 5 步之间可以间隔任意长时间，不必一次做完。
