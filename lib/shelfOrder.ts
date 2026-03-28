import type { FillLevel } from "@/lib/api";

export function productRank(productId: string): number {
  const match = productId.match(/(\d+)\s*$/);
  if (!match) return Number.MAX_SAFE_INTEGER;
  return Number(match[1]);
}

export function sortFillLevelsByProductId(levels: FillLevel[]): FillLevel[] {
  return [...levels].sort((a, b) => {
    const rankDiff = productRank(a.product_id) - productRank(b.product_id);
    if (rankDiff !== 0) return rankDiff;
    return a.product_id.localeCompare(b.product_id);
  });
}
