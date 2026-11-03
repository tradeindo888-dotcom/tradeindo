"use client";
import { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";

type Message = {
  id: string;
  senderId: string;
  senderName: string;
  content: string;
  createdAt: string;
  isTemp?: boolean;
  isFailed?: boolean;
};

export default function ChatRoom() {
  const params = useParams();
  const lang = params.lang === "en" ? "en" : "id";
  const conversationId = params.id as string;
  const { data: session } = useSession();

  const [messages, setMessages] = useState<Message[]>([]);
  const [product, setProduct] = useState<any>(null); 
  const [inputValue, setInputValue] = useState("");
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch(`/api/messages?id=${conversationId}`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setMessages(data);
      })
      .catch(console.error);

    fetch(`/api/conversations/${conversationId}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.product) setProduct(data.product);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [conversationId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!inputValue.trim()) return;

    const textToSend = inputValue.trim();
    const tempId = `temp-${Date.now()}`;
    
    const tempMessage: Message = {
      id: tempId,
      senderId: (session?.user as any)?.id || "me",
      senderName: session?.user?.name || "Saya",
      content: textToSend,
      createdAt: new Date().toISOString(),
      isTemp: true,
    };

    setMessages((prev) => [...prev, tempMessage]);
    setInputValue("");

    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversationId, content: textToSend }),
      });

      if (res.ok) {
        const savedMessage = await res.json();
        setMessages((prev) => prev.map((m) => (m.id === tempId ? savedMessage : m)));
      } else {
        throw new Error("Failed");
      }
    } catch (err) {
      setMessages((prev) =>
        prev.map((m) => (m.id === tempId ? { ...m, isFailed: true, isTemp: false } : m))
      );
    }
  }

  async function handleDeleteMessage(id: string) {
    if (!confirm(lang === "en" ? "Delete this message?" : "Hapus pesan ini?")) return;
    try {
      const res = await fetch(`/api/messages/${id}`, { method: "DELETE" });
      if (res.ok) {
        setMessages((prev) => prev.filter((msg) => msg.id !== id));
      } else {
        const data = await res.json();
        alert(data.error || "Gagal menghapus pesan.");
      }
    } catch (err) {
      alert("Terjadi kesalahan.");
    }
  }

  if (loading) return <div className="p-16 text-center">Memuat obrolan...</div>;

  return (
    // max-w-4xl agar lebih lebar, h-[calc(100vh-106px)] agar pas di layar (106px adalah tinggi header)
    <div className="mx-auto max-w-4xl h-[calc(100vh-106px)] flex flex-col bg-neutral-50 dark:bg-neutral-950 border-x border-neutral-200 dark:border-neutral-800 shadow-sm relative">
      
      {/* HEADER CHAT */}
      <div className="bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800 p-4 flex items-center gap-3 shrink-0">
        <Link href={`/${lang}/messages`} className="text-forest-700 hover:underline text-sm font-medium whitespace-nowrap">
          ← {lang === "en" ? "Back" : "Kembali"}
        </Link>
        <h1 className="font-display font-bold text-lg">Ruang Obrolan</h1>
      </div>

      {/* KARTU PRODUK */}
      {product && (
        <div className="bg-white dark:bg-neutral-900 border-b border-neutral-200 dark:border-neutral-800 p-3 shrink-0">
          <Link 
            href={`/${lang}/products/${product.slug}`}
            className="flex items-center gap-3 bg-neutral-50 dark:bg-neutral-800 p-2 rounded-lg border border-neutral-200 dark:border-neutral-700 hover:border-forest-700 dark:hover:border-lime-400 transition-colors group"
          >
            <div className="h-12 w-12 shrink-0 rounded-md overflow-hidden bg-white border border-neutral-200">
              {product.images?.[0]?.url ? (
                <img src={product.images[0].url} alt={product.titleId} className="h-full w-full object-cover" />
              ) : (
                <div className="text-[10px] text-center mt-3 text-neutral-400">No Img</div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-medium text-neutral-900 dark:text-white line-clamp-1 group-hover:text-forest-700 dark:group-hover:text-lime-400 transition-colors">
                {lang === "en" ? product.titleEn : product.titleId}
              </h4>
              <p className="text-xs text-forest-700 dark:text-lime-400 font-semibold mt-0.5">
                {product.priceMin ? `Rp ${product.priceMin.toLocaleString("id-ID")}+` : "Hubungi Supplier"}
              </p>
            </div>
            <div className="shrink-0 text-neutral-400 pr-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            </div>
          </Link>
        </div>
      )}

      {/* AREA PESAN (Bisa di-scroll) */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => {
          const isMe = msg.senderId === (session?.user as any)?.id;
          
          const messageTime = new Date(msg.createdAt).toLocaleTimeString(
            lang === "en" ? "en-GB" : "id-ID", 
            { hour: "2-digit", minute: "2-digit" }
          );

          return (
            <div key={msg.id} className={`flex flex-col group ${isMe ? "items-end" : "items-start"}`}>
              
              <div className="flex items-center gap-2 mb-1 px-1">
                <span className="text-[11px] font-medium text-neutral-600 dark:text-neutral-400">{msg.senderName}</span>
                <span className="text-[10px] text-neutral-400">{messageTime}</span>
              </div>
              
              <div className="flex items-center gap-2 max-w-[85%]">
                {isMe && !msg.isTemp && (
                  <button
                    onClick={() => handleDeleteMessage(msg.id)}
                    className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 transition-opacity text-xs font-medium shrink-0"
                    title="Hapus pesan"
                  >
                    Hapus
                  </button>
                )}

                <div
                  className={`rounded-xl p-3 text-sm ${
                    isMe
                      ? "bg-forest-700 text-white rounded-tr-sm"
                      : "bg-white border border-neutral-200 dark:border-neutral-700 dark:bg-neutral-800 rounded-tl-sm"
                  } ${msg.isTemp ? "opacity-70" : "opacity-100"}`}
                >
                  {msg.content}
                </div>
              </div>

              {msg.isTemp && <span className="text-[10px] text-neutral-400 mt-1 pr-1">Mengirim...</span>}
              {msg.isFailed && (
                <span className="text-[10px] text-red-500 mt-1 pr-1 flex items-center gap-1">
                  ⚠️ Gagal terkirim.
                </span>
              )}
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* INPUT AREA (Selalu di bawah) */}
      <form onSubmit={handleSend} className="bg-white dark:bg-neutral-900 p-4 border-t border-neutral-200 dark:border-neutral-800 shrink-0">
        <div className="flex gap-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder={lang === "en" ? "Type a message..." : "Ketik pesan..."}
            className="flex-1 h-11 rounded-md border border-neutral-300 px-4 text-sm focus:outline-none focus:border-forest-700 dark:border-neutral-700 dark:bg-neutral-800"
          />
          <button
            type="submit"
            disabled={!inputValue.trim()}
            className="bg-forest-700 text-white px-6 rounded-md text-sm font-medium hover:bg-forest-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {lang === "en" ? "Send" : "Kirim"}
          </button>
        </div>
      </form>

    </div>
  );
}