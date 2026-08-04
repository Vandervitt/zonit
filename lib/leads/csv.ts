// lib/leads/csv.ts
// 线索导出 CSV 序列化（纯函数）：RFC4180 转义（逗号/引号/换行）。
export interface LeadCsvRow {
  page_name: string;
  name: string;
  email: string;
  phone: string;
  whatsapp: string;
  telegram: string;
  message: string;
  channel: string;
  utm_source: string;
  utm_medium: string;
  utm_campaign: string;
  utm_content: string;
  utm_term: string;
  gclid: string;
  fbclid: string;
  ttclid: string;
  note: string;
  tags: string;
  created_at: string;
}

// 归因列全量导出：导出的主要用途就是拿去和广告后台对账，缺一列就得回后台逐条点开。
const COLUMNS: (keyof LeadCsvRow)[] = [
  "page_name", "name", "email", "phone", "whatsapp", "telegram", "message",
  "channel", "utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term",
  "gclid", "fbclid", "ttclid", "note", "tags", "created_at",
];

const esc = (v: string): string =>
  /[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;

export function leadsToCsv(rows: LeadCsvRow[]): string {
  const header = COLUMNS.join(",");
  const body = rows.map((r) => COLUMNS.map((c) => esc(r[c] ?? "")).join(","));
  return [header, ...body].join("\n") + "\n";
}
