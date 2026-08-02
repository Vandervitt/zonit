// 行业中间层文案（英文面）。
//
// 每个行业必须写各自独有的内容——这一层存在的意义就是「不同行业说不同的话」。
// 若退化成一套句式换几个名词，行业页会和模板详情页一样陷入 near-duplicate，
// 反而稀释收录。byCategory 的键集合由 industry-content.test.ts 与注册表对齐守护。
//
// 红线：本项目生成的落地页非交易。行业文案一律用咨询 / 询盘 / 预约 / 留资措辞，
// 不得出现下单、结账、购物车、订单、订阅等交易语义（对电商类行业尤其容易写飘）。
//
// 英文面受众是全球中小企业。行业页是分众入口，跨境场景可以并且应该写清楚——
// 只是不能写进受众定义位（"templates for X going global" 会筛掉本土客户）。
// 完整口径见 lib/i18n/dictionaries/en/home.ts 顶部注释。跨境场景写在 crossBorder 字段，
// 只给跨境真实成立的行业（纯本地行业留空即不渲染）。

export interface IndustryFaq {
  q: string;
  a: string;
}

export interface IndustryCopy {
  /** `{count}` 为该行业模板数。 */
  metaTitle: string;
  metaDescription: string;
  h1: string;
  lead: string;
  /** 正文段落，2 段。 */
  intro: string[];
  whoFor: string;
  /** 该行业的线索通常怎么进来。 */
  leadsArrive: string;
  /**
   * 跨境场景段。只给跨境真实成立的行业写——注意方向有两种：
   * 卖家跨境出去（实体商品、B2B 采购），以及客户跨境进来（留学、医疗旅游、移民）。
   * 纯本地行业（local-service / home-improvement）不写，留空即不渲染。
   * 这里是「场景描述位」，与受众定义位的区别见 en/home.ts 顶部注释。
   */
  crossBorder?: string;
  faqs: IndustryFaq[];
}

export const templateIndustry = {
  /** 各行业页共用的框架文案。 */
  shared: {
    breadcrumbRoot: "Templates",
    kicker: "Industry",
    countLabel: { one: "{count} template", other: "{count} templates" },
    templatesHeading: "Templates in this industry",
    whoForHeading: "Who it's for",
    leadsHeading: "How inquiries come in",
    crossBorderHeading: "Selling across borders",
    faqHeading: "Common questions",
    otherIndustriesHeading: "Other industries",
    cta: "Start free · 7 days of Pro on sign-up",
    allTemplates: "Browse all templates",
  },

  byCategory: {
    beauty: {
      metaTitle: "Beauty & personal care landing page templates ({count}) | Zap Bridge",
      metaDescription:
        "{count} lead-gen landing page templates for skincare, makeup, beauty device, hair care, and fragrance brands. Turn ad traffic into consultations and inquiries, publish to your own domain, and keep every lead in one inbox.",
      h1: "Beauty & personal care landing page templates",
      lead: "{count} lead-capture templates for skincare, makeup, beauty devices, hair care, and fragrance — built to turn ad traffic into a conversation rather than an anonymous click.",
      intro: [
        "Beauty visitors almost never decide on the first visit. They arrive with a specific concern — breakouts, thinning hair, sensitivity, a shade they can never match — and the only question that matters on the page is whether you understand that concern well enough to be worth replying to. Every template here leads with the concern rather than the product, then layers the mechanism or ingredient explainer, genuine before-and-after evidence, and customer voices behind it.",
        "The hook that actually converts in this category is an assessment, not a discount: a free skin analysis, a shade or routine consult, a hair-loss check. That gives the visitor a reason to hand over a contact and gives you something to open the conversation with. The pages stay non-transactional by design — their job ends at a reachable lead, which you then qualify on your own channel or hand to your store.",
      ],
      whoFor:
        "DTC beauty and personal care brands, clinics and salons that consult before recommending, distributors looking for stockists, and agencies running beauty accounts.",
      leadsArrive:
        "Chat dominates this category — a visitor who wants a routine recommendation would rather send a photo than fill a form, so most of these templates are set up for WhatsApp out of the box. Forms work better when you need structured input first (skin type, concern, budget), and you can switch any template between form, WhatsApp, phone, email, or Telegram in one click after picking it.",
      crossBorder:
        "Beauty is one of the categories where selling into another market is the normal case rather than the exception, and it changes what the page has to do. Your buyer is in a different time zone, has no local number to call, and often defaults to WhatsApp rather than email — so the reply channel matters more than the checkout ever would. Shade, skin type, and climate all shift by market too, which is exactly why an assessment offer travels better across borders than a discount does.",
      faqs: [
        {
          q: "Can visitors buy a product from these pages?",
          a: "No. These are lead-capture pages, not storefronts — there is no cart, checkout, or order flow anywhere in the templates. The page's job is to get you a contact you can actually reach; the sale happens afterwards on your own channel, store, or in the consult itself.",
        },
        {
          q: "What belongs in the evidence section of a beauty page?",
          a: "Three things carry the most weight: an explainer for why the product works (ingredient or mechanism), before-and-after or in-use imagery, and unedited customer voices. Keep the claims to what you can substantiate — ad platforms scrutinise beauty and personal care creative closely, and unsupported outcome claims are one of the more common rejection reasons.",
        },
        {
          q: "Should a beauty device use the same template as a cream?",
          a: "Usually not. A device is a considered purchase where visitors compare against alternatives, so a comparison-style page that puts your option next to the usual routine works better. A cream or serum converts more on the consult path — lead with the concern and offer an assessment. Both page structures are in this industry; the tag on each card tells you which.",
        },
      ],
    },

    medical: {
      metaTitle: "Medical & clinic landing page templates ({count}) | Zap Bridge",
      metaDescription:
        "{count} patient-inquiry landing page templates for dental, hair restoration, aesthetic medicine, fertility, and vision correction clinics. Book consultations, capture inquiries by form or phone, and publish to your own clinic domain.",
      h1: "Medical & clinic landing page templates",
      lead: "{count} consultation-booking templates for dental, hair restoration, aesthetic medicine, fertility, and vision correction clinics.",
      intro: [
        "A patient choosing a clinic is deciding who to trust with their body, and no amount of design substitutes for the things that make a clinic credible: named practitioners with real credentials, the actual procedure explained in plain language, what recovery looks like, and honest outcomes. These templates put those blocks in the order patients look for them, and reserve the strongest position on the page for booking a consultation.",
        "Consultation-first is also the safer structure commercially. Almost nothing in this category can be quoted responsibly before an assessment, so a page that pushes for a booking rather than a number avoids over-promising and hands your front desk a qualified conversation instead of a price shopper.",
      ],
      whoFor:
        "Independent clinics and practices, multi-location groups running a page per procedure, medical tourism coordinators, and agencies handling clinic accounts.",
      leadsArrive:
        "Phone and form dominate — patients booking a procedure want either an immediate call or a considered form they can complete privately, so these templates ship with a prominent call button and a form that collects the case detail your front desk needs. WhatsApp is worth switching on for markets where it is the default channel, and for coordinating with patients travelling from abroad.",
      crossBorder:
        "Medical travel is a real segment for several of these procedures, and it changes the page's job. A patient flying in needs to know what the trip involves — how many days, how many visits, what happens if a revision is needed once they are home — and none of that fits in a treatment description. Clinics serving international patients also tend to need a chat channel rather than a phone number, because a call across time zones is the one thing an anxious patient will not initiate.",
      faqs: [
        {
          q: "Should the page show prices?",
          a: "Generally not a fixed one. Most procedures depend on an assessment, and a hard number on the page either scares off good patients or commits you to something you can't honour. These templates are built to lead with the consultation and treat the quote as the outcome of it — you can still state a starting range if that is normal in your market.",
        },
        {
          q: "What do ad platforms restrict for medical pages?",
          a: "Health and medical advertising is one of the more heavily policed categories: guaranteed outcomes, dramatic before-and-after comparisons, and anything implying diagnosis tend to attract rejections, and some procedures are restricted outright in certain markets. The templates ship with a compliant footer and consultation framing, but the medical claims themselves and your local regulatory obligations remain yours to get right.",
        },
        {
          q: "Do I need a separate page for each procedure?",
          a: "It usually converts better. A visitor searching for one procedure should land on a page about that procedure, not a general clinic page — and on the paid plans several pages can live at different paths under one clinic domain, so you can run implants, whitening, and orthodontics as separate pages without buying separate domains.",
        },
      ],
    },

    "local-service": {
      metaTitle: "Local services landing page templates ({count}) | Zap Bridge",
      metaDescription:
        "{count} quote-request landing page templates for cleaning, moving, HVAC, roofing, and landscaping businesses. Capture jobs by phone or form, show your service area, and publish to your own domain.",
      h1: "Local services landing page templates",
      lead: "{count} quote-request templates for cleaning, moving, HVAC, roofing, and landscaping businesses — built around the two things local buyers check first.",
      intro: [
        "Local service buyers are the least patient audience on this list. Something is broken, leaking, or has to move on a date that is already fixed, and they are checking two things before anything else: do you cover my area, and can I reach a human now. These templates put the service area and the call button in the first screen, then use the rest of the page to answer the objections that lose jobs — licensing, insurance, what the visit actually costs, and how fast you can be there.",
        "The second half of the page does the trust work that a local buyer does anyway, just slower: real jobs with photos, reviews that name the neighbourhood, and a plain description of what happens after they get in touch. A page that ends with an ambiguous next step loses to the competitor whose number was easier to find.",
      ],
      whoFor:
        "Independent contractors and small crews, multi-trade home service companies, franchise locations that need their own page, and agencies running local lead gen.",
      leadsArrive:
        "Phone comes first and it is not close — an urgent job converts on a tap-to-call, so these templates keep the number visible as the page scrolls. The form earns its place for non-urgent work like quotes and scheduled jobs, where the visitor would rather describe the job than explain it on a call, and it captures the address and job detail you need to quote properly.",
      faqs: [
        {
          q: "How do I make the service area obvious?",
          a: "State it in the first screen, in the words locals use — neighbourhoods, suburbs, or counties rather than a radius in kilometres. It is the single fastest way to stop paying for clicks from outside your area, and the templates reserve a slot for it right under the headline.",
        },
        {
          q: "Can I run a separate page for each service or town?",
          a: "Yes, and it is the normal pattern here. One page per service-and-area combination matches what people actually search for and lets you compare cost per lead between them. The paid plans let several pages live at different paths under a single domain, so a page per town doesn't mean a domain per town.",
        },
        {
          q: "What kills conversion on a local service page?",
          a: "A phone number that only appears in the footer, no service area, and no evidence the business is real. Photos of actual completed jobs outperform stock imagery by a wide margin in this category, and licence or insurance details resolve the objection most local buyers won't voice.",
        },
      ],
    },

    b2b: {
      metaTitle: "B2B & wholesale landing page templates ({count}) | Zap Bridge",
      metaDescription:
        "{count} inquiry and RFQ landing page templates for OEM manufacturing, industrial equipment, custom packaging, freight forwarding, and SaaS demos. Capture qualified business inquiries and publish to your own domain.",
      h1: "B2B & wholesale landing page templates",
      lead: "{count} inquiry and demo-request templates for OEM manufacturing, industrial equipment, custom packaging, freight forwarding, and SaaS.",
      intro: [
        "A B2B inquiry is worth many times a consumer lead, and the visitor knows it — they are evaluating whether you are a credible supplier before they will spend a reply. That makes capability the whole game: what you actually make or move, at what volumes, to what certifications, with what lead times, and who already relies on you. These templates front-load exactly those blocks instead of the brand story.",
        "The other half of a B2B page is qualification. A generic contact form produces inquiries you can't price and can't rank, so these templates ask for the fields that make a request actionable — volume, specification, timeline, destination — and accept a slightly lower submission rate in exchange for inquiries your sales team can quote from. Nothing on the page transacts; the RFQ opens the conversation and pricing stays where it belongs, in your quote.",
      ],
      whoFor:
        "Manufacturers and OEM suppliers, industrial equipment vendors, packaging and logistics providers, wholesale distributors seeking stockists, and B2B SaaS teams booking demos.",
      leadsArrive:
        "Forms carry this category, because a serious buyer expects to state a specification and would rather write it once than repeat it on a call. Email matters as a fallback for buyers who want an attachment or a paper trail, and WhatsApp is common in sourcing and freight, where quotes get negotiated in chat. Pro and Agency plans can POST each inquiry straight into your CRM so it lands in the pipeline instead of an inbox.",
      crossBorder:
        "B2B is cross-border by default: a sourcing, packaging, or freight enquiry usually starts in one country and ends in another. That is why destination belongs in the RFQ alongside specification and volume — it determines certification, documentation, duties, and lead time, and a quote without it is a guess. Time zones also make the channel decision for you: a form that captures everything at once beats a chat that needs three rounds spread over three days.",
      faqs: [
        {
          q: "Should the page state MOQ and pricing?",
          a: "State the MOQ, not the price. Publishing a minimum order quantity filters out inquiries you would decline anyway and costs you nothing; publishing prices commits you before you know the specification, volume, and destination. Let the RFQ collect those and quote afterwards.",
        },
        {
          q: "How much should the inquiry form ask for?",
          a: "Enough that a salesperson can act without a follow-up round-trip — typically volume, specification or category, timeline, and destination. Every extra field costs some submissions, but in B2B a smaller number of quotable inquiries beats a larger pile of one-line messages.",
        },
        {
          q: "What makes a supplier page look credible?",
          a: "Specifics that are hard to fake: certifications with their actual numbers, factory or fleet photos, production capacity, years in operation, and named clients or markets served. Vague claims about quality and service read identically across every supplier a buyer is comparing you against.",
        },
      ],
    },

    education: {
      metaTitle: "Education & training landing page templates ({count}) | Zap Bridge",
      metaDescription:
        "{count} enrolment inquiry landing page templates for study abroad consultancies, language schools, online course providers, and K-12 tutoring. Book trial classes and consultations, and publish to your own domain.",
      h1: "Education & training landing page templates",
      lead: "{count} enrolment-inquiry templates for study abroad consultancies, language schools, online course providers, and K-12 tutoring.",
      intro: [
        "Education decisions are slow, expensive, and usually made by someone other than the student — a parent, a sponsor, an employer. The page has to satisfy both readers at once: the outcome the decision-maker is paying for, and the experience the student will actually have. These templates lead with the outcome, then make the path to it concrete through curriculum, teacher credentials, and results from people the visitor recognises as similar to them.",
        "What converts is a low-commitment first step. A trial class, a placement test, a free counselling session — something that turns a big decision into a small one and gets a real conversation started. Each template is built around that offer rather than around enrolment, and captures enough context for your counsellors to follow up with something specific.",
      ],
      whoFor:
        "Study abroad and admissions consultancies, language schools, online course and bootcamp operators, tutoring centres, and agencies running education accounts.",
      leadsArrive:
        "Forms lead, because the follow-up depends on context a form collects best — target country, current level, the student's age, an intake date. WhatsApp is the strong second in most education markets and often becomes the whole counselling relationship, so several templates are set up for it. Phone matters most for parent-facing tutoring, where a decision-maker wants to hear a person.",
      crossBorder:
        "Education runs cross-border in the opposite direction to product categories — the student is abroad, or wants to be. Study abroad is the obvious case, but online courses and language training both routinely enrol from other countries, which makes intake dates, time zones for live classes, and whether qualifications are recognised locally into conversion questions rather than admin details. WhatsApp dominates precisely because the counselling relationship spans time zones for months.",
      faqs: [
        {
          q: "What should the low-commitment first step be?",
          a: "Whatever costs the visitor least while still telling you something — a trial class for language and tutoring, a placement or eligibility assessment for study abroad, a first module for online courses. Asking for enrolment on the first visit converts poorly in every education segment.",
        },
        {
          q: "Should the page target parents or students?",
          a: "Both, in the right order. Lead with the outcome the payer cares about — admissions results, exam scores, employability — and use the body of the page for the experience the student will have. K-12 tutoring skews furthest toward the parent; adult upskilling is usually the same person deciding and attending.",
        },
        {
          q: "How do I show results without over-promising?",
          a: "Use specifics with context — placements with the year and cohort, score improvements with the starting point, named alumni destinations. Guaranteed admission or guaranteed score claims are both a credibility problem and a frequent cause of ad rejections in this category.",
        },
      ],
    },

    supplement: {
      metaTitle: "Health & supplement landing page templates ({count}) | Zap Bridge",
      metaDescription:
        "{count} lead-gen landing page templates for vitamins, weight management, sleep, joint health, and women's health brands. Capture consultations and inquiries with a compliance-aware page structure.",
      h1: "Health & supplement landing page templates",
      lead: "{count} inquiry templates for vitamins, weight management, sleep, joint, and women's health brands — structured with the claim constraints of this category in mind.",
      intro: [
        "Supplements are the category where the page structure and the compliance constraints are the same problem. Everything that would make the page convert fastest — a specific health outcome, a timeline, a transformation — is also what gets creative rejected and accounts restricted. These templates are laid out to convert through mechanism and credibility instead: what the formulation does, why the ingredients were chosen, who formulated it, and what people report, framed as experience rather than as a promise.",
        "Because the honest version of this pitch needs more explanation than an ad can carry, a consultation or assessment offer works better here than a hard sell. It gives you room to qualify who the product actually suits and leaves the outcome conversation where it can be handled responsibly — in a reply, not in a headline.",
      ],
      whoFor:
        "Supplement and nutrition brands, practitioners recommending protocols, distributors seeking stockists, and agencies running health accounts that need a compliance-aware page structure.",
      leadsArrive:
        "Form and WhatsApp both work, and the split follows the product: a considered protocol benefits from a form that captures the visitor's goal and situation, while a simpler product converts better on a chat where questions get answered as they come up. Whichever you choose, the follow-up channel matters more here than in most categories — the qualification conversation is where the sale is actually made.",
      crossBorder:
        "Supplements are the category where selling into another market is a regulatory question before it is a marketing one. Permitted claims, ingredient restrictions, and labelling requirements differ by country, and a page that is compliant at home can be unlawful one border away. The consultation structure helps here for a practical reason as well as a legal one: it keeps the specific claims in a reply you control rather than on a public page a foreign regulator may read.",
      faqs: [
        {
          q: "What claims should I keep off the page?",
          a: "Anything that reads as treating, preventing, or curing a condition, plus guaranteed results and specific timelines. Rules differ by market and none of them are satisfied by a disclaimer alone — the templates give you a structure that converts without leaning on outcome claims, but the copy you write remains your legal responsibility.",
        },
        {
          q: "Why do supplement pages get rejected so often?",
          a: "Usually the ad and the page disagree, or the page implies a health outcome it can't support. Before-and-after body imagery, weight loss numbers, and language implying a medical effect are the recurring triggers. Reviewers read the landing page, not just the creative, so a compliant ad pointing at a non-compliant page still fails.",
        },
        {
          q: "Is a consultation offer better than a direct offer?",
          a: "In this category, usually yes. A consult or assessment lets you match the product to the person, keeps the outcome discussion out of the public page, and produces a lead you can qualify — which matters when a mismatched customer is a refund and a bad review rather than a sale.",
        },
      ],
    },

    apparel: {
      metaTitle: "Apparel & accessories landing page templates ({count}) | Zap Bridge",
      metaDescription:
        "{count} lead-gen landing page templates for fashion, plus-size, activewear, shapewear, and footwear brands. Capture wholesale inquiries, fit consultations, and waitlist signups on your own domain.",
      h1: "Apparel & accessories landing page templates",
      lead: "{count} inquiry templates for fashion, plus-size, activewear, shapewear, and footwear — for the conversations that happen before a fashion purchase, not the purchase itself.",
      intro: [
        "Apparel has an unusually specific blocker: fit. Whatever the visitor likes about the product, the thing stopping them is not knowing whether it will work on their body, and that doubt is answered by a person far more often than by a size chart. These templates lead with the fit question and route it into a conversation — a sizing consult, a fit quiz, a stylist reply — which is also why they suit brands whose margins die of returns.",
        "The second use of this industry is wholesale. A page aimed at boutiques and stockists needs different proof entirely: line sheets, minimums, lead times, and terms. Both structures live here, and neither transacts — the page produces a conversation, and your store or your sales process takes it from there.",
      ],
      whoFor:
        "Fashion and footwear brands with a fit or sizing problem to solve, plus-size and shapewear labels, activewear brands, and wholesale suppliers looking for stockists and distributors.",
      leadsArrive:
        "WhatsApp suits the fit conversation better than anything else — visitors send measurements and photos, and a sizing question resolves in one exchange instead of a lost visit. Forms fit waitlists, launch registration, and wholesale inquiries where you need structured information such as store name, volume, and territory before replying.",
      crossBorder:
        "Apparel is where cross-border selling hurts most, because sizing conventions differ market to market and a size chart cannot absorb that. A fit conversation can: asking what the visitor currently wears, and in which brand, gives you a reference point that survives the border. This is also why chat outperforms forms here — a buyer several time zones away would rather send measurements once than wait a day for a follow-up question.",
      faqs: [
        {
          q: "Can visitors place an order through the page?",
          a: "No — there is no cart or checkout in any template here. For DTC brands the page captures the inquiry and hands it to your store or your team; for wholesale it captures the stockist request that starts a normal sales conversation.",
        },
        {
          q: "How do I use one of these pages to reduce returns?",
          a: "Move the fit conversation before the purchase instead of after it. A page whose main call to action is a sizing consult costs you some immediate conversions and saves the returns that follow a guess — which is why plus-size, shapewear, and footwear brands tend to run this structure rather than a straight product page.",
        },
        {
          q: "What does a wholesale apparel page need that a DTC one doesn't?",
          a: "Terms a buyer can evaluate: minimums, lead times, size runs, wholesale pricing structure, and any existing stockists. A boutique owner is assessing whether you are a reliable supplier, which is closer to the B2B templates than to a consumer fashion page.",
        },
      ],
    },

    gadget: {
      metaTitle: "Consumer tech landing page templates ({count}) | Zap Bridge",
      metaDescription:
        "{count} lead-gen landing page templates for phone accessories, charging, audio, wearables, and smart home products. Capture distributor inquiries, pre-launch signups, and product consultations.",
      h1: "Consumer tech landing page templates",
      lead: "{count} inquiry templates for phone accessories, charging, audio, wearables, and smart home products.",
      intro: [
        "Consumer tech buyers compare. They have two or three options open, they are reading specifications they only half understand, and they are looking for the one difference that decides it. These templates are built around that comparison rather than around a feature list — put the specification that matters next to the alternative, show the product in use, and make the remaining question easy to ask.",
        "The other job this industry does is pre-launch and channel. A product that isn't shipping yet still needs somewhere for interest to accumulate, and a product looking for retailers needs a page aimed at buyers rather than consumers. Waitlist registration and distributor inquiry both live here, and neither requires a storefront to work.",
      ],
      whoFor:
        "Hardware and accessory brands, smart home vendors, teams running a pre-launch waitlist, and suppliers looking for distributors and retail partners.",
      leadsArrive:
        "Forms suit waitlists and distributor inquiries, where you want an email you can announce to or a business you can qualify. WhatsApp works for the pre-purchase question — compatibility, specification, availability — that a visitor would otherwise resolve by leaving. For hardware sold into channel, the inquiry usually needs to reach a CRM rather than an inbox, which the Pro and Agency plans handle.",
      crossBorder:
        "Consumer tech sells across borders on compatibility and support, not on price. Plug standards, network bands, warranty reach, and who handles a return from another country are the questions that stop a purchase, and a page that leaves them unanswered loses to a local seller charging more. Distributor enquiries follow the same logic in reverse — a retail buyer abroad is assessing whether you can supply and support their market at all.",
      faqs: [
        {
          q: "Can I use these pages for a product that hasn't launched?",
          a: "Yes — pre-launch is one of the strongest uses. The page collects registrations for launch instead of pointing at a store that has nothing to sell yet, which both builds a list and tells you whether the positioning works before you commit to inventory.",
        },
        {
          q: "How technical should the page be?",
          a: "Specific where it decides the comparison, plain everywhere else. Lead with the specification the buyer is actually comparing — battery hours, latency, compatibility — and translate the rest into what it means in use. A full spec sheet belongs further down, for the minority who scroll to it.",
        },
        {
          q: "What does a distributor page need that a consumer page doesn't?",
          a: "Margin and logistics, not features. Retail buyers want packaging, certifications, MOQ, lead times, existing retail presence, and support terms. If that is your goal, the B2B templates are usually a better starting point than the consumer ones here.",
        },
      ],
    },

    home: {
      metaTitle: "Home & living landing page templates ({count}) | Zap Bridge",
      metaDescription:
        "{count} lead-gen landing page templates for storage, kitchen, pet, garden, and bedding brands. Capture consultations, quotes, and wholesale inquiries, and publish to your own domain.",
      h1: "Home & living landing page templates",
      lead: "{count} inquiry templates for storage, kitchen, pet, garden, and bedding brands.",
      intro: [
        "Home products are bought on how the room ends up, not on the product itself. The visitor is picturing a space, and the page converts when it shows the result convincingly and then makes it easy to ask the question standing between them and it — will this fit, will it match, will it hold up. These templates put the outcome imagery first and route those questions into a reply.",
        "That question tends to be specific enough that a form is the wrong instrument for it. Dimensions, materials, room photos, a plan of what someone is trying to do — this is a conversation, and the templates that convert best in this category are set up for one, with the structured form kept for cases where you need details before you can answer.",
      ],
      whoFor:
        "Home and living brands, furnishing and storage specialists, pet and garden product sellers, and suppliers looking for retail or hospitality accounts.",
      leadsArrive:
        "Chat handles the fit-and-match questions that a home purchase turns on, and visitors send photos of the actual room — which is usually the fastest route to a confident answer. Forms are the better fit for anything you need to price or plan, such as a bulk or trade inquiry where quantities and specifications have to be recorded before a reply.",
      crossBorder:
        "Home and living products sell into other markets on dimensions and voltage as much as on design. A visitor measuring in inches when your page speaks in centimetres, or checking whether a plug fits, is one unanswered question away from leaving — which is why the chat-first structure works here. Trade and hospitality enquiries from abroad add lead time and freight to the same conversation.",
      faqs: [
        {
          q: "Can these pages take orders?",
          a: "No. They capture the inquiry and stop there — no cart, checkout, or order flow exists in the templates. The purchase happens on your own store or through your sales process afterwards.",
        },
        {
          q: "What imagery works for home and living pages?",
          a: "Rooms, not products on white. The visitor is buying a result, so in-situ photography that shows scale and context outperforms catalogue shots, and a before-and-after pairing does more work than either when the product visibly changes a space.",
        },
        {
          q: "Can I use one of these for trade or hospitality customers?",
          a: "Yes, though a trade audience wants different proof — volume pricing structure, lead times, durability specifications, and existing accounts. Start from these templates for the outcome imagery, or from the B2B templates if the inquiry needs a full specification before you can respond.",
        },
      ],
    },

    "toys-baby": {
      metaTitle: "Toys & baby landing page templates ({count}) | Zap Bridge",
      metaDescription:
        "{count} lead-gen landing page templates for educational toys, sensory toys, feeding, maternity, and outdoor play brands. Capture parent inquiries and wholesale requests with safety-first page structure.",
      h1: "Toys & baby landing page templates",
      lead: "{count} inquiry templates for educational toys, sensory toys, feeding, maternity, and outdoor play — where safety evidence has to arrive before anything else.",
      intro: [
        "Parents buying for a child apply a stricter filter than they apply to anything they buy for themselves, and it resolves before they read a single benefit: is this safe, and is it right for this age. These templates answer both in the first screen — certifications, materials, age range — because a page that leads with delight and buries the safety information loses the cautious parent who was your best prospect.",
        "After that, what convinces is developmental specificity. Naming the skill a toy builds or the stage a product suits does more than any adjective, and other parents saying it worked for a child of the same age does more than the brand saying anything at all. The page's job is to earn a question, not a purchase.",
      ],
      whoFor:
        "Toy and baby product brands, maternity and feeding brands, educational play specialists, and suppliers seeking retail or nursery accounts.",
      leadsArrive:
        "Forms do well when age, stage, or a gifting occasion determines the recommendation, since that context makes the follow-up specific. WhatsApp suits the safety and suitability questions parents want answered before committing — material, certification, whether it suits a particular child — which often resolve in a single exchange.",
      crossBorder:
        "Toy and baby products face different safety standards in every market, and parents abroad check for the certification they recognise, not the one you hold. Naming the standard explicitly — and which market it applies to — resolves in one line what would otherwise cost you the cautious buyer. Institutional and retail enquiries from abroad turn on the same documentation.",
      faqs: [
        {
          q: "What safety information belongs on the page?",
          a: "Whatever a cautious parent would look for first: applicable certifications and standards, materials, age grading, and any choking or supervision guidance. Putting it high on the page rather than in the footer reads as confidence, and burying it reads as the opposite.",
        },
        {
          q: "How specific should the age range be?",
          a: "As specific as the product genuinely supports. A range that is honest about a narrow window converts better than one stretched to look broadly useful, because a parent buying outside the real range ends up disappointed — and in this category a mismatched buyer becomes a review that costs more than the sale.",
        },
        {
          q: "Can I use these pages for wholesale or nursery accounts?",
          a: "Yes, though institutional buyers evaluate differently — certification documentation, durability under heavy use, volume terms, and replacement policy carry the decision. The B2B templates are often the better starting point for that audience.",
        },
      ],
    },

    "home-improvement": {
      metaTitle: "Home improvement landing page templates ({count}) | Zap Bridge",
      metaDescription:
        "{count} quote-request landing page template for solar and home improvement installers. Capture assessment bookings and quote requests, and publish to your own brand domain.",
      h1: "Home improvement landing page templates",
      lead: "{count} quote-request template for solar and home improvement installers, built around the survey booking that every job in this category starts with.",
      intro: [
        "Home improvement is a considered, high-value decision made at home, usually by more than one person, over weeks. Nothing can be quoted honestly without seeing the property, so the page is not trying to close anything — it is trying to earn a survey or assessment booking, and everything on it exists to make that booking feel low-risk.",
        "What makes it feel low-risk is local specificity: jobs completed nearby, the installers who will actually attend, accreditations and warranty terms, and a plain account of what happens between the first call and the finished work. Savings and payback framing helps when it is grounded, and hurts when it reads as a number invented for the ad.",
      ],
      whoFor:
        "Solar and home improvement installers, renovation and retrofit contractors, and agencies running installer lead generation.",
      leadsArrive:
        "Form and phone together — a homeowner comparing installers wants to submit property details on their own time, while an urgent or late-stage enquiry converts on a call. The form is where the qualification happens: property type, ownership, roof or site details, and timeline separate a real survey booking from a browsing homeowner.",
      faqs: [
        {
          q: "Should the page quote a price or a saving?",
          a: "Neither as a firm number. Every job depends on the property, so the page should offer the assessment that produces the quote. A grounded illustrative range with its assumptions stated is defensible; a headline saving figure with nothing behind it is the fastest way to lose both trust and ad approval.",
        },
        {
          q: "What qualifies a home improvement lead?",
          a: "Ownership above all — a tenant cannot commission the work — followed by property type, site or roof condition, and timeline. Asking these on the form costs some submissions and saves your team the surveys that were never going to convert.",
        },
        {
          q: "Only one template in this industry — what else can I start from?",
          a: "Local services is the closest neighbour and shares the quote-request structure used by roofing, HVAC, and landscaping pages, all of which adapt easily to a home improvement offer. This industry is being expanded; any template can be re-pointed at a different trade by editing the copy and imagery.",
        },
      ],
    },

    legal: {
      metaTitle: "Legal & immigration landing page templates ({count}) | Zap Bridge",
      metaDescription:
        "{count} case-inquiry landing page template for immigration and legal practices. Capture eligibility assessments and consultation bookings, and publish to your own firm domain.",
      h1: "Legal & immigration landing page templates",
      lead: "{count} case-inquiry template for immigration and legal practices, built around an eligibility assessment rather than a promise.",
      intro: [
        "Someone looking for legal help is dealing with a situation that has real consequences and is trying to work out two things: whether their case is even viable, and whether this firm handles cases like theirs. The page answers the second directly — practice areas, admissions and credentials, the process explained step by step — and converts the first into an eligibility assessment rather than attempting to answer it publicly.",
        "That structure is also the conservative one, which matters in a category where advertising is regulated. An assessment offer, a clearly labelled non-advice notice, and outcome language kept factual keep the page inside what most jurisdictions permit while still giving an anxious visitor a concrete next step.",
      ],
      whoFor:
        "Immigration consultancies and law firms, solo practitioners and small practices, and agencies running legal lead generation.",
      leadsArrive:
        "Forms lead, because case facts need to be written down and a visitor discussing a sensitive situation would rather type it than say it. WhatsApp is common in immigration work where clients are in another country and time zone, and phone matters for firms whose intake runs through a person.",
      crossBorder:
        "Immigration work is cross-border by definition: the client is in one country and the outcome is in another. That shapes everything practical about the page — the client cannot walk in, the time difference makes phone intake unreliable, and case facts often need to arrive as documents rather than conversation. It is also why the written assessment converts better here than a callback offer would.",
      faqs: [
        {
          q: "Can the page assess whether someone qualifies?",
          a: "It should collect the facts, not deliver the verdict. Publishing an automated eligibility answer edges into giving advice, which raises regulatory problems in most jurisdictions and creates liability if it is wrong. The template captures the case detail and hands your team a qualified assessment to perform.",
        },
        {
          q: "What are the advertising constraints for a legal page?",
          a: "Legal advertising is regulated by jurisdiction and often by bar or professional body rules — guaranteed outcomes, success rate claims, and testimonials are restricted or prohibited in some places, and required disclosures vary. The template ships with a compliant footer and a non-advice notice, but the professional rules that apply to your practice are yours to verify.",
        },
        {
          q: "Only one template in this industry — what else can I start from?",
          a: "The medical templates share the same consultation-first structure — a sensitive situation, a credentialed professional, an assessment before any commitment — and adapt to legal practice areas with copy changes alone. This industry is being expanded with more practice-specific templates.",
        },
      ],
    },
  } satisfies Record<string, IndustryCopy>,
};
