package store

import "readinglist/internal/model"

// loadFile reads the books stored at path. Inert until the persistence ticket fills it.
func loadFile(path string) ([]model.Book, error) {
	return []model.Book{}, nil
}

// saveFile writes books to path. Called under the store's write lock.
// Inert until the persistence ticket fills it.
func saveFile(path string, books []model.Book) error {
	return nil
}
