// 反同质化风险读数：把「你名下这些页彼此有多像」算出来。
//
// 为什么按结构而不是按模板来源：
//   1. 平台判的就是结构——DOM 骨架、区块顺序、meta 指纹。文案改一遍但骨架一模一样，
//      照样被判重（营销侧长文《结构判重不是文字》讲的就是这件事）。
//   2. 落地页从来没有记过 template_id，存量页无从回填。结构签名从 draft 现算，
//      存量页与新页一视同仁。
//
// 这里只给**事实与依据**，不给「安全/危险」的评分。判重是平台的黑盒，
// 给分数等于承诺过审——与自检器同一条红线。

import type { LandingPageDraft, LandingSectionType } from "@/types/schema.draft";

/** 参与结构签名的要素。刻意不含任何文案——文案改了结构没变，风险并没有降低。 */
export interface PageStructure {
  /** 区块类型按出现顺序拼接。顺序本身是判重信号，故不排序。 */
  sequence: LandingSectionType[];
  /** 是否已打散指纹（有自定义种子）。 */
  hasVariantSeed: boolean;
}

export function extractStructure(draft: Pick<LandingPageDraft, "sections" | "variantSeed">): PageStructure {
  return {
    sequence: (draft.sections ?? []).map((s) => s.type),
    hasVariantSeed: Boolean(draft.variantSeed),
  };
}

/** 结构签名：同签名 = 骨架完全一致。 */
export function structureSignature(structure: PageStructure): string {
  return structure.sequence.join(">") || "(empty)";
}

export interface ClusterPage {
  pageId: string;
  name: string;
  status: string;
  hasVariantSeed: boolean;
}

/** 一组骨架完全相同的页。 */
export interface StructureCluster {
  signature: string;
  /** 区块顺序，供 UI 直接展示「这些页长得一样在哪」。 */
  sequence: LandingSectionType[];
  pages: ClusterPage[];
  /** 该组里尚未打散指纹的页数——这是唯一可行动的那个数。 */
  unseeded: number;
}

export interface SimilarityReport {
  /** 参与统计的页数（只算已发布：草稿不会被平台看到）。 */
  total: number;
  /** 骨架重复的组（同组 ≥2 张），按组内页数降序。 */
  clusters: StructureCluster[];
  /** 处在重复组里的页数。 */
  duplicated: number;
  /** 全部页中尚未打散指纹的页数。 */
  unseeded: number;
}

export function buildSimilarityReport(
  pages: { pageId: string; name: string; status: string; structure: PageStructure }[],
): SimilarityReport {
  const bySignature = new Map<string, StructureCluster>();
  for (const p of pages) {
    const signature = structureSignature(p.structure);
    const cluster = bySignature.get(signature) ?? {
      signature, sequence: p.structure.sequence, pages: [], unseeded: 0,
    };
    cluster.pages.push({
      pageId: p.pageId, name: p.name, status: p.status, hasVariantSeed: p.structure.hasVariantSeed,
    });
    if (!p.structure.hasVariantSeed) cluster.unseeded += 1;
    bySignature.set(signature, cluster);
  }

  const clusters = [...bySignature.values()]
    .filter((c) => c.pages.length >= 2)
    .sort((a, b) => b.pages.length - a.pages.length || b.unseeded - a.unseeded);

  return {
    total: pages.length,
    clusters,
    duplicated: clusters.reduce((n, c) => n + c.pages.length, 0),
    unseeded: pages.filter((p) => !p.structure.hasVariantSeed).length,
  };
}
