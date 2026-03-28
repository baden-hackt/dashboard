"use client";

import { useState, useEffect } from "react";
import {
  MOCK_MODE,
  checkProductsConnection,
  logBackendBaseUrlOnce,
} from "@/lib/api";

export default function ConnectionStatus() {
  const [connected, setConnected] = useState(MOCK_MODE);

  useEffect(() => {
    let inFlight = false;
    logBackendBaseUrlOnce();

    const check = async () => {
      if (inFlight) return;
      inFlight = true;
      try {
        setConnected(await checkProductsConnection());
      } catch {
        setConnected(false);
      } finally {
        inFlight = false;
      }
    };
    check();
    const interval = setInterval(check, 2000);
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
            ? "Connected to DB"
            : "Backend offline"}
      </span>
    </div>
  );
}
