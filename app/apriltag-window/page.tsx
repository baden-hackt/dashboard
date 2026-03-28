import FloatingTabs from "@/components/FloatingTabs";

export default function ApriltagWindowPage() {
  return (
    <main className="max-w-4xl mx-auto px-4 py-6 pb-24">
      <h1 className="text-2xl font-bold mb-2">Apriltag Detection Window</h1>
      <p className="text-gray-500 dark:text-gray-400 mb-6">
        Placeholder page for configuring detection window dimensions.
      </p>

      <section className="rounded-lg border border-gray-200 dark:border-gray-700 p-5 bg-white dark:bg-gray-900">
        <h2 className="text-lg font-semibold mb-4">Window Parameters</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm mb-1">X Offset</label>
            <input
              className="w-full rounded-md border border-gray-300 dark:border-gray-700 px-3 py-2 bg-transparent"
              placeholder="0"
              disabled
            />
          </div>
          <div>
            <label className="block text-sm mb-1">Y Offset</label>
            <input
              className="w-full rounded-md border border-gray-300 dark:border-gray-700 px-3 py-2 bg-transparent"
              placeholder="0"
              disabled
            />
          </div>
          <div>
            <label className="block text-sm mb-1">Width</label>
            <input
              className="w-full rounded-md border border-gray-300 dark:border-gray-700 px-3 py-2 bg-transparent"
              placeholder="640"
              disabled
            />
          </div>
          <div>
            <label className="block text-sm mb-1">Height</label>
            <input
              className="w-full rounded-md border border-gray-300 dark:border-gray-700 px-3 py-2 bg-transparent"
              placeholder="480"
              disabled
            />
          </div>
        </div>
        <button
          className="mt-5 px-4 py-2 rounded-md bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900 opacity-70 cursor-not-allowed"
          disabled
        >
          Apply Changes (Coming Soon)
        </button>
      </section>

      <FloatingTabs active="apriltag" />
    </main>
  );
}
