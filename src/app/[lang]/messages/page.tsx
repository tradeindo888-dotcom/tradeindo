"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

export default function InboxPage() {
  const params = useParams();
  const router = useRouter();
  const lang = params.lang === "en" ? "en" : "id";
  const { data: session, status } = useSession();
  
  const [conversations, setConversations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === "loading") return;

    if (status === "unauthenticated") {
      router.replace(`/${lang}/login`);
      return;
    }

    // Redirect Admin jika iseng masuk
    if (status === "authenticated" && (session?.user as any)?.role === "ADMIN") {
      router.replace(`/${lang}/admin`);
      return;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    // Tambahkan cache: "no-store" agar selalu mengambil data terbaru
    fetch("/api/conversations", { cache: "no-store", signal: controller.signal })
      .then(res => {
        if (!res.ok) throw new Error("Gagal mengambil data");
        return res.json();
      })
      .then(data => {
        if (Array.isArray(data)) setConversations(data);
        else setError("Data format tidak sesuai");
        setLoading(false);
      })
      .catch(err => {
        if (err.name === 'AbortError') setError("Waktu habis (timeout)");
        else setError("Gagal terhubung ke server");
        setLoading(false);
      })
      .finally(() => clearTimeout(timeoutId));
  }, [status, session, router, lang]);

  async function handleDelete(id: string) {
    if (!confirm(lang === "en" ? "Delete this conversation?" : "Hapus obrolan ini?")) return;

    try {
      const res = await fetch(`/api/conversations/${id}`, { method: "DELETE" });
      
      if (res.ok) {
        // Jika berhasil, hapus dari tampilan tanpa refresh
        setConversations((prev) => prev.filter((chat) => chat.id !== id));
      } else {
        // TANGKAP PESAN ERROR ASLI DARI API
        const errorData = await res.json().catch(() => ({}));
        alert(errorData.error || (lang === "en" ? "Failed to delete." : "Gagal menghapus."));
      }
    } catch (err) {
      alert(lang === "en" ? "Something went wrong." : "Terjadi kesalahan jaringan.");
    }
  }

  if (status === "loading" || loading) {
    return <div className="p-8 text-center">{lang === "en" ? "Loading inbox..." : "Memuat kotak masuk..."}</div>;
  }

  if (error) {
    return <div className="p-8 text-center text-red-500">{error}</div>;
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="font-display text-2xl font-bold mb-6">
        {lang === "en" ? "Inbox" : "Kotak Masuk"}
      </h1>

      <div className="space-y-3">
        {conversations.length === 0 ? (
          <div className="text-center p-8 border border-dashed rounded-lg text-neutral-500">
            {lang === "en" ? "No messages yet." : "Belum ada pesan."}
          </div>
        ) : (
          conversations.map((chat) => {
            const myCompanyId = (session?.user as any)?.companyId;
            const otherPartyName = chat.buyerCompanyId === myCompanyId
              ? chat.supplierCompany?.name
              : chat.buyerCompany?.name;

            return (
              <div 
                key={chat.id} 
                className="group relative flex items-center justify-between p-4 border border-neutral-200 bg-white rounded-lg dark:border-neutral-800 dark:bg-neutral-900 transition-all duration-300 ease-out hover:-translate-y-2 hover:shadow-2xl hover:ring-2 hover:ring-lime-400 hover:border-forest-700 dark:hover:border-lime-400"
              >
                <Link href={`/${lang}/messages/${chat.id}`} className="flex-1">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-semibold text-forest-700 dark:text-lime-400 group-hover:text-forest-900 dark:group-hover:text-lime-300 transition-colors">
                      {otherPartyName || "Unknown"}
                    </span>
                    <span className="text-xs text-neutral-500">
                      {new Date(chat.createdAt).toLocaleDateString(lang === "en" ? "en-GB" : "id-ID", { day: "2-digit", month: "2-digit", year: "numeric" })}
                    </span>
                  </div>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400 line-clamp-1">
                    {chat.messages?.[0]?.content || (lang === "en" ? "No messages yet." : "Belum ada pesan")}
                  </p>
                </Link>
                
                <button 
                  onClick={(e) => {
                    e.preventDefault();
                    handleDelete(chat.id);
                  }}
                  className="ml-4 text-red-500 hover:text-red-700 text-sm font-medium transition-colors"
                >
                  {lang === "en" ? "Delete" : "Hapus"}
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}