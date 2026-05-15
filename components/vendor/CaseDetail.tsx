"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, useReducedMotion, AnimatePresence } from "motion/react";
import { useRouter } from "next/navigation";
import type { BidOnCase, CaseDetailData } from "./types";
import { deriveBidStatus } from "./types";
import BidModal from "./BidModal";
import BidRow from "./BidRow";
import { signTransaction, connectWallet } from "@/lib/walletKit";
import { sendSignedTransaction } from "@/lib/trustlesswork";
import RaiseDisputeButton from "../dispute/RaiseDisputeButton";
import { MarkTreatmentDoneButton } from "./MarkTreatmentDoneButton";

interface CaseDetailProps {
  id: string;
  viewerRole?: "FARMER" | "VENDOR";
}

export default function CaseDetail({ id, viewerRole = "VENDOR" }: CaseDetailProps) {
  const router = useRouter();
  const reduceMotion = useReducedMotion();
  const [caseData, setCaseData] = useState<CaseDetailData | null>(null);
  const [caseStatus, setCaseStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bidOpen, setBidOpen] = useState(false);
  const [acceptingBidId, setAcceptingBidId] = useState<string | null>(null);
  const [fundingEscrow, setFundingEscrow] = useState(false);
  const [escrowError, setEscrowError] = useState<string | null>(null);
  const [escrowNotice, setEscrowNotice] = useState<string | null>(null);
  const [userWalletAddress, setUserWalletAddress] = useState<string | null>(null);
  const [walletChecking, setWalletChecking] = useState(true);
  const [releasingFunds, setReleasingFunds] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentUserRole, setCurrentUserRole] = useState<"FARMER" | "VENDOR" | null>(viewerRole === "VENDOR" ? null : (viewerRole as "FARMER" | "VENDOR"));

  const fetchCase = useCallback(async () => {
    try {
      const res = await fetch(`/api/cases/${id}`);
      if (!res.ok) throw new Error("Failed to load case");
      const data = await res.json();
      const fetched: CaseDetailData | null = data.case ?? null;
      setCaseData(fetched);
      if (fetched) setCaseStatus(fetched.status);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void fetchCase();

    async function checkWallet() {
      try {
        const { isConnected, getAddress } = await import("@stellar/freighter-api");
        const freighterReady = await isConnected().catch(() => ({ isConnected: false }));
        const walletConnected = typeof freighterReady === "boolean" ? freighterReady : freighterReady.isConnected;
        if (walletConnected) {
          const { address } = await getAddress();
          setUserWalletAddress(address);
        }
      } catch {
        // Ignore wallet detection errors
      } finally {
        setWalletChecking(false);
      }
    }
    checkWallet();

    async function checkRole() {
      if (viewerRole !== "VENDOR") return;
      try {
        const token = localStorage.getItem("agroshield_token");
        if (!token) return;
        const res = await fetch("/api/auth/me", {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setCurrentUserId(data?.user?.id ?? null);
          setCurrentUserRole(data?.user?.role ?? "VENDOR");
        }
      } catch {
        setCurrentUserRole("VENDOR");
      }
    }
    checkRole();
  }, [id, fetchCase, viewerRole]);

  const handleAcceptBid = async (bid: BidOnCase) => {
    setAcceptingBidId(bid.id);
    setEscrowError(null);
    setEscrowNotice(null);

    try {
      const token = localStorage.getItem("agroshield_token");
      if (!token) throw new Error("Please log in again to continue.");

      // Ensure wallet is connected using our new kit
      let walletAddress = userWalletAddress;
      if (!walletAddress) {
        walletAddress = await connectWallet();
        setUserWalletAddress(walletAddress);
      }

      const createRes = await fetch("/api/escrow/create", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ caseId: id, bidId: bid.id }),
      });

      const createData = await createRes.json();
      if (!createRes.ok || !createData.unsignedTransaction || !createData.escrowId) {
        throw new Error(createData.error ?? "Failed to create escrow.");
      }

      // Sign with our new kit on TESTNET
      const signedTxXdr = await signTransaction({
        unsignedTransaction: createData.unsignedTransaction,
        address: walletAddress,
      });

      // Send to Trustless Work
      const txResult = await sendSignedTransaction(signedTxXdr);
      const contractId = txResult.contractId || txResult.result?.contractId || txResult.data?.contractId;

      if (!contractId) {
        throw new Error("Failed to extract contractId from TW response.");
      }

      // Confirm with our backend
      const confirmRes = await fetch("/api/escrow/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ escrowId: createData.escrowId, bidId: bid.id, contractId }),
      });

      if (!confirmRes.ok) {
        const confirmData = await confirmRes.json().catch(() => ({}));
        throw new Error(confirmData.error ?? "Failed to confirm escrow deployment.");
      }

      setEscrowNotice("Escrow deployed! Fund it with USDC to start the contract.");
      await fetchCase();
    } catch (err) {
      setEscrowError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setAcceptingBidId(null);
    }
  };

  const handleFundEscrow = async () => {
    if (!caseData?.escrow) return;

    setEscrowError(null);
    setEscrowNotice(null);
    setFundingEscrow(true);

    try {
      const token = localStorage.getItem("agroshield_token");
      if (!token) throw new Error("Please log in again to continue.");

      let walletAddress = userWalletAddress;
      if (!walletAddress) {
        walletAddress = await connectWallet();
        setUserWalletAddress(walletAddress);
      }

      const fundRes = await fetch("/api/escrow/fund", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ escrowId: caseData.escrow.id }),
      });

      const fundData = await fundRes.json();
      if (!fundRes.ok || !fundData.unsignedTransaction) {
        throw new Error(fundData.error ?? "Failed to create funding transaction.");
      }

      // Sign with our new kit
      const signedTxXdr = await signTransaction({
        unsignedTransaction: fundData.unsignedTransaction,
        address: walletAddress,
      });

      // Send to Trustless Work
      await sendSignedTransaction(signedTxXdr);

      // Confirm with our backend
      const confirmRes = await fetch("/api/escrow/fund/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ escrowId: caseData.escrow.id }),
      });

      if (!confirmRes.ok) {
        const confirmData = await confirmRes.json().catch(() => ({}));
        throw new Error(confirmData.error ?? "Failed to confirm funding.");
      }

      setEscrowNotice("Escrow funded! Treatment can now begin.");
      await fetchCase();
    } catch (err) {
      setEscrowError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setFundingEscrow(false);
    }
  };

  const handleReleaseFunds = async () => {
    if (!caseData?.escrow?.contractId) return;
    setReleasingFunds(true);
    setEscrowError(null);

    try {
      const token = localStorage.getItem("agroshield_token");
      if (!token) throw new Error("Please log in again to continue.");

      let walletAddress = userWalletAddress;
      if (!walletAddress) {
        walletAddress = await connectWallet();
        setUserWalletAddress(walletAddress);
      }

      const res = await fetch("/api/escrow/release", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ contractId: caseData.escrow.contractId }),
      });

      const data = await res.json();
      if (!res.ok || !data.unsignedTransaction) {
        throw new Error(data.error ?? "Failed to create release transaction.");
      }

      const signedTxXdr = await signTransaction({
        unsignedTransaction: data.unsignedTransaction,
        address: walletAddress,
      });

      await sendSignedTransaction(signedTxXdr);

      setEscrowNotice("Funds released successfully! Case complete.");
      await fetchCase();
    } catch (err) {
      setEscrowError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setReleasingFunds(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-5xl animate-pulse py-10">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_380px]">
          <div>
            <div className="aspect-[4/3] rounded-2xl bg-stone-200/40" />
            <div className="mt-6 space-y-4">
              <div className="h-4 w-24 rounded-full bg-stone-200/40" />
              <div className="h-10 w-3/4 rounded-2xl bg-stone-200/40" />
              <div className="h-4 w-1/2 rounded-full bg-stone-200/40" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!caseData) {
    return (
      <div className="py-20 text-center">
        <p className="text-neutral-500">Case not found.</p>
      </div>
    );
  }

  const diagnosis = caseData.diagnosis;
  const disease = diagnosis?.disease ?? "Unknown Condition";
  const confidence = diagnosis?.confidence ? Math.round(diagnosis.confidence * 100) : null;
  const urgency = String(diagnosis?.urgency ?? "NORMAL").toUpperCase();
  const isOpen = caseData.status === "OPEN";

  return (
    <div className="mx-auto w-full max-w-5xl">
      <div className="grid grid-cols-1 gap-12 lg:grid-cols-[1fr_380px]">
        {/* Main Content */}
        <div className="space-y-10">
          <section>
            <div className="aspect-[4/3] overflow-hidden rounded-[32px] bg-neutral-200 shadow-xl">
              <img
                src={caseData.imageUrl}
                alt={disease}
                className="h-full w-full object-cover transition-transform duration-700 hover:scale-105"
              />
            </div>
          </section>

          <section>
            <div className="flex items-center gap-3">
              <span className={`rounded-full px-3 py-1 text-[10px] font-bold tracking-widest text-white ${
                urgency === "HIGH" ? "bg-red-500 shadow-lg shadow-red-200" : "bg-green-500 shadow-lg shadow-green-200"
              }`}>
                {urgency}
              </span>
              <span className="rounded-full bg-neutral-100 px-3 py-1 text-[10px] font-bold tracking-widest text-neutral-500">
                {caseData.status}
              </span>
            </div>

            <h1 className="mt-4 font-[family-name:var(--font-manrope)] text-4xl font-extrabold tracking-tight text-neutral-900">
              {disease}
            </h1>

            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              <MetaCell label="Confidence" value={confidence ? `${confidence}%` : "N/A"} icon="🎯" />
              <MetaCell label="Farmer" value={caseData.farmer.email} icon="👤" />
              <MetaCell label="Submitted" value={new Date(caseData.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })} icon="📅" />
              <MetaCell label="Location" value={(diagnosis as any)?.location ?? "Location on file"} icon="📍" />
            </div>
          </section>

          <section className="space-y-4">
            <h3 className="font-[family-name:var(--font-manrope)] text-xl font-bold text-neutral-900">
              Assessment & Treatment
            </h3>
            <div className="space-y-6 text-sm leading-relaxed text-neutral-600">
              <div>
                <p className="font-semibold text-neutral-800">Observation</p>
                <p className="mt-1">{diagnosis?.description ?? "No detailed description available."}</p>
              </div>
              <div>
                <p className="font-semibold text-neutral-800">Recommended Steps</p>
                <p className="mt-1">{diagnosis?.treatment ?? "Waiting for vendor proposal."}</p>
              </div>
            </div>
          </section>
        </div>

        {/* Sidebar */}
        <aside className="lg:sticky lg:top-32 h-fit">
          <div className="rounded-[32px] bg-white/40 p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] backdrop-blur-md border border-white/20">
            {isOpen && currentUserRole === "VENDOR" ? (
              <div className="space-y-6">
                <div className="text-center">
                  <p className="text-sm font-semibold text-neutral-800">Ready to treat this case?</p>
                  <p className="mt-1 text-xs text-neutral-500">Submit your proposal with pricing and delivery time.</p>
                </div>
                <button
                  onClick={() => setBidOpen(true)}
                  className="w-full rounded-full bg-neutral-900 py-4 text-sm font-bold text-white shadow-xl transition hover:-translate-y-0.5 hover:bg-neutral-800 active:scale-[0.98]"
                >
                  Submit a Bid
                </button>
                <div className="flex items-center justify-between border-t border-neutral-100 pt-6">
                  <div className="text-center flex-1 border-r border-neutral-100">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">Current Bids</p>
                    <p className="mt-1 text-lg font-bold text-neutral-900">{caseData.bids.length}</p>
                  </div>
                  <div className="text-center flex-1">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">Posted</p>
                    <p className="mt-1 text-lg font-bold text-neutral-900">
                      {new Date(caseData.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                    </p>
                  </div>
                </div>
              </div>
            ) : caseData.escrow ? (
              <div className="space-y-6">
                <div className="rounded-2xl bg-white/60 p-5 text-center">
                  <p className="text-xs font-bold uppercase tracking-widest text-neutral-400">Escrow Status</p>
                  <p className="mt-1 font-bold text-neutral-900">{caseData.escrow.status.replace(/_/g, " ")}</p>
                </div>

                {caseData.escrow.status === "AWAITING_FUNDING" && (currentUserRole === "FARMER" || viewerRole === "FARMER") && (
                  <button
                    onClick={handleFundEscrow}
                    disabled={fundingEscrow}
                    className="w-full rounded-full bg-green-600 py-4 text-sm font-bold text-white shadow-lg transition hover:bg-green-700 disabled:opacity-50"
                  >
                    {fundingEscrow ? "Processing..." : "Fund Escrow (USDC)"}
                  </button>
                )}

                {caseData.escrow.status === "DEPOSITED" && (
                  <div className="space-y-4">
                    <div className="rounded-2xl bg-green-50 p-4 text-center">
                      <p className="text-xs font-semibold text-green-700">Funds secured in Escrow</p>
                    </div>
                    {currentUserRole === "VENDOR" && (
                      <MarkTreatmentDoneButton 
                        caseId={id} 
                        contractId={caseData.escrow.contractId!}
                        onSuccess={fetchCase}
                      />
                    )}
                    {(currentUserRole === "FARMER" || viewerRole === "FARMER") && (
                      <button
                        onClick={handleReleaseFunds}
                        disabled={releasingFunds}
                        className="w-full rounded-full bg-neutral-900 py-4 text-sm font-bold text-white shadow-xl transition hover:bg-neutral-800 disabled:opacity-50"
                      >
                        {releasingFunds ? "Releasing..." : "Release Funds to Vendor"}
                      </button>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="py-4 text-center">
                <p className="text-sm font-medium text-neutral-500">Case is {caseData.status.toLowerCase()}</p>
              </div>
            )}

            {escrowError && (
              <div className="mt-4 rounded-xl bg-red-50 p-3 text-xs text-red-600 border border-red-100">
                {escrowError}
              </div>
            )}
            {escrowNotice && (
              <div className="mt-4 rounded-xl bg-green-50 p-3 text-xs text-green-600 border border-green-100">
                {escrowNotice}
              </div>
            )}
          </div>

          <div className="mt-6 px-4">
            <RaiseDisputeButton caseId={id} onDisputeRaised={fetchCase} />
          </div>
        </aside>
      </div>

      {/* Bids List */}
      <div className="mt-16">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="font-[family-name:var(--font-manrope)] text-2xl font-bold text-neutral-900">
            Market Proposals
          </h2>
          <span className="text-xs font-bold uppercase tracking-widest text-neutral-400">
            {caseData.bids.length} Received
          </span>
        </div>

        <div className="grid gap-4">
          {caseData.bids.map((bid, i) => {
            const status = deriveBidStatus(bid.selected, caseData.status);
            const amount = `$${Number(bid.amount).toFixed(2)}`;

            return (
              <BidRow
                key={bid.id}
                title={bid.vendor.email}
                subtitle={bid.proposal}
                amount={amount}
                status={status}
                index={i}
                action={
                  (viewerRole === "FARMER" || currentUserRole === "FARMER") &&
                  currentUserId === caseData.farmer.id &&
                  isOpen && !bid.selected ? (
                    <button
                      onClick={() => handleAcceptBid(bid)}
                      disabled={acceptingBidId === bid.id}
                      className="rounded-full bg-neutral-900 px-4 py-1.5 text-xs font-bold text-white transition hover:bg-neutral-800 disabled:opacity-50"
                    >
                      {acceptingBidId === bid.id ? "..." : "Accept"}
                    </button>
                  ) : null
                }
              />
            );
          })}
          {caseData.bids.length === 0 && (
            <div className="rounded-[32px] border border-dashed border-neutral-200 py-20 text-center">
              <p className="text-sm text-neutral-400 font-medium">Awaiting first vendor proposal</p>
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {bidOpen && (
          <BidModal 
            caseId={id} 
            onClose={() => setBidOpen(false)} 
            onSuccess={fetchCase} 
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function MetaCell({ label, value, icon }: { label: string; value: string; icon: string }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-white/50 px-5 py-4 shadow-sm border border-white/20">
      <span className="text-lg">{icon}</span>
      <div className="min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">{label}</p>
        <p className="truncate text-sm font-bold text-neutral-800">{value}</p>
      </div>
    </div>
  );
}
