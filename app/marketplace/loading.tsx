import Nav from "@/components/Nav";

export default function MarketplaceLoading() {
  return (
    <div className="min-h-screen bg-[#f5f0eb]">
      <Nav />
      <main className="pt-28 pb-24">
        <div className="mx-auto max-w-6xl px-6">
          <div className="overflow-hidden rounded-[32px] border border-neutral-200 bg-white shadow-[0_30px_80px_-60px_rgba(0,0,0,0.5)]">
            <div className="animate-pulse space-y-8 px-6 py-8 sm:px-8 lg:px-10 lg:py-10">
              <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
                <div className="space-y-4">
                  <div className="h-6 w-28 rounded-full bg-neutral-100" />
                  <div className="h-12 w-full rounded-2xl bg-neutral-100" />
                  <div className="h-5 w-4/5 rounded-full bg-neutral-100" />
                </div>
                <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-2">
                  {Array.from({ length: 4 }).map((_, index) => (
                    <div key={index} className="h-24 rounded-2xl bg-neutral-100" />
                  ))}
                </div>
              </div>
              <div className="grid gap-3 rounded-3xl border border-neutral-200 bg-[#f9f4ee] p-4 md:grid-cols-[1.5fr_0.75fr_0.75fr]">
                <div className="h-12 rounded-2xl bg-white" />
                <div className="h-12 rounded-2xl bg-white" />
                <div className="h-12 rounded-2xl bg-white" />
              </div>
              <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                {Array.from({ length: 6 }).map((_, index) => (
                  <div key={index} className="rounded-3xl border border-neutral-100 bg-white">
                    <div className="aspect-[16/10] bg-neutral-100" />
                    <div className="space-y-4 p-6">
                      <div className="h-5 w-24 rounded-full bg-neutral-100" />
                      <div className="h-7 w-4/5 rounded-full bg-neutral-100" />
                      <div className="h-4 w-full rounded-full bg-neutral-100" />
                      <div className="h-4 w-5/6 rounded-full bg-neutral-100" />
                      <div className="grid gap-3 rounded-2xl border border-neutral-100 bg-[#f9f4ee] p-4 sm:grid-cols-2">
                        <div className="h-12 rounded-2xl bg-white" />
                        <div className="h-12 rounded-2xl bg-white" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
