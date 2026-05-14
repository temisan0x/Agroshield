// ─── Shared Vendor Domain Types ───────────────────────────────────────────────

/** Shape returned by GET /api/vendors/me */
export interface VendorProfileData {
  id: string;
  userId: string;
  businessName: string | null;
  bio: string | null;
  specialization: string | null;
  experienceYears: number | null;
  location: string | null;
  phone: string | null;
  createdAt: string;
  updatedAt: string;
}

/** Payload for PATCH /api/vendors/me */
export interface VendorProfilePayload {
  businessName?: string;
  bio?: string;
  specialization?: string;
  experienceYears?: number;
  location?: string;
  phone?: string;
}

/** Parsed diagnosis object from the API */
export interface Diagnosis {
  disease: string;
  confidence: number;
  description?: string;
  [key: string]: unknown;
}

/** Shape returned by GET /api/cases (list item) */
export interface CaseListItem {
  id: string;
  farmerId: string;
  imageUrl: string;
  diagnosis: Diagnosis | null;
  status: string;
  createdAt: string;
  farmer: { email: string };
  _count: { bids: number };
}

/** Shape returned by GET /api/cases/[id] */
export interface CaseDetailData {
  id: string;
  farmerId: string;
  imageUrl: string;
  diagnosis: Diagnosis | null;
  status: string;
  createdAt: string;
  farmer: { id: string; email: string };
  bids: BidOnCase[];
  escrow: EscrowData | null;
  dispute: DisputeData | null;
}

export interface BidOnCase {
  id: string;
  caseId: string;
  vendorId: string;
  amount: number | string;
  proposal: string;
  selected: boolean;
  createdAt: string;
  vendor: { id: string; email: string; walletAddress: string | null };
}

export interface EscrowData {
  id: string;
  caseId: string;
  contractId: string | null;
  status: string;
  amount: number | string;
  createdAt: string;
}

export interface DisputeData {
  id: string;
  caseId: string;
  reason: string;
  status: string;
  resolvedBy: string | null;
  createdAt: string;
}

/** Shape of a bid owned by the vendor (for /vendor/bids) */
export interface VendorBidItem {
  id: string;
  caseId: string;
  vendorId: string;
  amount: number | string;
  proposal: string;
  selected: boolean;
  createdAt: string;
  vendor: { email: string; walletAddress: string | null };
}

// ─── Status helpers ───────────────────────────────────────────────────────────

export type BidStatus = "PENDING" | "ACCEPTED" | "REJECTED";

/** Derive a human-readable bid status from the `selected` boolean + case status */
export function deriveBidStatus(selected: boolean, caseStatus?: string): BidStatus {
  if (selected) return "ACCEPTED";
  // If the case is no longer OPEN and the bid wasn't selected, it was implicitly rejected
  if (caseStatus && caseStatus !== "OPEN" && !selected) return "REJECTED";
  return "PENDING";
}

export const STATUS_STYLES: Record<BidStatus, { bg: string; text: string; dot: string; label: string }> = {
  PENDING:  { bg: "bg-amber-50",   text: "text-amber-700",   dot: "bg-amber-400",   label: "Pending"  },
  ACCEPTED: { bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-400", label: "Accepted" },
  REJECTED: { bg: "bg-red-50",     text: "text-red-600",     dot: "bg-red-400",     label: "Rejected" },
};
