"use client";

export default function EscrowVisual() {
  return (
    <div className="space-y-5">
      <div>
        <p className="text-xs uppercase tracking-[0.2em] text-neutral-400">Escrow Status</p>
        <h3 className="mt-2 font-[family-name:var(--font-manrope)] text-xl font-bold text-neutral-900">
          Escrow Status
        </h3>
      </div>

      <div className="space-y-3">
        {[
          { label: "Escrow Created", state: "done" },
          { label: "Funds Locked", state: "done" },
          { label: "Treatment Delivered", state: "active" },
          { label: "Funds Released", state: "future" },
        ].map((step, index) => {
          const tone =
            step.state === "done"
              ? "bg-[#16a34a]"
              : step.state === "active"
              ? "bg-amber-400 animate-pulse"
              : "bg-neutral-300";

          return (
            <div key={step.label} className="flex items-center gap-3">
              <span className={`h-3 w-3 rounded-full ${tone}`} />
              <span className="text-sm text-neutral-600">
                {step.state === "done" ? "✅ " : step.state === "active" ? "⏳ " : "○ "}
                {step.label}
              </span>
              {index < 3 ? <span className="flex-1 border-t border-neutral-200" /> : null}
            </div>
          );
        })}
      </div>

      <div className="rounded-2xl border border-neutral-100 bg-[#F5F0EB] px-4 py-3">
        <div className="text-xs uppercase tracking-[0.2em] text-neutral-400">Locked</div>
        <div className="mt-1 text-lg font-semibold text-neutral-900">45 USDC</div>
      </div>

      <div className="flex items-center gap-2 text-xs text-neutral-400">
        <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-white">
          ✦
        </span>
        Secured on Stellar
      </div>
    </div>
  );
}
