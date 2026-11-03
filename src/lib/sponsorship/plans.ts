import type { SponsorshipTier } from "@prisma/client";

export interface SponsorPlan {
  tier: SponsorshipTier;
  durationDays: number;
  price: number;
  label: string;
  labelEn: string;
  badge?: "popular" | "best-value";
  savingsPercent?: number;
}

export const SPONSOR_PLANS: SponsorPlan[] = [
  // --- TIER 1: STANDARD (Paling Murah, Untuk Coba-coba) ---
  { tier: "STANDARD", durationDays: 7,  price: 5_000,   label: "7 Hari",  labelEn: "7 days" },
  { tier: "STANDARD", durationDays: 30, price: 15_000,  label: "30 Hari", labelEn: "30 days", badge: "popular", savingsPercent: 30 },
  { tier: "STANDARD", durationDays: 90, price: 35_000,  label: "90 Hari", labelEn: "90 days", savingsPercent: 55 },

  // --- TIER 2: CATEGORY SPOTLIGHT (Harga 2x lipat) ---
  { tier: "CATEGORY", durationDays: 7,  price: 10_000,  label: "7 Hari",  labelEn: "7 days" },
  { tier: "CATEGORY", durationDays: 30, price: 30_000,  label: "30 Hari", labelEn: "30 days", savingsPercent: 30 },
  { tier: "CATEGORY", durationDays: 90, price: 75_000,  label: "90 Hari", labelEn: "90 days", savingsPercent: 55 },

  // --- TIER 3: HOMEPAGE FEATURE (Harga 4x lipat, Paling Bergengsi) ---
  { tier: "HOMEPAGE", durationDays: 7,  price: 25_000,  label: "7 Hari",  labelEn: "7 days" },
  { tier: "HOMEPAGE", durationDays: 30, price: 75_000,  label: "30 Hari", labelEn: "30 days", savingsPercent: 30 },
  { tier: "HOMEPAGE", durationDays: 90, price: 200_000, label: "90 Hari", labelEn: "90 days", savingsPercent: 55 },
];

// Batas maksimal produk yang bisa di-sponsor bersamaan per paket langganan
export const MAX_ACTIVE_SPONSORSHIPS = {
  FREE: 10,
  PRO: 30,
  PREMIUM: 60,
  ENTERPRISE: 999,
} as const;

export const APPROVAL_SLA_HOURS = 24;

export function findPlan(tier: SponsorshipTier, durationDays: number): SponsorPlan | null {
  return SPONSOR_PLANS.find(p => p.tier === tier && p.durationDays === durationDays) ?? null;
}