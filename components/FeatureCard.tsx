"use client";

import { motion } from "motion/react";

type FeatureCardProps = {
  title: string;
  description: string;
};

export default function FeatureCard({ title, description }: FeatureCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className="rounded-2xl border border-neutral-100 bg-white p-6 shadow-sm"
    >
      <h3 className="font-[family-name:var(--font-manrope)] text-lg font-semibold text-neutral-900">
        {title}
      </h3>
      <p className="mt-2 text-sm text-neutral-500 md:text-base">{description}</p>
    </motion.div>
  );
}
