// handlers/sales.go
package handlers

import (
	"database/sql"
	"net/http"
	"store_app/internal/models"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
)

type SalesHandler struct {
	DB *sql.DB
}

func NewSalesHandler(db *sql.DB) *SalesHandler {
	return &SalesHandler{DB: db}
}

// GetSales возвращает все продажи
func (h *SalesHandler) GetSales(c *gin.Context) {
	rows, err := h.DB.Query(`
        SELECT s.id, s.warehouse_id, s.quantity, s.amount, s.sale_date
        FROM sales s
        ORDER BY s.sale_date DESC
    `)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.APIResponse{
			Success: false,
			Error:   "Ошибка получения продаж",
		})
		return
	}
	defer rows.Close()

	var sales []models.Sale
	for rows.Next() {
		var sale models.Sale
		if err := rows.Scan(&sale.ID, &sale.WarehouseID, &sale.Quantity, &sale.Amount, &sale.SaleDate); err != nil {
			continue
		}
		sales = append(sales, sale)
	}

	c.JSON(http.StatusOK, models.APIResponse{
		Success: true,
		Data:    sales,
	})
}

// CreateSale создает новую продажу
func (h *SalesHandler) CreateSale(c *gin.Context) {
	var req struct {
		WarehouseID int `json:"warehouse_id" binding:"required"`
		Quantity    int `json:"quantity" binding:"required,min=1"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, models.APIResponse{
			Success: false,
			Error:   "Неверный формат данных",
		})
		return
	}

	tx, err := h.DB.Begin()
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.APIResponse{
			Success: false,
			Error:   "Ошибка начала транзакции",
		})
		return
	}

	// Проверяем наличие товара
	var currentQuantity int
	var productPrice float64
	err = tx.QueryRow(
		"SELECT quantity, amount FROM warehouses WHERE id = $1 FOR UPDATE",
		req.WarehouseID,
	).Scan(&currentQuantity, &productPrice)

	if err != nil {
		tx.Rollback()
		if err == sql.ErrNoRows {
			c.JSON(http.StatusNotFound, models.APIResponse{
				Success: false,
				Error:   "Товар не найден",
			})
		} else {
			c.JSON(http.StatusInternalServerError, models.APIResponse{
				Success: false,
				Error:   "Ошибка проверки товара",
			})
		}
		return
	}

	if currentQuantity < req.Quantity {
		tx.Rollback()
		c.JSON(http.StatusBadRequest, models.APIResponse{
			Success: false,
			Error:   "Недостаточно товара на складе",
		})
		return
	}

	amount := productPrice * float64(req.Quantity)
	var saleID int
	err = tx.QueryRow(
		"INSERT INTO sales (warehouse_id, quantity, amount, sale_date) VALUES ($1, $2, $3, $4) RETURNING id",
		req.WarehouseID, req.Quantity, amount, time.Now(),
	).Scan(&saleID)

	if err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, models.APIResponse{
			Success: false,
			Error:   "Ошибка создания продажи",
		})
		return
	}

	// Обновляем количество товара
	_, err = tx.Exec(
		"UPDATE warehouses SET quantity = quantity - $1 WHERE id = $2",
		req.Quantity, req.WarehouseID,
	)
	if err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, models.APIResponse{
			Success: false,
			Error:   "Ошибка обновления количества товара",
		})
		return
	}

	if err := tx.Commit(); err != nil {
		c.JSON(http.StatusInternalServerError, models.APIResponse{
			Success: false,
			Error:   "Ошибка коммита транзакции",
		})
		return
	}

	// Получаем созданную продажу для ответа
	var sale models.Sale
	h.DB.QueryRow(
		"SELECT id, warehouse_id, quantity, amount, sale_date FROM sales WHERE id = $1",
		saleID,
	).Scan(&sale.ID, &sale.WarehouseID, &sale.Quantity, &sale.Amount, &sale.SaleDate)

	c.JSON(http.StatusCreated, models.APIResponse{
		Success: true,
		Data:    sale,
		Message: "Продажа успешно создана",
	})
}

// DeleteSale удаляет продажу
func (h *SalesHandler) DeleteSale(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, models.APIResponse{
			Success: false,
			Error:   "Неверный ID продажи",
		})
		return
	}

	tx, err := h.DB.Begin()
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.APIResponse{
			Success: false,
			Error:   "Ошибка начала транзакции",
		})
		return
	}

	var warehouseID, quantity int
	err = tx.QueryRow(
		"SELECT warehouse_id, quantity FROM sales WHERE id = $1 FOR UPDATE",
		id,
	).Scan(&warehouseID, &quantity)

	if err != nil {
		tx.Rollback()
		if err == sql.ErrNoRows {
			c.JSON(http.StatusNotFound, models.APIResponse{
				Success: false,
				Error:   "Продажа не найдена",
			})
		} else {
			c.JSON(http.StatusInternalServerError, models.APIResponse{
				Success: false,
				Error:   "Ошибка получения данных продажи",
			})
		}
		return
	}

	// Удаляем продажу
	_, err = tx.Exec("DELETE FROM sales WHERE id = $1", id)
	if err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, models.APIResponse{
			Success: false,
			Error:   "Ошибка удаления продажи",
		})
		return
	}

	// Возвращаем товар на склад
	_, err = tx.Exec(
		"UPDATE warehouses SET quantity = quantity + $1 WHERE id = $2",
		quantity, warehouseID,
	)
	if err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, models.APIResponse{
			Success: false,
			Error:   "Ошибка возврата товара",
		})
		return
	}

	if err := tx.Commit(); err != nil {
		c.JSON(http.StatusInternalServerError, models.APIResponse{
			Success: false,
			Error:   "Ошибка коммита транзакции",
		})
		return
	}

	c.JSON(http.StatusOK, models.APIResponse{
		Success: true,
		Message: "Продажа успешно удалена",
	})
}
