"use client";

import { motion, useReducedMotion } from "motion/react";

interface StatCardProps {
  label: string;
  value: string | number;
  delay?: number;
}

export default function StatCard({ label, value, delay = 0 }: StatCardProps) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      initial={reduceMotion ? { opacity: 1 } : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className="rounded-2xl border border-neutral-200 bg-white p-4"
    >
      <p className="text-xs uppercase tracking-[0.2em] text-neutral-400">
        {label}
      </p>
      <p className="mt-2 text-2xl font-bold text-neutral-900">{value}</p>
    </motion.div>
  );
}
