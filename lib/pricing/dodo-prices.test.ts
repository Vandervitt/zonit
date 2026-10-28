import { describe, it, expect } from "vitest";
import { extractUsdCents, fetchPriceSnapshot, type ProductPriceLike } from "./dodo-prices";

const monthly = (price: number, over: Record<string, unknown> = {}): ProductPriceLike => ({
  product_id: "pdt_x",
  price: {
    type: "recurring_price",
    currency: "USD",
    price,
    discount: 0,
    payment_frequency_count: 1,
    payment_frequency_interval: "Month",
    ...over,
  },
});

const yearly = (price: number, over: Record<string, unknown> = {}): ProductPriceLike =>
  monthly(price, { payment_frequency_interval: "Year", ...over });

const oneTime = (price: number, over: Record<string, unknown> = {}): ProductPriceLike => ({
  product_id: "pdt_y",
  price: { type: "one_time_price", currency: "USD", price, discount: 0, ...over },
});

describe("extractUsdCents", () => {
  it("按月订阅产品取美分价", () => {
    expect(extractUsdCents(monthly(1999), "monthly")).toBe(1999);
  });

  it("一次性产品取美分价", () => {
    expect(extractUsdCents(oneTime(499), "one_time")).toBe(499);
  });

  it("币种不是 USD 时报错（官网按美元展示）", () => {
    expect(() => extractUsdCents(monthly(1999, { currency: "CNY" }), "monthly")).toThrow(/USD/);
  });

  it("按年订阅产品取美分价", () => {
    expect(extractUsdCents(yearly(39000), "yearly")).toBe(39000);
  });

  it("年付产品周期不是每 1 年时报错", () => {
    expect(() => extractUsdCents(monthly(39000), "yearly")).toThrow(/1 year/i);
    expect(() => extractUsdCents(yearly(39000, { payment_frequency_count: 2 }), "yearly")).toThrow(/1 year/i);
  });

  it("订阅周期不是每 1 个月时报错（展示后缀固定为 /月）", () => {
    expect(() => extractUsdCents(monthly(1999, { payment_frequency_interval: "Year" }), "monthly")).toThrow(/month/i);
    expect(() => extractUsdCents(monthly(1999, { payment_frequency_count: 3 }), "monthly")).toThrow(/month/i);
  });

  it("价格类型与用途不符时报错", () => {
    expect(() => extractUsdCents(oneTime(499), "monthly")).toThrow(/recurring_price/);
    expect(() => extractUsdCents(monthly(1999), "one_time")).toThrow(/one_time_price/);
  });

  it("带折扣或价格非正整数时报错（展示价会与扣款价不一致）", () => {
    expect(() => extractUsdCents(monthly(1999, { discount: 10 }), "monthly")).toThrow(/discount/);
    expect(() => extractUsdCents(monthly(0), "monthly")).toThrow(/price/);
    expect(() => extractUsdCents(monthly(19.99), "monthly")).toThrow(/price/);
  });

  it("按需付费（pay what you want）的一次性产品报错", () => {
    expect(() => extractUsdCents(oneTime(499, { pay_what_you_want: true }), "one_time")).toThrow(/pay_what_you_want/);
  });
});

describe("fetchPriceSnapshot", () => {
  const ids = {
    plans: { pro: { month: "pdt_pm", year: "pdt_py" }, agency: { month: "pdt_am", year: "pdt_ay" } },
    credits: { "50": "pdt_c50", "200": "pdt_c200" },
  };
  const catalog: Record<string, ProductPriceLike> = {
    pdt_pm: monthly(3900),
    pdt_py: yearly(39000),
    pdt_am: monthly(14900),
    pdt_ay: yearly(149000),
    pdt_c50: oneTime(499),
    pdt_c200: oneTime(1499),
  };

  it("按产品 id 逐个取价并组装快照（每档月付 + 年付）", async () => {
    const snapshot = await fetchPriceSnapshot(async (id) => catalog[id], ids);
    expect(snapshot).toEqual({
      currency: "USD",
      plans: { pro: { month: 3900, year: 39000 }, agency: { month: 14900, year: 149000 } },
      credits: { "50": 499, "200": 1499 },
    });
  });

  it("任一产品取价失败时整体失败，并在错误里指明是哪一档", async () => {
    const broken: Record<string, ProductPriceLike> = { ...catalog, pdt_pm: monthly(3900, { currency: "EUR" }) };
    await expect(fetchPriceSnapshot(async (id) => broken[id], ids)).rejects.toThrow(/plans\.pro\.month/);
  });

  it("年付价不等于月费 × 10 时整体失败：官网写的「省 2 个月」会与实际扣款不符", async () => {
    const off: Record<string, ProductPriceLike> = { ...catalog, pdt_ay: yearly(149900) };
    await expect(fetchPriceSnapshot(async (id) => off[id], ids)).rejects.toThrow(/plans\.agency.*× ?10/);
  });
});
