export default function Loading() {
  return (
    <div className="mx-auto max-w-content px-4 py-8">
      {/* Header Profil */}
      <div className="rounded-md border border-neutral-200 bg-white p-6 dark:border-neutral-800 dark:bg-neutral-900">
        <div className="flex flex-col sm:flex-row sm:items-start gap-6">
          <div className="h-24 w-40 shrink-0 rounded-md bg-neutral-200 dark:bg-neutral-800 animate-pulse" />
          <div className="flex-1 space-y-2">
            <div className="h-7 w-64 rounded bg-neutral-200 dark:bg-neutral-800 animate-pulse" />
            <div className="h-4 w-48 rounded bg-neutral-200 dark:bg-neutral-800 animate-pulse" />
            <div className="h-4 w-40 rounded bg-neutral-200 dark:bg-neutral-800 animate-pulse" />
          </div>
        </div>
        <div className="mt-8 border-t border-neutral-200 pt-4 dark:border-neutral-800 space-y-2">
          <div className="h-4 w-32 rounded bg-neutral-200 dark:bg-neutral-800 animate-pulse" />
          <div className="h-3 w-full max-w-lg rounded bg-neutral-200 dark:bg-neutral-800 animate-pulse" />
          <div className="h-3 w-full max-w-md rounded bg-neutral-200 dark:bg-neutral-800 animate-pulse" />
        </div>
      </div>

      {/* Produk Grid */}
      <div className="mt-8">
        <div className="h-6 w-48 mb-4 rounded bg-neutral-200 dark:bg-neutral-800 animate-pulse" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="overflow-hidden rounded-lg border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900"
            >
              <div className="aspect-[4/3] w-full bg-neutral-200 dark:bg-neutral-800 animate-pulse" />
              <div className="p-4 space-y-2">
                <div className="h-4 w-3/4 rounded bg-neutral-200 dark:bg-neutral-800 animate-pulse" />
                <div className="mt-3 flex justify-between">
                  <div className="h-3 w-20 rounded bg-neutral-200 dark:bg-neutral-800 animate-pulse" />
                  <div className="h-3 w-24 rounded bg-neutral-200 dark:bg-neutral-800 animate-pulse" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}