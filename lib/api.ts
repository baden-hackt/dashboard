const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

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
  const res = await fetch(`${API_URL}/api/fill-levels`, { cache: "no-store" });
  if (!res.ok) return [];
  return res.json();
}

export async function fetchOrders(): Promise<Order[]> {
  const res = await fetch(`${API_URL}/api/orders`, { cache: "no-store" });
  if (!res.ok) return [];
  return res.json();
}

export function getCameraFeedUrl(): string {
  return `${API_URL}/api/camera-feed`;
}
