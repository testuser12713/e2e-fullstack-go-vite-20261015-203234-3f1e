package api

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	"readinglist/internal/model"
)

func seedBook(t *testing.T, srv *Server) model.Book {
	t.Helper()
	b, err := srv.Store.Create(model.Book{Title: "Dune", Author: "Herbert", Status: model.StatusPlanned, CreatedAt: time.Now().UTC()})
	if err != nil {
		t.Fatalf("create: %v", err)
	}
	return b
}

func do(h http.Handler, method, path, body string) *httptest.ResponseRecorder {
	req := httptest.NewRequest(method, path, strings.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	rec := httptest.NewRecorder()
	h.ServeHTTP(rec, req)
	return rec
}

func decodeBook(t *testing.T, rec *httptest.ResponseRecorder) model.Book {
	t.Helper()
	var b model.Book
	if err := json.Unmarshal(rec.Body.Bytes(), &b); err != nil {
		t.Fatalf("decode: %v (%s)", err, rec.Body.String())
	}
	return b
}

func assertError(t *testing.T, rec *httptest.ResponseRecorder, code int) {
	t.Helper()
	if rec.Code != code {
		t.Fatalf("status = %d, want %d (%s)", rec.Code, code, rec.Body.String())
	}
	var e map[string]string
	if err := json.Unmarshal(rec.Body.Bytes(), &e); err != nil || e["error"] == "" {
		t.Fatalf("missing error body: %s", rec.Body.String())
	}
}

func TestPatchBookUpdatesFields(t *testing.T) {
	srv, h := newTestServer(t, time.Date(2026, 3, 1, 0, 0, 0, 0, time.UTC))
	b := seedBook(t, srv)
	rec := do(h, "PATCH", "/api/books/"+b.ID, `{"status":"reading","rating":4,"title":"  Dune Messiah "}`)
	if rec.Code != 200 {
		t.Fatalf("status %d: %s", rec.Code, rec.Body.String())
	}
	got := decodeBook(t, rec)
	if got.Status != "reading" || got.Rating != 4 || got.Title != "Dune Messiah" || got.Author != "Herbert" || got.FinishedAt != nil {
		t.Fatalf("unexpected book %+v", got)
	}
	if stored, _ := srv.Store.Get(b.ID); stored.Rating != 4 {
		t.Fatalf("not stored: %+v", stored)
	}
}

func TestPatchBookValidation(t *testing.T) {
	srv, h := newTestServer(t, time.Now())
	b := seedBook(t, srv)
	for _, body := range []string{`{"status":"done"}`, `{"rating":6}`, `{"rating":-1}`, `{"rating":2.5}`, `{"title":"  "}`, `not json`} {
		assertError(t, do(h, "PATCH", "/api/books/"+b.ID, body), 400)
	}
	assertError(t, do(h, "PATCH", "/api/books/nope", `{"rating":3}`), 404)
}

func TestPatchBookFinishedAt(t *testing.T) {
	now := time.Date(2026, 5, 10, 12, 0, 0, 0, time.UTC)
	srv, h := newTestServer(t, now)
	b := seedBook(t, srv)
	got := decodeBook(t, do(h, "PATCH", "/api/books/"+b.ID, `{"status":"read"}`))
	if got.FinishedAt == nil || !got.FinishedAt.Equal(now) {
		t.Fatalf("finishedAt = %v, want %v", got.FinishedAt, now)
	}
	// rating-only change keeps finishedAt
	got = decodeBook(t, do(h, "PATCH", "/api/books/"+b.ID, `{"rating":5}`))
	if got.FinishedAt == nil {
		t.Fatal("finishedAt cleared by rating update")
	}
	got = decodeBook(t, do(h, "PATCH", "/api/books/"+b.ID, `{"status":"reading"}`))
	if got.FinishedAt != nil {
		t.Fatalf("finishedAt not cleared: %v", got.FinishedAt)
	}
	rec := do(h, "PATCH", "/api/books/"+b.ID, `{"status":"planned"}`)
	if !strings.Contains(rec.Body.String(), `"finishedAt":null`) {
		t.Fatalf("expected null finishedAt: %s", rec.Body.String())
	}
}

func TestDeleteBook(t *testing.T) {
	srv, h := newTestServer(t, time.Now())
	b := seedBook(t, srv)
	rec := do(h, "DELETE", "/api/books/"+b.ID, "")
	if rec.Code != 204 || rec.Body.Len() != 0 {
		t.Fatalf("delete: %d %q", rec.Code, rec.Body.String())
	}
	if _, ok := srv.Store.Get(b.ID); ok {
		t.Fatal("book still present")
	}
	assertError(t, do(h, "DELETE", "/api/books/"+b.ID, ""), 404)
}
