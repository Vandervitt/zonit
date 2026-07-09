#!/usr/bin/env node
/**
 * 上线前环境变量预检（零依赖，只读 process.env）。
 *
 * 用法：
 *   本地：     node --env-file=.env.local scripts/check-env.mjs
 *   生产严格：  vercel env pull .env.production.local
 *              node --env-file=.env.production.local scripts/check-env.mjs --prod
 *   旧 Node：   set -a && source .env.local && set +a && node scripts/check-env.mjs
 *
 * 退出码：缺必填项 / 格式可疑，或 --prod 下出现禁用旗标 → 1；否则 0（警告不影响退出码）。
 */

const env = process.env;
const isProd = process.argv.includes("--prod") || env.NODE_ENV === "production";
const has = (k) => typeof env[k] === "string" && env[k].trim() !== "";

// [键, 分组, 说明, 可选格式校验]
const required = [
  ["DATABASE_URL", "数据库", "应用运行时连接串（pooled）", (v) => v.startsWith("postgres")],
  ["DATABASE_URL_UNPOOLED", "数据库", "迁移直连串，vercel-build 跑 migrate:up 用", (v) => v.startsWith("postgres")],
  ["AUTH_SECRET", "认证", "会话加密密钥，须已轮换", (v) => v.length >= 32],
  ["NEXTAUTH_URL", "认证", "邀请邮件链接基址", (v) => v.startsWith("http")],
  ["AUTH_GOOGLE_ID", "认证", "Google OAuth 客户端 ID"],
  ["AUTH_GOOGLE_SECRET", "认证", "Google OAuth 密钥，须已轮换"],
  ["VERCEL_API_TOKEN", "域名发布", "缺失则用户无法发布到自有域名（lib/vercel.ts）"],
  ["VERCEL_PROJECT_ID", "域名发布", "Vercel 项目 ID"],
  ["VERCEL_TEAM_ID", "域名发布", "Vercel 团队 ID"],
  ["BLOB_READ_WRITE_TOKEN", "媒体上传", "缺失则编辑器只能贴外链图（@vercel/blob）"],
  ["NEXT_PUBLIC_APP_URL", "应用", "对外应用地址", (v) => v.startsWith("http")],
  ["CRON_SECRET", "转化追踪", "守护 /api/cron/capi-flush"],
];

const recommended = [
  ["RESEND_API_KEY", "邮件", "缺失则邀请邮件不发送（仅记录错误）"],
  ["EMAIL_FROM", "邮件", "发件人地址"],
  ["UNSPLASH_ACCESS_KEY", "媒体", "编辑器配图搜索"],
];

// 至少配一个，否则落地页 AI 生成不可用
const aiKeys = ["AI_API_KEY", "OPENAI_API_KEY", "DASHSCOPE_API_KEY", "GEMINI_API_KEY"];

// 同组要么全配、要么全不配（部分配置多半是漏配）
const groups = [
  ["计费 LemonSqueezy", [
    "LEMONSQUEEZY_API_KEY", "LEMONSQUEEZY_STORE_ID", "LEMONSQUEEZY_WEBHOOK_SECRET",
    "LEMONSQUEEZY_VARIANT_STARTER", "LEMONSQUEEZY_VARIANT_PRO", "LEMONSQUEEZY_VARIANT_AGENCY",
  ]],
];

// 测试/本地旗标，绝不可进生产
const forbiddenInProd = ["AI_FAKE", "CAPI_FAKE", "DEV_USER_EMAIL", "DEBUG"];

const errors = [];
const warnings = [];

for (const [key, group, note, check] of required) {
  if (!has(key)) errors.push(`[必填·${group}] ${key} 缺失 —— ${note}`);
  else if (check && !check(env[key])) errors.push(`[必填·${group}] ${key} 格式可疑 —— ${note}`);
}

for (const [key, group, note] of recommended) {
  if (!has(key)) warnings.push(`[建议·${group}] ${key} 未配 —— ${note}`);
}

if (!aiKeys.some(has)) {
  warnings.push(`[建议·AI] 未配任何 AI key（${aiKeys.join(" / ")}），落地页 AI 生成将不可用`);
}

for (const [name, keys] of groups) {
  const set = keys.filter(has);
  if (set.length > 0 && set.length < keys.length) {
    warnings.push(`[半配·${name}] 仅 ${set.length}/${keys.length} 项，缺：${keys.filter((k) => !has(k)).join(", ")}`);
  }
}

for (const key of forbiddenInProd) {
  if (!has(key)) continue;
  const msg = `[危险旗标] ${key} 已设置，绝不可进生产`;
  if (isProd) errors.push(msg);
  else warnings.push(`${msg}（当前非 --prod，暂记为警告）`);
}

console.log(`\n环境变量预检 · ${isProd ? "生产严格模式 (--prod)" : "普通模式"}\n`);

if (warnings.length) {
  console.log("⚠️  警告：");
  for (const w of warnings) console.log("  - " + w);
  console.log("");
}

if (errors.length) {
  console.log("❌ 阻断项：");
  for (const e of errors) console.log("  - " + e);
  console.log(`\n预检未通过：${errors.length} 个阻断项。\n`);
  process.exit(1);
}

console.log(`✅ 预检通过：${required.length} 项必填齐备${warnings.length ? `（含 ${warnings.length} 条警告）` : ""}。\n`);
