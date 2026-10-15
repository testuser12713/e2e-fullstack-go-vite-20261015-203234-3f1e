package api

import "net/http"

func (s *Server) listBooks(w http.ResponseWriter, r *http.Request) {
	writeError(w, http.StatusNotImplemented, "listing books is not implemented yet")
}

func (s *Server) createBook(w http.ResponseWriter, r *http.Request) {
	writeError(w, http.StatusNotImplemented, "creating books is not implemented yet")
}
