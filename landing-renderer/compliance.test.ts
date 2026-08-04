// landing-renderer/compliance.test.ts
//
// 四平台通投清单里「页面自身能被客观核实」的那几项，直接用我们自己的落地页
// 自检器（lib/tools/checks.ts）去判自己的生成页 —— 两套东西必须自洽：对外说
// 「贴网址看你缺什么」，自己生成的页却缺同样的东西，是最难解释的一种不一致。
//
// 回归背景：页脚原先把隐私政策与条款渲染成 <p> 段落，findPolicyLinks 只认 <a>，
// 实测判我们自己的生成页 privacy_missing + terms_missing。
import { describe, it, expect } from "vitest";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { LandingPage } from "./LandingPage";
import { hairTransplantDraft } from "@/landing-editor/samples/hairTransplantDraft";
import { detectContact, findPolicyLinks } from "@/lib/tools/checks";

const BASE = new URL("https://acme.example/");

const render = (props: { policyBase?: string; companyInfo?: string } = {}) =>
  renderToStaticMarkup(
    createElement(LandingPage, { page: hairTransplantDraft, pageId: "p1", ...props }),
  );

describe("生成页 vs 自检器", () => {
  it("发布态页脚给出可达的隐私政策与条款链接", () => {
    const links = findPolicyLinks(render({ policyBase: "/" }), BASE);
    expect(links.privacy).toBe("https://acme.example/privacy");
    expect(links.terms).toBe("https://acme.example/terms");
  });

  it("发布在子路径时政策链接跟着挂在该路径下", () => {
    const links = findPolicyLinks(render({ policyBase: "/invisalign" }), BASE);
    expect(links.privacy).toBe("https://acme.example/invisalign/privacy");
    expect(links.terms).toBe("https://acme.example/invisalign/terms");
  });

  it("页脚仍给得出联系方式", () => {
    expect(detectContact(render({ policyBase: "/" }))).toEqual({ email: true, phone: true });
  });

  it("政策正文段落保留在落地页上（医疗/法律模板的免责声明不能只藏在子页）", () => {
    const html = render({ policyBase: "/" });
    expect(html).toContain("does not constitute a medical diagnosis");
  });

  it("经营主体信息传入即上页脚", () => {
    expect(render({ policyBase: "/", companyInfo: "Meridian Ltd · Company No. 123" }))
      .toContain("Meridian Ltd · Company No. 123");
  });

  it("拿不到政策地址时不出链接：死链比没有链接更糟", () => {
    const html = render();
    expect(html).not.toContain(">Privacy Policy<");
    expect(findPolicyLinks(html, BASE)).toEqual({});
  });

  it("表单旁的收集点告知随政策链接一同出现", () => {
    expect(render({ policyBase: "/" })).toContain("By submitting this form you agree to our");
    expect(render()).not.toContain("By submitting this form you agree to our");
  });
});
