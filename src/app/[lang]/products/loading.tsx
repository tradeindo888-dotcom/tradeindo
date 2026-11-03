export default function Loading() {
  return (
    <div className="mx-auto grid max-w-content gap-6 px-4 py-8 lg:grid-cols-[280px_1fr] items-start">
      {/* Sidebar Kategori */}
      <aside className="lg:sticky lg:top-28">
        <div className="rounded-md border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900">
          <div className="mb-3 h-4 w-32 rounded bg-neutral-200 dark:bg-neutral-800 animate-pulse" />
          <div className="space-y-2">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="flex items-center gap-3 p-2.5">
                <div className="h-7 w-7 rounded-md bg-neutral-200 dark:bg-neutral-800 animate-pulse" />
                <div className="h-3 flex-1 rounded bg-neutral-200 dark:bg-neutral-800 animate-pulse" />
              </div>
            ))}
          </div>
        </div>
      </aside>

      {/* Produk Grid */}
      <section>
        <div className="h-8 w-64 rounded bg-neutral-200 dark:bg-neutral-800 animate-pulse" />
        <div className="mt-2 h-4 w-40 rounded bg-neutral-200 dark:bg-neutral-800 animate-pulse" />

        <div className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="overflow-hidden rounded-lg border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900"
            >
              <div className="aspect-[4/3] w-full bg-neutral-200 dark:bg-neutral-800 animate-pulse" />
              <div className="p-4 space-y-2">
                <div className="h-4 w-3/4 rounded bg-neutral-200 dark:bg-neutral-800 animate-pulse" />
                <div className="h-3 w-1/2 rounded bg-neutral-200 dark:bg-neutral-800 animate-pulse" />
                <div className="mt-3 flex justify-between">
                  <div className="h-3 w-20 rounded bg-neutral-200 dark:bg-neutral-800 animate-pulse" />
                  <div className="h-3 w-24 rounded bg-neutral-200 dark:bg-neutral-800 animate-pulse" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}