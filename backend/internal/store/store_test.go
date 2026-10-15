package store

import (
	"errors"
	"path/filepath"
	"testing"
	"time"

	"readinglist/internal/model"
)

func newStore(t *testing.T) *Store {
	t.Helper()
	s, err := New(filepath.Join(t.TempDir(), "books.json"))
	if err != nil {
		t.Fatal(err)
	}
	return s
}

func TestStoreCRUD(t *testing.T) {
	s := newStore(t)
	base := time.Date(2026, 1, 1, 0, 0, 0, 0, time.UTC)
	a, err := s.Create(model.Book{Title: "A", Author: "X", Status: model.StatusPlanned, CreatedAt: base})
	if err != nil || a.ID == "" {
		t.Fatalf("create a: %v %q", err, a.ID)
	}
	b, _ := s.Create(model.Book{Title: "B", Author: "Y", Status: model.StatusPlanned, CreatedAt: base.Add(time.Hour)})
	if a.ID == b.ID {
		t.Fatal("ids must differ")
	}
	list := s.List()
	if len(list) != 2 || list[0].ID != b.ID || list[1].ID != a.ID {
		t.Fatalf("list order wrong: %+v", list)
	}
	if got, ok := s.Get(a.ID); !ok || got.Title != "A" {
		t.Fatalf("get: %v %+v", ok, got)
	}
	u, err := s.Update(a.ID, func(bk *model.Book) error { bk.Rating = 4; return nil })
	if err != nil || u.Rating != 4 {
		t.Fatalf("update: %v %+v", err, u)
	}
	if got, _ := s.Get(a.ID); got.Rating != 4 {
		t.Fatal("update not stored")
	}
	if _, err := s.Update(a.ID, func(bk *model.Book) error { bk.Rating = 1; return errors.New("no") }); err == nil {
		t.Fatal("fn error must propagate")
	}
	if got, _ := s.Get(a.ID); got.Rating != 4 {
		t.Fatal("failed update must not change book")
	}
	if err := s.Delete(a.ID); err != nil {
		t.Fatal(err)
	}
	if _, ok := s.Get(a.ID); ok {
		t.Fatal("deleted book still present")
	}
	if err := s.Delete(a.ID); !errors.Is(err, ErrNotFound) {
		t.Fatalf("want ErrNotFound, got %v", err)
	}
	if _, err := s.Update("missing", func(*model.Book) error { return nil }); !errors.Is(err, ErrNotFound) {
		t.Fatalf("want ErrNotFound, got %v", err)
	}
}

func TestListReturnsCopy(t *testing.T) {
	s := newStore(t)
	if _, err := s.Create(model.Book{Title: "A", Author: "X"}); err != nil {
		t.Fatal(err)
	}
	l := s.List()
	l[0].Title = "changed"
	if s.List()[0].Title != "A" {
		t.Fatal("List must return a copy")
	}
}
