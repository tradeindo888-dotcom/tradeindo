"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { toast } from "sonner";

export default function MessagesPage() {
  const params = useParams();
  const lang = params.lang === "en" ? "en" : "id";
  const { data: session } = useSession();
  const myCompanyId = (session?.user as any)?.companyId;

  const [conversations, setConversations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // 1. Fetch data obrolan
  useEffect(() => {
    fetch("/api/conversations")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setConversations(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  // 2. Fungsi Hapus Obrolan
  async function handleDeleteConversation(e: React.MouseEvent, convId: string) {
    e.preventDefault();
    e.stopPropagation();

    if (
      !confirm(
        lang === "en"
          ? "Delete this chat? All messages will be permanently removed."
          : "Hapus obrolan ini? Semua pesan akan hilang permanen."
      )
    )
      return;

    try {
      const res = await fetch(`/api/conversations/${convId}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      
      toast.success(lang === "en" ? "Chat deleted" : "Obrolan dihapus");
      // Hapus dari UI tanpa perlu refresh halaman
      setConversations((prev) => prev.filter((c) => c.id !== convId));
    } catch {
      toast.error(lang === "en" ? "Failed to delete" : "Gagal menghapus obrolan");
    }
  }

  // 3. Tampilan Loading
  if (loading) {
    return <div className="p-16 text-center text-neutral-500">Memuat pesan...</div>;
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="font-display text-2xl font-bold mb-6 text-neutral-900 dark:text-white">
        {lang === "en" ? "Inbox" : "Kotak Masuk"}
      </h1>

      {conversations.length === 0 ? (
        // Tampilan Kosong
        <div className="text-center py-16 border border-dashed border-neutral-300 dark:border-neutral-700 rounded-xl bg-white dark:bg-neutral-900">
          <div className="text-4xl mb-3">📭</div>
          <p className="text-neutral-500">
            {lang === "en" ? "No messages yet." : "Belum ada pesan."}
          </p>
        </div>
      ) : (
        // Tampilan Daftar Obrolan
        <div className="space-y-4">
          {conversations.map((conv) => {
            const isBuyer = conv.buyerCompanyId === myCompanyId;
            const otherCompany = isBuyer ? conv.supplierCompany : conv.buyerCompany;
            const lastMessage = conv.messages?.[0];
            
            const unreadCount =
              conv.messages?.filter(
                (m: any) => !m.isRead && m.senderId !== (session?.user as any)?.id
              ).length || 0;

            return (
              // Wrapper Flex: untuk mensejajarkan Card dan Tombol Delete
              <div key={conv.id} className="relative group flex items-center gap-3">
                
                {/* CARD PESAN (Dengan Efek Hover Terangkat) */}
                <Link
                  href={`/${lang}/messages/${conv.id}`}
                  className="flex-1 block rounded-xl border border-neutral-200 bg-white p-4 shadow-sm transition-all duration-300 ease-out hover:-translate-y-2 hover:shadow-2xl hover:ring-4 hover:ring-lime-400 hover:border-forest-700 dark:border-neutral-800 dark:bg-neutral-900 dark:hover:border-lime-400"
                >
                  <div className="flex items-center gap-4">
                    {/* Avatar Inisial */}
                    <div className="h-12 w-12 shrink-0 rounded-full bg-forest-700 text-white flex items-center justify-center font-bold text-lg">
                      {otherCompany?.name?.slice(0, 2).toUpperCase() || "?"}
                    </div>

                    {/* Info Pesan */}
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-baseline mb-1">
                        <h3 className="font-bold text-neutral-900 dark:text-white truncate">
                          {otherCompany?.name || "Unknown Company"}
                        </h3>
                        <span className="text-xs text-neutral-500 whitespace-nowrap ml-2">
                          {lastMessage
                            ? new Date(lastMessage.createdAt).toLocaleDateString(
                                lang === "en" ? "en-GB" : "id-ID"
                              )
                            : ""}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <p className="text-sm text-neutral-600 dark:text-neutral-400 truncate">
                          {lastMessage ? (
                            <>
                              <span className="font-medium">{lastMessage.senderName}:</span>{" "}
                              {lastMessage.content}
                            </>
                          ) : (
                            "Belum ada pesan."
                          )}
                        </p>
                        {unreadCount > 0 && (
                          <span className="ml-2 bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0">
                            {unreadCount} baru
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>

                {/* TOMBOL DELETE (Di Luar Link, muncul saat grup di-hover) */}
                <button
                  onClick={(e) => handleDeleteConversation(e, conv.id)}
                  className="opacity-0 group-hover:opacity-100 transition-all duration-300 shrink-0 flex items-center justify-center h-12 w-12 rounded-xl bg-red-50 text-red-600 hover:bg-red-600 hover:text-white border border-red-200 hover:border-red-700 shadow-sm hover:shadow-md"
                  title={lang === "en" ? "Delete chat" : "Hapus obrolan"}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}