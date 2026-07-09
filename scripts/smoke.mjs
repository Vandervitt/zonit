#!/usr/bin/env node
/**
 * 部署后 HTTP 冒烟（零依赖，用全局 fetch）。
 *
 * 用法：
 *   node scripts/smoke.mjs https://your-app.vercel.app        # 平台域
 *   node scripts/smoke.mjs https://tenant-custom-domain.com   # 租户自有域
 *
 * 只做探活与关键鉴权连线（不涉及登录态）。逐项 ✅/❌，有失败 → 退出码 1。
 * 登录→建页→绑域名→发布→公网访问→像素回传 等需真实账号/域名的步骤，见
 * docs/deploy-env-checklist.md 的「人工冒烟清单」。
 */

const base = process.argv[2];
if (!base || !/^https?:\/\//.test(base)) {
  console.error("用法：node scripts/smoke.mjs <base-url>");
  process.exit(2);
}
const root = base.replace(/\/$/, "");

// [路径, 期望状态集合, 说明]
const probes = [
  ["/", [200], "营销首页可访问"],
  ["/pricing", [200], "定价页公开可访问"],
  ["/robots.txt", [200], "动态 robots（app/robots.ts）"],
  ["/sitemap.xml", [200], "动态 sitemap（app/sitemap.ts）"],
  ["/api/cron/capi-flush", [401], "Cron 鉴权生效（无 secret 应 401）"],
  ["/admin", [200, 302, 307], "后台受登录保护（登录页或重定向）"],
  ["/__definitely_not_a_route__", [404], "未知路由 404（app/not-found）"],
];

let failed = 0;
for (const [path, expected, desc] of probes) {
  try {
    const res = await fetch(root + path, { redirect: "manual" });
    const ok = expected.includes(res.status);
    console.log(`${ok ? "✅" : "❌"} ${res.status}  ${path}  —— ${desc}${ok ? "" : `（期望 ${expected.join("/")}）`}`);
    if (!ok) failed++;
  } catch (err) {
    console.log(`❌ ERR  ${path}  —— ${desc}（${err.message}）`);
    failed++;
  }
}

console.log("");
if (failed) {
  console.log(`冒烟未通过：${failed}/${probes.length} 项异常。\n`);
  process.exit(1);
}
console.log(`✅ 冒烟通过：${probes.length}/${probes.length} 项正常。\n`);
