import { afterEach, describe, expect, it, vi } from "vitest";

const ORIGINAL_ENV = { ...process.env };

async function importApi() {
  vi.resetModules();
  return import("@/lib/api");
}

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
  vi.restoreAllMocks();
});

describe("api client", () => {
  it("normalizes backend base url by trimming trailing slashes", async () => {
    process.env.NEXT_PUBLIC_BACKEND_BASE_URL = "https://example.com///";
    const api = await importApi();
    expect(api.BACKEND_BASE_URL).toBe("https://example.com");
  });

  it("returns empty array for fill levels when fetch throws", async () => {
    process.env.NEXT_PUBLIC_BACKEND_BASE_URL = "https://example.com";
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network down")));

    const api = await importApi();
    await expect(api.fetchFillLevels()).resolves.toEqual([]);
  });

  it("returns empty array for orders on non-ok response", async () => {
    process.env.NEXT_PUBLIC_BACKEND_BASE_URL = "https://example.com";
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response("{}", { status: 500 })),
    );

    const api = await importApi();
    await expect(api.fetchOrders()).resolves.toEqual([]);
  });

  it("adds ngrok bypass header for ngrok base url", async () => {
    process.env.NEXT_PUBLIC_BACKEND_BASE_URL = "https://abc.ngrok-free.dev";
    const fetchMock = vi
      .fn()
      .mockResolvedValue(new Response("[]", { status: 200, headers: { "content-type": "application/json" } }));
    vi.stubGlobal("fetch", fetchMock);

    const api = await importApi();
    await api.fetchFillLevels();

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    const headers = init.headers as Record<string, string>;
    expect(headers["ngrok-skip-browser-warning"]).toBe("true");
  });

  it("calls product-env endpoint for config fetch", async () => {
    process.env.NEXT_PUBLIC_BACKEND_BASE_URL = "https://example.com";
    const fetchMock = vi
      .fn()
      .mockResolvedValue(new Response("[]", { status: 200, headers: { "content-type": "application/json" } }));
    vi.stubGlobal("fetch", fetchMock);

    const api = await importApi();
    await api.fetchProductEnvAll();

    const [url] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://example.com/api/product-env");
  });
});
