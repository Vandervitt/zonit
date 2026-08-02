import type { GuideArticle } from "../../types";

export const landingPagePrivacyPolicyFooter: GuideArticle = {
  slug: "landing-page-privacy-policy-footer",
  title: "The compliant footer: privacy policy, terms, and what actually has to be on the page",
  description:
    "A missing privacy link is one of the cheapest reasons to get an ad disapproved. This covers what the footer needs, what a lead-gen privacy policy must actually say, and where consent is required.",
  keywords: [
    "landing page privacy policy",
    "GDPR landing page",
    "compliant footer",
    "lead form consent",
  ],
  ctaTarget: "anti-ban",
  datePublished: "2026-08-02",
  intro:
    "The footer is the least interesting part of a landing page and one of the most common reasons a perfectly good one gets disapproved. It is also where data protection obligations land: the moment a page has a lead form, it is collecting personal data, and that brings requirements that exist independently of any ad platform. This covers what has to be there and what it has to say.",
  sections: [
    {
      id: "what-must-exist",
      heading: "What has to be on the page",
      blocks: [
        {
          t: "p",
          text: "Ad platforms and data protection law want overlapping but not identical things. The union of the two is short.",
        },
        {
          t: "table",
          head: ["Element", "Why", "Common failure"],
          rows: [
            ["Privacy policy", "Required by platforms and by law once you collect data", "Link exists but 404s, or opens a modal with placeholder text"],
            ["Terms of service", "Platform requirement; sets expectations", "Copied from an ecommerce template and mentions orders you do not take"],
            ["Who you are", "Transparency; feeds landing page experience", "No legal entity, no address, no way to reach a human"],
            ["Contact route", "Required for transparency and for data requests", "Only a form — no email for someone exercising a data right"],
            ["Consent, where required", "Law, not platform policy", "Pre-ticked box, or bundled consent for unrelated purposes"],
          ],
        },
        {
          t: "callout",
          tone: "warning",
          text: "A privacy link that returns 404 is the single cheapest disapproval to earn and to fix. Check it from the target market, not from your own browser where it may be cached.",
        },
      ],
    },
    {
      id: "what-the-policy-says",
      heading: "What a lead-gen privacy policy actually has to say",
      blocks: [
        {
          t: "p",
          text: "Most privacy policies on landing pages are copied from an ecommerce template and describe processing that never happens. That is worse than useless: it is inaccurate, which is itself the problem the requirement exists to prevent.",
        },
        {
          t: "steps",
          items: [
            {
              title: "What you collect, in plain terms",
              desc: "Name, contact details, whatever the form asks for — plus anything collected automatically such as analytics identifiers and pixel data.",
            },
            {
              title: "Why, and on what basis",
              desc: "To respond to the enquiry is the obvious purpose. If you also intend to market to them later, say so — that is a separate purpose and often a separate legal basis.",
            },
            {
              title: "Who else sees it",
              desc: "Your CRM, your email provider, your ad platforms if you send conversion data back. Naming categories of recipients is normally sufficient.",
            },
            {
              title: "How long you keep it, and how to get it deleted",
              desc: "A retention period you actually apply, and a working route to exercise access and deletion rights.",
            },
            {
              title: "Where it goes",
              desc: "If your tools process data in another country, that transfer needs mentioning — this is where cross-border lead gen picks up an obligation many advertisers miss.",
            },
          ],
        },
      ],
    },
    {
      id: "consent",
      heading: "Where consent is actually required",
      blocks: [
        {
          t: "p",
          text: "Consent is over-applied in some places and missing in others. The distinction that matters is between the data someone hands you deliberately and the tracking that happens to them.",
        },
        {
          t: "list",
          items: [
            "Submitting a form is not itself consent to marketing — if you plan to send campaigns later, ask separately and unbundled",
            "Non-essential cookies and tracking pixels generally require prior consent in the EU and UK, which means before the pixel fires, not after",
            "A pre-ticked box is not consent anywhere that requires consent",
            "Consent must be as easy to withdraw as to give, and you have to honour it in the tools that actually hold the data",
          ],
        },
        {
          t: "p",
          text: "The practical consequence for advertisers: a consent banner that loads the pixel before the visitor answers is both a compliance problem and an attribution problem, because the events it fires may not be lawfully collected in those markets.",
        },
      ],
    },
    {
      id: "non-transactional",
      heading: "If your page is lead-gen, do not use an ecommerce footer",
      blocks: [
        {
          t: "p",
          text: "This sounds pedantic and it is a genuine source of disapprovals. A footer copied from a store template promises refunds, shipping, and order handling that your page has no mechanism for — which is a mismatch between what the page says and what it does.",
        },
        {
          t: "list",
          items: [
            "Remove refund, shipping, returns, and order-cancellation language if the page takes no orders",
            "Terms should describe an enquiry relationship: what happens when someone submits, what you will do, what you are not promising",
            "For regulated professions, add the disclosures your regulator requires — and state plainly that submitting the form creates no client relationship",
            "Keep the copyright line accurate; a stale year is a small signal that nobody maintains the page",
          ],
        },
      ],
    },
    {
      id: "faq",
      heading: "Common questions",
      blocks: [
        {
          t: "faq",
          items: [
            {
              q: "Do I need a privacy policy if the page only links to WhatsApp?",
              a: "If the page carries analytics or an ad pixel, it is processing personal data regardless of where the conversion happens, so yes. The chat itself is then governed by the messaging platform's terms and by whatever you do with the conversation afterwards.",
            },
            {
              q: "Can I use a generated privacy policy?",
              a: "As a starting point, provided you then edit it to describe what you actually do. A generated policy describing processing you do not perform is inaccurate, and accuracy is the entire point — for anything regulated or high-risk, have it reviewed properly.",
            },
            {
              q: "Does GDPR apply if I am not in Europe?",
              a: "It can. It follows the people, not the company — offering services to or monitoring people in the EU or UK can bring you in scope regardless of where you are based. Several other markets have their own regimes with their own triggers.",
            },
            {
              q: "Where should the links go — footer or near the form?",
              a: "Both. The footer satisfies the platform requirement; a short line beside the submit button telling the visitor what happens to their details is what actually raises form completion. Those two jobs are different and both worth doing.",
            },
          ],
        },
      ],
    },
  ],
  references: [
    {
      label: "Google Ads — Destination requirements",
      url: "https://support.google.com/adspolicy/answer/6368661",
    },
    {
      label: "European Commission — Data protection under GDPR",
      url: "https://commission.europa.eu/law/law-topic/data-protection_en",
    },
    {
      label: "ICO — Guide to the UK GDPR: Lawful basis",
      url: "https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/lawful-basis/",
    },
  ],
};
