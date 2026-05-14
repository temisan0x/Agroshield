import Nav from "@/components/Nav";
import Hero from "@/components/Hero";
import Bento from "@/components/Bento";
import Section from "@/components/Section";
import CTA from "@/components/CTA";
import Footer from "@/components/Footer";
import FeatureCard from "@/components/FeatureCard";

export default function Home() {
  return (
    <div className="min-h-screen bg-[#F5F0EB]">
      <Nav />
      <Hero />
      <Bento />
      <Section
        id="farmers"
        label="🌾 For Farmers"
        heading="Upload. Diagnose. Get treated."
        subheading="No more guessing what's wrong with your crops. Get expert diagnosis instantly and pay only when the job is done."
      >
        <FeatureCard
          title="Instant AI Diagnosis"
          description="Upload a photo and get results in seconds."
        />
        <FeatureCard
          title="Verified Vendors"
          description="Only trusted local agronomists and vendors."
        />
        <FeatureCard
          title="Protected Payments"
          description="Escrow holds funds until delivery is confirmed."
        />
      </Section>
      <Section
        id="vendors"
        label="🏪 For Vendors"
        heading="Bid on cases. Get paid guaranteed."
        subheading="Browse open cases from farmers near you. Submit proposals. Escrow guarantees you get paid when you deliver."
      >
        <FeatureCard title="Browse Cases" description="See nearby farmer cases in real time." />
        <FeatureCard title="Place Bids" description="Submit your proposal and price." />
        <FeatureCard
          title="Guaranteed Payment"
          description="Smart contract releases funds on confirmation."
        />
      </Section>
      <CTA />
      <Footer />
    </div>
  );
}
