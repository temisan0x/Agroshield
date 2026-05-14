"use client";

import BidRow from "@/components/vendor/BidRow";

export default function VendorBidVisual() {
  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs uppercase tracking-[0.2em] text-neutral-400">Case</p>
        <h3 className="mt-2 font-[family-name:var(--font-manrope)] text-xl font-bold text-neutral-900">
          Tomato Late Blight — Kaduna, Nigeria
        </h3>
        <span className="mt-2 inline-flex rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700">
          HIGH
        </span>
      </div>

      <div className="space-y-3">
        <BidRow
          title="AgriVend Solutions"
          subtitle="2 day delivery"
          amount="$45 USDC"
          status="ACCEPTED"
        />
        <BidRow
          title="FarmCare Pro"
          subtitle="3 day delivery"
          amount="$38 USDC"
          status="PENDING"
        />
      </div>

      <button className="w-full rounded-2xl bg-neutral-900 px-4 py-3 text-sm font-semibold text-white">
        Place Your Bid →
      </button>
    </div>
  );
}
