import { describe, it, expect } from "vitest";
import { contactLinks } from "./contact-links";

describe("contactLinks", () => {
  it("email → mailto（站内协议，不开新窗）", () => {
    const { links } = contactLinks({ email: "ann@example.com" });
    expect(links).toEqual([{ kind: "email", href: "mailto:ann@example.com", external: false }]);
  });

  it("whatsapp → wa.me（去掉 + 号，wa.me 只吃纯数字）", () => {
    const { links } = contactLinks({ whatsapp: "+8613800138000" });
    expect(links[0]).toMatchObject({ kind: "whatsapp", href: "https://wa.me/8613800138000", external: true });
  });

  it("phone → tel:", () => {
    const { links } = contactLinks({ phone: "+15551234567" });
    expect(links[0]).toMatchObject({ kind: "phone", href: "tel:+15551234567" });
  });

  it("telegram → t.me/<裸用户名>", () => {
    const { links } = contactLinks({ telegram: "johndoe" });
    expect(links[0]).toMatchObject({ kind: "telegram", href: "https://t.me/johndoe", external: true });
  });

  it("多渠道按 whatsapp → phone → email → telegram 排序（跟进成功率优先）", () => {
    const { links } = contactLinks({
      email: "ann@example.com", phone: "+15551234567", whatsapp: "+8613800138000", telegram: "johndoe",
    });
    expect(links.map((l) => l.kind)).toEqual(["whatsapp", "phone", "email", "telegram"]);
  });

  it("非 E.164 号码不产出链接，降级为纯文本（宁可不给,也不给一个拨错的号）", () => {
    const { links, plain } = contactLinks({ phone: "555 0100", whatsapp: "0912345678" });
    expect(links).toEqual([]);
    // 降级文本与链接同序（whatsapp 优先），避免同一条线索里两种排序打架
    expect(plain).toEqual(["whatsapp: 0912345678", "phone: 555 0100"]);
  });

  it("跳不了 t.me 的 telegram 同样降级为纯文本", () => {
    const { links, plain } = contactLinks({ telegram: "13800138000" });
    expect(links).toEqual([]);
    expect(plain).toEqual(["telegram: 13800138000"]);
  });

  it("无联系方式 → 空", () => {
    expect(contactLinks({ name: "Ann" })).toEqual({ links: [], plain: [] });
  });
});
