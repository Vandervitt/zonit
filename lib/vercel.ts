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

export interface DomainConfig {
  cname: string;
  verified: boolean;
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
  return {
    cname: "cname.vercel-dns.com",
    verified: data.verified ?? false,
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
