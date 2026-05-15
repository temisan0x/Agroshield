import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import VendorCases from "@/components/vendor/VendorCases";

export const metadata = {
  title: "Open Cases | AgroShield",
  description: "Marketplace feed of open farmer cases",
};

export default function VendorCasesPage() {
  return (
    <div className="min-h-screen bg-[#F5F0EB]">
      <Nav />
      <main className="pt-28 pb-24">
        <VendorCases />
      </main>
      <Footer />
    </div>
  );
}
