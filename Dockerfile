FROM golang:1.24-alpine AS builder

WORKDIR /app

# Копируем файлы модулей
COPY go.mod go.sum ./
RUN go mod download

# Копируем исходный код
COPY . .

# Собираем приложение
RUN CGO_ENABLED=0 GOOS=linux go build -o main ./cmd/api/

# Финальный образ
FROM alpine:latest

RUN apk --no-cache add ca-certificates

WORKDIR /root/

# Копируем бинарник из builder stage
COPY --from=builder /app/main .

# Копируем миграции (если нужно)
COPY migrations ./migrations

# Экспозим порт
EXPOSE 8080

# Запускаем приложение
CMD ["./main"]