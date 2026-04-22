# Auth 模块设计文档

## 概览

本项目认证模块基于 **Auth.js v5 (NextAuth)** 构建，支持 Google OAuth 与邮箱/密码两种登录方式，会话数据持久化至 PostgreSQL，路由保护通过 Next.js 16 的 `proxy.ts` 实现。

---

## 技术栈

| 依赖 | 版本 | 用途 |
|---|---|---|
| `next-auth` | v5 (beta) | 认证框架 |
| `@auth/pg-adapter` | latest | Auth.js PostgreSQL 适配器 |
| `pg` | latest | PostgreSQL 客户端 |
| `bcryptjs` | latest | 密码哈希 |

---

## 目录结构

```
zonit/
├── auth.ts                              # Auth.js 核心配置
├── proxy.ts                             # 路由保护（Next.js 16 Proxy）
├── .env.local                           # 环境变量
├── lib/
│   ├── db.ts                            # PostgreSQL 连接池
│   └── schema.sql                       # 数据库建表脚本
└── app/
    ├── api/
    │   ├── auth/[...nextauth]/route.ts  # Auth.js 请求处理器
    │   └── register/route.ts           # 邮箱注册接口
    └── (auth)/
        ├── layout.tsx                   # 认证页面布局
        ├── login/page.tsx              # 登录页
        └── register/page.tsx           # 注册页
```

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

### 邮箱/密码流程

**注册：**

```
用户填写 name / email / password
        │
        ▼
POST /api/register
        │
        ├── 检查 email 是否已存在
        ├── bcrypt.hash(password, 12)
        └── INSERT INTO users (name, email, password_hash)
        │
        ▼
自动调用 signIn("credentials") 完成登录
        │
        ▼
签发 JWT → 重定向至 /
```

**登录：**

```
用户填写 email / password
        │
        ▼
signIn("credentials", { email, password })
        │
        ▼
Auth.js Credentials.authorize()
        │
        ├── SELECT * FROM users WHERE email = $1
        └── bcrypt.compare(password, password_hash)
        │
        ▼（校验通过）
签发 JWT → 重定向至 /
```

### 路由保护流程

```
所有 HTTP 请求
        │
        ▼
proxy.ts（Next.js Proxy，原 middleware）
        │
        ├── 路径在白名单内？(/login /register /api/auth /api/register)
        │       └── 是 → 放行
        │
        └── 读取 Cookie: authjs.session-token
                ├── 存在 → 放行
                └── 不存在 → 301 重定向至 /login
```

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

---

### `app/api/register/route.ts` — 注册接口

| 字段 | 类型 | 说明 |
|---|---|---|
| `name` | string | 用户姓名 |
| `email` | string | 邮箱，唯一 |
| `password` | string | 明文密码，后端 bcrypt 加密 |

响应状态：
- `201` — 注册成功
- `400` — 字段缺失
- `409` — 邮箱已存在

---

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
  password_hash  TEXT            -- 仅邮箱注册用户有值，OAuth 用户为 NULL
);
```

> `password_hash` 是对 Auth.js 标准 schema 的扩展字段，存储 bcrypt 哈希（cost factor 12）。

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

---

## 部署前检查清单

1. 填写 `.env.local` 所有字段
2. 执行 `lib/schema.sql` 完成建表
3. 在 Google Cloud Console 添加授权重定向 URI：
   - 开发：`http://localhost:3000/api/auth/callback/google`
   - 生产：`https://yourdomain.com/api/auth/callback/google`
4. 生产环境确认 `AUTH_SECRET` 已设置（缺失时 Auth.js 会抛出错误）

---

## 安全说明

- 密码使用 bcrypt（cost factor 12）哈希存储，原文不落库
- JWT 由 `AUTH_SECRET` 签名，默认有效期 30 天
- Cookie 在生产环境自动加 `__Secure-` 前缀，要求 HTTPS
- `proxy.ts` 对所有非白名单路由（包括 `_next/data` RSC 数据路由）执行 Token 校验
