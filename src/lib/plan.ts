export const PLAN_PRICES = {
  FREE: 0,
  PRO: 49_000,
  PREMIUM: 149_000,
  ENTERPRISE: 0,
} as const;

export const PLAN_LABELS = {
  FREE: { id: "Gratis", en: "Free" },
  PRO: { id: "Pro Supplier", en: "Pro Supplier" },
  PREMIUM: { id: "Business Premium", en: "Business Premium" },
  ENTERPRISE: { id: "Enterprise", en: "Enterprise" },
} as const;

export const PLAN_LIMITS = {
  FREE: 10,
  PRO: 100,
  PREMIUM: 500,
  ENTERPRISE: 99_999,
} as const;

export const PLAN_DURATIONS = {
  FREE: 0,
  PRO: 30,
  PREMIUM: 30,
  ENTERPRISE: 365,
} as const;

export function formatRupiah(amount: number): string {
  return `Rp ${amount.toLocaleString("id-ID")}`;
}