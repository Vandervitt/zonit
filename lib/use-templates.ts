"use client";

import useSWR, { mutate } from "swr";
import type { PresetTemplate } from "@/lib/templates";
import { ApiRoutes } from "@/lib/constants";

interface TemplatesResponse {
  templates: PresetTemplate[];
}

/** 失效模板缓存（如管理后台新增/删除模板后调用） */
export function invalidateTemplatesCache() {
  void mutate(ApiRoutes.Templates);
}

export function useTemplates() {
  const { data, error, isLoading, mutate: revalidate } = useSWR<TemplatesResponse>(
    ApiRoutes.Templates,
  );

  return {
    templates: data?.templates ?? [],
    isLoading,
    error,
    mutate: revalidate,
  };
}
