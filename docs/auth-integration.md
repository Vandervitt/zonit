# 身份认证集成文档 (Google, Microsoft, Apple)

为了确保平台用户的真实性并防止滥用，本项目采用了“三大巨头”身份认证方案，仅允许来自高信用额度邮箱服务商的用户注册和登录。

## 1. 核心策略
系统仅支持以下三个服务商的邮箱域名：
- **Google**: `gmail.com`, `googlemail.com`
- **Microsoft**: `outlook.com`, `hotmail.com`, `live.com`, `msn.com`
- **Apple**: `icloud.com`, `me.com`, `mac.com`

## 2. 技术实现方案

### 后端拦截 (auth.ts)
在 `NextAuth` 配置中实现了双重拦截：
1. **OAuth 拦截**：在 `signIn` 回调中检测用户邮箱后缀。
2. **Credentials 拦截**：在 `authorize` 函数中检测输入的邮箱后缀。

### 认证提供商
- **Google**: 使用 `next-auth/providers/google`。
- **Microsoft**: 使用 `next-auth/providers/microsoft-entra-id` (Azure AD)。
- **Apple**: 使用 `next-auth/providers/apple`。

### 前端 UI
- 登录页面提供了三个显著的第三方登录按钮。
- 邮箱登录框下方附带受支持域名的提示说明。

## 3. 环境配置指南

请在 `.env.local` 中配置以下变量。

### Google 配置
1. 前往 [Google Cloud Console](https://console.cloud.google.com/)。
2. 创建 OAuth 2.0 凭据。
3. 设置重定向 URI 为 `http://localhost:3000/api/auth/callback/google`。

### Microsoft 配置
1. 前往 [Azure Portal](https://portal.azure.com/) -> Entra ID。
2. 注册新应用，选择“任何组织目录中的帐户和个人 Microsoft 帐户”。
3. 设置重定向 URI 为 `http://localhost:3000/api/auth/callback/microsoft-entra-id`。

### Apple 配置
1. 前往 [Apple Developer](https://developer.apple.com/)。
2. 创建 Identifier (Services ID) 和 Key。
3. Apple 集成较为复杂，需配置 `TEAM_ID` 和私钥文件。

## 4. 维护与扩展
若需增加新的受信任域名，请修改 `auth.ts` 中的 `TRUSTED_DOMAINS` 常量。
