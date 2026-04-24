# 数据库迁移

本项目使用 [node-pg-migrate](https://github.com/salsita/node-pg-migrate) 管理 PostgreSQL schema 变更。

## 安装

```bash
pnpm add -D node-pg-migrate
```

## 配置

`package.json` scripts：

```json
"migrate":        "node-pg-migrate -m migrations",
"migrate:up":     "node-pg-migrate up -m migrations",
"migrate:down":   "node-pg-migrate down -m migrations",
"migrate:create": "node-pg-migrate create -m migrations"
```

数据库连接读取 `.env.local` 中的 `DATABASE_URL`，无需额外配置。

## 迁移文件

迁移文件位于 `migrations/` 目录，按序号前缀排序执行。

| 文件 | 说明 |
|------|------|
| `001_initial_schema.js` | 基础表：users / accounts / sessions / verification_tokens / sites |
| `002_add_plan.js` | users 增加 plan 字段；sites 增加 custom_domain 字段 |
| `003_add_ls_columns.js` | users 增加 ls_customer_id / ls_subscription_id（Lemon Squeezy 计费） |
| `004_add_domains_table.js` | 新建 domains 表及索引 |

## 常用命令

```bash
# 执行所有待执行的迁移
pnpm migrate:up

# 回滚最近一次迁移
pnpm migrate:down

# 新建迁移文件
pnpm migrate:create <name>
# 示例：pnpm migrate:create add_site_theme
```

## 新迁移文件模板

```js
/** @type {import('node-pg-migrate').MigrationBuilder} */
exports.up = (pgm) => {
  pgm.sql(`
    -- 变更语句
  `);
};

exports.down = (pgm) => {
  pgm.sql(`
    -- 回滚语句
  `);
};
```

## 首次接入已有数据库

如果数据库已存在 schema，使用 `--fake` 将所有迁移标记为已执行，跳过实际 SQL 运行：

```bash
pnpm exec node-pg-migrate up -m migrations --fake
```

之后 `pnpm migrate:up` 只会执行新增的迁移。
