"use client";

import { useEffect, useMemo, useState } from "react";
import FloatingTabs from "@/components/FloatingTabs";
import {
  ProductEnvItem,
  bulkUpdateProductEnv,
  fetchProductEnvAll,
  updateProductEnvByTag,
} from "@/lib/api";

const EDITABLE_FIELDS = [
  "TAG_ID",
  "ID",
  "NAME",
  "SUPPLIER_NAME",
  "SUPPLIER_EMAIL",
  "THRESHOLD",
  "REORDER_THRESHOLD",
  "REORDER_QTY",
  "REORDER_QUANTITY",
  "UNIT",
] as const;

type EditableField = (typeof EDITABLE_FIELDS)[number];

function sortByTagId(items: ProductEnvItem[]): ProductEnvItem[] {
  return [...items].sort((a, b) => a.tag_id - b.tag_id);
}

export default function CreateProductsPage() {
  const [items, setItems] = useState<ProductEnvItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState("Loading product config...");

  const refresh = async (message?: string) => {
    setLoading(true);
    const data = await fetchProductEnvAll();
    const filtered = sortByTagId(data).filter((item) => item.tag_id === 0 || item.tag_id === 1);
    setItems(filtered);
    setStatus(
      message ||
        (filtered.length > 0
          ? "Loaded product config from backend."
          : "No product-env data returned."),
    );
    setLoading(false);
  };

  useEffect(() => {
    refresh();
  }, []);

  const canSaveAll = useMemo(() => items.length > 0 && !loading, [items.length, loading]);

  const updateField = (tagId: number, field: EditableField, value: string) => {
    setItems((prev) =>
      prev.map((item) =>
        item.tag_id === tagId
          ? { ...item, values: { ...item.values, [field]: value } }
          : item,
      ),
    );
  };

  const saveOne = async (tagId: number) => {
    const target = items.find((i) => i.tag_id === tagId);
    if (!target) return;

    const payload: Record<string, string | number> = {};
    EDITABLE_FIELDS.forEach((field) => {
      if (target.values[field] !== undefined) payload[field] = target.values[field];
    });

    const updated = await updateProductEnvByTag(tagId, payload);
    if (!updated) {
      setStatus(`Save failed for tag ${tagId}.`);
      return;
    }
    await refresh(`Saved product config for tag ${tagId}.`);
  };

  const saveAll = async () => {
    if (!canSaveAll) return;

    const payload: Record<string, Record<string, string | number>> = {};
    items.forEach((item) => {
      const values: Record<string, string | number> = {};
      EDITABLE_FIELDS.forEach((field) => {
        if (item.values[field] !== undefined) values[field] = item.values[field];
      });
      payload[String(item.tag_id)] = values;
    });

    const ok = await bulkUpdateProductEnv(payload);
    if (!ok) {
      setStatus("Save all failed.");
      return;
    }
    await refresh("Saved config for all products.");
  };

  return (
    <main className="max-w-5xl mx-auto px-4 py-6 pb-24">
      <h1 className="text-2xl font-bold mb-2">Edit Shelf Products</h1>
      <p className="text-gray-500 dark:text-gray-400 mb-6">{status}</p>

      <section className="rounded-lg border border-gray-200 dark:border-gray-700 p-5 bg-white dark:bg-gray-900">
        <div className="flex gap-3 mb-5">
          <button
            onClick={saveAll}
            disabled={!canSaveAll}
            className="px-4 py-2 rounded-md bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900 text-sm font-medium disabled:opacity-60"
          >
            Save All
          </button>
          <button
            onClick={() => refresh("Reloaded from backend.")}
            className="px-4 py-2 rounded-md border border-gray-300 dark:border-gray-700 text-sm font-medium"
          >
            Reload
          </button>
        </div>

        {loading ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">Loading...</p>
        ) : (
          <div className="space-y-5">
            {items.map((item) => (
              <div
                key={item.tag_id}
                className="rounded-md border border-gray-200 dark:border-gray-700 p-4"
              >
                <div className="flex items-center justify-between mb-3">
                  <h2 className="font-semibold">Tag ID {item.tag_id}</h2>
                  <button
                    onClick={() => saveOne(item.tag_id)}
                    className="px-3 py-1.5 rounded-md border border-gray-300 dark:border-gray-700 text-sm"
                  >
                    Save This Product
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {EDITABLE_FIELDS.map((field) => (
                    <div key={`${item.tag_id}-${field}`}>
                      <label className="block text-xs mb-1 text-gray-500 dark:text-gray-400">
                        {field}
                      </label>
                      <input
                        className="w-full rounded-md border border-gray-300 dark:border-gray-700 px-3 py-2 bg-transparent"
                        value={item.values[field] ?? ""}
                        onChange={(e) =>
                          updateField(item.tag_id, field, e.target.value)
                        }
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <FloatingTabs active="products" />
    </main>
  );
}
