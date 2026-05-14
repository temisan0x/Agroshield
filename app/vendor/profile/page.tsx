import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import VendorProfile from "@/components/vendor/VendorProfile";

export const metadata = {
  title: "Vendor Profile | AgroShield",
  description: "View and edit your vendor profile",
};

export default function VendorProfilePage() {
  return (
    <div className="min-h-screen bg-[#F5F0EB]">
      <Nav />
      <main className="pt-28 pb-24">
        <VendorProfile />
      </main>
      <Footer />
    </div>
  );
}