package api

import "net/http"

func (s *Server) getStats(w http.ResponseWriter, r *http.Request) {
	writeError(w, http.StatusNotImplemented, "statistics are not implemented yet")
}
