package main

import (
	"log"
	"store_app/internal/database"
	"store_app/internal/router"
)

func main() {
	// Initialize database
	if err := database.Init(); err != nil {
		log.Fatal("Failed to initialize database:", err)
	}
	// Setup router
	router := router.SetupRouter(database.DB)

	log.Println("Server starting on :8080")
	if err := router.Run(":8080"); err != nil {
		log.Fatal("Failed to start server:", err)
	}
}
