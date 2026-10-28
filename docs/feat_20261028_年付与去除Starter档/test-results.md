# 测试结果 · 年付与去除 Starter 档（2026-10-28，本地）

## 自动化

| 层 | 命令 | 结果 |
|---|---|---|
| 单元 | `npx vitest run` | 185 文件 / 1955 条全过 |
| 类型 | `npx tsc --noEmit -p .` | 通过 |
| Lint | `npx eslint` | 0 错误（20 条警告均为既有文件） |
| E2E 营销站 | `npx playwright test e2e/i18n.spec.ts` | 35 条全过（新增：年付切换显示年价与折合月价、档位无 Starter） |
| E2E 后台 | `RUN_DB_E2E=1 npx playwright test e2e/admin-i18n.spec.ts e2e/gallery-and-pages.spec.ts e2e/rfq-landing.spec.ts` | 11 条全过 |

先见红的新测试：快照年付取价、产品 ↔ (档位, 周期) 映射、webhook 年付产品落 `interval: "year"`、结账 / 换档接口的 interval 校验与 503 业务码、`billing_interval` 落库、`planAction` 按钮判定、档位精简与 Agency 25 域名、年付价格文案（折合月价截断、千分位）、文案无 Starter 守卫（另以临时插入 Starter 验证会报红）。

> 10-28 追加：按用户决定移除 ×10 断言，改为「倍数不约束、原样进快照」的测试；「省 N 个月」改由 `yearlySavedMonths` 按实价计算；后台计费页 Free 置后（`PAID_FIRST_PLAN_ORDER`）。

## 迁移 057（本地开发库演练）

| 场景 | 结果 |
|---|---|
| 存在 `comp_plan='starter'` 行时 up | 退出码 1，`RAISE EXCEPTION` 整体回滚：迁移记录停在 056、`billing_interval` 列未建 |
| 清理后 up | 成功；`users_plan_check` = free/pro/agency，`users_comp_plan_check` = pro/agency，新增 `users_billing_interval_check` |
| down → up | 均成功，down 恢复含 starter 的旧约束 |

## 落库（本地真实库，非 mock）

对测试用户依次应用：年付激活 → `plan=agency, billing_interval=year, billing_subscription_id=sub_check`；订阅结束 → `plan=free, billing_interval=null`。测试后已恢复原值。

## 界面走查（Playwright 截图，`.playwright-mcp/annual-pricing-20261028/`）

- 定价页中文桌面：月付 $39 / $149；切年付 $390/年「相当于 $32.50/月 · 省 $78」、$1,490/年「相当于 $124.16/月 · 省 $298」（折合月价截断，不四舍五入）；Agency 25 个域名。
- 定价页英文手机 390px：卡片布局、无横向溢出。
- 后台计费页（本地库临时设为月付 Pro 订阅者，测后恢复）：切年付后 Pro 显示「改为年付」、Agency 显示「升级」。

## 未覆盖

- 真实 Dodo 结账与 webhook：需用户先在 Dodo 建年付产品并配置 env，上线后用 test mode 走一遍（见 design.md §5）。
