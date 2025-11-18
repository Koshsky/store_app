package config

import (
	"fmt"
	"os"
	"strconv"
)

// DatabaseConfig содержит настройки базы данных
type DatabaseConfig struct {
	Host     string
	Port     string
	User     string
	Password string
	Name     string
}

// ServerConfig содержит настройки сервера
type ServerConfig struct {
	Port string
}

// WebServerConfig содержит настройки веб-сервера
type WebServerConfig struct {
	Port      string
	StaticDir string
	Enable    bool
}

// Config основная структура конфигурации
type Config struct {
	Database  DatabaseConfig
	ApiServer ServerConfig
	WebServer WebServerConfig
	JWTSecret string
}

// Load загружает конфигурацию из переменных окружения
func Load() *Config {
	return &Config{
		Database: DatabaseConfig{
			Host:     getEnv("DB_HOST", "localhost"),
			Port:     getEnv("DB_PORT", "5432"),
			User:     getEnv("DB_USER", "postgres"),
			Password: getEnv("DB_PASSWORD", "postgres"),
			Name:     getEnv("DB_NAME", "spbpu_shop"),
		},
		ApiServer: ServerConfig{
			Port: getEnv("API_SERVER_PORT", "8080"),
		},
		WebServer: WebServerConfig{
			Port:      getEnv("WEB_SERVER_PORT", "8081"),
			StaticDir: getEnv("WEB_STATIC_DIR", "./web/static"),
			Enable:    getEnvBool("WEB_SERVER_ENABLE", true),
		},
		JWTSecret: getEnv("JWT_SECRET", "Z6w3uwI5Bx9btGcB9dtkShcGVaQAHVe/Ljg1a7tIKhE="),
	}
}

func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}

func getEnvBool(key string, defaultValue bool) bool {
	if value := os.Getenv(key); value != "" {
		result, err := strconv.ParseBool(value)
		if err == nil {
			return result
		}
	}
	return defaultValue
}

// GetDBConnectionString возвращает строку подключения к БД
func (c *DatabaseConfig) GetDBConnectionString() string {
	return fmt.Sprintf("host=%s port=%s user=%s password=%s dbname=%s sslmode=disable",
		c.Host, c.Port, c.User, c.Password, c.Name)
}

// GetAPIAddress возвращает адрес API сервера
func (c *Config) GetAPIAddress() string {
	return ":" + c.ApiServer.Port
}

// GetWebAddress возвращает адрес веб-сервера
func (c *Config) GetWebAddress() string {
	return ":" + c.WebServer.Port
}
