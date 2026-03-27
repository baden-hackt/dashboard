"use client";

import { useState, useEffect } from "react";
import { MOCK_MODE } from "@/lib/api";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const PRODUCTS_URL = MOCK_MODE ? "/mock/products.json" : `${API_URL}/api/products`;

export default function ConnectionStatus() {
  const [connected, setConnected] = useState(MOCK_MODE);

  useEffect(() => {
    const check = async () => {
      try {
        const res = await fetch(PRODUCTS_URL, { cache: "no-store" });
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
        {MOCK_MODE
          ? "Mock mode enabled (API disabled)"
          : connected
            ? `Connected to ${API_URL}`
            : "Backend offline"}
      </span>
    </div>
  );
}
