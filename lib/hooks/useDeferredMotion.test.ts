import { describe, expect, it, vi } from "vitest";
import { INTERACTION_EVENTS, scheduleAfterFirstInteraction } from "@/lib/hooks/useDeferredMotion";

/** 最小事件宿主替身：记录注册的监听器，便于断言注册/解绑与手动派发。 */
function createHost() {
  const listeners = new Map<string, EventListener>();
  return {
    listeners,
    added: [] as string[],
    removed: [] as string[],
    addEventListener(type: string, listener: EventListener) {
      this.added.push(type);
      listeners.set(type, listener);
    },
    removeEventListener(type: string, listener: EventListener) {
      this.removed.push(type);
      if (listeners.get(type) === listener) listeners.delete(type);
    },
    fire(type: string) {
      listeners.get(type)?.(new Event(type));
    },
  };
}

describe("scheduleAfterFirstInteraction", () => {
  it("does not run the callback before any interaction, keeping the first paint static", () => {
    const host = createHost();
    const run = vi.fn();

    scheduleAfterFirstInteraction(run, host);

    expect(run).not.toHaveBeenCalled();
    expect(host.added).toEqual([...INTERACTION_EVENTS]);
  });

  it.each([...INTERACTION_EVENTS])("starts the animation on first %s", (type) => {
    const host = createHost();
    const run = vi.fn();

    scheduleAfterFirstInteraction(run, host);
    host.fire(type);

    expect(run).toHaveBeenCalledTimes(1);
  });

  it("runs only once even if several interactions arrive", () => {
    const host = createHost();
    const run = vi.fn();

    scheduleAfterFirstInteraction(run, host);
    host.fire("scroll");
    host.fire("scroll");
    host.fire("keydown");

    expect(run).toHaveBeenCalledTimes(1);
  });

  it("detaches every listener once triggered, leaving no idle handlers behind", () => {
    const host = createHost();

    scheduleAfterFirstInteraction(vi.fn(), host);
    host.fire("scroll");

    expect(host.removed).toEqual([...INTERACTION_EVENTS]);
    expect(host.listeners.size).toBe(0);
  });

  it("detaches every listener on cleanup before any interaction", () => {
    const host = createHost();
    const run = vi.fn();

    const cleanup = scheduleAfterFirstInteraction(run, host);
    cleanup();
    host.fire("scroll");

    expect(host.removed).toEqual([...INTERACTION_EVENTS]);
    expect(run).not.toHaveBeenCalled();
  });
});
