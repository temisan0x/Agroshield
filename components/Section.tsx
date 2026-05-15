"use client";

import type { ReactNode } from "react";
import { motion } from "motion/react";

type SectionProps = {
  id?: string;
  label: string;
  heading: string;
  subheading: string;
  children: ReactNode;
};

export default function Section({ id, label, heading, subheading, children }: SectionProps) {
  return (
    <section id={id} className="py-24">
      <div className="mx-auto max-w-6xl px-6">
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="inline-flex rounded-full border border-neutral-200 bg-white px-3 py-1 text-xs text-[#16a34a]"
        >
          {label}
        </motion.div>
        <motion.h2
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mt-4 font-[family-name:var(--font-manrope)] text-4xl font-bold text-neutral-900"
        >
          {heading}
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mt-4 max-w-2xl font-[family-name:var(--font-inter)] text-base text-neutral-500 md:text-lg"
        >
          {subheading}
        </motion.p>
        <div className="mt-10 grid gap-4 md:grid-cols-3">{children}</div>
      </div>
    </section>
  );
}
