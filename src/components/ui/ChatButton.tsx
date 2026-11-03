"use client";
import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/Button";

export function ChatButton({ 
  supplierCompanyId, 
  productId, 
  label 
}: { 
  supplierCompanyId: string; 
  productId: string; 
  label: string 
}) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const lang = params.lang === "en" ? "en" : "id";
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleChat = async () => {
    // Jika belum login, arahkan ke login
    if (!session?.user) {
      router.push(`/${lang}/login?next=/${lang}/products/${productId}`);
      return;
    }

    const myCompanyId = (session.user as any).companyId;

    // Cek jika user tidak punya perusahaan (misal Admin)
    if (!myCompanyId) {
      alert(lang === "en" ? "Only company accounts can start a chat." : "Hanya akun perusahaan yang dapat memulai obrolan.");
      return;
    }

    // Cek jika user mencoba chat ke perusahaannya sendiri
    if (myCompanyId === supplierCompanyId) {
      alert(lang === "en" ? "You cannot chat with your own company." : "Anda tidak dapat mengobrol dengan perusahaan Anda sendiri.");
      return;
    }

    setLoading(true);
    const res = await fetch("/api/chat/start", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ supplierCompanyId, productId }),
    });

    if (res.ok) {
      const data = await res.json();
      router.push(`/${lang}/messages/${data.id}`);
    } else {
      alert(lang === "en" ? "Failed to start chat." : "Gagal memulai chat.");
    }
    setLoading(false);
  };

  if (!mounted) {
    return (
      <Button className="w-full opacity-50 cursor-not-allowed">
        Memuat...
      </Button>
    );
  }

  return (
    <Button onClick={handleChat} disabled={loading} className="w-full">
      {loading ? (lang === "en" ? "Loading..." : "Memuat...") : label}
    </Button>
  );
}