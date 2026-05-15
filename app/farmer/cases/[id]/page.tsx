import Link from "next/link";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import CaseDetail from "@/components/vendor/CaseDetail";

export const metadata = {
  title: "Farmer Case | AgroShield",
  description: "Review bids, fund escrow, and release payment for your crop case.",
};

export default async function FarmerCaseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  return (
    <div className="min-h-screen bg-[#F5F0EB]">
      <Nav />
      <main className="pt-28 pb-24">
        <div className="mx-auto max-w-5xl px-6 py-12">
          <Link
            href="/farmer/cases"
            className="mb-8 inline-flex items-center gap-1.5 text-sm text-neutral-500 transition-colors hover:text-neutral-800"
          >
            ← Back to My Cases
          </Link>
          <CaseDetail id={id} viewerRole="FARMER" />
        </div>
      </main>
      <Footer />
    </div>
  );
}
