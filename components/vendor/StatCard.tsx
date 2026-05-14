"use client";

import { motion, useReducedMotion } from "motion/react";

interface StatCardProps {
  label: string;
  value: string | number;
  delay?: number;
  helper?: string;
}

export default function StatCard({ label, value, delay = 0, helper }: StatCardProps) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      initial={reduceMotion ? { opacity: 1 } : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay, ease: "easeOut" }}
      className="rounded-2xl border border-neutral-100 bg-white p-5"
    >
      <p className="text-xs font-medium uppercase tracking-[0.2em] text-neutral-400">
        {label}
      </p>
      <p className="mt-1 font-[family-name:var(--font-manrope)] text-3xl font-extrabold text-neutral-900">
        {value}
      </p>
      {helper ? <p className="mt-1 text-xs text-neutral-400">{helper}</p> : null}
    </motion.div>
  );
}
