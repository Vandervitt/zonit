// landing-editor/samples/packagingCustomDraft.ts
//
// 定制包装 / 印刷「打样询价」营销落地页样例（海外 leadgen，非交易）。
// 主转化走页内留资表单（hero CTA 指向 #lead-form）——包装询价需要尺寸、材质、
// 印刷工艺与数量，表单能一次收齐；WhatsApp 作次通道供快速追问。
// 页面不出现单价、阶梯报价表、在线下单：一律以"打样 / 报价"作为留资话术。
//
// 占位资源说明：
// - 图片均为 Unsplash 在线地址（https），上线前可按需替换。
// - WhatsApp 号码 15553219876 为占位号码，上线前替换为真实业务号码。
import type { LandingPageDraft } from "@/types/schema.draft";

const img = (id: string, w = 1200) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=80`;

/** 页内留资表单锚点：主转化落点。 */


export const packagingCustomDraft: LandingPageDraft = {
  contact: {
    primary: "form",
    whatsapp: "+15553219876",
    email: "studio@kraftline-packaging.example",
  },
  hero: {
    backgroundImage: {
      src: img("photo-1607166452427-7e4477079cb9", 1600),
      alt: "Custom printed cartons and boxes arranged on a table",
    },
    badge: { emoji: "📦", text: "Custom packaging & print" },
    title: "Packaging that survives the trip and sells on the shelf",
    subtitle:
      "Send your dimensions, material, and artwork. You get a structural mock-up, a printed sample, and a written spec — before you commit to a run.",
    cta: { text: "Request a sample & quote", target: { kind: "primary" } },
    secondaryCta: { text: "See material options", target: { kind: "url", url: "https://example.com/kraftline-materials" } },
    endorsementText: "Trusted by 900+ DTC and retail brands",
    showcase: {
      type: "image",
      src: img("photo-1553413077-190dd305871c"),
      alt: "Printed packaging being inspected on a production line",
    },
  },

  sections: [
    {
      type: "stats",
      data: {
        title: "The numbers brands ask about",
        subtitle: "From the last twelve months of production.",
        items: [
          { icon: "🎨", value: "900+", label: "Brands packaged" },
          { icon: "✂️", value: "7 days", label: "Typical sample turnaround" },
          { icon: "♻️", value: "80%", label: "Runs on recyclable stock" },
          { icon: "✅", value: "99.4%", label: "Print-accuracy pass rate" },
        ],
      },
    },

    {
      type: "features",
      data: {
        title: "What you get before you commit",
        subtitle: "Sampling is where packaging problems get caught.",
        items: [
          {
            icon: "📐",
            title: "Structural mock-up first",
            description:
              "A dieline and physical mock-up sized to your product, so fit issues surface before printing.",
          },
          {
            icon: "🖨️",
            title: "Printed sample, not a render",
            description:
              "You approve an actual printed piece — colour, finish, and texture as they'll arrive.",
          },
          {
            icon: "🚚",
            title: "Transit-tested constructions",
            description:
              "Drop and compression testing on request, so your packaging survives the courier network.",
          },
          {
            icon: "♻️",
            title: "Recyclable stock as default",
            description:
              "Recyclable and FSC-certified materials offered first, with alternatives if your product needs them.",
          },
        ],
      },
    },

    {
      type: "products",
      data: {
        title: "What we produce",
        subtitle: "Point us at the format closest to what you need.",
        items: [
          {
            name: "Folding cartons",
            description: "Retail-ready cartons with foil, emboss, and spot-finish options.",
            backgroundImage: { src: img("photo-1595246140625-573b715d11dc", 800), alt: "Folding cartons in a stack" },
          },
          {
            name: "Corrugated shippers",
            description: "E-commerce mailers and shippers built for courier handling.",
            backgroundImage: { src: img("photo-1587293852726-70cdb56c2866", 800), alt: "Corrugated shipping boxes" },
          },
          {
            name: "Labels & flexible film",
            description: "Roll labels, pouches, and sleeves for food, beauty, and supplements.",
            backgroundImage: { src: img("photo-1601598851547-4302969d0614", 800), alt: "Label rolls ready for dispatch" },
          },
        ],
      },
    },

    {
      type: "process",
      data: {
        title: "How sampling works",
        subtitle: "Three steps, roughly one to two weeks end to end.",
        steps: [
          {
            title: "Send specs and artwork",
            description: "Dimensions, material preference, quantity range, and your artwork or a rough sketch.",
            image: { src: img("photo-1611532736579-6b16e2b50449", 800), alt: "Designer reviewing packaging artwork" },
          },
          {
            title: "Mock-up and quote",
            description: "You receive a dieline, a structural mock-up, and a written quote for your quantity range.",
          },
          {
            title: "Printed sample & sign-off",
            description: "Approve an actual printed piece before any production run is scheduled.",
          },
        ],
      },
    },

    {
      type: "trust",
      data: {
        backgroundImage: {
          src: img("photo-1566576912321-d58ddd7a6088", 1400),
          alt: "Printing press running a colour job",
        },
        badges: [
          { icon: "🌲", title: "FSC-certified stock", subtitle: "Chain-of-custody documentation on request" },
          { icon: "🎯", title: "Colour-managed printing", subtitle: "Pantone matching with a printed proof" },
          { icon: "🧪", title: "Food-safe options", subtitle: "Migration-compliant inks and liners available" },
          { icon: "📦", title: "Transit testing", subtitle: "Drop and compression reports on request" },
        ],
      },
    },

    {
      type: "reviews",
      data: {
        title: "What brands say",
        description: "Feedback from packaging and operations leads.",
        items: [
          {
            name: "Nora B.",
            location: "Sweden",
            channel: "Email",
            avatar: { src: img("photo-1573497019940-1c28c88b4f3e", 200), alt: "Nora B." },
            content: {
              text: "The mock-up showed our bottle didn't fit the insert. Catching that before a 20,000-unit run was worth everything.",
            },
          },
          {
            name: "Tunde A.",
            location: "Nigeria",
            channel: "WhatsApp",
            avatar: { src: img("photo-1519085360753-af0119f7cbe7", 200), alt: "Tunde A." },
            content: {
              text: "Colour matched the printed proof exactly. First supplier where what arrived looked like what we approved.",
            },
          },
          {
            name: "Camille R.",
            location: "France",
            channel: "Email",
            avatar: { src: img("photo-1580489944761-15a19d654956", 200), alt: "Camille R." },
            content: {
              text: "They pushed us toward a lighter recyclable stock that cut our shipping weight. Nobody else suggested it.",
            },
          },
        ],
      },
    },

    {
      type: "guarantee",
      data: {
        title: "How we protect your run",
        description: "Standards applied to every project, whatever the quantity.",
        items: [
          { icon: "🖨️", title: "Nothing prints unapproved", subtitle: "Production starts only after you sign off a physical sample." },
          { icon: "🔐", title: "Artwork stays confidential", subtitle: "Your files are never reused or shown as our own work." },
          { icon: "📄", title: "Written specification", subtitle: "Material, finish, and tolerances documented before the run." },
          { icon: "🔁", title: "We reprint our errors", subtitle: "If the run doesn't match the approved sample, we redo it." },
        ],
      },
    },

    {
      type: "faq",
      data: {
        title: { icon: "❓", text: "Common questions" },
        items: [
          {
            question: "What if I don't have finished artwork yet?",
            answer:
              "Send a sketch, a reference photo, or even just dimensions. Our structural team can produce a dieline you can hand to your designer.",
          },
          {
            question: "How long does a printed sample take?",
            answer:
              "Usually about a week once specs and artwork are settled. Complex finishes can take longer, and we'll say so up front.",
          },
          {
            question: "What is your minimum quantity?",
            answer:
              "It varies by format and print method. Tell us your target quantity and we'll be straight about whether it's viable or whether a different construction suits better.",
          },
          {
            question: "Can you match our existing packaging?",
            answer:
              "Yes. Send a physical sample and we'll match the construction, stock, and colour as closely as the process allows.",
          },
        ],
      },
    },
  ],

  leadForm: {
    enabled: true,
    title: "Request a sample & quote",
    description:
      "Tell us what you're packaging. You'll get a dieline, a mock-up, and a written quote for your quantity range.",
    submitText: "Send my specs",
    successMessage: "Thanks — our structural team will come back to you within one business day.",
    fields: {
      name: { enabled: true, required: true, label: "Your name" },
      email: { enabled: true, required: true, label: "Work email" },
      phone: { enabled: false, required: false },
      whatsapp: { enabled: true, required: false, label: "WhatsApp (optional)" },
      telegram: { enabled: false, required: false },
      message: {
        enabled: true,
        required: true,
        label: "Product dimensions, material preference, and quantity range",
      },
    },
  },

  footer: {
    brandName: "Kraftline Packaging",
    copyrightYear: "2026",
    privacyPolicy:
      "We collect only the specifications and artwork you share in order to prepare your mock-up and quote. Artwork is treated as confidential, is never reused or published as our own work, and can be deleted on request.",
    termsOfService:
      "Quotes, lead times, and material availability on this page are indicative and are confirmed in writing after sampling. Production proceeds only against a physical sample you have approved.",
  },

  floatingButton: {
    text: "💬 Ask about materials",
    target: { kind: "channel", channel: "whatsapp", prefill: "Hi Kraftline, I'd like a packaging quote" },
  },
};
