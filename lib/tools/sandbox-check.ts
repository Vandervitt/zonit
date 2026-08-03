// lib/tools/sandbox-check.ts
//
// B 档实测：在 Vercel Sandbox 里起真实浏览器，测「像素是否在取得同意前触发」。
// 只对登录用户开放——匿名侧走静态判定，理由见设计文档 11.7（Hobby 超额后
// 沙箱创建被暂停到下个计费周期，匿名流量碰它等于越成功死得越快）。
//
// 判定方式刻意不比较时间戳：**打开页面之后、与同意组件交互之前**dump 一次
// 请求列表，其中若出现已知追踪域名，即为「同意前已触发」。这是集合包含判断，
// 比时序比较更简单也更少误报（实测验证见设计文档 11.6）。
//
// 成本参数（实测依据见 11.1–11.4）：
//   · 必须从快照启动——冷启动 29.5s vs 快照 0.6s，差一个数量级
//   · 1 vCPU：页面加载不吃 CPU，且 Hobby 的 vCPU 分配限速是 40/10min，
//     用 1 vCPU 能把吞吐从每分钟 2 次提到 4 次
//   · stop() 不 await：它要 6.5s，而结果在那之前就拿到了

import { Sandbox } from "@vercel/sandbox";

/** 已知追踪请求的域名特征。命中即视为该平台的像素已发出请求。 */
const TRACKER_HOSTS: { id: string; re: RegExp }[] = [
  { id: "meta", re: /facebook\.(com|net)/i },
  { id: "google", re: /google-analytics\.com|googletagmanager\.com|doubleclick\.net|google\.com\/ads/i },
  { id: "tiktok", re: /tiktok\.com|byteoversea\.com/i },
  { id: "linkedin", re: /licdn\.com|linkedin\.com/i },
  { id: "twitter", re: /ads-twitter\.com|t\.co/i },
];

export interface SandboxCheckResult {
  ok: boolean;
  /** 在与同意组件交互之前就发出请求的追踪平台。 */
  firedBeforeConsent: string[];
  /** 本次实测观察到的出站请求总数，用于说明「确实测过了」。 */
  requestCount: number;
  error?: string;
}

function credentials() {
  const { VERCEL_TOKEN, VERCEL_TEAM_ID, VERCEL_PROJECT_ID } = process.env;
  // 部署在 Vercel 上时走 OIDC 自动鉴权，无需显式凭据。
  if (VERCEL_TOKEN && VERCEL_TEAM_ID && VERCEL_PROJECT_ID) {
    return { token: VERCEL_TOKEN, teamId: VERCEL_TEAM_ID, projectId: VERCEL_PROJECT_ID };
  }
  return {};
}

/**
 * 实测一次。调用方必须已经通过预算守卫与鉴权。
 *
 * 传入的 url 必须是**已经过 SSRF 闸门校验的最终地址**——沙箱虽是隔离环境，
 * 但没有理由让它去访问一个我们自己都不敢连的地址。
 */
export async function runSandboxCheck(url: string): Promise<SandboxCheckResult> {
  const snapshotId = process.env.AGENT_BROWSER_SNAPSHOT_ID;
  if (!snapshotId) {
    // 没有快照就意味着每次要付 29.5s 的冷启动，且 Hobby 吞吐撑不住。
    // 宁可退回静态判定，也不在缺快照时硬跑。
    return { ok: false, firedBeforeConsent: [], requestCount: 0, error: "snapshot_missing" };
  }

  let sandbox: Awaited<ReturnType<typeof Sandbox.create>> | null = null;
  try {
    sandbox = await Sandbox.create({
      ...credentials(),
      source: { type: "snapshot", snapshotId },
      resources: { vcpus: 1 },
      timeout: 120_000,
    });

    await sandbox.runCommand("agent-browser", ["open", url]);
    // 关键：此刻尚未与任何同意组件交互，这份列表就是「同意前」的全部请求。
    const res = await sandbox.runCommand("agent-browser", ["network", "requests"]);
    const out = await res.stdout();
    await sandbox.runCommand("agent-browser", ["close"]);

    const lines = out.split("\n").filter((l) => /https?:\/\//.test(l));
    const fired = new Set<string>();
    for (const line of lines) {
      for (const t of TRACKER_HOSTS) {
        if (t.re.test(line)) fired.add(t.id);
      }
    }
    return { ok: true, firedBeforeConsent: [...fired], requestCount: lines.length };
  } catch (e) {
    return {
      ok: false,
      firedBeforeConsent: [],
      requestCount: 0,
      error: (e as Error).message.slice(0, 200),
    };
  } finally {
    // 不 await：stop 要 6.5s，而结果早已拿到；让它在后台收尾。
    sandbox?.stop().catch(() => {});
  }
}
