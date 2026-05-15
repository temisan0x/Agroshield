"use client";

import { motion } from "motion/react";

type Props = {
  label: string;
  value: string;
  delay?: number;
};

export default function StatCard({ label, value, delay = 0 }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className="rounded-2xl border border-neutral-200 bg-white p-4"
    >
      <p className="text-xs text-neutral-500">{label}</p>
      <p className="mt-1 text-sm font-semibold text-neutral-900">
        {value}
      </p>
    </motion.div>
  );
}