"use client";
import { usePathname, useSearchParams } from "next/navigation";

export function LanguageToggle({ currentLang }: { currentLang: string }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const toggleLang = () => {
    const newLang = currentLang === "id" ? "en" : "id";
    const segments = pathname.split("/");
    segments[1] = newLang;
    const newPath = segments.join("/");
    const queryString = searchParams.toString();
    const finalUrl = queryString ? `${newPath}?${queryString}` : newPath;

    window.location.href = finalUrl;
  };

  return (
    <button
      onClick={toggleLang}
      className="inline-flex items-center gap-1 rounded-md border border-neutral-300 bg-white px-3 py-1.5 text-sm font-medium text-neutral-700 transition-all duration-300 hover:scale-105 hover:shadow-md hover:shadow-forest-700/20 hover:border-forest-700 hover:bg-forest-700 hover:text-white dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-300 dark:hover:border-lime-400 dark:hover:bg-lime-400 dark:hover:text-neutral-900"
    >
      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" /></svg>
      <span className="uppercase">{currentLang === "id" ? "EN" : "ID"}</span>
    </button>
  );
}