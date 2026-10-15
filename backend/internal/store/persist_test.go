package store

import (
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"sync"
	"testing"
	"time"

	"readinglist/internal/model"
)

func sampleBook(title string) model.Book {
	return model.Book{
		Title:     title,
		Author:    "Author",
		Status:    model.StatusPlanned,
		CreatedAt: time.Date(2026, 1, 2, 3, 4, 5, 0, time.UTC),
	}
}

func TestPersistRoundTrip(t *testing.T) {
	path := filepath.Join(t.TempDir(), "nested", "books.json")
	fin := time.Date(2026, 3, 1, 0, 0, 0, 0, time.UTC)
	b := sampleBook("Dune")
	b.ID = "abc"
	b.Status = model.StatusRead
	b.Rating = 4
	b.FinishedAt = &fin
	if err := saveFile(path, []model.Book{b}); err != nil {
		t.Fatalf("save: %v", err)
	}
	got, err := loadFile(path)
	if err != nil {
		t.Fatalf("load: %v", err)
	}
	if len(got) != 1 || got[0].ID != "abc" || got[0].Rating != 4 || got[0].FinishedAt == nil || !got[0].FinishedAt.Equal(fin) {
		t.Fatalf("unexpected round trip: %+v", got)
	}
	entries, _ := os.ReadDir(filepath.Dir(path))
	if len(entries) != 1 {
		t.Fatalf("temp files left behind: %v", entries)
	}
}

func TestLoadMissingFile(t *testing.T) {
	got, err := loadFile(filepath.Join(t.TempDir(), "none.json"))
	if err != nil || got == nil || len(got) != 0 {
		t.Fatalf("want empty list, got %v %v", got, err)
	}
}

func TestLoadMalformedFile(t *testing.T) {
	path := filepath.Join(t.TempDir(), "books.json")
	if err := os.WriteFile(path, []byte("{not json"), 0o644); err != nil {
		t.Fatal(err)
	}
	if _, err := loadFile(path); err == nil {
		t.Fatal("want error for malformed file")
	}
	if _, err := New(path); err == nil {
		t.Fatal("want New to fail on malformed file")
	}
}

func TestStoreRestartSeesBooks(t *testing.T) {
	path := filepath.Join(t.TempDir(), "data", "books.json")
	s, err := New(path)
	if err != nil {
		t.Fatal(err)
	}
	created, err := s.Create(sampleBook("Restart"))
	if err != nil {
		t.Fatal(err)
	}
	if _, err := os.Stat(path); err != nil {
		t.Fatalf("data file not written: %v", err)
	}
	s2, err := New(path)
	if err != nil {
		t.Fatal(err)
	}
	got, ok := s2.Get(created.ID)
	if !ok || got.Title != "Restart" {
		t.Fatalf("book not found after restart: %+v", got)
	}
}

func TestConcurrentCreatesPersistAll(t *testing.T) {
	path := filepath.Join(t.TempDir(), "books.json")
	s, err := New(path)
	if err != nil {
		t.Fatal(err)
	}
	const n = 50
	var wg sync.WaitGroup
	errs := make(chan error, n)
	for i := 0; i < n; i++ {
		wg.Add(1)
		go func(i int) {
			defer wg.Done()
			if _, err := s.Create(sampleBook(fmt.Sprintf("Book %d", i))); err != nil {
				errs <- err
			}
		}(i)
	}
	wg.Wait()
	close(errs)
	for err := range errs {
		t.Fatalf("create failed: %v", err)
	}
	data, err := os.ReadFile(path)
	if err != nil {
		t.Fatal(err)
	}
	var books []model.Book
	if err := json.Unmarshal(data, &books); err != nil {
		t.Fatalf("file does not decode: %v", err)
	}
	if len(books) != n {
		t.Fatalf("want %d books, got %d", n, len(books))
	}
	ids := map[string]bool{}
	for _, b := range books {
		if b.ID == "" || b.Title == "" || !model.IsValidStatus(b.Status) || ids[b.ID] {
			t.Fatalf("invalid or duplicate book: %+v", b)
		}
		ids[b.ID] = true
	}
	s2, err := New(path)
	if err != nil {
		t.Fatal(err)
	}
	if got := len(s2.List()); got != n {
		t.Fatalf("fresh store lists %d, want %d", got, n)
	}
}
