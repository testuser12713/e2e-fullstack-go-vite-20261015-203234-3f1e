# Leseliste

Eine Web-App für die persönliche Leseliste: Bücher mit Titel und Autor erfassen, einen Status setzen (geplant, lese gerade, gelesen), mit 1–5 Sternen bewerten, nach Status filtern, nach Titel/Autor suchen und eine Statistik der in diesem Jahr gelesenen Bücher ansehen. Die App besteht aus einer Go-REST-API (`backend/`), die die Bücher threadsicher in einer JSON-Datei speichert, und einem Vite-React-Frontend (`frontend/`).

## Technologie

- **Backend:** Go 1.22+ (nur Standardbibliothek: `net/http` mit Methoden-Mustern, `encoding/json`, `sync`)
- **Frontend:** Vite + React 18 + TypeScript
- **Speicherung:** JSON-Datei (`DATA_FILE`), durch Mutex geschützt
- **Tests:** `go test` mit `httptest`; Vitest + React Testing Library

## Installation

Voraussetzungen: Go ≥ 1.22, Node.js ≥ 18 mit npm.

```bash
git clone <repo-url>
cd <repo>
cd frontend && npm install
```

Das Backend hat keine externen Abhängigkeiten.

## Entwicklung starten

Backend (Port 8080):

```bash
cd backend
go run .
```

Frontend (in einem zweiten Terminal):

```bash
cd frontend
VITE_API_BASE_URL=http://localhost:8080 npm run dev
```

Dann die von Vite angezeigte Adresse (meist `http://localhost:5173`) im Browser öffnen.

## Produktions-Build

```bash
cd backend && go build -o leseliste .     # Binary ./leseliste
cd frontend && npm run build              # statische Dateien in frontend/dist
```

## Tests

```bash
cd backend && go test ./...
cd frontend && npm test
```

## Umgebungsvariablen

| Variable | Dienst | Standard | Bedeutung |
|---|---|---|---|
| `PORT` | Backend | `8080` | HTTP-Port der API |
| `DATA_FILE` | Backend | `./data/books.json` | Pfad der JSON-Datei mit den Büchern |
| `CORS_ORIGIN` | Backend | `*` | Erlaubter Origin des Frontends (z. B. `http://localhost:5173`) |
| `VITE_API_BASE_URL` | Frontend | – | Basis-URL der API (z. B. `http://localhost:8080`) |

## API

Alle Endpunkte liefern JSON. Fehler (4xx/5xx) haben den Body `{"error": "<Meldung>"}`. Jede Antwort trägt CORS-Header; `OPTIONS` auf jedem Pfad antwortet mit `204`. Keine Authentifizierung.

| Methode | Pfad | Body | Antwort |
|---|---|---|---|
| GET | `/api/health` | – | `200 {"status":"ok"}` |
| GET | `/api/books?status=<planned\|reading\|read>&q=<text>` | – | `200 Book[]` (neueste zuerst); ungültiger Status → `400` |
| POST | `/api/books` | `{"title": "…", "author": "…"}` | `201 Book`; ungültig → `400` |
| PATCH | `/api/books/{id}` | `{"title"?, "author"?, "status"?, "rating"?}` | `200 Book`; ungültig → `400`; unbekannt → `404` |
| DELETE | `/api/books/{id}` | – | `204`; unbekannt → `404` |
| GET | `/api/stats?year=YYYY` | – | `200 Stats`; ungültiges Jahr → `400` |

Beispiel `Book`:

```json
{"id":"a1b2c3d4e5f60708","title":"Der Hobbit","author":"J. R. R. Tolkien","status":"read","rating":5,"createdAt":"2026-03-01T10:00:00Z","finishedAt":"2026-03-20T18:00:00Z"}
```

Beispiel `Stats`:

```json
{"year":2026,"readCount":1,"monthly":[0,0,1,0,0,0,0,0,0,0,0,0],"averageRating":5,"statusCounts":{"planned":2,"reading":1,"read":1}}
```

## Bedienung

- **Buch hinzufügen:** „Titel“ und „Autor“ ausfüllen, „Hinzufügen“ klicken.
- **Status ändern:** Dropdown am Buch (Geplant / Lese gerade / Gelesen).
- **Bewerten:** Sterne anklicken; erneuter Klick auf die aktuelle Bewertung entfernt sie.
- **Filtern und Suchen:** Reiter „Alle“, „Geplant“, „Lese gerade“, „Gelesen“ und Suchfeld.
- **Statistik:** „Dieses Jahr gelesen“, Monatsbalken, Durchschnittsbewertung, Anzahl je Status.

## Funktionen

- Bücher anlegen, bearbeiten, löschen
- Status und Sternebewertung, `finishedAt` wird beim Status „gelesen“ gesetzt
- Filter nach Status und Volltextsuche (Titel/Autor)
- Jahresstatistik
- Persistenz in einer JSON-Datei
- Health-Endpunkt und CORS für das separate Frontend
