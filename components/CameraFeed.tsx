"use client";

import { useState, useEffect } from "react";
import { getCameraFeedUrl } from "@/lib/api";

export default function CameraFeed() {
  const [timestamp, setTimestamp] = useState(0);

  useEffect(() => {
    setTimestamp(Date.now());
    const interval = setInterval(() => {
      setTimestamp(Date.now());
    }, 500);
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
