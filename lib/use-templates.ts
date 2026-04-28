"use client";

import { useEffect, useState } from "react";
import type { PresetTemplate } from "@/lib/templates";

let cache: PresetTemplate[] | null = null;
let pending: Promise<PresetTemplate[]> | null = null;

function fetchTemplates(): Promise<PresetTemplate[]> {
  if (cache) return Promise.resolve(cache);
  if (!pending) {
    pending = fetch("/api/templates")
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((d: { templates: PresetTemplate[] }) => {
        cache = d.templates;
        return cache;
      })
      .catch(e => {
        console.error("Failed to load templates", e);
        return [] as PresetTemplate[];
      })
      .finally(() => { pending = null; });
  }
  return pending;
}

export function invalidateTemplatesCache() {
  cache = null;
}

export function useTemplates() {
  const [templates, setTemplates] = useState<PresetTemplate[]>(cache ?? []);
  const [loading, setLoading] = useState(!cache);

  useEffect(() => {
    let cancelled = false;
    fetchTemplates().then(t => {
      if (cancelled) return;
      setTemplates(t);
      setLoading(false);
    });
    return () => { cancelled = true; };
  }, []);

  return { templates, loading };
}
