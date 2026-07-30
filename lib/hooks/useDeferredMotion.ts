"use client";

import { useEffect, useState } from "react";

/** 视为「用户开始浏览」的首次交互信号。 */
export const INTERACTION_EVENTS = ["scroll", "pointerdown", "keydown"] as const;

type EventHost = Pick<Window, "addEventListener" | "removeEventListener">;

/**
 * 等待首次用户交互后执行回调一次，返回清理函数。
 *
 * 采用交互触发而非定时器：Lighthouse 的 Speed Index 采样在生产站可持续到 13s 以上，
 * 任何秒级延迟（如 requestIdleCallback 的 3s 兜底）都仍落在采样窗口内，起不到作用。
 * 交互信号能把装饰动画完全移出首屏测量窗口，同时真实用户一开始滚动就能看到动画。
 *
 * host 可注入，便于在 node 环境下单测（项目未引入 DOM 测试库）。
 */
export function scheduleAfterFirstInteraction(
  run: () => void,
  host: EventHost = globalThis as unknown as EventHost,
): () => void {
  let done = false;

  const detach = () => {
    for (const type of INTERACTION_EVENTS) host.removeEventListener(type, onInteract);
  };

  const onInteract = () => {
    if (done) return;
    done = true;
    detach();
    run();
  };

  for (const type of INTERACTION_EVENTS) {
    host.addEventListener(type, onInteract, { passive: true });
  }

  return () => {
    if (done) return;
    done = true;
    detach();
  };
}

/**
 * 循环装饰动画的启用开关：首屏静止，用户首次交互后转 true。
 *
 * 持续运行的 `repeat: Infinity` 动画会让像素永不稳定，Lighthouse 因此判定视觉从未完成，
 * 实测把营销页 Speed Index 拉到 15s 量级（以 reduced-motion 对照实测可降至 5.6s）。
 */
export function useDeferredMotion(): boolean {
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    return scheduleAfterFirstInteraction(() => setEnabled(true), window);
  }, []);

  return enabled;
}
