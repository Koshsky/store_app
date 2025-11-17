package database

import (
	"database/sql"
	"fmt"
	"log"
	"store_app/internal/config"

	_ "github.com/lib/pq"
)

var DB *sql.DB

func Init() error {
	cfg := config.Load()

	var err error
	DB, err = sql.Open("postgres", cfg.GetDBConnectionString())
	if err != nil {
		return fmt.Errorf("failed to connect to database: %v", err)
	}

	if err = DB.Ping(); err != nil {
		return fmt.Errorf("failed to ping database: %v", err)
	}

	log.Println("Connected to database successfully")
	return nil
}
