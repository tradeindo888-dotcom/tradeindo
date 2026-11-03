import type { SponsoredStatus } from "@prisma/client";

const ALLOWED: Record<SponsoredStatus, SponsoredStatus[]> = {
  PENDING:   ["APPROVED", "REJECTED", "CANCELLED"],
  APPROVED:  ["EXPIRED"],
  EXPIRED:   [],
  REJECTED:  [],
  CANCELLED: [],
};

export function canTransition(from: SponsoredStatus, to: SponsoredStatus): boolean {
  return ALLOWED[from]?.includes(to) ?? false;
}

export function isActive(status: SponsoredStatus): boolean {
  return status === "APPROVED";
}

export function isTerminal(status: SponsoredStatus): boolean {
  return ALLOWED[status]?.length === 0;
}