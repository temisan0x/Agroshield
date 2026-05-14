"use client";

import { motion } from "motion/react";
import Link from "next/link";

type FooterLink = {
  label: string;
  href: string;
};

const columns = [
  {
    label: "Product",
    links: ["Why AgroShield", "For Farmers", "For Vendors", "Pricing"],
  },
  {
    label: "Solutions",
    links: [
      { label: "AI Diagnosis", href: "/diagnose" },
      { label: "Escrow", href: "#" },
      { label: "Dispute Resolution", href: "#" },
      { label: "Marketplace", href: "/marketplace" },
    ] as FooterLink[],
  },
  {
    label: "Company",
    links: ["About", "Contact", "GitHub", "Privacy"],
  },
  {
    label: "Resources",
    links: ["Docs", "API", "Trustless Work", "Stellar"],
  },
];

export default function Footer() {
  return (
    <footer className="py-20">
      <div className="mx-auto max-w-4xl px-6">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="grid gap-10 md:grid-cols-4"
        >
          {columns.map((column) => (
            <div key={column.label}>
              <div className="text-sm font-semibold text-neutral-700">{column.label}</div>
              <ul className="mt-4 space-y-2 text-sm text-neutral-400">
                {column.links.map((link) => (
                  <li key={typeof link === "string" ? link : link.label}>
                    {typeof link === "string" ? (
                      <a className="transition hover:text-neutral-700" href="#">
                        {link}
                      </a>
                    ) : (
                      <Link className="transition hover:text-neutral-700" href={link.href}>
                        {link.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </motion.div>

        <div className="mt-12 flex flex-wrap items-center justify-between gap-4 border-t border-neutral-200 pt-6 text-sm text-neutral-400">
          <div className="flex items-center gap-2 font-[family-name:var(--font-manrope)] text-neutral-700">
            <span className="h-3 w-3 rounded-sm bg-[#16a34a]" />
            AgroShield
          </div>
          <div>© 2026 AgroShield · Built on Stellar · Powered by Trustless Work</div>
          <div className="flex items-center gap-3 text-neutral-500">
            <a className="transition hover:text-neutral-700" href="#">
              GitHub
            </a>
            <a className="transition hover:text-neutral-700" href="#">
              X
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
