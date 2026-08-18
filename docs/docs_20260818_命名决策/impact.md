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

1. **平台子域 `*.zapbridge.site` 已有真实发布页**。`domains` 表存的是完整主机名（`is_platform_subdomain` 标记，见 `migrations/038_add_platform_subdomain.js`）。换根域会让存量子域站点全部失效。
   - 处理方式：`zapbridge.site` 必须**长期保留并继续解析**，新分配走 `urgizat.site`（或 `.com` 子域）。不能做数据迁移式改名——用户已经把这些地址投到广告里了。
   - 好消息：根域读的是 `process.env.PLATFORM_SUBDOMAIN_ROOT`（`lib/proxy/tenant-proxy.ts:38`、`app/api/domains/platform-subdomain/route.ts:19`），代码零改动，但需要支持**新旧双根并存**，当前实现只认单个根。这是唯一需要写新逻辑的地方。

2. **`support@zapbridge.tech` 出现在 8 个文件**（帮助中心 FAQ 中英、admin shell 中英、超管设置占位符、seed 脚本、测试）。邮件路由在 ImprovMX/Resend 侧，改地址前要先把新域的收发链路验证通。`EMAIL_FROM` 是环境变量，代码不用改。

3. **主域 301**。`zapbridge.tech` → `urgizat.com` 需要全站重定向，否则已被索引的行业中间层（24 张 SSG）、12 篇行业文、5 篇合规簇文章全部丢失。当前品牌信号极低（三个月 47 次展现），SEO 损失很小——**这是改名成本最低的时间窗**。

### B. 中风险 —— 需要逐处改且有守卫测试

4. **`lib/i18n` 是重灾区，79 处 / 28 文件**。`brand: "Zap Bridge"` 虽在 `lib/i18n/dictionaries/{en,zh}/common.ts:2` 定义为事实源，但**大量文案把品牌名硬编码进了句子里**，密度最高的是 `templateIndustry.ts`（中英各 12 处）、`emails/{zh,en}.ts`（各 5 处）、`auth.ts`（各 4 处）。改名时应顺手把这些改成引用 `common.brand`，否则下次再改还是散的。

5. **17 个测试文件断言了品牌串或域名**，改名会一起变红：
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

6. **硬编码兜底值**：`lib/seo/site.ts:14` 的 `process.env.NEXT_PUBLIC_APP_URL || "https://zapbridge.tech"`。生产由 Vercel 注入，但兜底值要同步改。

7. **自检器 User-Agent**：`lib/tools/fetch-page.ts:205` 的 `ZapBridgeLandingPageCheck/1.0 (+https://zapbridge.tech/tools/landing-page-check)`——对外可见，会出现在被检测站点的日志里。

8. **法务文本**：`components/marketing/legal-content/{zh,en}.ts` 的隐私政策正文写死了「Zap Bridge（通过 zapbridge.tech 及相关子域名提供）」。改名等于修改已生效的法律文件，需要标注版本与生效日期，不能静默替换。

### C. 低风险 —— 改一次就完

9. `package.json:2` 的 `"name": "zapbridge"`
10. `docker-compose.yml` 的 `POSTGRES_DB: zapbridge`（仅本地开发库，改动伴随本地重建）
11. `README.md:1` 标题
12. `components/brand/BrandMark.tsx` 与 `public/brand-mark.svg`（视觉资产，需重做）
13. `CLAUDE.md` 及 `docs/` 下非 archive 的说明文档

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
2. 实现**双子域根并存**（唯一的新逻辑），先上线，验证存量 `*.zapbridge.site` 不受影响
3. 再做代码内的文案替换，顺手把硬编码品牌串收敛到 `common.brand`
4. 跑全量测试，用那 17 个测试文件当漏改检测器
5. 最后切主域 301 并提交 GSC

第 2 步与第 5 步之间可以间隔任意长时间，不必一次做完。
