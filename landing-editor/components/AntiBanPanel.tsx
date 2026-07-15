// landing-editor/components/AntiBanPanel.tsx
"use client";
import { useState } from "react";
import { useEditorState, useEditorDispatch } from "../store/editorStore";
import { useMeta } from "../MetaContext";
import { hasAntiBan } from "@/lib/plans";
import { newVariantSeed } from "@/landing-renderer/variant";

/** 反同质化面板：Pro/Agency 可「重新打散指纹」；其余套餐显示升级引导。 */
export function AntiBanPanel({ onClose }: { onClose: () => void }) {
  const state = useEditorState();
  const dispatch = useEditorDispatch();
  const { plan } = useMeta();
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
            反同质化风控为 Pro 及以上套餐权益，升级后可为已发布页打散指纹、规避投放查重。
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
