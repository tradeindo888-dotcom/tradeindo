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
    if (banners.length <= 1) return; // Jika cuma 1 banner, tidak perlu ganti-ganti
    
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

      {/* Tombol Navigasi (Panah Kiri & Kanan) - SELALU TERLIHAT */}
      {banners.length > 1 && (
        <>
          {/* Tombol Prev (Kiri) */}
          <button
            onClick={() => setCurrentIndex((prev) => (prev === 0 ? banners.length - 1 : prev - 1))}
            className="absolute left-3 top-1/2 -translate-y-1/2 z-20 bg-black/40 hover:bg-black/70 text-white rounded-full p-2.5 shadow-lg transition-all duration-300 backdrop-blur-sm opacity-80 hover:opacity-100"
            aria-label="Previous Banner"
          >
            <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          {/* Tombol Next (Kanan) */}
          <button
            onClick={() => setCurrentIndex((prev) => (prev + 1) % banners.length)}
            className="absolute right-3 top-1/2 -translate-y-1/2 z-20 bg-black/40 hover:bg-black/70 text-white rounded-full p-2.5 shadow-lg transition-all duration-300 backdrop-blur-sm opacity-80 hover:opacity-100"
            aria-label="Next Banner"
          >
            <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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