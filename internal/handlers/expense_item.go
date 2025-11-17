// handlers/expense_items.go
package handlers

import (
	"database/sql"
	"net/http"
	"store_app/internal/models"
	"strconv"

	"github.com/gin-gonic/gin"
)

type ExpenseItemsHandler struct {
	DB *sql.DB
}

func NewExpenseItemsHandler(db *sql.DB) *ExpenseItemsHandler {
	return &ExpenseItemsHandler{DB: db}
}

// GetExpenseItems возвращает все статьи расходов
func (h *ExpenseItemsHandler) GetExpenseItems(c *gin.Context) {
	rows, err := h.DB.Query(`
        SELECT id, name 
        FROM expense_items 
        ORDER BY id
    `)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.APIResponse{
			Success: false,
			Error:   "Ошибка получения статей расходов",
		})
		return
	}
	defer rows.Close()

	var expenseItems []models.ExpenseItem
	for rows.Next() {
		var item models.ExpenseItem
		if err := rows.Scan(&item.ID, &item.Name); err != nil {
			continue
		}
		expenseItems = append(expenseItems, item)
	}

	c.JSON(http.StatusOK, models.APIResponse{
		Success: true,
		Data:    expenseItems,
	})
}

// CreateExpenseItem создает новую статью расходов
func (h *ExpenseItemsHandler) CreateExpenseItem(c *gin.Context) {
	var req struct {
		Name string `json:"name" binding:"required"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, models.APIResponse{
			Success: false,
			Error:   "Неверный формат данных",
		})
		return
	}

	var id int
	err := h.DB.QueryRow(
		"INSERT INTO expense_items (name) VALUES ($1) RETURNING id",
		req.Name,
	).Scan(&id)

	if err != nil {
		c.JSON(http.StatusInternalServerError, models.APIResponse{
			Success: false,
			Error:   "Ошибка создания статьи расходов",
		})
		return
	}

	c.JSON(http.StatusCreated, models.APIResponse{
		Success: true,
		Data: models.ExpenseItem{
			ID:   id,
			Name: req.Name,
		},
		Message: "Статья расходов успешно создана",
	})
}

// DeleteExpenseItem удаляет статью расходов
func (h *ExpenseItemsHandler) DeleteExpenseItem(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, models.APIResponse{
			Success: false,
			Error:   "Неверный ID статьи расходов",
		})
		return
	}

	result, err := h.DB.Exec("DELETE FROM expense_items WHERE id = $1", id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.APIResponse{
			Success: false,
			Error:   "Ошибка удаления статьи расходов",
		})
		return
	}

	rowsAffected, _ := result.RowsAffected()
	if rowsAffected == 0 {
		c.JSON(http.StatusNotFound, models.APIResponse{
			Success: false,
			Error:   "Статья расходов не найдена",
		})
		return
	}

	c.JSON(http.StatusOK, models.APIResponse{
		Success: true,
		Message: "Статья расходов успешно удалена",
	})
}
