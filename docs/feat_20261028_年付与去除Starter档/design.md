# 年付与去除 Starter 档 · 设计

分支：`feat_20261028_年付与去除Starter档`　风险等级：高（计费 / 数据库约束 / 外部收款渠道）

## 1. 已定的产品决策（2026-10-28 用户拍板）

| 决策 | 内容 |
|---|---|
| 主攻客户 | 代运营方与外贸工厂兼顾 |
| 档位 | 去掉 Starter，保留 Free / Pro / Agency 三档 |
| 年付 | 新增年付，上线定价为月费 × 10（相当于送 2 个月）；**倍数不做代码约束**，以 Dodo 后台定价为准（用户 10-28 追加决定） |
| 后台顺序 | 后台计费页 Free 置后（`PAID_FIRST_PLAN_ORDER`），官网顺序不变 |

## 2. 价位与细节（2026-10-28 已确认）

| # | 决策 | 结论 |
|---|---|---|
| Q1 | 月费 | **Pro $39、Agency $149**；年付 $390 / $1,490。Pro 不取 $49：功能上站得住，但零付费客户、零案例时陌生品牌 $49 门槛过高；满足「10 个付费客户 + 案例 / 补上 A/B 测试 / 补原生集成」任两条后再涨 |
| Q2 | Agency 域名 | 不限 → **25 个** |
| Q3 | 定价页默认展示 | **默认月付**，切换器标「年付省 2 个月」 |

## 3. 事实依据

- 生产（damp-poetry，2026-10-28 查询）：4 个用户，**付费订阅 0**；`plan`/`comp_plan` 为 `starter` 的 0 人；邀请表 0 条。→ 改价、删档不影响任何现有付费客户。
- 竞品（第三方汇总，口径基本一致）：Unbounce 入门 $99/月；Leadpages $49 / $99；Instapage $99 起；GoHighLevel $97 / $297 / $497（代运营方普遍已在付）。
- 现价 $5.99 / $19.99 / $49.99，最高档不到竞品入门价的一半。
- 外贸工厂的人民币：Dodo Adaptive Currency 已在结账页按账单地址显示 CNY（见 `docs/billing-currency.md`），**不另做人民币套餐**；中文面继续展示「约 ¥」参考价（年付同样适用）。

## 4. 方案

### 4.1 档位配置（`lib/plans.ts`）

- 价格：Pro 3900 / 39000 美分，Agency 14900 / 149000 美分（以 Dodo live 产品为准，构建期同步）。

- `PlanId` 去掉 `"starter"`；`PLAN_ORDER = ["free", "pro", "agency"]`。
- Pro 维持现有权益（20 页 / 5 域名 / 去水印 / 全平台追踪 + CAPI / Webhook / AI 80）。
- Agency：`domainsLimit` Infinity → 25；其余不变。
- 注册试用仍为 Pro 14 天；Free 的升级目标从 Starter 改为 Pro（`UpgradeDialog`）。

### 4.2 计费周期（新概念 `BillingInterval = "month" | "year"`）

| 层 | 改动 |
|---|---|
| Dodo 产品 | 用户在 Dodo 后台新建 `Pro 年付`、`Agency 年付` 两个产品（每 1 年扣款），并改 Pro/Agency 月付价；停用 Starter 产品 |
| 环境变量 | 新增 `DODO_PRODUCT_PRO_YEARLY`、`DODO_PRODUCT_AGENCY_YEARLY`；删除 `DODO_PRODUCT_STARTER`（`check-env.mjs` 同步） |
| 价格快照 | `prices.json` 改为 `plans: { pro: { month, year }, agency: { month, year } }`；`extractUsdCents` 增加 `yearly` 校验（每 1 年）。~~构建期断言 year = month × 10~~（已按用户决定移除：定价由运营在 Dodo 自由调整；「省 N 个月」改为按实价算，不整齐时不显示） |
| 产品映射 | `dodoProductMap` 改为 product → `{ plan, interval }`；结账 / 换档按 `(plan, interval)` 取产品 |
| 接口 | `POST /api/billing/checkout`、`/change-plan` 入参增加 `interval`（缺省 `month`，向后兼容）；白名单校验 |
| 数据库 | 迁移 057：`users.billing_interval TEXT CHECK (IN ('month','year'))`，webhook 激活时写入、结束时清空；同时把 `users_plan_check` / `users_comp_plan_check` 去掉 `starter`。**迁移内先断言不存在 starter 行，有则 throw 回滚**（不做静默映射） |
| Webhook | `subscription_activated` 事件携带 `interval`，`lib/billing/apply.ts` 落库 |
| Creem | 同构加 `CREEM_PRODUCT_*_YEARLY`；当前 active provider 是 Dodo，Creem 未配年付产品时年付结账返回明确的 503 业务码，不影响月付 |

### 4.3 展示（`PlanComparison`）

- 顶部加「月付 / 年付」切换（单选按钮组，键盘可达）；年付时价格显示 `$490/年`，下附「相当于 $40.83/月 · 省 $98」（折合月价向下截断到分）。
- 组件改为 `"use client"`（切换需要状态），支持受控（后台传 `interval` + `onIntervalChange`，按钮据此结账）与非受控（营销站）。
- **为避免把全部营销字典打进客户端包**：组件改为由调用方传入 `plans` 字典切片，而不是在组件内 `getDictionary`。
- 后台计费页：当前订阅周期来自 `billing_interval`，同档月付 ↔ 年付切换走 `change-plan`；按钮文案「改为年付」等。
- 文案：去掉所有 Starter 相关描述（帮助中心、FAQ、fit、追踪门控注释等，约 50 处）；`fit` 只剩三档。

### 4.4 不做

- 人民币固定价（Localized Pricing）——会与「约 ¥」展示产生随汇率漂移的偏差，见 `docs/billing-currency.md` 护栏。
- 子账号 / 席位（2026-08-03 已决定跳过）。

## 5. 上线顺序（避免官网价与结账价不一致的窗口）

1. 用户在 Dodo **live** 后台：改 Pro/Agency 月付价、新建两个年付产品、记下产品 id（已提供：Pro `pdt_0NqhpIf5gjgXzg0R20Jl3`、Agency `pdt_0Nqhp929wouEppPA2vIHm`）。
2. 用户（或我经 Vercel CLI）在 Vercel 生产环境配置 `DODO_PRODUCT_PRO_YEARLY`、`DODO_PRODUCT_AGENCY_YEARLY`。
3. 合并 PR → `vercel-build` 自动跑迁移 057 + 价格同步 → 部署。
4. 生产复查：定价页三档 + 年付切换；Dodo test mode 走一遍月付 / 年付结账与 webhook 落库。
5. 确认无误后在 Dodo 后台归档 Starter 产品。

## 6. 测试策略

- 先写失败测试：`PLAN_ORDER` 不含 starter；年付价原样进快照；product ↔ (plan, interval) 映射往返；webhook 年付产品落 `billing_interval='year'`；接口拒绝非法 interval；折合月价截断。
- 迁移在本地库演练 up/down，并演练「存在 starter 行时 throw」。
- E2E：定价页月付/年付切换（中英、桌面/手机）、访客按钮仍去注册页；后台计费页按钮随周期变化。
- 文案守卫：新增「界面与字典不再出现 Starter」守卫。
