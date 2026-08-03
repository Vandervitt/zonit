// 落地页自检器文案（中文面）。结构与 en/tools.ts 严格对齐。
//
// ⚠️ 红线同英文面：不给评分、不说「会过审」。措辞停在「审核常盯这个 + 你这页
// 的实际情况」，不出现「合格 / 通过 / 达标」这类判定词。
//
// ⚠️ unknown 档尤其重要：静态检查看不到 JS 动态注入的像素，
// 「没找到」必须写成「初始 HTML 中未发现」，绝不能写成「你没装」。

export const tools = {
  check: {
    meta: {
      title: "落地页自检器——看看审核到底在看什么 | Zap Bridge",
      description:
        "贴一个落地页地址，看审核常盯的那些地方在你这页上是什么情况：政策链接、跳转链、联系方式，以及追踪是否可能在同意前触发。不打分、不判过审，只陈述事实。",
    },
    kicker: "免费工具",
    title: "审核在你的落地页上，实际看到的是什么？",
    subtitle:
      "贴一个地址。我们列出审核常检查的项目，以及你这页当前的实际情况。不打分、不下结论——那是平台的事，不是我们的。",
    urlLabel: "落地页地址",
    urlPlaceholder: "https://你的域名.com/你的落地页",
    submit: "检查这张页面",
    submitting: "检查中…",
    note: "像一次普通访问那样读取页面一次；遵守你的 robots.txt；结果缓存 15 分钟。",
    errors: {
      url_required: "先填一个地址。",
      invalid_url: "这不像一个我们能读取的公开 https 地址。",
      scheme_not_https: "只能检查 https 地址——而页面没上 https 本身就该先修。",
      ip_literal_host: "请填域名，不要填 IP 地址。",
      credentials_in_url: "请去掉地址里的用户名与密码。",
      port_not_allowed: "只支持标准的 https 端口。",
      rate_limited: "你刚跑过几次检查，稍后再试。",
      check_failed: "没能读完那张页面，可能是它太慢或屏蔽了我们。",
      generic: "出了点问题，稍后再试。",
    },
  },

  report: {
    metaTitle: "落地页检查 — {host} | Zap Bridge",
    kicker: "检查结果",
    title: "审核常看的那些地方",
    checkedUrl: "已检查",
    redirectedTo: "最终落到",
    createdAt: "运行于 {date}",
    shareNotice: "任何持有此链接的人都能查看这份报告。它不会被搜索引擎收录，30 天后自动删除。",
    // 报告页最重要的一句：不把「我们不下结论」说清楚，整份报告就会被读成评分。
    disclaimer:
      "这是一份观察清单，不是判定。我们不给页面打分，也无法告诉你广告会不会过审——只有审核它的平台能。下面每一条都是你自己也能核实的事实。",
    levels: {
      attention: "值得看看",
      unknown: "从外部判断不了",
      info: "供参考",
    },
    empty: "在我们能从页面外部做的检查里，没有发现值得特别指出的项。",
    rerun: "检查另一张页面",
    ctaTitle: "你要做的是页面本身，而不是体检？",
    ctaBody: "Zap Bridge 的模板自带合规页脚、真实的隐私政策，以及不依赖像素触发的留资链路。",
    ctaTemplates: "浏览模板",
    ctaAntiBan: "了解反同质化怎么做",
    readMore: "延伸阅读",
  },

  /**
   * 每条 finding 的文案。key 必须与 lib/tools/report.ts 产出的 id 完全一致，
   * 由 tools.test.ts 断言覆盖——漏一条就是页面上出现一个空白条目。
   */
  findings: {
    privacy_missing: {
      title: "没找到隐私政策链接",
      why: "只要页面收集个人信息，平台就要求有一个点得开的隐私政策；缺这一条是最廉价的一种拒审原因。",
      guide: "landing-page-privacy-policy-footer",
    },
    privacy_broken: {
      title: "隐私政策链接返回 {status}",
      why: "链接在但打不开，等同于没有。请从你自己浏览器缓存之外的环境验证一次。",
      guide: "landing-page-privacy-policy-footer",
    },
    privacy_ok: { title: "隐私政策链接存在且可访问", why: "" },
    terms_missing: {
      title: "没找到服务条款链接",
      why: "平台的目标网址要求期待服务条款是一个真实存在的页面。",
      guide: "landing-page-privacy-policy-footer",
    },
    terms_broken: {
      title: "服务条款链接返回 {status}",
      why: "一条打不开的条款链接，和没有一样过不了目标网址要求。",
      guide: "landing-page-privacy-policy-footer",
    },
    terms_ok: { title: "服务条款链接存在且可访问", why: "" },
    redirect_chain: {
      title: "经过 {hops} 跳才到达",
      why: "每一跳都是这条路径可能在某些市场断掉的地方。审核跟的是整条链，不只是终点页。",
      guide: "ad-account-ban-landing-page-audit",
    },
    final_status_error: {
      title: "页面返回 {status}",
      why: "打不开的落地页既无法被审核，也无法转化。",
      guide: "google-ads-landing-page-policy",
    },
    contact_missing: {
      title: "页面上没找到邮箱或电话",
      why: "「你是谁」的透明度会进入着陆页体验评分，而这是留资类页面上最常缺失的一项。",
      guide: "google-ads-landing-page-policy",
    },
    contact_ok: { title: "页面上有联系方式", why: "" },
    pixel_before_consent_suspected: {
      title: "发现追踪代码，且没有同意门控（{pixels}）",
      why: "在欧盟与英国，非必要追踪通常需要先取得同意才能触发。我们看到了追踪代码，却没看到任何同意工具在拦着它——这是基于 HTML 的**怀疑**，不是实测。",
      guide: "landing-page-privacy-policy-footer",
    },
    pixel_with_cmp: {
      title: "同时存在追踪（{pixels}）与同意工具（{cmp}）",
      why: "追踪到底有没有等到同意，光看 HTML 判断不了——它取决于运行时行为。登录后可以跑一次真实浏览器检查把它测出来。",
      guide: "landing-page-privacy-policy-footer",
    },
    // ⚠️ 这条的措辞是红线所在：不能写成「你没装像素」。
    pixel_not_found_in_html: {
      title: "初始 HTML 中没有追踪代码",
      why: "这不代表页面没有追踪。由 JavaScript 在加载后注入的像素，静态读取根本看不到——只有真实浏览器检查才能确认。",
      guide: "landing-page-duplicate-detection",
    },
    page_heavy: {
      title: "页面体积 {bytes} 字节",
      why: "体积进的是着陆页体验而不是政策：后果是排名更低、单次点击更贵，而且没有任何通知。",
      guide: "google-ads-landing-page-policy",
    },
    blocking_scripts: {
      title: "{count} 个阻塞渲染的脚本",
      why: "同步脚本会推迟移动端首屏——而审核和你的大部分流量，看到的都是移动端。",
      guide: "google-ads-landing-page-policy",
    },
    copyright_stale: {
      title: "版权年份写的是 {year}",
      why: "「没人维护这张页面」的小信号。改起来极便宜，而审核确实会注意到陈旧的页面。",
    },
    robots_disallows_check: {
      title: "你的 robots.txt 不允许我们读取这张页面",
      why: "我们选择停下而不是无视它。这件事本身也值得知道：如果 robots 屏蔽了主流爬虫，Google 就无法评估落地页，这本身就是一条拒登理由。",
      guide: "google-ads-landing-page-policy",
    },
    fetch_failed: {
      title: "没能读取这张页面",
      why: "所有检查都没能进行。具体原因见下。",
    },
  },

  /** fetch_failed 的具体原因。id 保持稳定，原因走 data.reason 在此取文案。 */
  fetchFailed: {
    private_address: "该域名解析到内网或私有地址，我们不会去抓取它。",
    dns_failed: "该域名没有解析结果。",
    scheme_not_https: "这个页面没有走 https。",
    too_many_redirects: "跳转次数过多——这条链一直没落到一个终点页。",
    bad_redirect: "某一次跳转格式有误或指向了空地址。",
    response_too_large: "页面超过了我们读取的体积上限。",
    unsupported_content_type: "这个地址返回的不是 HTML 页面。",
    fetch_failed: "服务器没有在超时前响应。",
    invalid_url: "这个地址无法解析。",
    ip_literal_host: "请填域名，不要填 IP 地址。",
    credentials_in_url: "地址里带了登录凭据。",
    port_not_allowed: "只支持标准的 https 端口。",
    exception: "读取页面时出了点问题。",
  },
};
