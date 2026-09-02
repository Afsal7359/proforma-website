/**
 * Every word on the public site, exactly as it appears in the original design.
 *
 * This object is both:
 *   1. the seed payload for the `site_content` table, and
 *   2. the runtime fallback, so the site renders correctly even before
 *      Supabase is connected or if a section row is missing.
 *
 * Convention: `**text**` inside a heading renders as the blue accent
 * (the original design's `<em>` / `.line-accent`), and `\n` renders as `<br>`.
 */

export type NavLink = { label: string; href: string };
export type HeroStat = { value: string; label: string };
export type HeroChip = { value: string; label: string };
export type Pillar = { num: string; title: string; text: string };
export type PositionCard = {
  index: string;
  title: string;
  text: string;
  space: string;
  sessions: string;
};
export type CareerStep = { num: string; title: string; text: string };
export type NutritionCard = {
  title: string;
  text: string;
  carbs: number;
  protein: number;
  fat: number;
};
export type MetricRow = { label: string; value: number };
export type MethodStep = { icon: string; title: string; text: string };
export type Testimonial = { quote: string; name: string; meta: string };
export type PayMethod = { icon: string; label: string };
export type TrustItem = { icon: string; text: string };
export type FooterColumn = { heading: string; links: NavLink[] };
export type SocialLink = { icon: string; href: string; label: string };

export type SiteContent = {
  brand: {
    name: string;
    sub: string;
    navCtaLabel: string;
    navCtaHref: string;
  };
  nav: { links: NavLink[] };
  hero: {
    eyebrow: string;
    headline: string;
    paragraph: string;
    primaryCta: NavLink;
    secondaryCta: NavLink;
    stats: HeroStat[];
    photos: string[];
    chips: HeroChip[];
  };
  ticker: { label: string; items: { city: string; date: string }[] };
  pillars: { items: Pillar[] };
  trials: {
    eyebrow: string;
    title: string;
    sub: string;
    photo: string;
    captionLabel: string;
    captionSub: string;
    /** Gated panel shown instead of the live trial list */
    gateHeading: string;
    gateText: string;
    gateCtaLabel: string;
    gateBullets: string[];
    footnote: string;
    footnoteCtaLabel: string;
  };
  coaching: {
    eyebrow: string;
    title: string;
    sub: string;
    photo: string;
    badgeNumber: string;
    badgeText: string;
    bullets: string[];
    ctaLabel: string;
    ctaHref: string;
  };
  training: {
    eyebrow: string;
    title: string;
    sub: string;
    positions: PositionCard[];
    note: string;
  };
  career: { eyebrow: string; title: string; sub: string; steps: CareerStep[] };
  nutrition: {
    eyebrow: string;
    title: string;
    sub: string;
    cards: NutritionCard[];
    include: string;
  };
  tracking: {
    eyebrow: string;
    title: string;
    sub: string;
    photo: string;
    metricsTitle: string;
    metricsCaption: string;
    metrics: MetricRow[];
    metricsFootnote: string;
    methodTitle: string;
    methodCaption: string;
    methodSteps: MethodStep[];
  };
  plans: {
    eyebrow: string;
    title: string;
    sub: string;
    monthlyLabel: string;
    annualLabel: string;
    annualSave: string;
    footnote: string;
  };
  videos: { eyebrow: string; title: string; sub: string };
  checkout: {
    eyebrow: string;
    title: string;
    methods: PayMethod[];
    trust: TrustItem[];
  };
  testimonials: { eyebrow: string; title: string; items: Testimonial[] };
  finalCta: {
    eyebrow: string;
    title: string;
    paragraph: string;
    ctaLabel: string;
    ctaHref: string;
  };
  footer: {
    about: string;
    newsletterPlaceholder: string;
    newsletterButton: string;
    columns: FooterColumn[];
    social: SocialLink[];
    copyright: string;
    legal: string;
  };
  seo: { title: string; description: string };
};

export const DEFAULT_CONTENT: SiteContent = {
  brand: {
    name: "PROFORMA CO",
    sub: "Sports Consultancy",
    navCtaLabel: "Book a Trial",
    navCtaHref: "#plans",
  },

  nav: {
    links: [
      { label: "Trials", href: "#trials" },
      { label: "Training", href: "#training" },
      { label: "Career", href: "#career" },
      { label: "Fitness", href: "#nutrition" },
      { label: "Tracking", href: "#tracking" },
      { label: "Plans", href: "#plans" },
      { label: "Videos", href: "#videos" },
    ],
  },

  hero: {
    eyebrow: "Pan-India Trials · Home Training · Pro Pathway",
    headline: "Train like the\nscout is **already**\nwatching",
    paragraph:
      "Proforma Co is a football-only coaching consultancy — trial placement across India, position-specific home training, nutrition guidance and a career roadmap, tracked week over week until you're ready for the next level.",
    primaryCta: { label: "Book a Trial Slot", href: "#plans" },
    secondaryCta: { label: "See the Tracking Method", href: "#tracking" },
    stats: [
      { value: "118+", label: "Trials Hosted" },
      { value: "24", label: "States Covered" },
      { value: "1,900+", label: "Athletes Tracked" },
    ],
    photos: [
      "https://images.unsplash.com/photo-1560272564-c83b66b1ad12?auto=format&fit=crop&w=500&h=500&q=80",
      "https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?auto=format&fit=crop&w=500&h=500&q=80",
      "https://images.unsplash.com/photo-1526232761682-d26e03ac148e?auto=format&fit=crop&w=500&h=500&q=80",
      "https://images.unsplash.com/photo-1600679472829-3044539ce8ed?auto=format&fit=crop&w=500&h=500&q=80",
    ],
    chips: [
      { value: "92%", label: "Drill Accuracy" },
      { value: "+41", label: "Sprint Index / 12wk" },
    ],
  },

  ticker: {
    label: "Live Trial Calendar",
    items: [
      { city: "MUMBAI", date: "AUG 09" },
      { city: "DELHI NCR", date: "AUG 16" },
      { city: "BENGALURU", date: "AUG 23" },
      { city: "KOLKATA", date: "AUG 30" },
      { city: "PUNE", date: "SEP 06" },
      { city: "CHENNAI", date: "SEP 13" },
      { city: "AHMEDABAD", date: "SEP 20" },
      { city: "LUCKNOW", date: "SEP 27" },
    ],
  },

  pillars: {
    items: [
      { num: "01", title: "Trials", text: "Scouted open trials, pan-India" },
      { num: "02", title: "Training", text: "Position-specific, at home" },
      { num: "03", title: "Tracking", text: "Five metrics, every session" },
      {
        num: "04",
        title: "Fitness & Nutrition",
        text: "Match-fit, not just gym-fit",
      },
    ],
  },

  trials: {
    eyebrow: "01 — Trials",
    title: "Open trials, closer to home, **every few weeks**",
    sub: "We run scouted open trials across India in partnership with regional academies. Every session is scored by our coaching panel and logged straight into your athlete profile — selected or not.",
    photo:
      "https://images.unsplash.com/photo-1517747614396-d21a78b850e8?auto=format&fit=crop&w=800&h=1000&q=80",
    captionLabel: "Pan-India Trial Network",
    captionSub: "6 active host cities, new cities added monthly",
    gateHeading: "The live trial calendar sits behind your athlete login",
    gateText:
      "Trial cities, dates, slot counts and your selection status are published inside your athlete portal. Your login is created by our team and sent to you on WhatsApp when you join the programme.",
    gateCtaLabel: "Log In To View Trials",
    gateBullets: [
      "Live city calendar with remaining slots",
      "One-tap slot reservation, confirmed by a coach",
      "Your scored trial result and panel notes",
    ],
    footnote: "New cities are added monthly, based on registration demand.",
    footnoteCtaLabel: "View Full Calendar",
  },

  coaching: {
    eyebrow: "Who's Coaching You",
    title: "Coaches who've sat where you're sitting",
    sub: "Every coach on the panel played competitively before they started scoring drills — so the feedback reads like scouting notes, not a generic report card.",
    photo:
      "https://images.unsplash.com/photo-1517927033932-b3d18e61fb3a?auto=format&fit=crop&w=900&h=700&q=80",
    badgeNumber: "6+",
    badgeText: "Years avg. coaching experience",
    bullets: [
      "Former state and academy-level footballers",
      "Trained, certified coaching staff with monthly calibration",
      "Direct scouting relationships with partner academies",
    ],
    ctaLabel: "See the Career Pathway",
    ctaHref: "#career",
  },

  training: {
    eyebrow: "02 — Training",
    title: "A pitch isn't required. **Repetition is.**",
    sub: "Live and recorded sessions built for a driveway, a terrace or a 4×4m room — position-specific, ball-mastery first, scaled to your current level.",
    positions: [
      {
        index: "01",
        title: "Striker",
        text: "Finishing under pressure, first-touch in tight space, movement off the last defender.",
        space: "4×4m",
        sessions: "4 / wk",
      },
      {
        index: "02",
        title: "Winger",
        text: "1v1 explosiveness, crossing accuracy, change-of-direction speed.",
        space: "5×5m",
        sessions: "4 / wk",
      },
      {
        index: "03",
        title: "Attacking Mid",
        text: "Vision drills, weighted passing, receiving on the half-turn.",
        space: "4×4m",
        sessions: "3 / wk",
      },
      {
        index: "04",
        title: "Center-Back",
        text: "Aerial duels, jockeying footwork, playing the ball out from the back.",
        space: "4×4m",
        sessions: "3 / wk",
      },
      {
        index: "05",
        title: "Full-Back",
        text: "Overlap timing, recovery sprints, delivery under fatigue.",
        space: "6×4m",
        sessions: "4 / wk",
      },
      {
        index: "06",
        title: "Goalkeeper",
        text: "Shot-stopping reflexes, distribution, one-on-one composure.",
        space: "4×3m",
        sessions: "5 / wk",
      },
    ],
    note: "Every drill is filmed by you on a phone and reviewed by a coach within 48 hours — no equipment beyond a ball and cones required.",
  },

  career: {
    eyebrow: "03 — Career Pathway",
    title: "From backyard drills to a **trial-ready file**",
    sub: "A fixed sequence, followed by every athlete on the programme — because a career doesn't start with a trial, it starts with an honest assessment.",
    steps: [
      {
        num: "01 /05",
        title: "Assessment Call",
        text: "A 30-minute video call with a coach to benchmark your current level, position and goals.",
      },
      {
        num: "02 /05",
        title: "Personalised Roadmap",
        text: "A 12-week plan covering training, fitness and the trials you're realistically ready for.",
      },
      {
        num: "03 /05",
        title: "Trial Preparation",
        text: "Mock evaluations scored exactly the way our scouting panel scores real trials.",
      },
      {
        num: "04 /05",
        title: "Scouting Introduction",
        text: "Your tracked athlete profile is shared with partner academies matching your age and position.",
      },
      {
        num: "05 /05",
        title: "Contract & Move Guidance",
        text: "Support reading offers, planning relocation and managing the transition — for you and your family.",
      },
    ],
  },

  nutrition: {
    eyebrow: "04 — Fitness & Nutrition",
    title: "Match-fit, **not just gym-fit**",
    sub: "Weight and nutrition plans built around match demands, not generic diet templates. Cut for pace, build for duels, or fuel for ninety minutes without crashing.",
    cards: [
      {
        title: "Lean For Pace",
        text: "Structured cut for players carrying extra weight into pre-season, without losing sprint power.",
        carbs: 50,
        protein: 30,
        fat: 20,
      },
      {
        title: "Build For Duels",
        text: "Controlled surplus for players who lose the physical battle, paired with progressive strength work.",
        carbs: 45,
        protein: 35,
        fat: 20,
      },
      {
        title: "Match-Day Fuelling",
        text: "Carb and hydration timing around kickoff, so your legs are still yours in minute eighty.",
        carbs: 60,
        protein: 20,
        fat: 20,
      },
    ],
    include:
      "Every track includes a 1:1 monthly check-in with a sports nutritionist and a weekly weigh-in log reviewed by your coach.",
  },

  tracking: {
    eyebrow: "05 — Performance Tracking",
    title: "Every session becomes **a data point**",
    sub: "Five metrics, one number that moves: Speed, Stamina, Technique, Strength and Agility — scored from your submitted drills and updated after every review.",
    photo:
      "https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&w=800&h=680&q=80",
    metricsTitle: "Five metrics, one profile",
    metricsCaption: "Current form, scored out of 100 after this week's review",
    metrics: [
      { label: "Speed", value: 82 },
      { label: "Stamina", value: 88 },
      { label: "Technique", value: 76 },
      { label: "Strength", value: 71 },
      { label: "Agility", value: 79 },
    ],
    metricsFootnote: "Up from an average baseline of 45 in Week 1",
    methodTitle: "Tracking Method",
    methodCaption: "How a drill becomes a metric",
    methodSteps: [
      {
        icon: "upload",
        title: "Submit Drill Video",
        text: "Film the weekly drill set on your phone and upload it from the app.",
      },
      {
        icon: "check",
        title: "Coach Scores It",
        text: "A coaching panel member scores technique, effort and outcome within 48 hours.",
      },
      {
        icon: "refresh",
        title: "Metrics Update",
        text: "Your Speed, Stamina, Technique, Strength and Agility scores shift on the radar.",
      },
      {
        icon: "chat",
        title: "Monthly Report Call",
        text: "A 15-minute call walks through your trend line and adjusts the roadmap.",
      },
    ],
  },

  plans: {
    eyebrow: "06 — Membership",
    title: "Pick a training load **you can sustain**",
    sub: "One subscription covers coaching, tracking and trial access. Upgrade or downgrade anytime.",
    monthlyLabel: "Monthly",
    annualLabel: "Annual",
    annualSave: "2 mo free",
    footnote:
      "Prices in INR, inclusive of coaching platform access. Cancel anytime. GST invoice provided at checkout.",
  },

  videos: {
    eyebrow: "07 — Session Library",
    title: "Drill it again until **it's automatic**",
    sub: "Every live session is recorded. Rewatch technique breakdowns, match analysis and recovery routines whenever you need them.",
  },

  checkout: {
    eyebrow: "08 — Checkout",
    title: "Secure checkout, **built for India**",
    methods: [
      { icon: "card", label: "UPI" },
      { icon: "card-dot", label: "Credit & Debit Cards" },
      { icon: "bank", label: "Net Banking" },
      { icon: "wallet", label: "Wallets" },
    ],
    trust: [
      { icon: "lock", text: "256-bit encrypted checkout" },
      { icon: "x", text: "Cancel anytime, no lock-in" },
      { icon: "file", text: "GST invoice on every payment" },
      { icon: "chat", text: "Support in English & Hindi" },
    ],
  },

  testimonials: {
    eyebrow: "Players On The Pathway",
    title: "Numbers convince coaches. **Stories convince us.**",
    items: [
      {
        quote:
          "Two Open Trials in six months. The mock evaluations were harder than the real thing, so walking onto the pitch in Bengaluru felt normal instead of terrifying.",
        name: "Arjun",
        meta: "16 · Pune",
      },
      {
        quote:
          "My weigh-ins used to be a guessing game. Now there's a plan for match days and a coach who actually looks at the numbers with me every month.",
        name: "Meher",
        meta: "15 · Kochi",
      },
      {
        quote:
          "The roadmap told me I wasn't ready for a trial yet — and it was right. Twelve weeks later, my radar chart backed up what my legs already knew.",
        name: "Devraj",
        meta: "19 · Ranchi",
      },
    ],
  },

  finalCta: {
    eyebrow: "Start Here",
    title:
      "Your first trial rejection shouldn't be the last time anyone saw you play",
    paragraph:
      "Book a free 20-minute assessment call. We'll tell you honestly where you stand and what a realistic 12-week plan looks like.",
    ctaLabel: "Book Your Free Assessment",
    ctaHref: "#plans",
  },

  footer: {
    about:
      "Football-only coaching consultancy. Pan-India trials, online training and a tracked pathway to the professional game.",
    newsletterPlaceholder: "Get new trial cities in your inbox",
    newsletterButton: "Notify Me",
    columns: [
      {
        heading: "Programs",
        links: [
          { label: "Trials", href: "#trials" },
          { label: "Home Training", href: "#training" },
          { label: "Career Pathway", href: "#career" },
          { label: "Nutrition", href: "#nutrition" },
          { label: "Performance Tracking", href: "#tracking" },
          { label: "Video Library", href: "#videos" },
        ],
      },
      {
        heading: "Company",
        links: [
          { label: "About Proforma Co", href: "#" },
          { label: "Coaching Panel", href: "#" },
          { label: "Partner Academies", href: "#" },
          { label: "Careers", href: "#" },
        ],
      },
      {
        heading: "Support",
        links: [
          { label: "Help Center", href: "#" },
          { label: "Contact a Coach", href: "#" },
          { label: "WhatsApp Support", href: "#" },
          { label: "FAQ", href: "#" },
        ],
      },
      {
        heading: "Legal",
        links: [
          { label: "Terms of Service", href: "#" },
          { label: "Privacy Policy", href: "#" },
          { label: "Refund Policy", href: "#" },
          { label: "GST Invoice", href: "#" },
        ],
      },
    ],
    social: [
      { icon: "instagram", href: "#", label: "Instagram" },
      { icon: "youtube", href: "#", label: "YouTube" },
      { icon: "whatsapp", href: "#", label: "WhatsApp" },
    ],
    copyright: "Proforma Co Sports Consultancy. All rights reserved.",
    legal:
      "Football-only coaching consultancy · Operating pan-India · Not affiliated with any national federation.",
  },

  seo: {
    title:
      "Proforma Co — Football Coaching Consultancy | Pan-India Trials & Online Training",
    description:
      "Proforma Co is a football-only coaching consultancy: pan-India trial placement, online home training, career guidance, nutrition consultancy and tracked performance — all in one subscription.",
  },
};

/** Human labels for the admin CMS section list. */
export const SECTION_LABELS: Record<keyof SiteContent, string> = {
  brand: "Brand & Logo",
  nav: "Navigation",
  hero: "Hero",
  ticker: "Trial Ticker",
  pillars: "Pillars Strip",
  trials: "Trials Section",
  coaching: "Coaching Panel",
  training: "Training Section",
  career: "Career Pathway",
  nutrition: "Fitness & Nutrition",
  tracking: "Performance Tracking",
  plans: "Membership Section",
  videos: "Video Library Section",
  checkout: "Checkout & Trust",
  testimonials: "Testimonials",
  finalCta: "Final CTA",
  footer: "Footer",
  seo: "SEO / Meta",
};
