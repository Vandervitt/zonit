// landing-editor/components/AntiBanPanel.tsx
"use client";
import { useEffect, useState } from "react";
import { useEditorState, useEditorDispatch } from "../store/editorStore";
import { useMeta } from "../MetaContext";
import { hasAntiBan } from "@/lib/plans";
import { newVariantSeed } from "@/landing-renderer/variant";
import { ApiRoutes } from "@/lib/constants";
import type { SimilarityReport, StructureCluster } from "@/lib/antiban/similarity";

/**
 * 判重风险读数。
 *
 * 面板原来只有一个「重新打散指纹」按钮——那是执行动作，不是判断依据。
 * Agency 档卖的是批量投放风控，用户要先看见「哪些页骨架一模一样、其中几张还没打散」，
 * 才知道该不该按那个按钮。
 *
 * 刻意不给「安全 / 危险」评分：判重是平台黑盒，给分等于承诺过审
 * ——与自检器同一条红线。这里只陈述事实。
 */
function RiskReadout({ pageId }: { pageId: string }) {
  const [report, setReport] = useState<SimilarityReport | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let active = true;
    fetch(ApiRoutes.AntiBanSimilarity)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then((data: SimilarityReport) => active && setReport(data))
      .catch(() => active && setFailed(true));
    return () => { active = false; };
  }, []);

  if (failed) return <p className="text-xs text-ink-muted">风险读数加载失败，稍后重试。</p>;
  if (!report) return <p className="text-xs text-ink-muted">正在统计…</p>;

  if (report.total === 0) {
    return <p className="text-xs text-ink-muted">名下还没有已发布的页。草稿不会被平台抓到，暂无判重风险可言。</p>;
  }

  // 当前这张页所在的重复组——面板是在编辑某张页时打开的，先回答「这张页有没有事」。
  const mine: StructureCluster | undefined = report.clusters.find((c) => c.pages.some((p) => p.pageId === pageId));

  return (
    <div className="space-y-2 rounded-md border border-edge p-3 text-xs">
      {mine ? (
        <>
          <p className="text-ink">
            这张页的区块骨架与名下另外 <b>{mine.pages.length - 1}</b> 张已发布页完全一致。
          </p>
          <p className="text-ink-muted">
            骨架：<span className="font-mono">{mine.sequence.join(" › ") || "（无中部区块）"}</span>
          </p>
          <ul className="space-y-0.5 text-ink-soft">
            {mine.pages.map((p) => (
              <li key={p.pageId}>
                {p.pageId === pageId ? "· 本页" : `· ${p.name}`}
                {p.hasVariantSeed ? "（已打散）" : "（未打散）"}
              </li>
            ))}
          </ul>
          {mine.unseeded > 0 && (
            <p className="text-amber-600">
              其中 {mine.unseeded} 张尚未打散指纹。同时投放这几张时最容易被连坐。
            </p>
          )}
        </>
      ) : (
        <p className="text-ink">这张页的区块骨架在名下已发布页中是唯一的。</p>
      )}
      <p className="border-t border-edge pt-2 text-ink-muted">
        名下已发布 {report.total} 张，其中 {report.duplicated} 张与他页骨架重复、
        {report.unseeded} 张尚未打散指纹。
        平台判重看的是结构而不是文案，只改文字不会改变这里的数字。
      </p>
    </div>
  );
}

/** 反同质化面板：Agency 可「重新打散指纹」；其余套餐显示升级引导。 */
export function AntiBanPanel({ onClose }: { onClose: () => void }) {
  const state = useEditorState();
  const dispatch = useEditorDispatch();
  const { plan, pageId } = useMeta();
  const enabled = hasAntiBan(plan);
  const [rerolled, setRerolled] = useState(false);

  const reroll = () => {
    dispatch({ kind: "setVariantSeed", value: newVariantSeed() });
    setRerolled(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={onClose}>
      <div className="w-[460px] rounded-xl bg-panel p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-base font-semibold text-ink">反同质化风控</h2>
        <p className="mt-1 text-xs text-ink-muted">
          为已发布页打散页面指纹（DOM 结构 / 属性 / meta），避免与套用同模板的其它广告主雷同、被投放平台判重限流。对访客与爬虫展示的内容完全一致。
        </p>

        {/* 读数对所有套餐可见：看见风险是所有人的事，能不能打散才是 Agency 权益 */}
        <div className="mt-4">
          <RiskReadout pageId={pageId} />
        </div>

        {enabled ? (
          <div className="mt-4 space-y-3">
            <div className="rounded-md border border-edge p-3 text-xs text-ink-soft">
              <p>
                当前指纹种子：
                <span className="ml-1 font-mono text-ink">
                  {state.variantSeed ? state.variantSeed : "自动（按页面 ID 派生）"}
                </span>
              </p>
              <p className="mt-1 text-ink-muted">
                页面被判重或限流时，点下方按钮换一枚新种子，重新打散指纹。
              </p>
            </div>
            <button
              type="button"
              onClick={reroll}
              className="rounded-md bg-brand-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-700"
            >
              重新打散指纹
            </button>
            {rerolled && (
              <p className="text-xs text-emerald-600">已生成新指纹，自动保存后于已发布页生效。</p>
            )}
          </div>
        ) : (
          <div className="mt-4 rounded-md border border-edge p-3 text-xs text-ink-muted">
            反同质化风控为 Agency 套餐权益，升级后可为已发布页打散指纹、规避投放查重。
          </div>
        )}

        <div className="mt-5 flex justify-end">
          <button
            onClick={onClose}
            className="rounded-md bg-brand-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-700"
          >
            完成
          </button>
        </div>
      </div>
    </div>
  );
}
