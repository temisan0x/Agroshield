"use client";

import type { ReactNode } from "react";
import { motion, useReducedMotion } from "motion/react";

type SectionFeatureProps = {
  label: string;
  heading: string;
  subtext: string;
  visual: ReactNode;
  reverse?: boolean;
};

export default function SectionFeature({
  label,
  heading,
  subtext,
  visual,
  reverse = false,
}: SectionFeatureProps) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.section
      initial={reduceMotion ? { opacity: 1 } : { opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5 }}
      className="py-24"
    >
      <div className="mx-auto grid max-w-5xl items-center gap-10 px-6 md:grid-cols-2">
        <div className={reverse ? "md:order-2" : ""}>
          <div className="inline-flex items-center gap-2 rounded-full bg-[#16a34a]/10 px-3 py-1 text-sm text-[#16a34a]">
            {label}
          </div>
          <h2 className="mt-4 font-[family-name:var(--font-manrope)] text-4xl font-extrabold tracking-tight text-neutral-900">
            {heading}
          </h2>
          <p className="mt-4 max-w-sm font-[family-name:var(--font-inter)] text-lg text-neutral-500">
            {subtext}
          </p>
        </div>
        <div className={reverse ? "md:order-1" : ""}>
          <div className="rounded-2xl border border-neutral-100 bg-white p-6 shadow-sm">
            {visual}
          </div>
        </div>
      </div>
    </motion.section>
  );
}
