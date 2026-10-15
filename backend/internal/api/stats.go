package api

import (
	"net/http"
	"strconv"
	"time"

	"readinglist/internal/model"
)

// computeStats derives the yearly statistics for year from books.
// ReadCount, Monthly and AverageRating cover read books finished in year;
// StatusCounts cover the whole list.
func computeStats(books []model.Book, year int) model.Stats {
	st := model.Stats{Year: year}
	sum, rated := 0, 0
	for _, b := range books {
		switch b.Status {
		case model.StatusPlanned:
			st.StatusCounts.Planned++
		case model.StatusReading:
			st.StatusCounts.Reading++
		case model.StatusRead:
			st.StatusCounts.Read++
		}
		if b.Status != model.StatusRead || b.FinishedAt == nil || b.FinishedAt.Year() != year {
			continue
		}
		st.ReadCount++
		st.Monthly[b.FinishedAt.Month()-1]++
		if b.Rating > 0 {
			sum += b.Rating
			rated++
		}
	}
	if rated > 0 {
		avg := float64(sum) / float64(rated)
		st.AverageRating = &avg
	}
	return st
}

func (s *Server) getStats(w http.ResponseWriter, r *http.Request) {
	now := time.Now
	if s.Now != nil {
		now = s.Now
	}
	year := now().Year()
	if raw := r.URL.Query().Get("year"); raw != "" {
		y, err := strconv.Atoi(raw)
		if err != nil || y < 1 || y > 9999 {
			writeError(w, http.StatusBadRequest, "year must be an integer between 1 and 9999")
			return
		}
		year = y
	}
	writeJSON(w, http.StatusOK, computeStats(s.Store.List(), year))
}
