// web/js/app.js
class StoreApp {
    constructor() {
        this.currentPage = 'dashboard';
    }

    async showDashboard() {
        this.currentPage = 'dashboard';
        document.getElementById('content').innerHTML = `
            <div class="row">
                <div class="col-12">
                    <h2>Главная панель</h2>
                    <p>Добро пожаловать, ${window.auth.currentUser.username}!</p>
                </div>
            </div>
            
            <div class="row mt-4">
                <div class="col-md-3 mb-3">
                    <div class="card">
                        <div class="card-body text-center">
                            <h5 class="card-title">Товары</h5>
                            <p class="card-text">Управление товарами на складе</p>
                            <button class="btn btn-primary" onclick="app.showWarehouses()">Перейти</button>
                        </div>
                    </div>
                </div>
                <div class="col-md-3 mb-3">
                    <div class="card">
                        <div class="card-body text-center">
                            <h5 class="card-title">Продажи</h5>
                            <p class="card-text">Управление продажами</p>
                            <button class="btn btn-primary" onclick="app.showSales()">Перейти</button>
                        </div>
                    </div>
                </div>
                <div class="col-md-3 mb-3">
                    <div class="card">
                        <div class="card-body text-center">
                            <h5 class="card-title">Расходы</h5>
                            <p class="card-text">Управление расходами</p>
                            <button class="btn btn-primary" onclick="app.showCharges()">Перейти</button>
                        </div>
                    </div>
                </div>
                <div class="col-md-3 mb-3">
                    <div class="card">
                        <div class="card-body text-center">
                            <h5 class="card-title">Статьи расходов</h5>
                            <p class="card-text">Управление статьями расходов</p>
                            <button class="btn btn-primary" onclick="app.showExpenseItems()">Перейти</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    async showWarehouses() {
        this.currentPage = 'warehouses';
        try {
            const result = await window.storeAPI.getWarehouses();
            const warehouses = result.data || [];

            document.getElementById('content').innerHTML = `
                <div class="d-flex justify-content-between align-items-center mb-4">
                    <h2>Товары на складе</h2>
                    <button class="btn btn-success" onclick="app.showCreateWarehouseForm()">Добавить товар</button>
                </div>
                
                <div class="table-responsive">
                    <table class="table table-striped">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Название</th>
                                <th>Количество</th>
                                <th>Цена</th>
                                <th>Действия</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${warehouses.map(warehouse => `
                                <tr>
                                    <td>${warehouse.id}</td>
                                    <td>${warehouse.name}</td>
                                    <td>${warehouse.quantity}</td>
                                    <td>${warehouse.amount} руб.</td>
                                    <td>
                                        <button class="btn btn-sm btn-warning me-1" onclick="app.showEditWarehouseForm(${warehouse.id})">Редактировать</button>
                                        <button class="btn btn-sm btn-danger" onclick="app.deleteWarehouse(${warehouse.id})">Удалить</button>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            `;
        } catch (error) {
            this.showError('Ошибка загрузки товаров: ' + error.message);
        }
    }

    showCreateWarehouseForm() {
        document.getElementById('content').innerHTML = `
            <div class="row">
                <div class="col-md-6 mx-auto">
                    <div class="card">
                        <div class="card-header">
                            <h4>Добавить товар</h4>
                        </div>
                        <div class="card-body">
                            <form id="createWarehouseForm">
                                <div class="mb-3">
                                    <label for="name" class="form-label">Название товара</label>
                                    <input type="text" class="form-control" id="name" required>
                                </div>
                                <div class="mb-3">
                                    <label for="quantity" class="form-label">Количество</label>
                                    <input type="number" class="form-control" id="quantity" required min="0">
                                </div>
                                <div class="mb-3">
                                    <label for="amount" class="form-label">Цена</label>
                                    <input type="number" step="0.01" class="form-control" id="amount" required min="0">
                                </div>
                                <button type="submit" class="btn btn-primary">Создать</button>
                                <button type="button" class="btn btn-secondary" onclick="app.showWarehouses()">Отмена</button>
                            </form>
                            <div id="formError" class="alert alert-danger mt-3 d-none"></div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.getElementById('createWarehouseForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const formData = {
                name: document.getElementById('name').value,
                quantity: parseInt(document.getElementById('quantity').value),
                amount: parseFloat(document.getElementById('amount').value)
            };

            try {
                await window.storeAPI.createWarehouse(formData);
                this.showWarehouses();
            } catch (error) {
                this.showFormError(error.message);
            }
        });
    }

    async showEditWarehouseForm(id) {
        try {
            const result = await window.storeAPI.getWarehouse(id);
            const warehouse = result.data;

            document.getElementById('content').innerHTML = `
                <div class="row">
                    <div class="col-md-6 mx-auto">
                        <div class="card">
                            <div class="card-header">
                                <h4>Редактировать товар</h4>
                            </div>
                            <div class="card-body">
                                <form id="editWarehouseForm">
                                    <div class="mb-3">
                                        <label for="name" class="form-label">Название товара</label>
                                        <input type="text" class="form-control" id="name" value="${warehouse.name}" required>
                                    </div>
                                    <div class="mb-3">
                                        <label for="quantity" class="form-label">Количество</label>
                                        <input type="number" class="form-control" id="quantity" value="${warehouse.quantity}" required min="0">
                                    </div>
                                    <div class="mb-3">
                                        <label for="amount" class="form-label">Цена</label>
                                        <input type="number" step="0.01" class="form-control" id="amount" value="${warehouse.amount}" required min="0">
                                    </div>
                                    <button type="submit" class="btn btn-primary">Обновить</button>
                                    <button type="button" class="btn btn-secondary" onclick="app.showWarehouses()">Отмена</button>
                                </form>
                                <div id="formError" class="alert alert-danger mt-3 d-none"></div>
                            </div>
                        </div>
                    </div>
                </div>
            `;

            document.getElementById('editWarehouseForm').addEventListener('submit', async (e) => {
                e.preventDefault();
                const formData = {
                    name: document.getElementById('name').value,
                    quantity: parseInt(document.getElementById('quantity').value),
                    amount: parseFloat(document.getElementById('amount').value)
                };

                try {
                    await window.storeAPI.updateWarehouse(id, formData);
                    this.showWarehouses();
                } catch (error) {
                    this.showFormError(error.message);
                }
            });
        } catch (error) {
            this.showError('Ошибка загрузки товара: ' + error.message);
        }
    }

    async deleteWarehouse(id) {
        if (confirm('Вы уверены, что хотите удалить этот товар?')) {
            try {
                await window.storeAPI.deleteWarehouse(id);
                this.showWarehouses();
            } catch (error) {
                this.showError('Ошибка удаления товара: ' + error.message);
            }
        }
    }

    showFormError(message) {
        const errorDiv = document.getElementById('formError');
        errorDiv.textContent = message;
        errorDiv.classList.remove('d-none');
    }

    showError(message) {
        document.getElementById('content').innerHTML = `
            <div class="alert alert-danger">${message}</div>
            <button class="btn btn-secondary" onclick="app.showDashboard()">На главную</button>
        `;
    }

    // Similar methods for Sales, Charges, ExpenseItems will be implemented...
    async showSales() {
        // Implementation for sales page
        document.getElementById('content').innerHTML = `
            <div class="d-flex justify-content-between align-items-center mb-4">
                <h2>Продажи</h2>
                <button class="btn btn-success" onclick="app.showCreateSaleForm()">Новая продажа</button>
            </div>
            <p>Реализация страницы продаж...</p>
        `;
    }

    async showCharges() {
        // Implementation for charges page
        document.getElementById('content').innerHTML = `
            <div class="d-flex justify-content-between align-items-center mb-4">
                <h2>Расходы</h2>
                <button class="btn btn-success" onclick="app.showCreateChargeForm()">Новый расход</button>
            </div>
            <p>Реализация страницы расходов...</p>
        `;
    }

    async showExpenseItems() {
        // Implementation for expense items page
        document.getElementById('content').innerHTML = `
            <div class="d-flex justify-content-between align-items-center mb-4">
                <h2>Статьи расходов</h2>
                <button class="btn btn-success" onclick="app.showCreateExpenseItemForm()">Добавить статью</button>
            </div>
            <p>Реализация страницы статей расходов...</p>
        `;
    }
}

// Global app instance
window.app = new StoreApp();

// Update the existing methods to use new managers
window.app.showSales = () => window.salesManager.showSalesPage();
window.app.showCharges = () => window.chargesManager.showChargesPage();
window.app.showExpenseItems = () => window.expenseItemsManager.showExpenseItemsPage();

// Add create form methods
window.app.showCreateSaleForm = () => window.salesManager.showCreateSaleForm();
window.app.showCreateChargeForm = () => window.chargesManager.showCreateChargeForm();
window.app.showCreateExpenseItemForm = () => window.expenseItemsManager.showCreateExpenseItemForm();