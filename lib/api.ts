const RAW_BASE_URL =
  process.env.NEXT_PUBLIC_BACKEND_BASE_URL || "http://localhost:8000";

function normalizeBaseUrl(url: string): string {
  return url.trim().replace(/\/+$/, "");
}

export const BACKEND_BASE_URL = normalizeBaseUrl(RAW_BASE_URL);
export const MOCK_MODE = process.env.NEXT_PUBLIC_MOCK_MODE === "true";
const MOCK_BASE = "/mock";

export interface FillLevel {
  tag_id: number;
  fill_level: number;
  timestamp: string;
  product_id: string;
  product_name: string;
  supplier_name: string;
  reorder_threshold: number;
  status: "ok" | "low" | "critical";
}

export interface Order {
  id: number;
  tag_id: number;
  product_id: string;
  product_name: string;
  supplier_name: string;
  supplier_email: string;
  quantity: number;
  unit: string;
  status: "pending" | "delivered" | "cancelled";
  created_at: string;
  csv_filename: string;
}

export interface Product {
  product_id: string;
  product_name: string;
  supplier_name: string;
  supplier_email: string;
  reorder_threshold: number;
}

export interface ProductEnvProduct {
  tag_id: number;
  product_id: string;
  product_name: string;
  supplier_name: string;
  supplier_email: string;
  reorder_threshold: number;
  reorder_quantity: number;
  unit: string;
}

export interface ProductEnvItem {
  tag_id: number;
  values: Record<string, string>;
  product: ProductEnvProduct;
}

let hasLoggedBaseUrl = false;

export function logBackendBaseUrlOnce(): void {
  if (hasLoggedBaseUrl || typeof window === "undefined") return;
  hasLoggedBaseUrl = true;
  console.info(
    `[dashboard] backend base URL: ${BACKEND_BASE_URL} (mock mode: ${MOCK_MODE})`,
  );
  if (!MOCK_MODE && /^wss?:\/\//i.test(BACKEND_BASE_URL)) {
    console.error("[dashboard] invalid backend protocol: use http:// or https://");
  }
}

function endpoint(path: string): string {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${BACKEND_BASE_URL}${normalizedPath}`;
}

function getRequestHeaders(): HeadersInit | undefined {
  if (/\.ngrok(-free)?\.app$|\.ngrok(-free)?\.dev$|\.ngrok\.io$/i.test(BACKEND_BASE_URL)) {
    return { "ngrok-skip-browser-warning": "true" };
  }
  return undefined;
}

async function fetchJson<T>(url: string): Promise<T | null> {
  try {
    const res = await fetch(url, {
      method: "GET",
      cache: "no-store",
      headers: getRequestHeaders(),
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

async function sendJson<T>(
  url: string,
  method: "PUT" | "POST",
  body: unknown,
): Promise<T | null> {
  try {
    const headers: HeadersInit = {
      "content-type": "application/json",
      ...(getRequestHeaders() || {}),
    };
    const res = await fetch(url, {
      method,
      cache: "no-store",
      headers,
      body: JSON.stringify(body),
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

export async function checkProductsConnection(): Promise<boolean> {
  try {
    const res = await fetch(getProductsUrl(), {
      method: "GET",
      cache: "no-store",
      headers: getRequestHeaders(),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export function getProductsUrl(): string {
  return MOCK_MODE ? `${MOCK_BASE}/products.json` : endpoint("/api/products");
}

export async function fetchFillLevels(): Promise<FillLevel[]> {
  const url = MOCK_MODE
    ? `${MOCK_BASE}/fill-levels.json`
    : endpoint("/api/fill-levels");
  const data = await fetchJson<FillLevel[]>(url);
  return data ?? [];
}

export async function fetchOrders(): Promise<Order[]> {
  const url = MOCK_MODE ? `${MOCK_BASE}/orders.json` : endpoint("/api/orders");
  const data = await fetchJson<Order[]>(url);
  return data ?? [];
}

function mapProduct(raw: Record<string, unknown>): Product | null {
  const productId =
    (typeof raw.product_id === "string" && raw.product_id) ||
    (typeof raw.id === "string" && raw.id) ||
    "";
  const productName =
    (typeof raw.product_name === "string" && raw.product_name) ||
    (typeof raw.name === "string" && raw.name) ||
    "";

  if (!productId || !productName) return null;

  return {
    product_id: productId,
    product_name: productName,
    supplier_name:
      (typeof raw.supplier_name === "string" && raw.supplier_name) || "",
    supplier_email:
      (typeof raw.supplier_email === "string" && raw.supplier_email) || "",
    reorder_threshold:
      typeof raw.reorder_threshold === "number" ? raw.reorder_threshold : 20,
  };
}

export async function fetchProducts(): Promise<Product[]> {
  const data = await fetchJson<unknown[]>(getProductsUrl());
  if (!Array.isArray(data)) return [];
  return data
    .filter((item): item is Record<string, unknown> => typeof item === "object" && item !== null)
    .map(mapProduct)
    .filter((item): item is Product => item !== null);
}

export async function fetchProductEnvAll(): Promise<ProductEnvItem[]> {
  const data = await fetchJson<ProductEnvItem[]>(endpoint("/api/product-env"));
  if (!Array.isArray(data)) return [];
  return data;
}

export async function updateProductEnvByTag(
  tagId: number,
  values: Record<string, string | number>,
): Promise<ProductEnvItem | null> {
  return sendJson<ProductEnvItem>(endpoint(`/api/product-env/${tagId}`), "PUT", {
    values,
  });
}

export async function bulkUpdateProductEnv(
  updates: Record<string, Record<string, string | number>>,
): Promise<boolean> {
  const data = await sendJson<Record<string, unknown>>(
    endpoint("/api/product-env"),
    "PUT",
    updates,
  );
  return data !== null;
}

export function getCameraFeedUrl(): string {
  if (MOCK_MODE) return "/mock-camera.svg";
  return "/api/camera-feed";
}
