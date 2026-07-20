// 域名 NS 解析（服务端 Node runtime）。仅用于大陆 DNS 服务商软提示，
// 解析失败/超时一律 fail-open 返回 []，绝不阻断添加域名主流程。
import { resolveNs } from "node:dns/promises";

const TIMEOUT_MS = 2500;

/** 查询域名的 NS；子域无 NS 记录时回退到上一级（最多退到二级域）。 */
export async function lookupNameservers(domain: string): Promise<string[]> {
  const labels = domain.split(".");
  // 依次尝试：原域名 → 逐级去前缀，最少保留两段（注册域近似）。
  for (let i = 0; i <= labels.length - 2; i++) {
    const candidate = labels.slice(i).join(".");
    try {
      const ns = await Promise.race([
        resolveNs(candidate),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error("timeout")), TIMEOUT_MS),
        ),
      ]);
      if (ns.length > 0) return ns;
    } catch {
      // NXDOMAIN/NODATA/超时：继续退一级
    }
  }
  return [];
}
