package main

import (
	"fmt"
	"log"
	"store_app/internal/config"
	"store_app/internal/database"
)

func main() {
	// Initialize database
	cfg := config.Load()
	db, err := database.Init(cfg.Database)
	if err != nil {
		log.Fatal("Failed to initialize database:", err)
	}
	defer db.Close()

	fmt.Println("=== CHECKING EXISTING USERS ===")

	rows, err := db.Query("SELECT id, username, password, role FROM users")
	if err != nil {
		log.Printf("Error querying users: %v", err)
		return
	}
	defer rows.Close()

	var count int
	for rows.Next() {
		var id int
		var username, password, role string
		if err := rows.Scan(&id, &username, &password, &role); err != nil {
			log.Printf("Error scanning user: %v", err)
			continue
		}
		fmt.Printf("User %d: %s (role: %s)\n", id, username, role)
		fmt.Printf("Password hash: %s\n", password)
		fmt.Printf("Hash length: %d characters\n\n", len(password))
		count++
	}

	if count == 0 {
		fmt.Println("❌ No users found in database!")
	} else {
		fmt.Printf("✅ Found %d users\n", count)
	}
}
