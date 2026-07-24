import { Pool } from "pg";

const url = process.env.DATABASE_URL ?? "";
const isLocal = url.includes("localhost") || url.includes("127.0.0.1");

const pool = new Pool({
  connectionString: url,
  ssl: isLocal ? false : { rejectUnauthorized: false },
  // Serverless 环境下空闲连接常被 Postgres/Neon 端单方面掐断，
  // 主动比服务端先回收，避免复用到已失效的连接。
  idleTimeoutMillis: 10_000,
});

// pg 要求必须监听 Pool 的 error 事件：空闲 client 在后台被断开时，
// 错误会 emit 在 pool 上而非某次 query 的调用栈里。没有监听器时会变成
// unhandled error 冒泡到 Sentry（表现为 "Connection terminated unexpectedly"）。
// 这类空闲连接错误不影响正在处理的请求，降级为 warn 即可。
pool.on("error", (err) => {
  console.warn("[db] idle pool client error:", err.message);
});

export default pool;
