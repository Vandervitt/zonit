import { describe, it, expect } from "vitest";
import { mergeAdminRecipients } from "./notify-recipients";

describe("mergeAdminRecipients", () => {
  it("合并环境变量白名单与库内超管，去重且大小写归一", () => {
    expect(mergeAdminRecipients("A@x.com, b@x.com", ["a@x.com", "c@x.com"]))
      .toEqual(["a@x.com", "b@x.com", "c@x.com"]);
  });
  it("丢弃空项与非邮箱串", () => {
    expect(mergeAdminRecipients(" , ,not-an-email", ["d@x.com"])).toEqual(["d@x.com"]);
  });
  it("两侧皆空时返回空数组", () => {
    expect(mergeAdminRecipients(undefined, [])).toEqual([]);
  });
});
