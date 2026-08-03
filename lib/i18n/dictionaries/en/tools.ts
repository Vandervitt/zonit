// 落地页自检器文案（英文面）。
//
// ⚠️ 红线（设计文档第二节）：不给评分、不说「会过审」。
// 每条 finding 的措辞必须停在「审核常盯这个 + 你这页的实际情况」，
// 不得出现 pass / fail / 合格 / 通过 之类的判定词。
//
// ⚠️ unknown 档的措辞尤其重要：静态检查看不到 JS 动态注入的像素（11.8），
// 「没找到」必须写成「初始 HTML 中未发现」，绝不能写成「你没装」。

export const tools = {
  check: {
    meta: {
      title: "Landing page checker — what ad reviewers look at | Zap Bridge",
      description:
        "Paste a landing page URL and see what ad reviewers commonly check: policy links, redirect chain, contact details, and whether tracking fires before consent. No score, no pass/fail — just what's on your page.",
    },
    kicker: "Free tool",
    title: "What do ad reviewers actually see on your landing page?",
    subtitle:
      "Paste a URL. We report the things reviewers commonly check and what your page currently does about them. No score, no verdict — those are the platform's to give, not ours.",
    urlLabel: "Landing page URL",
    urlPlaceholder: "https://your-domain.com/your-landing-page",
    submit: "Check this page",
    submitting: "Checking…",
    note: "Reads the page once, like a visitor would. Respects your robots.txt. Results are cached for 15 minutes.",
    errors: {
      url_required: "Enter a URL first.",
      invalid_url: "That doesn't look like a public https URL we can read.",
      scheme_not_https: "Only https URLs can be checked — and a page that isn't on https is itself worth fixing.",
      ip_literal_host: "Enter a domain name rather than an IP address.",
      credentials_in_url: "Remove the username and password from the URL.",
      port_not_allowed: "Only the standard https port is supported.",
      rate_limited: "You've run a few checks recently. Try again a bit later.",
      check_failed: "We couldn't finish reading that page. It may be slow or blocking us.",
      generic: "Something went wrong. Try again in a moment.",
    },
  },

  report: {
    metaTitle: "Landing page check — {host} | Zap Bridge",
    kicker: "Check result",
    title: "What reviewers commonly look at",
    checkedUrl: "Checked",
    redirectedTo: "Resolved to",
    createdAt: "Run on {date}",
    shareNotice:
      "Anyone with this link can view this report. It is not indexed by search engines and is deleted after 30 days.",
    // 报告页最重要的一句：把「我们不下结论」说清楚，否则整份报告会被读成评分。
    disclaimer:
      "This is a list of observations, not a verdict. We don't score pages and we can't tell you whether an ad will be approved — only the platform reviewing it can. Everything below is a fact about your page that you can verify yourself.",
    levels: {
      attention: "Worth a look",
      unknown: "Can't tell from here",
      info: "For reference",
    },
    empty: "Nothing stood out on the checks we can run from outside the page.",
    rerun: "Check another page",
    ctaTitle: "Building the page rather than auditing one?",
    ctaBody:
      "Zap Bridge templates ship with a compliant footer, a real privacy policy, and lead capture that doesn't depend on a pixel firing.",
    ctaTemplates: "Browse templates",
    ctaAntiBan: "See how anti-duplication works",
    /** 深入阅读：finding 指向对应的合规文章。 */
    readMore: "Read more",
    verify: {
      heading: "Want certainty instead of a suspicion?",
      bodyAnon:
        "The tracking finding above is inferred from the HTML. A real browser check opens your page and measures what actually goes out before consent. Sign in to run one.",
      bodyUser:
        "Run a real browser check: we open your page in a real browser and record what actually goes out before any consent interaction.",
      cta: "Run a real browser check",
      running: "Opening your page in a real browser…",
      signIn: "Sign in to verify",
      done: "Measured — see the updated report.",
      errors: {
        rate_limited: "You've run a few verifications recently. Try again later.",
        budget_exhausted: "Verification is temporarily unavailable. The static findings above still stand.",
        verify_failed: "The browser check couldn't complete. The static findings above still stand.",
        url_not_allowed: "That page can no longer be reached safely.",
        generic: "Something went wrong.",
      },
    },
  },

  /**
   * 每条 finding 的文案。key 必须与 lib/tools/report.ts 产出的 id 完全一致，
   * 由 tools.test.ts 断言覆盖——漏一条就是页面上出现一个空白条目。
   *
   * why 回答「审核为什么在意这个」；guide 是对应的合规文章 slug（可选）。
   */
  findings: {
    privacy_missing: {
      title: "No privacy policy link found",
      why: "Platforms require a reachable privacy policy on pages that collect any personal data, and a missing one is among the cheapest reasons to get disapproved.",
      guide: "landing-page-privacy-policy-footer",
    },
    privacy_broken: {
      title: "Privacy policy link returns {status}",
      why: "A link that exists but doesn't load is treated the same as a missing one. Check it from outside your own browser cache.",
      guide: "landing-page-privacy-policy-footer",
    },
    privacy_ok: { title: "Privacy policy link found and reachable", why: "" },
    terms_missing: {
      title: "No terms of service link found",
      why: "Platform destination requirements expect terms to exist as a real page.",
      guide: "landing-page-privacy-policy-footer",
    },
    terms_broken: {
      title: "Terms link returns {status}",
      why: "A dead terms link fails the destination requirement just as a missing one does.",
      guide: "landing-page-privacy-policy-footer",
    },
    terms_ok: { title: "Terms link found and reachable", why: "" },
    redirect_chain: {
      title: "Reached through {hops} hops",
      why: "Every hop is a place the journey can break in some markets. Reviewers follow the whole chain, not just the final page.",
      guide: "ad-account-ban-landing-page-audit",
    },
    final_status_error: {
      title: "The page returned {status}",
      why: "A destination that errors cannot be reviewed, and cannot convert.",
      guide: "google-ads-landing-page-policy",
    },
    contact_missing: {
      title: "No email or phone found on the page",
      why: "Transparency about who you are feeds landing page experience, and it is the most commonly missing item on lead-gen pages.",
      guide: "google-ads-landing-page-policy",
    },
    contact_ok: { title: "Contact details present on the page", why: "" },
    pixel_before_consent_suspected: {
      title: "Tracking code found with no consent gate ({pixels})",
      why: "In the EU and UK, non-essential tracking generally needs consent before it fires. We found tracking code and no sign of a consent tool holding it back — this is a suspicion from the HTML, not a measurement.",
      guide: "landing-page-privacy-policy-footer",
    },
    pixel_with_cmp: {
      title: "Tracking ({pixels}) and a consent tool ({cmp}) both present",
      why: "Whether the tracking actually waits for consent can't be determined from the HTML alone — it depends on runtime behaviour. Sign in to run a real browser check that measures it.",
      guide: "landing-page-privacy-policy-footer",
    },
    // ⚠️ 这条的措辞是红线所在：不能写成「你没装像素」。
    pixel_not_found_in_html: {
      title: "No tracking code in the initial HTML",
      why: "This does not mean the page has no tracking. Pixels injected by JavaScript after load are invisible to a static read — a real browser check is the only way to know.",
      guide: "landing-page-duplicate-detection",
    },
    pixel_before_consent_verified: {
      title: "Measured: tracking fired before consent ({pixels})",
      why: "A real browser opened your page and these requests went out before anything was accepted. In the EU and UK that is both a compliance problem and an attribution problem — events collected this way may not be lawfully collected there.",
      guide: "landing-page-privacy-policy-footer",
    },
    pixel_no_fire_before_consent_verified: {
      title: "Measured: no tracking fired before consent",
      why: "A real browser opened your page and no known tracking request went out before any consent interaction.",
    },
    page_heavy: {
      title: "Page weighs {bytes} bytes",
      why: "Weight feeds landing page experience rather than policy: the effect is lower rank and higher cost per click, with no notification.",
      guide: "google-ads-landing-page-policy",
    },
    blocking_scripts: {
      title: "{count} render-blocking scripts",
      why: "Synchronous scripts delay first paint on mobile, which is where reviewers and most of your traffic see the page.",
      guide: "google-ads-landing-page-policy",
    },
    copyright_stale: {
      title: "Copyright says {year}",
      why: "A small signal that nobody maintains the page. Cheap to fix, and reviewers do notice stale pages.",
    },
    robots_disallows_check: {
      title: "Your robots.txt asks us not to read this page",
      why: "We stopped rather than ignore it. Worth knowing for its own sake: if robots blocks the major crawlers, Google cannot evaluate the destination, which is a disapproval in itself.",
      guide: "google-ads-landing-page-policy",
    },
    fetch_failed: {
      title: "Couldn't read the page",
      why: "No checks could run. Details below.",
    },
  },

  /** fetch_failed 的具体原因。id 保持稳定，原因走 data.reason 在此取文案。 */
  fetchFailed: {
    private_address: "The domain resolves to a private or internal address, so we won't fetch it.",
    dns_failed: "The domain didn't resolve.",
    scheme_not_https: "The page isn't served over https.",
    too_many_redirects: "Too many redirects — the chain never settled on a final page.",
    bad_redirect: "A redirect was malformed or pointed nowhere.",
    response_too_large: "The page is larger than we read.",
    unsupported_content_type: "That URL doesn't return an HTML page.",
    fetch_failed: "The server didn't respond in time.",
    invalid_url: "That URL couldn't be parsed.",
    ip_literal_host: "Enter a domain name rather than an IP address.",
    credentials_in_url: "The URL contains credentials.",
    port_not_allowed: "Only the standard https port is supported.",
    exception: "Something went wrong while reading the page.",
  },
};
