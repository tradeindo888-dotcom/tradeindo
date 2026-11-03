"use client";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

const plans = [
  { 
    code: "FREE", 
    name: "Free", 
    price: "Rp0", 
    note: "Untuk UMKM dan supplier baru.", 
    features: ["Profil dasar", "10 listing", "Menerima inquiry"] 
  },
  { 
    code: "PRO", 
    name: "Pro Supplier", 
    price: "Rp49.000/bln", // <-- HARGA BARU DISESUAIKAN
    note: "Untuk supplier aktif mencari buyer.", 
    features: ["100 listing", "Analytics", "Lead & quotation", "Dukungan prioritas"], 
    highlight: true 
  },
  { 
    code: "PREMIUM", 
    name: "Business Premium", 
    price: "Rp149.000/bln", // <-- HARGA BARU DISESUAIKAN
    note: "Untuk perusahaan & eksportir.", 
    features: ["500 listing", "Multi-user", "Advanced analytics", "Promosi lebih besar"] 
  },
];

export default function PricingPage() {
  const params = useParams();
  const router = useRouter();
  const lang = params.lang === "en" ? "en" : "id";
  const { data: session } = useSession();
  
  const [currentPlan, setCurrentPlan] = useState("FREE");
  const [planExpiresAt, setPlanExpiresAt] = useState<Date | null>(null);
  const [hoveredPlan, setHoveredPlan] = useState<string | null>(null);

  useEffect(() => {
    if (session?.user && (session.user as any).role === "SUPPLIER") {
      fetch("/api/seller/dashboard")
        .then(res => res.json())
        .then(data => {
          if (data.company?.plan) setCurrentPlan(data.company.plan);
          if (data.company?.planExpiresAt) setPlanExpiresAt(new Date(data.company.planExpiresAt));
        });
    }
  }, [session]);

  const defaultHighlight = plans.find(p => p.highlight)?.code || "PRO";
  const activeHighlight = hoveredPlan || defaultHighlight;

  return (
    <div className="mx-auto max-w-content px-4 py-12">
      <h1 className="text-center font-display text-3xl font-bold">
        {lang === "en" ? "Membership Plans" : "Paket Langganan"}
      </h1>
      <p className="mx-auto mt-2 max-w-2xl text-center text-sm text-neutral-600 dark:text-neutral-400">
        {lang === "en" ? "Upgrade your plan to grow your business." : "Upgrade paket Anda untuk mengembangkan bisnis."}
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {plans.map((p) => {
          // LOGIKA BARU: Cek apakah paket ini aktif DAN belum expired
          const isCurrentPlan = currentPlan === p.code;
          const isExpired = planExpiresAt ? new Date() > planExpiresAt : false;
          
          // Tombol dianggap "Aktif" (disabled) JIKA paketnya sama DAN belum expired
          const isActive = isCurrentPlan && !isExpired;
          
          const targetUrl = `/${lang}/pricing/pay/${p.code}`;
          const isHighlighted = activeHighlight === p.code;
          
          return (
            <div 
              key={p.code} 
              onMouseEnter={() => setHoveredPlan(p.code)}
              onMouseLeave={() => setHoveredPlan(null)}
              className={`relative rounded-md border p-5 transition-all duration-300 ease-out ${
                isHighlighted 
                  ? "border-forest-700 ring-2 ring-lime-400 shadow-xl z-10" 
                  : "border-neutral-200 dark:border-neutral-800 z-0"
              } ${
                !isActive 
                  ? "hover:scale-[1.04] hover:-translate-y-2 hover:shadow-2xl hover:z-20" 
                  : ""
              }`}
            >
              {isCurrentPlan && isExpired && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-md">
                  MASA TENGGANG
                </div>
              )}
              {isCurrentPlan && !isExpired && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-green-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-md">
                  PAKET AKTIF
                </div>
              )}

              <div className="text-sm font-semibold text-forest-700 dark:text-lime-400">{p.name}</div>
              <div className="mt-2 text-2xl font-bold tabular-nums">{p.price}</div>
              <p className="mt-1 text-xs text-neutral-600 dark:text-neutral-400">{p.note}</p>
              <ul className="mt-4 space-y-1 text-sm">
                {p.features.map((f) => <li key={f}>• {f}</li>)}
              </ul>
              
              {isActive ? (
                <div className="mt-5 w-full rounded-md border border-neutral-300 bg-neutral-100 py-2.5 text-center text-sm font-medium text-neutral-500 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-400">
                  Paket Aktif
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => { router.push(targetUrl); }}
                  className={`mt-5 flex w-full items-center justify-center rounded-md py-2.5 text-sm font-medium transition-all duration-200 ${
                    isHighlighted 
                      ? "bg-forest-700 text-white hover:bg-forest-500" 
                      : "border border-forest-700 text-forest-700 hover:bg-forest-700/5 dark:border-forest-500 dark:text-forest-500"
                  }`}
                >
                  {isCurrentPlan && isExpired 
                    ? `Perpanjang ${p.name}` 
                    : (p.code === "FREE" ? "Ajukan Downgrade ke Free" : `Bayar & Ajukan ${p.name}`)
                  }
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}