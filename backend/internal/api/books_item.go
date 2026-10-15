package api

import (
	"encoding/json"
	"errors"
	"log"
	"net/http"

	"readinglist/internal/model"
	"readinglist/internal/store"
)

// bookPatch is the partial update body; nil fields are left unchanged.
type bookPatch struct {
	Title  *string `json:"title"`
	Author *string `json:"author"`
	Status *string `json:"status"`
	Rating *int    `json:"rating"`
}

func (s *Server) patchBook(w http.ResponseWriter, r *http.Request) {
	id := r.PathValue("id")
	var p bookPatch
	dec := json.NewDecoder(http.MaxBytesReader(w, r.Body, 1<<16))
	if err := dec.Decode(&p); err != nil {
		writeError(w, http.StatusBadRequest, "invalid JSON body")
		return
	}
	var title, author string
	var err error
	if p.Title != nil {
		if title, err = model.NormalizeField("title", *p.Title); err != nil {
			writeError(w, http.StatusBadRequest, err.Error())
			return
		}
	}
	if p.Author != nil {
		if author, err = model.NormalizeField("author", *p.Author); err != nil {
			writeError(w, http.StatusBadRequest, err.Error())
			return
		}
	}
	if p.Status != nil && !model.IsValidStatus(*p.Status) {
		writeError(w, http.StatusBadRequest, "status must be one of planned, reading, read")
		return
	}
	if p.Rating != nil && (*p.Rating < 0 || *p.Rating > 5) {
		writeError(w, http.StatusBadRequest, "rating must be an integer between 0 and 5")
		return
	}

	b, err := s.Store.Update(id, func(b *model.Book) error {
		if p.Title != nil {
			b.Title = title
		}
		if p.Author != nil {
			b.Author = author
		}
		if p.Status != nil {
			b.Status = *p.Status
			if b.Status == model.StatusRead {
				if b.FinishedAt == nil {
					now := s.Now()
					b.FinishedAt = &now
				}
			} else {
				b.FinishedAt = nil
			}
		}
		if p.Rating != nil {
			b.Rating = *p.Rating
		}
		return nil
	})
	if errors.Is(err, store.ErrNotFound) {
		writeError(w, http.StatusNotFound, "book not found")
		return
	}
	if err != nil {
		log.Printf("update book: %v", err)
		writeError(w, http.StatusInternalServerError, "could not update book")
		return
	}
	writeJSON(w, http.StatusOK, b)
}

func (s *Server) deleteBook(w http.ResponseWriter, r *http.Request) {
	err := s.Store.Delete(r.PathValue("id"))
	if errors.Is(err, store.ErrNotFound) {
		writeError(w, http.StatusNotFound, "book not found")
		return
	}
	if err != nil {
		log.Printf("delete book: %v", err)
		writeError(w, http.StatusInternalServerError, "could not delete book")
		return
	}
	w.WriteHeader(http.StatusNoContent)
}
