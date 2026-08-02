// landing-editor/samples/windowsDoorsDraft.ts
//
// 门窗更换「免费上门测量 + 书面报价」营销落地页样例（家装 leadgen，非交易）。
// 主转化走页内留资表单（contact.primary = "form"），电话作为次通道——门窗更换
// 是大额、必须上门勘测的决策，表单能先收集房屋信息，让那次上门真的能报出价。
//
// 合规要点（risk=medium）：
// - 节能与省钱表述必须给区间并写明假设条件，不给单一保证数字（与 solarHomeDraft 同一约束）；
// - 不出现分期、首付、月供等金融促销语义（费用与方案一律留到勘测后说明）；
// - 质保条款明写「不覆盖什么」，避免被读成无限责任承诺。
//
// 占位资源说明：
// - 图片均为 Unsplash 在线地址（https），封面与首屏图已逐张下载核验主体正确后写入。
// - 电话 +15551234567 为占位号码，上线前替换为真实业务号码。
import type { LandingPageDraft } from "@/types/schema.draft";

/** Unsplash 图片地址助手：统一裁剪与画质参数。 */
const img = (id: string, w = 1200) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=80`;

export const windowsDoorsDraft: LandingPageDraft = {
  contact: {
    primary: "form",
    phone: "+15551234567",
    email: "surveys@northgate-windows.example",
  },
  hero: {
    backgroundImage: {
      src: img("photo-1751486403820-7cf45ebec080", 1600),
      alt: "Replacement window being fitted into a house opening",
    },
    badge: { emoji: "🪟", text: "Certified installers · 10-year workmanship cover" },
    title: "Draughty windows? Get a fixed quote after one visit",
    subtitle:
      "Book a free survey. We measure every opening, tell you what actually needs replacing, and issue a written quote that does not change on installation day.",
    cta: { text: "Book a free survey", target: { kind: "primary" } },
    secondaryCta: { text: "See how the survey works", target: { kind: "primary" } },
    endorsementText: "Fitting windows and doors since 2011 · Fully insured, directly employed teams",
    showcase: {
      type: "image",
      src: img("photo-1783587616528-a37972228563"),
      alt: "Installer tools resting on a window sill mid-replacement",
    },
  },

  sections: [
    // 1. 数据展示：可核实的经营事实，不含收益承诺
    {
      type: "stats",
      data: {
        title: "What we can put a number on",
        subtitle: "Operational figures. Savings depend on your property — those are quoted after the survey.",
        items: [
          { icon: "🏠", value: "4,200+", label: "Homes fitted since 2011" },
          { icon: "📏", value: "100%", label: "Quotes issued after an on-site survey" },
          { icon: "🛡️", value: "10 yr", label: "Workmanship cover on every install" },
          { icon: "📅", value: "3–5 wk", label: "Typical lead time from order to fitting" },
        ],
      },
    },

    // 2. 特性：把「换窗」拆成业主真正在权衡的四件事
    {
      type: "features",
      data: {
        title: "What you are actually deciding",
        subtitle: "Four things separate a good window job from a cheap one.",
        items: [
          {
            icon: "🌡️",
            title: "Where the heat is really going",
            description:
              "Often the frame and the seal, not the glass. The survey tells you which — replacing the wrong part is the most common waste in this trade.",
          },
          {
            icon: "🔇",
            title: "Noise, if you are on a busy road",
            description:
              "Acoustic glazing is a different specification from thermal. Ask for it explicitly, or you get the standard unit and the same noise.",
          },
          {
            icon: "🔐",
            title: "The lock and hinge specification",
            description:
              "The part that decides security, and the part quotes quietly differ on. We state the hardware standard on the quote rather than in a brochure.",
          },
          {
            icon: "🧹",
            title: "What happens to the mess",
            description:
              "Old frames, plaster making-good, and disposal are included in our quote. If another quote is cheaper, check whether they are.",
          },
        ],
      },
    },

    // 3. 流程：把「让陌生人进家」拆成低风险的几步
    {
      type: "process",
      data: {
        title: "How the survey works",
        subtitle: "A measurement visit, not a sales visit wearing a tape measure.",
        steps: [
          {
            title: "Tell us about the property",
            description:
              "Property type, how many openings, and what is bothering you — draughts, noise, condensation, or security.",
          },
          {
            title: "We survey, on a slot you choose",
            description:
              "About 45 minutes. We measure every opening and check frames, sills, and reveals rather than only the glass.",
            image: { src: img("photo-1505798577917-a65157d3320a"), alt: "Installer working with a saw in a room" },
          },
          {
            title: "You get a written, itemised quote",
            description:
              "Priced per opening, with the glazing and hardware specification stated. It does not change on fitting day.",
            image: { src: img("photo-1603796846097-bee99e4a601f"), alt: "Written quote being signed at a table" },
          },
          {
            title: "Decide in your own time",
            description:
              "The quote holds for 60 days. We do not run same-day discounts — a price that expires tonight was never the real price.",
            image: { src: img("photo-1635859890085-ec8cb5466806"), alt: "Homeowner reviewing quote paperwork at a table" },
          },
        ],
      },
    },

    // 4. 前后对比：门窗是「变化可见」的少数家装品类之一
    {
      type: "beforeAfter",
      data: {
        title: "Recent jobs, before and after",
        subtitle: "Same house, same angle, photographed on completion day.",
        disclaimer:
          "Individual results depend on the property. Photographs are of our own completed work, published with the homeowner's permission.",
        items: [
          {
            crmName: "1930s semi · 8 openings",
            duration: "Fitted in 3 days",
            caseDescription:
              "Original timber frames retained where sound; only four openings needed full replacement. Draught complaints resolved on the road-facing elevation.",
            beforeImage: { src: img("photo-1647592097679-b8f57f875e2f"), alt: "Weathered timber windows before replacement" },
            afterImage: { src: img("photo-1674916374579-7f51014a7658"), alt: "Replacement windows fitted along the same elevation" },
          },
          {
            crmName: "Terrace · front elevation",
            duration: "Fitted in 2 days",
            caseDescription:
              "Conservation area — frame profile matched to the original on the council's requirement, with modern sealed units behind it.",
            beforeImage: { src: img("photo-1760371910912-6966b90c1ff4"), alt: "Front elevation before window replacement" },
            afterImage: { src: img("photo-1448630360428-65456885c650"), alt: "Front elevation after window replacement" },
          },
        ],
      },
    },

    // 5. 信任：资质与保险，业主不会开口问但会默默核对
    {
      type: "trust",
      data: {
        backgroundImage: { src: img("photo-1694521787799-ad4ad241cb39", 1600), alt: "Installer team working at a window opening" },
        badges: [
          { icon: "🧾", title: "Public liability insured", subtitle: "Certificate available on request before we attend." },
          { icon: "👷", title: "Directly employed fitters", subtitle: "The team that surveys is the team that installs." },
          { icon: "📜", title: "Building regulations compliant", subtitle: "Certificates issued on completion for every replacement." },
          { icon: "🛠️", title: "10-year workmanship cover", subtitle: "Covers installation and seals — see what it excludes below." },
        ],
      },
    },

    // 6. 评价：具体到「他们劝我少换两扇」，而不是泛泛好评
    {
      type: "reviews",
      data: {
        title: "What homeowners said afterwards",
        subtitle: "Verified customers, published with permission.",
        items: [
          {
            name: "Rachel M.",
            location: "Victorian terrace · 6 windows",
            avatar: { src: img("photo-1494790108377-be9c29b29330", 200), alt: "Customer portrait" },
            content: {
              text: "They told us two of the frames were fine and did not need doing. That is the reason we booked them rather than the cheaper quote.",
            },
          },
          {
            name: "Daniel O.",
            location: "New-build · patio doors",
            avatar: { src: img("photo-1500648767791-00dcc994a43e", 200), alt: "Customer portrait" },
            content: {
              text: "Quote on the Tuesday, no pressure call afterwards, and the price on the invoice matched the quote exactly.",
            },
          },
          {
            name: "Priya S.",
            location: "1930s semi · full house",
            avatar: { src: img("photo-1624486217002-846e654ac969", 200), alt: "Customer portrait" },
            content: {
              text: "The noise difference on the road side is the thing I did not expect. Worth asking about the acoustic option.",
            },
          },
        ],
      },
    },

    // 7. 保障：明写不覆盖什么，避免被读成无限责任
    {
      type: "guarantee",
      data: {
        title: "What the cover actually covers",
        subtitle: "Stated plainly, including the exclusions.",
        items: [
          { icon: "🛡️", title: "10 years on workmanship", subtitle: "Installation, sealing, and fit. Registered on completion." },
          { icon: "🪟", title: "Manufacturer cover on units", subtitle: "Glazing units carry their own warranty — we hand the paperwork over." },
          {
            icon: "🚫",
            title: "Not covered",
            subtitle: "Accidental breakage, storm damage, and issues arising from existing structural defects flagged at survey.",
          },
        ],
      },
    },

    // 8. FAQ：业主真正会问的四个问题
    {
      type: "faq",
      data: {
        title: { icon: "❓", text: "Before you book" },
        items: [
          {
            question: "Will the quote change on installation day?",
            answer:
              "No. That is the point of surveying every opening rather than estimating from photos. If we find something structural once the old frame is out, we stop and talk to you before doing anything chargeable.",
          },
          {
            question: "How much will I save on heating?",
            answer:
              "It depends on your property, your current glazing, and how you heat it, so any single figure on a website is guesswork. The survey gives you a range with the assumptions stated — a number you can actually check.",
          },
          {
            question: "Do I need building regulations approval?",
            answer:
              "Replacement windows are usually covered by installer self-certification, which we issue on completion. Conservation areas and listed buildings work differently, and we tell you at the survey rather than afterwards.",
          },
          {
            question: "Can you do just a few windows?",
            answer:
              "Yes. We would rather replace the four that are failing than sell you a full house you did not need — and we will say so at the survey if that is what we find.",
          },
        ],
      },
    },
  ],

  leadForm: {
    enabled: true,
    title: "Book your free survey",
    description:
      "Tell us about the property and we will confirm a slot within one working day. No obligation, and no quote is issued without seeing the openings.",
    submitText: "Request my survey",
    successMessage: "Thanks — we will call to confirm a survey slot within one working day.",
    fields: {
      name: { enabled: true, required: true, label: "Your name" },
      phone: { enabled: true, required: true, label: "Best number to reach you" },
      email: { enabled: true, required: false, label: "Email (for the written quote)" },
      whatsapp: { enabled: false, required: false },
      telegram: { enabled: false, required: false },
      message: {
        enabled: true,
        required: true,
        label: "Postcode, whether you own the property, and roughly how many openings",
      },
    },
  },

  footer: {
    brandName: "Northgate Windows & Doors",
    copyrightYear: "2026",
    privacyPolicy:
      "We collect only the details you provide in order to arrange the survey and issue a quote. Your information is never sold or shared with third-party marketing lists, and can be deleted on request at any time.",
    termsOfService:
      "Figures shown are operational facts about our business, not a prediction of your energy savings. Any savings range is illustrative, stated with its assumptions, and confirmed only in a written quote following an on-site survey. Workmanship cover applies to installation and sealing and excludes accidental breakage, storm damage, and pre-existing structural defects identified at survey. Quotes are valid for 60 days from the survey date.",
  },
};
