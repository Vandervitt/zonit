import type { HelpChapterData } from "../../types";

export const domainsPublishing: HelpChapterData = {
  slug: "domains-publishing",
  title: "Domains & publishing",
  summary: "Platform address vs your own domain, DNS setup, reading the status labels, verification troubleshooting, and the publish lifecycle.",
  sections: [
    {
      id: "why-own-domain",
      heading: "Two kinds of address: get it live first, brand it after",
      blocks: [
        {
          t: "p",
          text: "A page can publish to either of two addresses. No domain yet, or just want to see how it looks? Use the platform address — hit “Publish on a platform address” in the publish dialog and you get a dedicated address derived from the page name. No DNS to configure, live immediately, and it captures leads exactly the same.",
        },
        {
          t: "p",
          text: "But once you're running real ads and building a business, move to your own brand domain:",
        },
        {
          t: "list",
          items: [
            "Ad credibility: platforms trust an independent brand domain far more than shared hosting, which shows up in review approval and delivery.",
            "Brand equity: visitors see your domain, so repeat visits, word of mouth and trust accrue to your brand.",
            "SEO: organic traffic and search indexing build under your domain, and come with you if you switch tools.",
          ],
        },
        {
          t: "callout",
          tone: "info",
          text: "You can move a page from the platform address to your own domain at any time — just pick the domain in the publish dialog. Content and the leads you've already collected are unaffected, so don't hold up your first publish waiting for a domain.",
        },
        {
          t: "callout",
          tone: "info",
          text: "No domain yet? We strongly recommend buying on Vercel (vercel.com/domains): DNS is hosted there by default, so connecting it here just works with no records to configure by hand, and no exposure to mainland-China provider policy. Namecheap, Cloudflare, GoDaddy and others work too (typically around $10/year) but need the manual DNS setup below. Prefer .com, or whatever suffix is normal in your target market.",
        },
      ],
    },
    {
      id: "bind-dns",
      heading: "Connecting a domain and configuring DNS",
      blocks: [
        {
          t: "steps",
          items: [
            { title: "Add the domain", desc: "Go to Domains → enter your domain (example.com or www.example.com) and add it. Domains under mainland-China jurisdiction (.cn / .com.cn / .中国 and similar) aren't supported — their resolution depends on ICP filing and registry policy, so use an international domain such as .com or .net." },
            { title: "Add DNS records at your registrar", desc: "Sign in wherever you bought the domain (Namecheap / GoDaddy / Cloudflare …), open DNS management, and add the records in the table below. Domains bought on Vercel can skip this — resolution works automatically." },
            { title: "Wait for verification", desc: "The system checks every 5 seconds. Once it passes, the domain shows “Verified” and can be used for publishing." },
          ],
        },
        {
          t: "table",
          head: ["Domain type", "Record to add", "Host / name", "Value"],
          rows: [
            ["Apex domain (example.com)", "A record", "@", "76.76.21.21"],
            ["Subdomain (www.example.com etc.)", "CNAME record", "www (i.e. the subdomain part)", "cname.vercel-dns.com"],
          ],
        },
        {
          t: "callout",
          tone: "warning",
          text: "An apex domain can't use CNAME — it must be an A record. The table above applies equally to Cloudflare, Route 53, Namecheap and GoDaddy. On Cloudflare, set the proxy (orange cloud) to “DNS only” first, and turn it back on afterwards if you need it.",
        },
        {
          t: "callout",
          tone: "warning",
          text: "If we detect that DNS is hosted with a mainland-China provider (Alibaba Cloud, DNSPod …) when you add the domain, you'll see a warning: the domain still works, but mainland regulation means resolution could be suspended. For overseas campaigns, move DNS to Cloudflare or a similar provider.",
        },
      ],
    },
    {
      id: "dns-status",
      heading: "Reading the status labels",
      blocks: [
        {
          t: "p",
          text: "“Verified” only means the domain is yours — it doesn't mean DNS is pointing here. These are two different things: if verification passes but DNS points elsewhere (the domain used to host a blog or a parking page, say), publishing won't error, yet visitors still see the old content instead of your landing page. That's why the domain list shows a DNS status alongside “Verified”:",
        },
        {
          t: "table",
          head: ["Label", "Meaning", "What to do"],
          rows: [
            ["Verified + DNS configured (green)", "Ownership and resolution are both ready; visitors reach your landing page", "Nothing — publish away"],
            ["Verified + DNS not configured (orange)", "Ownership is verified, but the A/CNAME records don't point here, so visitors don't see your page", "Check and fix the records at your DNS provider using the table above, then hit the refresh button beside it to re-check"],
            ["Pending", "Ownership isn't verified yet", "Finish the DNS setup above and wait for automatic verification"],
          ],
        },
        {
          t: "callout",
          tone: "info",
          text: "The DNS check occasionally can't run for network reasons, in which case you'll see only “Verified” with no DNS label. Refresh the page later and it will check again.",
        },
      ],
    },
    {
      id: "verify-troubleshoot",
      heading: "When verification doesn't pass",
      blocks: [
        {
          t: "list",
          items: [
            "DNS takes time to propagate: usually minutes, occasionally 24–48 hours (depending on registrar and TTL). If the setup is right, wait — “Refresh verification status” in the list re-checks on demand.",
            "Check the record value for stray characters: it's exactly 76.76.21.21 or cname.vercel-dns.com — no http://, no trailing dot, no spaces.",
            "Check the host name: apex domains take @ (or blank, depending on registrar); subdomains take only the subdomain part (www), not the full domain.",
            "Make sure nothing conflicts: leftover A / CNAME / forwarding records on the same host name will override the new ones. Delete them.",
            "The HTTPS certificate is issued automatically after verification — there's no SSL for you to configure.",
          ],
        },
      ],
    },
    {
      id: "publish-lifecycle",
      heading: "Publishing and the states it moves through",
      blocks: [
        {
          t: "table",
          head: ["Action", "Where", "Effect"],
          rows: [
            ["Publish", "Editor top bar → Publish → pick a verified domain and a path", "The current draft snapshot goes live at that domain and path (blank path = the domain root) and is publicly reachable"],
            ["Keep editing", "Landing page list / editor", "Changes only touch the draft; what's live stays on the last published version. The top bar and list flag “unpublished changes”"],
            ["Update", "Editor top bar (what the button says on a published page)", "Re-snapshots the current draft live, switching the public page to the new version and clearing the “unpublished changes” flag"],
            ["Unpublish", "Landing page list (with confirmation)", "Takes it offline publicly; the domain binding is kept and you can republish any time"],
            ["Delete", "Landing page list (with confirmation)", "Deletes page and draft permanently and irrecoverably; a published page also goes offline"],
          ],
        },
        {
          t: "callout",
          tone: "info",
          text: "The live version is the snapshot from the moment you last hit Publish or Update. That means you can keep editing and experimenting on a published page — visitors keep seeing the old version until you deliberately hit Update.",
        },
      ],
    },
    {
      id: "multi-path-publishing",
      heading: "One brand domain, several service pages",
      blocks: [
        {
          t: "p",
          text: "You can host several pages under one domain, split by path. A clinic might put its overview on brand.com, aligners on brand.com/invisalign and whitening on brand.com/whitening. Law firms, tutoring and home improvement work the same way — one domain a customer recognises, with a page per service under it, closes better than bouncing people between unfamiliar domains.",
        },
        {
          t: "p",
          text: "Enter the path next to the domain when publishing. The rules:",
        },
        {
          t: "table",
          head: ["Item", "Rule"],
          rows: [
            ["Allowed characters", "Lowercase letters, digits, hyphens (uppercase is lowercased automatically)"],
            ["Depth", "Up to two levels, e.g. /invisalign or /clinic/invisalign"],
            ["Length", "64 characters maximum for the whole path"],
            ["Blank", "Publishes at the domain root (brand.com itself)"],
          ],
        },
        {
          t: "callout",
          tone: "warning",
          text: "Publish a page at the domain root separately, or visiting brand.com directly returns a 404. If you've only published brand.com/invisalign, a customer typing the domain from your business card or packaging lands on nothing — the easiest trap to fall into here. The domain list flags domains whose root isn't published.",
        },
        {
          t: "list",
          items: [
            "Publishing again to the same domain and path replaces what's there: the previous page goes offline and old links to that address break immediately. The publish dialog lists every occupied path under the domain and which page holds it, and asks you to confirm before taking an occupied slot.",
            "A page occupies one slot at a time: republishing it to a different domain or path moves it, rather than putting it in both places. To run the same content at several addresses, duplicate the page and publish each copy.",
            "How many you can publish is set by your plan's publishing allowance, not by how many domains you've connected — the whole allowance can sit on different paths of a single domain.",
          ],
        },
        {
          t: "p",
          text: "These paths are reserved by the platform and will be blocked at publish time:",
        },
        {
          t: "list",
          items: [
            "Prefixes: /api, /_next, /.well-known and anything beneath them",
            "Exact matches: /robots.txt, /sitemap.xml, /llms.txt, /favicon.ico",
          ],
        },
        {
          t: "callout",
          tone: "info",
          text: "Paid campaigns are a different story: ad platforms (Meta, TikTok and the like) score domain reputation and issue bans at the domain level, so stacking several offers on one domain means any one of them getting flagged or badly reviewed drags the rest down. For paid traffic, still run one offer per domain and switch domains when you switch products. Splitting by path suits brand organic traffic and service businesses.",
        },
      ],
    },
    {
      id: "pre-publish-check",
      heading: "What the pre-publish check looks at",
      blocks: [
        {
          t: "p",
          text: "Hitting Publish runs an automatic check. Blocking issues stop the publish, and the top bar lists what didn't pass:",
        },
        {
          t: "list",
          items: [
            "The hero's primary CTA can't be empty — a page with no way to convert isn't worth running traffic to.",
            "The whole page is scanned for template placeholder numbers (wa.me/1555…): a leftover placeholder anywhere (primary CTA, floating button, inside a section) blocks publishing and must be replaced with a real number.",
            "Structural completeness: the required fixed parts and fields are all present.",
          ],
        },
        {
          t: "callout",
          tone: "success",
          text: "The validation bar updates as you edit; open it to see everything outstanding, and most items jump straight to the section concerned when clicked. Fix them and hit Publish again. The check exists so that every page you put live can actually receive leads.",
        },
      ],
    },
  ],
};
