"use client";

import { motion, useReducedMotion } from "motion/react";
import type { CaseListItem } from "./types";

interface CaseCardProps {
  caseItem: CaseListItem;
  index?: number;
  onClick?: () => void;
}

export default function CaseCard({ caseItem, index = 0, onClick }: CaseCardProps) {
  const reduceMotion = useReducedMotion();
  const disease = caseItem.diagnosis?.disease ?? "Undiagnosed";
  const confidence = caseItem.diagnosis?.confidence;
  const date = new Date(caseItem.createdAt).toLocaleDateString("en-NG", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <motion.div
      initial={reduceMotion ? { opacity: 1 } : { opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.06 }}
      onClick={onClick}
      className={`group relative overflow-hidden rounded-[28px] border border-neutral-200 bg-white shadow-[0_8px_30px_-12px_rgba(0,0,0,0.12)] transition hover:-translate-y-0.5 hover:shadow-[0_16px_50px_-16px_rgba(0,0,0,0.18)] ${
        onClick ? "cursor-pointer" : ""
      }`}
    >
      {/* Image */}
      <div className="relative h-48 w-full overflow-hidden bg-neutral-100">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={caseItem.imageUrl}
          alt={disease}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />

        {/* Status badge */}
        <span
          className={`absolute left-4 top-4 rounded-full px-3 py-1 text-xs font-semibold backdrop-blur-sm ${
            caseItem.status === "OPEN"
              ? "bg-emerald-500/20 text-emerald-100"
              : "bg-amber-500/20 text-amber-100"
          }`}
        >
          {caseItem.status === "OPEN" ? "Open" : "In Progress"}
        </span>

        {/* Bid count */}
        <span className="absolute bottom-4 right-4 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-neutral-700 backdrop-blur-sm">
          {caseItem._count.bids} bid{caseItem._count.bids !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Content */}
      <div className="px-6 py-5">
        <h3 className="font-[family-name:var(--font-manrope)] text-base font-bold text-neutral-900">
          {disease}
        </h3>

        {confidence != null && (
          <div className="mt-2 flex items-center gap-2">
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-neutral-100">
              <div
                className="h-full rounded-full bg-[#0f6b2f] transition-all duration-500"
                style={{ width: `${Math.round(confidence * 100)}%` }}
              />
            </div>
            <span className="text-xs font-medium text-neutral-500">
              {Math.round(confidence * 100)}%
            </span>
          </div>
        )}

        <div className="mt-3 flex items-center justify-between text-xs text-neutral-400">
          <span>{caseItem.farmer.email}</span>
          <span>{date}</span>
        </div>
      </div>
    </motion.div>
  );
}
