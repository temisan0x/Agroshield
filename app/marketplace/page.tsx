import { prisma } from "@/lib/prisma";
import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import MarketplaceBrowser from "@/components/MarketplaceBrowser";

export const dynamic = "force-dynamic";

type MarketplaceCaseEntry = {
  id: string;
  imageUrl: string;
  diagnosis: string | null;
  status: string;
  createdAt: Date;
  farmer: { email: string };
  bids: Array<{
    amount: { toString(): string };
    createdAt: Date;
  }>;
};

type MarketplaceBidEntry = MarketplaceCaseEntry["bids"][number];

type Diagnosis = {
  disease?: string;
  crop?: string;
  urgency?: string;
  symptoms?: string;
  treatment?: string;
};

function parseDiagnosis(value: string | null): Diagnosis | null {
  if (!value) return null;

  try {
    return JSON.parse(value) as Diagnosis;
  } catch {
    return null;
  }
}

function formatCurrency(value: number | null) {
  if (value == null || Number.isNaN(value)) return null;

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

export default async function MarketplacePage() {
  const cases = await prisma.case.findMany({
    where: { status: { in: ["OPEN", "IN_PROGRESS"] } },
    include: {
      farmer: { select: { email: true } },
      bids: {
        select: { amount: true, createdAt: true },
        orderBy: { createdAt: "desc" },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const listings = cases.map((entry: MarketplaceCaseEntry) => {
    const diagnosis = parseDiagnosis(entry.diagnosis);
    const amounts = entry.bids
      .map((bid: MarketplaceBidEntry) => Number(bid.amount.toString()))
      .filter((value: number) => !Number.isNaN(value));
    const lowestBid = amounts.length > 0 ? Math.min(...amounts) : null;
    const latestBid = amounts.length > 0 ? amounts[0] : null;

    return {
      id: entry.id,
      imageUrl: entry.imageUrl,
      title: diagnosis?.disease ?? diagnosis?.crop ?? "Crop support case",
      crop: diagnosis?.crop ?? "General crop",
      disease: diagnosis?.disease ?? "Diagnosis pending",
      urgency: diagnosis?.urgency ?? "Medium urgency",
      status: entry.status,
      farmerEmail: entry.farmer.email,
      createdAt: entry.createdAt.toISOString(),
      bidCount: entry.bids.length,
      latestBid: formatCurrency(latestBid),
      lowestBid: formatCurrency(lowestBid),
      summary:
        diagnosis?.treatment ??
        diagnosis?.symptoms ??
        "Browse the case, review the crop context, and submit a treatment proposal.",
    };
  });

  return (
    <div className="min-h-screen bg-[#F5F0EB]">
      <Nav />
      <MarketplaceBrowser listings={listings} />
      <Footer />
    </div>
  );
}
