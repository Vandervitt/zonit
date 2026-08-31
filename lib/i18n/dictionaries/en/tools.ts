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
      title: "Landing page checker — what ad reviewers look at | Urgizat",
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
    metaTitle: "Landing page check — {host} | Urgizat",
    kicker: "Check result",
    title: "What reviewers commonly look at",
    checkedUrl: "Checked",
    redirectedTo: "Resolved to",
    createdAt: "Run on {date}",
    shareNotice:
      "Anyone with this link can view this report. It is not indexed by search engines. Results expire after 30 days — the link keeps working and offers a fresh check instead.",
    /**
     * 过期态。链接是发到站外去的，收件人什么时候回头点它不由我们决定——
     * 所以过期不能是 404，得是一次重新检查的入口。
     */
    expired: {
      kicker: "Expired",
      title: "These results have expired",
      body: "We keep results for 30 days. The page has probably changed since then, so showing you the old findings would be misleading. A fresh check takes a few seconds.",
      checkedUrl: "Originally checked",
      ranOn: "Run on {date}",
      rerun: "Check this page again",
      rerunOther: "Check a different page",
    },
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
      "Urgizat templates ship with a compliant footer, a real privacy policy, and lead capture that doesn't depend on a pixel firing.",
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

  /** 多页横向对比报告。 */
  compare: {
    metaTitle: "Landing page comparison — {count} pages | Urgizat",
    kicker: "Comparison",
    title: "The same checks across {count} pages",
    createdAt: "Run on {date}",
    shareNotice:
      "Anyone with this link can view this comparison. It is not indexed by search engines. Results expire after 30 days — the link keeps working and offers a fresh comparison instead.",
    /** 过期态。语义同单页报告，但要把「当初比的是哪几个页面」列全。 */
    expired: {
      kicker: "Expired",
      title: "This comparison has expired",
      body: "We keep results for 30 days. These pages have probably changed since then, and a comparison built from stale data would read as a difference between the pages rather than a difference in time.",
      checkedUrls: "Originally compared",
      ranOn: "Run on {date}",
      rerun: "Run this comparison again",
    },
    // 与单页报告同源的免责声明：多页更容易被读成排名，所以说得更直白。
    disclaimer:
      "This is a list of observations, not a ranking. We don't score pages and we don't tell you which one is worst — the count at the top of each column is just how many pages have something worth looking at there.",
    attentionCount: "{n} of {total}",
    unknownCount: "{n} unclear",
    noAttention: "None",
    blockedRow: "Not checked — see the report",
    openReport: "Full report",
    empty: "This comparison has expired.",
    rerun: "Run another comparison",
    dimensions: {
      privacy: "Privacy policy",
      terms: "Terms",
      consent: "Tracking vs consent",
      contact: "Contact details",
      form_fields: "Form length",
      conversion_position: "Contact position",
      trust: "Trust elements",
      viewport: "Mobile viewport",
      hops: "Redirects",
      weight: "Page weight",
      scripts: "Blocking scripts",
      copyright: "Footer year",
    },
    ctaTitle: "Running pages for more than one client?",
    ctaBody:
      "Urgizat gives every client their own page and their own domain, with a compliant footer and lead capture that doesn't depend on a pixel firing.",
    ctaTemplates: "Browse templates",
    ctaAntiBan: "See how anti-duplication works",
  },

  /** 多页对比的提交表单。 */
  batchForm: {
    heading: "Compare several pages at once",
    body: "Checking pages for more than one client? Paste up to {max} URLs, one per line, and get them side by side.",
    label: "Landing page URLs, one per line",
    placeholder: "https://client-one.com/offer\nhttps://client-two.com/quote",
    submit: "Compare pages",
    submitting: "Checking {n} pages…",
    note: "Each URL counts towards the same hourly limit as a single check.",
    errors: {
      too_few_urls: "Enter at least two URLs to compare.",
      too_many_urls: "You can compare up to {max} pages at a time.",
      duplicate_url: "The same URL appears twice.",
      invalid_url: "One of those isn't a URL we can check.",
      rate_limited: "You've run a few checks recently. Try again later.",
      check_failed: "One of those pages couldn't be reached.",
      generic: "Something went wrong.",
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
      title: "No form, email or phone found on the page",
      why: "Transparency about who you are feeds landing page experience, and it is the most commonly missing item on lead-gen pages.",
      guide: "google-ads-landing-page-policy",
    },
    contact_ok: { title: "Contact details present on the page", why: "" },
    form_fields_many: {
      title: "The form asks for {fields} fields",
      why: "Every extra field is another reason to leave. Above {threshold}, it is worth checking which fields you actually need before the first reply.",
      guide: "google-ads-landing-page-policy",
    },
    conversion_reachable_early: {
      title: "A way to get in touch appears early in the page",
      why: "",
    },
    conversion_late_only: {
      title: "The only way to get in touch appears late in the page",
      why: "Visitors arriving from an ad decide fast. This is read from document order, not from where things land on screen — on a long page it can read stricter than reality.",
      guide: "google-ads-landing-page-policy",
    },
    trust_signals_present: {
      title: "Trust elements found ({kinds})",
      why: "",
    },
    // ⚠️ 同 pixel_not_found_in_html 的红线：静态读不到 ≠ 页面上没有。
    trust_signals_not_found: {
      title: "No trust elements found in the initial HTML",
      why: "This does not mean the page has none. Testimonials and case studies rendered by JavaScript after load are invisible to a static read.",
      guide: "google-ads-landing-page-policy",
    },
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
    viewport_missing: {
      title: "No mobile viewport declared",
      why: "Without a viewport tag phones render the page at desktop width and scale it down, so body text needs pinch-zoom to read. TikTok asks for pages that are readable on mobile without zooming, and Google folds mobile usability into landing page experience.",
      guide: "google-ads-landing-page-policy",
    },
    viewport_zoom_blocked: {
      title: "Zooming is disabled on mobile",
      why: "The viewport tag blocks pinch-zoom (user-scalable=no or maximum-scale=1). If any text is small, visitors have no way to enlarge it — an accessibility problem as much as a review one.",
      guide: "google-ads-landing-page-policy",
    },
    viewport_ok: { title: "Mobile viewport declared, zooming allowed", why: "" },
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
