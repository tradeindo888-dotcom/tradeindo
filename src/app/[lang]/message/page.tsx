"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

export default function InboxPage() {
  const params = useParams();
  const router = useRouter();
  const lang = params.lang === "en" ? "en" : "id";
  const { data: session } = useSession();
  
  const [conversations, setConversations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchConversations = () => {
    fetch("/api/conversations")
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setConversations(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  useEffect(() => {
    fetchConversations();
  }, []);

  async function handleDelete(id: string) {
    if (!confirm(lang === "en" ? "Delete this conversation?" : "Hapus obrolan ini?")) return;

    await fetch(`/api/conversations/${id}`, { method: "DELETE" });
    fetchConversations(); // Refresh daftar setelah dihapus
  }

  if (loading) return <div className="p-8 text-center">Memuat kotak masuk...</div>;

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="font-display text-2xl font-bold mb-6">
        {lang === "en" ? "Inbox" : "Kotak Masuk"}
      </h1>

      <div className="space-y-3">
        {conversations.length === 0 ? (
          <div className="text-center p-8 border rounded-md text-neutral-500">
            {lang === "en" ? "No messages yet." : "Belum ada pesan."}
          </div>
        ) : (
          conversations.map((chat) => (
            <div key={chat.id} className="relative flex items-center justify-between p-4 border rounded-md hover:bg-neutral-50 dark:border-neutral-800 dark:hover:bg-neutral-900 transition-colors">
              <Link href={`/${lang}/messages/${chat.id}`} className="flex-1">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-semibold text-forest-700 dark:text-lime-400">
                    {lang === "en" ? "Chat Room" : "Ruang Obrolan"}
                  </span>
                  <span className="text-xs text-neutral-500">
                    {new Date(chat.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-sm text-neutral-600 dark:text-neutral-400 line-clamp-1">
                  {chat.messages[0]?.content || "Belum ada pesan"}
                </p>
              </Link>
              
              <button 
                onClick={() => handleDelete(chat.id)}
                className="ml-4 text-red-500 hover:text-red-700 text-sm font-medium"
              >
                {lang === "en" ? "Delete" : "Hapus"}
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}