// Package api contains the HTTP handlers of the reading-list API.
package api

import (
	"net/http"
	"time"

	"readinglist/internal/store"
)

// Server holds the dependencies of the handlers.
type Server struct {
	Store *store.Store
	Now   func() time.Time
}

// NewServer creates a Server.
func NewServer(s *store.Store, now func() time.Time) *Server {
	if now == nil {
		now = time.Now
	}
	return &Server{Store: s, Now: now}
}

// NewRouter registers every API route and wraps it in the CORS middleware.
func NewRouter(srv *Server, corsOrigin string) http.Handler {
	mux := http.NewServeMux()
	mux.HandleFunc("GET /api/health", srv.health)
	mux.HandleFunc("GET /api/books", srv.listBooks)
	mux.HandleFunc("POST /api/books", srv.createBook)
	mux.HandleFunc("PATCH /api/books/{id}", srv.patchBook)
	mux.HandleFunc("DELETE /api/books/{id}", srv.deleteBook)
	mux.HandleFunc("GET /api/stats", srv.getStats)
	return withCORS(corsOrigin, mux)
}
