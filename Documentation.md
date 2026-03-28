# STOCKR Dashboard - Technische Dokumentation

## 1) Überblick

Dieses Projekt ist ein Frontend-Dashboard auf Basis von Next.js 16 (App Router) zur Überwachung des Regalzustands und zur Verwaltung der Produktkonfiguration über Backend-APIs.

Hauptfunktionen:
- Live-Kamerafeed (über lokale Next-Proxy-Route)
- Regalstatus-Karten mit Fill-Level-Polling
- Order-Log mit schneller Statusaktualisierung
- Produktkonfigurations-Editor auf Basis von `/api/product-env`
- Schwebende Tab-Navigation zwischen Seiten

Technologie-Stack:
- Next.js 16.2.1
- React 19
- TypeScript
- Tailwind CSS v4

## 2) Projektstruktur

- `app/page.tsx`: Haupt-Dashboard-Seite
- `app/create-products/page.tsx`: Seite für Produktkonfiguration
- `app/apriltag-window/page.tsx`: Platzhalter-Seite
- `app/api/camera-feed/route.ts`: Serverseitige Kamera-Proxy-Route
- `components/CameraFeed.tsx`: Kamerabild-Polling-Komponente
- `components/ShelfStatus.tsx`: Fill-Level-Karten und Sortierung
- `components/OrderLog.tsx`: Bestellstatus-Tabelle
- `components/ConnectionStatus.tsx`: Backend-Health-Indikator
- `components/FloatingTabs.tsx`: Schwebende Navigation
- `lib/api.ts`: API-Client und Typdefinitionen
- `lib/shelfOrder.ts`: Sortierlogik für Regal-Positionen
- `tests/*.test.ts`: Unit-Tests

## 3) Environment-Konfiguration

Aktive Variablen:
- `NEXT_PUBLIC_BACKEND_BASE_URL`
- `NEXT_PUBLIC_MOCK_MODE`

Dateien:
- `.env.local` für lokale Entwicklung
- `.env.production` für Produktionslaufzeit
- `prod.environment.config` als Referenz für Production-Konfiguration

Beispiel:
```env
NEXT_PUBLIC_BACKEND_BASE_URL=https://unpackaged-viola-wonky.ngrok-free.dev
NEXT_PUBLIC_MOCK_MODE=false
```

Hinweise:
- Die Backend-Base-URL wird normalisiert (keine doppelten/trailing Slashes).
- Für ngrok-Domains wird automatisch `ngrok-skip-browser-warning: true` gesetzt.

## 4) Runtime-Routen

Applikationsrouten:
- `/` Dashboard
- `/create-products` Produkteditor
- `/apriltag-window` Platzhalter

Interne API-Route:
- `GET /api/camera-feed`
  - Proxyt `${NEXT_PUBLIC_BACKEND_BASE_URL}/api/camera-feed`
  - Reicht Upstream-Status/Body/Content-Type durch
  - Nutzt no-store/no-cache Header

## 5) Backend-Integration

Genutzte Backend-Endpunkte:
- `GET /api/products`
- `GET /api/fill-levels`
- `GET /api/orders`
- `GET /api/camera-feed`
- `GET /api/product-env`
- `PUT /api/product-env/{tag_id}`
- `PUT /api/product-env`

Der API-Client ist in `lib/api.ts` mit strikter Typisierung implementiert.

## 6) Polling-Verhalten

Aktuelle Refresh-Intervalle:
- Kamerafeed: alle `500ms`
- Shelf Fill Levels: alle `1000ms`
- Order-Log: alle `500ms`
- Connection-Check: alle `2000ms`

Zusätzlich aktualisiert sich das Order-Log sofort bei Tab-Fokus/Tab-Sichtbarkeit.

## 7) Sortierregel für Shelf-Status

`ShelfStatus` erzwingt eine deterministische Reihenfolge nach Product-ID-Suffix:
- `...001` immer zuerst (links),
- danach `...002`, `...003`, usw.

Implementiert in `lib/shelfOrder.ts`.

## 8) Verhalten des Produkteditors

`/create-products` lädt Produktkonfigurationsdaten (Tag IDs `0` und `1`) aus dem Backend, erlaubt das Bearbeiten unterstützter Felder und speichert über:
- Einzelprodukt-Speicherung (`PUT /api/product-env/{tag_id}`)
- Sammelspeicherung (`PUT /api/product-env`)

Bearbeitbare Felder:
- `TAG_ID`
- `ID`
- `NAME`
- `SUPPLIER_NAME`
- `SUPPLIER_EMAIL`
- `THRESHOLD`
- `REORDER_THRESHOLD`
- `REORDER_QTY`
- `REORDER_QUANTITY`
- `UNIT`

## 9) Tests

Die Unit-Tests sind mit Vitest implementiert:
- `tests/api.test.ts`
- `tests/shelfOrder.test.ts`

Abgedeckte Bereiche:
- API-Fallback-Verhalten und Endpoint-Bildung
- ngrok-Header-Verhalten
- Shelf-Sortierlogik

## 10) Entwicklungsbefehle

Dependencies installieren:
```bash
npm install
```

Dev-Server starten:
```bash
npm run dev
```

Typecheck ausführen:
```bash
npx tsc --noEmit
```

Tests ausführen:
```bash
npm run test
```

Tests im Watch-Modus:
```bash
npm run test:watch
```

Production-Build:
```bash
npm run build
```
