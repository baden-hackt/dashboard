"use client";

import { useEffect, useMemo, useState } from "react";
import { fetchFillLevels, FillLevel } from "@/lib/api";
import { sortFillLevelsByProductId } from "@/lib/shelfOrder";

export default function ShelfStatus() {
  const [levels, setLevels] = useState<FillLevel[]>([]);

  useEffect(() => {
    let inFlight = false;

    const load = async () => {
      if (inFlight) return;
      inFlight = true;
      try {
        const data = await fetchFillLevels();
        setLevels((prev) => (data.length > 0 ? data : prev));
      } finally {
        inFlight = false;
      }
    };
    load();
    const interval = setInterval(load, 1000);
    return () => clearInterval(interval);
  }, []);

  const sortedLevels = useMemo(() => {
    return sortFillLevelsByProductId(levels);
  }, [levels]);

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
        return "Low - reorder triggered";
      case "critical":
        return "Critical - almost empty";
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

  if (sortedLevels.length === 0) {
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
        {sortedLevels.map((level) => (
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
