package api

import (
	"encoding/json"
	"log"
	"net/http"
	"strings"

	"readinglist/internal/model"
)

type createBookRequest struct {
	Title  string `json:"title"`
	Author string `json:"author"`
}

// listBooks returns all books newest first, optionally filtered by status and q.
func (s *Server) listBooks(w http.ResponseWriter, r *http.Request) {
	query := r.URL.Query()
	status := query.Get("status")
	if status != "" && !model.IsValidStatus(status) {
		writeError(w, http.StatusBadRequest, "status must be one of planned, reading, read")
		return
	}
	q := strings.ToLower(strings.TrimSpace(query.Get("q")))
	out := make([]model.Book, 0)
	for _, b := range s.Store.List() {
		if status != "" && b.Status != status {
			continue
		}
		if q != "" && !strings.Contains(strings.ToLower(b.Title), q) &&
			!strings.Contains(strings.ToLower(b.Author), q) {
			continue
		}
		out = append(out, b)
	}
	writeJSON(w, http.StatusOK, out)
}

// createBook adds a new planned book.
func (s *Server) createBook(w http.ResponseWriter, r *http.Request) {
	var req createBookRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "invalid JSON body")
		return
	}
	title, err := model.NormalizeField("title", req.Title)
	if err != nil {
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}
	author, err := model.NormalizeField("author", req.Author)
	if err != nil {
		writeError(w, http.StatusBadRequest, err.Error())
		return
	}
	book, err := s.Store.Create(model.Book{
		Title:     title,
		Author:    author,
		Status:    model.StatusPlanned,
		Rating:    0,
		CreatedAt: s.Now().UTC(),
	})
	if err != nil {
		log.Printf("create book: %v", err)
		writeError(w, http.StatusInternalServerError, "could not save book")
		return
	}
	writeJSON(w, http.StatusCreated, book)
}
