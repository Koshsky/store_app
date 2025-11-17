package database

import (
	"database/sql"
	"fmt"
	"log"
	"store_app/internal/config"

	_ "github.com/lib/pq"
)

func Init(cfg config.DatabaseConfig) (*sql.DB, error) {
	db, err := sql.Open("postgres", cfg.GetDBConnectionString())
	if err != nil {
		return nil, fmt.Errorf("failed to connect to database: %v", err)
	}

	if err = db.Ping(); err != nil {
		return nil, fmt.Errorf("failed to ping database: %v", err)
	}

	log.Println("Connected to database successfully")
	return db, nil
}
