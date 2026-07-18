// lib/vercel.ts
const BASE = "https://api.vercel.com";

function teamQuery() {
  const teamId = process.env.VERCEL_TEAM_ID;
  return teamId ? `?teamId=${teamId}` : "";
}

function headers() {
  return {
    Authorization: `Bearer ${process.env.VERCEL_API_TOKEN}`,
    "Content-Type": "application/json",
  };
}

const projectId = () => process.env.VERCEL_PROJECT_ID!;

// Vercel 标准接入记录（对 Cloudflare / Route53 / Namecheap 等任意注册商通用）：
// 裸域用 A 记录指向 Vercel anycast IP，子域用 CNAME 指向 cname.vercel-dns.com。
// 来源：Vercel CLI domains inspect / verify-diagnosis。
const APEX_A_IP = "76.76.21.21";
const SUBDOMAIN_CNAME = "cname.vercel-dns.com";

export interface DnsRecord {
  type: "A" | "CNAME" | "TXT";
  name: string;
  value: string;
}

export interface DomainConfig {
  verified: boolean;
  name: string;
  apexName: string;
  records: DnsRecord[];
}

interface VercelVerification {
  type: string;
  domain: string;
  value: string;
}

/** DNS 记录名：裸域为 @，子域为去掉 apex 后缀的前缀（如 www）。 */
export function dnsRecordName(name: string, apexName: string): string {
  const n = name.toLowerCase();
  const apex = apexName.toLowerCase();
  if (n === apex) return "@";
  const suffix = `.${apex}`;
  return n.endsWith(suffix) ? name.slice(0, -suffix.length) : name;
}

/** 由 Vercel 返回的 name/apexName 计算客户需在自有 DNS 商配置的记录。 */
export function dnsRecordsFor(
  name: string,
  apexName: string,
  verification?: VercelVerification[] | null,
): DnsRecord[] {
  const records: DnsRecord[] =
    name.toLowerCase() === apexName.toLowerCase()
      ? [{ type: "A", name: "@", value: APEX_A_IP }]
      : [{ type: "CNAME", name: dnsRecordName(name, apexName), value: SUBDOMAIN_CNAME }];

  for (const v of verification ?? []) {
    if (v.type?.toUpperCase() === "TXT") {
      records.push({ type: "TXT", name: dnsRecordName(v.domain, apexName), value: v.value });
    }
  }
  return records;
}

export async function addDomainToProject(domain: string): Promise<DomainConfig> {
  const res = await fetch(
    `${BASE}/v10/projects/${projectId()}/domains${teamQuery()}`,
    {
      method: "POST",
      headers: headers(),
      body: JSON.stringify({ name: domain }),
    }
  );
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message ?? "Vercel API error");
  }
  const data = await res.json();
  const name: string = data.name ?? domain;
  const apexName: string = data.apexName ?? domain;
  return {
    verified: data.verified ?? false,
    name,
    apexName,
    records: dnsRecordsFor(name, apexName, data.verification),
  };
}

export async function getDomainVerification(domain: string): Promise<"pending" | "verified" | "error"> {
  const res = await fetch(
    `${BASE}/v10/projects/${projectId()}/domains/${domain}${teamQuery()}`,
    { headers: headers() }
  );
  if (!res.ok) return "error";
  const data = await res.json();
  if (data.verified) return "verified";
  return "pending";
}

export async function removeDomainFromProject(domain: string): Promise<void> {
  await fetch(
    `${BASE}/v9/projects/${projectId()}/domains/${domain}${teamQuery()}`,
    { method: "DELETE", headers: headers() }
  );
}
