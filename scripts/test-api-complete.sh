#!/bin/bash

echo "=== SPbPU Store API Comprehensive Test ==="
echo

BASE_URL="http://localhost:8080/api/v1"
TOKEN=""
ADMIN_LOGIN=admin
ADMIN_PASSWORD=admin123

# Функция для выполнения запросов
make_request() {
    local method=$1
    local endpoint=$2
    local data=$3
    local auth=$4
    
    if [ "$auth" = "true" ] && [ -n "$TOKEN" ]; then
        if [ -n "$data" ]; then
            curl -s -X $method "$BASE_URL$endpoint" \
                -H "Content-Type: application/json" \
                -H "Authorization: Bearer $TOKEN" \
                -d "$data"
        else
            curl -s -X $method "$BASE_URL$endpoint" \
                -H "Authorization: Bearer $TOKEN"
        fi
    else
        if [ -n "$data" ]; then
            curl -s -X $method "$BASE_URL$endpoint" \
                -H "Content-Type: application/json" \
                -d "$data"
        else
            curl -s -X $method "$BASE_URL$endpoint"
        fi
    fi
}

# Проверка доступности сервера
echo "1. Testing server availability..."
response=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/auth/login")
if [ "$response" != "200" ] && [ "$response" != "404" ] && [ "$response" != "400" ]; then
    echo "❌ Server is not responding (HTTP $response)"
    echo "Please make sure the API server is running on localhost:8080"
    exit 1
fi
echo "✅ Server is responding"

echo
echo "2. Testing authentication..."
# Тестируем логин с неверными данными
echo "   - Testing login with invalid credentials..."
login_response=$(make_request "POST" "/auth/login" '{"username":"wrong","password":"wrong"}')
echo "     Response: $login_response"

# Тестируем логин с правильными данными (предполагая стандартные)
echo "   - Testing login with admin credentials..."
login_response=$(make_request "POST" "/auth/login" "{\"username\":\"$ADMIN_LOGIN\",\"password\":\"$ADMIN_PASSWORD\"}")
echo "     Response: $login_response"

# Извлекаем токен
TOKEN=$(echo $login_response | grep -o '"token":"[^"]*' | cut -d'"' -f4)
if [ -n "$TOKEN" ]; then
    echo "   ✅ Successfully obtained JWT token"
else
    echo "   ❌ Failed to obtain token, testing public endpoints only"
fi

echo
echo "3. Testing profile endpoint..."
if [ -n "$TOKEN" ]; then
    profile_response=$(make_request "GET" "/auth/profile" "" "true")
    echo "   Profile: $profile_response"
else
    echo "   Skipped - no token"
fi

echo
echo "4. Testing warehouses endpoints..."
if [ -n "$TOKEN" ]; then
    # Получить все товары
    echo "   - Getting all warehouses..."
    warehouses_response=$(make_request "GET" "/warehouses" "" "true")
    echo "     Response: $warehouses_response"
    
    # Создать новый товар
    echo "   - Creating new warehouse item..."
    new_warehouse_response=$(make_request "POST" "/warehouses" '{"name":"Test Product","quantity":100,"amount":999.99}' "true")
    echo "     Response: $new_warehouse_response"
    
    # Извлекаем ID созданного товара
    WAREHOUSE_ID=$(echo $new_warehouse_response | grep -o '"id":\d*' | cut -d':' -f2 | head -1)
    if [ -n "$WAREHOUSE_ID" ]; then
        echo "   ✅ Created warehouse item with ID: $WAREHOUSE_ID"
        
        # Получить товар по ID
        echo "   - Getting warehouse by ID..."
        warehouse_by_id=$(make_request "GET" "/warehouses/$WAREHOUSE_ID" "" "true")
        echo "     Response: $warehouse_by_id"
    fi
else
    echo "   Skipped - no token"
fi

echo
echo "5. Testing sales endpoints..."
if [ -n "$TOKEN" ] && [ -n "$WAREHOUSE_ID" ]; then
    # Получить все продажи
    echo "   - Getting all sales..."
    sales_response=$(make_request "GET" "/sales" "" "true")
    echo "     Response: $sales_response"
    
    # Создать продажу
    echo "   - Creating sale..."
    sale_response=$(make_request "POST" "/sales" "{\"warehouse_id\":$WAREHOUSE_ID,\"quantity\":5}" "true")
    echo "     Response: $sale_response"
    
    # Извлекаем ID продажи
    SALE_ID=$(echo $sale_response | grep -o '"id":\d*' | cut -d':' -f2 | head -1)
    if [ -n "$SALE_ID" ]; then
        echo "   ✅ Created sale with ID: $SALE_ID"
    fi
else
    echo "   Skipped - no token or warehouse ID"
fi

echo
echo "6. Testing expense items endpoints..."
if [ -n "$TOKEN" ]; then
    # Получить все статьи расходов
    echo "   - Getting all expense items..."
    expense_items_response=$(make_request "GET" "/expense-items" "" "true")
    echo "     Response: $expense_items_response"
    
    # Создать статью расходов
    echo "   - Creating expense item..."
    expense_item_response=$(make_request "POST" "/expense-items" '{"name":"Test Expense Item"}' "true")
    echo "     Response: $expense_item_response"
    
    # Извлекаем ID статьи расходов
    EXPENSE_ITEM_ID=$(echo $expense_item_response | grep -o '"id":\d*' | cut -d':' -f2 | head -1)
    if [ -n "$EXPENSE_ITEM_ID" ]; then
        echo "   ✅ Created expense item with ID: $EXPENSE_ITEM_ID"
    fi
else
    echo "   Skipped - no token"
fi

echo
echo "7. Testing charges endpoints..."
if [ -n "$TOKEN" ] && [ -n "$EXPENSE_ITEM_ID" ]; then
    # Получить все расходы
    echo "   - Getting all charges..."
    charges_response=$(make_request "GET" "/charges" "" "true")
    echo "     Response: $charges_response"
    
    # Создать расход
    echo "   - Creating charge..."
    charge_response=$(make_request "POST" "/charges" "{\"expense_item_id\":$EXPENSE_ITEM_ID,\"amount\":500.50}" "true")
    echo "     Response: $charge_response"
    
    # Извлекаем ID расхода
    CHARGE_ID=$(echo $charge_response | grep -o '"id":\d*' | cut -d':' -f2 | head -1)
    if [ -n "$CHARGE_ID" ]; then
        echo "   ✅ Created charge with ID: $CHARGE_ID"
    fi
else
    echo "   Skipped - no token or expense item ID"
fi

echo
echo "=== Test completed ==="