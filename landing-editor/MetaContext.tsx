"use client";
import { createContext, useContext, useRef, useState, type ReactNode, type MutableRefObject } from "react";
import type { PlanId } from "@/lib/plans";

export type SaveState = "idle" | "saving" | "saved" | "error";
export type PageStatus = "draft" | "published";

interface MetaValue {
  pageId: string;
  name: string;
  setName: (n: string) => void;
  saveState: SaveState;
  setSaveState: (s: SaveState) => void;
  /** 保存失败的可读原因（如名称重复）；为空时展示通用失败文案。 */
  saveError: string;
  setSaveError: (m: string) => void;
  plan: PlanId;
  status: PageStatus;
  setStatus: (s: PageStatus) => void;
  /** 已发布页存在「未发布到线上」的草稿改动（发布快照语义）。 */
  publishedDirty: boolean;
  setPublishedDirty: (d: boolean) => void;
  /** AutoSave 注册的立即落库函数：取消防抖并保存当前草稿，resolve 保存是否成功（无待保存改动时为 true）。 */
  flushSaveRef: MutableRefObject<(() => Promise<boolean>) | null>;
}

const MetaCtx = createContext<MetaValue | null>(null);

export function MetaProvider({
  pageId,
  initialName,
  plan,
  initialStatus = "draft",
  initialPublishedDirty = false,
  children,
}: {
  pageId: string;
  initialName: string;
  plan: PlanId;
  initialStatus?: PageStatus;
  initialPublishedDirty?: boolean;
  children: ReactNode;
}) {
  const [name, setName] = useState(initialName);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [saveError, setSaveError] = useState("");
  const [status, setStatus] = useState<PageStatus>(initialStatus);
  const [publishedDirty, setPublishedDirty] = useState(initialPublishedDirty);
  const flushSaveRef = useRef<(() => Promise<boolean>) | null>(null);
  return (
    <MetaCtx.Provider
      value={{ pageId, name, setName, saveState, setSaveState, saveError, setSaveError, plan, status, setStatus, publishedDirty, setPublishedDirty, flushSaveRef }}
    >
      {children}
    </MetaCtx.Provider>
  );
}

export function useMeta(): MetaValue {
  const ctx = useContext(MetaCtx);
  if (!ctx) throw new Error("useMeta must be used within MetaProvider");
  return ctx;
}
