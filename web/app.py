from flask import (
    Flask,
    render_template,
    request,
    redirect,
    url_for,
    session,
    jsonify,
    flash,
)
import requests
import os
import json
from datetime import datetime, timedelta

app = Flask(__name__)
app.secret_key = os.environ.get("SECRET_KEY", "dev-secret-key-change-in-production")

# Конфигурация API - используем имя сервиса из docker-compose
API_BASE_URL = os.environ.get("API_BASE_URL", "http://localhost:8080/api/v1")


class APIClient:
    def __init__(self, base_url):
        self.base_url = base_url

    def _get_headers(self):
        headers = {}
        if "token" in session:
            headers["Authorization"] = f"Bearer {session['token']}"
        return headers

    def _handle_request(self, method, url, **kwargs):
        try:
            response = method(url, **kwargs, timeout=10)
            print(f"API Request: {url}, Status: {response.status_code}")  # Debug
            print(f"API Response: {response.text}")  # Debug
            return response.json(), response.status_code
        except requests.exceptions.RequestException as e:
            return {"success": False, "error": f"API недоступен: {str(e)}"}, 503
        except ValueError as e:
            return {"success": False, "error": f"Ошибка парсинга JSON: {str(e)}"}, 500

    def login(self, username, password):
        url = f"{self.base_url}/auth/login"
        data = {"username": username, "password": password}
        return self._handle_request(requests.post, url, json=data)

    def get_profile(self):
        url = f"{self.base_url}/auth/profile"
        return self._handle_request(requests.get, url, headers=self._get_headers())

    def get_warehouses(self):
        url = f"{self.base_url}/warehouses"
        return self._handle_request(requests.get, url, headers=self._get_headers())

    def create_warehouse(self, data):
        url = f"{self.base_url}/warehouses"
        return self._handle_request(
            requests.post, url, json=data, headers=self._get_headers()
        )

    def update_warehouse(self, id, data):
        url = f"{self.base_url}/warehouses/{id}"
        return self._handle_request(
            requests.put, url, json=data, headers=self._get_headers()
        )

    def delete_warehouse(self, id):
        url = f"{self.base_url}/warehouses/{id}"
        return self._handle_request(requests.delete, url, headers=self._get_headers())

    def get_expense_items(self):
        url = f"{self.base_url}/expense-items"
        return self._handle_request(requests.get, url, headers=self._get_headers())

    def create_expense_item(self, data):
        url = f"{self.base_url}/expense-items"
        return self._handle_request(
            requests.post, url, json=data, headers=self._get_headers()
        )

    def delete_expense_item(self, id):
        url = f"{self.base_url}/expense-items/{id}"
        return self._handle_request(requests.delete, url, headers=self._get_headers())

    def get_sales(self):
        url = f"{self.base_url}/sales"
        return self._handle_request(requests.get, url, headers=self._get_headers())

    def create_sale(self, data):
        url = f"{self.base_url}/sales"
        return self._handle_request(
            requests.post, url, json=data, headers=self._get_headers()
        )

    def delete_sale(self, id):
        url = f"{self.base_url}/sales/{id}"
        return self._handle_request(requests.delete, url, headers=self._get_headers())

    def get_charges(self):
        url = f"{self.base_url}/charges"
        return self._handle_request(requests.get, url, headers=self._get_headers())

    def create_charge(self, data):
        url = f"{self.base_url}/charges"
        return self._handle_request(
            requests.post, url, json=data, headers=self._get_headers()
        )

    def delete_charge(self, id):
        url = f"{self.base_url}/charges/{id}"
        return self._handle_request(requests.delete, url, headers=self._get_headers())

    def get_profit_report(self, month, year):
        url = f"{self.base_url}/reports/profit"
        params = {"month": month, "year": year}
        return self._handle_request(
            requests.get, url, params=params, headers=self._get_headers()
        )

    def get_top_products(self, start_date, end_date):
        url = f"{self.base_url}/reports/top-products"
        params = {"start_date": start_date, "end_date": end_date}
        return self._handle_request(
            requests.get, url, params=params, headers=self._get_headers()
        )


api_client = APIClient(API_BASE_URL)


def login_required(f):
    def decorated_function(*args, **kwargs):
        if "token" not in session:
            return redirect(url_for("login"))
        return f(*args, **kwargs)

    decorated_function.__name__ = f.__name__
    return decorated_function


def admin_required(f):
    def decorated_function(*args, **kwargs):
        if "user" not in session or session["user"].get("role") != "admin":
            flash("Требуются права администратора", "error")
            return redirect(url_for("dashboard"))
        return f(*args, **kwargs)

    decorated_function.__name__ = f.__name__
    return decorated_function


@app.route("/")
def index():
    if "token" in session:
        return redirect(url_for("dashboard"))
    return redirect(url_for("login"))


@app.route("/login", methods=["GET", "POST"])
def login():
    if request.method == "POST":
        username = request.form.get("username")
        password = request.form.get("password")

        if not username or not password:
            flash("Введите имя пользователя и пароль", "error")
            return render_template("login.html")

        response, status_code = api_client.login(username, password)

        print(f"Login response: {response}")  # Debug
        print(f"Status code: {status_code}")  # Debug

        # ИСПРАВЛЕНИЕ: API возвращает токен напрямую, а не в data.success
        if status_code == 200 and response.get("token"):
            session["token"] = response["token"]
            session["user"] = response["user"]
            flash("Вход выполнен успешно!", "success")
            return redirect(url_for("dashboard"))
        else:
            # Пробуем разные форматы ошибок
            error_msg = (
                response.get("error")
                or response.get("message")
                or "Ошибка авторизации"
            )
            flash(f"Ошибка входа: {error_msg}", "error")

    return render_template("login.html")


@app.route("/logout")
def logout():
    session.clear()
    flash("Вы вышли из системы", "info")
    return redirect(url_for("login"))


@app.route("/dashboard")
@login_required
def dashboard():
    return render_template("dashboard.html", user=session.get("user"))


@app.route("/health")
def health_check():
    return jsonify({"status": "healthy", "service": "web"})


@app.route("/test-api")
def test_api():
    """Тестовый endpoint для проверки соединения с API"""
    try:
        response = requests.get(f"{API_BASE_URL}/health", timeout=5)
        return jsonify(
            {
                "api_status": "connected" if response.status_code == 200 else "error",
                "api_response": response.json()
                if response.status_code == 200
                else {"error": f"Status {response.status_code}"},
            }
        )
    except Exception as e:
        return jsonify({"api_status": "error", "error": str(e)})


# Вспомогательная функция для обработки ответов API
def extract_data_from_response(response, status_code):
    """Извлекает данные из ответа API в унифицированном формате"""
    if status_code != 200:
        return []

    # API возвращает данные в поле 'data'
    if isinstance(response, dict) and "data" in response:
        data = response["data"]
        if isinstance(data, list):
            return data
        elif data is None:
            return []
        else:
            return [data]  # Если это одиночный объект, оборачиваем в список
    elif isinstance(response, list):
        return response
    else:
        return []


# Warehouses routes
@app.route("/warehouses")
@login_required
def warehouses():
    response, status_code = api_client.get_warehouses()
    warehouses_data = extract_data_from_response(response, status_code)

    if status_code != 200:
        error_msg = (
            response.get("error", "Неизвестная ошибка")
            if isinstance(response, dict)
            else "Неизвестная ошибка"
        )
        flash(f"Ошибка получения товаров: {error_msg}", "error")

    return render_template(
        "warehouses.html", warehouses=warehouses_data, user=session.get("user")
    )


@app.route("/warehouses/create", methods=["POST"])
@login_required
@admin_required
def create_warehouse():
    try:
        data = {
            "name": request.form.get("name"),
            "quantity": int(request.form.get("quantity", 0)),
            "amount": float(request.form.get("amount", 0)),
        }
        response, status_code = api_client.create_warehouse(data)

        if status_code == 201 and response.get("success"):
            flash("Товар успешно создан", "success")
        else:
            error_msg = response.get("error", "Ошибка создания товара")
            flash(f"Ошибка: {error_msg}", "error")
    except ValueError:
        flash("Неверный формат данных", "error")

    return redirect(url_for("warehouses"))


@app.route("/warehouses/update/<int:id>", methods=["POST"])
@login_required
@admin_required
def update_warehouse(id):
    try:
        data = {
            "name": request.form.get("name"),
            "quantity": int(request.form.get("quantity", 0)),
            "amount": float(request.form.get("amount", 0)),
        }
        response, status_code = api_client.update_warehouse(id, data)

        if status_code == 200 and response.get("success"):
            flash("Товар успешно обновлен", "success")
        else:
            error_msg = response.get("error", "Ошибка обновления товара")
            flash(f"Ошибка: {error_msg}", "error")
    except ValueError:
        flash("Неверный формат данных", "error")

    return redirect(url_for("warehouses"))


@app.route("/warehouses/delete/<int:id>")
@login_required
@admin_required
def delete_warehouse(id):
    response, status_code = api_client.delete_warehouse(id)

    if status_code == 200 and response.get("success"):
        flash("Товар успешно удален", "success")
    else:
        error_msg = response.get("error", "Ошибка удаления товара")
        flash(f"Ошибка: {error_msg}", "error")

    return redirect(url_for("warehouses"))


# Expense Items routes
@app.route("/expense-items")
@login_required
def expense_items():
    response, status_code = api_client.get_expense_items()
    expense_items_data = extract_data_from_response(response, status_code)

    if status_code != 200:
        error_msg = (
            response.get("error", "Неизвестная ошибка")
            if isinstance(response, dict)
            else "Неизвестная ошибка"
        )
        flash(f"Ошибка получения статей расходов: {error_msg}", "error")

    return render_template(
        "expense_items.html",
        expense_items=expense_items_data,
        user=session.get("user"),
    )


@app.route("/expense-items/create", methods=["POST"])
@login_required
@admin_required
def create_expense_item():
    data = {"name": request.form.get("name")}
    response, status_code = api_client.create_expense_item(data)

    if status_code == 201 and response.get("success"):
        flash("Статья расходов успешно создана", "success")
    else:
        error_msg = response.get("error", "Ошибка создания статьи расходов")
        flash(f"Ошибка: {error_msg}", "error")

    return redirect(url_for("expense_items"))


@app.route("/expense-items/delete/<int:id>")
@login_required
@admin_required
def delete_expense_item(id):
    response, status_code = api_client.delete_expense_item(id)

    if status_code == 200 and response.get("success"):
        flash("Статья расходов успешно удалена", "success")
    else:
        error_msg = response.get("error", "Ошибка удаления статьи расходов")
        flash(f"Ошибка: {error_msg}", "error")

    return redirect(url_for("expense_items"))


# Sales routes
@app.route("/sales")
@login_required
def sales():
    sales_response, sales_status = api_client.get_sales()
    sales_data = extract_data_from_response(sales_response, sales_status)

    if sales_status != 200:
        error_msg = (
            sales_response.get("error", "Неизвестная ошибка")
            if isinstance(sales_response, dict)
            else "Неизвестная ошибка"
        )
        flash(f"Ошибка получения продаж: {error_msg}", "error")

    warehouses_response, warehouses_status = api_client.get_warehouses()
    warehouses_data = extract_data_from_response(
        warehouses_response, warehouses_status
    )

    if warehouses_status != 200:
        error_msg = (
            warehouses_response.get("error", "Неизвестная ошибка")
            if isinstance(warehouses_response, dict)
            else "Неизвестная ошибка"
        )
        flash(f"Ошибка получения товаров: {error_msg}", "error")

    return render_template(
        "sales.html",
        sales=sales_data,
        warehouses=warehouses_data,
        user=session.get("user"),
    )


@app.route("/sales/create", methods=["POST"])
@login_required
def create_sale():
    try:
        data = {
            "warehouse_id": int(request.form.get("warehouse_id")),
            "quantity": int(request.form.get("quantity", 1)),
        }
        response, status_code = api_client.create_sale(data)

        if status_code == 201 and response.get("success"):
            flash("Продажа успешно создана", "success")
        else:
            error_msg = response.get("error", "Ошибка создания продажи")
            flash(f"Ошибка: {error_msg}", "error")
    except ValueError:
        flash("Неверный формат данных", "error")

    return redirect(url_for("sales"))


@app.route("/sales/delete/<int:id>")
@login_required
def delete_sale(id):
    response, status_code = api_client.delete_sale(id)

    if status_code == 200 and response.get("success"):
        flash("Продажа успешно удалена", "success")
    else:
        error_msg = response.get("error", "Ошибка удаления продажи")
        flash(f"Ошибка: {error_msg}", "error")

    return redirect(url_for("sales"))


# Charges routes
@app.route("/charges")
@login_required
def charges():
    charges_response, charges_status = api_client.get_charges()
    charges_data = extract_data_from_response(charges_response, charges_status)

    if charges_status != 200:
        error_msg = (
            charges_response.get("error", "Неизвестная ошибка")
            if isinstance(charges_response, dict)
            else "Неизвестная ошибка"
        )
        flash(f"Ошибка получения расходов: {error_msg}", "error")

    expense_items_response, expense_items_status = api_client.get_expense_items()
    expense_items_data = extract_data_from_response(
        expense_items_response, expense_items_status
    )

    if expense_items_status != 200:
        error_msg = (
            expense_items_response.get("error", "Неизвестная ошибка")
            if isinstance(expense_items_response, dict)
            else "Неизвестная ошибка"
        )
        flash(f"Ошибка получения статей расходов: {error_msg}", "error")

    return render_template(
        "charges.html",
        charges=charges_data,
        expense_items=expense_items_data,
        user=session.get("user"),
    )


@app.route("/charges/create", methods=["POST"])
@login_required
def create_charge():
    try:
        data = {
            "expense_item_id": int(request.form.get("expense_item_id")),
            "amount": float(request.form.get("amount", 0)),
        }
        response, status_code = api_client.create_charge(data)

        if status_code == 201 and response.get("success"):
            flash("Расход успешно создан", "success")
        else:
            error_msg = response.get("error", "Ошибка создания расхода")
            flash(f"Ошибка: {error_msg}", "error")
    except ValueError:
        flash("Неверный формат данных", "error")

    return redirect(url_for("charges"))


@app.route("/charges/delete/<int:id>")
@login_required
def delete_charge(id):
    response, status_code = api_client.delete_charge(id)

    if status_code == 200 and response.get("success"):
        flash("Расход успешно удален", "success")
    else:
        error_msg = response.get("error", "Ошибка удаления расхода")
        flash(f"Ошибка: {error_msg}", "error")

    return redirect(url_for("charges"))


# Reports routes
@app.route("/reports")
@login_required
def reports():
    # Если есть параметры - показываем конкретный отчет
    month = request.args.get("month")
    start_date = request.args.get("start_date")
    end_date = request.args.get("end_date")

    if month:
        return render_template(
            "profit_report.html",
            user=session.get("user"),
            month=month,
            datetime=datetime,
            timedelta=timedelta,
        )
    elif start_date and end_date:
        return render_template(
            "top_products_report.html",
            user=session.get("user"),
            start_date=start_date,
            end_date=end_date,
            datetime=datetime,
            timedelta=timedelta,
        )
    else:
        # Если нет параметров - показываем форму выбора отчета
        default_start = (datetime.now() - timedelta(days=30)).strftime("%Y-%m-%d")
        default_end = datetime.now().strftime("%Y-%m-%d")
        default_month = datetime.now().strftime("%Y-%m")

        return render_template(
            "reports_index.html",
            user=session.get("user"),
            default_start=default_start,
            default_end=default_end,
            default_month=default_month,
            datetime=datetime,
            timedelta=timedelta,
        )


@app.route("/reports/profit")
@login_required
def get_profit_report():
    month = request.args.get("month")
    year = request.args.get("year")

    print(f"=== PROFIT REPORT REQUEST ===")
    print(f"Month: {month}, Year: {year}")

    if not month and not year:
        return jsonify({"success": False, "error": "Не указаны месяц и год"})

    # УБЕРИТЕ временный фикс - используйте реальный запрос к API
    response, status_code = api_client.get_profit_report(month, year)

    if status_code == 200:
        return jsonify(response)
    else:
        error_msg = (
            response.get("error", "Ошибка получения данных")
            if isinstance(response, dict)
            else "Ошибка получения данных"
        )
        return jsonify({"success": False, "error": error_msg})


@app.route("/reports/top-products")
@login_required
def get_top_products_report():
    start_date = request.args.get("start_date")
    end_date = request.args.get("end_date")

    if not start_date or not end_date:
        return jsonify(
            {"success": False, "error": "Не указаны даты начала и окончания"}
        )

    response, status_code = api_client.get_top_products(start_date, end_date)

    if status_code == 200:
        return jsonify(response)
    else:
        error_msg = (
            response.get("error", "Ошибка получения данных")
            if isinstance(response, dict)
            else "Ошибка получения данных"
        )
        return jsonify({"success": False, "error": error_msg})


def _handle_request(self, method, url, **kwargs):
    try:
        print(f"API Request: {method.__name__.upper()} {url}")
        response = method(url, **kwargs, timeout=10)
        print(f"API Response Status: {response.status_code}")
        print(f"API Response Headers: {dict(response.headers)}")
        print(f"API Raw Response Text: {response.text}")

        # Пробуем распарсить JSON
        try:
            json_data = response.json()
            return json_data, response.status_code
        except json.JSONDecodeError as e:
            print(f"JSON decode error: {e}")
            print(f"Raw response that caused error: {repr(response.text)}")

            # Попробуем очистить ответ от возможных лишних символов
            cleaned_text = response.text.strip()
            print(f"Cleaned response text: {repr(cleaned_text)}")

            # Если есть множественные JSON объекты, возьмем первый
            if cleaned_text.startswith("{") and "}{" in cleaned_text:
                print("Found multiple JSON objects, taking first one")
                first_json = cleaned_text.split("}{")[0] + "}"
                try:
                    json_data = json.loads(first_json)
                    return json_data, response.status_code
                except json.JSONDecodeError:
                    pass

            # Если все еще ошибка, вернем ошибку с сырым текстом
            return {
                "success": False,
                "error": f"Invalid JSON from API: {str(e)}",
                "raw_response": response.text[
                    :500
                ],  # первые 500 символов для отладки
            }, 500

    except requests.exceptions.RequestException as e:
        return {"success": False, "error": f"API недоступен: {str(e)}"}, 503
    except Exception as e:
        return {"success": False, "error": f"Ошибка: {str(e)}"}, 500


if __name__ == "__main__":
    print("Starting SPbPU Store Web Interface...")
    print(f"API Base URL: {API_BASE_URL}")
    app.run(host="0.0.0.0", port=80, debug=True)
