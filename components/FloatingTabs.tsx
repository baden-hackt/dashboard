import Link from "next/link";

type TabKey = "dashboard" | "products";

interface FloatingTabsProps {
  active: TabKey;
}

function tabClass(isActive: boolean): string {
  if (isActive) {
    return "px-4 py-2 rounded-full bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900 text-sm font-medium";
  }
  return "px-4 py-2 rounded-full bg-white/90 dark:bg-gray-800/90 text-sm font-medium border border-gray-200 dark:border-gray-700";
}

export default function FloatingTabs({ active }: FloatingTabsProps) {
  return (
    <nav className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50">
      <div className="flex items-center gap-2 rounded-full border border-gray-200 dark:border-gray-700 bg-gray-50/90 dark:bg-gray-900/90 backdrop-blur px-2 py-2 shadow-lg">
        <Link href="/" className={tabClass(active === "dashboard")}>
          Dashboard
        </Link>
        <Link href="/create-products" className={tabClass(active === "products")}>
          Create Products
        </Link>
      </div>
    </nav>
  );
}
