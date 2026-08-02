import type { GuideArticle } from "../../types";

export const homeGoodsLeadGeneration: GuideArticle = {
  slug: "home-goods-lead-generation",
  title: "Home and living lead generation: sell the room, then answer the question",
  description:
    "Home products are bought on how the room ends up, not on the product. This covers why in-situ imagery outperforms catalogue shots, what the free plan should collect, and how seasonality is handled without rebuilding the page.",
  keywords: [
    "home goods lead generation",
    "home decor landing page",
    "furniture enquiries",
    "interior product marketing",
  ],
  industry: "home",
  datePublished: "2026-08-02",
  intro:
    "A home purchase is imagined before it is decided: the visitor is picturing a space, and the page converts when it shows that result convincingly and then makes it easy to ask the one question standing between them and it. This covers what imagery does that work, and why the follow-up conversation is where this category actually converts.",
  sections: [
    {
      id: "imagery",
      heading: "Rooms, not products on white",
      blocks: [
        {
          t: "p",
          text: "The visitor is buying a result, so photography that shows scale and context does work that a catalogue shot cannot. This is one of the few categories where before-and-after pairs carry genuine weight, because the change is visible, honest, and reproducible.",
        },
        {
          t: "list",
          items: [
            "Keep the 'before' genuinely ordinary — a staged mess reads as false and undoes the 'after'",
            "Show the product in a room the size your customers actually live in, not a showroom",
            "Include something for scale that everyone recognises, so dimensions become intuitive",
            "Selling into other markets? Room sizes and storage conventions differ — photos travel better than measurements",
          ],
        },
      ],
    },
    {
      id: "the-plan",
      heading: "The free plan exists to get a photo",
      blocks: [
        {
          t: "p",
          text: "A storage plan, a room consultation, a yard layout — whatever you call it, its real function is to get an image of the actual space. That is the only way to recommend with confidence, and it is the fastest route from one item to a multi-item basket.",
        },
        {
          t: "steps",
          items: [
            {
              title: "Ask for the space, not the product",
              desc: "'Send a photo of the corner you want to fix' outperforms any product-selection question.",
            },
            {
              title: "Collect the two constraints that change the answer",
              desc: "Usually dimensions and budget. For garden, add climate and how much time they actually want to spend.",
            },
            {
              title: "Reply with one arrangement, not a catalogue",
              desc: "A visitor who receives a list is back where they started; one who receives a plan has been given a decision.",
            },
          ],
        },
        {
          t: "callout",
          tone: "info",
          text: "A visitor who has shown you their closet, kitchen, or yard has also stopped comparing you with three other tabs. The photo is worth more than the form fields it replaced.",
        },
      ],
    },
    {
      id: "seasonality",
      heading: "Rotate the offer, do not rebuild the page",
      blocks: [
        {
          t: "p",
          text: "Garden, outdoor, and bedding all swing hard by season. The mistake is rebuilding the page each cycle, which throws away whatever ranking the previous version accumulated.",
        },
        {
          t: "list",
          items: [
            "Keep the hook constant and change only what it is about — planting in spring, maintenance in summer, protection in autumn",
            "Confine seasonal content to one block so updating takes minutes rather than an afternoon",
            "If you sell into both hemispheres, run the calendar per market — the peaks are opposite",
            "Compatibility facts — voltage, hob type, dishwasher safety — stay on the page year-round and stop the most common return",
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
              q: "Chat or form for home goods?",
              a: "Chat, for most of it. The questions this category turns on — will it fit, will it match, will it hold up — are specific enough that a form is the wrong instrument, and visitors send photos of the actual room unprompted. Keep the form for trade or bulk enquiries where you need quantities recorded before replying.",
            },
            {
              q: "Can these pages take orders?",
              a: "No — there is no cart or checkout. They capture the enquiry and hand it over; the purchase happens on your own store or through your sales process afterwards.",
            },
            {
              q: "How do we serve trade and hospitality buyers?",
              a: "Different proof entirely: volume pricing structure, lead times, durability specifications, and existing accounts. Start from the B2B structure if the enquiry needs a full specification before you can respond.",
            },
            {
              q: "Are pet products a home category or a health one?",
              a: "Home for the products, but route anything resembling a health question to a vet in the reply. General care guidance is fine; diagnosis or treatment language pulls the page toward restricted health territory.",
            },
          ],
        },
      ],
    },
  ],
  references: [
    {
      label: "Google Ads — Misrepresentation policy",
      url: "https://support.google.com/adspolicy/answer/6020955",
    },
  ],
};
