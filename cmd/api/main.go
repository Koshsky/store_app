package main

import (
	"log"
	"store_app/internal/config"
	"store_app/internal/database"
	"store_app/internal/router"
)

func main() {
	// Initialize database
	cfg := config.Load()
	db, err := database.Init(cfg.Database)
	if err != nil {
		log.Fatal("Failed to initialize database:", err)
	}
	defer db.Close()

	resetUsers(db)

	// Setup router
	router := router.SetupRouter(db)

	log.Println("Server starting on :8080")
	if err := router.Run(":8080"); err != nil {
		log.Fatal("Failed to start server:", err)
	}
}
