package api

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"sync"
	"testing"
	"time"

	"readinglist/internal/model"
)

func doReq(t *testing.T, h http.Handler, method, path, body string) *httptest.ResponseRecorder {
	t.Helper()
	req := httptest.NewRequest(method, path, strings.NewReader(body))
	req.Header.Set("Content-Type", "application/json")
	rec := httptest.NewRecorder()
	h.ServeHTTP(rec, req)
	return rec
}

func listOf(t *testing.T, h http.Handler, path string) []model.Book {
	t.Helper()
	rec := doReq(t, h, http.MethodGet, path, "")
	if rec.Code != http.StatusOK {
		t.Fatalf("GET %s = %d %s", path, rec.Code, rec.Body)
	}
	var books []model.Book
	if err := json.Unmarshal(rec.Body.Bytes(), &books); err != nil {
		t.Fatal(err)
	}
	return books
}

func TestCreateBookValid(t *testing.T) {
	now := time.Date(2026, 3, 1, 12, 0, 0, 0, time.FixedZone("x", 3600))
	_, h := newTestServer(t, now)
	rec := doReq(t, h, http.MethodPost, "/api/books", `{"title":"  The Hobbit ","author":"J.R.R. Tolkien"}`)
	if rec.Code != http.StatusCreated {
		t.Fatalf("code %d %s", rec.Code, rec.Body)
	}
	var raw map[string]any
	json.Unmarshal(rec.Body.Bytes(), &raw)
	if raw["finishedAt"] != nil || raw["status"] != "planned" || raw["rating"].(float64) != 0 ||
		raw["title"] != "The Hobbit" || raw["id"] == "" {
		t.Fatalf("unexpected body %v", raw)
	}
	if raw["createdAt"] != "2026-03-01T11:00:00Z" {
		t.Fatalf("createdAt %v", raw["createdAt"])
	}
}

func TestCreateBookInvalid(t *testing.T) {
	_, h := newTestServer(t, time.Now())
	long := strings.Repeat("a", 201)
	for _, body := range []string{
		`{"title":"","author":"A"}`, `{"title":"T","author":"   "}`, `{"title":" \t ","author":"A"}`,
		`{"title":"` + long + `","author":"A"}`, `{"title":"T","author":"` + long + `"}`,
		`{"title":"T"`, `not json`, `{"author":"A"}`,
	} {
		rec := doReq(t, h, http.MethodPost, "/api/books", body)
		var e map[string]string
		if rec.Code != http.StatusBadRequest || json.Unmarshal(rec.Body.Bytes(), &e) != nil || e["error"] == "" {
			t.Errorf("body %q: %d %s", body, rec.Code, rec.Body)
		}
	}
	if n := len(listOf(t, h, "/api/books")); n != 0 {
		t.Fatalf("expected 0 books, got %d", n)
	}
}

func TestListBooksFilters(t *testing.T) {
	srv, h := newTestServer(t, time.Now())
	base := time.Date(2026, 1, 1, 0, 0, 0, 0, time.UTC)
	add := func(title, author string, i int) {
		cur := base.Add(time.Duration(i) * time.Hour)
		srv.Now = func() time.Time { return cur }
		if rec := doReq(t, h, http.MethodPost, "/api/books", `{"title":"`+title+`","author":"`+author+`"}`); rec.Code != 201 {
			t.Fatal(rec.Body)
		}
	}
	add("The Hobbit", "J.R.R. Tolkien", 0)
	add("Dune", "Frank Herbert", 1)
	add("Tolkien: A Biography", "Humphrey Carpenter", 2)
	all := listOf(t, h, "/api/books")
	if len(all) != 3 || all[0].Title != "Tolkien: A Biography" || all[2].Title != "The Hobbit" {
		t.Fatalf("order wrong: %+v", all)
	}
	if _, err := srv.Store.Update(all[2].ID, func(b *model.Book) error { b.Status = model.StatusReading; return nil }); err != nil {
		t.Fatal(err)
	}
	if got := listOf(t, h, "/api/books?q=TOLKIEN"); len(got) != 2 {
		t.Fatalf("q: %+v", got)
	}
	if got := listOf(t, h, "/api/books?q=herb"); len(got) != 1 || got[0].Title != "Dune" {
		t.Fatalf("q author: %+v", got)
	}
	if got := listOf(t, h, "/api/books?status=reading"); len(got) != 1 || got[0].Title != "The Hobbit" {
		t.Fatalf("status: %+v", got)
	}
	if got := listOf(t, h, "/api/books?status=planned&q=tolkien"); len(got) != 1 || got[0].Title != "Tolkien: A Biography" {
		t.Fatalf("combined: %+v", got)
	}
	if got := listOf(t, h, "/api/books?status=read&q=tolkien"); len(got) != 0 {
		t.Fatalf("combined empty: %+v", got)
	}
	if rec := doReq(t, h, http.MethodGet, "/api/books?status=bogus", ""); rec.Code != 400 || !strings.Contains(rec.Body.String(), `"error"`) {
		t.Fatalf("invalid status: %d", rec.Code)
	}
}

func TestListBooksEmptyIsArray(t *testing.T) {
	_, h := newTestServer(t, time.Now())
	rec := doReq(t, h, http.MethodGet, "/api/books", "")
	if strings.TrimSpace(rec.Body.String()) != "[]" {
		t.Fatalf("got %q", rec.Body)
	}
}

func TestCreateBookConcurrent(t *testing.T) {
	_, h := newTestServer(t, time.Now())
	var wg sync.WaitGroup
	codes := make([]int, 50)
	for i := 0; i < 50; i++ {
		wg.Add(1)
		go func(i int) {
			defer wg.Done()
			req := httptest.NewRequest(http.MethodPost, "/api/books", strings.NewReader(`{"title":"T","author":"A"}`))
			rec := httptest.NewRecorder()
			h.ServeHTTP(rec, req)
			codes[i] = rec.Code
		}(i)
	}
	wg.Wait()
	for i, c := range codes {
		if c != http.StatusCreated {
			t.Fatalf("request %d: %d", i, c)
		}
	}
	if n := len(listOf(t, h, "/api/books")); n != 50 {
		t.Fatalf("expected 50 books, got %d", n)
	}
}
