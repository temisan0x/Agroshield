"use client";

import { motion, useReducedMotion } from "motion/react";
import type { ReactNode } from "react";
import type { CaseListItem } from "./types";

interface CaseCardProps {
  caseItem: CaseListItem;
  index?: number;
  onClick?: () => void;
  action?: ReactNode;
}

export default function CaseCard({ caseItem, index = 0, onClick, action }: CaseCardProps) {
  const reduceMotion = useReducedMotion();
  const disease = caseItem.diagnosis?.disease ?? "Undiagnosed";
  const confidence = caseItem.diagnosis?.confidence;
  const confidencePercent = (() => {
    if (confidence == null) return null;
    const numeric = Number(confidence);
    if (Number.isNaN(numeric)) return null;
    const percent = numeric <= 1 ? numeric * 100 : numeric;
    return Math.max(0, Math.min(100, Math.round(percent)));
  })();
  const urgencyRaw = String(caseItem.diagnosis?.urgency ?? "medium").toLowerCase();
  const urgency = urgencyRaw.includes("high")
    ? "HIGH"
    : urgencyRaw.includes("low")
      ? "LOW"
      : "MEDIUM";
  const urgencyTone =
    urgency === "HIGH"
      ? "bg-red-50 text-red-600 border border-red-100"
      : urgency === "LOW"
        ? "bg-green-50 text-green-700 border border-green-100"
        : "bg-yellow-50 text-yellow-700 border border-yellow-100";
  const statusTone =
    caseItem.status === "OPEN"
      ? "bg-blue-50 text-blue-600 border border-blue-100"
      : "bg-yellow-50 text-yellow-700 border border-yellow-100";
  const location = (caseItem.diagnosis as { location?: string } | null)?.location ?? "";
  const locationLabel = location ? "Location on file" : "Location not shared";
  const date = new Date(caseItem.createdAt).toLocaleDateString("en-NG", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <motion.div
      initial={reduceMotion ? { opacity: 1 } : { opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: index * 0.04, ease: "easeOut" }}
      onClick={onClick}
      className={`group relative h-full overflow-hidden transition-all duration-200 ${
        onClick ? "cursor-pointer" : ""
      }`}
    >
      {/* Image */}
      <div className="relative h-44 w-full overflow-hidden bg-neutral-100">
        {caseItem.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={caseItem.imageUrl}
            alt={disease}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
          />
        ) : (
          <div className="flex h-full items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100 text-4xl">
            🌿
          </div>
        )}

        <span className={`absolute left-3 top-3 rounded-full px-3 py-1 text-xs font-medium ${urgencyTone}`}>
          {urgency}
        </span>
        <span className={`absolute right-3 top-3 rounded-full px-3 py-1 text-xs font-medium ${statusTone}`}>
          {caseItem.status === "OPEN" ? "Open" : "In Progress"}
        </span>
      </div>

      {/* Content */}
      <div className="flex h-full min-h-[190px] flex-col p-5">
        <h3 className="font-[family-name:var(--font-manrope)] text-base font-bold leading-snug text-neutral-900">
          {disease}
        </h3>
        <div className="mt-1.5 flex items-center gap-1.5 text-sm text-neutral-500">
          <span className="text-xs">📍</span>
          <span>{locationLabel}</span>
        </div>
        <div className="mt-0.5 flex items-center gap-1.5 text-xs text-neutral-400">
          <span>🕐</span>
          <span>{date}</span>
        </div>

        <div className="mt-auto flex items-center justify-between border-t border-neutral-50 pt-4 text-xs text-neutral-500">
          <span className="flex items-center gap-1">
            <span>💬</span>
            {caseItem._count.bids} bid{caseItem._count.bids !== 1 ? "s" : ""}
          </span>
          {action ? (
            <span onClick={(event) => event.stopPropagation()}>{action}</span>
          ) : null}
        </div>
      </div>
    </motion.div>
  );
}
