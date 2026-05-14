import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import VendorBids from "@/components/vendor/VendorBids";

export const metadata = {
  title: "My Bids | AgroShield",
  description: "View your submitted treatment bids and status",
};

export default function VendorBidsPage() {
  return (
    <div className="min-h-screen bg-[#F5F0EB]">
      <Nav />
      <main className="pt-28 pb-24">
        <VendorBids />
      </main>
      <Footer />
    </div>
  );
}
