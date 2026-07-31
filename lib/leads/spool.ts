// lib/leads/spool.ts
// 线索落库失败时的兜底留存。刻意不落 Postgres——失败场景本身多半就是库不可用，
// 故写 Vercel Blob（private，含访客 PII 不得公开可读），由每日 cron 重投回 leads 表。
import { put, list, get, del } from "@vercel/blob";
import { isBadPageIdError } from "@/lib/db-errors";
import { insertLead, type LeadAttribution } from "./store";
import type { LeadPayload } from "./validate";

const PREFIX = "lead-spool/";
/** 超过该天数仍重投不成功的条目直接丢弃，避免无上限堆积。 */
const MAX_AGE_DAYS = 7;

export interface SpooledLead {
  pageId: string;
  payload: LeadPayload;
  attr: LeadAttribution;
  spooledAt: string;
}

/** 暂存一条落库失败的线索；失败时抛出，由调用方上报。 */
export async function spoolLead(entry: SpooledLead): Promise<void> {
  await put(`${PREFIX}${entry.spooledAt}.json`, JSON.stringify(entry), {
    access: "private",
    contentType: "application/json",
    addRandomSuffix: true,
  });
}

export interface ReplayResult {
  replayed: number;
  dropped: number;
  pending: number;
}

/**
 * 重投兜底留存的线索（cron 用）。成功或确认无救（坏 page_id / 过期）即删除 blob，
 * 其余保留待下次重投。单条失败不影响其余条目。
 */
export async function replaySpooledLeads(limit = 100): Promise<ReplayResult> {
  const { blobs } = await list({ prefix: PREFIX, limit });
  const result: ReplayResult = { replayed: 0, dropped: 0, pending: 0 };
  const expireBefore = Date.now() - MAX_AGE_DAYS * 86_400_000;

  for (const blob of blobs) {
    let entry: SpooledLead;
    try {
      const res = await get(blob.url, { access: "private" });
      if (!res || res.statusCode !== 200) {
        result.pending += 1;
        continue;
      }
      entry = JSON.parse(await new Response(res.stream).text()) as SpooledLead;
    } catch (err) {
      console.error("[leads/spool] 读取失败:", blob.pathname, err);
      result.pending += 1;
      continue;
    }

    if (Date.parse(entry.spooledAt) < expireBefore) {
      await del(blob.url);
      result.dropped += 1;
      continue;
    }

    try {
      await insertLead(entry.pageId, entry.payload, entry.attr);
      await del(blob.url);
      result.replayed += 1;
    } catch (err) {
      if (isBadPageIdError(err)) {
        await del(blob.url);
        result.dropped += 1;
        continue;
      }
      console.error("[leads/spool] 重投失败:", blob.pathname, err);
      result.pending += 1;
    }
  }
  return result;
}
