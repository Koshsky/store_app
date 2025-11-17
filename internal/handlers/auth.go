// handlers/auth.go
package handlers

import (
	"database/sql"
	"net/http"
	"store_app/internal/config"
	"store_app/internal/models"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v4"
	"golang.org/x/crypto/bcrypt"
)

type AuthHandler struct {
	DB *sql.DB
}

func NewAuthHandler(db *sql.DB) *AuthHandler {
	return &AuthHandler{DB: db}
}

func (h *AuthHandler) Login(c *gin.Context) {
	var loginReq models.LoginRequest
	if err := c.ShouldBindJSON(&loginReq); err != nil {
		c.JSON(http.StatusBadRequest, models.APIResponse{
			Success: false,
			Error:   "Неверный формат данных",
		})
		return
	}

	var user models.User
	err := h.DB.QueryRow(
		"SELECT id, username, password, role FROM users WHERE username = $1",
		loginReq.Username,
	).Scan(&user.ID, &user.Username, &user.Password, &user.Role)

	if err != nil {
		c.JSON(http.StatusUnauthorized, models.APIResponse{
			Success: false,
			Error:   "Неверные учетные данные",
		})
		return
	}

	err = bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(loginReq.Password))
	if err != nil {
		c.JSON(http.StatusUnauthorized, models.APIResponse{
			Success: false,
			Error:   "Неверные учетные данные",
		})
		return
	}

	cfg := config.Load()
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.MapClaims{
		"username": user.Username,
		"role":     user.Role,
		"exp":      time.Now().Add(24 * time.Hour).Unix(),
	})

	tokenString, err := token.SignedString([]byte(cfg.JWTSecret))
	if err != nil {
		c.JSON(http.StatusInternalServerError, models.APIResponse{
			Success: false,
			Error:   "Ошибка авторизации",
		})
		return
	}

	c.JSON(http.StatusOK, models.LoginResponse{
		Token:   tokenString,
		User:    user,
		Message: "Авторизация успешна",
	})
}

func (h *AuthHandler) Profile(c *gin.Context) {
	username, _ := c.Get("username")
	role, _ := c.Get("role")

	c.JSON(http.StatusOK, models.APIResponse{
		Success: true,
		Data: gin.H{
			"username": username,
			"role":     role,
		},
	})
}
