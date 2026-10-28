// 构建期价格同步：从 Dodo 拉取套餐与充值包产品定价，写入 lib/pricing/prices.json。
// 由 vercel-build 在 next build 之前执行一次；页面全部从该快照读价，运行时不再请求 Dodo。
//
// 失败策略：
// - 生产构建（VERCEL_ENV=production）取价失败即中止构建——宁可部署不上，也不让官网
//   展示一个与结账页扣款不一致的旧价；
// - 其余环境（本地 / Preview / CI 无凭据）沿用仓库内快照并告警，不阻塞开发。
//
// 手动刷新快照：配好 DODO_* 后执行 `pnpm prices:sync`，确认 diff 后提交。
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { dodoClient } from "@/lib/billing/providers/dodo";
import { fetchPriceSnapshot, type PriceProductIds } from "@/lib/pricing/dodo-prices";

const SNAPSHOT_PATH = path.join(process.cwd(), "lib/pricing/prices.json");
const strict = process.env.VERCEL_ENV === "production";

function productIdsFromEnv(): PriceProductIds | null {
  const env = process.env;
  const ids = {
    plans: {
      pro: { month: env.DODO_PRODUCT_PRO, year: env.DODO_PRODUCT_PRO_YEARLY },
      agency: { month: env.DODO_PRODUCT_AGENCY, year: env.DODO_PRODUCT_AGENCY_YEARLY },
    },
    credits: { "50": env.DODO_CREDITS_50, "200": env.DODO_CREDITS_200 },
  };
  const all = [...Object.values(ids.plans).flatMap((p) => Object.values(p)), ...Object.values(ids.credits)];
  return all.every(Boolean) ? (ids as PriceProductIds) : null;
}

function fail(reason: string): void {
  if (strict) {
    console.error(`[prices:sync] ${reason}；生产构建中止，以免官网展示价与 Dodo 扣款价不一致。`);
    process.exit(1);
  }
  console.warn(`[prices:sync] ${reason}；沿用仓库内快照 lib/pricing/prices.json。`);
}

async function main(): Promise<void> {
  const ids = productIdsFromEnv();
  if (!process.env.DODO_PAYMENTS_API_KEY || !ids) {
    return fail("缺少 DODO_PAYMENTS_API_KEY 或 DODO_PRODUCT_* / DODO_CREDITS_* 环境变量");
  }

  let snapshot;
  try {
    const client = dodoClient();
    snapshot = await fetchPriceSnapshot((id) => client.products.retrieve(id), ids);
  } catch (err) {
    return fail(`从 Dodo 取价失败：${err instanceof Error ? err.message : String(err)}`);
  }

  const next = `${JSON.stringify(snapshot, null, 2)}\n`;
  const prev = readFileSync(SNAPSHOT_PATH, "utf8");
  const mode = process.env.DODO_PAYMENTS_ENVIRONMENT === "live_mode" ? "live_mode" : "test_mode";
  if (next === prev) {
    console.log(`[prices:sync] Dodo(${mode}) 定价与快照一致，无需更新。`);
    return;
  }
  writeFileSync(SNAPSHOT_PATH, next);
  console.log(`[prices:sync] 已按 Dodo(${mode}) 定价更新快照：${JSON.stringify(snapshot)}`);
}

main();
