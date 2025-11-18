// handlers/charges.go
package handlers

import (
	"database/sql"
	"net/http"
	"store_app/internal/models"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
)

type ChargesHandler struct {
	DB *sql.DB
}

func NewChargesHandler(db *sql.DB) *ChargesHandler {
	return &ChargesHandler{DB: db}
}

// GetCharges возвращает все расходы
func (h *ChargesHandler) GetCharges(c *gin.Context) {
	rows, err := h.DB.Query(`
        SELECT c.id, c.expense_item_id, c.amount, c.charge_date
        FROM charges c
        ORDER BY c.charge_date DESC
    `)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.APIResponse{
			Success: false,
			Error:   "Ошибка получения расходов",
		})
		return
	}
	defer rows.Close()

	var charges []models.Charge
	for rows.Next() {
		var charge models.Charge
		if err := rows.Scan(&charge.ID, &charge.ExpenseItemID, &charge.Amount, &charge.ChargeDate); err != nil {
			continue
		}
		charges = append(charges, charge)
	}

	c.JSON(http.StatusOK, models.APIResponse{
		Success: true,
		Data:    charges,
	})
}

// CreateCharge создает новый расход
func (h *ChargesHandler) CreateCharge(c *gin.Context) {
	var req struct {
		ExpenseItemID int     `json:"expense_item_id" binding:"required"`
		Amount        float64 `json:"amount" binding:"required,min=0"`
	}

	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, models.APIResponse{
			Success: false,
			Error:   "Неверный формат данных",
		})
		return
	}

	var chargeID int
	err := h.DB.QueryRow(
		"INSERT INTO charges (expense_item_id, amount, charge_date) VALUES ($1, $2, $3) RETURNING id",
		req.ExpenseItemID, req.Amount, time.Now(),
	).Scan(&chargeID)

	if err != nil {
		c.JSON(http.StatusInternalServerError, models.APIResponse{
			Success: false,
			Error:   "Ошибка создания расхода",
		})
		return
	}

	// Получаем созданный расход для ответа
	var charge models.Charge
	h.DB.QueryRow(
		"SELECT id, expense_item_id, amount, charge_date FROM charges WHERE id = $1",
		chargeID,
	).Scan(&charge.ID, &charge.ExpenseItemID, &charge.Amount, &charge.ChargeDate)

	c.JSON(http.StatusCreated, models.APIResponse{
		Success: true,
		Data:    charge,
		Message: "Расход успешно создан",
	})
}

// DeleteCharge удаляет расход
func (h *ChargesHandler) DeleteCharge(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		c.JSON(http.StatusBadRequest, models.APIResponse{
			Success: false,
			Error:   "Неверный ID расхода",
		})
		return
	}

	result, err := h.DB.Exec("DELETE FROM charges WHERE id = $1", id)
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.APIResponse{
			Success: false,
			Error:   "Ошибка удаления расхода",
		})
		return
	}

	rowsAffected, _ := result.RowsAffected()
	if rowsAffected == 0 {
		c.JSON(http.StatusNotFound, models.APIResponse{
			Success: false,
			Error:   "Расход не найден",
		})
		return
	}

	c.JSON(http.StatusOK, models.APIResponse{
		Success: true,
		Message: "Расход успешно удален",
	})
}
