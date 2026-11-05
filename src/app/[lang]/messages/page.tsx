"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";

export default function MessagesPage() {
  const params = useParams();
  const lang = params.lang === "en" ? "en" : "id";
  const { data: session } = useSession();
  const myCompanyId = (session?.user as any)?.companyId;

  const [conversations, setConversations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/conversations")
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setConversations(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="p-16 text-center text-neutral-500">Memuat pesan...</div>;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="font-display text-2xl font-bold mb-6 text-neutral-900 dark:text-white">
        {lang === "en" ? "Inbox" : "Kotak Masuk"}
      </h1>

      {conversations.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-neutral-300 dark:border-neutral-700 rounded-xl bg-white dark:bg-neutral-900">
          <div className="text-4xl mb-3">📭</div>
          <p className="text-neutral-500">{lang === "en" ? "No messages yet." : "Belum ada pesan."}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {conversations.map((conv) => {
            // Menentukan lawan bicara (jika saya buyer, lawan supplier, dan sebaliknya)
            const isBuyer = conv.buyerCompanyId === myCompanyId;
            const otherCompany = isBuyer ? conv.supplierCompany : conv.buyerCompany;
            
            // Mengambil pesan terakhir
            const lastMessage = conv.messages?.[0]; 
            const unreadCount = conv.messages?.filter((m: any) => !m.isRead && m.senderId !== (session?.user as any).id).length || 0;

            return (
              <Link
                key={conv.id}
                href={`/${lang}/messages/${conv.id}`}
                className="block rounded-xl border border-neutral-200 bg-white p-4 shadow-sm hover:shadow-md transition-all dark:border-neutral-800 dark:bg-neutral-900 group"
              >
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 shrink-0 rounded-full bg-forest-700 text-white flex items-center justify-center font-bold text-lg">
                    {otherCompany?.name?.slice(0, 2).toUpperCase() || "?"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline mb-1">
                      <h3 className="font-bold text-neutral-900 dark:text-white truncate">
                        {otherCompany?.name || "Unknown Company"}
                      </h3>
                      <span className="text-xs text-neutral-500 whitespace-nowrap ml-2">
                        {lastMessage ? new Date(lastMessage.createdAt).toLocaleDateString(lang === "en" ? "en-GB" : "id-ID") : ""}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <p className="text-sm text-neutral-600 dark:text-neutral-400 truncate">
                        {lastMessage ? (
                          <><span className="font-medium">{lastMessage.senderName}:</span> {lastMessage.content}</>
                        ) : (
                          "Belum ada pesan."
                        )}
                      </p>
                      {unreadCount > 0 && (
                        <span className="ml-2 bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                          {unreadCount} baru
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}