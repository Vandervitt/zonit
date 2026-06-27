"use client";
import { toast } from "sonner";
import { Routes } from "@/lib/constants";

/**
 * 写操作返回 401（未登录或会话失效，如本地库重置后旧 JWT 仍指向已消失的 user.id）时，
 * 统一提示并跳转登录页。返回 true 表示已处理，调用方应直接 return。
 */
export function handleSessionExpired(
  res: Response,
  router: { push: (href: string) => void },
): boolean {
  if (res.status !== 401) return false;
  toast.error("登录状态已失效，请重新登录");
  router.push(Routes.Login);
  return true;
}
