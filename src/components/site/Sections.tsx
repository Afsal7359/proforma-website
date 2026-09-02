import Link from "next/link";
import { Heading } from "@/components/Heading";
import { Icon, CheckMark } from "@/components/Icon";
import type { SiteContent } from "@/lib/default-content";
import type { Video } from "@/lib/types";

/* ════════════════════════════════════════════════════════════════
   HERO (dark band)
════════════════════════════════════════════════════════════════ */

/** DOM order is load-bearing here — the circles overlap. */
const PC_CLASSES = ["pc-3", "pc-1", "pc-2", "pc-4"];

export function Hero({ hero }: { hero: SiteContent["hero"] }) {
  return (
    <section className="hero band-dark">
      <div className="container">
        <div className="hero-grid">
          <div className="hero-copy reveal is-visible">
            <div className="eyebrow">{hero.eyebrow}</div>
            <h1>
              <Heading text={hero.headline} accentTag="span" />
            </h1>
            <p>{hero.paragraph}</p>
            <div className="hero-ctas">
              <a href={hero.primaryCta.href} className="btn btn-primary">
                {hero.primaryCta.label}
              </a>
              <a href={hero.secondaryCta.href} className="btn btn-ghost">
                {hero.secondaryCta.label}
              </a>
            </div>
            <div className="hero-stats">
              {hero.stats.map((s) => (
                <div className="stat" key={s.label}>
                  <b>{s.value}</b>
                  <span>{s.label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="hero-visual reveal is-visible reveal-delay-2">
            <div className="photo-collage">
              <span className="blob blob-a" aria-hidden="true" />
              <span className="blob blob-b" aria-hidden="true" />
              {hero.photos.slice(0, 4).map((url, i) => (
                <div
                  key={url + i}
                  className={`photo-circle ${PC_CLASSES[i]}`}
                  style={{ backgroundImage: `url('${url}')` }}
                />
              ))}
              {hero.chips.slice(0, 2).map((c, i) => (
                <div className={`stat-chip stat-chip-${i + 1}`} key={c.label}>
                  <div className="v">{c.value}</div>
                  <div className="l">{c.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ════════════════════════════════════════════════════════════════
   TICKER (dark band) — items are duplicated so the loop is seamless
════════════════════════════════════════════════════════════════ */

export function Ticker({ ticker }: { ticker: SiteContent["ticker"] }) {
  const doubled = [...ticker.items, ...ticker.items];
  return (
    <div className="ticker-wrap band-dark">
      <span className="ticker-label">
        <span className="ticker-dot" />
        {ticker.label}
      </span>
      <div className="ticker-track" id="tickerTrack">
        {doubled.map((item, i) => (
          <span className="ticker-item" key={`${item.city}-${i}`}>
            <b>{item.city}</b> · {item.date}
          </span>
        ))}
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════
   PILLARS STRIP
════════════════════════════════════════════════════════════════ */

export function Pillars({ pillars }: { pillars: SiteContent["pillars"] }) {
  return (
    <section className="pillars">
      <div className="container pillars-grid">
        {pillars.items.map((p, i) => (
          <div
            className={`pillar reveal${i > 0 ? ` reveal-delay-${i}` : ""}`}
            key={p.num + p.title}
          >
            <span className="num">{p.num}</span>
            <h4>{p.title}</h4>
            <p>{p.text}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ════════════════════════════════════════════════════════════════
   01 TRIALS — the live calendar is gated behind the athlete login.
   The public page shows the promise plus a blurred teaser, and the
   CTA routes to /login.
════════════════════════════════════════════════════════════════ */

export function TrialsSection({ trials }: { trials: SiteContent["trials"] }) {
  return (
    <section className="section" id="trials">
      <div className="container">
        <div className="section-head reveal">
          <div className="eyebrow">{trials.eyebrow}</div>
          <h2 className="section-title">
            <Heading text={trials.title} />
          </h2>
          <p className="section-sub">{trials.sub}</p>
        </div>

        <div className="trials-layout">
          <div className="trials-photo reveal">
            <div
              className="media-panel"
              style={{
                aspectRatio: "4 / 5",
                backgroundImage: `url('${trials.photo}')`,
              }}
            />
            <div className="trials-photo-caption">
              <span className="cap-label">{trials.captionLabel}</span>
              <span className="cap-sub">{trials.captionSub}</span>
            </div>
          </div>

          <div className="trial-list">
            <div className="trial-gate card-surface reveal">
              <div className="gate-lock">
                <Icon name="lock" />
              </div>
              <h3>{trials.gateHeading}</h3>
              <p>{trials.gateText}</p>
              <ul className="gate-list">
                {trials.gateBullets.map((b) => (
                  <li key={b}>
                    <CheckMark />
                    {b}
                  </li>
                ))}
              </ul>
              <div className="gate-actions">
                <Link href="/login" className="btn btn-primary">
                  {trials.gateCtaLabel}
                </Link>
                <span className="gate-hint">
                  No login yet? Your coach sends it on WhatsApp when you join.
                </span>
              </div>
            </div>

            {/* Blurred teaser — shape only, never real trial data. */}
            <div className="gate-blur" aria-hidden="true">
              {[0, 1].map((i) => (
                <div className="trial-card card-surface" key={i}>
                  <div className="trial-top">
                    <div className="trial-main">
                      <span className="trial-city">▬▬▬▬▬▬, ▬▬▬▬</span>
                      <div className="trial-meta">
                        <span>
                          Age <strong>▬▬▬▬</strong>
                        </span>
                        <span>
                          Date <strong>▬▬▬ ▬▬</strong>
                        </span>
                      </div>
                    </div>
                    <span className="tag tag-blue">Open Trial</span>
                  </div>
                  <div className="trial-bottom">
                    <div className="trial-slots">
                      <b>▬▬</b>slots left
                    </div>
                    <span className="btn btn-primary btn-sm">Reserve Slot</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="trials-footnote reveal">
          <span>{trials.footnote}</span>
          <Link href="/login" className="btn btn-ghost btn-sm">
            {trials.footnoteCtaLabel}
          </Link>
        </div>
      </div>
    </section>
  );
}

/* ════════════════════════════════════════════════════════════════
   COACHING PANEL (photo + text split)
════════════════════════════════════════════════════════════════ */

export function CoachingSplit({
  coaching,
}: {
  coaching: SiteContent["coaching"];
}) {
  return (
    <section className="section">
      <div className="container">
        <div className="split-grid">
          <div className="split-photo reveal">
            <div
              className="media-panel"
              style={{
                aspectRatio: "4 / 3.1",
                backgroundImage: `url('${coaching.photo}')`,
              }}
            />
            <div className="split-badge">
              <span className="n">{coaching.badgeNumber}</span>
              <span className="t">{coaching.badgeText}</span>
            </div>
          </div>
          <div className="split-content reveal reveal-delay-1">
            <div className="section-head">
              <div className="eyebrow">{coaching.eyebrow}</div>
              <h2 className="section-title">
                <Heading text={coaching.title} />
              </h2>
              <p className="section-sub">{coaching.sub}</p>
            </div>
            <ul className="split-list">
              {coaching.bullets.map((b) => (
                <li key={b}>
                  <CheckMark />
                  {b}
                </li>
              ))}
            </ul>
            <a href={coaching.ctaHref} className="btn btn-primary">
              {coaching.ctaLabel}
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ════════════════════════════════════════════════════════════════
   02 TRAINING
════════════════════════════════════════════════════════════════ */

export function TrainingSection({
  training,
}: {
  training: SiteContent["training"];
}) {
  return (
    <section className="section section-alt" id="training">
      <div className="container">
        <div className="section-head reveal">
          <div className="eyebrow">{training.eyebrow}</div>
          <h2 className="section-title">
            <Heading text={training.title} />
          </h2>
          <p className="section-sub">{training.sub}</p>
        </div>

        <div className="pos-grid">
          {training.positions.map((p) => (
            <div
              className="pos-card card-surface reveal"
              data-index={p.index}
              key={p.index + p.title}
            >
              <h3>{p.title}</h3>
              <p>{p.text}</p>
              <div className="pos-meta">
                <div>
                  <b>{p.space}</b>Min. space
                </div>
                <div>
                  <b>{p.sessions}</b>Sessions
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="training-note reveal">
          <Icon name="clock" width={22} height={22} />
          <span>{training.note}</span>
        </div>
      </div>
    </section>
  );
}

/* ════════════════════════════════════════════════════════════════
   03 CAREER PATHWAY
════════════════════════════════════════════════════════════════ */

export function CareerSection({ career }: { career: SiteContent["career"] }) {
  return (
    <section className="section" id="career">
      <div className="container">
        <div className="section-head reveal">
          <div className="eyebrow">{career.eyebrow}</div>
          <h2 className="section-title">
            <Heading text={career.title} />
          </h2>
          <p className="section-sub">{career.sub}</p>
        </div>

        <div className="path-list">
          {career.steps.map((s) => (
            <div className="path-step reveal" key={s.num + s.title}>
              <div className="path-num">{s.num}</div>
              <div className="path-body">
                <h3>{s.title}</h3>
                <p>{s.text}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ════════════════════════════════════════════════════════════════
   04 FITNESS & NUTRITION
════════════════════════════════════════════════════════════════ */

export function NutritionSection({
  nutrition,
}: {
  nutrition: SiteContent["nutrition"];
}) {
  return (
    <section className="section section-alt" id="nutrition">
      <div className="container">
        <div className="section-head reveal">
          <div className="eyebrow">{nutrition.eyebrow}</div>
          <h2 className="section-title">
            <Heading text={nutrition.title} />
          </h2>
          <p className="section-sub">{nutrition.sub}</p>
        </div>

        <div className="nutrition-grid">
          {nutrition.cards.map((c) => (
            <div className="nut-card card-surface reveal" key={c.title}>
              <h3>{c.title}</h3>
              <p>{c.text}</p>
              <div className="macro-bar">
                <span className="macro-carb" style={{ width: `${c.carbs}%` }} />
                <span
                  className="macro-protein"
                  style={{ width: `${c.protein}%` }}
                />
                <span className="macro-fat" style={{ width: `${c.fat}%` }} />
              </div>
              <div className="macro-legend">
                <span>
                  <i style={{ background: "#2E5CFF" }} />
                  Carbs {c.carbs}%
                </span>
                <span>
                  <i style={{ background: "#7EA0FF" }} />
                  Protein {c.protein}%
                </span>
                <span>
                  <i style={{ background: "#C8850F" }} />
                  Fat {c.fat}%
                </span>
              </div>
            </div>
          ))}
        </div>

        <div className="nutrition-include reveal">
          <Icon name="bolt" width={20} height={20} />
          <span>{nutrition.include}</span>
        </div>
      </div>
    </section>
  );
}

/* ════════════════════════════════════════════════════════════════
   05 PERFORMANCE TRACKING
════════════════════════════════════════════════════════════════ */

export function TrackingSection({
  tracking,
}: {
  tracking: SiteContent["tracking"];
}) {
  return (
    <section className="section" id="tracking">
      <div className="container">
        <div className="section-head reveal">
          <div className="eyebrow">{tracking.eyebrow}</div>
          <h2 className="section-title">
            <Heading text={tracking.title} />
          </h2>
          <p className="section-sub">{tracking.sub}</p>
        </div>

        <div className="tracking-grid">
          <div className="tracking-row-top">
            <div
              className="media-panel tracking-photo reveal"
              style={{
                aspectRatio: "4 / 3.4",
                backgroundImage: `url('${tracking.photo}')`,
              }}
            />

            <div className="tracking-card card-surface reveal reveal-delay-1">
              <h3>{tracking.metricsTitle}</h3>
              <span className="cap">{tracking.metricsCaption}</span>
              <div className="metric-list">
                {tracking.metrics.map((m) => (
                  <div className="metric-row" key={m.label}>
                    <span>{m.label}</span>
                    <b>{m.value}</b>
                  </div>
                ))}
              </div>
              <div className="metric-footnote">{tracking.metricsFootnote}</div>
            </div>
          </div>

          <div className="tracking-card card-surface reveal reveal-delay-2">
            <h3>{tracking.methodTitle}</h3>
            <span className="cap">{tracking.methodCaption}</span>
            <div className="method-flow">
              {tracking.methodSteps.map((s, i) => (
                <div key={s.title}>
                  <div className="method-step reveal">
                    <div className="ico">
                      <Icon name={s.icon} />
                    </div>
                    <div>
                      <h4>{s.title}</h4>
                      <p>{s.text}</p>
                    </div>
                  </div>
                  {i < tracking.methodSteps.length - 1 && (
                    <div className="method-arrow" />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ════════════════════════════════════════════════════════════════
   07 VIDEO LIBRARY
════════════════════════════════════════════════════════════════ */

export function VideosSection({
  videos,
  copy,
}: {
  videos: Video[];
  copy: SiteContent["videos"];
}) {
  return (
    <section className="section" id="videos">
      <div className="container">
        <div className="section-head reveal">
          <div className="eyebrow">{copy.eyebrow}</div>
          <h2 className="section-title">
            <Heading text={copy.title} />
          </h2>
          <p className="section-sub">{copy.sub}</p>
        </div>

        <div className="video-grid">
          {videos.map((v) => (
            <div className="video-card reveal" key={v.id}>
              <div
                className="video-thumb"
                style={
                  v.thumbnail_url
                    ? { backgroundImage: `url('${v.thumbnail_url}')` }
                    : undefined
                }
              >
                {v.category && (
                  <span className="video-tag tag tag-blue">{v.category}</span>
                )}
                {v.is_new && <span className="video-new">New</span>}
                <div className="play">
                  <Icon name="play" />
                </div>
                {v.duration_min != null && (
                  <span className="video-dur">{v.duration_min} min</span>
                )}
              </div>
              <div className="video-info">
                <h4>{v.title}</h4>
                <span>
                  {[v.category, v.duration_min ? `${v.duration_min} min` : null]
                    .filter(Boolean)
                    .join(" · ")}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ════════════════════════════════════════════════════════════════
   08 CHECKOUT / TRUST
════════════════════════════════════════════════════════════════ */

export function CheckoutSection({
  checkout,
}: {
  checkout: SiteContent["checkout"];
}) {
  return (
    <section className="section section-tight section-alt" id="checkout">
      <div className="container">
        <div className="section-head reveal">
          <div className="eyebrow">{checkout.eyebrow}</div>
          <h2 className="section-title">
            <Heading text={checkout.title} />
          </h2>
        </div>

        <div className="pay-panel card-surface reveal">
          <div className="pay-methods">
            {checkout.methods.map((m) => (
              <div className="pay-chip" key={m.label}>
                <Icon name={m.icon} />
                {m.label}
              </div>
            ))}
          </div>
          <div className="trust-row">
            {checkout.trust.map((t) => (
              <div className="trust-item" key={t.text}>
                <Icon name={t.icon} />
                <p>{t.text}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ════════════════════════════════════════════════════════════════
   TESTIMONIALS
════════════════════════════════════════════════════════════════ */

export function TestimonialsSection({
  testimonials,
}: {
  testimonials: SiteContent["testimonials"];
}) {
  return (
    <section className="section">
      <div className="container">
        <div className="section-head reveal">
          <div className="eyebrow">{testimonials.eyebrow}</div>
          <h2 className="section-title">
            <Heading text={testimonials.title} />
          </h2>
        </div>
        <div className="testi-grid">
          {testimonials.items.map((t) => (
            <div className="testi-card card-surface reveal" key={t.name + t.meta}>
              <p className="testi-quote">{t.quote}</p>
              <div className="testi-who">
                <div className="testi-avatar">
                  {t.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="testi-name">{t.name}</div>
                  <div className="testi-meta">{t.meta}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ════════════════════════════════════════════════════════════════
   FINAL CTA (dark band)
════════════════════════════════════════════════════════════════ */

export function FinalCta({ finalCta }: { finalCta: SiteContent["finalCta"] }) {
  return (
    <section className="final-cta band-dark">
      <div className="container reveal">
        <div className="eyebrow" style={{ justifyContent: "center" }}>
          {finalCta.eyebrow}
        </div>
        <h2>{finalCta.title}</h2>
        <p>{finalCta.paragraph}</p>
        <a href={finalCta.ctaHref} className="btn btn-primary">
          {finalCta.ctaLabel}
        </a>
      </div>
    </section>
  );
}
