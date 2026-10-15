// Package store keeps books in memory, guarded by a mutex, and persists them via saveFile.
package store

import (
	"crypto/rand"
	"encoding/hex"
	"errors"
	"sort"
	"sync"

	"readinglist/internal/model"
)

// ErrNotFound is returned when no book has the requested ID.
var ErrNotFound = errors.New("book not found")

// Store is a thread-safe in-memory book collection backed by a JSON file.
type Store struct {
	mu    sync.RWMutex
	path  string
	books []model.Book
}

// New loads the books from path and returns a ready store.
func New(path string) (*Store, error) {
	books, err := loadFile(path)
	if err != nil {
		return nil, err
	}
	if books == nil {
		books = []model.Book{}
	}
	return &Store{path: path, books: books}, nil
}

func newID() (string, error) {
	b := make([]byte, 8)
	if _, err := rand.Read(b); err != nil {
		return "", err
	}
	return hex.EncodeToString(b), nil
}

func (s *Store) indexOf(id string) int {
	for i := range s.books {
		if s.books[i].ID == id {
			return i
		}
	}
	return -1
}

// List returns a copy of all books, newest createdAt first.
func (s *Store) List() []model.Book {
	s.mu.RLock()
	out := make([]model.Book, len(s.books))
	copy(out, s.books)
	s.mu.RUnlock()
	sort.SliceStable(out, func(i, j int) bool { return out[i].CreatedAt.After(out[j].CreatedAt) })
	return out
}

// Get returns the book with id.
func (s *Store) Get(id string) (model.Book, bool) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	if i := s.indexOf(id); i >= 0 {
		return s.books[i], true
	}
	return model.Book{}, false
}

// Create assigns a new ID to b, stores and persists it.
func (s *Store) Create(b model.Book) (model.Book, error) {
	s.mu.Lock()
	defer s.mu.Unlock()
	id, err := newID()
	if err != nil {
		return model.Book{}, err
	}
	for s.indexOf(id) >= 0 {
		if id, err = newID(); err != nil {
			return model.Book{}, err
		}
	}
	b.ID = id
	next := append(append([]model.Book{}, s.books...), b)
	if err := saveFile(s.path, next); err != nil {
		return model.Book{}, err
	}
	s.books = next
	return b, nil
}

// Update applies fn to a copy of the book with id; on success the change is stored and persisted.
func (s *Store) Update(id string, fn func(*model.Book) error) (model.Book, error) {
	s.mu.Lock()
	defer s.mu.Unlock()
	i := s.indexOf(id)
	if i < 0 {
		return model.Book{}, ErrNotFound
	}
	b := s.books[i]
	if err := fn(&b); err != nil {
		return model.Book{}, err
	}
	b.ID = id
	next := append([]model.Book{}, s.books...)
	next[i] = b
	if err := saveFile(s.path, next); err != nil {
		return model.Book{}, err
	}
	s.books = next
	return b, nil
}

// Delete removes the book with id and persists the change.
func (s *Store) Delete(id string) error {
	s.mu.Lock()
	defer s.mu.Unlock()
	i := s.indexOf(id)
	if i < 0 {
		return ErrNotFound
	}
	next := make([]model.Book, 0, len(s.books)-1)
	next = append(next, s.books[:i]...)
	next = append(next, s.books[i+1:]...)
	if err := saveFile(s.path, next); err != nil {
		return err
	}
	s.books = next
	return nil
}
