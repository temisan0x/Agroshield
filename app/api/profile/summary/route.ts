import { NextResponse, type NextRequest } from "next/server";
import { getUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type FarmerCaseEntry = {
  id: string;
  diagnosis: string | null;
  status: string;
  createdAt: Date;
  _count: { bids: number };
  bids: Array<{
    amount: { toString(): string };
    selected: boolean;
    createdAt: Date;
  }>;
};

type VendorBidEntry = {
  id: string;
  caseId: string;
  selected: boolean;
  amount: { toString(): string };
  proposal: string;
  createdAt: Date;
  case: {
    id: string;
    status: string;
    createdAt: Date;
    diagnosis: string | null;
    farmer: { email: string };
  };
};

type Diagnosis = {
  disease?: string;
  crop?: string;
  urgency?: string;
  symptoms?: string;
  treatment?: string;
  preventive_measures?: string;
};

function parseDiagnosis(value: string | null): Diagnosis | null {
  if (!value) return null;

  try {
    return JSON.parse(value) as Diagnosis;
  } catch {
    return null;
  }
}

function formatCurrency(value: unknown) {
  const amount = Number(String(value ?? 0));
  if (Number.isNaN(amount)) return null;
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(value);
}

export async function GET(request: NextRequest) {
  try {
    const user = await getUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const baseUser = {
      id: user.id,
      email: user.email,
      username: user.username,
      role: user.role,
      walletAddress: user.walletAddress,
      profileImage: user.profileImage,
      createdAt: user.createdAt.toISOString(),
    };

    if (user.role === "FARMER") {
      const cases = await prisma.case.findMany({
        where: { farmerId: user.id },
        include: {
          _count: { select: { bids: true } },
          bids: {
            select: { amount: true, selected: true, createdAt: true },
            orderBy: { createdAt: "desc" },
            take: 1,
          },
        },
        orderBy: { createdAt: "desc" },
      });

      const totalBids = cases.reduce((sum: number, entry: FarmerCaseEntry) => sum + entry._count.bids, 0);
      const activeCases = cases.filter(
        (entry: FarmerCaseEntry) => entry.status === "OPEN" || entry.status === "IN_PROGRESS"
      ).length;
      const openCases = cases.filter((entry: FarmerCaseEntry) => entry.status === "OPEN").length;

      const items = cases.map((entry: FarmerCaseEntry) => {
        const diagnosis = parseDiagnosis(entry.diagnosis);
        const latestBid = entry.bids[0];

        return {
          id: entry.id,
          title: diagnosis?.disease ?? diagnosis?.crop ?? "Field case",
          summary:
            diagnosis?.treatment ?? diagnosis?.symptoms ?? "Waiting for the next vendor response.",
          status: entry.status,
          createdAt: entry.createdAt.toISOString(),
          meta: [
            `${entry._count.bids} bid${entry._count.bids === 1 ? "" : "s"}`,
            formatDate(entry.createdAt),
            latestBid?.amount != null ? `Latest ${formatCurrency(latestBid.amount)}` : "No bid yet",
          ].filter(Boolean) as string[],
        };
      });

      const activity = cases.slice(0, 4).map((entry: FarmerCaseEntry) => {
        const diagnosis = parseDiagnosis(entry.diagnosis);
        const latestBid = entry.bids[0];

        return {
          id: entry.id,
          title: diagnosis?.disease ?? "Case submitted",
          note:
            latestBid?.amount != null
              ? `Latest bid ${formatCurrency(latestBid.amount)}`
              : "Still awaiting vendor bids",
          time: formatDate(entry.createdAt),
          tone: entry.status === "OPEN" ? ("positive" as const) : ("neutral" as const),
        };
      });

      return NextResponse.json({
        success: true,
        profile: {
          user: baseUser,
          headline: "Keep every crop case, bid, and escrow milestone in one place.",
          subheadline:
            "Track new cases, monitor vendor interest, and stay on top of treatments as they move through the marketplace.",
          stats: [
            { label: "Cases submitted", value: String(cases.length), helper: "All-time crop cases" },
            { label: "Open cases", value: String(openCases), helper: "Ready for vendor bids" },
            { label: "Bids received", value: String(totalBids), helper: "Across all your cases" },
            { label: "Active cases", value: String(activeCases), helper: "Open or in progress" },
          ],
          items,
          activity,
          settings: [
            {
              label: "Notification cadence",
              value: "Real-time alerts",
              helper: "Bid updates and escrow changes",
            },
            {
              label: "Wallet status",
              value: user.walletAddress ? "Connected" : "Not connected",
              helper: user.walletAddress ?? "Add a wallet to settle payouts faster",
            },
            {
              label: "Account type",
              value: "Farmer",
              helper: "Optimized for crop submissions",
            },
          ],
        },
      });
    }

    const bids = await prisma.bid.findMany({
      where: { vendorId: user.id },
      include: {
        case: {
          select: {
            id: true,
            status: true,
            createdAt: true,
            diagnosis: true,
            farmer: { select: { email: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const selectedWins = bids.filter((entry: VendorBidEntry) => entry.selected).length;
    const distinctCases = new Set(bids.map((entry: VendorBidEntry) => entry.caseId)).size;
    const averageBid =
      bids.length > 0
        ? bids.reduce((sum: number, entry: VendorBidEntry) => sum + Number(entry.amount.toString()), 0) / bids.length
        : 0;

    const items = bids.map((entry: VendorBidEntry) => {
      const diagnosis = parseDiagnosis(entry.case.diagnosis);

      return {
        id: entry.id,
        title: diagnosis?.disease ?? diagnosis?.crop ?? "Marketplace bid",
        summary:
          entry.proposal || diagnosis?.treatment || "Your proposal is live in the marketplace.",
        status: entry.selected ? "Selected" : entry.case.status,
        createdAt: entry.createdAt.toISOString(),
        meta: [
          formatCurrency(entry.amount) ?? "Bid value unavailable",
          entry.case.farmer.email,
          formatDate(entry.createdAt),
        ],
      };
    });

    const activity = bids.slice(0, 4).map((entry: VendorBidEntry) => {
      const diagnosis = parseDiagnosis(entry.case.diagnosis);

      return {
        id: entry.id,
        title: diagnosis?.disease ?? "Bid placed",
        note:
          entry.selected ? "Your bid was selected for the case" : `Proposal sent to ${entry.case.farmer.email}`,
        time: formatDate(entry.createdAt),
        tone: entry.selected ? ("positive" as const) : ("neutral" as const),
      };
    });

    return NextResponse.json({
      success: true,
      profile: {
        user: baseUser,
        headline: "Track every bid and keep the best opportunities moving.",
        subheadline:
          "Watch active opportunities, refine proposals, and stay close to the farmers who need support.",
        stats: [
          { label: "Bids placed", value: String(bids.length), helper: "Submitted proposals" },
          { label: "Selected wins", value: String(selectedWins), helper: "Cases awarded to you" },
          { label: "Cases covered", value: String(distinctCases), helper: "Distinct marketplace cases" },
          { label: "Average bid", value: formatCurrency(averageBid) ?? "$0", helper: "Across all proposals" },
        ],
        items,
        activity,
        settings: [
          {
            label: "Notification cadence",
            value: "Priority alerts",
            helper: "New cases and bid updates",
          },
          {
            label: "Wallet status",
            value: user.walletAddress ? "Connected" : "Not connected",
            helper: user.walletAddress ?? "Connect a wallet before payout settlement",
          },
          {
            label: "Account type",
            value: "Vendor",
            helper: "Optimized for bids and fulfillment",
          },
        ],
      },
    });
  } catch (error) {
    console.error("[PROFILE_SUMMARY]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
