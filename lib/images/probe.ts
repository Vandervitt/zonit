// lib/images/probe.ts
//
// 在浏览器里量出图片的原始像素尺寸。
//
// 为什么在客户端量而不是上传时在服务端量：图片来源有四条（媒体库、Unsplash、
// 本地上传、用户手贴外链），只有浏览器这一处能同时覆盖全部——服务端只看得到
// 我们自己经手的那两条，外链永远量不到。而且这里零依赖：不必为读图片头引入
// sharp 之类的解码库。
//
// 量不到就返回 null（跨域、404、格式不支持都可能）。调用方必须容忍 null：
// 宁可不占位，也不能猜一个比例把图挤变形。
export interface ImageSize {
  width: number;
  height: number;
}

export function probeImageSize(src: string, timeoutMs = 8000): Promise<ImageSize | null> {
  if (typeof window === "undefined" || !src) return Promise.resolve(null);
  return new Promise((resolve) => {
    const img = new window.Image();
    let done = false;
    const finish = (size: ImageSize | null) => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      resolve(size);
    };
    // 慢图 / 挂起的请求不能让调用方永远等下去。
    const timer = setTimeout(() => finish(null), timeoutMs);
    img.onload = () =>
      finish(
        img.naturalWidth > 0 && img.naturalHeight > 0
          ? { width: img.naturalWidth, height: img.naturalHeight }
          : null,
      );
    img.onerror = () => finish(null);
    img.src = src;
  });
}
