"use client";

export default function FarmerCaseVisual() {
  return (
    <div className="space-y-4">
      <div className="inline-flex items-center gap-2 rounded-full bg-[#16a34a]/10 px-3 py-1 text-xs text-[#16a34a]">
        🔬 AI Diagnosis Result
      </div>
      <div>
        <p className="text-xs uppercase tracking-[0.2em] text-neutral-400">Disease</p>
        <p className="mt-2 font-[family-name:var(--font-manrope)] text-2xl font-bold text-neutral-900">
          Tomato Late Blight
        </p>
      </div>
      <div>
        <div className="flex items-center justify-between text-xs text-neutral-500">
          <span>94% confidence</span>
          <span>AI verified</span>
        </div>
        <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-neutral-100">
          <div className="h-full w-[94%] rounded-full bg-[#16a34a]" />
        </div>
      </div>
      <div className="flex items-center gap-2">
        <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700">
          HIGH
        </span>
        <span className="text-xs text-neutral-400">Urgency</span>
      </div>
      <div>
        <p className="text-xs uppercase tracking-[0.2em] text-neutral-400">Recommended pesticide</p>
        <p className="mt-2 text-sm font-semibold text-neutral-800">Mancozeb 75 WP</p>
      </div>
      <div className="flex items-center justify-between rounded-2xl border border-neutral-100 bg-[#F5F0EB] px-4 py-3">
        <span className="text-xs text-neutral-500">3 vendors bidding</span>
        <button className="rounded-full bg-neutral-900 px-4 py-1.5 text-xs font-semibold text-white">
          Post to Marketplace →
        </button>
      </div>
    </div>
  );
}
