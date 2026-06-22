import { describe, it, expect } from "vitest";
import { pickUnsplash, type UnsplashPhoto } from "./unsplash";

const base: UnsplashPhoto = {
  id: "x1",
  urls: { small: "https://img/s.jpg", regular: "https://img/r.jpg" },
  alt_description: "a calm beach",
  user: { name: "Jane", username: "jane" },
};

describe("pickUnsplash", () => {
  it("取 regular 作 src、alt_description 作 alt", () => {
    expect(pickUnsplash(base)).toEqual({ src: "https://img/r.jpg", alt: "a calm beach" });
  });
  it("alt_description 为 null 时 alt 回退空串", () => {
    expect(pickUnsplash({ ...base, alt_description: null })).toEqual({ src: "https://img/r.jpg", alt: "" });
  });
});
