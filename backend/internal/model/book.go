// Package model holds the shared data shapes of the reading-list API.
package model

import (
	"errors"
	"fmt"
	"strings"
	"time"
	"unicode/utf8"
)

// Book statuses.
const (
	StatusPlanned = "planned"
	StatusReading = "reading"
	StatusRead    = "read"
)

// MaxFieldLength is the maximum length of title/author in runes.
const MaxFieldLength = 200

// Book is one entry of the reading list.
type Book struct {
	ID         string     `json:"id"`
	Title      string     `json:"title"`
	Author     string     `json:"author"`
	Status     string     `json:"status"`
	Rating     int        `json:"rating"`
	CreatedAt  time.Time  `json:"createdAt"`
	FinishedAt *time.Time `json:"finishedAt"`
}

// StatusCounts counts books per status.
type StatusCounts struct {
	Planned int `json:"planned"`
	Reading int `json:"reading"`
	Read    int `json:"read"`
}

// Stats are the yearly reading statistics.
type Stats struct {
	Year          int          `json:"year"`
	ReadCount     int          `json:"readCount"`
	Monthly       [12]int      `json:"monthly"`
	AverageRating *float64     `json:"averageRating"`
	StatusCounts  StatusCounts `json:"statusCounts"`
}

// IsValidStatus reports whether s is one of the known statuses.
func IsValidStatus(s string) bool {
	return s == StatusPlanned || s == StatusReading || s == StatusRead
}

// NormalizeField trims value and checks it is non-empty and at most MaxFieldLength runes.
func NormalizeField(name, value string) (string, error) {
	v := strings.TrimSpace(value)
	if v == "" {
		return "", errors.New(name + " must not be empty")
	}
	if utf8.RuneCountInString(v) > MaxFieldLength {
		return "", fmt.Errorf("%s must be at most %d characters", name, MaxFieldLength)
	}
	return v, nil
}
