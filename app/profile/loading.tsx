export default function ProfileLoading() {
  return (
    <main className="pt-28 pb-24">
      <div className="mx-auto max-w-6xl px-6">
        <div className="animate-pulse overflow-hidden rounded-[32px] border border-neutral-200 bg-white shadow-[0_30px_80px_-60px_rgba(0,0,0,0.5)]">
          <div className="space-y-8 p-6 sm:p-8 lg:p-10">
            <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
              <div className="space-y-4">
                <div className="h-6 w-28 rounded-full bg-neutral-100" />
                <div className="h-12 w-full rounded-2xl bg-neutral-100" />
                <div className="h-5 w-4/5 rounded-full bg-neutral-100" />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {Array.from({ length: 3 }).map((_, index) => (
                  <div key={index} className="h-24 rounded-2xl bg-neutral-100" />
                ))}
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="h-28 rounded-2xl bg-neutral-100" />
              ))}
            </div>
            <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
              <div className="h-80 rounded-3xl bg-neutral-100" />
              <div className="h-80 rounded-3xl bg-neutral-100" />
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
