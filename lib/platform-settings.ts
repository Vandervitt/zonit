import pool from "@/lib/db";

// 平台级设置（super-admin 可编辑），存于 platform_settings KV 表。
// 目前用途：admin 端侧边栏「联系创始人」入口的联系方式。

export interface FounderContact {
  wechatId: string;
  wechatQrUrl: string;
  email: string;
}

const KEYS = {
  wechatId: "founder_wechat_id",
  wechatQrUrl: "founder_wechat_qr_url",
  email: "founder_email",
} as const;

export const EMPTY_FOUNDER_CONTACT: FounderContact = {
  wechatId: "",
  wechatQrUrl: "",
  email: "",
};

export async function getFounderContact(): Promise<FounderContact> {
  const result = await pool.query(
    `SELECT key, value FROM platform_settings WHERE key = ANY($1)`,
    [Object.values(KEYS)],
  );
  const map = new Map<string, string>(result.rows.map((r) => [r.key as string, r.value as string]));
  return {
    wechatId: map.get(KEYS.wechatId) ?? "",
    wechatQrUrl: map.get(KEYS.wechatQrUrl) ?? "",
    email: map.get(KEYS.email) ?? "",
  };
}

export async function setFounderContact(patch: Partial<FounderContact>): Promise<void> {
  const entries: Array<[string, string]> = [];
  if (patch.wechatId !== undefined) entries.push([KEYS.wechatId, patch.wechatId]);
  if (patch.wechatQrUrl !== undefined) entries.push([KEYS.wechatQrUrl, patch.wechatQrUrl]);
  if (patch.email !== undefined) entries.push([KEYS.email, patch.email]);
  if (entries.length === 0) return;

  for (const [key, value] of entries) {
    await pool.query(
      `INSERT INTO platform_settings (key, value, updated_at) VALUES ($1, $2, now())
       ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now()`,
      [key, value],
    );
  }
}
