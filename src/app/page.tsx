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

export default function Page() {
  return (
    <>
      <Hero />

      <WaveDivider
        variant="blob"
        fromColor="rgba(192,199,209,0.12)"
        toColor="rgba(24,71,161,0.08)"
        height={120}
      />

      <About />

      <WaveDivider
        variant="wave-inverted"
        fromColor="rgba(24,71,161,0.05)"
        toColor="rgba(192,199,209,0.12)"
        flip
        height={140}
      />

      <Stats />

      <WaveDivider
        variant="curve"
        fromColor="#f7f9ff"
        toColor="#f7f9ff"
        height={120}
      />

      <Divisions />

      <WaveDivider
        variant="wave"
        fromColor="#f7f9ff"
        toColor="#ffffff"
        flip
        height={140}
      />

      <Projects />

      <WaveDivider
        variant="blob"
        fromColor="#ffffff"
        toColor="#f7f9ff"
        height={120}
      />

      <WhyUs />

      <WaveDivider
        variant="tilt"
        fromColor="#f7f9ff"
        toColor="#ffffff"
        flip
        height={100}
      />

      <Testimonials />

      <WaveDivider
        variant="curve"
        fromColor="rgba(192,199,209,0.12)"
        toColor="rgba(24,71,161,0.05)"
        height={140}
      />

      <Contact />

      <WaveDivider
        variant="wave-inverted"
        fromColor="rgba(24,71,161,0.05)"
        toColor="rgba(192,199,209,0.12)"
        flip
        height={120}
      />

      <Newsletter />
    </>
  );
}
