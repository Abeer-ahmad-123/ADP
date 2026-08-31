import ApproachSection from "@/components/ApproachSection";
import BookSection from "@/components/BookSection";
import FeedbackForm from "@/components/FeedbackForm";
import HeroSection from "@/components/HeroSection";
import ManifestoSection from "@/components/ManifestoSection";
import MembershipSection from "@/components/MembershipSection";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";

export default function PartyLanding({
  heroFlagCaption,
  heroFlagImageSrc,
}: {
  heroFlagCaption?: string;
  heroFlagImageSrc?: string;
}) {
  return (
    <main>
      <SiteHeader />
      <HeroSection
        heroFlagCaption={heroFlagCaption}
        heroFlagImageSrc={heroFlagImageSrc}
      />
      <ApproachSection />
      <ManifestoSection />
      <MembershipSection />
      <BookSection />
      <FeedbackForm />
      <SiteFooter />
    </main>
  );
}
