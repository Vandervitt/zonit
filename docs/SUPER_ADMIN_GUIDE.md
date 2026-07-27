# Zap Bridge Super Admin 操作指南

本指南介绍如何配置、初始化以及使用 Zap Bridge 的平台超级管理后台。

> **两套后台不要混淆**
> - `/admin` —— **租户工作台**，每个注册用户登录后都能进，用于管理自己的落地页、线索、域名、媒体与计费。
> - `/super-admin` —— **平台超管后台**，仅 `SUPER_ADMIN` 角色可进，用于跨租户运营。
>
> 本文档只描述后者。

## 1. 核心架构概览

- **管理地址**: `/super-admin`
- **权限模型**: RBAC (Role-Based Access Control)
- **身份标识**: `SUPER_ADMIN`
- **安全机制**（三层）:
  - `proxy.ts` → `lib/proxy/auth-proxy.ts`：路由级拦截。未登录访问 `/super-admin` 重定向到 `/login`；已登录但非 `SUPER_ADMIN` 重定向到 `/admin`。
  - `auth.ts`：JWT 级角色注入，登录时把 `role` 写入 token。
  - `app/super-admin/layout.tsx`：服务端组件级权限二次校验，角色不符直接 `redirect("/")`。

> 本项目的中间件文件是 `proxy.ts`，不是 `middleware.ts`。

---

## 2. 快速初始化 (第一管理员)

为了安全且灵活地初始化第一个超级管理员，采用 **「环境变量匹配 + 物理自动同步」** 的方案。

### 第一步：注册普通账号

通过 `/login` 或 `/register` 注册账号。当前支持两种方式：

- **Google OAuth**
- **邮箱验证码（OTP）** —— 支持任意邮箱后缀，归属真实性由验证码保证

平台已不提供密码注册流程。

### 第二步：配置环境变量

在 `.env.local`（开发环境）或 Vercel Dashboard（生产环境）中添加管理员白名单：

```bash
# 支持多个邮箱，用英文逗号分隔
ADMIN_EMAILS=your-name@example.com,admin@zapbridge.tech
```

### 第三步：登录激活

使用该邮箱登录系统。

- **系统自动识别**：登录时检测邮箱是否命中 `ADMIN_EMAILS`。
- **物理同步**：若命中且数据库中 `role` 尚未提升，自动将 `role` 更新为 `SUPER_ADMIN`，同时把 `plan` 升为 `agency`（见 `auth.ts` 的 jwt 回调）。
- **权限生效**：可直接访问 `/super-admin`。

> 白名单账号同时豁免试用期过期降档逻辑。

---

## 3. 管理端功能说明

超管后台共四个模块（导航见 `app/super-admin/_shell/SuperAdminShell.tsx`）：

### 概览 (`/super-admin`)

- **核心指标**：总用户数、落地页总数、付费订阅、转化率、线索总量。
- **激活漏斗**：按首次达成人数统计各阶段转化。
- **近 30 天趋势**：用户与线索增长曲线。
- **最新动态**：最新创建的落地页及其所有者。
- **套餐分布**：按生效口径（含赠送档）统计各档位人数。

### 用户 (`/super-admin/users`)

- **跨租户视图**：查看全平台所有注册用户，支持搜索与按角色/状态筛选。
- **列表字段**：邮箱、角色、生效套餐、状态、注册时间、落地页数。
- **运营操作**：
  - 赠送套餐（可选 7/15/30/90 天或自定义到期日；生效套餐会区分「付费档」与「赠送档」）
  - 设为超管 / 取消超管
  - 禁用 / 恢复账号（禁用后拒绝登录，其公开落地页返回 404）

### 用户反馈 (`/super-admin/feedback`)

查看用户提交的反馈，含时间、来源、内容、提交用户与已读/未读状态。

### 平台设置 (`/super-admin/settings`)

查看超管白名单（只读，由 `ADMIN_EMAILS` 环境变量控制）与各套餐权益对照表。

---

## 4. 开发者进阶指南

### 如何新增超管页面？

1. 在 `app/super-admin/` 下创建新文件夹（如 `app/super-admin/audit/page.tsx`）。
2. 该页面自动继承 `app/super-admin/layout.tsx` 的权限保护。
3. 在 `app/super-admin/_shell/SuperAdminShell.tsx` 的导航数组中添加对应菜单项。

> 超管后台统一使用 Ant Design，不使用 shadcn/ui。

### 如何新增租户后台页面？

1. 在 `app/admin/(workspace)/` 下创建页面。
2. 在 `app/admin/(workspace)/_shell/nav.ts` 中添加菜单项。
3. 路径常量统一在 `lib/constants/routes.ts` 的 `Routes` 中维护。

### 数据库角色说明

用户角色存储在 `users` 表的 `role` 字段中：

- `USER`：普通租户。
- `ADMIN`：预留的平台运营角色，**当前代码中尚无任何判定点使用**。
- `SUPER_ADMIN`：拥有全权限。

### 计费字段说明

用户计费信息存储在 `users` 表的通用字段中，与具体支付服务商解耦：

- `billing_provider`：支付服务商标识
- `billing_customer_id`：客户 ID
- `billing_subscription_id`：订阅 ID

> 早期的 `ls_customer_id` / `ls_subscription_id`（LemonSqueezy 专用）已废弃并被上述通用字段取代。当前接入的服务商实现见 `lib/billing/providers/`。超管用户列表不展示客户 ID。

---

## 5. 安全合规建议

1. **最小化白名单**：生产环境下 `ADMIN_EMAILS` 仅保留核心运维人员邮箱。
2. **定期审计**：通过 `/super-admin/users` 按角色筛选，定期检查是否有异常的 `SUPER_ADMIN` 账号。
3. **登录方式**：管理员账号建议使用 Google OAuth 登录，借助其二次验证保障后台安全；邮箱验证码方式请确保邮箱本身已开启 2FA。
4. **白名单即权限**：从 `ADMIN_EMAILS` 中移除邮箱**不会**自动降级已提升的账号，需在 `/super-admin/users` 中手动「取消超管」。

---

*Last Updated: 2026-07-27*
