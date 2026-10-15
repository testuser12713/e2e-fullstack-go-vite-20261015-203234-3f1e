package api

import (
	"encoding/json"
	"math"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"readinglist/internal/model"
)

func ts(y int, m time.Month) *time.Time {
	t := time.Date(y, m, 10, 12, 0, 0, 0, time.UTC)
	return &t
}

func ptr(f float64) *float64 { return &f }

func TestComputeStats(t *testing.T) {
	cases := []struct {
		name    string
		books   []model.Book
		count   int
		avg     *float64
		monthly map[int]int
		counts  model.StatusCounts
	}{
		{name: "empty"},
		{
			name: "other years excluded, unrated excluded from average",
			books: []model.Book{
				{Status: model.StatusRead, Rating: 4, FinishedAt: ts(2026, time.January)},
				{Status: model.StatusRead, Rating: 0, FinishedAt: ts(2026, time.January)},
				{Status: model.StatusRead, Rating: 2, FinishedAt: ts(2026, time.December)},
				{Status: model.StatusRead, Rating: 5, FinishedAt: ts(2025, time.March)},
				{Status: model.StatusPlanned},
				{Status: model.StatusReading},
			},
			count: 3, avg: ptr(3), monthly: map[int]int{0: 2, 11: 1},
			counts: model.StatusCounts{Planned: 1, Reading: 1, Read: 4},
		},
		{
			name:  "null average when no rated read books",
			books: []model.Book{{Status: model.StatusRead, FinishedAt: ts(2026, time.May)}},
			count: 1, monthly: map[int]int{4: 1}, counts: model.StatusCounts{Read: 1},
		},
	}
	for _, c := range cases {
		t.Run(c.name, func(t *testing.T) {
			s := computeStats(c.books, 2026)
			if s.Year != 2026 || s.ReadCount != c.count || s.StatusCounts != c.counts {
				t.Fatalf("got %+v", s)
			}
			for i := 0; i < 12; i++ {
				if s.Monthly[i] != c.monthly[i] {
					t.Fatalf("monthly[%d]=%d want %d", i, s.Monthly[i], c.monthly[i])
				}
			}
			if (c.avg == nil) != (s.AverageRating == nil) {
				t.Fatalf("avg mismatch: %v", s.AverageRating)
			}
			if c.avg != nil && math.Abs(*c.avg-*s.AverageRating) > 1e-2 {
				t.Fatalf("avg %v want %v", *s.AverageRating, *c.avg)
			}
		})
	}
}

func getStatsReq(t *testing.T, h http.Handler, url string) (*httptest.ResponseRecorder, map[string]any) {
	t.Helper()
	rec := httptest.NewRecorder()
	h.ServeHTTP(rec, httptest.NewRequest(http.MethodGet, url, nil))
	var body map[string]any
	_ = json.Unmarshal(rec.Body.Bytes(), &body)
	return rec, body
}

func TestGetStatsHTTP(t *testing.T) {
	srv, h := newTestServer(t, time.Date(2026, time.October, 15, 0, 0, 0, 0, time.UTC))
	for _, b := range []model.Book{
		{Title: "A", Author: "X", Status: model.StatusRead, Rating: 4, FinishedAt: ts(2026, time.February), CreatedAt: time.Now()},
		{Title: "B", Author: "Y", Status: model.StatusRead, Rating: 2, FinishedAt: ts(2025, time.June), CreatedAt: time.Now()},
		{Title: "C", Author: "Z", Status: model.StatusPlanned, CreatedAt: time.Now()},
	} {
		if _, err := srv.Store.Create(b); err != nil {
			t.Fatal(err)
		}
	}

	rec, body := getStatsReq(t, h, "/api/stats")
	if rec.Code != 200 || body["year"].(float64) != 2026 || body["readCount"].(float64) != 1 {
		t.Fatalf("default: %d %v", rec.Code, body)
	}
	if m := body["monthly"].([]any); len(m) != 12 || m[1].(float64) != 1 {
		t.Fatalf("monthly %v", body["monthly"])
	}
	sc := body["statusCounts"].(map[string]any)
	if sc["planned"].(float64) != 1 || sc["read"].(float64) != 2 || sc["reading"].(float64) != 0 {
		t.Fatalf("statusCounts %v", sc)
	}

	rec, body = getStatsReq(t, h, "/api/stats?year=2025")
	if rec.Code != 200 || body["year"].(float64) != 2025 || body["readCount"].(float64) != 1 {
		t.Fatalf("explicit: %d %v", rec.Code, body)
	}

	rec, body = getStatsReq(t, h, "/api/stats?year=2024")
	if rec.Code != 200 || body["averageRating"] != nil {
		t.Fatalf("null avg: %d %v", rec.Code, body)
	}

	for _, bad := range []string{"abc", "20x6", "1.5"} {
		rec, body = getStatsReq(t, h, "/api/stats?year="+bad)
		if rec.Code != 400 || body["error"] == nil {
			t.Fatalf("invalid %q: %d %v", bad, rec.Code, body)
		}
	}
}
