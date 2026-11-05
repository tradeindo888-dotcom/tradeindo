"use client";
import { useState, useEffect } from "react";
import Link from "next/link";

export default function HeroCarousel({ lang }: { lang: string }) {
  const [banners, setBanners] = useState<any[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Ambil data banner tanpa cache
  useEffect(() => {
    fetch("/api/banners?type=CAROUSEL", { cache: "no-store" })
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setBanners(data);
        else setBanners([]);
      })
      .catch(console.error);
  }, []);

  // Efek ganti gambar otomatis
  useEffect(() => {
    if (banners.length <= 1) return; 
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % banners.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [banners.length]);

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
                <img src={banner.imageUrl} alt={banner.title || "Banner"} className="w-full h-full object-cover" />
              </Link>
            ) : (
              <img src={banner.imageUrl} alt={banner.title || "Banner"} className="w-full h-full object-cover" />
            )}
          </div>
        );
      })}
    </div>
  );
}