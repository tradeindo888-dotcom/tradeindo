"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

export default function BuyerWorkspace() {
  const params = useParams();
  const router = useRouter();
  const lang = params.lang === "en" ? "en" : "id";
  const { data: session, status } = useSession();
  
  const [rfqs, setRfqs] = useState<any[]>([]);
  const [company, setCompany] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === "loading") return;

    if (status === "unauthenticated") {
      router.replace(`/${lang}/login`);
      return;
    }

    const userRole = (session?.user as any)?.role?.toUpperCase() || "";

    if (userRole === "ADMIN") {
      router.replace(`/${lang}/admin`);
      return;
    }

    if (userRole === "SUPPLIER") {
      router.replace(`/${lang}/workspace/seller`);
      return;
    }

    if (userRole !== "BUYER") {
      setError("Akses ditolak. Halaman ini hanya untuk Buyer.");
      setLoading(false);
      return;
    }

    fetch("/api/buyer/dashboard")
      .then(res => {
        if (!res.ok) throw new Error("Gagal mengambil data");
        return res.json();
      })
      .then(data => {
        if (data.company) setCompany(data.company);
        if (data.rfqs) setRfqs(data.rfqs);
        setLoading(false);
      })
      .catch(() => {
        setError(lang === "en" ? "Failed to load workspace data." : "Gagal memuat data workspace.");
        setLoading(false);
      });
  }, [status, session, router, lang]);

  if (status === "loading" || loading) return <div className="p-8 text-center">Memuat data...</div>;
  if (error) return <div className="p-8 text-center text-red-500 font-medium">{error}</div>;

  return (
    <div className="mx-auto max-w-content px-4 py-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="font-display text-2xl font-bold">Buyer Workspace</h1>
          <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
            Selamat datang, <strong>{company?.name || "Buyer"}</strong>
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          {/* TOMBOL PASANG IKLAN BARU */}
          <Link href={`/${lang}/workspace/advertise`} className="rounded-md border border-purple-500 bg-purple-50 px-4 py-2 text-sm font-medium text-purple-700 hover:bg-purple-100 dark:border-purple-600 dark:bg-purple-900/30 dark:text-purple-400 transition-colors shadow-sm flex items-center gap-2">
            📢 {lang === "en" ? "Place Ad" : "Pasang Iklan"}
          </Link>

          {/* TOMBOL RFQ LAMA */}
          <Link href={`/${lang}/rfqs/new`} className="rounded-md bg-forest-700 px-4 py-2 text-sm text-white hover:bg-forest-500 transition-colors shadow-sm">
            + {lang === "en" ? "Create RFQ" : "Buat RFQ Baru"}
          </Link>
        </div>
      </div>

      <div className="space-y-3">
        {rfqs.map((r) => (
          <Link 
            key={r.id} 
            href={`/${lang}/rfqs/${r.id}`} 
            className="group block rounded-lg border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:border-forest-700/50 dark:hover:border-lime-400/50"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <span className="font-semibold text-lg text-neutral-900 dark:text-white group-hover:text-forest-700 dark:group-hover:text-lime-400 transition-colors">
                    {r.title}
                  </span>
                  <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-900/40 dark:text-amber-200">
                    {r.status}
                  </span>
                </div>
                <div className="text-sm text-neutral-500 dark:text-neutral-400 flex items-center gap-2 flex-wrap mt-2">
                  <span className="flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
                    {r._count?.quotes || 0} Quotation
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                    Deadline: {new Date(r.deadlineAt).toLocaleDateString(lang === "en" ? "en-GB" : "id-ID", { day: "2-digit", month: "2-digit", year: "numeric" })}
                  </span>
                </div>
              </div>
              <div className="shrink-0 mt-2 sm:mt-0">
                <span className="inline-flex items-center gap-1 text-sm font-medium text-forest-700 dark:text-lime-400 transition-transform duration-300 group-hover:translate-x-1">
                  Lihat Detail <span>→</span>
                </span>
              </div>
            </div>
          </Link>
        ))}
        
        {rfqs.length === 0 && (
          <div className="rounded-lg border border-dashed border-neutral-300 p-8 text-center dark:border-neutral-700">
            <p className="text-neutral-500">Belum ada RFQ. Silakan buat RFQ baru.</p>
          </div>
        )}
      </div>
    </div>
  );
}