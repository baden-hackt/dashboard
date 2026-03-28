"use client";

import { useState, useEffect } from "react";
import { getCameraFeedUrl } from "@/lib/api";

const BASE_POLL_INTERVAL_MS = 1000;
const MAX_POLL_INTERVAL_MS = 5000;

export default function CameraFeed() {
  const [timestamp, setTimestamp] = useState(() => Date.now());
  const [pollIntervalMs, setPollIntervalMs] = useState(BASE_POLL_INTERVAL_MS);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimestamp(Date.now());
    }, pollIntervalMs);
    return () => clearInterval(interval);
  }, [pollIntervalMs]);

  return (
    <div>
      <h2 className="text-lg font-semibold mb-2">Live camera feed</h2>
      <img
        src={`${getCameraFeedUrl()}?t=${timestamp}`}
        alt="Shelf camera feed"
        className="w-full rounded-lg border border-gray-200 dark:border-gray-700"
        onError={(e) => {
          (e.target as HTMLImageElement).style.opacity = "0.3";
          setPollIntervalMs((prev) => Math.min(MAX_POLL_INTERVAL_MS, prev * 2));
        }}
        onLoad={(e) => {
          (e.target as HTMLImageElement).style.opacity = "1";
          setPollIntervalMs((prev) =>
            prev === BASE_POLL_INTERVAL_MS ? prev : BASE_POLL_INTERVAL_MS,
          );
        }}
      />
    </div>
  );
}
