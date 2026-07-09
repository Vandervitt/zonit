import { describe, it, expect } from "vitest";
import { toImportInput, type UnsplashPhoto } from "./unsplash";

const base: UnsplashPhoto = {
  id: "x1",
  urls: { small: "https://images.unsplash.com/s.jpg", regular: "https://images.unsplash.com/r.jpg" },
  alt_description: "a calm beach",
  downloadLocation: "https://api.unsplash.com/photos/x1/download",
  user: { name: "Jane", username: "jane", profileUrl: "https://unsplash.com/@jane?utm_source=zap_bridge&utm_medium=referral" },
};

describe("toImportInput", () => {
  it("用 regular 作 imageUrl，带下载链接与摄影师署名", () => {
    expect(toImportInput(base)).toEqual({
      downloadLocation: "https://api.unsplash.com/photos/x1/download",
      imageUrl: "https://images.unsplash.com/r.jpg",
      creditName: "Jane",
      creditUrl: "https://unsplash.com/@jane?utm_source=zap_bridge&utm_medium=referral",
      alt: "a calm beach",
    });
  });
  it("alt_description 为 null 时 alt 回退空串", () => {
    expect(toImportInput({ ...base, alt_description: null }).alt).toBe("");
  });
});
