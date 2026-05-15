"use client";

import type { ReactNode } from "react";
import { motion, useReducedMotion } from "motion/react";
import { type BidStatus, STATUS_STYLES } from "./types";

interface BidRowProps {
  title: string;
  subtitle: string;
  amount: string;
  timeline?: string;
  status: BidStatus;
  index?: number;
  onClick?: () => void;
  action?: ReactNode;
}

export default function BidRow({
  title,
  subtitle,
  amount,
  timeline,
  status,
  index = 0,
  onClick,
  action,
}: BidRowProps) {
  const reduceMotion = useReducedMotion();
  const s = STATUS_STYLES[status];

  return (
    <motion.div
      initial={reduceMotion ? { opacity: 1 } : { opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.35, delay: index * 0.07 }}
      onClick={onClick}
      className={`flex items-center justify-between gap-4 rounded-2xl border border-neutral-200 bg-white px-5 py-4 transition hover:shadow-sm ${
        onClick ? "cursor-pointer" : ""
      }`}
    >
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-neutral-900">
          {title}
        </p>
        <p className="mt-0.5 text-xs text-neutral-500">{subtitle}</p>
      </div>

      <div className="hidden text-right sm:block">
        <p className="text-sm font-semibold text-neutral-900">{amount}</p>
        {timeline && (
          <p className="text-xs text-neutral-400">{timeline}</p>
        )}
      </div>

      <span
        className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${s.bg} ${s.text}`}
      >
        <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
        {s.label}
      </span>

      {action ? <div className="ml-2 flex items-center">{action}</div> : null}
    </motion.div>
  );
}
