import { describe, expect, it } from "vitest";
import { resolveCtaHref, resolveCtaChannel } from "./resolveCta";
import type { PageContact } from "@/types/schema.draft";

const contact: PageContact = {
  primary: "whatsapp",
  whatsapp: "+8613800138000",
  email: "hi@brand.com",
};

describe("resolveCtaHref", () => {
  it("primary 跟随主渠道", () => {
    expect(resolveCtaHref({ kind: "primary" }, contact)?.href).toBe("https://wa.me/8613800138000");
  });

  it("channel 钉死指定渠道", () => {
    expect(resolveCtaHref({ kind: "channel", channel: "email" }, contact)?.href).toBe("mailto:hi@brand.com");
  });

  it("url 原样返回，不做任何加工", () => {
    const url = "https://instagram.com/brand?utm_source=lp";
    expect(resolveCtaHref({ kind: "url", url }, contact)).toEqual({ href: url, external: true });
  });

  it("primary 是 form 时解析为页内锚点", () => {
    expect(resolveCtaHref({ kind: "primary" }, { primary: "form" })?.href).toBe("#lead-form");
  });

  it("引用的渠道没填值时返回 null（该 CTA 不渲染，而非死链）", () => {
    expect(resolveCtaHref({ kind: "channel", channel: "telegram" }, contact)).toBeNull();
    expect(resolveCtaHref({ kind: "primary" }, { primary: "phone" })).toBeNull();
  });

  it("空 url 也返回 null，不产出 href=\"\"", () => {
    expect(resolveCtaHref({ kind: "url", url: "  " }, contact)).toBeNull();
  });
});

describe("resolveCtaChannel", () => {
  it("渠道类落点返回具体渠道，url 归为 external", () => {
    expect(resolveCtaChannel({ kind: "primary" }, contact)).toBe("whatsapp");
    expect(resolveCtaChannel({ kind: "channel", channel: "phone" }, contact)).toBe("phone");
    expect(resolveCtaChannel({ kind: "url", url: "https://x.com" }, contact)).toBe("external");
  });
});
