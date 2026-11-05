"use client";
import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";

export default function ChatRoomPage() {
  const params = useParams();
  const router = useRouter();
  const lang = params.lang === "en" ? "en" : "id";
  const conversationId = params.id as string;
  const { data: session } = useSession();
  const myId = (session?.user as any)?.id;

  const [messages, setMessages] = useState<any[]>([]);
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [conversation, setConversation] = useState<any>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  // CLASS INPUT AGAR TIDAK ABU-ABU DI HP
  const inputClass = "flex-1 h-12 rounded-lg border border-neutral-300 px-4 text-sm bg-white text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-forest-700 focus:border-transparent dark:bg-neutral-800 dark:border-neutral-700 dark:text-white dark:placeholder:text-neutral-500 dark:focus:ring-lime-400";

  const fetchMessages = async () => {
    try {
      const res = await fetch(`/api/messages?id=${conversationId}`);
      if (!res.ok) throw new Error("Gagal memuat pesan");
      const data = await res.json();
      setMessages(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
    // Polling setiap 3 detik untuk pesan baru
    pollingRef.current = setInterval(fetchMessages, 3000);
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [conversationId]);

  // Auto-scroll ke bawah saat ada pesan baru
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!inputText.trim()) return;

    setSending(true);
    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversationId, content: inputText }),
      });
      if (!res.ok) throw new Error("Gagal mengirim pesan");
      
      setInputText("");
      fetchMessages(); // Refresh pesan
    } catch (err) {
      toast.error("Gagal mengirim pesan.");
    } finally {
      setSending(false);
    }
  }

  if (loading) return <div className="p-16 text-center text-neutral-500">Memuat obrolan...</div>;

  return (
    <div className="mx-auto max-w-3xl h-[calc(100vh-120px)] flex flex-col bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-xl shadow-sm overflow-hidden my-4">
      
      {/* HEADER CHAT */}
      <div className="shrink-0 flex items-center gap-3 p-4 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/50">
        <Link href={`/${lang}/messages`} className="text-neutral-500 hover:text-forest-700 dark:hover:text-lime-400">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
        </Link>
        <div>
          <h2 className="font-bold text-neutral-900 dark:text-white">Obrolan</h2>
          <p className="text-xs text-neutral-500">Pesan akan diperbarui secara otomatis</p>
        </div>
      </div>

      {/* AREA PESAN */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-neutral-50 dark:bg-neutral-950/50">
        {messages.map((msg, index) => {
          const isMe = msg.senderId === myId;

          return (
            <div key={msg.id || index} className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}>
              <span className="text-[10px] text-neutral-500 mb-1 ml-1 mr-1">
                {isMe ? "Anda" : msg.senderName}
              </span>
              <div 
                className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm shadow-sm ${
                  isMe 
                    ? "bg-forest-700 text-white rounded-tr-sm" 
                    : "bg-white text-neutral-900 border border-neutral-200 dark:bg-neutral-800 dark:text-white dark:border-neutral-700 rounded-tl-sm"
                }`}
              >
                {msg.content}
              </div>
              <span className="text-[10px] text-neutral-400 mt-1">
                {new Date(msg.createdAt).toLocaleTimeString(lang === "en" ? "en-GB" : "id-ID", { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* AREA INPUT KETIK */}
      <div className="shrink-0 p-4 border-t border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
        <form onSubmit={handleSendMessage} className="flex gap-3">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={lang === "en" ? "Type a message..." : "Ketik pesan..."}
            className={inputClass}
            disabled={sending}
          />
          <Button type="submit" disabled={!inputText.trim() || sending} className="h-12 px-6">
            {sending ? "..." : (lang === "en" ? "Send" : "Kirim")}
          </Button>
        </form>
      </div>

    </div>
  );
}