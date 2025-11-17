package main

import (
	"database/sql"
	"fmt"
	"log"

	"golang.org/x/crypto/bcrypt"
)

func resetUsers(db *sql.DB) {
	_, err := db.Exec("DELETE FROM users")
	if err != nil {
		log.Printf("Error deleting users: %v", err)
	} else {
		fmt.Println("✅ Existing users deleted")
	}

	// Создаем новых пользователей
	users := []struct {
		username string
		password string
		role     string
	}{
		{"admin", "admin123", "admin"},
		{"user", "user123", "user"},
	}

	for _, u := range users {
		hashedPassword, err := bcrypt.GenerateFromPassword([]byte(u.password), bcrypt.DefaultCost)
		if err != nil {
			log.Printf("Error hashing password for %s: %v", u.username, err)
			continue
		}

		_, err = db.Exec(`
            INSERT INTO users (username, password, role) 
            VALUES ($1, $2, $3)`,
			u.username, string(hashedPassword), u.role,
		)

		if err != nil {
			log.Printf("Error creating user %s: %v", u.username, err)
		} else {
			fmt.Printf("✅ User %s created with password '%s'\n", u.username, u.password)
			fmt.Printf("   Hash: %s\n", string(hashedPassword))
		}
	}

	fmt.Println("=== USER RESET COMPLETE ===")
}
