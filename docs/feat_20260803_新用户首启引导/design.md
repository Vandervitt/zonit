# 新用户首启引导 · 设计

分支：`feat_20260803_新用户首启引导`
状态：**已批准，实施中**

## 1. 前提修正：backlog 里的「激活门槛」已经不是原来那个问题

backlog（`project_review_followup_backlog` 第 2 项）长期写着「Free 不能发布 →
新用户建完页撞墙」。**该命题已于 08-01 被解掉，且原始描述本身也不准确**：

- 注册即得 Pro 7 天（`lib/plans.ts:64` `SIGNUP_TRIAL_PLAN`，走 comp_plan）
- Free 稳态是 1 张在线页 + 水印，不是零发布（PR #148 / #150 已把营销面文案改对）
- 真正的断点「必须自己有域名并会改 DNS」由平台子域解掉（PR #145/146/147）。
  `app/api/domains/platform-subdomain/route.ts` **不做套餐门控**，任何登录用户
  都能领一个 `*.zapbridge.site`

所以本次把这一项**重定义为「新用户首启引导」**：发布门槛没了之后，漏斗还剩两个
可验证的洞。以下两个都不是推测，是读代码读出来的。

## 2. 要解决的两个问题

### 问题一：上手清单被平台子域打穿（真实缺陷）

`app/admin/(workspace)/page.tsx:19-25` 的 4 步清单，第 2 步是「绑定并验证域名」，
判定依据为 `domain_verified` 里程碑。而平台子域**刻意不记这个事件**
（`platform-subdomain/route.ts` 有明确注释：掺入平台分配的子域会让上线前后的
漏斗不可比）。

后果，对走零门槛路径的用户（领子域 → 发布 → 收线索）：

1. 第 2 步**永远不打勾**
2. `allDone` 因此永远为 false，清单**永不消失**
3. 清单还在催他「去绑定域名」——正是子域功能想消除的那一步

### 问题二：7 天试用没有任何提醒

`app/api/cron/daily/route.ts` 七个子任务里没有试用相关的；
`app/admin/(workspace)/billing/page.tsx:239` 只静态显示一个到期日期。
用户注册后 7 天静默流逝，到期回落 Free 时无感知、无召回。

## 3. 方案一：清单改判实时状态（不动里程碑表）

| | 做法 | 评价 |
|---|---|---|
| **A（采纳）** | 第 2 步改判实时状态：`domains` 里存在 `verified === true` 或 `is_platform_subdomain === true` | 里程碑表保持纯净、漏斗仍可比；dashboard 已在拉 `domains`，零新增请求；「有没有发布地址」本来就是状态不是事件 |
| B | 新增 `publish_address_ready` 里程碑，领子域也记 | 要动 schema，且往五步漏斗塞第六个事件，污染既有语义 |
| C | 删掉第 2 步变 3 步 | 最省事，但丢掉「你需要一个地址」的引导——新用户恰恰不知道 |

采纳 A。改动：

- 第 2 步 → 标题「拿到发布地址」，说明「领取免费平台子域，或绑定自有域名」
- 判定来源在类型上显式区分：三步查 milestone、这一步查 domains 状态，
  不让后来者误以为整个清单同源
- 第 3 步说明「发布到**已验证域名**」也要改，现在的措辞排斥子域
- `allDone` 随之能真正为 true，清单会消失

## 4. 方案二：三封试用邮件序列

用户已定：T-3 提醒、T+0 到期、T+1 挽回，共三封；邮件**不带成绩数据**
（不查已发布页数 / 线索数）。

### 4.1 冲突：到期当天用户会收到两封

`sweepPublishQuota`（`lib/publish-quota-sweep.ts:29`）在同一次 cron 里跑。
comp_plan 到期那天额度从 Pro 20 张掉到 Free 1 张，超额用户立刻触发
`start_grace` 分支并发信「你有 7 天宽限，之后自动下线」。到期信会撞上它。

**规则：同一时期只跑一条邮件序列，超额者优先走配额信。**

| 用户 | T-3 | T+0 到期 | T+1 挽回 |
|---|---|---|---|
| 已发布页 ≤ 新档额度（不超额） | 发 | 发 | 发 |
| 超额（会收配额信 start/remind/enforced） | 发 | **跳过** | **跳过** |

超额用户的到期叙事由既有配额信承担——它内容更具体（几张页、还剩几天、
哪几张会下线）。T-3 时配额序列尚未开始，不冲突。

判定：查询里多一个已发布页数聚合，与新档（回落后的生效档）额度比较。

### 4.2 幂等：新建小表，不加列

一列存不下三个阶段；且超管可二次赠送，同一用户要能重跑整个序列。

**迁移 041**：

```sql
CREATE TABLE trial_emails (
  user_id          TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  stage            TEXT NOT NULL CHECK (stage IN ('t_minus_3','expiry_day','win_back')),
  grant_expires_at TIMESTAMPTZ NOT NULL,
  sent_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, stage, grant_expires_at)
);
```

`grant_expires_at` 进主键 = 用到期时刻标识赠送实例，超管再赠一次（新的到期时刻）
序列自然重跑。幂等沿用 `platform_milestones` 的 `ON CONFLICT DO NOTHING`。
`user_id` 用 TEXT——全库 id 均为 text。

### 4.3 上线安全：窗口必须窄

⚠️ 合并当天库里已有一批早就过期的 comp_plan 用户。若判定写成「已过期且没发过」，
第一次 cron 会给所有历史用户群发挽回信。

三个阶段一律用**窄区间**，历史用户天然落在窗口外，无需额外 backfill 标记：

- `t_minus_3`：`expires_at ∈ (now, now+3d]`
- `expiry_day`：`expires_at ∈ (now-1d, now]`
- `win_back`：`expires_at ∈ (now-2d, now-1d]`

代价：cron 漏跑一天会漏一封，**不补发**。有意为之——宁可少发一封，也不要在第 10 天
突然告诉人家「你的试用昨天到期了」。

三阶段都要求 `plan = 'free'`（期间已付费的不打扰）。

### 4.4 落点

`cron/daily` 第八个子任务，照现有写法 try/catch 隔离 + 返回体带
`trialEmailsError`。⚠️ 已知坑：子任务失败仍返 200，验证必须查返回体而非只看状态码。

## 5. 测试

- `lib/billing/trial-emails.test.ts`：三窗口各自两端边界、已发过不重发、
  付费用户排除、超额者跳过后两封、历史过期用户不发
- 清单渲染测试：只有平台子域的用户第 2 步必须打勾、四步齐全时清单消失
  ——这条直接钉死本次缺陷
- 缺陷部分先写红再改（bugfix 一律先复现）

## 6. 明确不做

- 全屏 onboarding wizard / 产品导览：已有清单这个载体，再叠一层无数据支撑
- 到期邮件带用户成绩数据（用户已定不要）
- 漏发补偿机制（见 4.3 的取舍）
