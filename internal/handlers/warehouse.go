// handlers/warehouses.go
package handlers

import (
	"database/sql"
	"net/http"
	"store_app/internal/models"
	"strconv"

	"github.com/gin-gonic/gin"
)

type WarehousesHandler struct {
	DB *sql.DB
}

func NewWarehousesHandler(db *sql.DB) *WarehousesHandler {
	return &WarehousesHandler{DB: db}
}

// GetWarehouses возвращает все товары
func (h *WarehousesHandler) GetWarehouses(c *gin.Context) {
	rows, err := h.DB.Query(`
        SELECT id, name, quantity, amount 
        FROM warehouses 
        ORDER BY id
    `)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.APIResponse{
			Success: false,
			Error:   "Ошибка получения товаров",
		})
		return
	}
	defer rows.Close()

	var warehouses []models.Warehouse
	for rows.Next() {
		var w models.Warehouse
		if err := rows.Scan(&w.ID, &w.Name, &w.Quantity, &w.Amount); err != nil {
			continue
		}
		warehouses = append(warehouses, w)
	}

	c.JSON(http.StatusOK, models.APIResponse{
		Success: true,
		Data:    warehouses,
	})
}

// GetWarehouse возвращает товар по ID
func (h *WarehousesHandler) GetWarehouse(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, models.APIResponse{
			Success: false,
			Error:   "Неверный ID товара",
		})
		return
	}

	var warehouse models.Warehouse
	err = h.DB.QueryRow(
		"SELECT id, name, quantity, amount FROM warehouses WHERE id = $1",
		id,
	).Scan(&warehouse.ID, &warehouse.Name, &warehouse.Quantity, &warehouse.Amount)

	if err != nil {
		if err == sql.ErrNoRows {
			c.JSON(http.StatusNotFound, models.APIResponse{
				Success: false,
				Error:   "Товар не найден",
			})
		} else {
			c.JSON(http.StatusInternalServerError, models.APIResponse{
				Success: false,
				Error:   "Ошибка получения товара",
			})
		}
		return
	}

	c.JSON(http.StatusOK, models.APIResponse{
		Success: true,
		Data:    warehouse,
	})
}

// CreateWarehouse создает новый товар
func (h *WarehousesHandler) CreateWarehouse(c *gin.Context) {
	var warehouse models.Warehouse
	if err := c.ShouldBindJSON(&warehouse); err != nil {
		c.JSON(http.StatusBadRequest, models.APIResponse{
			Success: false,
			Error:   "Неверный формат данных",
		})
		return
	}

	var id int
	err := h.DB.QueryRow(
		"INSERT INTO warehouses (name, quantity, amount) VALUES ($1, $2, $3) RETURNING id",
		warehouse.Name, warehouse.Quantity, warehouse.Amount,
	).Scan(&id)

	if err != nil {
		c.JSON(http.StatusInternalServerError, models.APIResponse{
			Success: false,
			Error:   "Ошибка создания товара",
		})
		return
	}

	warehouse.ID = id
	c.JSON(http.StatusCreated, models.APIResponse{
		Success: true,
		Data:    warehouse,
		Message: "Товар успешно создан",
	})
}

// UpdateWarehouse обновляет товар
func (h *WarehousesHandler) UpdateWarehouse(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, models.APIResponse{
			Success: false,
			Error:   "Неверный ID товара",
		})
		return
	}

	var warehouse models.Warehouse
	if err := c.ShouldBindJSON(&warehouse); err != nil {
		c.JSON(http.StatusBadRequest, models.APIResponse{
			Success: false,
			Error:   "Неверный формат данных",
		})
		return
	}

	result, err := h.DB.Exec(
		"UPDATE warehouses SET name = $1, quantity = $2, amount = $3 WHERE id = $4",
		warehouse.Name, warehouse.Quantity, warehouse.Amount, id,
	)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.APIResponse{
			Success: false,
			Error:   "Ошибка обновления товара",
		})
		return
	}

	rowsAffected, _ := result.RowsAffected()
	if rowsAffected == 0 {
		c.JSON(http.StatusNotFound, models.APIResponse{
			Success: false,
			Error:   "Товар не найден",
		})
		return
	}

	warehouse.ID = id
	c.JSON(http.StatusOK, models.APIResponse{
		Success: true,
		Data:    warehouse,
		Message: "Товар успешно обновлен",
	})
}

// DeleteWarehouse удаляет товар
func (h *WarehousesHandler) DeleteWarehouse(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, models.APIResponse{
			Success: false,
			Error:   "Неверный ID товара",
		})
		return
	}

	result, err := h.DB.Exec("DELETE FROM warehouses WHERE id = $1", id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.APIResponse{
			Success: false,
			Error:   "Ошибка удаления товара",
		})
		return
	}

	rowsAffected, _ := result.RowsAffected()
	if rowsAffected == 0 {
		c.JSON(http.StatusNotFound, models.APIResponse{
			Success: false,
			Error:   "Товар не найден",
		})
		return
	}

	c.JSON(http.StatusOK, models.APIResponse{
		Success: true,
		Message: "Товар успешно удален",
	})
}
