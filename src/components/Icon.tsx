import type { SVGProps } from "react";

/**
 * Every icon in the product. The marketing-site icons are the exact paths from
 * the original design so the rendered SVG is byte-identical; the rest follow
 * the same 24×24 stroke-2 Feather geometry.
 */
const PATHS: Record<string, { d: string[]; fill?: boolean; extra?: string }> = {
  // ── original design ──────────────────────────────────────────────
  check: { d: ["M20 6L9 17l-5-5"] },
  clock: { d: ["M12 7v5l3 3"], extra: "circle-10" },
  bolt: { d: ["M22 12h-4l-3 9L9 3l-3 9H2"] },
  upload: { d: ["M12 16V4M6 10l6-6 6 6M4 20h16"] },
  "check-circle": { d: ["M9 12l2 2 4-4"], extra: "circle-9" },
  refresh: { d: ["M21 12a9 9 0 1 1-3-6.7M21 3v6h-6"] },
  chat: { d: ["M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"] },
  play: { d: ["M8 5v14l11-7z"], fill: true },
  card: { d: ["M2 10h20"], extra: "rect-2-5-20-14-2" },
  "card-dot": { d: ["M2 10h20"], extra: "rect-2-5-20-14-2|circle-17-15-1" },
  bank: { d: ["M3 21h18M4 21V9l8-6 8 6v12M9 21v-6h6v6"] },
  wallet: { d: ["M3 10h18M7 15h4"], extra: "rect-3-6-18-13-2" },
  lock: { d: ["M8 11V7a4 4 0 0 1 8 0v4"], extra: "rect-4-11-16-10-2" },
  x: { d: ["M18 6L6 18M6 6l12 12"] },
  file: {
    d: [
      "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z",
      "M14 2v6h6M9 15h6M9 11h2",
    ],
  },
  instagram: {
    d: [],
    extra: "rect-2-2-20-20-5|circle-12-12-4|circle-17.5-6.5-1",
  },
  youtube: { d: ["M10 9l5 3-5 3z"], extra: "rect-2-5-20-14-4" },
  whatsapp: {
    d: [
      "M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z",
    ],
  },

  // ── panels ───────────────────────────────────────────────────────
  grid: { d: [], extra: "rect-3-3-7-7-1|rect-14-3-7-7-1|rect-3-14-7-7-1|rect-14-14-7-7-1" },
  users: {
    d: ["M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2", "M23 21v-2a4 4 0 0 0-3-3.87", "M16 3.13a4 4 0 0 1 0 7.75"],
    extra: "circle-9-7-4",
  },
  user: { d: ["M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"], extra: "circle-12-7-4" },
  whistle: { d: ["M12 3v3M5.6 5.6l2.1 2.1M3 12h3"], extra: "circle-14-14-7" },
  calendar: {
    d: ["M16 2v4M8 2v4M3 10h18"],
    extra: "rect-3-4-18-18-2",
  },
  rupee: { d: ["M6 3h12M6 8h12M16 3c0 5-3.5 5-6 5l7 8H6"] },
  "trending-up": { d: ["M23 6l-9.5 9.5-5-5L1 18", "M17 6h6v6"] },
  video: { d: ["M23 7l-7 5 7 5V7z"], extra: "rect-1-5-15-14-2" },
  layout: { d: ["M3 9h18M9 21V9"], extra: "rect-3-3-18-18-2" },
  settings: { d: ["M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.6a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"], extra: "circle-12-12-3" },
  clipboard: {
    d: ["M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"],
    extra: "rect-8-2-8-4-1",
  },
  activity: { d: ["M22 12h-4l-3 9L9 3l-3 9H2"] },
  logout: { d: ["M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4", "M16 17l5-5-5-5M21 12H9"] },
  plus: { d: ["M12 5v14M5 12h14"] },
  edit: { d: ["M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7", "M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4z"] },
  trash: { d: ["M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"] },
  search: { d: ["M21 21l-4.35-4.35"], extra: "circle-11-11-8" },
  "arrow-left": { d: ["M19 12H5M12 19l-7-7 7-7"] },
  "arrow-right": { d: ["M5 12h14M12 5l7 7-7 7"] },
  external: { d: ["M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6", "M15 3h6v6M10 14L21 3"] },
  copy: { d: ["M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"], extra: "rect-9-9-13-13-2" },
  alert: { d: ["M12 9v4M12 17h.01", "M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"] },
  info: { d: ["M12 16v-4M12 8h.01"], extra: "circle-10" },
  key: { d: ["M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3"] },
  target: { d: [], extra: "circle-10|circle-6|circle-2" },
  inbox: { d: ["M22 12h-6l-2 3h-4l-2-3H2", "M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"] },
  megaphone: { d: ["M3 11l18-5v12L3 14v-3zM11.6 16.8a3 3 0 1 1-5.8-1.6"] },
  scale: { d: ["M12 3v18M8 21h8M12 7l-4 6h8l-4-6z"] },
  save: { d: ["M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z", "M17 21v-8H7v8M7 3v5h8"] },
  eye: { d: ["M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"], extra: "circle-12-12-3" },
};

export type IconName = keyof typeof PATHS;

type Props = SVGProps<SVGSVGElement> & { name: string; size?: number };

/** `extra` encodes circles/rects: "circle-r" | "circle-cx-cy-r" | "rect-x-y-w-h-rx" */
function renderExtra(spec: string) {
  return spec.split("|").map((s, i) => {
    const p = s.split("-");
    if (p[0] === "circle") {
      const [cx, cy, r] =
        p.length === 2 ? ["12", "12", p[1]] : [p[1], p[2], p[3]];
      return <circle key={i} cx={cx} cy={cy} r={r} />;
    }
    return (
      <rect
        key={i}
        x={p[1]}
        y={p[2]}
        width={p[3]}
        height={p[4]}
        rx={p[5] ?? "0"}
      />
    );
  });
}

export function Icon({ name, size, ...rest }: Props) {
  const def = PATHS[name] ?? PATHS.info;
  const dims = size ? { width: size, height: size } : {};
  return (
    <svg
      viewBox="0 0 24 24"
      fill={def.fill ? "currentColor" : "none"}
      stroke={def.fill ? undefined : "currentColor"}
      strokeWidth={def.fill ? undefined : 2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...dims}
      {...rest}
    >
      {def.extra && renderExtra(def.extra)}
      {def.d.map((d, i) => (
        <path key={i} d={d} />
      ))}
    </svg>
  );
}

/**
 * The original design draws its checkmarks at stroke-width 2.4 with no
 * linecaps — kept exact rather than routed through <Icon>.
 */
export function CheckMark(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" aria-hidden="true" {...props}>
      <path d="M20 6L9 17l-5-5" />
    </svg>
  );
}
