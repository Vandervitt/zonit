# 🚀 Zonit Super Admin 操作指南

本指南介绍了如何配置、初始化以及使用 Zonit 的多租户管理后台。

## 1. 核心架构概览

*   **管理地址**: `/admin`
*   **权限模型**: RBAC (Role-Based Access Control)
*   **身份标识**: `SUPER_ADMIN`
*   **安全机制**: 
    *   `middleware.ts`: 路由级拦截。
    *   `auth.ts`: JWT 级角色注入。
    *   `AdminLayout`: 服务端组件级权限二次校验。

---

## 2. 快速初始化 (第一管理员)

为了安全且灵活地初始化第一个超级管理员，我们采用了 **“环境变量匹配 + 物理自动同步”** 的方案。

### 第一步：注册普通账号
通过前端 UI (`/register`) 使用您常用的邮箱注册一个账号。

### 第二步：配置环境变量
在您的 `.env.local` (开发环境) 或 Vercel Dashboard (生产环境) 中添加管理员白名单：

```bash
# 支持多个邮箱，用英文逗号分隔
ADMIN_EMAILS=your-name@example.com,admin@zonit.com
```

### 第三步：登录激活
使用该邮箱登录系统。
*   **系统会自动识别**：检测到邮箱匹配环境变量。
*   **物理同步**：自动将数据库中的 `role` 更新为 `SUPER_ADMIN`，并将 `plan` 升级为 `agency`。
*   **权限生效**：您的侧边栏将出现管理入口，且可直接访问 `/admin`。

---

## 3. 管理端功能说明

### 📈 全景概览 (Overview)
*   **核心指标**: 实时统计平台总用户数、站点总数、付费订阅数及转化率。
*   **动态追踪**: 展示最新创建的 5 个站点及其所有者，方便实时监控平台活动。

### 👥 用户管理 (User Management)
*   **跨租户视图**: 查看全平台所有注册用户。
*   **订阅监控**: 查看每个用户的套餐等级（Free/Starter/Pro/Agency）以及 Lemon Squeezy 客户 ID。
*   **站点统计**: 统计每个用户名下的站点数量，识别大客户。

---

## 4. 开发者进阶指南

### 如何新增管理页面？
1.  在 `app/(admin)/` 目录下创建新文件夹（如 `app/(admin)/settings/page.tsx`）。
2.  该页面会自动继承 `AdminLayout` 的权限保护。
3.  在 `app/(admin)/layout.tsx` 的 `navItems` 数组中添加对应的菜单项。

### 数据库角色说明
用户角色存储在 `users` 表的 `role` 字段中：
*   `USER`: 普通租户。
*   `ADMIN`: 平台运营人员（可选）。
*   `SUPER_ADMIN`: 拥有全权限的上帝模式。

---

## 5. 安全合规建议

1.  **最小化白名单**: 生产环境下 `ADMIN_EMAILS` 仅保留核心运维人员邮箱。
2.  **定期审计**: 通过 `/admin/users` 定期检查是否有异常的 `SUPER_ADMIN` 账号。
3.  **强密码策略**: 建议管理员账号开启 Google OAuth 登录，利用 Google 的二次验证保障后台安全。

---

**Zonit Architecture Team**
*Last Updated: 2026-04-27*
