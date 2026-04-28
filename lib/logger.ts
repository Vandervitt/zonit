import debug from "debug";

// 初始化 debug 命名空间
const log = debug("zonit:request");

// 内部日志打印逻辑
const internalLog = (msg: string, data?: any) => {
  log(msg, data);
  // 如果是开发环境且没有开启 DEBUG，则强制使用 console.log 打印一行简要信息
  if (process.env.NODE_ENV === "development" && !process.env.DEBUG) {
    console.log(`\x1b[34m[LOGGER]\x1b[0m ${msg}`);
  }
};

export type LogRating = "good" | "needs-improvement" | "poor";
// ... (保持后续 WebVitalLog 接口不变)

export interface WebVitalLog {
  name: string;
  value: number; // 持续时间 (ms)
  rating: LogRating;
  delta: number;
  id: string;
  attribution: {
    url: string;
    method: string;
    params?: any;
    result?: any;
    status?: number;
    error?: string;
    [key: string]: any;
  };
}

const generateId = () => Math.random().toString(36).substring(2, 15);

const getRating = (duration: number): LogRating => {
  if (duration < 200) return "good";
  if (duration < 500) return "needs-improvement";
  return "poor";
};

/**
 * 封装异步请求的日志记录器
 * 符合 Web Vitals 标准，并为 Sentry 留下扩展空间
 */
export async function withLogger<T>(
  name: string,
  url: string,
  method: string,
  params: any,
  fn: () => Promise<T>
): Promise<T> {
  const id = generateId();
  const startTime = performance.now();
  
  // 打印请求开始 (可选)
  internalLog(`[${id}] START ${method} ${url}`, params);

  try {
    const result = await fn();
    const duration = performance.now() - startTime;
    
    const logData: WebVitalLog = {
      name,
      value: duration,
      rating: getRating(duration),
      delta: duration,
      id,
      attribution: {
        url,
        method,
        params: process.env.NODE_ENV === 'production' ? undefined : params, // 生产环境隐藏敏感参数
        result: process.env.NODE_ENV === 'production' ? undefined : result,
        status: (result as any)?.status || 200,
      },
    };

    internalLog(`[${id}] SUCCESS ${duration.toFixed(2)}ms`, logData);

    // TODO: 后期在此处接入 Sentry
    // Sentry.addBreadcrumb({ category: 'api', message: name, data: logData });

    return result;
  } catch (error: any) {
    const duration = performance.now() - startTime;
    
    const logData: WebVitalLog = {
      name,
      value: duration,
      rating: "poor",
      delta: duration,
      id,
      attribution: {
        url,
        method,
        params,
        error: error.message || String(error),
        status: error.status || 500,
      },
    };

    internalLog(`[${id}] FAILED ${duration.toFixed(2)}ms`, logData);

    // TODO: 后期在此处接入 Sentry
    // Sentry.captureException(error, { extra: logData });

    throw error;
  }
}
