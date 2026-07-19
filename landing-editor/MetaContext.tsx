"use client";
import { createContext, useContext, useState, type ReactNode } from "react";
import type { PlanId } from "@/lib/plans";

export type SaveState = "idle" | "saving" | "saved" | "error";
export type PageStatus = "draft" | "published";

interface MetaValue {
  pageId: string;
  name: string;
  setName: (n: string) => void;
  saveState: SaveState;
  setSaveState: (s: SaveState) => void;
  plan: PlanId;
  status: PageStatus;
  setStatus: (s: PageStatus) => void;
  /** 已发布页存在「未发布到线上」的草稿改动（发布快照语义）。 */
  publishedDirty: boolean;
  setPublishedDirty: (d: boolean) => void;
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
  const [status, setStatus] = useState<PageStatus>(initialStatus);
  const [publishedDirty, setPublishedDirty] = useState(initialPublishedDirty);
  return (
    <MetaCtx.Provider
      value={{ pageId, name, setName, saveState, setSaveState, plan, status, setStatus, publishedDirty, setPublishedDirty }}
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
