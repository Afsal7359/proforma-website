import { getSiteContent, getPublicPlans, getPublicVideos } from "@/lib/content";
import { SiteNav } from "@/components/site/SiteNav";
import { SiteFooter } from "@/components/site/SiteFooter";
import { ScrollReveal } from "@/components/site/ScrollReveal";
import { PlansSection } from "@/components/site/PlansSection";
import {
  Hero,
  Ticker,
  Pillars,
  TrialsSection,
  CoachingSplit,
  TrainingSection,
  CareerSection,
  NutritionSection,
  TrackingSection,
  VideosSection,
  CheckoutSection,
  TestimonialsSection,
  FinalCta,
} from "@/components/site/Sections";

/** Content is admin-editable, so the page revalidates rather than going static. */
export const revalidate = 60;

export default async function HomePage() {
  const [content, plans, videos] = await Promise.all([
    getSiteContent(),
    getPublicPlans(),
    getPublicVideos(),
  ]);

  const wa = process.env.NEXT_PUBLIC_WHATSAPP_SUPPORT;
  const enquiryHref = wa
    ? `https://wa.me/${wa}?text=${encodeURIComponent(
        "Hi Proforma Co — I'd like to join the coaching programme.",
      )}`
    : "#checkout";

  return (
    <>
      <ScrollReveal />
      <SiteNav brand={content.brand} links={content.nav.links} />

      <main id="top">
        <Hero hero={content.hero} />
        <Ticker ticker={content.ticker} />
        <Pillars pillars={content.pillars} />
        <TrialsSection trials={content.trials} />
        <CoachingSplit coaching={content.coaching} />
        <TrainingSection training={content.training} />
        <CareerSection career={content.career} />
        <NutritionSection nutrition={content.nutrition} />
        <TrackingSection tracking={content.tracking} />
        <PlansSection
          plans={plans}
          copy={content.plans}
          enquiryHref={enquiryHref}
        />
        <VideosSection videos={videos} copy={content.videos} />
        <CheckoutSection checkout={content.checkout} />
        <TestimonialsSection testimonials={content.testimonials} />
        <FinalCta finalCta={content.finalCta} />
      </main>

      <SiteFooter brand={content.brand} footer={content.footer} />
    </>
  );
}
