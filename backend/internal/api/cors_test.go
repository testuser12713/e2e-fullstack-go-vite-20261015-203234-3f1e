package api

import (
	"net/http"
	"net/http/httptest"
	"testing"
	"time"
)

func checkCORS(t *testing.T, rec *httptest.ResponseRecorder) {
	t.Helper()
	h := rec.Header()
	if got := h.Get("Access-Control-Allow-Origin"); got != "http://localhost:5173" {
		t.Errorf("allow-origin %q", got)
	}
	if got := h.Get("Access-Control-Allow-Methods"); got != "GET,POST,PATCH,DELETE,OPTIONS" {
		t.Errorf("allow-methods %q", got)
	}
	if got := h.Get("Access-Control-Allow-Headers"); got != "Content-Type" {
		t.Errorf("allow-headers %q", got)
	}
}

func TestPreflight(t *testing.T) {
	_, h := newTestServer(t, time.Now())
	for _, p := range []string{"/api/books", "/api/books/abc", "/api/stats", "/anything"} {
		rec := httptest.NewRecorder()
		h.ServeHTTP(rec, httptest.NewRequest(http.MethodOptions, p, nil))
		if rec.Code != http.StatusNoContent || rec.Body.Len() != 0 {
			t.Fatalf("%s: status %d body %q", p, rec.Code, rec.Body.String())
		}
		checkCORS(t, rec)
	}
}

func TestCORSOnGet(t *testing.T) {
	_, h := newTestServer(t, time.Now())
	rec := httptest.NewRecorder()
	h.ServeHTTP(rec, httptest.NewRequest(http.MethodGet, "/api/health", nil))
	checkCORS(t, rec)
}

// TestRoutesRegistered checks every contract route is wired (not 404/405), without asserting the body.
func TestRoutesRegistered(t *testing.T) {
	_, h := newTestServer(t, time.Now())
	for _, c := range [][2]string{{"GET", "/api/books"}, {"POST", "/api/books"}, {"PATCH", "/api/books/x"}, {"DELETE", "/api/books/x"}, {"GET", "/api/stats"}} {
		rec := httptest.NewRecorder()
		h.ServeHTTP(rec, httptest.NewRequest(c[0], c[1], nil))
		if rec.Code == http.StatusMethodNotAllowed || (rec.Code == http.StatusNotFound && rec.Header().Get("Content-Type") != "application/json") {
			t.Errorf("%s %s not routed (%d)", c[0], c[1], rec.Code)
		}
		checkCORS(t, rec)
	}
}
