import { safeQuery } from "./supabase";
import { DEFAULT_CONTENT, type SiteContent } from "./default-content";
import type { Plan, Video } from "./types";

/**
 * Loads every CMS section, merged over the built-in defaults so a missing or
 * partially-filled row can never blank out the page.
 */
export async function getSiteContent(): Promise<SiteContent> {
  const rows = await safeQuery<{ key: string; data: unknown }[]>(
    async (db) => {
      const { data, error } = await db.from("site_content").select("key, data");
      if (error) throw error;
      return data ?? [];
    },
    [],
  );

  const content = structuredClone(DEFAULT_CONTENT) as Record<string, unknown>;
  for (const row of rows) {
    if (!(row.key in content)) continue;
    const base = content[row.key];
    if (base && typeof base === "object" && !Array.isArray(base)) {
      content[row.key] = {
        ...(base as object),
        ...(row.data as object),
      };
    } else {
      content[row.key] = row.data;
    }
  }
  return content as SiteContent;
}

export async function getSection<K extends keyof SiteContent>(
  key: K,
): Promise<SiteContent[K]> {
  const all = await getSiteContent();
  return all[key];
}

/** Public pricing tiers, ordered as the admin arranged them. */
export async function getPublicPlans(): Promise<Plan[]> {
  return safeQuery<Plan[]>(async (db) => {
    const { data, error } = await db
      .from("plans")
      .select("*")
      .eq("is_active", true)
      .order("sort_order", { ascending: true });
    if (error) throw error;
    return (data ?? []) as Plan[];
  }, DEFAULT_PLANS);
}

export async function getPublicVideos(): Promise<Video[]> {
  return safeQuery<Video[]>(async (db) => {
    const { data, error } = await db
      .from("videos")
      .select("*")
      .eq("is_public", true)
      .order("sort_order", { ascending: true });
    if (error) throw error;
    return (data ?? []) as Video[];
  }, DEFAULT_VIDEOS);
}

/**
 * Fallbacks matching the original design, used before the database is seeded.
 */
export const DEFAULT_PLANS: Plan[] = [
  {
    id: "seed-starter",
    name: "Starter",
    slug: "starter",
    description: "For players starting structured training.",
    price_monthly: 1499,
    price_annual: 14990,
    annual_note: "≈ ₹1,249 / month billed yearly",
    features: [
      "Position-specific home training library",
      "Trial calendar access + slot alerts",
      "Monthly progress score",
      "Community drill challenges",
    ],
    badge: null,
    is_featured: false,
    cta_label: "Choose Starter",
    sort_order: 1,
    is_active: true,
  },
  {
    id: "seed-pro",
    name: "Pro",
    slug: "pro",
    description: "Most players on the pathway choose this.",
    price_monthly: 3499,
    price_annual: 34990,
    annual_note: "≈ ₹2,916 / month billed yearly",
    features: [
      "Everything in Starter",
      "Full performance tracking — radar + trend",
      "Nutrition & weight management plan",
      "Live monthly coach review call",
    ],
    badge: "Most Booked",
    is_featured: true,
    cta_label: "Choose Pro",
    sort_order: 2,
    is_active: true,
  },
  {
    id: "seed-elite",
    name: "Elite",
    slug: "elite",
    description: "For trial-ready athletes.",
    price_monthly: 7999,
    price_annual: 79990,
    annual_note: "≈ ₹6,666 / month billed yearly",
    features: [
      "Everything in Pro",
      "1:1 career pathway guidance",
      "Priority scouting introductions",
      "Unlimited trial slot bookings",
      "Direct coach WhatsApp line",
    ],
    badge: null,
    is_featured: false,
    cta_label: "Choose Elite",
    sort_order: 3,
    is_active: true,
  },
];

export const DEFAULT_VIDEOS: Video[] = [
  {
    id: "seed-v1",
    title: "First-Touch Under Pressure",
    category: "Drills",
    duration_min: 14,
    thumbnail_url:
      "https://images.unsplash.com/photo-1641280173256-0ac1b2f4cd78?auto=format&fit=crop&w=740&h=460&q=80",
    video_url: null,
    description: null,
    position_tag: null,
    is_new: true,
    is_public: true,
    sort_order: 1,
  },
  {
    id: "seed-v2",
    title: "Reading The Back Four",
    category: "Match Analysis",
    duration_min: 22,
    thumbnail_url:
      "https://images.unsplash.com/photo-1522778119026-d647f0596c20?auto=format&fit=crop&w=740&h=460&q=80",
    video_url: null,
    description: null,
    position_tag: null,
    is_new: false,
    is_public: true,
    sort_order: 2,
  },
  {
    id: "seed-v3",
    title: "Post-Match Recovery Flow",
    category: "Recovery",
    duration_min: 9,
    thumbnail_url:
      "https://images.unsplash.com/photo-1575361204480-aadea25e6e68?auto=format&fit=crop&w=740&h=460&q=80",
    video_url: null,
    description: null,
    position_tag: null,
    is_new: false,
    is_public: true,
    sort_order: 3,
  },
  {
    id: "seed-v4",
    title: "Finishing Clinic: Near Post",
    category: "Drills",
    duration_min: 17,
    thumbnail_url:
      "https://images.unsplash.com/photo-1551280857-2b9bbe52acf4?auto=format&fit=crop&w=740&h=460&q=80",
    video_url: null,
    description: null,
    position_tag: null,
    is_new: false,
    is_public: true,
    sort_order: 4,
  },
  {
    id: "seed-v5",
    title: "Fuelling For A 6pm Kickoff",
    category: "Nutrition",
    duration_min: 11,
    thumbnail_url:
      "https://images.unsplash.com/photo-1490645935967-10de6ba17061?auto=format&fit=crop&w=740&h=460&q=80",
    video_url: null,
    description: null,
    position_tag: null,
    is_new: true,
    is_public: true,
    sort_order: 5,
  },
  {
    id: "seed-v6",
    title: "1v1 Defending Fundamentals",
    category: "Drills",
    duration_min: 19,
    thumbnail_url:
      "https://images.unsplash.com/photo-1504305754058-2f08ccd89a0a?auto=format&fit=crop&w=740&h=460&q=80",
    video_url: null,
    description: null,
    position_tag: null,
    is_new: false,
    is_public: true,
    sort_order: 6,
  },
];
