import Link from "next/link";
import { requireAdmin } from "@/lib/guards";
import { getSupabase } from "@/lib/supabase";
import { PageHead } from "@/components/panel/PanelShell";
import { SeedButton } from "./SeedButton";
import { DEFAULT_CONTENT, SECTION_LABELS } from "@/lib/default-content";
import { fmtDateTime } from "@/lib/format";

export const metadata = { title: "Site Content · Proforma Co" };

const BLURBS: Record<string, string> = {
  brand: "Company name, tagline and the nav button label.",
  nav: "The links in the top navigation and mobile menu.",
  hero: "Headline, intro copy, the three stats and the photo collage.",
  ticker: "The scrolling trial-city ribbon under the hero.",
  pillars: "The four numbered service pillars.",
  trials: "Section copy plus the locked panel shown to logged-out visitors.",
  coaching: "The coaching-panel credibility block.",
  training: "The six position cards and the filming note.",
  career: "The five-step career pathway.",
  nutrition: "The three nutrition tracks and their macro splits.",
  tracking: "The five metrics and the four-step tracking method.",
  plans: "Heading and billing-toggle labels. Prices live under Plans & Pricing.",
  videos: "Heading for the library. Videos live under Video Library.",
  checkout: "Payment methods and the four trust points.",
  testimonials: "Athlete quotes.",
  finalCta: "The closing dark-band call to action.",
  footer: "About text, link columns, social links and legal lines.",
  seo: "Browser title and meta description.",
};

export default async function AdminContentPage() {
  await requireAdmin();

  const { data: rows } = await getSupabase()
    .from("site_content")
    .select("key, updated_at");

  const edited = new Map((rows ?? []).map((r) => [r.key, r.updated_at]));

  return (
    <>
      <PageHead
        title="Site content"
        subtitle="Every word on the public website. Edit a section and it goes live immediately."
        actions={
          <>
            <SeedButton />
            <Link
              href="/"
              target="_blank"
              className="btn btn-ghost btn-sm"
            >
              View Site
            </Link>
          </>
        }
      />

      <div className="cms-grid">
        {Object.keys(DEFAULT_CONTENT).map((key, i) => {
          const updated = edited.get(key);
          return (
            <Link
              href={`/admin/content/${key}`}
              key={key}
              className="cms-tile"
            >
              <span className="k">
                {String(i + 1).padStart(2, "0")} ·{" "}
                {updated ? "Customised" : "Original"}
              </span>
              <h3>{SECTION_LABELS[key as keyof typeof SECTION_LABELS]}</h3>
              <p>{BLURBS[key] ?? ""}</p>
              {updated && (
                <span className="small muted mono">
                  Edited {fmtDateTime(updated)}
                </span>
              )}
            </Link>
          );
        })}
      </div>
    </>
  );
}
