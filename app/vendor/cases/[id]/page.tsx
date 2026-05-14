import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import CaseDetail from "@/components/vendor/CaseDetail";

export const metadata = {
  title: "Case Detail | AgroShield",
  description: "View case details and submit a bid",
};

export default async function VendorCaseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return (
    <div className="min-h-screen bg-[#F5F0EB]">
      <Nav />
      <main className="pt-28 pb-24">
        <CaseDetail id={id} />
      </main>
      <Footer />
    </div>
  );
}
