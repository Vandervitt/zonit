import { describe, it, expect } from "vitest";
import { unsplashProfileUrl, mapUnsplashPhoto, type UnsplashRaw } from "./unsplash";

const raw: UnsplashRaw = {
  id: "abc",
  urls: { small: "https://images.unsplash.com/s.jpg", regular: "https://images.unsplash.com/r.jpg" },
  alt_description: "a calm beach",
  links: { download_location: "https://api.unsplash.com/photos/abc/download" },
  user: { name: "Jane Doe", username: "jane" },
};

describe("unsplashProfileUrl", () => {
  it("拼摄影师主页并带 utm 归属参数", () => {
    expect(unsplashProfileUrl("jane")).toBe(
      "https://unsplash.com/@jane?utm_source=zap_bridge&utm_medium=referral",
    );
  });
});

describe("mapUnsplashPhoto", () => {
  it("映射出前端所需字段（含 downloadLocation 与 profileUrl）", () => {
    expect(mapUnsplashPhoto(raw)).toEqual({
      id: "abc",
      urls: { small: "https://images.unsplash.com/s.jpg", regular: "https://images.unsplash.com/r.jpg" },
      alt_description: "a calm beach",
      downloadLocation: "https://api.unsplash.com/photos/abc/download",
      user: {
        name: "Jane Doe",
        username: "jane",
        profileUrl: "https://unsplash.com/@jane?utm_source=zap_bridge&utm_medium=referral",
      },
    });
  });
});
