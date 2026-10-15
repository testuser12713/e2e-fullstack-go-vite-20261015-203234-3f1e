package api

import "net/http"

func (s *Server) patchBook(w http.ResponseWriter, r *http.Request) {
	writeError(w, http.StatusNotImplemented, "updating books is not implemented yet")
}

func (s *Server) deleteBook(w http.ResponseWriter, r *http.Request) {
	writeError(w, http.StatusNotImplemented, "deleting books is not implemented yet")
}
