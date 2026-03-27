const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
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

export async function fetchFillLevels(): Promise<FillLevel[]> {
  const url = MOCK_MODE ? `${MOCK_BASE}/fill-levels.json` : `${API_URL}/api/fill-levels`;
  try {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

export async function fetchOrders(): Promise<Order[]> {
  const url = MOCK_MODE ? `${MOCK_BASE}/orders.json` : `${API_URL}/api/orders`;
  try {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

export function getCameraFeedUrl(): string {
  if (MOCK_MODE) return "/mock-camera.svg";
  return `${API_URL}/api/camera-feed`;
}
