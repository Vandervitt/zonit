// lib/seo/template-seo-copy.ts
// 模板级独有问答（进 FAQPage 结构化数据的唯一来源）。
//
// 为什么单独成文件而不是并进 registry.ts：registry 被客户端组件
// TemplatePickerDialog 引入，会进编辑器 bundle；这批只有营销详情页需要的长文案
// 塞进去等于让每个打开编辑器的用户白下载几十 KB。本文件只被服务端的
// lib/seo/template-content.ts 引用。
//
// 分工（与行业页 FAQ 的边界，见 lib/i18n/dictionaries/*/templateIndustry.ts）：
//   · 行业页 FAQ 答「这个**行业**怎么做获客」——牙科要不要标价、B2B 要不要写 MOQ；
//   · 本文件答「这**套模板**怎么用」——它的钩子能不能换、它的证据区放几组图。
// 两者主体不同，天然不撞车；写的时候若发现某条放到行业页也成立，那它就写错了层。
//
// 硬约束：每套至少 2 条，且必须是这套模板独有的问题。不足 2 条时
// templateFaqJsonLd 会整个不输出 schema——宁可没有结构化数据，也不要 104 页重复。
import type { LocalizedText } from "@/landing-editor/samples/registry";

export interface TemplateFaq {
  q: LocalizedText;
  a: LocalizedText;
}

export const TEMPLATE_FAQS: Record<string, TemplateFaq[]> = {
  // ---------- beauty ----------
  skincare: [
    {
      q: {
        en: "Can I swap the free skin analysis for a discount offer?",
        zh: "能把「免费肤质分析」换成折扣券吗？",
      },
      a: {
        en: "You can, but it changes what the page produces. An analysis gives the visitor a reason to describe their skin and gives you something to open with; a discount attracts people comparing prices and leaves you a contact with no context. If you switch, expect a higher opt-in rate and a lower reply rate.",
        zh: "可以，但页面产出的东西会变。「分析」让访客有理由描述自己的皮肤，也给了你开口的由头；折扣吸引来的是比价的人，留下的联系方式没有任何上下文。换了之后通常是留资率上升、回复率下降。",
      },
    },
    {
      q: {
        en: "How many before-and-after pairs belong in the evidence section?",
        zh: "前后对比区放几组图合适？",
      },
      a: {
        en: "Three to four, shot in the same lighting and angle, unretouched. Fewer reads as cherry-picked, many more reads as a claim rather than evidence — and beauty creative gets scrutinised closely, so a wall of dramatic transformations is a common rejection trigger.",
        zh: "三到四组，同光线、同角度、不修图。少了像精挑细选，多了就从「证据」变成「主张」——美妆素材审核很细，一整面墙的戏剧化对比是常见的拒审触发点。",
      },
    },
  ],
  radiantglow: [
    {
      q: {
        en: "This template ships with all 12 sections — should I keep every one?",
        zh: "这套模板带齐了 12 个区块，要全留吗？",
      },
      a: {
        en: "No. It is a superset to pick from, not a prescription. Keep only the sections you can back with real assets — a long page earns its length only if every block answers an objection a visitor actually has. Empty or generic sections cost you more than the missing ones would.",
        zh: "不要。它是给你挑的全集，不是必须照做的清单。只保留你有真实素材支撑的区块——长页面能成立的前提是每一块都在回答访客真实存在的疑虑。空洞或套话的区块，损失比少放一块更大。",
      },
    },
    {
      q: {
        en: "How is this different from the Aurae Skincare template?",
        zh: "它和 Aurae Skincare 模板怎么选？",
      },
      a: {
        en: "Aurae is the lean consult-first page: concern, hook, reply. RadiantGlow is for brands that already have the proof assets — ingredient science, clinical-style results, a body of reviews — and want a page long enough to use them. If you are unsure which you have, start with Aurae.",
        zh: "Aurae 是精简的「先咨询」页：困扰 → 钩子 → 回复。RadiantGlow 面向已经攒够素材的品牌——成分讲解、类临床的效果记录、成规模的评价——需要一张足够长的页面把它们用起来。拿不准自己属于哪种，就先用 Aurae。",
      },
    },
  ],
  makeup: [
    {
      q: {
        en: "What do I need ready before running traffic to a shade-matching page?",
        zh: "跑量之前，色号匹配页需要先准备什么？",
      },
      a: {
        en: "A shade chart you can read from a photo, two or three questions that pin down undertone, and someone able to reply within the hour. The hook is only as good as the reply behind it — an unanswered shade request converts worse than never having offered one.",
        zh: "一份能对着照片读的色号表、两三个能问出冷暖调的问题，以及一个能在一小时内回复的人。钩子的价值取决于它背后的回复——一条没人接的色号咨询，比压根没提供这个服务转化更差。",
      },
    },
    {
      q: {
        en: "Do the swatch photos need to cover multiple skin tones?",
        zh: "试色图需要覆盖多种肤色吗？",
      },
      a: {
        en: "Yes, and it is the single most common reason these pages underperform. A swatch wall shot on one model tells most of your traffic nothing about themselves, and shade matching is precisely the doubt the page exists to resolve.",
        zh: "需要，而且这是这类页面表现不佳最常见的原因。一整面在同一个模特身上拍的试色图，对你大部分流量而言毫无参考价值——而色号匹配恰恰是这张页面存在的意义。",
      },
    },
  ],
  "beauty-device": [
    {
      q: {
        en: "Device claims are the risky part — where does this template put them?",
        zh: "仪器类的功效表述最容易出事，这套模板把它放在哪？",
      },
      a: {
        en: "In the mechanism and usage-plan sections, framed as how the device is meant to be used rather than what it will achieve. The conversion is a care plan over chat, which moves the outcome conversation into a reply where it can be qualified — and keeps it off a public page where it would be read as a claim.",
        zh: "放在原理与使用方案区，讲的是「这台仪器该怎么用」而不是「它会带来什么结果」。转化点是聊天里的护理方案，把效果讨论移进了可以逐人确认的回复里——而不是留在公开页面上被当成承诺。",
      },
    },
    {
      q: {
        en: "Should the page compare the device against salon treatments?",
        zh: "页面要不要拿仪器和院线项目做对比？",
      },
      a: {
        en: "Compare on cost, convenience, and frequency — those are verifiable. Do not compare on results: claiming parity with a professional treatment is both hard to substantiate and one of the faster routes to having the page flagged.",
        zh: "可以比价格、便利性和使用频率——这些可核实。不要比效果：宣称与院线项目等效既难举证，也是页面被判违规较快的一条路。",
      },
    },
  ],
  "hair-growth": [
    {
      q: {
        en: "Can I show hair regrowth before-and-afters?",
        zh: "可以放生发前后对比图吗？",
      },
      a: {
        en: "This is a high-risk category and the template deliberately avoids them. Regrowth imagery reads as an efficacy claim, which is why the copy stays on scalp condition and routine instead. The free scalp assessment is what carries the conversion — it lets you discuss individual results privately rather than promising them publicly.",
        zh: "这是高风险类目，模板刻意不放。生发对比图会被读作功效宣称，所以文案改走「头皮状况 + 日常护理」的路线。承担转化的是免费头皮评估——它让你在私下逐人讨论效果，而不是在公开页面上承诺效果。",
      },
    },
    {
      q: {
        en: "What should the free scalp assessment collect?",
        zh: "免费头皮评估该收集什么？",
      },
      a: {
        en: "Shedding pattern, how long it has been going on, current routine and products, and a photo. Those four turn a generic reply into a specific one, and duration in particular tells you quickly whether this is a case you can help with at all.",
        zh: "脱发形态、持续了多久、目前的护理与在用产品，以及一张照片。这四项能把一句套话回复变成一次具体建议；其中「持续多久」尤其能让你迅速判断这个案例你到底能不能接。",
      },
    },
  ],
  fragrance: [
    {
      q: {
        en: "How do you sell a scent on a page nobody can smell?",
        zh: "闻不到味道的页面，怎么卖香水？",
      },
      a: {
        en: "You do not — you sell the recommendation. The page works through note stories and occasion pairings that let a visitor recognise themselves, then converts on a personalised scent suggestion. The nose is never convinced by the page; it is convinced by the sample that follows the conversation.",
        zh: "不卖香水，卖「推荐」。页面靠前中后调的故事和场景搭配让访客对号入座，再以一次个性化选香建议完成转化。鼻子永远不会被页面说服，说服它的是对话之后寄到手上的小样。",
      },
    },
    {
      q: {
        en: "Should the page push samples or full bottles?",
        zh: "页面该主推小样还是正装？",
      },
      a: {
        en: "Samples, as the recommendation rather than as a transaction — the page has no checkout and does not need one. A sample request is a low-commitment yes that gets you a contact and a stated preference, which is a far better starting point than a bounced full-price visitor.",
        zh: "主推小样，而且是作为「推荐」而不是「交易」——页面没有结账流程，也不需要。索取小样是一次低承诺的同意，你换来的是联系方式加一条明确的偏好，比一个被正装价格劝退的访客有价值得多。",
      },
    },
  ],

  // ---------- apparel ----------
  "fast-fashion": [
    {
      q: {
        en: "Drops change weekly — how do I keep this page current?",
        zh: "上新每周都变，这张页面怎么维护？",
      },
      a: {
        en: "Keep the new-arrival block as the only section you touch, and leave the hero, styling advice, and trust sections static. If updating the page takes more than a few minutes, it stops getting updated — which is how these pages quietly start advertising last season.",
        zh: "把「上新」区块作为唯一需要动的地方，首屏、穿搭建议和信任区保持不变。如果更新一次要花掉十几分钟，这张页面就不会再被更新——这正是这类页面悄悄开始宣传上一季的原因。",
      },
    },
    {
      q: {
        en: "Styling advice over chat sounds slow. Does it scale?",
        zh: "在聊天里给穿搭建议，跑得起量吗？",
      },
      a: {
        en: "It scales if you answer with a small set of prepared looks rather than composing each reply. Three or four outfit templates plus a sizing rule covers most requests, and the visitor still experiences it as personal because the pick was made for what they said.",
        zh: "跑得起来，前提是你用几套准备好的搭配来回，而不是每条都现写。三四套穿搭模板加一条尺码规则就能覆盖大多数咨询，而访客体验到的依然是「专属」，因为这个选择是针对他说的话做的。",
      },
    },
  ],
  "plus-size": [
    {
      q: {
        en: "Why does this template lead with fit instead of the clothes?",
        zh: "为什么这套模板先讲合身、后讲衣服？",
      },
      a: {
        en: "Because fit is the doubt that actually stops the purchase in this category. Plus-size shoppers have been let down by size charts before, so a page that opens with styling and hides sizing at the bottom is answering the wrong question in the wrong order.",
        zh: "因为在这个类目里，真正拦住购买的疑虑就是「合不合身」。大码顾客被尺码表辜负过太多次，一张先讲穿搭、把尺码信息塞在最下面的页面，是在用错误的顺序回答错误的问题。",
      },
    },
    {
      q: {
        en: "What imagery does this page need that a standard fashion page doesn't?",
        zh: "它比普通时装页多需要哪些图？",
      },
      a: {
        en: "The same garment on genuinely different body types, with the size worn stated. One model in one size proves nothing to a visitor with a different shape, and this is the category where that gap costs the most in returns.",
        zh: "同一件衣服在真正不同体型上的实穿图，并标明所穿尺码。一个模特一个尺码，对体型不同的访客毫无说服力——而这个类目里，这个缺口带来的退货成本最高。",
      },
    },
  ],
  activewear: [
    {
      q: {
        en: "Should the page lead with fabric performance or with looks?",
        zh: "页面该先讲面料性能还是先讲好看？",
      },
      a: {
        en: "Looks bring the click, performance closes the doubt — which is the order this template uses. Squat-proof, sweat-wicking, and hold claims all need to be specific enough to be checkable, because this is an audience that has been disappointed by vague fabric copy before.",
        zh: "好看带来点击，性能打消疑虑——模板用的就是这个顺序。防透、排汗、支撑这些说法都要具体到可以被验证，因为这批人已经被含糊的面料文案辜负过。",
      },
    },
    {
      q: {
        en: "What is the training-pairing advice actually for?",
        zh: "「训练场景搭配」这个建议到底是干什么用的？",
      },
      a: {
        en: "It turns a size question into a use question, which is easier to answer well and tells you more. Someone who says they do hot yoga three times a week has told you their fabric, their support level, and their price tolerance in one sentence.",
        zh: "它把一个尺码问题变成一个使用场景问题——后者更容易答好，也能告诉你更多。一个说自己每周练三次高温瑜伽的人，一句话就交代了面料需求、支撑等级和价格接受度。",
      },
    },
  ],
  shapewear: [
    {
      q: {
        en: "How does the template handle the sensitivity of an intimate category?",
        zh: "贴身类目比较敏感，模板怎么处理？",
      },
      a: {
        en: "By keeping the copy factual about fabric, construction, and fit, and moving anything about the body into the private conversation. The page never comments on what a body should look like — it describes what the garment does, which is both more tactful and more useful.",
        zh: "文案只讲面料、剪裁与合身这些事实，把一切与身材有关的话题留到私下对话里。页面从不评价身材该是什么样，只描述这件衣服做了什么——这既更得体，也更有用。",
      },
    },
    {
      q: {
        en: "Can I use body-transformation imagery?",
        zh: "可以用身材前后对比图吗？",
      },
      a: {
        en: "Avoid it. Silhouette comparisons in this category sit close to body-image restrictions on the major ad platforms and are a recurring rejection cause. On-body shots showing how the garment sits do the same convincing work without the exposure.",
        zh: "避免使用。这个类目的体形对比图很接近主流广告平台对身材形象的限制，是反复出现的拒审原因。展示衣服上身效果的实穿图能起到同样的说服作用，却没有这层风险。",
      },
    },
  ],
  footwear: [
    {
      q: {
        en: "Sizing runs differently by brand — how does the page handle that?",
        zh: "各家鞋码不一致，页面怎么处理？",
      },
      a: {
        en: "It converts on a fit conversation rather than publishing a conversion chart and hoping. Asking what the visitor currently wears and in which brand gives you a reference point a chart cannot, and it is the single cheapest way to cut returns in footwear.",
        zh: "它靠一次「合脚对话」完成转化，而不是贴一张换算表听天由命。问清访客现在穿什么牌子的几码，你就拿到了尺码表给不了的参照点——这是鞋类降低退货率最省钱的一招。",
      },
    },
    {
      q: {
        en: "What construction details are worth putting on the page?",
        zh: "鞋子的工艺细节，哪些值得写进页面？",
      },
      a: {
        en: "The ones a buyer can feel in the first week: sole flexibility, insole support, break-in period, and width fit. Material provenance reads well but rarely decides anything; how the shoe behaves on day three decides plenty.",
        zh: "写那些买家第一周就能感受到的：鞋底柔韧度、鞋垫支撑、磨合期长短、楦型宽窄。皮料产地听起来体面，但很少影响决策；穿到第三天什么感觉，影响很大。",
      },
    },
  ],

  // ---------- gadget ----------
  "phone-case": [
    {
      q: {
        en: "Why does the page ask for the device model before anything else?",
        zh: "为什么页面一上来就问机型？",
      },
      a: {
        en: "Because compatibility is a yes-or-no question and everything else is wasted if the answer is no. Asking first also gives you the most useful qualification in this category for free — the model tells you the price tier the visitor is comfortable with.",
        zh: "因为兼容性是个是非题，答案是「否」的话后面全白搭。先问也顺手拿到了这个类目最有用的资格信息——机型本身就说明了访客能接受的价位段。",
      },
    },
    {
      q: {
        en: "Do drop-test claims need proof on the page?",
        zh: "抗摔测试的说法需要在页面上举证吗？",
      },
      a: {
        en: "If you state a height or a standard, yes — a number without a test behind it is the kind of claim that gets challenged in reviews and by ad platforms alike. A video of the actual test outperforms a certification badge nobody recognises.",
        zh: "只要你写了具体高度或标准，就需要——一个背后没有测试的数字，评价区和广告审核都会盯上。一段真实测试视频，效果好过一枚没人认识的认证徽章。",
      },
    },
  ],
  charging: [
    {
      q: {
        en: "Charging specs confuse people. How technical should the page get?",
        zh: "充电参数很劝退，页面要写得多技术？",
      },
      a: {
        en: "Lead with what the number means — how long to full, how many phone charges, whether it runs a laptop — and put the wattage and protocol detail below for the minority who compare on paper. A spec-first page filters out most of the people who would have bought.",
        zh: "开场讲数字的含义——多久充满、能给手机充几次、带不带得动笔电——把瓦数与协议细节放在下方，留给会对着参数比较的少数人。一张参数开场的页面，会把大部分本来会买的人筛掉。",
      },
    },
    {
      q: {
        en: "What does the free charging-setup advice actually do for conversion?",
        zh: "「免费充电方案建议」对转化到底起什么作用？",
      },
      a: {
        en: "It turns a product question into a situation question. Someone describing their desk, their commute, and their three devices has effectively self-qualified into a bundle, and the reply writes itself from what they said.",
        zh: "它把产品问题变成场景问题。一个描述了自己的桌面、通勤方式和三台设备的人，实际上已经把自己筛进了某个套装组合，回复的内容照着他说的写就行。",
      },
    },
  ],
  audio: [
    {
      q: {
        en: "Sound quality can't be demonstrated on a page. What convinces instead?",
        zh: "音质在页面上没法演示，靠什么说服？",
      },
      a: {
        en: "Use case and fit. Which environment it is for, how it behaves on a commute or a call, whether it stays in during exercise, and how long it lasts between charges — these decide more purchases than frequency response curves, which almost nobody can interpret.",
        zh: "靠使用场景和佩戴。用在什么环境、通勤和通话时表现如何、运动时会不会掉、一次充电撑多久——这些比频响曲线更能决定购买，而频响曲线几乎没人看得懂。",
      },
    },
    {
      q: {
        en: "Should the page compare against the obvious market leader?",
        zh: "要不要拿页面去和那个人尽皆知的大牌比？",
      },
      a: {
        en: "Compare on the two or three dimensions where you genuinely win and say nothing about the rest. A comparison table that claims victory on every row destroys the credibility of the rows that were true.",
        zh: "只在你确实赢的两三个维度上比，其余绝口不提。一张每一行都赢的对比表，会把那些本来真实的行也一并毁掉。",
      },
    },
  ],
  wearable: [
    {
      q: {
        en: "Wearables touch health data — what does the template avoid saying?",
        zh: "可穿戴涉及健康数据，模板刻意回避了什么？",
      },
      a: {
        en: "Anything that reads as measuring or monitoring a medical condition. Heart rate as a fitness metric is fine; implying detection, diagnosis, or monitoring of a condition moves the page into a restricted health category and invites both rejection and liability.",
        zh: "任何读起来像在测量或监测疾病的表述。把心率作为运动指标没问题；暗示可以检测、诊断或监测某种病症，就把页面推进了受限的健康类目，既容易被拒，也带来责任风险。",
      },
    },
    {
      q: {
        en: "How much does ecosystem compatibility matter on this page?",
        zh: "生态兼容性在这张页面上有多重要？",
      },
      a: {
        en: "Enough to sit in the first screen. A wearable that does not pair with the visitor's phone is not a purchase at any price, and the compatibility question is also the most common reason people open the chat.",
        zh: "重要到应该放进首屏。一块无法与访客手机配对的设备，多便宜都不会被买——而兼容性也是访客最常主动开口发起对话的原因。",
      },
    },
  ],
  "smart-home": [
    {
      q: {
        en: "Why does this template convert on a setup plan rather than a product?",
        zh: "为什么这套模板的转化点是「配置方案」而不是产品本身？",
      },
      a: {
        en: "Because almost nobody buys one smart home device — they buy a working arrangement. Asking what someone wants automated produces a multi-item recommendation and a conversation that continues, where a single-product page produces one comparison and a bounce.",
        zh: "因为几乎没有人只买一件智能家居设备——他们买的是一套能用起来的组合。问清楚对方想自动化什么，产出的是多件推荐和一段能继续下去的对话；而单品页产出的是一次比价和一次跳出。",
      },
    },
    {
      q: {
        en: "Do I need to name the platforms it works with?",
        zh: "必须写明支持哪些平台吗？",
      },
      a: {
        en: "Yes, explicitly and early. Ecosystem lock-in is the first filter every smart home buyer applies, and a page that stays vague about it reads as hiding an incompatibility.",
        zh: "必须，而且要写得明确、靠前。生态绑定是每个智能家居买家的第一道筛子，在这件事上含糊其辞的页面，读起来就是在隐瞒不兼容。",
      },
    },
  ],

  // ---------- home ----------
  storage: [
    {
      q: {
        en: "What makes the free storage plan worth offering?",
        zh: "「免费收纳方案」为什么值得提供？",
      },
      a: {
        en: "It gets you a photo of the actual space, which is the only way to recommend anything with confidence and the fastest route to a multi-item basket. A visitor who has shown you their closet has also stopped comparing you with three other tabs.",
        zh: "它能换来一张真实空间的照片——这是唯一能让推荐变得笃定的方式，也是走向多件组合的最快路径。一个已经把自家柜子拍给你看的访客，同时也停止了和另外三个标签页比价。",
      },
    },
    {
      q: {
        en: "Should the page show before-and-after room photos?",
        zh: "页面该放房间的前后对比图吗？",
      },
      a: {
        en: "This is one of the few categories where they carry real weight, because the change is visible, honest, and reproducible. Keep the 'before' genuinely ordinary — a staged mess reads as false and undoes the credibility of the 'after'.",
        zh: "这是少数几个前后对比真正有分量的类目，因为变化可见、诚实且可复制。「之前」要保持真实的普通——刻意摆出来的凌乱一看就假，反而毁掉「之后」的可信度。",
      },
    },
  ],
  kitchen: [
    {
      q: {
        en: "Why does the template pair product picks with recipe advice?",
        zh: "为什么模板把产品推荐和食谱建议绑在一起？",
      },
      a: {
        en: "Because a kitchen tool is bought for a dish, not for its specifications. Asking what someone cooks turns a browse into a recommendation, and the recipe is a reason to stay in touch after the first reply.",
        zh: "因为厨房用具是为了某道菜而买的，不是为了参数而买的。问清对方常做什么菜，就把浏览变成了推荐；而食谱本身是第一次回复之后继续保持联系的理由。",
      },
    },
    {
      q: {
        en: "How do I handle questions about hob and appliance compatibility?",
        zh: "灶具与电器兼容性的问题怎么接？",
      },
      a: {
        en: "Put the compatibility facts on the page — induction, gas, oven-safe temperature, dishwasher — and let the chat handle the rest. It is a cheap way to stop the most common return in this category, which is a pan that will not work on the buyer's hob.",
        zh: "把兼容事实写进页面——电磁炉、明火、可入烤箱温度、能否进洗碗机——其余交给聊天。这是最省钱的止损方式，能挡掉这个类目最常见的退货：一口在买家灶上用不了的锅。",
      },
    },
  ],
  pet: [
    {
      q: {
        en: "Why does the page ask about the animal before the product?",
        zh: "为什么页面先问宠物、后问产品？",
      },
      a: {
        en: "Breed, age, and weight change the recommendation more than any product feature does, and pet owners are used to being asked. It is also the fastest way to sort a genuine buyer from someone browsing cute photos.",
        zh: "品种、年龄和体重对推荐结果的影响大过任何产品参数，而养宠人本来就习惯被问这些。这也是把真实买家与只是来看可爱照片的人区分开的最快方式。",
      },
    },
    {
      q: {
        en: "Can the page give behaviour or health advice?",
        zh: "页面可以给行为或健康建议吗？",
      },
      a: {
        en: "General care guidance is fine; anything resembling diagnosis or treatment is not, and it will pull the page toward restricted health territory. Route health questions to a vet in the reply — it protects you and reads as responsible rather than evasive.",
        zh: "一般性的养护建议可以，任何近似诊断或治疗的内容都不行——那会把页面推向受限的健康范畴。在回复里把健康问题引向兽医，既保护你自己，读起来也是负责而不是推诿。",
      },
    },
  ],
  garden: [
    {
      q: {
        en: "Garden products are seasonal — does this page work year-round?",
        zh: "园艺产品有季节性，这张页面全年都能用吗？",
      },
      a: {
        en: "The structure does; the offer should rotate. Keep the yard-planning hook constant and change what the plan is about — planting in spring, maintenance in summer, protection in autumn. Rotating the offer beats rebuilding the page four times a year.",
        zh: "结构可以，钩子的内容该轮换。保持「庭院规划」这个钩子不变，只换规划的主题——春天讲种植、夏天讲养护、秋天讲防护。轮换钩子比一年重做四次页面划算得多。",
      },
    },
    {
      q: {
        en: "What does the yard-planning offer need to collect to be useful?",
        zh: "「庭院规划」要收集什么才有用？",
      },
      a: {
        en: "Space size, sun exposure, climate zone, and how much time the person actually wants to spend. The last one matters most and is the one people never volunteer — it separates a plan that gets used from one that gets abandoned.",
        zh: "面积、日照、气候带，以及对方真正愿意投入多少时间。最后一项最关键，也是没人会主动说的——它决定了这份方案是会被执行还是被放弃。",
      },
    },
  ],
  bedding: [
    {
      q: {
        en: "Thread count and fabric claims — what actually convinces here?",
        zh: "支数和面料参数，在这里到底什么能说服人？",
      },
      a: {
        en: "How it sleeps. Temperature regulation, how it feels after ten washes, and whether it suits a hot or cold sleeper decide more than a number on a label — and they are the questions people actually open the chat to ask.",
        zh: "睡起来什么感觉。控温表现、洗过十次之后的手感、适合怕热还是怕冷的人，比标签上的数字更能决定购买——而这些正是访客主动开口会问的问题。",
      },
    },
    {
      q: {
        en: "Should the page sell single items or sets?",
        zh: "页面该主推单件还是套装？",
      },
      a: {
        en: "Let the conversation decide. Asking about bed size and current setup usually surfaces two or three gaps at once, which is how a single-item interest becomes a set recommendation without the page ever pushing one.",
        zh: "交给对话决定。问清床型和现有的配置，通常一次就能暴露两三处缺口——单件兴趣就这样变成了套装推荐，页面自己一句都不用推。",
      },
    },
  ],

  // ---------- supplement ----------
  vitamins: [
    {
      q: {
        en: "Where exactly are the compliance disclaimers in this template?",
        zh: "这套模板的合规声明具体在哪几处？",
      },
      a: {
        en: "In the footer as a standing notice, and inline beside any statement about what the formulation is for. The inline placement matters more than the footer one — a reviewer reading the claim needs the qualifier in the same eyeline, not a scroll away.",
        zh: "页脚有一条常驻声明，任何关于配方用途的表述旁边还有一条随附声明。随附的那条比页脚更重要——审核看到宣称时，限定语要在同一视线内，而不是隔着一屏滚动。",
      },
    },
    {
      q: {
        en: "What can the free nutrition assessment ask without becoming medical?",
        zh: "免费营养评估能问到什么程度而不越界？",
      },
      a: {
        en: "Diet, routine, and goals — what someone eats, how they live, what they want to change. Asking about conditions, medications, or symptoms turns the exchange into something closer to health advice, which is a different regulatory position and a different professional standard.",
        zh: "饮食、作息与目标——吃什么、怎么生活、想改变什么。一旦问到病症、用药或症状，这段交流就接近于健康建议了，那是完全不同的监管定位和专业标准。",
      },
    },
  ],
  "weight-mgmt": [
    {
      q: {
        en: "The template says no slimming claims — so what is the pitch?",
        zh: "模板说不做减重宣称，那卖点是什么？",
      },
      a: {
        en: "Habit, not outcome. The page sells a structured way to change what someone does daily, and the free habit assessment is the product experience rather than a lead magnet. It converts more slowly than a before-and-after page and it does not get the account restricted.",
        zh: "卖「习惯」，不卖「结果」。页面提供的是一套改变日常行为的方法，免费习惯评估本身就是产品体验而不只是钩子。它比前后对比页转化慢，但不会让账户被限。",
      },
    },
    {
      q: {
        en: "Why are body transformation photos excluded?",
        zh: "为什么排除了身材变化照片？",
      },
      a: {
        en: "They are the single most reliable way to get a weight management page rejected, and they set an expectation the product cannot guarantee. The template replaces them with habit tracking and routine descriptions, which convince the audience that stays rather than the one that bounces.",
        zh: "它们是让体重管理页面被拒最稳的一条路，同时还立下了产品无法保证的预期。模板用习惯记录与日常方案取而代之——说服的是会留下来的那批人，而不是会跳出的那批。",
      },
    },
  ],
  sleep: [
    {
      q: {
        en: "How does the page discuss sleep without making treatment claims?",
        zh: "页面怎么谈睡眠又不构成治疗宣称？",
      },
      a: {
        en: "It talks about routine and environment rather than about a condition. Wind-down habits, light, and timing are legitimate subjects; insomnia as something the product addresses is not, and the difference is exactly where these pages get flagged.",
        zh: "谈作息与环境，不谈病症。睡前习惯、光线、时间安排都是可以讲的；把失眠说成产品能解决的问题就不行——这条界线正是这类页面被判违规的地方。",
      },
    },
    {
      q: {
        en: "What does the sleep assessment need to be useful rather than generic?",
        zh: "睡眠评估要做到什么程度才不流于泛泛？",
      },
      a: {
        en: "Bedtime, wake time, what happens in the hour before bed, and caffeine timing. Four specifics produce a reply that could only have been written for that person, which is the entire reason to offer an assessment instead of a discount.",
        zh: "入睡时间、起床时间、睡前一小时在做什么、咖啡因摄入时间。四个具体信息就能产出一条只可能是写给这个人的回复——这正是提供评估而不是折扣的全部意义。",
      },
    },
  ],
  joint: [
    {
      q: {
        en: "This audience skews older — what does that change on the page?",
        zh: "这个受众偏年长，页面要因此改什么？",
      },
      a: {
        en: "Type size, contrast, and tap target size stop being polish and become conversion factors. Phone as a contact option matters more here than in almost any other product category, and long uninterrupted paragraphs cost you more readers than they would elsewhere.",
        zh: "字号、对比度和点击区域不再是打磨细节，而是转化因素。电话作为联系方式在这里比几乎任何其他品类都重要，而长段落不分行流失的读者也比别处更多。",
      },
    },
    {
      q: {
        en: "Can the page mention specific joint conditions?",
        zh: "页面可以提到具体的关节疾病吗？",
      },
      a: {
        en: "Naming a condition the product is for is a treatment claim in most markets. The template stays on mobility and daily activity — being able to climb stairs or garden again describes the same benefit without asserting a medical effect.",
        zh: "在多数市场，指名某种疾病说产品「针对」它，就构成治疗宣称。模板只谈活动能力与日常——能重新爬楼梯、能重新侍弄花园，描述的是同一件事，却没有主张医疗效果。",
      },
    },
  ],
  "womens-health": [
    {
      q: {
        en: "Why does this template carry the strictest disclaimers of the supplement set?",
        zh: "为什么这套模板的免责声明是保健系列里最严的？",
      },
      a: {
        en: "Because the topics sit closest to regulated medical territory, and several of them are restricted advertising categories in their own right. The template keeps the language on wellness and routine, and puts qualifiers next to every statement rather than pooling them in the footer.",
        zh: "因为这些话题离受监管的医疗范畴最近，其中几项本身就是广告受限类目。模板把措辞控制在健康与日常层面，并把限定语放在每一处表述旁边，而不是全部堆在页脚。",
      },
    },
    {
      q: {
        en: "How should the page handle a sensitive subject without being coy?",
        zh: "敏感话题怎么处理才不至于遮遮掩掩？",
      },
      a: {
        en: "Name the subject plainly and keep the claims narrow. Euphemism reads as embarrassment and loses the trust the page needs; overreach loses the account. Plain language about what the product is, with the outcome discussion moved into the private assessment, does both jobs.",
        zh: "把话题直白说清楚，把宣称收窄。含糊其辞读起来像难为情，会丢掉页面最需要的信任；说过头则会丢掉账户。用平实的语言讲清产品是什么，把效果讨论移进私下的评估里，两件事就都办到了。",
      },
    },
  ],

  // ---------- toys-baby ----------
  "educational-toy": [
    {
      q: {
        en: "How specific should the developmental claims be?",
        zh: "发育相关的说法该写多具体？",
      },
      a: {
        en: "Name the skill and the age band, and stop there. 'Builds fine motor control, 3–5' is checkable and useful; 'boosts intelligence' is neither, and it is the kind of claim that both parents and ad reviewers have learned to distrust.",
        zh: "点明能力和年龄段，到此为止。「锻炼精细动作，3–5 岁」可核实也有用；「开发智力」两者都不是——家长和广告审核都已经学会不信这种说法。",
      },
    },
    {
      q: {
        en: "Is the age-based recommendation worth the extra step?",
        zh: "「按年龄推荐」这一步值得加吗？",
      },
      a: {
        en: "In this category it is the whole conversion. A parent who states the child's age has given you the one variable that determines the recommendation, and a gift buyer who does not know it has told you they need help — both are better outcomes than a browse.",
        zh: "在这个类目里它就是转化本身。说出孩子年龄的家长，交出的正是决定推荐结果的那个变量；而不知道年龄的送礼者，等于告诉你他需要帮助——两种结果都好过一次浏览。",
      },
    },
  ],
  fidget: [
    {
      q: {
        en: "Sensory toys are often bought for a diagnosed need — how does the page handle that?",
        zh: "感统玩具常因确诊需求而买，页面怎么处理？",
      },
      a: {
        en: "It describes what the toy does — texture, resistance, repetition — without claiming it addresses a condition. Parents in this situation are well informed and translate accurately; a page that overclaims loses their trust immediately and risks the health-claim line.",
        zh: "只描述玩具本身做了什么——材质、阻力、重复动作——不宣称它能应对某种状况。这类家长信息充分，自己会准确对应；说过头的页面会立刻失去他们的信任，还可能踩到健康宣称的红线。",
      },
    },
    {
      q: {
        en: "Should the page target parents or adult buyers?",
        zh: "页面该面向家长还是成年买家？",
      },
      a: {
        en: "Both convert here, and they want different proof — parents want safety and age fit, adults want durability and discretion at a desk. The template keeps safety high on the page for the first group and puts use context in the chat for the second.",
        zh: "两类都能转化，但要的佐证不同——家长看安全与年龄适配，成年买家看耐用度和办公桌上用是否低调。模板把安全信息放在页面靠上位置服务前者，把使用场景留给聊天服务后者。",
      },
    },
  ],
  "baby-care": [
    {
      q: {
        en: "What certifications belong above the fold on a feeding page?",
        zh: "喂养类页面首屏该放哪些认证？",
      },
      a: {
        en: "Material safety for anything that touches the mouth, and the standard it was tested to. Parents check this before they read a single benefit, and putting it below the product photos is the most common structural mistake in this category.",
        zh: "任何入口接触材料的安全认证，以及依据的检测标准。家长在读任何一条卖点之前就会先确认这些，把它放在产品图下方是这个类目最常见的结构性错误。",
      },
    },
    {
      q: {
        en: "How does the feeding-stage advice qualify a lead?",
        zh: "「喂养阶段建议」如何起到筛选作用？",
      },
      a: {
        en: "Stage is the whole recommendation — newborn, weaning, and toddler need different products entirely. A parent who states the stage has qualified themselves into a product set and told you when they will need the next one.",
        zh: "阶段就是推荐本身——新生儿、辅食期、幼儿期需要的完全是不同产品。说出阶段的家长既把自己筛进了某个产品组，也顺带告诉了你下一次需求什么时候到。",
      },
    },
  ],
  maternity: [
    {
      q: {
        en: "Pregnancy is a sensitive advertising category — what does the template avoid?",
        zh: "孕产是敏感投放类目，模板刻意避开了什么？",
      },
      a: {
        en: "Anything implying a health outcome for mother or baby, and anything that assumes the pregnancy will proceed a particular way. Comfort and practicality are safe subjects; medical benefit is not, and the assumption of a happy outcome is a real cruelty risk as well as a compliance one.",
        zh: "任何暗示对母婴健康有作用的表述，以及任何默认孕程会如何发展的措辞。舒适与实用是安全话题，医疗获益不是；而默认「一定会顺利」除了合规风险，也是一种真实的冒犯风险。",
      },
    },
    {
      q: {
        en: "Should the page segment by trimester?",
        zh: "页面要按孕期阶段分吗？",
      },
      a: {
        en: "Yes — needs change completely between them, and a visitor who states which one they are in has given you both a recommendation and a timeline. It is also the least intrusive qualifying question available in this category.",
        zh: "要——各阶段的需求完全不同，说出自己处于哪个阶段的访客，同时给了你推荐依据和时间线。这也是这个类目里最不冒犯的一个筛选问题。",
      },
    },
  ],
  "outdoor-toy": [
    {
      q: {
        en: "What safety information does an outdoor toy page need that an indoor one doesn't?",
        zh: "户外玩具页比室内玩具页多需要哪些安全信息？",
      },
      a: {
        en: "Supervision guidance, weight and height limits, surface requirements, and weather durability. Outdoor play carries fall risk, so a page that skips the limits reads as careless to exactly the cautious parent who was your best prospect.",
        zh: "看护提示、承重与身高限制、场地要求、耐候性。户外玩耍有跌落风险，一张略过这些限制的页面，在最谨慎、也最优质的那位家长眼里就是不上心。",
      },
    },
    {
      q: {
        en: "How does seasonality affect this template?",
        zh: "季节性对这套模板有什么影响？",
      },
      a: {
        en: "Demand swings hard, so the activity advice is the part to rotate — same page, different suggested activity by season. Rebuilding the page each spring wastes whatever ranking the previous one accumulated.",
        zh: "需求波动很大，要轮换的是「活动建议」那一块——同一张页面，按季节换推荐的活动。每年春天重做一次页面，会把上一版攒下的排名一起丢掉。",
      },
    },
  ],

  // ---------- b2b ----------
  "b2b-sourcing": [
    {
      q: {
        en: "What makes an RFQ engineer-ready rather than just a message?",
        zh: "什么样的询价单才算「工程可读」而不只是一条留言？",
      },
      a: {
        en: "Specification, quantity, target price band, destination, and timeline. With those five an engineer can quote; missing any one of them turns the first reply into a questionnaire, and every round-trip loses buyers to the supplier who could answer immediately.",
        zh: "规格、数量、目标价格区间、目的地、时间。有这五项工程师就能报价；缺任何一项，第一次回复就变成了问卷——而每多一轮往返，就有买家转向那个能立刻答上来的供应商。",
      },
    },
    {
      q: {
        en: "Should the page show factory photos or certifications first?",
        zh: "页面该先放工厂照片还是先放认证？",
      },
      a: {
        en: "Certifications with their actual numbers, then the factory. A number can be verified and a photo cannot, and buyers who have been burned by sourcing platforms check the verifiable thing first.",
        zh: "先放带编号的认证，再放工厂。编号可核实，照片不能——而被采购平台坑过的买家，第一件事就是去核实那个可核实的东西。",
      },
    },
  ],
  "saas-demo": [
    {
      q: {
        en: "Should the demo be gated behind a form or bookable directly?",
        zh: "演示该用表单预约还是直接开放日程？",
      },
      a: {
        en: "Direct booking converts better and qualifies worse. This template uses a form because a 30-minute live session is expensive to staff — a few qualifying fields buy back more sales time than they cost in submissions.",
        zh: "直接开放日程转化更高、筛选更差。这套模板用表单，是因为 30 分钟的真人演示成本很高——几个资格字段省下的销售时间，多过它损失的提交量。",
      },
    },
    {
      q: {
        en: "What belongs on a demo page that a product page wouldn't have?",
        zh: "演示预约页比产品页多需要什么？",
      },
      a: {
        en: "What happens in the 30 minutes. Naming the agenda, who will be on the call, and what the prospect should have ready removes the main reason demos get booked and then skipped.",
        zh: "写清这 30 分钟里会发生什么。列出流程、谁会出席、对方需要准备什么——这能消除演示「约了却不来」的主要原因。",
      },
    },
  ],
  "industrial-equipment": [
    {
      q: {
        en: "Machinery sales cycles run months — what is this page realistically for?",
        zh: "设备销售周期以月计，这张页面现实中是干什么用的？",
      },
      a: {
        en: "Getting into the evaluation, not closing it. The configuration enquiry puts you in the shortlist conversation early, which in a long cycle is worth more than any on-page persuasion could be.",
        zh: "是为了进入评估，而不是完成评估。配置咨询让你在早期就进入候选名单的讨论——在一个长周期里，这比页面上任何说服都更有价值。",
      },
    },
    {
      q: {
        en: "How much specification detail should the page publish?",
        zh: "页面该公开多少规格细节？",
      },
      a: {
        en: "Enough for an engineer to rule you in or out — capacity, tolerances, footprint, power. Withholding those wastes both parties' time, and an engineer who cannot check fit will simply move to a supplier whose numbers are visible.",
        zh: "足够让工程师判断「行还是不行」——产能、公差、占地、功率。藏着这些是在浪费双方时间；一个没法核对适配性的工程师，会直接转向那个把数字摆出来的供应商。",
      },
    },
  ],
  "custom-packaging": [
    {
      q: {
        en: "Why does the template convert on a mock-up rather than a quote?",
        zh: "为什么这套模板的转化点是打样而不是报价？",
      },
      a: {
        en: "Because packaging buyers are choosing a partner they will iterate with, and a mock-up demonstrates that relationship in a way a number cannot. It also filters hard — a brand willing to send artwork is materially more serious than one asking for a price list.",
        zh: "因为包装买家挑的是一个要反复打磨的合作方，而打样能展示这段关系，报价数字不能。它的筛选力也很强——愿意把设计稿发过来的品牌，比只问价目表的认真得多。",
      },
    },
    {
      q: {
        en: "What should the enquiry form ask about artwork?",
        zh: "询价表单该怎么问设计稿？",
      },
      a: {
        en: "Format, dimensions, colour count, and finish — and whether artwork exists at all. Brands without print-ready files are a different service conversation entirely, and finding that out on the form rather than on the third email saves everyone a week.",
        zh: "格式、尺寸、颜色数、工艺——以及到底有没有设计稿。没有可印刷文件的品牌，需要的是另一种服务对话；在表单里问清楚而不是在第三封邮件里发现，能给双方省下一周。",
      },
    },
  ],
  "freight-forwarding": [
    {
      q: {
        en: "Rates change constantly — should the page publish any?",
        zh: "运价一直在变，页面上要不要放价格？",
      },
      a: {
        en: "No, and shippers do not expect it. What they do expect is lane coverage, typical transit times, and which customs documentation you handle — publish those and the rate conversation starts from a position of competence.",
        zh: "不要，货主也不指望页面上有。他们真正期待的是航线覆盖、常规时效，以及你能代办哪些清关文件——把这些放出来，运价谈判一开始就站在专业的位置上。",
      },
    },
    {
      q: {
        en: "Why is this template set up for WhatsApp rather than a form?",
        zh: "为什么这套模板预设走 WhatsApp 而不是表单？",
      },
      a: {
        en: "Because freight is negotiated, not ordered. Rates, space, and timing move within a day, and shippers are used to settling them in chat — a form that promises a reply tomorrow is quoting on conditions that will have changed.",
        zh: "因为货运是谈出来的，不是下单下出来的。运价、舱位和时间一天之内就会变，货主也习惯在聊天里敲定——一张承诺「明天回复」的表单，报的是已经过时的条件。",
      },
    },
  ],

  // ---------- education ----------
  "study-abroad": [
    {
      q: {
        en: "What does the free course shortlist need to be credible?",
        zh: "「免费选校清单」怎么做才可信？",
      },
      a: {
        en: "Real entry requirements, honest odds, and at least one option the student can actually get into. A shortlist of reaches reads as a sales document; including a realistic choice is what makes the ambitious ones believable.",
        zh: "真实的入学要求、诚实的把握程度，以及至少一个学生确实够得着的选项。一份全是冲刺校的清单读起来就是销售材料；放进一个现实的选择，才让那些冲刺选项显得可信。",
      },
    },
    {
      q: {
        en: "Should the page name specific universities and outcomes?",
        zh: "页面要不要写出具体大学和录取结果？",
      },
      a: {
        en: "Name destinations with the year and the student's starting profile. Placements without context are unverifiable and read as decoration; a placement with a starting GPA and an intake year is evidence a reader can measure themselves against.",
        zh: "写清录取院校、年份和学生的起始背景。没有上下文的录取案例无法核实，读起来只是装饰；带起始成绩和入学年份的案例，才是读者能拿自己去比对的证据。",
      },
    },
  ],
  "language-training": [
    {
      q: {
        en: "Why does the template lead with a free level test?",
        zh: "为什么模板以免费分级测试开场？",
      },
      a: {
        en: "Because it is the rare offer that is genuinely useful whether or not the person enrols, which is what makes it convert. It also gives you the one number the whole follow-up depends on — a study plan without a starting level is guesswork.",
        zh: "因为它是少数几个「不管报不报名都真有用」的钩子，正因如此才转化得动。它也给了你后续跟进最依赖的那个数字——没有起始水平的学习计划就是猜。",
      },
    },
    {
      q: {
        en: "Can the page publish score improvement figures?",
        zh: "页面可以公布提分数据吗？",
      },
      a: {
        en: "With the starting point attached, yes — '5.5 to 7.0 over twelve weeks' is a claim you can support. A bare 'improve 1.5 bands' guarantees a result you do not control, and guaranteed-score language is a common cause of rejection in this category.",
        zh: "写明起点就可以——「12 周从 5.5 到 7.0」是能站得住的表述。光写「提升 1.5 分」等于承诺一个你无法掌控的结果，而「保分」类措辞是这个类目常见的拒审原因。",
      },
    },
  ],
  "online-skills": [
    {
      q: {
        en: "This is flagged high risk — what triggers that in a course page?",
        zh: "这套被标为高风险，课程页面的风险点在哪？",
      },
      a: {
        en: "Income and employment claims. Naming a salary, a hiring rate, or a job guarantee moves the page into a heavily policed category in most markets. The template converts on an advisor call and a track recommendation instead, which lets the earning conversation happen where it can be qualified.",
        zh: "收入与就业承诺。写出薪资、就业率或「保就业」，会把页面推进多数市场重点监管的类目。模板改以顾问通话与方向推荐作为转化点，把收入话题留到能够逐人确认的地方。",
      },
    },
    {
      q: {
        en: "Career changers are the audience — what do they need to see?",
        zh: "受众是转行者，他们需要看到什么？",
      },
      a: {
        en: "That someone with their starting point finished. Time commitment per week, what the first month looks like, and whether it works alongside a job matter more than the curriculum — the fear is not that the course is bad, it is that they will not finish it.",
        zh: "看到「和我起点相同的人真的读完了」。每周需要投入多少时间、第一个月是什么样、能不能和现有工作并行，比课程大纲更重要——他们怕的不是课程不好，是自己坚持不下来。",
      },
    },
  ],
  "k12-tutoring": [
    {
      q: {
        en: "The parent decides but the child attends — who does the page address?",
        zh: "家长做决定、孩子上课，页面该写给谁？",
      },
      a: {
        en: "The parent, throughout. Results, safety, and the tutor's credentials carry the decision here, and this is the education segment that skews furthest toward the payer. The child's experience matters, but as reassurance to the parent rather than as the pitch.",
        zh: "全篇写给家长。成绩、安全和老师资历决定购买，这是教育里最偏向付费方的一个细分。孩子的体验当然重要，但它的作用是让家长安心，而不是作为主卖点。",
      },
    },
    {
      q: {
        en: "Why is the free assessment run over WhatsApp here?",
        zh: "为什么这里的免费评估走 WhatsApp？",
      },
      a: {
        en: "Because parents send a photo of the last test paper, and that single image does more diagnosis than a form ever could. It also starts the relationship in the channel where the ongoing tutor updates will live.",
        zh: "因为家长会直接拍一张最近的卷子发过来，这一张图的诊断价值胜过任何表单。它也让这段关系从一开始就落在后续辅导反馈会用的那个渠道里。",
      },
    },
  ],

  // ---------- legal ----------
  "immigration-law": [
    {
      q: {
        en: "Why is this template form-only rather than chat-first?",
        zh: "为什么这套模板以表单为主而不是聊天优先？",
      },
      a: {
        en: "Case facts need to be written down, and a written assessment is the deliverable. A chat invites piecemeal disclosure and an off-the-cuff answer, which in a regulated practice is exactly the exposure the structure exists to avoid.",
        zh: "案件事实需要落成文字，而书面评估本身就是交付物。聊天会导致信息零碎地给出、答复脱口而出——在受监管的执业环境里，这正是这套结构要避免的风险敞口。",
      },
    },
    {
      q: {
        en: "How does the page stay clear of giving advice?",
        zh: "页面怎么做到不构成提供法律意见？",
      },
      a: {
        en: "It collects facts and promises an assessment, never a conclusion. There is no eligibility calculator and no outcome estimate on the page — a published verdict would be advice given to an unidentified person on unverified facts, which is the worst version of both problems.",
        zh: "它只收集事实并承诺给出评估，从不给结论。页面上没有资格计算器，也没有结果预估——公开给出判断，等于在事实未经核实的情况下向一个身份不明的人提供意见，是两个问题里最糟的组合。",
      },
    },
  ],

  "windows-doors": [
    {
      q: {
        en: "Why does this template refuse to quote from photos?",
        zh: "为什么这套模板拒绝「看照片报价」？",
      },
      a: {
        en: "Because a photo cannot show the state of the frame, the sill, or the reveal — and those decide whether the job is a swap or a rebuild. Quoting from images produces a number you have to revise on the day, which is the single fastest way to lose a homeowner who was ready to book.",
        zh: "因为照片看不出框、窗台和洞口的实际状况，而这三样决定了这活儿是「换一扇」还是「重做一个洞」。看图报价产出的是一个装修当天必须修改的数字——这是让一个本来准备下单的业主流失最快的方式。",
      },
    },
    {
      q: {
        en: "The page states a lead time but no price. Isn't that backwards?",
        zh: "页面写了工期却不写价格，不是反了吗？",
      },
      a: {
        en: "Lead time is a fact about your operation and it answers a real question. Price depends on the openings, the glazing spec, and the state of what is already there — publishing one number for all of that either loses you margin or loses you trust when it changes. The template publishes what is fixed and quotes what is not.",
        zh: "工期是关于你自己经营的事实，而且回答的是一个真实问题。价格取决于开口数量、玻璃规格和现有窗的状况——为这些公布一个统一数字，要么损失利润，要么在改价时损失信任。模板的做法是：确定的公开，不确定的报价。",
      },
    },
  ],
  "family-law": [
    {
      q: {
        en: "Why does the form ask people to write it out instead of offering a callback?",
        zh: "为什么表单让人写下来，而不是直接给回拨？",
      },
      a: {
        en: "Because most people contacting a family solicitor are not ready to say it out loud to a stranger, and a callback asks them to do exactly that. Writing it once also means the solicitor arrives at the conversation already knowing the facts, so the consultation is spent on options rather than on background.",
        zh: "因为多数联系家事律师的人，还没准备好对一个陌生人开口讲这件事，而回拨恰恰是在要求他这么做。写一次也让律师在通话前就掌握了事实，于是那次咨询花在「有哪些选择」上，而不是花在复述背景上。",
      },
    },
    {
      q: {
        en: "Doesn't saying 'we raise mediation first' cost you the bigger cases?",
        zh: "写「我们先谈调解」不会把大案子推走吗？",
      },
      a: {
        en: "It costs you some litigation work and buys the trust that makes the rest of the page believable. In a category where every competitor promises to fight for you, being the practice that says when a fight is disproportionate is the only differentiator that cannot be copied by writing better copy.",
        zh: "它会让你损失一部分诉讼业务，换来的是让页面其余内容变得可信的那份信任。在一个人人都承诺「为你力争」的品类里，敢说「这一仗不值得打」的那家，是唯一一个靠改文案抄不走的差异点。",
      },
    },
  ],

  // ---------- local-service ----------
  "home-cleaning": [
    {
      q: {
        en: "Why does the template ask for photos instead of square footage?",
        zh: "为什么模板让客户发照片而不是问面积？",
      },
      a: {
        en: "Because condition drives the price more than size does, and customers estimate area badly. A photo lets you quote accurately the first time, which is what stops the awkward revision on the doorstep.",
        zh: "因为决定价格的是脏污程度而不是面积，而客户估面积普遍不准。一张照片能让你第一次就报准价，也就避免了上门后再改价的尴尬。",
      },
    },
    {
      q: {
        en: "Should the page publish prices?",
        zh: "页面上要不要标价格？",
      },
      a: {
        en: "A starting range, yes — cleaning is a category where people expect one and its absence reads as evasive. A fixed price, no: it commits you before you have seen the condition the photos exist to reveal.",
        zh: "标一个起步价区间可以——保洁是客户预期看到价格的类目，不写反而显得回避。但不要标死价：那等于在看到照片所要揭示的实际状况之前就把自己锁死了。",
      },
    },
  ],
  moving: [
    {
      q: {
        en: "A video walk-through is a big ask — why does it convert?",
        zh: "让客户拍视频是个不小的要求，为什么反而能转化？",
      },
      a: {
        en: "Because it buys the customer a fixed quote, which is the thing they actually want. Movers are distrusted for on-the-day price rises, so trading two minutes of filming for a number that will not move is a good deal from the customer's side.",
        zh: "因为它换来的是一个固定报价，而这正是客户真正想要的。搬家行业最被诟病的就是当天加价，用两分钟拍摄换一个不会变的数字，从客户角度看很划算。",
      },
    },
    {
      q: {
        en: "What qualifies a moving lead beyond the date?",
        zh: "除了日期，搬家线索还要问什么才算合格？",
      },
      a: {
        en: "Access at both ends — floor, lift, parking, and stairs. Those four decide crew size and hours, and they are the reason two moves of identical volume can differ by half the price.",
        zh: "两端的搬运条件——楼层、有无电梯、停车、楼梯。这四项决定人手和工时，也是两单体积相同的搬家能差出一半价钱的原因。",
      },
    },
  ],
  hvac: [
    {
      q: {
        en: "Why is this the only local template that leads with phone?",
        zh: "为什么本地服务里只有这套以电话为主？",
      },
      a: {
        en: "Because the traffic is an emergency. Someone with no heating in winter is not filling in a form — they are calling whoever answers, and a page that buries the number behind a contact form loses the job to whoever did not.",
        zh: "因为这批流量是急单。冬天家里没暖气的人不会填表——他会打给第一个接起来的人；把号码藏在联系表单后面的页面，会把这一单输给那个没藏的同行。",
      },
    },
    {
      q: {
        en: "What should the page say about same-day availability?",
        zh: "页面该怎么写「当天可上门」？",
      },
      a: {
        en: "Only what you can honour, with the hours attached. Promising same-day and missing it turns an emergency customer into a public review, and this is the category where those reviews do the most damage.",
        zh: "只写你兑现得了的，并注明服务时段。承诺当天却做不到，会把一个急单客户变成一条公开差评——而这个类目里，这种差评的杀伤力最大。",
      },
    },
  ],
  roofing: [
    {
      q: {
        en: "Why is the photo report the offer rather than the inspection itself?",
        zh: "为什么钩子是「照片报告」而不是「免费检查」本身？",
      },
      a: {
        en: "Because a free inspection sounds like a sales visit and a photo report sounds like information. The homeowner gets something they keep either way, which lowers the perceived commitment of letting a contractor onto the roof.",
        zh: "因为「免费检查」听起来像上门推销，「照片报告」听起来像信息。无论最后成不成交，业主都拿到了能留下的东西——这降低了让施工方上屋顶的心理门槛。",
      },
    },
    {
      q: {
        en: "Storm damage drives demand — should the page reference it?",
        zh: "风暴受损会带来需求，页面要不要提？",
      },
      a: {
        en: "Reference the situation, not a specific event you are chasing. Insurance-claim language in particular needs care: describing what you do to support a claim is fine, implying an outcome with an insurer is not.",
        zh: "可以提这类情形，但不要追着某一次具体事件写。保险理赔相关的措辞尤其要谨慎：说明你能如何协助理赔没问题，暗示能左右保险公司的结论就不行。",
      },
    },
  ],
  landscaping: [
    {
      q: {
        en: "What makes the free site visit worth a homeowner's time?",
        zh: "免费上门看现场，对业主的价值在哪？",
      },
      a: {
        en: "The concept plan they keep. A visit that produces only a price is a sales call; a visit that produces a sketch of what the space could become is a service, and the homeowner who has seen that sketch is comparing on design rather than on quote.",
        zh: "在于他能留下的那份概念方案。只产出一个价格的上门是推销；产出一张「这块地能变成什么样」草图的上门是服务——看过草图的业主，比的是设计而不是报价。",
      },
    },
    {
      q: {
        en: "Should the portfolio show finished gardens or the work in progress?",
        zh: "案例该展示完工的花园还是施工过程？",
      },
      a: {
        en: "Both, paired. Finished shots sell the outcome, progress shots prove you did it — and in a trade where photos are routinely borrowed, being able to show the middle is what separates you from the portfolio that came off the internet.",
        zh: "成对展示。完工图卖的是结果，施工图证明的是「确实是你做的」——在一个盗图成风的行当里，能拿出中间过程，正是你和网上扒来的案例集的区别。",
      },
    },
  ],

  // ---------- medical ----------
  dental: [
    {
      q: {
        en: "What can a free smile assessment promise without over-committing?",
        zh: "免费微笑评估能承诺到什么程度而不过度承诺？",
      },
      a: {
        en: "A written opinion on suitability and the likely options, not a treatment plan or a price. Suitability is answerable from photos; anything beyond it needs an examination, and promising more on the page is a commitment your clinician has to unwind in the chair.",
        zh: "可以承诺一份关于「是否适合」以及可能方案的书面意见，但不是治疗方案，也不是价格。适合与否可以从照片判断；再往前都需要面诊，页面上多承诺的部分，最后要靠医生在椅位上收场。",
      },
    },
    {
      q: {
        en: "Should this page cover the whole clinic or one procedure?",
        zh: "这张页面该讲整个诊所还是单个术式？",
      },
      a: {
        en: "One procedure. A visitor searching for implants and landing on a general clinic page has to work out whether you do implants at all, and that friction costs more than the extra pages cost to run — the paid plans hold several under one clinic domain.",
        zh: "讲单个术式。搜种植牙却落到诊所综合页的访客，还得自己判断你到底做不做种植——这点摩擦的代价，高过多做几张页的成本；付费档本来就支持同一诊所域名下挂多张。",
      },
    },
  ],
  "hair-transplant": [
    {
      q: {
        en: "Patients send photos — what does the page need to say about them?",
        zh: "患者要发照片，页面上得怎么交代？",
      },
      a: {
        en: "What to photograph, and what happens to the images afterwards. Hairline photos are identifiable medical information; stating who sees them and how they are stored raises submission rates and is in most markets an obligation rather than a courtesy.",
        zh: "说清要拍什么，以及照片之后怎么处理。发际线照片属于可识别的医疗信息；写明谁会看到、如何保存，既能提高提交率，在多数市场也是义务而非客套。",
      },
    },
    {
      q: {
        en: "Can the page show graft counts and results?",
        zh: "页面可以放毛囊单位数和效果图吗？",
      },
      a: {
        en: "Graft counts with the case context, yes — they are factual and clinically meaningful. Results imagery is the restricted part: dramatic before-and-afters are a frequent rejection cause, and the written assessment is where individual outcomes belong.",
        zh: "带案例背景的毛囊数可以——那是事实，也有临床意义。受限的是效果图：戏剧化的前后对比是常见拒审原因，个体效果应该留在书面评估里谈。",
      },
    },
  ],
  "medical-aesthetics": [
    {
      q: {
        en: "Why does the template route everything through a doctor-led consultation?",
        zh: "为什么模板把一切都导向医生面诊？",
      },
      a: {
        en: "Because it is both the compliant structure and the converting one. Aesthetic outcomes are individual, so a page that promises a look is over-committing; a page that offers an assessment by a named clinician is selling the thing patients are actually choosing between clinics on.",
        zh: "因为它既是合规的结构，也是转化更好的结构。医美效果因人而异，承诺某种外观就是过度承诺；提供一位具名医生的评估，卖的恰恰是患者在各家诊所之间真正比较的东西。",
      },
    },
    {
      q: {
        en: "How should pricing be handled for aesthetic procedures?",
        zh: "医美项目的价格怎么处理？",
      },
      a: {
        en: "A starting range if your market expects it, never a package price. Aesthetic work is quoted per face, and a headline price attracts the patient shopping on cost — statistically the least satisfied and the most likely to review badly.",
        zh: "如果所在市场习惯看到价格，可以给起步区间，但绝不要给套餐价。医美是按每个人的情况报价的，标题价吸引来的是按价格挑的患者——统计上满意度最低、最容易给差评的那一批。",
      },
    },
  ],
  fertility: [
    {
      q: {
        en: "This is an emotionally heavy category — what does the copy avoid?",
        zh: "这是情绪负担很重的类目，文案要避开什么？",
      },
      a: {
        en: "Success-rate headlines and any language that implies a guarantee. Patients here are well informed and have usually been disappointed before; a clinic that leads with a percentage reads as selling hope, which is the fastest way to lose the ones who have learned to be careful.",
        zh: "避开成功率大标题，以及任何暗示保证的措辞。这里的患者信息充分，多数也已经失望过；用一个百分比开场的诊所读起来像在兜售希望——这是失去那些已经学会谨慎的人最快的方式。",
      },
    },
    {
      q: {
        en: "Why does the template offer both form and phone?",
        zh: "为什么模板同时提供表单和电话？",
      },
      a: {
        en: "Because the choice is itself a kindness. Some patients need to write it down privately and some need to hear a person; forcing either group into the other channel loses them at the hardest possible moment to ask for help.",
        zh: "因为「可以选」本身就是一种体贴。有些患者需要私下把情况写下来，有些需要听到一个真人的声音；强迫任何一方走另一条渠道，都会在他们最难开口求助的时刻把人弄丢。",
      },
    },
  ],
  "vision-correction": [
    {
      q: {
        en: "This is the only comparison-style medical template — why here?",
        zh: "医疗类里只有这套用对比范式，为什么？",
      },
      a: {
        en: "Because the patient's real question is which procedure, not which clinic. Someone weighing LASIK against lens options is comparing anyway; a page that lays out the three honestly captures that decision instead of pretending it is not happening.",
        zh: "因为患者真正的问题是「做哪种术式」，而不是「选哪家诊所」。在激光与晶体方案之间权衡的人本来就在比较；一张诚实摊开三种方案的页面，接住了这个决策，而不是假装它不存在。",
      },
    },
    {
      q: {
        en: "Doesn't naming procedures you don't offer lose business?",
        zh: "把自己不做的术式也写上，不会流失客户吗？",
      },
      a: {
        en: "It loses the patients who were never suitable and wins the ones who now trust the recommendation. A comparison that always concludes in favour of what you happen to sell is transparent to a patient who has read three other clinic pages that afternoon.",
        zh: "流失的是本来就不适合的患者，赢得的是从此相信你推荐的那些人。一张永远得出「正好是我们做的这个」的对比表，在一个下午已经读过三家诊所页面的患者眼里一望即穿。",
      },
    },
  ],
  solar: [
    {
      q: {
        en: "Can the page publish a savings figure?",
        zh: "页面可以写节省金额吗？",
      },
      a: {
        en: "Only as an illustration with its assumptions stated — system size, usage, tariff, and location. A headline saving with nothing behind it is the fastest way to lose both trust and ad approval in this category, and it sets up a survey that starts with a correction.",
        zh: "只能作为示例，并写明假设条件——系统规模、用电量、电价、地区。一个背后没有依据的节省额标题，是这个类目里同时失去信任和广告审核的最快方式，而且会让上门勘测从「先纠正预期」开始。",
      },
    },
    {
      q: {
        en: "What single question disqualifies the most solar leads?",
        zh: "哪一个问题能筛掉最多不合格的太阳能线索？",
      },
      a: {
        en: "Whether they own the property. A tenant cannot commission an installation at any price, and asking on the form costs a few submissions while saving every survey that was never going to convert.",
        zh: "「房子是不是你的」。租客无论如何都无权委托安装；在表单里问一句会损失几条提交，却能省下所有本来就不可能成交的上门勘测。",
      },
    },
  ],
};
