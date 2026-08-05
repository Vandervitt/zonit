// lib/leads/nudge.ts
// 未读线索提醒：把「躺在收件箱里没人碰」的线索汇总成每日一封提醒邮件。
//
// 为什么是这个形态：平台没有下单/支付/物流,推不动任何跟进状态,所以不做要人手动
// 维护的状态机（见 docs/lead-capture-channels.md）。而「这条线索多久没被打开」是
// 平台自己就知道的信号,零录入——投广的 SMB 拼的就是跟进速度,线索躺着不产生收入。
import pool from "@/lib/db";
import type { LeadPayload } from "./validate";

/** 静置多久才提醒。太短会打扰正常作息（半夜留的资早上看很正常）。 */
export const NUDGE_AFTER_HOURS = 48;
/** 只提醒这个窗口内的线索：上线首日不能把历史积压的未读线索一次性轰出去。 */
export const NUDGE_MAX_AGE_DAYS = 30;
/** 单封邮件最多列几条，其余用总数带过，避免邮件变成一页表格。 */
export const MAX_LEADS_PER_EMAIL = 10;

export interface StaleLead {
  id: string;
  pageName: string;
  /** 姓名 + 首选联系方式，供邮件正文一眼认出是谁。 */
  contact: string;
  waitedHours: number;
}

export interface UserNudge {
  userId: string;
  email: string;
  /** 收件人界面语言（users.locale）；邮件在 cron 里异步发。 */
  locale: string | null;
  /** 列进邮件的线索（至多 MAX_LEADS_PER_EMAIL 条）。 */
  leads: StaleLead[];
  /** 该租户待提醒线索总数（可能多于 leads.length）。 */
  totalCount: number;
  /** 全部待提醒线索 id——发送成功后一起标记，避免没列进邮件的下一轮又提醒一次。 */
  leadIds: string[];
}

/** 姓名 + 首选联系方式；顺序与后台一键联系一致。 */
function contactSummary(payload: LeadPayload): string {
  const contact = payload.whatsapp ?? payload.phone ?? payload.email ?? payload.telegram ?? "";
  return [payload.name, contact].filter(Boolean).join(" · ") || "（无姓名）";
}

/**
 * 计算应提醒的租户与线索。过滤：未读、未提醒过、静置超 48h、不早于 30 天、
 * 账号未禁用、租户没关掉线索邮件通知（无设置行视为开启，与 getLeadNotifySettings 口径一致）。
 */
export async function computeLeadNudges(now: Date): Promise<UserNudge[]> {
  const staleBefore = new Date(now.getTime() - NUDGE_AFTER_HOURS * 3_600_000);
  const notOlderThan = new Date(now.getTime() - NUDGE_MAX_AGE_DAYS * 86_400_000);

  const res = await pool.query(
    `SELECT l.id, l.payload, l.created_at, p.name AS page_name, p.user_id, u.email, u.locale
       FROM leads l
       JOIN landing_pages p ON p.id = l.page_id
       JOIN users u ON u.id = p.user_id
       LEFT JOIN lead_notification_settings s ON s.user_id = p.user_id
      WHERE l.is_read = false
        AND l.nudged_at IS NULL
        AND l.created_at < $1
        AND l.created_at >= $2
        AND u.disabled_at IS NULL
        AND u.email IS NOT NULL
        AND COALESCE(s.email_enabled, TRUE)
      ORDER BY p.user_id, l.created_at ASC`,
    [staleBefore, notOlderThan],
  );

  const byUser = new Map<string, UserNudge>();
  for (const r of res.rows) {
    let entry = byUser.get(r.user_id);
    if (!entry) {
      entry = { userId: r.user_id, email: r.email, locale: r.locale, leads: [], totalCount: 0, leadIds: [] };
      byUser.set(r.user_id, entry);
    }
    entry.totalCount += 1;
    entry.leadIds.push(r.id);
    if (entry.leads.length < MAX_LEADS_PER_EMAIL) {
      entry.leads.push({
        id: r.id,
        pageName: r.page_name,
        contact: contactSummary(r.payload),
        waitedHours: Math.floor((now.getTime() - new Date(r.created_at).getTime()) / 3_600_000),
      });
    }
  }
  return [...byUser.values()];
}

/** 标记为已提醒。**只在邮件确实发出后调用**——否则提醒会被静默吞掉且永不重试。 */
export async function markNudged(ids: string[]): Promise<void> {
  if (ids.length === 0) return;
  await pool.query(`UPDATE leads SET nudged_at = NOW() WHERE id = ANY($1)`, [ids]);
}
