interface SponsoredFields {
  sponsoredUntil: Date | string | null | undefined;
}

export function isCurrentlySponsored(product: SponsoredFields): boolean {
  if (!product.sponsoredUntil) return false;
  const until = typeof product.sponsoredUntil === "string"
    ? new Date(product.sponsoredUntil)
    : product.sponsoredUntil;
  return until.getTime() > Date.now();
}

export function wasSponsored(product: SponsoredFields): boolean {
  return !!product.sponsoredUntil;
}