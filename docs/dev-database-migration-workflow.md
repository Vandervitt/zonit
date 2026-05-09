# 开发环境数据库迁移处理流程

本文档给本地开发和后续 agent 使用，用于处理连接 Neon/Nexo dev 数据库时出现的缺表、缺字段、迁移未同步等问题。

## 基本原则

- 不要在 dev 数据库控制台手写零散 `CREATE TABLE` 或 `ALTER TABLE` 来修补缺表、缺字段。
- 所有 schema 变化都应进入 `migrations/`，再通过 `pnpm migrate:up` 执行。
- 代码热更新和数据库迁移是两件事。Next dev 热更新只重新编译代码，不会更新 Postgres schema。
- 本地开发可以自动监听 `migrations/` 变更并执行迁移，但不要监听 `app/`、`lib/`、`components/` 等业务代码目录来触发数据库操作。

## 连接串约定

应用运行使用 pooled connection：

```env
DATABASE_URL=postgresql://...@...-pooler.../neondb?sslmode=require
```

迁移使用 direct / unpooled connection：

```env
DATABASE_URL_UNPOOLED=postgresql://...@.../neondb?sslmode=require
```

Neon 控制台中通常不叫 `DATABASE_URL_UNPOOLED`。获取方式：

1. 打开 Neon Project Dashboard。
2. 点击 **Connect**。
3. 选择正确的 Branch、Database、Role。
4. 关闭 **Connection pooling**。
5. 复制生成的 direct connection string，填入 `.env.local` 的 `DATABASE_URL_UNPOOLED`。

判断方式：

- host 中包含 `-pooler`：pooled，适合 `DATABASE_URL`。
- host 中不包含 `-pooler`：direct / unpooled，适合 `DATABASE_URL_UNPOOLED`。

## 常用命令

首次启动、切分支、拉取新代码或发现缺表/缺字段后：

```bash
pnpm migrate:up
```

开发时新增迁移：

```bash
pnpm migrate:create add_xxx
# 编辑 migrations/<new_file>.js
pnpm migrate:up
```

验证迁移状态：

```bash
pnpm exec tsx -e "import {config} from 'dotenv'; config({path:'.env.local', override:true, quiet:true}); import {Pool} from 'pg'; void (async()=>{ const pool=new Pool({connectionString:process.env.DATABASE_URL,ssl:{rejectUnauthorized:false}}); const r=await pool.query('select name from pgmigrations order by name'); console.log(r.rows); await pool.end(); })();"
```

## 缺表/缺字段排查

常见 Postgres 错误码：

- `42P01`：relation does not exist，通常是缺表。
- `42703`：column does not exist，通常是缺字段。

处理顺序：

1. 查询 `pgmigrations`，确认 dev 库执行到了哪个迁移。
2. 对照 `migrations/` 目录，确认是否存在未执行迁移。
3. 确认 `.env.local` 中有 `DATABASE_URL_UNPOOLED`。
4. 执行 `pnpm migrate:up`。
5. 重新请求报错的 API 或页面。

不要先改业务代码规避缺表/缺字段。先确认 schema 是否已同步。

## 热更新时如何处理

Next dev 热更新不会触发数据库迁移。开发时推荐：

```bash
pnpm migrate:up
pnpm dev
```

如果只有一个人开发，可以增加一个只监听迁移目录的 watcher：

```json
{
  "scripts": {
    "dev:migrate": "chokidar \"migrations/**/*.{js,ts,sql}\" -c \"pnpm migrate:up\"",
    "dev:all": "concurrently \"pnpm dev\" \"pnpm dev:migrate\""
  }
}
```

这个 watcher 只应该监听 `migrations/`。迁移是有状态操作，不要让普通代码保存触发数据库 DDL。

## 当前项目注意事项

- 项目迁移脚本使用 `DATABASE_URL_UNPOOLED`，不是 `DATABASE_URL`。
- `pnpm migrate:up` 应显式加载 `.env.local`。
- 如果 `/api/templates` 返回 `relation "preset_templates" does not exist`，说明至少 `007_add_preset_templates` 没有执行。
- 如果 `preset_templates` 表存在但数据量为 `0`，说明 schema 已同步，但新建站点仍没有可选模板，需要通过管理后台或受控 seed 导入模板数据。

