import { describe, expect, it } from "vitest";
import { productRank, sortFillLevelsByProductId } from "@/lib/shelfOrder";
import type { FillLevel } from "@/lib/api";

function level(productId: string, tagId: number): FillLevel {
  return {
    tag_id: tagId,
    fill_level: 50,
    timestamp: "2026-01-01T00:00:00",
    product_id: productId,
    product_name: productId,
    supplier_name: "Supplier",
    reorder_threshold: 20,
    status: "ok",
  };
}

describe("shelf ordering", () => {
  it("extracts numeric rank from product id suffix", () => {
    expect(productRank("MAT-001")).toBe(1);
    expect(productRank("MAT-010")).toBe(10);
    expect(productRank("NO_SUFFIX")).toBe(Number.MAX_SAFE_INTEGER);
  });

  it("sorts fill levels by product id numeric suffix", () => {
    const input = [level("MAT-010", 10), level("MAT-002", 2), level("MAT-001", 1)];
    const sorted = sortFillLevelsByProductId(input);

    expect(sorted.map((x) => x.product_id)).toEqual(["MAT-001", "MAT-002", "MAT-010"]);
  });
});
