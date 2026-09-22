import { SiteHeader } from "@/components/landing/SiteHeader";
import { Hero } from "@/components/landing/Hero";
import { Pillars, HowItWorks, About, FinalCta } from "@/components/landing/Sections";
import { Plans } from "@/components/landing/Plans";
import { PlatformPreview } from "@/components/landing/PlatformPreview";
import { Faq } from "@/components/landing/Faq";
import { Footer } from "@/components/landing/Footer";
import { getPlans } from "@/lib/data";
import { getUser } from "@/lib/supabase/server";

/* Rendered per request: the header reflects whether the visitor is signed
   in, which means reading cookies, which rules out static caching. */

export default async function Home() {
  const [user, plans] = await Promise.all([getUser(), getPlans()]);

  return (
    <>
      <a
        href="#main"
        className="absolute left-4 top-[-60px] z-[200] rounded-md border border-[var(--line-strong)] bg-ink-700 px-4 py-2.5 text-[0.8125rem] transition-[top] focus:top-4"
      >
        Skip to content
      </a>

      <SiteHeader signedIn={Boolean(user)} />

      <main id="main">
        <Hero />
        <Pillars />
        <HowItWorks />
        <Plans plans={plans} />
        <PlatformPreview />
        <About />
        <Faq />
        <FinalCta />
      </main>

      <Footer />
    </>
  );
}
