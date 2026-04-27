# Super Admin 邀请与试用系统设计文档

本文档详细介绍了针对 Zonit 项目设计的 Super Admin 邀请系统。该系统允许管理员通过自定义域名邮箱向用户发送包含特定权益（如 15 天 Pro 会员）的邀请链接。

## 1. 功能概述

*   **定向邀请**：Super Admin 可以通过后台向特定邮箱发送邀请。
*   **权益附带**：邀请链接可自定义会员等级（Plan）和试用时长（Duration）。
*   **自定义域名发件**：支持通过 Resend 集成自定义域名发送邮件。
*   **安全验证**：邀请链接基于 32 位随机 Token，具有时效性且单次有效。
*   **自动放行**：受邀用户可绕过系统的 `TRUSTED_DOMAINS` 邮箱后缀限制。
*   **自动降级**：试用期结束后，系统在用户登录时自动将其降级为 `free` 计划。

## 2. 架构设计

### 2.1 数据库方案
新增 `invitations` 表并扩展 `users` 表。

**invitations 表**:
- `token`: 唯一验证标识。
- `email`: 预设的受邀人邮箱。
- `plan`: 赋予的计划（如 `pro`）。
- `duration_days`: 权益天数（如 `15`）。
- `accepted_at`: 用户注册时间。
- `expires_at`: 链接过期时间（默认 24h）。

**users 表扩展**:
- `trial_expires_at`: 试用权益到期时间戳。
- `invited_at`: 记录是否通过邀请加入。

### 2.2 邮件系统
采用 **Resend** 作为邮件服务商。
- **配置**: 通过环境变量 `RESEND_API_KEY` 和 `EMAIL_FROM` 控制。
- **模板**: 预设 HTML 邮件模板，包含品牌信息及权益说明。

### 2.3 验证逻辑
1.  **注册阶段**: 拦截注册请求，若携带 `token` 则验证其合法性，通过后写入试用过期时间。
2.  **登录阶段**: 在 `auth.ts` 的 `jwt` 回调中检查 `trial_expires_at`。若当前时间已超过该时间戳，自动执行 SQL 更新将 `plan` 重置为 `free`。

## 3. 成本分析 (经济成本)

该系统设计优先考虑低成本运行：

| 项目 | 推荐方案 | 费用 (中小规模) |
| :--- | :--- | :--- |
| **邮件服务** | Resend (Free Tier) | $0 (3,000 封/月) |
| **基础设施** | Vercel + Neon/Supabase | $0 (免费额度内) |
| **域名** | 现有域名 | $0 |
| **总计** | | **$0 / 月** |

## 4. 实施指南

### 4.1 环境配置
在 `.env.local` 中添加以下配置：
```env
# Resend API Key (从 resend.com 获取)
RESEND_API_KEY=re_your_api_key
# 发件人地址 (需在 Resend 验证域名)
EMAIL_FROM=Zonit <invite@yourdomain.com>
```

### 4.2 核心代码文件
- `lib/email.ts`: 邮件发送逻辑封装。
- `migrations/006_add_invitations.js`: 数据库表结构迁移。
- `app/api/admin/invite/route.ts`: 管理员发送邀请接口。
- `app/api/register/route.ts`: 处理 Token 的注册逻辑。
- `auth.ts`: 试用期检查与权限放行逻辑。

## 5. 安全建议
1.  **Token 消耗**: 确保 Token 在注册成功后立即标记为 `accepted`。
2.  **频率限制**: 建议对管理员邀请接口增加 Rate Limiting，防止系统被恶意利用发送垃圾邮件。
3.  **权益监控**: 定期清理 `invitations` 表中超过 7 天未激活的过期数据。
