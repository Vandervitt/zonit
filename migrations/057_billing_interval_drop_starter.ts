// 年付 + 去掉 Starter 档（docs/feat_20261028_年付与去除Starter档/design.md）。
//
// 1. users.billing_interval：当前订阅的计费周期（month / year），webhook 激活时写入、订阅结束时清空。
//    不回填：存量付费订阅为 0（2026-10-28 生产查询），空值即「无订阅」。
// 2. plan / comp_plan 的 CHECK 去掉 'starter'。
//
// ⚠️ 不做 starter → pro 的静默映射：真有 starter 行说明还存在旧 Starter 订阅或赠送，
// 那需要人决定（迁到哪档、是否退差价），而不是迁移替人决定。断言写在 SQL 里而非 JS——
// pgm.sql() 是排队执行的，JS 侧的判断会在数据实际被改之前就跑完。
import type { MigrationBuilder } from "node-pg-migrate";

export async function up(pgm: MigrationBuilder): Promise<void> {
  pgm.sql(`
    DO $$
    DECLARE n integer;
    BEGIN
      SELECT COUNT(*) INTO n FROM users WHERE plan = 'starter' OR comp_plan = 'starter';
      IF n > 0 THEN
        RAISE EXCEPTION '057: % users still on starter (plan or comp_plan); migrate them manually before removing the tier', n;
      END IF;
      SELECT COUNT(*) INTO n FROM invitations WHERE plan = 'starter';
      IF n > 0 THEN
        RAISE EXCEPTION '057: % invitations still grant starter; update them before removing the tier', n;
      END IF;
    END $$;

    ALTER TABLE users DROP CONSTRAINT IF EXISTS users_plan_check;
    ALTER TABLE users ADD CONSTRAINT users_plan_check CHECK (plan IN ('free', 'pro', 'agency'));
    ALTER TABLE users DROP CONSTRAINT IF EXISTS users_comp_plan_check;
    ALTER TABLE users ADD CONSTRAINT users_comp_plan_check CHECK (comp_plan IN ('pro', 'agency'));

    ALTER TABLE users ADD COLUMN IF NOT EXISTS billing_interval TEXT NULL;
    ALTER TABLE users DROP CONSTRAINT IF EXISTS users_billing_interval_check;
    ALTER TABLE users ADD CONSTRAINT users_billing_interval_check CHECK (billing_interval IN ('month', 'year'));
  `);
}

export async function down(pgm: MigrationBuilder): Promise<void> {
  pgm.sql(`
    ALTER TABLE users DROP CONSTRAINT IF EXISTS users_billing_interval_check;
    ALTER TABLE users DROP COLUMN IF EXISTS billing_interval;
    ALTER TABLE users DROP CONSTRAINT IF EXISTS users_comp_plan_check;
    ALTER TABLE users ADD CONSTRAINT users_comp_plan_check CHECK (comp_plan IN ('starter', 'pro', 'agency'));
    ALTER TABLE users DROP CONSTRAINT IF EXISTS users_plan_check;
    ALTER TABLE users ADD CONSTRAINT users_plan_check CHECK (plan IN ('free', 'starter', 'pro', 'agency'));
  `);
}
