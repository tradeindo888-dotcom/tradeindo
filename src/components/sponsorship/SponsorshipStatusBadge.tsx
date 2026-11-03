import type { SponsoredStatus } from "@prisma/client";

const LABEL: Record<SponsoredStatus, { en: string; id: string; cls: string }> = {
  PENDING:   { en: "Pending",   id: "Menunggu",   cls: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200" },
  APPROVED:  { en: "Active",    id: "Aktif",      cls: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200" },
  EXPIRED:   { en: "Expired",   id: "Berakhir",   cls: "bg-neutral-100 text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400" },
  REJECTED:  { en: "Rejected",  id: "Ditolak",    cls: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200" },
  CANCELLED: { en: "Cancelled", id: "Dibatalkan", cls: "bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-500" },
};

export function SponsorshipStatusBadge({
  status,
  lang,
}: {
  status: SponsoredStatus;
  lang: "en" | "id";
}) {
  const label = LABEL[status] || LABEL.PENDING;
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${label.cls}`}>
      {lang === "en" ? label.en : label.id}
    </span>
  );
}