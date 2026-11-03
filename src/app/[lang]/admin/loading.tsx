export default function Loading() {
  return (
    <div className="mx-auto max-w-content px-4 py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div className="h-8 w-48 rounded bg-neutral-200 dark:bg-neutral-800 animate-pulse" />
        <div className="h-10 w-52 rounded-md bg-neutral-200 dark:bg-neutral-800 animate-pulse" />
      </div>

      {/* 3 Metric Cards */}
      <div className="grid gap-4 md:grid-cols-3 mb-8">
        <div className="rounded-xl border border-neutral-200 bg-forest-700/20 dark:bg-forest-900/30 p-5 h-[104px] animate-pulse" />
        <div className="rounded-xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900 p-5 h-[104px] animate-pulse" />
        <div className="rounded-xl border border-neutral-200 bg-white dark:border-neutral-800 dark:bg-neutral-900 p-5 h-[104px] animate-pulse" />
      </div>

      {/* Tab Skeleton */}
      <div className="flex gap-2 border-b border-neutral-200 dark:border-neutral-800 mb-4 pb-2">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="h-9 w-24 rounded-md bg-neutral-200 dark:bg-neutral-800 animate-pulse"
          />
        ))}
      </div>

      {/* Table Skeleton */}
      <div className="rounded-md border border-neutral-200 dark:border-neutral-800 overflow-hidden">
        <div className="bg-neutral-100 dark:bg-neutral-800 h-12 flex items-center gap-4 px-4">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="h-3 flex-1 rounded bg-neutral-300/70 dark:bg-neutral-700/70 animate-pulse"
            />
          ))}
        </div>
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-4 px-4 py-4 border-t border-neutral-200 dark:border-neutral-800"
          >
            <div className="h-4 flex-1 rounded bg-neutral-200 dark:bg-neutral-800 animate-pulse" />
            <div className="h-4 flex-1 rounded bg-neutral-200 dark:bg-neutral-800 animate-pulse" />
            <div className="h-4 flex-1 rounded bg-neutral-200 dark:bg-neutral-800 animate-pulse" />
            <div className="h-4 w-32 rounded bg-neutral-200 dark:bg-neutral-800 animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  );
}