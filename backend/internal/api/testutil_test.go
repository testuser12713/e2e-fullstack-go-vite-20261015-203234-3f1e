package api

import (
	"net/http"
	"path/filepath"
	"testing"
	"time"

	"readinglist/internal/store"
)

// newTestServer builds a Server with a fixed clock and a store on a temp file.
func newTestServer(t *testing.T, now time.Time) (*Server, http.Handler) {
	t.Helper()
	st, err := store.New(filepath.Join(t.TempDir(), "books.json"))
	if err != nil {
		t.Fatalf("store.New: %v", err)
	}
	srv := NewServer(st, func() time.Time { return now })
	return srv, NewRouter(srv, "http://localhost:5173")
}
