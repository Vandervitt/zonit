"use client";

import { useEffect, useState } from "react";
import {
  ArrowRight,
  Award,
  Calendar,
  Check,
  CheckCircle2,
  Clock,
  Mail,
  MessageCircle,
  Phone,
  Shield,
  Star,
  type LucideIcon,
} from "lucide-react";
import templateJson from "@/lib/template-extraction/beauty-template.json";
import type { CallToAction, IconType } from "@/types/schema";
import type {
  AssuranceContent,
  AuthorityContent,
  BeforeAfterContent,
  CountdownContent,
  ExtractedTemplate,
  FaqContent,
  FeaturesContent,
  FooterContent,
  HeroContent,
  HowItWorksContent,
  LogoWallContent,
  OfferContent,
  ProductShowcaseContent,
  ReviewsContent,
  StatsContent,
  StickyCtaContent,
  StyleMap,
  TrustBannerContent,
  VideoTestimonialsContent,
} from "./types";

const iconMap: Record<string, LucideIcon> = {
  WhatsApp: MessageCircle,
  Telegram: MessageCircle,
  Line: MessageCircle,
  Phone,
  Mail,
  ArrowRight,
  Check,
  Shield,
  Star,
  Verified: CheckCircle2,
  Secure: Shield,
  MessageCircle,
  Calendar,
  Clock,
  Award,
};

const extractedBeautyTemplate = templateJson as unknown as ExtractedTemplate;

type RendererProps = {
  template?: ExtractedTemplate;
};

type TimeLeft = {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
};

function cx(...classes: Array<string | undefined | false>) {
  return classes.filter(Boolean).join(" ");
}

function Icon({ type, className = "", size = 24 }: { type: IconType; className?: string; size?: number }) {
  const IconComponent = iconMap[type] || MessageCircle;
  return <IconComponent size={size} className={className} />;
}

function hrefForCta(cta: CallToAction) {
  const prefilledMessage = "prefilledMessage" in cta ? cta.prefilledMessage : undefined;

  switch (cta.destination.type) {
    case "whatsapp":
    case "telegram":
      return prefilledMessage
        ? `${cta.destination.url}?text=${encodeURIComponent(prefilledMessage)}`
        : cta.destination.url;
    case "line":
    case "booking":
    case "consultation_link":
      return cta.destination.url;
    case "phone":
      return `tel:${cta.destination.phone}`;
    case "email":
      return `mailto:${cta.destination.email}`;
    case "form":
      return `#${cta.destination.formId}`;
  }
}

function CtaButton({
  cta,
  styles,
  variant = "primary",
  size = "md",
  className,
}: {
  cta: CallToAction;
  styles: Record<string, StyleMap>;
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const ctaStyles = styles.ctaButton;
  const target = cta.target || "_blank";

  return (
    <a
      href={hrefForCta(cta)}
      target={target}
      rel={target === "_blank" ? "noopener noreferrer" : undefined}
      className={cx(ctaStyles.base, ctaStyles[variant], ctaStyles[size], className)}
    >
      {cta.icon && <Icon type={cta.icon} size={size === "lg" ? 24 : size === "md" ? 20 : 18} />}
      <span>{cta.text}</span>
    </a>
  );
}

function Hero({ data, style, styles }: { data: HeroContent; style: StyleMap; styles: Record<string, StyleMap> }) {
  return (
    <section className={style.section}>
      <img src={data.background.src} alt={data.background.alt} className={style.backgroundImage} />
      <div className={style.overlay} />
      <div className={style.container}>
        <div className={style.layoutWithMedia}>
          <div className={style.content}>
            {data.badge && (
              <div className={style.badgeWrapper}>
                <span className={style.badgeText}>{data.badge}</span>
              </div>
            )}
            <h1 className={style.title}>
              {data.title.split("\n").map((line, index, lines) => (
                <span key={line}>
                  {line}
                  {index < lines.length - 1 && <br />}
                </span>
              ))}
            </h1>
            <p className={style.subtitle}>{data.subtitle}</p>
            <div className={style.ctaRow}>
              <CtaButton cta={data.cta} styles={styles} variant="primary" size="lg" />
              {data.secondaryCta && <CtaButton cta={data.secondaryCta} styles={styles} variant="secondary" size="lg" />}
            </div>
            {data.trustText && <p className={style.trustText}>{data.trustText}</p>}
          </div>
          {data.media && (
            <div className={style.mediaWrapper}>
              <img src={data.media.src} alt={data.media.alt} className={style.mediaImage} />
              {data.stats && (
                <div className={style.statsGrid}>
                  {data.stats.map((stat) => (
                    <div key={stat.id} className={style.statCard}>
                      <div className={style.statIcon}>
                        {stat.icon && <Icon type={stat.icon} className="text-pink-600" size={24} />}
                      </div>
                      {stat.value && <div className={style.statValue}>{stat.value}</div>}
                      <div className={style.statLabel}>{stat.label}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function Stats({ data, style }: { data: StatsContent; style: StyleMap }) {
  return (
    <section className={style.section}>
      <div className={style.patternWrapper}>
        <div className={style.pattern} />
      </div>
      <div className={style.container}>
        <div className={style.header}>
          <h2 className={style.title}>{data.title}</h2>
          <p className={style.subtitle}>{data.subtitle}</p>
        </div>
        <div className={style.grid}>
          {data.items.map((stat) => (
            <div key={stat.id} className={style.card}>
              <div className={style.imageFrame}>
                <img src={stat.image.src} alt={stat.image.alt} className={style.image} />
              </div>
              <div className={style.content}>
                <div className={style.icon}>{stat.icon}</div>
                <div className={style.value}>{stat.value}</div>
                <div className={style.label}>{stat.label}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Offer({ data, style, styles }: { data: OfferContent; style: StyleMap; styles: Record<string, StyleMap> }) {
  return (
    <section className={style.section}>
      <div className={style.container}>
        <div className={style.header}>
          <h2 className={style.title}>{data.title}</h2>
          {data.subtitle && <p className={style.subtitle}>{data.subtitle}</p>}
        </div>
        <div className={style.grid}>
          {data.options.map((option) => (
            <div key={option.id} className={style.card}>
              {data.showImages && option.image && (
                <div className={style.imageFrame}>
                  <img src={option.image} alt={option.name} className={style.image} />
                </div>
              )}
              <div className={style.body}>
                <div className={style.topRow}>
                  <h3 className={style.name}>{option.name}</h3>
                  {option.badge && <span className={style.badge}>{option.badge}</span>}
                </div>
                <p className={style.description}>{option.description}</p>
                <ul className={style.list}>
                  {option.valueProps.map((prop: string) => (
                    <li key={prop} className={style.listItem}>
                      <span className={style.check}>✓</span>
                      <span className={style.valueProp}>{prop}</span>
                    </li>
                  ))}
                </ul>
                {option.urgencyText && <p className={style.urgency}>⚡ {option.urgencyText}</p>}
                <CtaButton cta={option.cta} styles={styles} variant="primary" size="md" className={style.buttonExtra} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function ProductShowcase({ data, style }: { data: ProductShowcaseContent; style: StyleMap }) {
  return (
    <section className={style.section}>
      <div className={style.container}>
        <div className={style.header}>
          <h2 className={style.title}>{data.title}</h2>
          <p className={style.subtitle}>{data.subtitle}</p>
        </div>
        <div className={style.grid}>
          {data.items.map((product) => (
            <div key={product.id} className={style.card}>
              <div className={style.imageFrame}>
                <img src={product.image.src} alt={product.image.alt} className={style.image} />
              </div>
              <div className={style.overlay}>
                <h3 className={style.name}>{product.title}</h3>
                <p className={style.description}>{product.description}</p>
              </div>
            </div>
          ))}
        </div>
        {data.note && (
          <div className={style.noteWrapper}>
            <p className={style.note}>{data.note}</p>
          </div>
        )}
      </div>
    </section>
  );
}

function BeforeAfter({ data, style }: { data: BeforeAfterContent; style: StyleMap }) {
  const [activeTab, setActiveTab] = useState(0);
  const active = data.items[activeTab] ?? data.items[0];

  if (!active) return null;

  return (
    <section className={style.section}>
      <div className={style.container}>
        <div className={style.header}>
          <h2 className={style.title}>{data.title}</h2>
          <p className={style.subtitle}>{data.subtitle}</p>
        </div>
        <div className={style.outer}>
          <div className={style.tabs}>
            {data.items.map((item, index) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveTab(index)}
                className={cx(style.tab, activeTab === index ? style.tabActive : style.tabInactive)}
              >
                {item.name}
              </button>
            ))}
          </div>
          <div className={style.panel}>
            <div className={style.imageGrid}>
              <div className={style.imageCell}>
                <div className={style.beforeBadge}>{data.labels.before}</div>
                <img src={active.before.src} alt={active.before.alt} className={style.image} />
              </div>
              <div className={style.imageCell}>
                <div className={style.afterBadge}>{data.labels.after}</div>
                <img src={active.after.src} alt={active.after.alt} className={style.image} />
              </div>
            </div>
            <div className={style.meta}>
              <div className={style.metaGrid}>
                <div>
                  <div className={style.metaLabel}>{data.labels.client}</div>
                  <div className={style.metaValue}>{active.name}</div>
                </div>
                <div>
                  <div className={style.metaLabel}>{data.labels.concern}</div>
                  <div className={style.metaValue}>{active.concern}</div>
                </div>
                <div>
                  <div className={style.metaLabel}>{data.labels.timeline}</div>
                  <div className={style.timelineValue}>{active.duration}</div>
                </div>
              </div>
            </div>
          </div>
          {data.disclaimer && (
            <div className={style.disclaimerWrapper}>
              <p className={style.disclaimer}>{data.disclaimer}</p>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function VideoTestimonials({
  data,
  style,
  styles,
}: {
  data: VideoTestimonialsContent;
  style: StyleMap;
  styles: Record<string, StyleMap>;
}) {
  return (
    <section className={style.section}>
      <div className={style.decorTop} />
      <div className={style.decorBottom} />
      <div className={style.container}>
        <div className={style.header}>
          <h2 className={style.title}>{data.title}</h2>
          <p className={style.subtitle}>{data.subtitle}</p>
        </div>
        <div className={style.grid}>
          {data.items.map((video) => (
            <div key={video.id} className={style.card}>
              <div className={style.frame}>
                <img src={video.thumbnail.src} alt={video.thumbnail.alt} className={style.image} />
                <div className={style.playOverlay}>
                  <div className={style.playCircle}>
                    <div className={style.playTriangle} />
                  </div>
                </div>
                <div className={style.duration}>{video.duration}</div>
                <div className={style.info}>
                  <h3 className={style.name}>{video.name}</h3>
                  <p className={style.itemTitle}>{video.title}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
        {(data.closingText || data.cta) && (
          <div className={style.closing}>
            {data.closingText && <p className={style.closingText}>{data.closingText}</p>}
            {data.cta && <CtaButton cta={data.cta} styles={styles} variant="primary" size="lg" />}
          </div>
        )}
      </div>
    </section>
  );
}

function HowItWorks({ data, style }: { data: HowItWorksContent; style: StyleMap }) {
  return (
    <section className={style.section}>
      <div className={style.container}>
        <div className={style.header}>
          <h2 className={style.title}>{data.title}</h2>
          {data.subtitle && <p className={style.subtitle}>{data.subtitle}</p>}
        </div>
        <div className={style.grid}>
          {data.steps.map((step, index) => (
            <div key={step.id} className={style.card}>
              <div className={style.content}>
                <div className={style.number}>{index + 1}</div>
                <div className={style.imageFrame}>
                  <img src={data.stepImages[index].src} alt={data.stepImages[index].alt} className={style.image} />
                </div>
                <div className={style.iconFrame}>
                  <Icon type={step.icon} className={style.icon} size={28} />
                </div>
                <h3 className={style.stepTitle}>{step.title}</h3>
                <p className={style.description}>{step.description}</p>
              </div>
              {index < data.steps.length - 1 && <div className={style.arrow}>→</div>}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function TrustBanner({ data, style }: { data: TrustBannerContent; style: StyleMap }) {
  return (
    <section className={style.section}>
      <div className={style.background}>
        <img src={data.background.src} alt={data.background.alt} className={style.backgroundImage} />
        <div className={style.overlay} />
      </div>
      <div className={style.container}>
        <div className={style.grid}>
          {data.badges.map((badge) => (
            <div key={badge.id} className={style.badge}>
              <div className={style.iconFrame}>
                <Icon type={badge.icon} className={style.icon} size={32} />
              </div>
              <div className={style.text}>{badge.text}</div>
              {badge.subtext && <div className={style.subtext}>{badge.subtext}</div>}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function LogoWall({ data, style }: { data: LogoWallContent; style: StyleMap }) {
  return (
    <section className={style.section}>
      <div className={style.container}>
        {data.title && <h3 className={style.title}>{data.title}</h3>}
        <div className={style.grid}>
          {data.logos.map((logo) => {
            const image = <img src={logo.src} alt={logo.alt} className={style.image} />;
            return logo.url ? (
              <a key={logo.id} href={logo.url} target="_blank" rel="noopener noreferrer" className={style.link}>
                {image}
              </a>
            ) : (
              <div key={logo.id}>{image}</div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function Features({ data, style }: { data: FeaturesContent; style: StyleMap }) {
  return (
    <section className={style.section}>
      <div className={style.decorTop}>
        <img src={data.decorations[0].src} alt={data.decorations[0].alt} className={style.decorImage} />
      </div>
      <div className={style.decorBottom}>
        <img src={data.decorations[1].src} alt={data.decorations[1].alt} className={style.decorImage} />
      </div>
      <div className={style.container}>
        <div className={style.header}>
          <h2 className={style.title}>{data.title}</h2>
          {data.subtitle && <p className={style.subtitle}>{data.subtitle}</p>}
        </div>
        <div className={style.grid}>
          {data.items.map((item) => (
            <div key={item.id} className={style.card}>
              <div className={style.iconFrame}>
                <Icon type={item.icon} className={style.icon} size={32} />
              </div>
              <h3 className={style.itemTitle}>{item.title}</h3>
              <p className={style.description}>{item.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function renderStars(rating: number, style: StyleMap) {
  return Array.from({ length: 5 }).map((_, index) => (
    <Icon
      key={index}
      type="Star"
      className={index < rating ? style.starActive : style.starInactive}
      size={16}
    />
  ));
}

function Reviews({ data, style }: { data: ReviewsContent; style: StyleMap }) {
  return (
    <section id="reviews" className={style.section}>
      <div className={style.container}>
        <div className={style.header}>
          <h2 className={style.title}>{data.title}</h2>
          {data.subtitle && <p className={style.subtitle}>{data.subtitle}</p>}
          {data.ratingSummary && (
            <div className={style.summaryWrapper}>
              <div className={style.summary}>
                <span className={style.average}>{data.ratingSummary.average}</span>
                <div className={style.stars}>{renderStars(Math.round(data.ratingSummary.average), style)}</div>
                {data.ratingSummary.totalLabel && <span className={style.total}>{data.ratingSummary.totalLabel}</span>}
              </div>
            </div>
          )}
        </div>
        <div className={style.grid}>
          {data.items.map((review) => (
            <div key={review.id} className={style.card}>
              <div className={style.authorRow}>
                {review.avatar && <img src={review.avatar} alt={review.authorName} className={style.avatar} />}
                <div className={style.authorMeta}>
                  <div className={style.author}>{review.authorName}</div>
                  {review.authorRole && <div className={style.role}>{review.authorRole}</div>}
                </div>
                {review.country && <div className={style.country}>{review.country}</div>}
              </div>
              <div className={style.reviewStars}>{renderStars(review.rating, style)}</div>
              <p className={style.content}>{review.content}</p>
              {review.proofImage && (
                <div className={style.proofFrame}>
                  <img src={review.proofImage} alt={`${review.authorName}${data.proofImageSuffix}`} className={style.proofImage} />
                </div>
              )}
              {review.sourcePlatform && (
                <div className={style.source}>
                  {data.verifiedPrefix} {review.sourcePlatform}
                </div>
              )}
            </div>
          ))}
        </div>
        {data.disclaimer && (
          <div className={style.disclaimerWrapper}>
            <p className={style.disclaimer}>{data.disclaimer}</p>
          </div>
        )}
      </div>
    </section>
  );
}

function Authority({ data, style }: { data: AuthorityContent; style: StyleMap }) {
  return (
    <section className={style.section}>
      <div className={style.container}>
        <div className={style.inner}>
          <div className={style.header}>
            <h2 className={style.title}>{data.title}</h2>
            {data.subtitle && <p className={style.subtitle}>{data.subtitle}</p>}
          </div>
          {data.image && (
            <div className={style.imageWrapper}>
              <img src={data.image.src} alt={data.image.alt} className={style.image} />
            </div>
          )}
          {data.stats && (
            <div className={style.stats}>
              {data.stats.map((stat) => (
                <div key={stat.label} className={style.stat}>
                  <div className={style.statValue}>{stat.value}</div>
                  <div className={style.statLabel}>{stat.label}</div>
                </div>
              ))}
            </div>
          )}
          <div className={style.paragraphs}>
            {data.paragraphs.map((paragraph: string) => (
              <p key={paragraph} className={style.paragraph}>
                {paragraph}
              </p>
            ))}
          </div>
          {data.credentials && (
            <div className={style.credentials}>
              <h3 className={style.credentialsTitle}>{data.credentialsTitle}</h3>
              <ul className={style.credentialsList}>
                {data.credentials.map((credential) => (
                  <li key={credential.id} className={style.credential}>
                    <span className={style.check}>✓</span>
                    <span className={style.credentialText}>{credential.label}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {data.signature && (
            <div className={style.signature}>
              <div className={style.signatureName}>{data.signature.name}</div>
              <div className={style.signatureRole}>{data.signature.role}</div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function calculateTimeLeft(endsAt: string): TimeLeft | null {
  const difference = new Date(endsAt).getTime() - Date.now();

  if (difference <= 0) {
    return null;
  }

  return {
    days: Math.floor(difference / (1000 * 60 * 60 * 24)),
    hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((difference / 1000 / 60) % 60),
    seconds: Math.floor((difference / 1000) % 60),
  };
}

function Countdown({ data, style, styles }: { data: CountdownContent; style: StyleMap; styles: Record<string, StyleMap> }) {
  const [timeLeft, setTimeLeft] = useState<TimeLeft | null>(() => calculateTimeLeft(data.endsAt));
  const isExpired = timeLeft === null;

  useEffect(() => {
    const timer = window.setInterval(() => {
      setTimeLeft(calculateTimeLeft(data.endsAt));
    }, 1000);

    return () => window.clearInterval(timer);
  }, [data.endsAt]);

  if (isExpired && data.expiredFallback) {
    return (
      <section className={style.expiredSection}>
        <div className={style.expiredContainer}>
          <div className={style.expiredInner}>
            {data.expiredFallback.title && <h2 className={style.expiredTitle}>{data.expiredFallback.title}</h2>}
            {data.expiredFallback.subtitle && <p className={style.expiredSubtitle}>{data.expiredFallback.subtitle}</p>}
          </div>
        </div>
      </section>
    );
  }

  if (isExpired) return null;

  const values = [timeLeft?.days, timeLeft?.hours, timeLeft?.minutes, timeLeft?.seconds];

  return (
    <section className={style.section}>
      <div className={style.background}>
        <img src={data.background.src} alt={data.background.alt} className={style.backgroundImage} />
        <div className={style.overlay} />
      </div>
      <div className={style.container}>
        <div className={style.inner}>
          {data.title && <h2 className={style.title}>{data.title}</h2>}
          {data.subtitle && <p className={style.subtitle}>{data.subtitle}</p>}
          {timeLeft && (
            <div className={style.grid}>
              {data.labels.map((label, index) => (
                <div key={label} className={style.unit}>
                  <div className={style.value}>{String(values[index] ?? 0).padStart(2, "0")}</div>
                  <div className={style.label}>{label}</div>
                </div>
              ))}
            </div>
          )}
          {data.cta && (
            <div className={style.buttonWrapper}>
              <CtaButton cta={data.cta} styles={styles} variant="secondary" size="lg" className={style.buttonExtra} />
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function FAQ({ data, style, styles }: { data: FaqContent; style: StyleMap; styles: Record<string, StyleMap> }) {
  const [openId, setOpenId] = useState<string | null>(null);

  return (
    <section className={style.section}>
      <div className={style.container}>
        <div className={style.header}>
          <h2 className={style.title}>{data.title}</h2>
          {data.subtitle && <p className={style.subtitle}>{data.subtitle}</p>}
        </div>
        <div className={style.list}>
          {data.items.map((item) => (
            <div key={item.id} className={style.item}>
              <button
                type="button"
                onClick={() => setOpenId(openId === item.id ? null : item.id)}
                className={style.button}
              >
                <span className={style.question}>{item.question}</span>
                <span className={style.toggle}>{openId === item.id ? "−" : "+"}</span>
              </button>
              {openId === item.id && (
                <div className={style.answerWrapper}>
                  <p className={style.answer}>{item.answer}</p>
                </div>
              )}
            </div>
          ))}
        </div>
        {data.contactCta && (
          <div className={style.ctaWrapper}>
            <CtaButton cta={data.contactCta} styles={styles} variant="primary" size="lg" />
          </div>
        )}
      </div>
    </section>
  );
}

function Assurance({ data, style, styles }: { data: AssuranceContent; style: StyleMap; styles: Record<string, StyleMap> }) {
  return (
    <section className={style.section}>
      <div className={style.decorTop} />
      <div className={style.decorBottom} />
      <div className={style.container}>
        <div className={style.inner}>
          <div className={style.header}>
            <h2 className={style.title}>{data.title}</h2>
            {data.subtitle && <p className={style.subtitle}>{data.subtitle}</p>}
            {data.description && <p className={style.description}>{data.description}</p>}
          </div>
          {data.badges && (
            <div className={style.badges}>
              {data.badges.map((badge) => (
                <div key={badge.id} className={style.badge}>
                  <div className={style.iconFrame}>
                    <Icon type={badge.icon} className={style.icon} size={32} />
                  </div>
                  <div className={style.badgeText}>{badge.text}</div>
                  {badge.subtext && <div className={style.badgeSubtext}>{badge.subtext}</div>}
                </div>
              ))}
            </div>
          )}
          {data.image && (
            <div className={style.imageWrapper}>
              <img src={data.image} alt={data.imageAlt} className={style.image} />
            </div>
          )}
          {data.cta && (
            <div className={style.ctaPanel}>
              <p className={style.closingText}>{data.closingText}</p>
              <CtaButton cta={data.cta} styles={styles} variant="primary" size="lg" />
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function Footer({ data, style }: { data: FooterContent; style: StyleMap }) {
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const activeLink = data.links.find((link) => link.text === activeModal);
  const socialLinks = data.socialLinks ?? [];

  return (
    <>
      <footer className={style.footer}>
        <div className={style.container}>
          <div className={style.inner}>
            <div className={style.header}>
              <h3 className={style.brand}>{data.brandName}</h3>
              {data.contactEmail && (
                <a href={`mailto:${data.contactEmail}`} className={style.email}>
                  {data.contactEmail}
                </a>
              )}
            </div>
            {socialLinks.length > 0 && (
              <div className={style.socials}>
                {socialLinks.map((social) => (
                  <a key={social.platform} href={social.url} target="_blank" rel="noopener noreferrer" className={style.social} aria-label={social.platform}>
                    <span className={style.socialText}>
                      {data.socialIcons[social.platform.toLowerCase()] || social.platform.charAt(0).toUpperCase()}
                    </span>
                  </a>
                ))}
              </div>
            )}
            <div className={style.links}>
              {data.links.map((link) => (
                <button key={link.text} type="button" onClick={() => setActiveModal(link.text)} className={style.link}>
                  {link.text}
                </button>
              ))}
            </div>
            {data.disclaimer && (
              <div className={style.disclaimerPanel}>
                <p className={style.disclaimer}>{data.disclaimer}</p>
              </div>
            )}
            <div className={style.copyright}>
              © {data.copyrightYear} {data.brandName}. {data.rightsText}
            </div>
          </div>
        </div>
      </footer>
      {activeModal && activeLink && (
        <div className={style.modalOverlay}>
          <div className={style.modal}>
            <div className={style.modalHeader}>
              <h3 className={style.modalTitle}>{activeModal}</h3>
              <button type="button" onClick={() => setActiveModal(null)} className={style.close}>
                {data.closeLabel}
              </button>
            </div>
            <div className={style.modalContent}>{activeLink.content}</div>
          </div>
        </div>
      )}
    </>
  );
}

function StickyCta({ data, style }: { data: StickyCtaContent; style: StyleMap }) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const scrollable = document.documentElement.scrollHeight - window.innerHeight;
      const scrollPercent = scrollable > 0 ? (window.scrollY / scrollable) * 100 : 100;
      setIsVisible(scrollPercent >= (data.showAfterScrollPercent ?? 0));
    };

    window.addEventListener("scroll", handleScroll);
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, [data.showAfterScrollPercent]);

  if (!isVisible) return null;

  return (
    <a
      href={hrefForCta(data)}
      target={data.target || "_blank"}
      rel={data.target === "_blank" ? "noopener noreferrer" : undefined}
      className={cx(style.base, data.position === "bottom-left" ? style.left : style.right)}
    >
      {data.icon && <Icon type={data.icon} size={24} />}
      <span className={style.text}>{data.text}</span>
    </a>
  );
}

function renderModule(template: ExtractedTemplate, moduleId: string) {
  const templateModule = template.modules.find((item) => item.id === moduleId);
  if (!templateModule) return null;

  const data = template.content[templateModule.dataKey];
  const style = template.styles[templateModule.stylesKey];
  const styles = template.styles;

  switch (templateModule.type) {
    case "hero":
      return <Hero key={templateModule.id} data={data as HeroContent} style={style} styles={styles} />;
    case "stats":
      return <Stats key={templateModule.id} data={data as StatsContent} style={style} />;
    case "offer":
      return <Offer key={templateModule.id} data={data as OfferContent} style={style} styles={styles} />;
    case "productShowcase":
      return <ProductShowcase key={templateModule.id} data={data as ProductShowcaseContent} style={style} />;
    case "beforeAfter":
      return <BeforeAfter key={templateModule.id} data={data as BeforeAfterContent} style={style} />;
    case "videoTestimonials":
      return <VideoTestimonials key={templateModule.id} data={data as VideoTestimonialsContent} style={style} styles={styles} />;
    case "howItWorks":
      return <HowItWorks key={templateModule.id} data={data as HowItWorksContent} style={style} />;
    case "trustBanner":
      return <TrustBanner key={templateModule.id} data={data as TrustBannerContent} style={style} />;
    case "logoWall":
      return <LogoWall key={templateModule.id} data={data as LogoWallContent} style={style} />;
    case "features":
      return <Features key={templateModule.id} data={data as FeaturesContent} style={style} />;
    case "reviews":
      return <Reviews key={templateModule.id} data={data as ReviewsContent} style={style} />;
    case "authority":
      return <Authority key={templateModule.id} data={data as AuthorityContent} style={style} />;
    case "countdown":
      return <Countdown key={templateModule.id} data={data as CountdownContent} style={style} styles={styles} />;
    case "faq":
      return <FAQ key={templateModule.id} data={data as FaqContent} style={style} styles={styles} />;
    case "assurance":
      return <Assurance key={templateModule.id} data={data as AssuranceContent} style={style} styles={styles} />;
    case "footer":
      return <Footer key={templateModule.id} data={data as FooterContent} style={style} />;
    case "stickyCta":
      return <StickyCta key={templateModule.id} data={data as StickyCtaContent} style={style} />;
  }
}

export function BeautyTemplateRenderer({ template = extractedBeautyTemplate }: RendererProps) {
  return (
    <div className={template.styles.page.root}>
      {template.modules.map((module) => (
        <div key={module.id} id={module.id}>
          {renderModule(template, module.id)}
        </div>
      ))}
    </div>
  );
}

export { extractedBeautyTemplate };
