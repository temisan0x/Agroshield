"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, useReducedMotion, AnimatePresence } from "motion/react";
import type { BidOnCase, CaseDetailData } from "./types";
import { deriveBidStatus } from "./types";
import BidModal from "./BidModal";
import BidRow from "./BidRow";
import { signTransaction, isConnected } from "@stellar/freighter-api";

interface CaseDetailProps {
  id: string;
  viewerRole?: "FARMER" | "VENDOR";
}

export default function CaseDetail({ id, viewerRole = "VENDOR" }: CaseDetailProps) {
  const reduceMotion = useReducedMotion();
  const [caseData, setCaseData] = useState<CaseDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bidOpen, setBidOpen] = useState(false);
  const [acceptingBidId, setAcceptingBidId] = useState<string | null>(null);
  const [escrowError, setEscrowError] = useState<string | null>(null);
  const [escrowNotice, setEscrowNotice] = useState<string | null>(null);

  const fetchCase = useCallback(async () => {
    try {
      const res = await fetch(`/api/cases/${id}`);
      if (!res.ok) throw new Error("Failed to load case");
      const data = await res.json();
      setCaseData(data.case ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchCase(); }, [fetchCase]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-neutral-300 border-t-neutral-900" />
      </div>
    );
  }

  if (error || !caseData) {
    return (
      <div className="mx-auto max-w-md py-32 text-center">
        <div className="rounded-2xl border border-red-200 bg-red-50 px-6 py-8">
          <p className="text-sm font-semibold text-red-700">Error</p>
          <p className="mt-1 text-xs text-red-500">{error ?? "Case not found"}</p>
          <button onClick={() => { setError(null); setLoading(true); fetchCase(); }}
            className="mt-4 rounded-xl bg-neutral-900 px-4 py-2 text-xs font-semibold text-white transition hover:bg-neutral-800">
            Retry
          </button>
        </div>
      </div>
    );
  }

  const disease = caseData.diagnosis?.disease ?? "Undiagnosed";
  const confidence = caseData.diagnosis?.confidence;
  const description = caseData.diagnosis?.description;
  const date = new Date(caseData.createdAt).toLocaleDateString("en-NG", {
    month: "long", day: "numeric", year: "numeric",
  });

  const handleAcceptBid = async (bid: BidOnCase) => {
    setEscrowError(null);
    setEscrowNotice(null);
    setAcceptingBidId(bid.id);

    try {
      const token = localStorage.getItem("agroshield_token");
      if (!token) {
        throw new Error("Please log in again to continue.");
      }

      const createRes = await fetch("/api/escrow/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ caseId: caseData.id, bidId: bid.id }),
      });

      const createData = (await createRes.json()) as {
        unsignedTransaction?: string;
        escrowId?: string;
        error?: string;
      };

      if (!createRes.ok || !createData.unsignedTransaction || !createData.escrowId) {
        throw new Error(createData.error ?? "Failed to create escrow.");
      }

      const freighterReady = await isConnected().catch(() => false);
      if (!freighterReady) {
        setEscrowNotice("Install Freighter wallet to continue.");
        return;
      }

      const signedXdr = await signTransaction(createData.unsignedTransaction);

      const sendRes = await fetch("https://dev.api.trustlesswork.com/helper/send-transaction", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ xdr: signedXdr }),
      });

      const sendData = (await sendRes.json().catch(() => ({}))) as {
        contractId?: string;
        result?: { contractId?: string };
      };

      if (!sendRes.ok) {
        throw new Error("Failed to broadcast escrow transaction.");
      }

      const contractId = sendData.contractId ?? sendData.result?.contractId;
      if (!contractId) {
        throw new Error("Missing contract ID from escrow transaction.");
      }

      const confirmRes = await fetch("/api/escrow/confirm", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ escrowId: createData.escrowId, contractId }),
      });

      if (!confirmRes.ok) {
        const confirmData = await confirmRes.json().catch(() => ({}));
        throw new Error(confirmData.error ?? "Failed to confirm escrow.");
      }

      await fetchCase();
    } catch (err) {
      setEscrowError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setAcceptingBidId(null);
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-6">
      <motion.div
        initial={reduceMotion ? { opacity: 1 } : { opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative overflow-hidden rounded-[32px] border border-neutral-200 bg-white shadow-[0_30px_80px_-60px_rgba(0,0,0,0.4)]"
      >
        <div className="absolute right-0 top-0 h-64 w-64 -translate-y-16 translate-x-16 rounded-full bg-[#c7f1d2] opacity-60 blur-3xl" />
        <div className="absolute bottom-0 left-0 h-52 w-52 -translate-x-12 translate-y-12 rounded-full bg-[#f1dcc7] opacity-70 blur-2xl" />

        <div className="relative grid gap-0 lg:grid-cols-[1fr_1fr]">
          {/* Left: image */}
          <div className="relative h-72 overflow-hidden bg-neutral-100 lg:h-auto lg:min-h-[420px]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={caseData.imageUrl} alt={disease}
              className="h-full w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
            <span className={`absolute left-5 top-5 rounded-full px-3 py-1 text-xs font-semibold backdrop-blur-sm ${
              caseData.status === "OPEN" ? "bg-emerald-500/20 text-emerald-100" : "bg-amber-500/20 text-amber-100"
            }`}>
              {caseData.status === "OPEN" ? "Open for bids" : caseData.status.replace("_", " ")}
            </span>
          </div>

          {/* Right: details */}
          <section className="border-neutral-100 bg-[#F9F4EE] px-8 py-10 lg:border-l lg:px-10 lg:py-12">
            <p className="text-xs uppercase tracking-[0.2em] text-neutral-400">Case Detail</p>
            <h1 className="mt-3 font-[family-name:var(--font-manrope)] text-2xl font-bold text-neutral-900">
              {disease}
            </h1>

            {confidence != null && (
              <div className="mt-4 flex items-center gap-3">
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-neutral-200">
                  <motion.div initial={{ width: 0 }}
                    animate={{ width: `${Math.round(confidence * 100)}%` }}
                    transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
                    className="h-full rounded-full bg-[#0f6b2f]" />
                </div>
                <span className="text-sm font-semibold text-neutral-700">
                  {Math.round(confidence * 100)}% confidence
                </span>
              </div>
            )}

            {description && (
              <p className="mt-4 text-sm leading-relaxed text-neutral-600">{description}</p>
            )}

            <div className="mt-6 space-y-3">
              <InfoRow label="Farmer" value={caseData.farmer.email} />
              <InfoRow label="Submitted" value={date} />
              <InfoRow label="Status" value={caseData.status.replace("_", " ")} />
              <InfoRow label="Current Bids" value={String(caseData.bids.length)} />
            </div>

            {caseData.status === "OPEN" && viewerRole === "VENDOR" && (
              <motion.button whileHover={{ y: -1 }} whileTap={{ scale: 0.98 }}
                onClick={() => setBidOpen(true)}
                className="mt-8 w-full rounded-2xl bg-neutral-900 px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-neutral-800">
                Submit a bid
              </motion.button>
            )}

            {caseData.status !== "OPEN" && (
              <div className="mt-8 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-xs text-amber-700">
                This case is no longer accepting bids.
              </div>
            )}
          </section>
        </div>
      </motion.div>

      {/* Existing bids */}
      {caseData.bids.length > 0 && (
        <motion.div
          initial={reduceMotion ? { opacity: 1 } : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mt-6 overflow-hidden rounded-[32px] border border-neutral-200 bg-white shadow-[0_20px_60px_-40px_rgba(0,0,0,0.25)]"
        >
          <div className="border-b border-neutral-100 px-8 py-6">
            <h2 className="font-[family-name:var(--font-manrope)] text-lg font-bold text-neutral-900">
              Bids on this case
            </h2>
            <p className="mt-0.5 text-sm text-neutral-500">
              {caseData.bids.length} bid{caseData.bids.length !== 1 ? "s" : ""} submitted
            </p>
          </div>
          <div className="space-y-3 px-8 py-6">
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
                    viewerRole === "FARMER" && caseData.status === "OPEN" && !bid.selected ? (
                      <button
                        type="button"
                        onClick={() => handleAcceptBid(bid)}
                        disabled={acceptingBidId === bid.id}
                        className="rounded-full bg-neutral-900 px-3 py-1 text-xs font-semibold text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-70"
                      >
                        {acceptingBidId === bid.id ? "Accepting..." : "Accept"}
                      </button>
                    ) : null
                  }
                />
              );
            })}
            {escrowError ? (
              <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-600">
                {escrowError}
              </div>
            ) : null}
            {escrowNotice ? (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-700">
                {escrowNotice}
              </div>
            ) : null}
          </div>
        </motion.div>
      )}

      <AnimatePresence>
        {bidOpen && viewerRole === "VENDOR" && (
          <BidModal caseId={id} onClose={() => setBidOpen(false)}
            onSuccess={() => { fetchCase(); }} />
        )}
      </AnimatePresence>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-neutral-200 bg-white px-4 py-3">
      <span className="text-xs uppercase tracking-[0.15em] text-neutral-400">{label}</span>
      <span className="text-sm font-medium text-neutral-700">{value}</span>
    </div>
  );
}
