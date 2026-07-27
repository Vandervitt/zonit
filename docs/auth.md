# Auth 模块设计文档

## 概览

本项目认证模块基于 **Auth.js v5 (NextAuth)** 构建，会话数据持久化至 PostgreSQL，路由保护通过 Next.js 16 的 `proxy.ts` 实现。

当前支持的登录方式：

| 方式 | Provider id | 状态 |
|---|---|---|
| Google OAuth | `google` | ✅ 主力 |
| 邮箱验证码（OTP） | `email-otp` | ✅ 主力，支持任意邮箱后缀 |
| 开发直登 | `dev` | 仅 `NODE_ENV=development` 且设置 `DEV_USER_EMAIL` 时激活 |

> **邮箱 / 密码登录已下线**：`credentials` provider、`/api/register` 接口及相关常量均已移除。
> 历史上设过密码的老用户改用同一邮箱走验证码登录即可——`provisionUserByEmail` 按邮箱
> find-or-create，命中已有账号直接返回，不会重复建号，数据与权益完全保留。

> 邮箱域名白名单（曾经的 `TRUSTED_DOMAINS`，仅放行 Gmail 等）**已废弃**。现在只做基础格式校验，邮箱归属真实性由 OTP 验证码保证，单一事实源见 `lib/auth/trusted-email.ts`。

---

## 技术栈

| 依赖 | 版本 | 用途 |
|---|---|---|
| `next-auth` | v5 (beta) | 认证框架 |
| `@auth/pg-adapter` | latest | Auth.js PostgreSQL 适配器 |
| `pg` | latest | PostgreSQL 客户端 |
| `bcryptjs` | latest | 邮箱验证码哈希 |

---

## 目录结构

```
zapbridge/
├── auth.ts                              # Auth.js 核心配置
├── proxy.ts                             # 路由保护（Next.js 16 Proxy）
├── .env.local                           # 环境变量
├── lib/
│   ├── db.ts                            # PostgreSQL 连接池
│   └── auth/                            # OTP、邮箱校验、建号
└── app/
    ├── api/
    │   ├── auth/[...nextauth]/route.ts  # Auth.js 请求处理器
    │   └── auth/otp/send/route.ts       # 发送邮箱验证码
    └── (auth)/
        ├── layout.tsx                   # 认证页面布局
        ├── login/page.tsx               # 登录页（Google + 邮箱验证码）
        └── register/page.tsx            # 注册页（Google + 邮箱验证码）
```

其他相关文件：

| 文件 | 用途 |
|---|---|
| `components/auth/OtpAuthForm.tsx` | 邮箱验证码登录/注册表单 |
| `lib/auth/otp.ts` | 验证码生成、校验、限流 |
| `lib/auth/trusted-email.ts` | 邮箱格式校验单一事实源 |
| `lib/proxy/auth-proxy.ts` | 路由级鉴权与角色分流 |

---

## 认证流程

### Google OAuth 流程

```
用户点击 "Continue with Google"
        │
        ▼
signIn("google") → /api/auth/signin/google
        │
        ▼
跳转 Google 授权页面
        │
        ▼
Google 回调 → /api/auth/callback/google
        │
        ▼
Auth.js 写入 users / accounts 表
        │
        ▼
签发 JWT，写入 authjs.session-token Cookie
        │
        ▼
重定向至 /（仪表盘）
```

### 邮箱验证码（OTP）流程

当前登录页与注册页实际使用的邮箱路径。

```
用户填写 email
        │
        ▼
POST /api/auth/otp/send
        │
        ├── 基础格式校验（isValidEmailFormat，不限域名）
        ├── 限流 / 冷却检查
        └── 生成验证码 → 写入 email_otps 表 → 发信（Resend）
        │
        ▼
用户填入收到的验证码
        │
        ▼
signIn("email-otp", { email, code })
        │
        ▼
Auth.js Credentials.authorize()（provider id = email-otp）
        │
        ├── 校验验证码有效性 / 是否过期 / 尝试次数
        ├── 首次登录则 find-or-create 建号（provisionUserByEmail，
        │   新用户可套用邀请 token 权益）
        └── 账号被禁用则拒绝登录
        │
        ▼（校验通过）
签发 JWT → 重定向至 /admin
```

**防爆破参数**（单一事实源 `lib/auth/otp.ts`）：6 位数字码空间仅 10^6，
靠「短有效期 + 尝试上限 + 发送限流」三重防护。

| 常量 | 值 | 含义 |
|---|---|---|
| `OTP_LENGTH` | 6 | 验证码位数 |
| `OTP_TTL_MS` | 10 分钟 | 有效期 |
| `OTP_RESEND_COOLDOWN_MS` | 60 秒 | 重发冷却 |
| `OTP_MAX_ATTEMPTS` | 5 | 单个码最多校验次数 |

验证码在库中以哈希存储（`hashOtpCode`），不落明文。邮件发送走 Resend
（`sendOtpEmail`），发送接口另有 IP 维度限流。

### 路由保护流程

```
所有 HTTP 请求
        │
        ▼
proxy.ts
        │
        ├── handleTenancy()  ← 多租户域名改写，必须先于鉴权返回
        │
        ▼
lib/proxy/auth-proxy.ts :: handleAuth()
        │
        ├── "/" 营销首页 → 始终放行（已登录也不跳转）
        ├── 已登录访问 /login 或 /register → 跳 /admin
        ├── 命中 PUBLIC_PATHS（按路径段边界匹配）→ 放行
        ├── POST/OPTIONS /api/leads（访客留资）→ 放行
        │
        ├── /super-admin/** → 未登录跳 /login；非 SUPER_ADMIN 跳 /admin
        ├── /api/**（非公开）→ 未登录返回 401 JSON
        ├── /admin/**        → 未登录跳 /login
        └── 其余未登记路径   → 放行交给 Next 渲染（未知路由命中 404，
                                不再被误重定向到 /login）
```

**PUBLIC_PATHS**（单一事实源 `lib/proxy/auth-proxy.ts`）：

`/login`、`/register`、`/pricing`、`/anti-ban`、`/p`、`/preview`、
`/robots.txt`、`/sitemap.xml`、`/api/auth`、`/api/templates`、
`/api/track`、`/api/cron`、`/api/webhooks`

其中 `/api/track`（访客匿名回传）、`/api/cron`（靠 `CRON_SECRET` Bearer 自鉴权）、
`/api/webhooks`（靠 standardwebhooks 验签）、`/preview`（靠签名 token）均为
「中间件放行、各路由自行鉴权」的模式，不是无保护端点。

---

## 核心文件说明

### `auth.ts` — Auth.js 配置

```ts
export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PostgresAdapter(pool),  // 连接 PG，处理 OAuth 用户持久化
  session: { strategy: "jwt" },    // JWT 策略，兼容 Credentials provider
  providers: [Google, Credentials(...)],
  pages: { signIn: "/login" },     // 自定义登录页路由
});
```

**关键决策：`session.strategy: "jwt"`**

Auth.js 默认在使用数据库适配器时采用 `"database"` 会话策略（每次请求查库）。但 Credentials provider 要求使用 `"jwt"` 策略（会话信息编码进 Cookie）。两种 provider 共存时必须显式设为 `"jwt"`，适配器仅用于 OAuth 的用户/账号入库，不参与会话读取。

---

### `proxy.ts` — 路由保护

> Next.js 16 将 `middleware.ts` 重命名为 `proxy.ts`，导出函数须命名为 `proxy`。

```ts
export function proxy(request: NextRequest) {
  // 白名单放行
  // 检查 authjs.session-token Cookie
  // 无 Token → 重定向 /login
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
```

Cookie 名称规则：
- 开发环境：`authjs.session-token`
- 生产环境（HTTPS）：`__Secure-authjs.session-token`

---

### `lib/db.ts` — 数据库连接池

```ts
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
export default pool;
```

使用单例 `Pool`，在整个应用生命周期内复用连接，避免每次请求新建连接。

## 数据库设计

### ER 图

```
users
  │
  ├──< accounts      (一个用户可绑定多个 OAuth 账号)
  └──< sessions      (database 策略下的会话记录，jwt 策略下不写入)

verification_tokens  (独立，用于邮箱验证链接)
```

---

### 表结构

#### `users` — 用户主表

```sql
CREATE TABLE users (
  id             TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  name           TEXT,
  email          TEXT UNIQUE,
  email_verified TIMESTAMPTZ,
  image          TEXT,
);
```

> `password_hash` 列已随密码登录下线一并丢弃（迁移 `031_drop_password_hash.js`）。
> 该迁移的 `down` 只恢复列结构、**不恢复哈希数据**——因密码登录已无代码路径，不影响功能。

---

#### `accounts` — OAuth 账号关联表

```sql
CREATE TABLE accounts (
  id                  TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  user_id             TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type                TEXT NOT NULL,             -- "oauth"
  provider            TEXT NOT NULL,             -- "google"
  provider_account_id TEXT NOT NULL,             -- Google 用户 ID
  refresh_token       TEXT,
  access_token        TEXT,
  expires_at          BIGINT,
  token_type          TEXT,
  scope               TEXT,
  id_token            TEXT,
  session_state       TEXT,
  UNIQUE(provider, provider_account_id)
);
```

---

#### `sessions` — 数据库会话表

```sql
CREATE TABLE sessions (
  id            TEXT PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
  user_id       TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  session_token TEXT UNIQUE NOT NULL,
  expires       TIMESTAMPTZ NOT NULL
);
```

> 当前配置使用 `jwt` 策略，此表不写入数据，保留以备切换策略时使用。

---

#### `verification_tokens` — 邮件验证令牌表

```sql
CREATE TABLE verification_tokens (
  identifier TEXT NOT NULL,
  token      TEXT NOT NULL,
  expires    TIMESTAMPTZ NOT NULL,
  UNIQUE(identifier, token)
);
```

---

## 环境变量

| 变量 | 说明 | 获取方式 |
|---|---|---|
| `AUTH_SECRET` | JWT 签名密钥 | `openssl rand -base64 32` |
| `AUTH_GOOGLE_ID` | Google OAuth Client ID | Google Cloud Console |
| `AUTH_GOOGLE_SECRET` | Google OAuth Client Secret | Google Cloud Console |
| `DATABASE_URL` | PostgreSQL 连接串 | 自建或云服务 |
| `ADMIN_EMAILS` | 超管白名单（逗号分隔），命中者登录时自动提升为 `SUPER_ADMIN` | 自行指定，详见 `docs/SUPER_ADMIN_GUIDE.md` |
| `RESEND_API_KEY` | 发送邮箱验证码所需 | Resend 控制台 |
| `EMAIL_FROM` | 验证码邮件发件人地址 | 需与已验证域名一致 |
| `DEV_USER_EMAIL` | 仅开发环境：启用免密直登 provider ⛔ 禁止进生产 | 本地自行指定 |

---

## 部署前检查清单

1. 填写 `.env.local` 所有字段
2. 执行 `pnpm migrate:up` 完成建表（schema 由 `migrations/` 下的迁移文件管理）
3. 在 Google Cloud Console 添加授权重定向 URI：
   - 开发：`http://localhost:3001/api/auth/callback/google`
   - 生产：`https://yourdomain.com/api/auth/callback/google`
4. 生产环境确认 `AUTH_SECRET` 已设置（缺失时 Auth.js 会抛出错误）

---

## 安全说明

- 邮箱验证码以哈希存储，原文不落库；10 分钟过期、5 次尝试上限、60 秒重发冷却
- 邮箱域名白名单已废弃，改由 OTP 验证码证明邮箱归属
- JWT 由 `AUTH_SECRET` 签名，默认有效期 30 天
- Cookie 在生产环境自动加 `__Secure-` 前缀，要求 HTTPS
- `proxy.ts` 对所有非白名单路由（包括 `_next/data` RSC 数据路由）执行 Token 校验
