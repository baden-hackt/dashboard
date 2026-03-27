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
