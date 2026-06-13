import type { Metadata } from "next";
import Hero from "@/components/Hero";
import About from "@/components/About";
import Divisions from "@/components/Divisions";
import Projects from "@/components/Projects";
import Stats from "@/components/Stats";
import WhyUs from "@/components/WhyUs";
import Testimonials from "@/components/Testimonials";
import Contact from "@/components/Contact";
import Newsletter from "@/components/Newsletter";
import WaveDivider from "@/components/WaveDivider";
import { getSiteUrl, absoluteUrl } from "@/lib/site-url";

const SITE_URL = getSiteUrl();
const OG_IMAGE = absoluteUrl("/og-image.jpg");

export const metadata: Metadata = {
  title: "PromisePD — Dhaka's trusted real-estate partner",
  description:
    "Dhaka's trusted partner for residential, commercial and investment property. Five divisions under one roof — real estate, construction, savings, Hajj and design.",
  alternates: { canonical: "/en", languages: { "bn-BD": "/", "en": "/en" } },
  openGraph: {
    type: "website",
    url: `${SITE_URL}/en`,
    title: "PromisePD — Dhaka's trusted real-estate partner",
    description:
      "Five divisions under one roof — real estate, construction, savings, Hajj and design.",
    siteName: "PromisePD",
    locale: "en",
    images: [{ url: OG_IMAGE, secureUrl: OG_IMAGE, type: "image/jpeg", width: 1200, height: 630, alt: "PromisePD" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "PromisePD — Dhaka's trusted real-estate partner",
    description: "Five divisions under one roof.",
    images: [{ url: OG_IMAGE, alt: "PromisePD" }],
  },
};

export default function EnHomePage() {
  return (
    <>
      <Hero />
      <WaveDivider variant="blob" fromColor="rgba(192,199,209,0.12)" toColor="rgba(24,71,161,0.08)" height={120} />
      <About />
      <WaveDivider variant="wave-inverted" fromColor="rgba(24,71,161,0.05)" toColor="rgba(192,199,209,0.12)" flip height={140} />
      <Stats />
      <WaveDivider variant="curve" fromColor="#f7f9ff" toColor="#f7f9ff" height={120} />
      <Divisions />
      <WaveDivider variant="wave" fromColor="#f7f9ff" toColor="#ffffff" flip height={140} />
      <Projects />
      <WaveDivider variant="blob" fromColor="#ffffff" toColor="#f7f9ff" height={120} />
      <WhyUs />
      <WaveDivider variant="tilt" fromColor="#f7f9ff" toColor="#ffffff" flip height={100} />
      <Testimonials />
      <WaveDivider variant="curve" fromColor="rgba(192,199,209,0.12)" toColor="rgba(24,71,161,0.05)" height={140} />
      <Contact />
      <WaveDivider variant="wave-inverted" fromColor="rgba(24,71,161,0.05)" toColor="rgba(192,199,209,0.12)" flip height={120} />
      <Newsletter />
    </>
  );
}
