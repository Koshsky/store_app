// web/js/sales.js
class SalesManager {
    async showSalesPage() {
        try {
            const [salesResult, warehousesResult] = await Promise.all([
                window.storeAPI.getSales(),
                window.storeAPI.getWarehouses()
            ]);

            const sales = salesResult.data || [];
            const warehouses = warehousesResult.data || [];

            document.getElementById('content').innerHTML = `
                <div class="d-flex justify-content-between align-items-center mb-4">
                    <h2>Продажи</h2>
                    <button class="btn btn-success" onclick="salesManager.showCreateSaleForm()">Новая продажа</button>
                </div>
                
                <div class="table-responsive">
                    <table class="table table-striped">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Товар</th>
                                <th>Количество</th>
                                <th>Сумма</th>
                                <th>Дата</th>
                                <th>Действия</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${sales.map(sale => `
                                <tr>
                                    <td>${sale.id}</td>
                                    <td>${sale.product_name || `Товар #${sale.warehouse_id}`}</td>
                                    <td>${sale.quantity}</td>
                                    <td>${sale.amount} руб.</td>
                                    <td>${new Date(sale.sale_date).toLocaleDateString('ru-RU')}</td>
                                    <td>
                                        <button class="btn btn-sm btn-danger" onclick="salesManager.deleteSale(${sale.id})">Удалить</button>
                                    </td>
                                </tr>
                            `).join('')}
                            ${sales.length === 0 ? `
                                <tr>
                                    <td colspan="6" class="text-center text-muted">Нет данных о продажах</td>
                                </tr>
                            ` : ''}
                        </tbody>
                    </table>
                </div>
            `;
        } catch (error) {
            window.app.showError('Ошибка загрузки продаж: ' + error.message);
        }
    }

    showCreateSaleForm() {
        this.loadWarehouses().then(warehouses => {
            document.getElementById('content').innerHTML = `
                <div class="row">
                    <div class="col-md-6 mx-auto">
                        <div class="card">
                            <div class="card-header">
                                <h4>Новая продажа</h4>
                            </div>
                            <div class="card-body">
                                <form id="createSaleForm">
                                    <div class="mb-3">
                                        <label for="warehouse_id" class="form-label">Товар</label>
                                        <select class="form-control" id="warehouse_id" required>
                                            <option value="">Выберите товар</option>
                                            ${warehouses.map(w => `
                                                <option value="${w.id}">${w.name} (в наличии: ${w.quantity})</option>
                                            `).join('')}
                                        </select>
                                    </div>
                                    <div class="mb-3">
                                        <label for="quantity" class="form-label">Количество</label>
                                        <input type="number" class="form-control" id="quantity" required min="1">
                                    </div>
                                    <button type="submit" class="btn btn-primary">Создать продажу</button>
                                    <button type="button" class="btn btn-secondary" onclick="salesManager.showSalesPage()">Отмена</button>
                                </form>
                                <div id="formError" class="alert alert-danger mt-3 d-none"></div>
                            </div>
                        </div>
                    </div>
                </div>
            `;

            document.getElementById('createSaleForm').addEventListener('submit', async (e) => {
                e.preventDefault();
                await this.createSale();
            });
        });
    }

    async loadWarehouses() {
        try {
            const result = await window.storeAPI.getWarehouses();
            return result.data || [];
        } catch (error) {
            window.app.showError('Ошибка загрузки товаров: ' + error.message);
            return [];
        }
    }

    async createSale() {
        const formData = {
            warehouse_id: parseInt(document.getElementById('warehouse_id').value),
            quantity: parseInt(document.getElementById('quantity').value)
        };

        try {
            await window.storeAPI.createSale(formData);
            this.showSalesPage();
        } catch (error) {
            this.showFormError(error.message);
        }
    }

    async deleteSale(id) {
        if (confirm('Вы уверены, что хотите удалить эту продажу? Товар будет возвращен на склад.')) {
            try {
                await window.storeAPI.deleteSale(id);
                this.showSalesPage();
            } catch (error) {
                window.app.showError('Ошибка удаления продажи: ' + error.message);
            }
        }
    }

    showFormError(message) {
        const errorDiv = document.getElementById('formError');
        errorDiv.textContent = message;
        errorDiv.classList.remove('d-none');
    }
}

window.salesManager = new SalesManager();

// Integrate with main app
window.app.showSales = () => window.salesManager.showSalesPage();