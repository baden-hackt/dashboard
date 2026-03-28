import CameraFeed from "@/components/CameraFeed";
import ShelfStatus from "@/components/ShelfStatus";
import OrderLog from "@/components/OrderLog";
import ConnectionStatus from "@/components/ConnectionStatus";
import FloatingTabs from "@/components/FloatingTabs";
import Image from "next/image";

export default function Home() {
  return (
    <main className="max-w-6xl mx-auto px-4 py-6 pb-24">
      <div className="flex justify-between items-center mb-4">
        <Image
          src="/stockr-logo.png"
          alt="STOCKR"
          width={780}
          height={222}
          priority
          className="h-16 md:h-24 w-auto"
        />
        <ConnectionStatus />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <CameraFeed />
        <ShelfStatus />
      </div>

      <OrderLog />
      <FloatingTabs active="dashboard" />
    </main>
  );
}
