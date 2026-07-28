import BookSection from "@/components/BookSection";
import HeroSection from "@/components/HeroSection";
import ManifestoSection from "@/components/ManifestoSection";
import MembershipSection from "@/components/MembershipSection";
import SiteFooter from "@/components/SiteFooter";
import SiteHeader from "@/components/SiteHeader";

export default function PartyLanding() {
  return (
    <main>
      <SiteHeader />
      <HeroSection />
      <ManifestoSection />
      <MembershipSection />
      <BookSection />
      <SiteFooter />
    </main>
  );
}
