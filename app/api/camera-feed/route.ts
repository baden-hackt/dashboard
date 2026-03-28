import { NextResponse } from "next/server";

function normalizeBaseUrl(url: string): string {
  return url.trim().replace(/\/+$/, "");
}

function getBackendBaseUrl(): URL | null {
  const raw = process.env.NEXT_PUBLIC_BACKEND_BASE_URL || "http://localhost:8000";
  const normalized = normalizeBaseUrl(raw);

  try {
    const url = new URL(normalized);
    if (url.protocol !== "http:" && url.protocol !== "https:") {
      return null;
    }
    return url;
  } catch {
    return null;
  }
}

function getProxyHeaders(): HeadersInit | undefined {
  const base = getBackendBaseUrl();
  if (!base) return undefined;

  const host = base.host;
  if (/\.ngrok(-free)?\.app$|\.ngrok(-free)?\.dev$|\.ngrok\.io$/i.test(host)) {
    return { "ngrok-skip-browser-warning": "true" };
  }
  return undefined;
}

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const base = getBackendBaseUrl();
  if (!base) {
    return NextResponse.json(
      { detail: "Backend URL misconfigured (NEXT_PUBLIC_BACKEND_BASE_URL)." },
      { status: 500 },
    );
  }

  const backendUrl = new URL("/api/camera-feed", base);
  const incoming = new URL(request.url);
  const t = incoming.searchParams.get("t");
  if (t) backendUrl.searchParams.set("t", t);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);

  try {
    const upstream = await fetch(backendUrl.toString(), {
      method: "GET",
      cache: "no-store",
      headers: getProxyHeaders(),
      signal: controller.signal,
    });

    const buffer = await upstream.arrayBuffer();
    const contentType = upstream.headers.get("content-type") || "application/octet-stream";
    const headers = new Headers();
    headers.set("content-type", contentType);
    headers.set("cache-control", "no-cache, no-store, must-revalidate");
    headers.set("pragma", "no-cache");
    headers.set("expires", "0");

    return new Response(buffer, {
      status: upstream.status,
      headers,
    });
  } catch {
    return NextResponse.json({ detail: "Backend offline" }, { status: 503 });
  } finally {
    clearTimeout(timeout);
  }
}
