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
  created_at: string;
}

const COLUMNS: (keyof LeadCsvRow)[] = [
  "page_name", "name", "email", "phone", "whatsapp", "telegram", "message", "channel", "utm_source", "created_at",
];

const esc = (v: string): string =>
  /[",\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;

export function leadsToCsv(rows: LeadCsvRow[]): string {
  const header = COLUMNS.join(",");
  const body = rows.map((r) => COLUMNS.map((c) => esc(r[c] ?? "")).join(","));
  return [header, ...body].join("\n") + "\n";
}
