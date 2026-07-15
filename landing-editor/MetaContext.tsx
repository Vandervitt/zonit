"use client";
import { createContext, useContext, useState, type ReactNode } from "react";
import type { PlanId } from "@/lib/plans";

export type SaveState = "idle" | "saving" | "saved" | "error";

interface MetaValue {
  pageId: string;
  name: string;
  setName: (n: string) => void;
  saveState: SaveState;
  setSaveState: (s: SaveState) => void;
  plan: PlanId;
}

const MetaCtx = createContext<MetaValue | null>(null);

export function MetaProvider({
  pageId,
  initialName,
  plan,
  children,
}: {
  pageId: string;
  initialName: string;
  plan: PlanId;
  children: ReactNode;
}) {
  const [name, setName] = useState(initialName);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  return (
    <MetaCtx.Provider value={{ pageId, name, setName, saveState, setSaveState, plan }}>
      {children}
    </MetaCtx.Provider>
  );
}

export function useMeta(): MetaValue {
  const ctx = useContext(MetaCtx);
  if (!ctx) throw new Error("useMeta must be used within MetaProvider");
  return ctx;
}
