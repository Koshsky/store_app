// handlers/reports.go
package handlers

import (
	"database/sql"
	"net/http"
	"store_app/internal/models"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
)

type ReportsHandler struct {
	DB *sql.DB
}

func NewReportsHandler(db *sql.DB) *ReportsHandler {
	return &ReportsHandler{DB: db}
}

// GetProfitReport возвращает отчет по прибыли за месяц
func (h *ReportsHandler) GetProfitReport(c *gin.Context) {
	month := c.Query("month")
	year := c.Query("year")

	if month == "" || year == "" {
		c.JSON(http.StatusBadRequest, models.APIResponse{
			Success: false,
			Error:   "Не указаны месяц и год",
		})
		return
	}

	// Преобразуем параметры в числа
	monthInt, err := strconv.Atoi(month)
	if err != nil || monthInt < 1 || monthInt > 12 {
		c.JSON(http.StatusBadRequest, models.APIResponse{
			Success: false,
			Error:   "Неверный формат месяца",
		})
		return
	}

	yearInt, err := strconv.Atoi(year)
	if err != nil || yearInt < 2000 || yearInt > 2100 {
		c.JSON(http.StatusBadRequest, models.APIResponse{
			Success: false,
			Error:   "Неверный формат года",
		})
		return
	}

	// Рассчитываем начальную и конечную даты месяца
	startDate := time.Date(yearInt, time.Month(monthInt), 1, 0, 0, 0, 0, time.UTC)
	endDate := startDate.AddDate(0, 1, 0).Add(-time.Nanosecond)

	// Считаем доход от продаж за месяц
	var revenue float64
	err = h.DB.QueryRow(`
		SELECT COALESCE(SUM(amount), 0) 
		FROM sales 
		WHERE sale_date BETWEEN $1 AND $2
	`, startDate, endDate).Scan(&revenue)

	if err != nil {
		c.JSON(http.StatusInternalServerError, models.APIResponse{
			Success: false,
			Error:   "Ошибка расчета дохода",
		})
		return
	}

	// Считаем расходы за месяц
	var expenses float64
	err = h.DB.QueryRow(`
		SELECT COALESCE(SUM(amount), 0) 
		FROM charges 
		WHERE charge_date BETWEEN $1 AND $2
	`, startDate, endDate).Scan(&expenses)

	if err != nil {
		c.JSON(http.StatusInternalServerError, models.APIResponse{
			Success: false,
			Error:   "Ошибка расчета расходов",
		})
		return
	}

	// Рассчитываем прибыль
	profit := revenue - expenses

	c.JSON(http.StatusOK, models.APIResponse{
		Success: true,
		Data: map[string]float64{
			"profit":   profit,
			"revenue":  revenue,
			"expenses": expenses,
		},
	})
}

// GetTopProductsReport возвращает топ-5 товаров по доходу за период
func (h *ReportsHandler) GetTopProductsReport(c *gin.Context) {
	startDateStr := c.Query("start_date")
	endDateStr := c.Query("end_date")

	if startDateStr == "" || endDateStr == "" {
		c.JSON(http.StatusBadRequest, models.APIResponse{
			Success: false,
			Error:   "Не указаны даты начала и окончания",
		})
		return
	}

	// Парсим даты
	startDate, err := time.Parse("2006-01-02", startDateStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, models.APIResponse{
			Success: false,
			Error:   "Неверный формат начальной даты",
		})
		return
	}

	endDate, err := time.Parse("2006-01-02", endDateStr)
	if err != nil {
		c.JSON(http.StatusBadRequest, models.APIResponse{
			Success: false,
			Error:   "Неверный формат конечной даты",
		})
		return
	}

	// Добавляем время к конечной дате, чтобы включить весь день
	endDate = endDate.Add(23*time.Hour + 59*time.Minute + 59*time.Second)

	// Получаем топ-5 товаров по доходу
	rows, err := h.DB.Query(`
		SELECT 
			w.id,
			w.name,
			COALESCE(SUM(s.amount), 0) as revenue
		FROM warehouses w
		LEFT JOIN sales s ON w.id = s.warehouse_id AND s.sale_date BETWEEN $1 AND $2
		GROUP BY w.id, w.name
		ORDER BY revenue DESC
		LIMIT 5
	`, startDate, endDate)

	if err != nil {
		c.JSON(http.StatusInternalServerError, models.APIResponse{
			Success: false,
			Error:   "Ошибка получения топ товаров",
		})
		return
	}
	defer rows.Close()

	var topProducts []map[string]interface{}
	for rows.Next() {
		var productID int
		var productName string
		var revenue float64

		if err := rows.Scan(&productID, &productName, &revenue); err != nil {
			continue
		}

		topProducts = append(topProducts, map[string]interface{}{
			"id":      productID,
			"name":    productName,
			"revenue": revenue,
		})
	}

	c.JSON(http.StatusOK, models.APIResponse{
		Success: true,
		Data:    topProducts,
	})
}
