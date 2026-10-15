package store

import (
	"encoding/json"
	"errors"
	"fmt"
	"io/fs"
	"os"
	"path/filepath"

	"readinglist/internal/model"
)

// loadFile reads the books stored at path. A missing file yields an empty list.
func loadFile(path string) ([]model.Book, error) {
	data, err := os.ReadFile(path)
	if errors.Is(err, fs.ErrNotExist) {
		return []model.Book{}, nil
	}
	if err != nil {
		return nil, fmt.Errorf("read data file %s: %w", path, err)
	}
	var books []model.Book
	if err := json.Unmarshal(data, &books); err != nil {
		return nil, fmt.Errorf("decode data file %s: %w", path, err)
	}
	if books == nil {
		books = []model.Book{}
	}
	return books, nil
}

// saveFile writes books to path atomically (temp file in the same directory,
// fsync, rename). Called under the store's write lock.
func saveFile(path string, books []model.Book) error {
	if books == nil {
		books = []model.Book{}
	}
	data, err := json.MarshalIndent(books, "", "  ")
	if err != nil {
		return fmt.Errorf("encode books: %w", err)
	}
	dir := filepath.Dir(path)
	if err := os.MkdirAll(dir, 0o755); err != nil {
		return fmt.Errorf("create data dir %s: %w", dir, err)
	}
	tmp, err := os.CreateTemp(dir, filepath.Base(path)+".tmp-*")
	if err != nil {
		return fmt.Errorf("create temp file: %w", err)
	}
	tmpName := tmp.Name()
	ok := false
	defer func() {
		if !ok {
			_ = tmp.Close()
			_ = os.Remove(tmpName)
		}
	}()
	if _, err := tmp.Write(data); err != nil {
		return fmt.Errorf("write temp file: %w", err)
	}
	if err := tmp.Sync(); err != nil {
		return fmt.Errorf("sync temp file: %w", err)
	}
	if err := tmp.Close(); err != nil {
		return fmt.Errorf("close temp file: %w", err)
	}
	if err := os.Rename(tmpName, path); err != nil {
		_ = os.Remove(tmpName)
		ok = true
		return fmt.Errorf("replace data file %s: %w", path, err)
	}
	ok = true
	return nil
}
