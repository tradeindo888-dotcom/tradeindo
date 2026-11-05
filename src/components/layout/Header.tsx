"use client";
import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import { usePathname } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { LanguageToggle } from "@/components/ui/LanguageToggle";

export function Header({ lang, t }: { lang: string, t: any }) {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    setMounted(true);
  }, []);

  const role = (session?.user as any)?.role?.toUpperCase();

  useEffect(() => {
    // HAPUS SYARAT ROLE ADMIN AGAR ADMIN JUGA MENDAPATKAN NOTIFIKASI PESAN
    if (!session?.user) return;

    const fetchUnread = () => {
      fetch("/api/messages/unread-count")
        .then((res) => res.json())
        .then((data) => setUnreadCount(data.count || 0))
        .catch(() => {});
    };

    fetchUnread();
    const interval = setInterval(fetchUnread, 15000);

    return () => clearInterval(interval);
  }, [session, pathname]);

  if (!mounted) {
    return <div className="h-[106px] bg-white dark:bg-neutral-950 border-b border-neutral-200 dark:border-neutral-800" />;
  }

  return (
    <header className="sticky top-0 w-full z-50 border-b border-neutral-200 bg-white/90 backdrop-blur-md dark:border-neutral-800 dark:bg-neutral-950/90">
      <div className="mx-auto flex max-w-content items-center gap-4 px-4 py-3">
        <Link
          href={`/${lang}`}
          className="group flex items-center gap-2 transition-all duration-300 hover:scale-105 hover:drop-shadow-md shrink-0 cursor-pointer"
        >
          <img
            src="/tradeindo.png"
            alt="Trade Indo Logo"
            className="h-10 w-auto object-contain transition-transform duration-300 group-hover:scale-110"
          />
          <span className="hidden font-display text-xl font-bold text-forest-900 transition-colors duration-300 group-hover:text-forest-700 dark:text-white dark:group-hover:text-lime-400 sm:block tracking-tight">
            TRADE INDO
          </span>
        </Link>

        <form action={`/${lang}/search`} className="hidden flex-1 md:block ml-4">
          <input
            name="q"
            placeholder={t.searchPlaceholder}
            className="h-11 w-full rounded-md border border-neutral-300 bg-neutral-50 px-4 text-sm transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-forest-700/20 focus:border-forest-700 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100 dark:focus:ring-lime-400/20 dark:focus:border-lime-400"
          />
        </form>

        <div className="ml-auto flex items-center gap-2">
          <Suspense fallback={<div className="h-9 w-16 bg-neutral-200 animate-pulse rounded-md"></div>}>
            <LanguageToggle currentLang={lang} />
          </Suspense>

          {session?.user ? (
            <>
              <div className="hidden sm:flex flex-col items-end mr-2">
                <span className="text-sm font-semibold text-forest-900 dark:text-white leading-tight">
                  {session.user.name}
                </span>
                <span className="text-[10px] text-neutral-500 uppercase tracking-wider font-bold">
                  {role || "USER"}
                </span>
              </div>

              {/* TOMBOL PESAN (SEKARANG MUNCUL UNTUK ADMIN JUGA) */}
              <Link href={`/${lang}/messages`} className="relative">
                <Button
                  variant="ghost"
                  size="sm"
                  className="transition-all duration-300 hover:scale-105 hover:shadow-md hover:shadow-forest-700/20 hover:bg-forest-700/10 hover:text-forest-700 dark:hover:bg-lime-400/10 dark:hover:text-lime-400"
                >
                  {lang === "en" ? "Messages" : "Pesan"}
                </Button>
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white shadow-sm ring-2 ring-white dark:ring-neutral-950 animate-pulse">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </Link>

              <Link href={`/${lang}/workspace`}>
                <Button
                  variant="secondary"
                  size="sm"
                  className="transition-all duration-300 hover:scale-105 hover:shadow-md hover:shadow-forest-700/20 hover:bg-forest-700 hover:text-white dark:hover:bg-lime-400 dark:hover:text-neutral-900"
                >
                  {t.workspace}
                </Button>
              </Link>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => signOut({ callbackUrl: `/${lang}` })}
                className="transition-all duration-300 hover:scale-105 hover:shadow-md hover:shadow-red-600/20 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/30 dark:hover:text-red-400"
              >
                {t.logout}
              </Button>
            </>
          ) : (
            <>
              <Link href={`/${lang}/login`}>
                <Button
                  variant="ghost"
                  size="sm"
                  className="transition-all duration-300 hover:scale-105 hover:shadow-md hover:shadow-forest-700/20 hover:bg-forest-700/10 hover:text-forest-700 dark:hover:bg-lime-400/10 dark:hover:text-lime-400"
                >
                  {t.login}
                </Button>
              </Link>
              <Link href={`/${lang}/register`}>
                <Button
                  size="sm"
                  className="transition-all duration-300 hover:scale-105 hover:shadow-md hover:shadow-forest-700/20 hover:bg-forest-500"
                >
                  {t.register}
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>

      <nav className="border-t border-neutral-200 dark:border-neutral-800">
        <div className="mx-auto flex max-w-content items-center gap-2 overflow-x-auto px-4 py-2 text-sm">
          <Link href={`/${lang}/products`} className="rounded-md px-3 py-1.5 font-medium text-forest-700 transition-all duration-300 hover:scale-105 hover:bg-forest-700/10 hover:shadow-md hover:shadow-forest-700/20 dark:text-lime-400 dark:hover:bg-lime-400/10">{t.products}</Link>
          <Link href={`/${lang}/suppliers`} className="rounded-md px-3 py-1.5 text-neutral-700 transition-all duration-300 hover:scale-105 hover:bg-forest-700/10 hover:text-forest-700 hover:shadow-md hover:shadow-forest-700/20 dark:text-neutral-300 dark:hover:bg-lime-400/10 dark:hover:text-lime-400">{t.suppliers}</Link>
          <Link href={`/${lang}/rfqs`} className="rounded-md px-3 py-1.5 text-neutral-700 transition-all duration-300 hover:scale-105 hover:bg-forest-700/10 hover:text-forest-700 hover:shadow-md hover:shadow-forest-700/20 dark:text-neutral-300 dark:hover:bg-lime-400/10 dark:hover:text-lime-400">{t.rfq}</Link>
          <Link href={`/${lang}/services`} className="rounded-md px-3 py-1.5 text-neutral-700 transition-all duration-300 hover:scale-105 hover:bg-forest-700/10 hover:text-forest-700 hover:shadow-md hover:shadow-forest-700/20 dark:text-neutral-300 dark:hover:bg-lime-400/10 dark:hover:text-lime-400">{lang === "en" ? "Services & Subscriptions" : "Layanan & Langganan"}</Link>
          <Link href={`/${lang}/workspace/verification`} className="rounded-md px-3 py-1.5 text-neutral-700 transition-all duration-300 hover:scale-105 hover:bg-forest-700/10 hover:text-forest-700 hover:shadow-md hover:shadow-forest-700/20 dark:text-neutral-300 dark:hover:bg-lime-400/10 dark:hover:text-lime-400">{lang === "en" ? "Apply for Verification" : "Ajukan Verifikasi"}</Link>
          <Link href={`/${lang}/consumer-service`} className="rounded-md px-3 py-1.5 text-neutral-700 transition-all duration-300 hover:scale-105 hover:bg-forest-700/10 hover:text-forest-700 hover:shadow-md hover:shadow-forest-700/20 dark:text-neutral-300 dark:hover:bg-lime-400/10 dark:hover:text-lime-400">{lang === "en" ? "Consumer Service" : "Layanan Konsumen"}</Link>
          <Link href={`/${lang}/terms`} className="rounded-md px-3 py-1.5 text-neutral-700 transition-all duration-300 hover:scale-105 hover:bg-forest-700/10 hover:text-forest-700 hover:shadow-md hover:shadow-forest-700/20 dark:text-neutral-300 dark:hover:bg-lime-400/10 dark:hover:text-lime-400">{lang === "en" ? "Terms & Conditions" : "Syarat & Ketentuan"}</Link>
        </div>
      </nav>
    </header>
  );
}