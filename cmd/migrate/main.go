package main

import (
	"database/sql"
	"fmt"
	"log"
	"os"
	"path/filepath"
	"sort"
	"strings"

	"store_app/internal/config"
	"store_app/internal/database"

	_ "github.com/lib/pq"
)

type Migration struct {
	Name string
	Path string
}

func main() {
	// Initialize database
	cfg := config.Load()
	db, err := database.Init(cfg.Database)
	if err != nil {
		log.Fatal("Failed to initialize database:", err)
	}
	defer db.Close()

	// Создаем таблицу для отслеживания миграций
	if err := createMigrationsTable(db); err != nil {
		log.Fatal("Failed to create migrations table:", err)
	}

	// Получаем список примененных миграций
	appliedMigrations, err := getAppliedMigrations(db)
	if err != nil {
		log.Fatal("Failed to get applied migrations:", err)
	}

	// Находим все файлы миграций
	migrationFiles, err := findMigrationFiles("./migrations")
	if err != nil {
		log.Fatal("Failed to find migration files:", err)
	}

	// Применяем миграции
	if err := applyMigrations(db, migrationFiles, appliedMigrations); err != nil {
		log.Fatal("Failed to apply migrations:", err)
	}

	log.Println("Migrations applied successfully!")
}

func createMigrationsTable(db *sql.DB) error {
	_, err := db.Exec(`
        CREATE TABLE IF NOT EXISTS migrations (
            id SERIAL PRIMARY KEY,
            name VARCHAR(255) NOT NULL UNIQUE,
            applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `)
	return err
}

func getAppliedMigrations(db *sql.DB) (map[string]bool, error) {
	rows, err := db.Query("SELECT name FROM migrations ORDER BY id")
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	applied := make(map[string]bool)
	for rows.Next() {
		var name string
		if err := rows.Scan(&name); err != nil {
			return nil, err
		}
		applied[name] = true
	}
	return applied, nil
}

func findMigrationFiles(migrationsDir string) ([]Migration, error) {
	var migrations []Migration

	files, err := os.ReadDir(migrationsDir)
	if err != nil {
		return nil, err
	}

	for _, file := range files {
		if !file.IsDir() && strings.HasSuffix(file.Name(), ".up.sql") {
			name := strings.TrimSuffix(file.Name(), ".up.sql")
			migrations = append(migrations, Migration{
				Name: name,
				Path: filepath.Join(migrationsDir, file.Name()),
			})
		}
	}

	// Сортируем миграции по имени (000, 001, 002, ...)
	sort.Slice(migrations, func(i, j int) bool {
		return migrations[i].Name < migrations[j].Name
	})

	return migrations, nil
}

func applyMigrations(db *sql.DB, migrations []Migration, applied map[string]bool) error {
	for _, migration := range migrations {
		if applied[migration.Name] {
			log.Printf("Migration %s already applied, skipping", migration.Name)
			continue
		}

		log.Printf("Applying migration: %s", migration.Name)

		// Читаем SQL файл
		content, err := os.ReadFile(migration.Path)
		if err != nil {
			return fmt.Errorf("failed to read migration file %s: %v", migration.Path, err)
		}

		// Выполняем миграцию в транзакции
		tx, err := db.Begin()
		if err != nil {
			return fmt.Errorf("failed to begin transaction for %s: %v", migration.Name, err)
		}

		if _, err := tx.Exec(string(content)); err != nil {
			tx.Rollback()
			return fmt.Errorf("failed to execute migration %s: %v", migration.Name, err)
		}

		// Записываем в таблицу миграций
		if _, err := tx.Exec("INSERT INTO migrations (name) VALUES ($1)", migration.Name); err != nil {
			tx.Rollback()
			return fmt.Errorf("failed to record migration %s: %v", migration.Name, err)
		}

		if err := tx.Commit(); err != nil {
			return fmt.Errorf("failed to commit transaction for %s: %v", migration.Name, err)
		}

		log.Printf("Successfully applied migration: %s", migration.Name)
	}
	return nil
}
