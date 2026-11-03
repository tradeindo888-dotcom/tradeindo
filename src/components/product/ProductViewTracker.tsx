"use client";
import { useEffect } from "react";
import { isCurrentlySponsored } from "@/lib/product-utils";

export function ProductViewTracker({
  productId,
  sponsoredUntil,
}: {
  productId: string;
  sponsoredUntil: string | null;
}) {
  useEffect(() => {
    // Mencegah tracking ganda di React Strict Mode (development)
    const key = `viewed_${productId}`;
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, "1");

    const source = isCurrentlySponsored({ sponsoredUntil }) ? "sponsored" : "organic";
    
    fetch("/api/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId, eventType: "VIEW", source }),
    }).catch(() => {});
  }, [productId, sponsoredUntil]);

  return null;
}