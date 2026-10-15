// Command readinglist serves the reading-list REST API.
package main

import (
	"log"
	"net/http"
	"os"
	"time"

	"readinglist/internal/api"
	"readinglist/internal/store"
)

func envOr(name, def string) string {
	if v := os.Getenv(name); v != "" {
		return v
	}
	return def
}

func main() {
	port := envOr("PORT", "8080")
	dataFile := envOr("DATA_FILE", "./data/books.json")
	corsOrigin := envOr("CORS_ORIGIN", "*")

	st, err := store.New(dataFile)
	if err != nil {
		log.Fatalf("cannot open data file %q (DATA_FILE): %v", dataFile, err)
	}
	srv := api.NewServer(st, time.Now)
	handler := api.NewRouter(srv, corsOrigin)

	addr := ":" + port
	log.Printf("reading-list API listening on %s", addr)
	if err := http.ListenAndServe(addr, handler); err != nil {
		log.Fatal(err)
	}
}
