// internal/router/router.go
package router

import (
	"database/sql"
	"store_app/internal/handlers"
	"store_app/internal/middleware"

	"github.com/gin-gonic/gin"
)

func SetupRouter(db *sql.DB) *gin.Engine {
	r := gin.Default()

	r.GET("/health", func(c *gin.Context) {
		if err := db.Ping(); err != nil {
			c.JSON(500, gin.H{"status": "unhealthy", "error": err.Error()})
			return
		}
		c.JSON(200, gin.H{"status": "healthy"})
	})

	authHandler := handlers.NewAuthHandler(db)
	warehousesHandler := handlers.NewWarehousesHandler(db)
	salesHandler := handlers.NewSalesHandler(db)
	chargesHandler := handlers.NewChargesHandler(db)
	expenseItemsHandler := handlers.NewExpenseItemsHandler(db)

	// API routes
	api := r.Group("/api/v1")
	{
		// Public routes
		api.POST("/auth/login", authHandler.Login)

		// Protected routes
		auth := api.Group("")
		auth.Use(middleware.AuthMiddleware())
		{
			// Auth
			auth.GET("/auth/profile", authHandler.Profile)

			// Warehouses (товары)
			auth.GET("/warehouses", warehousesHandler.GetWarehouses)
			auth.GET("/warehouses/:id", warehousesHandler.GetWarehouse)
			auth.POST("/warehouses", warehousesHandler.CreateWarehouse)
			auth.PUT("/warehouses/:id", warehousesHandler.UpdateWarehouse)
			auth.DELETE("/warehouses/:id", warehousesHandler.DeleteWarehouse)

			// Sales (продажи)
			auth.GET("/sales", salesHandler.GetSales)
			auth.POST("/sales", salesHandler.CreateSale)
			auth.DELETE("/sales/:id", salesHandler.DeleteSale)

			// Charges (расходы)
			auth.GET("/charges", chargesHandler.GetCharges)
			auth.POST("/charges", chargesHandler.CreateCharge)
			auth.DELETE("/charges/:id", chargesHandler.DeleteCharge)

			// Expense Items (статьи расходов)
			auth.GET("/expense-items", expenseItemsHandler.GetExpenseItems)
			auth.POST("/expense-items", expenseItemsHandler.CreateExpenseItem)
			auth.DELETE("/expense-items/:id", expenseItemsHandler.DeleteExpenseItem)
		}
	}

	return r
}
