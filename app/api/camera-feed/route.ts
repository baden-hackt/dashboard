import { NextResponse } from "next/server";

function normalizeBaseUrl(url: string): string {
  return url.trim().replace(/\/+$/, "");
}

function getBackendBaseUrl(): string {
  const raw =
    process.env.NEXT_PUBLIC_BACKEND_BASE_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    "http://localhost:8000";
  return normalizeBaseUrl(raw);
}

function getProxyHeaders(): HeadersInit | undefined {
  const base = getBackendBaseUrl();
  if (/\.ngrok(-free)?\.app$|\.ngrok(-free)?\.dev$|\.ngrok\.io$/i.test(base)) {
    return { "ngrok-skip-browser-warning": "true" };
  }
  return undefined;
}

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const backendUrl = new URL(`${getBackendBaseUrl()}/api/camera-feed`);
  const incoming = new URL(request.url);
  const t = incoming.searchParams.get("t");
  if (t) backendUrl.searchParams.set("t", t);

  try {
    const upstream = await fetch(backendUrl.toString(), {
      method: "GET",
      cache: "no-store",
      headers: getProxyHeaders(),
    });

    const contentType = upstream.headers.get("content-type");
    const headers = new Headers();
    if (contentType) headers.set("content-type", contentType);
    headers.set("cache-control", "no-store");

    return new NextResponse(upstream.body, {
      status: upstream.status,
      headers,
    });
  } catch {
    return NextResponse.json({ detail: "Backend offline" }, { status: 503 });
  }
}
