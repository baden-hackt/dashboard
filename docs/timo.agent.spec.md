# AGENT INSTRUCTIONS — Dashboard

You are building a live monitoring dashboard for a hackathon project. Follow every instruction exactly. Do not deviate, improvise, or add features not listed here.

---

## OBJECTIVE

Build a Next.js web application that:
1. Shows a live camera feed from the shelf (refreshing every 2 seconds)
2. Displays fill-level status per product slot (green/yellow/red)
3. Shows an order log of all triggered reorders
4. Polls a backend API running on a separate machine over the local network

The dashboard is deployed to **Vercel**. It is a separate repo from the backend. It has zero backend logic — it is a pure frontend that polls a FastAPI server.

---

## PROJECT STRUCTURE

Create a standard Next.js app. Use the App Router (`app/` directory). Use TypeScript.

```
dashboard/
├── app/
│   ├── layout.tsx
│   ├── page.tsx
│   └── globals.css
├── components/
│   ├── CameraFeed.tsx
│   ├── ShelfStatus.tsx
│   ├── OrderLog.tsx
│   └── ConnectionStatus.tsx
├── lib/
│   └── api.ts
├── next.config.ts
├── package.json
├── tailwind.config.ts
├── tsconfig.json
└── .env.local
```

Do not create any other files. Do not create a README. Do not create tests. Do not create API routes in `app/api/`.

---

## SETUP

Initialize the project with:

```bash
npx create-next-app@latest dashboard --typescript --tailwind --eslint --app --src-dir=false --import-alias="@/*"
```

No additional dependencies needed. Next.js + Tailwind is enough.

---

## FILE: .env.local

```
NEXT_PUBLIC_API_URL=http://localhost:8000
```

This is the URL of Person 2's FastAPI server. During development it's `localhost:8000`. At the hackathon demo it will be the laptop's local IP, e.g. `http://192.168.1.42:8000`. The team will update this before the demo.

The variable MUST be prefixed with `NEXT_PUBLIC_` so it's accessible in client-side code.

---

## FILE: lib/api.ts

This module handles all API calls to Person 2's FastAPI backend.

```typescript
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
```

### API rules

- All fetch calls use `cache: "no-store"` to prevent Next.js from caching responses.
- If a fetch fails (network error, backend down), return an empty array. Do not crash. Do not show an error page.
- The camera feed is NOT fetched via `fetch()` — it's loaded as an `<img>` src URL with a cache-busting query parameter.

---

## FILE: components/CameraFeed.tsx

Displays the live camera feed from the shelf.

```tsx
"use client";

import { useState, useEffect } from "react";
import { getCameraFeedUrl } from "@/lib/api";

export default function CameraFeed() {
  const [timestamp, setTimestamp] = useState(Date.now());

  useEffect(() => {
    const interval = setInterval(() => {
      setTimestamp(Date.now());
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div>
      <h2 className="text-lg font-semibold mb-2">Live camera feed</h2>
      <img
        src={`${getCameraFeedUrl()}?t=${timestamp}`}
        alt="Shelf camera feed"
        className="w-full rounded-lg border border-gray-200 dark:border-gray-700"
        onError={(e) => {
          (e.target as HTMLImageElement).style.opacity = "0.3";
        }}
        onLoad={(e) => {
          (e.target as HTMLImageElement).style.opacity = "1";
        }}
      />
    </div>
  );
}
```

### How it works

- Renders an `<img>` tag pointing at `/api/camera-feed`.
- Every 2 seconds, updates the `timestamp` state which appends `?t=<ms>` to the URL, forcing the browser to re-fetch the image.
- On error (backend down, no frame yet), dims the image to 30% opacity. On successful load, restores to full opacity.
- Do NOT use `fetch()` + blob URL for the camera feed. The `<img>` tag approach is simpler and handles streaming natively.

---

## FILE: components/ShelfStatus.tsx

Displays fill levels for each product slot as color-coded cards.

```tsx
"use client";

import { useState, useEffect } from "react";
import { fetchFillLevels, FillLevel } from "@/lib/api";

export default function ShelfStatus() {
  const [levels, setLevels] = useState<FillLevel[]>([]);

  useEffect(() => {
    const load = async () => {
      const data = await fetchFillLevels();
      setLevels(data);
    };
    load();
    const interval = setInterval(load, 5000);
    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "ok":
        return "bg-green-100 border-green-400 dark:bg-green-900/30 dark:border-green-600";
      case "low":
        return "bg-amber-100 border-amber-400 dark:bg-amber-900/30 dark:border-amber-600";
      case "critical":
        return "bg-red-100 border-red-400 dark:bg-red-900/30 dark:border-red-600";
      default:
        return "bg-gray-100 border-gray-300 dark:bg-gray-800 dark:border-gray-600";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "ok":
        return "In stock";
      case "low":
        return "Low — reorder triggered";
      case "critical":
        return "Critical — almost empty";
      default:
        return "Unknown";
    }
  };

  const getFillBarColor = (status: string) => {
    switch (status) {
      case "ok":
        return "bg-green-500";
      case "low":
        return "bg-amber-500";
      case "critical":
        return "bg-red-500";
      default:
        return "bg-gray-400";
    }
  };

  if (levels.length === 0) {
    return (
      <div>
        <h2 className="text-lg font-semibold mb-2">Shelf status</h2>
        <p className="text-gray-500 dark:text-gray-400">Waiting for data...</p>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-lg font-semibold mb-3">Shelf status</h2>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {levels.map((level) => (
          <div
            key={level.tag_id}
            className={`rounded-lg border-2 p-3 ${getStatusColor(level.status)}`}
          >
            <div className="flex justify-between items-start mb-1">
              <span className="font-medium text-sm">{level.product_name}</span>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                #{level.product_id}
              </span>
            </div>
            <div className="text-2xl font-bold mb-1">{level.fill_level}%</div>
            <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full mb-2">
              <div
                className={`h-full rounded-full transition-all duration-500 ${getFillBarColor(level.status)}`}
                style={{ width: `${level.fill_level}%` }}
              />
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">
              {getStatusLabel(level.status)}
            </div>
            <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">
              {level.supplier_name}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

### Card layout

- Grid: 2 columns on mobile, 3 on desktop.
- Each card shows: product name, product ID, fill level %, a fill bar, status label, supplier name.
- Color-coded borders and backgrounds: green = ok, amber = low, red = critical.
- Fill bar animates width changes with `transition-all duration-500`.
- If no data yet, show "Waiting for data..." text.

---

## FILE: components/OrderLog.tsx

Displays the order history table.

```tsx
"use client";

import { useState, useEffect } from "react";
import { fetchOrders, Order } from "@/lib/api";

export default function OrderLog() {
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    const load = async () => {
      const data = await fetchOrders();
      setOrders(data);
    };
    load();
    const interval = setInterval(load, 10000);
    return () => clearInterval(interval);
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return (
          <span className="px-2 py-0.5 text-xs rounded-full bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
            Pending
          </span>
        );
      case "delivered":
        return (
          <span className="px-2 py-0.5 text-xs rounded-full bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300">
            Delivered
          </span>
        );
      case "cancelled":
        return (
          <span className="px-2 py-0.5 text-xs rounded-full bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400">
            Cancelled
          </span>
        );
      default:
        return null;
    }
  };

  const formatTime = (iso: string) => {
    const date = new Date(iso);
    return date.toLocaleTimeString("de-CH", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  if (orders.length === 0) {
    return (
      <div>
        <h2 className="text-lg font-semibold mb-2">Order log</h2>
        <p className="text-gray-500 dark:text-gray-400">No orders yet.</p>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-lg font-semibold mb-3">Order log</h2>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-700 text-left text-gray-500 dark:text-gray-400">
              <th className="pb-2 font-medium">Time</th>
              <th className="pb-2 font-medium">Product</th>
              <th className="pb-2 font-medium">Supplier</th>
              <th className="pb-2 font-medium">Qty</th>
              <th className="pb-2 font-medium">Status</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr
                key={order.id}
                className="border-b border-gray-100 dark:border-gray-800"
              >
                <td className="py-2 text-gray-600 dark:text-gray-400">
                  {formatTime(order.created_at)}
                </td>
                <td className="py-2">
                  <div className="font-medium">{order.product_name}</div>
                  <div className="text-xs text-gray-400">{order.product_id}</div>
                </td>
                <td className="py-2 text-gray-600 dark:text-gray-400">
                  {order.supplier_name}
                </td>
                <td className="py-2">
                  {order.quantity} {order.unit}
                </td>
                <td className="py-2">{getStatusBadge(order.status)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
```

### Table layout

- Columns: Time, Product (name + ID), Supplier, Qty, Status badge.
- Time is formatted in Swiss German locale (`de-CH`), showing `HH:MM:SS`.
- Status badges: amber for pending, green for delivered, gray for cancelled.
- Newest orders appear first (the API returns them sorted by `created_at DESC`).
- If no orders, show "No orders yet." text.

---

## FILE: components/ConnectionStatus.tsx

Shows whether the backend API is reachable.

```tsx
"use client";

import { useState, useEffect } from "react";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function ConnectionStatus() {
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const check = async () => {
      try {
        const res = await fetch(`${API_URL}/api/products`, { cache: "no-store" });
        setConnected(res.ok);
      } catch {
        setConnected(false);
      }
    };
    check();
    const interval = setInterval(check, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex items-center gap-2 text-sm">
      <div
        className={`w-2 h-2 rounded-full ${
          connected ? "bg-green-500" : "bg-red-500"
        }`}
      />
      <span className="text-gray-500 dark:text-gray-400">
        {connected ? `Connected to ${API_URL}` : "Backend offline"}
      </span>
    </div>
  );
}
```

### How it works

- Pings `/api/products` every 10 seconds (lightweight endpoint).
- Shows a green dot + URL if connected, red dot + "Backend offline" if not.
- This helps during demo setup — Timo can immediately see if the API URL is correct.

---

## FILE: app/globals.css

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

No custom CSS. Tailwind handles everything.

---

## FILE: app/layout.tsx

```tsx
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Lagersystem Dashboard",
  description: "KI-gestütztes Lagerüberwachungssystem",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="de">
      <body className="bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 min-h-screen">
        {children}
      </body>
    </html>
  );
}
```

---

## FILE: app/page.tsx

This is the main dashboard page. It composes all components.

```tsx
import CameraFeed from "@/components/CameraFeed";
import ShelfStatus from "@/components/ShelfStatus";
import OrderLog from "@/components/OrderLog";
import ConnectionStatus from "@/components/ConnectionStatus";

export default function Home() {
  return (
    <main className="max-w-6xl mx-auto px-4 py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Lagersystem Dashboard</h1>
        <ConnectionStatus />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <CameraFeed />
        <ShelfStatus />
      </div>

      <OrderLog />
    </main>
  );
}
```

### Page layout

- Header: title on the left, connection status on the right.
- Two-column grid on desktop: camera feed on the left, shelf status cards on the right.
- Single column on mobile: camera feed stacked above shelf status.
- Order log table spans full width below.
- Max width `6xl` (1152px), centered, with padding.

---

## POLLING INTERVALS

| Data | Interval | Reason |
|---|---|---|
| Camera feed | 2 seconds | Matches Person 1's 5s scan cycle — fast enough to feel "live" |
| Fill levels | 5 seconds | Matches Person 1's scan interval exactly |
| Orders | 10 seconds | Orders don't change often — no need to poll fast |
| Connection check | 10 seconds | Just a health indicator |

---

## DEPLOYMENT

### Deploy to Vercel

```bash
cd dashboard
npx vercel
```

Or connect the GitHub repo to Vercel and it auto-deploys on push.

### Environment variable on Vercel

Set `NEXT_PUBLIC_API_URL` in the Vercel dashboard under project settings → Environment Variables. Set it to the laptop's local network IP:

```
NEXT_PUBLIC_API_URL=http://192.168.1.42:8000
```

**Important:** This only works if Vercel and the laptop are on the same network (e.g. hackathon Wi-Fi). The Vercel-deployed site runs in the browser, so the browser makes requests directly to the laptop's IP. The laptop must be reachable from the browser's network.

**Alternative for demo:** If network issues arise, run the dashboard locally instead:

```bash
cd dashboard
npm run dev
```

This runs on `http://localhost:3000` and connects to `http://localhost:8000` (Person 2's API on the same machine). This is the fallback plan.

---

## BACKEND API REFERENCE

The dashboard connects to Person 2's FastAPI server. These are the endpoints:

### GET /api/camera-feed

Returns the latest annotated camera frame as `image/jpeg`. Used as an `<img>` src, not fetched via `fetch()`.

### GET /api/fill-levels

Returns JSON array:
```json
[
  {
    "tag_id": 0,
    "fill_level": 25,
    "timestamp": "2026-05-16T14:30:00",
    "product_id": "MAT-001",
    "product_name": "Schrauben M8x30",
    "supplier_name": "Würth AG",
    "reorder_threshold": 20,
    "status": "low"
  }
]
```

Status values: `"ok"` (fill > threshold), `"low"` (fill <= threshold), `"critical"` (fill <= 5%).

### GET /api/orders

Returns JSON array:
```json
[
  {
    "id": 1,
    "tag_id": 2,
    "product_id": "MAT-003",
    "product_name": "Kabelbinder 200mm",
    "supplier_name": "Distrelec AG",
    "supplier_email": "orders@distrelec-demo.ch",
    "quantity": 200,
    "unit": "Stück",
    "status": "pending",
    "created_at": "2026-05-16T14:35:00",
    "csv_filename": "PO_MAT-003_20260516_143500.csv"
  }
]
```

Sorted by `created_at` descending (newest first).

### GET /api/products

Returns JSON array of product master data. Used by `ConnectionStatus` to check if the backend is alive.

---

## WHAT THIS APPLICATION DOES NOT DO

Do not implement any of the following. They are handled by other people.

- Camera capture or image processing (Person 1)
- AprilTag detection or AI fill-level estimation (Person 1)
- Order logic, CSV generation, email sending (Person 2)
- Backend API endpoints (Person 2)
- Database reads or writes of any kind (this app has NO database)

---

## CONSTRAINTS

- Do not create API routes in `app/api/`. This is a pure frontend.
- Do not use any state management library (Redux, Zustand, etc.). React `useState` is enough.
- Do not use any UI component library (shadcn, MUI, Chakra, etc.). Tailwind only.
- Do not use WebSockets or Server-Sent Events. Polling only.
- Do not add authentication.
- Do not add service workers or PWA features.
- Do not add internationalization (i18n). All text is hardcoded in English.
- Do not add unit tests.
- Do not add analytics or tracking.
- Do not use any libraries not included with `create-next-app`.

---

## PHYSICAL DEMO SETUP (Person 3 also handles this)

In addition to the dashboard, Person 3 (Timo) is responsible for the physical demo setup at the hackathon:

1. **Print AprilTags** — Download tag36h11 family images from https://github.com/AprilRobotics/apriltag-imgs/tree/master/tag36h11. Print tags 0 through 5 at minimum 6cm x 6cm on white paper. Laser printer preferred.

2. **Set up the shelf** — Any small shelf or rack with 6 visible compartments. Each compartment gets one AprilTag taped to the bottom-front edge.

3. **Fill the shelf** — Put small items in each compartment (boxes, bags, bottles, whatever is available). These are the "products" that will be monitored.

4. **Position the camera** — Laptop webcam or USB webcam on a small tripod, aimed directly at the shelf from the front. Distance: close enough that each AprilTag is at least 80x80 pixels in the frame. Test with Person 1's pipeline to verify detection works.

5. **Test the full flow** — Remove an item from the shelf. Wait 5–10 seconds. Verify: camera detects change → AI estimates fill level → backend triggers reorder → dashboard updates → email sent.
