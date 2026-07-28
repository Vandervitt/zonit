import { describe, expect, it } from "vitest";
import { isActiveNavRoute } from "./nav-active";
import { Routes } from "@/lib/constants/routes";

describe("isActiveNavRoute", () => {
  it("精确匹配英文路由", () => {
    expect(isActiveNavRoute("/templates", Routes.Templates)).toBe(true);
    expect(isActiveNavRoute("/guides", Routes.Guides)).toBe(true);
    expect(isActiveNavRoute("/anti-ban", Routes.AntiBan)).toBe(true);
  });

  it("剥掉 /zh 前缀后同样命中", () => {
    expect(isActiveNavRoute("/zh/templates", Routes.Templates)).toBe(true);
    expect(isActiveNavRoute("/zh/guides/how-to-run-ads", Routes.Guides)).toBe(true);
  });

  it("子路径命中父级导航", () => {
    expect(isActiveNavRoute("/templates/beauty-serum", Routes.Templates)).toBe(true);
    expect(isActiveNavRoute("/guides/lead-gen-101", Routes.Guides)).toBe(true);
  });

  it("不同路由不互相命中", () => {
    expect(isActiveNavRoute("/templates", Routes.Guides)).toBe(false);
    expect(isActiveNavRoute("/anti-ban", Routes.Templates)).toBe(false);
  });

  it("前缀相同但非同一段的路径不算命中", () => {
    expect(isActiveNavRoute("/templates-archive", Routes.Templates)).toBe(false);
  });

  it("首页只在根路径命中", () => {
    expect(isActiveNavRoute("/", Routes.Home)).toBe(true);
    expect(isActiveNavRoute("/zh", Routes.Home)).toBe(true);
    expect(isActiveNavRoute("/templates", Routes.Home)).toBe(false);
  });
});
