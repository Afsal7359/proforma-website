import type { ReactNode } from "react";

/** ₹1,499 — no decimals unless the amount actually has paise. */
export function inr(amount: number | string | null | undefined): string {
  const n = Number(amount ?? 0);
  if (!Number.isFinite(n)) return "₹0";
  const hasPaise = Math.round(n * 100) % 100 !== 0;
  return `₹${n.toLocaleString("en-IN", {
    minimumFractionDigits: hasPaise ? 2 : 0,
    maximumFractionDigits: 2,
  })}`;
}

/** "Aug 09, 2026" */
export function fmtDate(d: string | Date | null | undefined): string {
  if (!d) return "—";
  const date = typeof d === "string" ? new Date(d) : d;
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

/** "AUG 09" — the ticker format. */
export function fmtTickerDate(d: string | Date | null | undefined): string {
  if (!d) return "";
  const date = typeof d === "string" ? new Date(d) : d;
  if (Number.isNaN(date.getTime())) return "";
  return date
    .toLocaleDateString("en-IN", { day: "2-digit", month: "short" })
    .toUpperCase()
    .replace(",", "");
}

export function fmtDateTime(d: string | Date | null | undefined): string {
  if (!d) return "—";
  const date = typeof d === "string" ? new Date(d) : d;
  if (Number.isNaN(date.getTime())) return "—";
  return `${fmtDate(date)} · ${date.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  })}`;
}

export function relativeDays(d: string | null | undefined): string {
  if (!d) return "—";
  const then = new Date(d).getTime();
  if (Number.isNaN(then)) return "—";
  const days = Math.round((then - Date.now()) / 86_400_000);
  if (days === 0) return "Today";
  if (days === 1) return "Tomorrow";
  if (days === -1) return "Yesterday";
  return days > 0 ? `In ${days} days` : `${Math.abs(days)} days ago`;
}

export function ageFromDob(dob: string | null | undefined): number | null {
  if (!dob) return null;
  const b = new Date(dob);
  if (Number.isNaN(b.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - b.getFullYear();
  const m = now.getMonth() - b.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < b.getDate())) age--;
  return age >= 0 && age < 120 ? age : null;
}

export function initials(name: string): string {
  return (
    name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase() ?? "")
      .join("") || "?"
  );
}

export function titleCase(s: string | null | undefined): string {
  if (!s) return "—";
  return s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

/**
 * Splits a heading on `**accent**` markers so the caller can wrap the accented
 * run in the design's `<em>` (blue) treatment, and on `\n` for line breaks.
 * Returns a flat list of runs — rendering is left to the component.
 */
export type HeadingRun = { text: string; accent: boolean; br: boolean };

export function parseHeading(raw: string): HeadingRun[] {
  const runs: HeadingRun[] = [];
  for (const [i, line] of raw.split("\n").entries()) {
    if (i > 0) runs.push({ text: "", accent: false, br: true });
    for (const [j, part] of line.split("**").entries()) {
      if (part === "") continue;
      runs.push({ text: part, accent: j % 2 === 1, br: false });
    }
  }
  return runs;
}

/** Average of whatever metrics are present, rounded — the "one number that moves". */
export function overallScore(
  m: Partial<Record<"speed" | "stamina" | "technique" | "strength" | "agility", number | null>>,
): number | null {
  const vals = [m.speed, m.stamina, m.technique, m.strength, m.agility].filter(
    (v): v is number => typeof v === "number",
  );
  if (!vals.length) return null;
  return Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);
}

export type { ReactNode };
