# STOCKR Dashboard (Next.js) - Vollständige Dokumentation

Dieses Repository enthält ein Dashboard für ein Shelf-Monitoring-Szenario mit Kameraansicht, Füllstandsstatus, Bestellprotokoll und Konfigurationsseite für Produktdaten.

## 1. Ziel und Umfang

Die Anwendung visualisiert in Echtzeit:

- Live-Kamerabild des Regals
- Füllstände je Produkt
- Bestellhistorie
- Backend-Verbindung
- Bearbeitung von produktbezogenen Umgebungswerten

Das Frontend ist mit Next.js (App Router) umgesetzt und nutzt Polling für die Echtzeitnahe Aktualisierung.

## 2. Technologie-Stack

- Framework: Next.js 16
- Sprache: TypeScript
- UI: React 19 + Tailwind CSS 4
- Tests: Vitest
- Laufzeit: Node.js (für API-Route der Kamera explizit konfiguriert)

## 3. Projektstruktur

### Root

- app/: App Router Seiten und API-Routen
- components/: Wiederverwendbare UI-Komponenten
- lib/: API-Client und Hilfslogik
- public/mock/: Mock-Daten für lokalen Betrieb
- tests/: Unit-Tests
- docs/: Spezifikationen und Arbeitsdokumente

### Wichtige Dateien

- app/page.tsx: Haupt-Dashboardseite
- app/create-products/page.tsx: Produktkonfiguration bearbeiten
- app/apriltag-window/page.tsx: Platzhalterseite
- app/api/camera-feed/route.ts: Proxy für Kamerabild
- components/CameraFeed.tsx: Kamerabild-Anzeige + adaptives Polling
- components/ShelfStatus.tsx: Füllstandsanzeige
- components/OrderLog.tsx: Bestelllog
- components/ConnectionStatus.tsx: Health-Check-Anzeige
- lib/api.ts: API-Funktionen und URL-Logik
- next.config.ts: Next.js-Konfiguration

## 4. Architektur und Datenfluss

### 4.1 Dashboard-Rendering

Die Startseite rendert:

1. Kopfbereich mit Logo und Verbindungsstatus
2. Zwei-Spalten-Bereich mit Kamera und Shelf-Status
3. Order-Log
4. Floating Navigation Tabs

### 4.2 JSON-Endpunkte

Für Produkte, Füllstände, Orders und Produkt-Umgebungsdaten werden Fetch-Aufrufe aus lib/api.ts genutzt.

- Basis-URL: NEXT_PUBLIC_BACKEND_BASE_URL
- Alle Fetches setzen cache: "no-store"
- Bei ngrok-Domains wird Header ngrok-skip-browser-warning=true gesetzt
- Fehler werden defensiv behandelt (z. B. leere Arrays statt Crash)

### 4.3 Kamera-Endpunkt

Der Kamerafeed wird nicht via fetch + blob gerendert, sondern direkt als img src geladen:

- Im Frontend als relative URL /api/camera-feed?t=<timestamp>
- Diese Route läuft über Next.js API Route
- Die Route proxyt auf <BACKEND_BASE_URL>/api/camera-feed

Vorteil:

- Browser lädt das Bild nativ
- Cache-Busting über Query-Parameter

## 5. Polling-Verhalten und Last

### 5.1 Intervalle im Dashboard

- CameraFeed: Basis 1000 ms, bei Fehlern Backoff bis 5000 ms
- OrderLog: 500 ms
- ShelfStatus: 1000 ms
- ConnectionStatus: 2000 ms

### 5.2 Effektive Frequenz (pro offenem Tab, steady state)

- Kamera: ca. 1.0 req/s (normal), bis ca. 0.2 req/s bei Backoff
- OrderLog: 2.0 req/s
- ShelfStatus: 1.0 req/s
- ConnectionStatus: 0.5 req/s

Gesamt normal: ca. 4.5 req/s pro Tab

Hinweis: Mehrere offene Tabs multiplizieren die Last.

## 6. Kamera-Proxy im Detail

Die API-Route für den Kamerafeed hat folgende Eigenschaften:

- dynamic = "force-dynamic"
- runtime = "nodejs"
- Timeout für Upstream-Fetch: 8000 ms (AbortController)
- Forwarding des t-Query-Parameters
- Forwarding des Upstream-Statuscodes (auch non-200)
- no-cache Header im Response

### 6.1 Diagnose-Header

Die Route setzt zur Fehleranalyse:

- x-camera-proxy-request-id
- x-camera-proxy-result
	- upstream-ok
	- upstream-non-200
	- proxy-fetch-failure
- x-camera-proxy-duration-ms
- x-camera-proxy-error-kind (nur bei Fehler)
	- timeout-abort
	- fetch-error

### 6.2 Logging

Pro Request werden serverseitig geloggt:

- request id
- upstream URL
- upstream status
- Dauer in ms
- bei Catch: error name + message

Dadurch kann klar unterschieden werden, ob ein 503 vom Proxy-Catch kommt oder vom Upstream durchgereicht wurde.

## 7. Umgebungsvariablen

### 7.1 NEXT_PUBLIC_BACKEND_BASE_URL

- Pflicht für Produktivbetrieb
- Beispiel lokal: http://localhost:8000
- Beispiel mit ngrok: https://<subdomain>.ngrok-free.dev
- Trailing Slashes werden intern normalisiert

Wenn die URL fehlt/ungültig ist, liefert die Kamera-Route einen 500 mit Hinweis auf Fehlkonfiguration.

### 7.2 NEXT_PUBLIC_MOCK_MODE

- true: Frontend nutzt Mock-Daten aus public/mock
- false/fehlend: echte Backend-Endpunkte

Im Mock-Mode zeigt die Kamera eine statische Mock-Grafik statt Live-Feed.

## 8. Caching, Revalidation, Optimization

- Kamera-Proxy nutzt no-cache/no-store Header
- JSON-Fetches nutzen cache: "no-store"
- Keine spezielle next/image Remote-Konfiguration aktiv
- Kamera verwendet img statt next/image
- Keine Middleware im Projekt, die Requests umschreibt

## 9. Unterschiede Kamera vs JSON-Endpunkte

Warum Kamera anders reagieren kann als JSON:

1. Kamera geht über Frontend-Proxyroute
2. JSON kann direkt gegen die Backend-Basis-URL laufen
3. Kamera hat Bild-Transfer (binary) statt JSON-Payload
4. Kamera-Refresh kann bei instabilem Tunnel empfindlicher sein

## 10. Lokales Setup

### 10.1 Voraussetzungen

- Node.js 20+
- npm

### 10.2 Installation

```bash
npm install
```

### 10.3 Entwicklung starten

```bash
npm run dev
```

### 10.4 Tests ausführen

```bash
npm test
```

## 11. Deployment-Hinweise (Vercel + ngrok)

- Bei ngrok-Neustart ändert sich die Domain oft
- Danach muss NEXT_PUBLIC_BACKEND_BASE_URL in Vercel aktualisiert werden
- Nach Env-Änderung neues Deployment auslösen
- Bei intermittierenden Fehlern Diagnose-Header in Browser DevTools prüfen

Empfohlener Check bei 503:

1. Request URL in Network tab prüfen
2. Response Header x-camera-proxy-result auslesen
3. x-camera-proxy-error-kind prüfen
4. Server Logs nach request id durchsuchen
5. Upstream-URL direkt testen

## 12. Fehlerbilder und Troubleshooting

### 12.1 503 Backend offline

Mögliche Ursachen:

- ngrok Tunnel kurzzeitig unterbrochen
- Backend lokal nicht erreichbar
- Timeout > 8 Sekunden
- DNS/Netzwerkprobleme zwischen Vercel und ngrok

Maßnahmen:

- Tunnel stabilisieren
- Polling weiter reduzieren
- Upstream-Antwortzeiten messen

### 12.2 500 Backend URL misconfigured

Mögliche Ursachen:

- NEXT_PUBLIC_BACKEND_BASE_URL fehlt
- Ungültiges URL-Format
- Falsches Protokoll

Maßnahmen:

- Variable in Vercel korrekt setzen
- Redeploy auslösen

## 13. UI-Komponenten im Überblick

- CameraFeed: Bildanzeige + Polling + Backoff
- ShelfStatus: Kartenansicht pro Produkt/Füllstand
- OrderLog: tabellarischer Verlauf mit Statusbadges
- ConnectionStatus: verbindungsampel und Textstatus
- FloatingTabs: Navigation zwischen Hauptseiten

## 14. API-Client Funktionen

In lib/api.ts sind zentral enthalten:

- checkProductsConnection()
- fetchFillLevels()
- fetchOrders()
- fetchProducts()
- fetchProductEnvAll()
- updateProductEnvByTag()
- bulkUpdateProductEnv()
- getCameraFeedUrl()

Designprinzipien:

- Defensives Error-Handling
- Einheitliche Header-Logik
- URL-Normalisierung

## 15. Testabdeckung (aktuell)

Tests prüfen u. a.:

- Base-URL-Normalisierung
- Fehlerpfade für Fetch-Aufrufe
- ngrok Header-Injektion
- korrekten product-env Endpoint-Aufruf

Hinweis: Fuer die Kamera-Proxyroute selbst existieren derzeit keine eigenen Unit-Tests in tests/.

## 16. Empfehlungen für nächste Verbesserungen

1. Tests für app/api/camera-feed/route.ts ergänzen (inkl. Timeout und Header-Assertions)
2. Optional adaptive Backoff-Strategie auch fuer OrderLog/ShelfStatus
3. Optional zentrales Observability-Format (JSON Logs) für Proxy-Routen
4. Optional Health-Endpoint für Kamera-Upstream

## 17. Lizenz / Hinweise

Projektinternes Dashboard. Lizenz und organisatorische Vorgaben bitte mit dem Team abstimmen.

