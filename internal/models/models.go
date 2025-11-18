// models/models.go
package models

import (
	"time"
)

type User struct {
	ID       int    `json:"id"`
	Username string `json:"username"`
	Password string `json:"-"`
	Role     string `json:"role"`
}

type Warehouse struct {
	ID       int     `json:"id"`
	Name     string  `json:"name"`
	Quantity int     `json:"quantity"`
	Amount   float64 `json:"amount"`
}

type Sale struct {
	ID          int       `json:"id"`
	WarehouseID int       `json:"warehouse_id"`
	Quantity    int       `json:"quantity"`
	Amount      float64   `json:"amount"`
	SaleDate    time.Time `json:"sale_date"`
}

type Charge struct {
	ID            int       `json:"id"`
	ExpenseItemID int       `json:"expense_item_id"`
	Amount        float64   `json:"amount"`
	ChargeDate    time.Time `json:"charge_date"`
}

type ExpenseItem struct {
	ID   int    `json:"id"`
	Name string `json:"name"`
}

type APIResponse struct {
	Success bool        `json:"success"`
	Data    interface{} `json:"data,omitempty"`
	Error   string      `json:"error,omitempty"`
	Message string      `json:"message,omitempty"`
}

type LoginRequest struct {
	Username string `json:"username" binding:"required"`
	Password string `json:"password" binding:"required"`
}

type LoginResponse struct {
	Token   string `json:"token"`
	User    User   `json:"user"`
	Message string `json:"message"`
}
