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
