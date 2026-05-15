"use client";

import { useState } from "react";
import { motion, useReducedMotion } from "motion/react";

interface ConfirmDeliveryButtonProps {
  caseId: string;
  contractId: string;
  currentStatus: string;
  onSuccess: (newStatus: string) => void;
}

const TW_BASE_URL =
  process.env.NEXT_PUBLIC_TRUSTLESS_WORK_API ?? "https://dev.api.trustlesswork.com";

function getAuthContext() {
  if (typeof window === "undefined") return null;

  const token = localStorage.getItem("agroshield_token");
  if (!token) return null;

  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return {
      token,
      userId: typeof payload?.userId === "string" ? payload.userId : null,
      role: typeof payload?.role === "string" ? payload.role : null,
    };
  } catch {
    return null;
  }
}

export function ConfirmDeliveryButton({
  caseId,
  contractId,
  currentStatus,
  onSuccess,
}: ConfirmDeliveryButtonProps) {
  const reduceMotion = useReducedMotion();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const auth = getAuthContext();
  const canRender = currentStatus === "DELIVERED" && auth?.role === "FARMER";

  if (!canRender || !auth?.userId || !auth.token) {
    return null;
  }

  async function handleClick() {
    setLoading(true);
    setError(null);

    try {
      const { signTransaction } = await import("@stellar/freighter-api");

      const approveRes = await fetch(`${TW_BASE_URL}/escrow/single-release/approve-milestone`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contractId,
          milestoneIndex: 0,
          signer: auth.userId,
        }),
      });

      const approvePayload = (await approveRes.json().catch(() => ({}))) as {
        unsignedTransaction?: string;
        error?: string;
        message?: string;
      };

      if (!approveRes.ok || !approvePayload.unsignedTransaction) {
        throw new Error(approvePayload.error ?? approvePayload.message ?? "Failed to approve milestone.");
      }

      const approveSigned = await signTransaction(approvePayload.unsignedTransaction);
      const approveSendRes = await fetch(`${TW_BASE_URL}/helper/send-transaction`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ xdr: approveSigned }),
      });

      const approveSendPayload = (await approveSendRes.json().catch(() => ({}))) as {
        error?: string;
        message?: string;
      };

      if (!approveSendRes.ok) {
        throw new Error(
          approveSendPayload.error ??
            approveSendPayload.message ??
            "Failed to broadcast milestone approval.",
        );
      }

      const releaseRes = await fetch(`${TW_BASE_URL}/escrow/single-release/release-funds`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contractId,
          milestoneIndex: 0,
        }),
      });

      const releasePayload = (await releaseRes.json().catch(() => ({}))) as {
        unsignedTransaction?: string;
        error?: string;
        message?: string;
      };

      if (!releaseRes.ok || !releasePayload.unsignedTransaction) {
        throw new Error(releasePayload.error ?? releasePayload.message ?? "Failed to prepare fund release.");
      }

      const releaseSigned = await signTransaction(releasePayload.unsignedTransaction);
      const releaseSendRes = await fetch(`${TW_BASE_URL}/helper/send-transaction`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ xdr: releaseSigned }),
      });

      const releaseSendPayload = (await releaseSendRes.json().catch(() => ({}))) as {
        error?: string;
        message?: string;
      };

      if (!releaseSendRes.ok) {
        throw new Error(
          releaseSendPayload.error ??
            releaseSendPayload.message ??
            "Failed to broadcast fund release.",
        );
      }

      const confirmRes = await fetch("/api/confirm-delivery", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${auth.token}`,
        },
        body: JSON.stringify({ caseId, contractId }),
      });

      const confirmPayload = (await confirmRes.json().catch(() => ({}))) as {
        error?: string;
        case?: { status: string };
      };

      if (!confirmRes.ok || !confirmPayload.case) {
        throw new Error(confirmPayload.error ?? "Failed to confirm delivery.");
      }

      onSuccess(confirmPayload.case.status);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <motion.button
        type="button"
        onClick={handleClick}
        disabled={loading}
        initial={reduceMotion ? { opacity: 1 } : { opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
        whileTap={reduceMotion ? undefined : { scale: 0.98 }}
        className="inline-flex items-center justify-center gap-2 rounded-xl bg-sky-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {loading ? (
          <>
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            Confirming...
          </>
        ) : (
          "Confirm Delivery & Release Funds"
        )}
      </motion.button>

      {error ? <p className="text-xs text-red-600">{error}</p> : null}
    </div>
  );
}
