"use client";
import { useState, useEffect } from "react";
import Link from "next/link";

export default function HeroCarousel({ lang }: { lang: string }) {
  const [banners, setBanners] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  // 1. Ambil data banner dari API (tanpa cache)
  useEffect(() => {
    fetch("/api/banners?type=CAROUSEL", { cache: "no-store" })
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setBanners(data);
        } else {
          setBanners([]);
        }
      })
      .catch(console.error);
  }, []);

  // 2. Efek Ganti Gambar Otomatis (Setiap 5 detik)
  useEffect(() => {
    if (banners.length <= 1) return; 
    
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % banners.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [banners.length]);

  // Tampilan Loading (Skeleton)
  if (banners.length === 0) {
    return <div className="w-full h-full bg-neutral-200 dark:bg-neutral-800 animate-pulse rounded-md" />;
  }

  return (
    <div className="relative w-full h-full overflow-hidden rounded-md group bg-neutral-100 dark:bg-neutral-800">
      {banners.map((banner, index) => {
        const isActive = index === currentIndex;
        
        return (
          <div
            key={banner.id}
            className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
              isActive ? "opacity-100 z-10" : "opacity-0 z-0 pointer-events-none"
            }`}
          >
            {banner.linkUrl ? (
              <Link href={banner.linkUrl} target="_blank" rel="noopener noreferrer" className="block w-full h-full">
                <img
                  src={banner.imageUrl}
                  alt={banner.title || "Banner"}
                  className="w-full h-full object-cover"
                />
              </Link>
            ) : (
              <img
                src={banner.imageUrl}
                alt={banner.title || "Banner"}
                className="w-full h-full object-cover"
              />
            )}
          </div>
        );
      })}

      {/* Tombol Navigasi (Panah Kiri & Kanan) - TRANSPARAN */}
      {banners.length > 1 && (
        <>
          {/* Tombol Prev (Kiri) */}
          <button
            onClick={() => setCurrentIndex((prev) => (prev === 0 ? banners.length - 1 : prev - 1))}
            className="absolute left-3 top-1/2 -translate-y-1/2 z-20 bg-transparent text-white p-2 transition-all duration-300 hover:scale-125 opacity-70 hover:opacity-100 focus:outline-none"
            aria-label="Previous Banner"
          >
            {/* Ikon diberi drop-shadow agar tetap terlihat di gambar terang */}
            <svg className="w-8 h-8 md:w-10 md:h-10 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          {/* Tombol Next (Kanan) */}
          <button
            onClick={() => setCurrentIndex((prev) => (prev + 1) % banners.length)}
            className="absolute right-3 top-1/2 -translate-y-1/2 z-20 bg-transparent text-white p-2 transition-all duration-300 hover:scale-125 opacity-70 hover:opacity-100 focus:outline-none"
            aria-label="Next Banner"
          >
            {/* Ikon diberi drop-shadow agar tetap terlihat di gambar terang */}
            <svg className="w-8 h-8 md:w-10 md:h-10 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
            </svg>
          </button>

          {/* Indikator Titik di Bawah */}
          <div className="absolute bottom-4 left-0 right-0 z-20 flex justify-center gap-2">
            {banners.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                className={`h-2 rounded-full transition-all duration-300 ${
                  idx === currentIndex ? "bg-white w-6" : "bg-white/50 w-2 hover:bg-white"
                }`}
                aria-label={`Go to banner ${idx + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}