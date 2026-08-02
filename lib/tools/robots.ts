// lib/tools/robots.ts
//
// robots.txt 解析与判定。
//
// 立场：我们一边在报告里标记「该页屏蔽了爬虫」，一边自己就必须遵守 robots，
// 否则这条检查项站不住。命中 Disallow 时不抓取，并把「robots 不允许抓取」
// 本身作为一条发现项呈现——限制因此转化成了内容（设计文档第十二节决议 1）。
//
// 按 RFC 9309 的核心部分实现：
//   · 分组选择：取最具体的匹配 User-agent（精确匹配优先于 `*`）
//   · 规则匹配：最长匹配胜出；长度相同时 Allow 胜出
//   · 路径支持 `*` 通配与 `$` 结束锚点
// 未实现 Crawl-delay 等非标准指令（解析时直接忽略）。

interface Rule {
  allow: boolean;
  pattern: string;
}

interface Group {
  agents: string[];
  rules: Rule[];
}

function parseGroups(txt: string): Group[] {
  const groups: Group[] = [];
  let current: Group | null = null;
  let expectingAgents = false;

  for (const rawLine of txt.split(/\r?\n/)) {
    const line = rawLine.replace(/#.*$/, "").trim();
    if (!line) continue;
    const idx = line.indexOf(":");
    if (idx === -1) continue;
    const field = line.slice(0, idx).trim().toLowerCase();
    const value = line.slice(idx + 1).trim();

    if (field === "user-agent") {
      // 连续的 User-agent 行属于同一分组；遇到规则行后再出现 UA 则开新组。
      if (!current || !expectingAgents) {
        current = { agents: [], rules: [] };
        groups.push(current);
      }
      current.agents.push(value.toLowerCase());
      expectingAgents = true;
      continue;
    }
    if (field !== "allow" && field !== "disallow") continue; // 忽略 Sitemap / Crawl-delay 等
    if (!current) continue;
    expectingAgents = false;
    // `Disallow:` 空值表示不限制，按 RFC 应被忽略而不是当作拦截一切。
    if (value === "") continue;
    current.rules.push({ allow: field === "allow", pattern: value });
  }
  return groups;
}

/** 选出适用的分组：精确匹配优先，其次 `*`，都没有则返回 null。 */
function selectGroup(groups: Group[], userAgent: string): Group | null {
  const ua = userAgent.toLowerCase();
  const exact = groups.filter((g) => g.agents.some((a) => a !== "*" && ua.includes(a)));
  if (exact.length) {
    // 多个精确匹配时合并规则，行为等价于取并集
    return { agents: [ua], rules: exact.flatMap((g) => g.rules) };
  }
  const wildcard = groups.filter((g) => g.agents.includes("*"));
  if (wildcard.length) {
    return { agents: ["*"], rules: wildcard.flatMap((g) => g.rules) };
  }
  return null;
}

/** 把 robots 路径模式编译成正则：`*` → `.*`，结尾 `$` 为锚点。 */
function patternToRegExp(pattern: string): RegExp {
  const anchored = pattern.endsWith("$");
  const body = anchored ? pattern.slice(0, -1) : pattern;
  const escaped = body.replace(/[.+?^${}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*");
  return new RegExp("^" + escaped + (anchored ? "$" : ""));
}

/** 规则的匹配长度（用于最长匹配比较）；不匹配返回 -1。 */
function matchLength(rule: Rule, path: string): number {
  return patternToRegExp(rule.pattern).test(path) ? rule.pattern.length : -1;
}

/**
 * 该 UA 是否被允许抓取该路径。
 * robots.txt 拉取失败或为空时一律返回 true——「拿不到 robots」不等于「被禁止」，
 * 是否因此中止由调用方决定。
 */
export function isAllowed(robotsTxt: string, path: string, userAgent: string): boolean {
  if (!robotsTxt.trim()) return true;
  const group = selectGroup(parseGroups(robotsTxt), userAgent);
  if (!group || !group.rules.length) return true;

  let best: { allow: boolean; len: number } | null = null;
  for (const rule of group.rules) {
    const len = matchLength(rule, path);
    if (len < 0) continue;
    if (!best || len > best.len || (len === best.len && rule.allow)) {
      best = { allow: rule.allow, len };
    }
  }
  return best ? best.allow : true;
}
