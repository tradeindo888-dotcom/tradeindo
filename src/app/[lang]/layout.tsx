"use client";
import { useState, useEffect } from "react";
import { Header } from "@/components/layout/Header";
import { dict, Locale } from "@/lib/i18n";

export default function LangLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: { lang: string };
}) {
  const lang = params.lang === "en" ? "en" : "id";
  const t = dict[lang as Locale];
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="flex min-h-screen flex-col">
      {mounted ? <Header lang={lang} t={t} /> : <div className="h-[106px] w-full border-b bg-white dark:bg-neutral-950" />}
      <main className="flex-1">
        {children}
      </main>
    </div>
  );
}