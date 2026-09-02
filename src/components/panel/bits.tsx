import { Icon } from "@/components/Icon";
import { overallScore } from "@/lib/format";
import { METRIC_KEYS } from "@/lib/types";

/* ── status pills ─────────────────────────────────────────────────────── */

const PILL_TONE: Record<string, string> = {
  // client / subscription
  active: "pill-green",
  lead: "pill-blue",
  paused: "pill-gold",
  alumni: "pill-grey",
  trial: "pill-blue",
  expired: "pill-red",
  cancelled: "pill-grey",
  none: "pill-grey",
  // payments
  paid: "pill-green",
  pending: "pill-gold",
  failed: "pill-red",
  refunded: "pill-grey",
  // trials
  upcoming: "pill-blue",
  open: "pill-green",
  closed: "pill-grey",
  completed: "pill-grey",
  // registrations
  registered: "pill-blue",
  confirmed: "pill-blue",
  attended: "pill-gold",
  selected: "pill-green",
  not_selected: "pill-red",
  no_show: "pill-red",
  // assignments
  assigned: "pill-blue",
  in_progress: "pill-gold",
  // attendance
  present: "pill-green",
  absent: "pill-red",
  late: "pill-gold",
  excused: "pill-grey",
};

export function StatusPill({
  value,
  plain,
}: {
  value: string | null | undefined;
  plain?: boolean;
}) {
  if (!value) return <span className="pill pill-grey plain">—</span>;
  const tone = PILL_TONE[value] ?? "pill-grey";
  return (
    <span className={`pill ${tone}${plain ? " plain" : ""}`}>
      {value.replace(/_/g, " ")}
    </span>
  );
}

/* ── metric bars ──────────────────────────────────────────────────────── */

export type Metrics = Partial<Record<(typeof METRIC_KEYS)[number], number | null>>;

export function MetricBars({ metrics }: { metrics: Metrics }) {
  return (
    <div className="metric-bars">
      {METRIC_KEYS.map((key) => {
        const v = metrics[key];
        return (
          <div className="metric-bar-row" key={key}>
            <div className="top">
              <span style={{ textTransform: "capitalize" }}>{key}</span>
              <b>{v ?? "—"}</b>
            </div>
            <div className="metric-track">
              <div className="metric-fill" style={{ width: `${v ?? 0}%` }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function ScoreRing({
  metrics,
  label = "Overall",
}: {
  metrics: Metrics;
  label?: string;
}) {
  const score = overallScore(metrics);
  return (
    <div
      className="score-ring"
      style={{ ["--pct" as string]: String(score ?? 0) }}
    >
      <div className="inner">
        <b>{score ?? "—"}</b>
        <span>{label}</span>
      </div>
    </div>
  );
}

/* ── person cell ──────────────────────────────────────────────────────── */

export function Person({
  name,
  meta,
}: {
  name: string;
  meta?: string | null;
}) {
  const ini =
    name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase() ?? "")
      .join("") || "?";
  return (
    <div className="person">
      <div className="panel-avatar" aria-hidden="true">
        {ini}
      </div>
      <div className="meta">
        <b>{name}</b>
        {meta && <span>{meta}</span>}
      </div>
    </div>
  );
}

/* ── timeline ─────────────────────────────────────────────────────────── */

export function TimelineItem({
  icon = "check",
  title,
  text,
  time,
}: {
  icon?: string;
  title: string;
  text?: string | null;
  time?: string;
}) {
  return (
    <div className="timeline-item">
      <div className="timeline-dot">
        <Icon name={icon} />
      </div>
      <div className="timeline-body">
        <h4>{title}</h4>
        {text && <p>{text}</p>}
        {time && <time>{time}</time>}
      </div>
    </div>
  );
}
