// e2e/helpers/app-pool.ts
//
// 用例里直接调用应用侧函数（而不是自己发 SQL）时，用的是 lib/db 的共享连接池。
// 它必须在 worker 退出前关掉，否则进程挂着不退。
//
// ⚠️ 不能在各 spec 的 afterAll 里关：多个 spec 在同一个 worker 进程里顺序跑，
// 先跑完的那个一关，后面还要用应用函数的 spec 当场拿到
// "Cannot use a pool after calling end on the pool"。按文件名顺序碰运气更糟——
// 加一个新 spec 就可能把别人搞红。
//
// 故改为 worker 级 auto fixture：整个 worker 的用例全跑完才关，且只关一次。
// 需要用应用侧函数的 spec 从这里 import test。
import { test as base } from "@playwright/test";
import appPool from "@/lib/db";

export const test = base.extend<Record<string, never>, { appPoolTeardown: void }>({
  appPoolTeardown: [
    async ({}, use) => {
      await use();
      await appPool.end();
    },
    { scope: "worker", auto: true },
  ],
});

export { expect } from "@playwright/test";
