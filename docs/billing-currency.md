# 计价货币与本地货币展示

**收款货币为美元**（2026-07-30 由 CN¥ 切换）。本文说明「官网展示价」与「结账页扣款价」两条独立链路，以及切换收款渠道时的隐性代价。

## 两条链路，各管一段

| 环节 | 由谁决定 | 实现 |
|---|---|---|
| 官网/后台展示的价格 | **构建期 Dodo 定价快照** | `scripts/sync-dodo-prices.ts` 在 `vercel-build` 中拉取 Dodo 产品定价写入 `lib/pricing/prices.json`，`lib/plans.ts` / `lib/credits.ts` 从中读美元价；中文面经 `lib/pricing/fx-server.ts` 取实时汇率，附「约 ¥xx」 |
| 结账页实际扣款的币种与金额 | **收款渠道** | Dodo Adaptive Currency（Dashboard 开关）；金额本身来自 Dodo/Creem 后台的 product 定价 |

关键约束：**没有任何收款渠道能驱动你自己网站上的价格展示。** Dodo 官方文档明确 Adaptive Currency 只作用于 Dodo 结账页。所以官网的本地货币换算必须自己做，两者是互补而非二选一。

对应地，展示价**以 Dodo 后台产品定价为唯一事实源**：改价 = 在 Dodo 后台改 product 定价 → 重新部署（价格在构建期取一次，不重新部署官网不会变）。代码里不再手写价格数字，`lib/pricing/prices-source.test.ts` 守住这一点。

## 构建期价格同步

- 入口：`pnpm prices:sync`（`vercel-build` 在 `next build` 前自动执行）。按 `DODO_PRODUCT_PRO/AGENCY`（月付）、`DODO_PRODUCT_PRO_YEARLY/AGENCY_YEARLY`（年付）、`DODO_CREDITS_50/200` 逐个 `products.retrieve`，金额以美分整数写入 `lib/pricing/prices.json`（每档 `{ month, year }`）。
- 校验从严（`lib/pricing/dodo-prices.ts`）：非 USD、月付产品不是每 1 个月 / 年付产品不是每 1 年、带折扣、按需付费，一律报错——这些形态下官网展示与实际扣款对不上。
- **年付价与月费的倍数不做约束**（2026-10-28 用户决定）：定价由运营在 Dodo 后台自由调整。展示侧按实际价格算：每档的「省 $x」由月费 × 12 − 年付价得出；切换按钮上的「省 N 个月」只在各付费档都恰好省整数个月且一致时显示（`yearlySavedMonths`），否则隐藏，避免说假话。
- 失败策略：**生产构建（`VERCEL_ENV=production`）取价失败即中止构建**，宁可部署不上也不展示错价；本地 / Preview / CI 无凭据时沿用仓库内快照并告警。
- 仓库内的 `prices.json` 只是兜底快照：生产构建会就地覆盖，不回写 Git。想让快照与线上一致，配好 live 凭据后本地执行 `pnpm prices:sync` 再提交 diff；**勿用 test_mode 凭据刷新后提交**。
- 只认 Dodo：super-admin 切到 Creem 时，展示价仍是 Dodo 定价，Creem 后台产品价需人工保持一致。

## 展示侧：实时汇率 + 兜底

- 取数：`lib/pricing/fx-server.ts`，免密钥公开接口 + `revalidate: 86400`。
- 兜底：非 2xx、返回结构变化、数值落在 5~10 区间外，一律回落到 `USD_TO_CNY_FALLBACK`（`lib/pricing/fx.ts`，人工维护，注释标更新日期）。汇率只影响一个参考数字，不值得让定价页整页报错。
- 英文面不发起请求（`getCnyRateForLocale` 直接返回 null），页面保持纯静态。
- 文案必须保留「约」字：这是参考换算，不是结算金额。

## 结账侧：Dodo Adaptive Currency

按账单地址自动检测国家，用实时汇率在结账页显示当地货币；支持 CNY（最低 4.00 CNY），订阅与一次性付款均适用。

**开启方式是 Dashboard 开关，不是代码**：Merchant Dashboard → Settings → Business → Adaptive Pricing。

换汇费 4%（订单 <$500），默认由客户承担；开启 **Fees Inclusive** 后由商户吸收，客户看到的 CNY 价与官网「约 ¥xx」一致。**不开 Fees Inclusive 就会出现官网与结账页约 4% 的落差**，务必二选一，不要放任不管。

### ⚠️ 不要给 CNY 加 Localized Pricing 规则

Dodo 另有 **Localized Pricing**（产品编辑页的开关，可按币种或按国家设**固定价**，永不换算）。它与 Adaptive Currency 的关系是：**有匹配规则时 Localized 优先**，且命中规则的交易强制 fees-inclusive。

本项目 2026-07-30 评估后**刻意不用**它，选择了「美元基础价 + Adaptive Currency 自动换算」：一次 Dashboard 开关即覆盖全部国家（含中东、东南亚等 COD 市场），无需给每个产品逐个配规则。

**这构成一条护栏**：一旦有人给 CNY 配了 Localized 固定价（如 ¥138），官网按实时汇率算出的「约 ¥135.41」就与实际扣款不符——那不再是 4% 的费用差，而是随汇率漂移的任意偏差。若将来确实要改用固定人民币价，必须同时改代码：在 `lib/plans.ts` 增加与 Dodo 规则同源的固定 CNY 价，并删除 `lib/pricing/fx*.ts`、`/api/fx/usd-cny` 与字典里的 `approxCny`，中文面改为直显真实价、去掉「约」字。

### 为什么代码里不传 `adaptive_currency_fees_inclusive`

该参数只存在于 `payments.create` / `subscriptions.create` / `subscriptions.changePlan` 等请求类型上，**`checkoutSessions.create`（本项目建结账会话所用的 API）的 `CheckoutSessionRequest` 没有这个字段**（已核 `node_modules/dodopayments/resources/checkout-sessions.d.ts`）。因此本项目只能依赖 Dashboard 层的设置。

`changePlan`（升降档）确实接受该参数，但 SDK 注释写明「If not specified, uses the subscription's stored setting」——不传即继承订阅创建时的设置，与 Dashboard 保持一致即可，无需在代码里硬编码。

## 切换收款渠道的隐性代价

**Creem 没有等价能力**：官方文档（含 `llms-full.txt`）无多币种/自适应货币章节，产品创建示例只见 USD，普遍报道为仅支持 USD/EUR 计价。

super-admin 把 active provider 从 Dodo 切到 Creem 时，中国客户的结账页会退回美元计价、由发卡行换汇。这不是代码 bug，是渠道能力差异——切换前需知情。
