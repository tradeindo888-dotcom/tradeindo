export default function Loading() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-forest-700 mx-auto"></div>
        <p className="mt-4 text-neutral-600">Memuat...</p>
      </div>
    </div>
  );
}