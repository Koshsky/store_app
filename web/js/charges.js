// web/js/charges.js
class ChargesManager {
    async showChargesPage() {
        try {
            const [chargesResult, expenseItemsResult] = await Promise.all([
                window.storeAPI.getCharges(),
                window.storeAPI.getExpenseItems()
            ]);

            const charges = chargesResult.data || [];
            const expenseItems = expenseItemsResult.data || [];

            const expenseItemsMap = {};
            expenseItems.forEach(item => {
                expenseItemsMap[item.id] = item.name;
            });

            document.getElementById('content').innerHTML = `
                <div class="d-flex justify-content-between align-items-center mb-4">
                    <h2>Расходы</h2>
                    <button class="btn btn-success" onclick="chargesManager.showCreateChargeForm()">Новый расход</button>
                </div>
                
                <div class="table-responsive">
                    <table class="table table-striped">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Статья расходов</th>
                                <th>Сумма</th>
                                <th>Дата</th>
                                <th>Действия</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${charges.map(charge => `
                                <tr>
                                    <td>${charge.id}</td>
                                    <td>${expenseItemsMap[charge.expense_item_id] || `Статья #${charge.expense_item_id}`}</td>
                                    <td>${charge.amount} руб.</td>
                                    <td>${new Date(charge.charge_date).toLocaleDateString('ru-RU')}</td>
                                    <td>
                                        <button class="btn btn-sm btn-danger" onclick="chargesManager.deleteCharge(${charge.id})">Удалить</button>
                                    </td>
                                </tr>
                            `).join('')}
                            ${charges.length === 0 ? `
                                <tr>
                                    <td colspan="5" class="text-center text-muted">Нет данных о расходах</td>
                                </tr>
                            ` : ''}
                        </tbody>
                    </table>
                </div>
            `;
        } catch (error) {
            window.app.showError('Ошибка загрузки расходов: ' + error.message);
        }
    }

    showCreateChargeForm() {
        this.loadExpenseItems().then(expenseItems => {
            document.getElementById('content').innerHTML = `
                <div class="row">
                    <div class="col-md-6 mx-auto">
                        <div class="card">
                            <div class="card-header">
                                <h4>Новый расход</h4>
                            </div>
                            <div class="card-body">
                                <form id="createChargeForm">
                                    <div class="mb-3">
                                        <label for="expense_item_id" class="form-label">Статья расходов</label>
                                        <select class="form-control" id="expense_item_id" required>
                                            <option value="">Выберите статью расходов</option>
                                            ${expenseItems.map(item => `
                                                <option value="${item.id}">${item.name}</option>
                                            `).join('')}
                                        </select>
                                    </div>
                                    <div class="mb-3">
                                        <label for="amount" class="form-label">Сумма</label>
                                        <input type="number" step="0.01" class="form-control" id="amount" required min="0">
                                    </div>
                                    <button type="submit" class="btn btn-primary">Создать расход</button>
                                    <button type="button" class="btn btn-secondary" onclick="chargesManager.showChargesPage()">Отмена</button>
                                </form>
                                <div id="formError" class="alert alert-danger mt-3 d-none"></div>
                            </div>
                        </div>
                    </div>
                </div>
            `;

            document.getElementById('createChargeForm').addEventListener('submit', async (e) => {
                e.preventDefault();
                await this.createCharge();
            });
        });
    }

    async loadExpenseItems() {
        try {
            const result = await window.storeAPI.getExpenseItems();
            return result.data || [];
        } catch (error) {
            window.app.showError('Ошибка загрузки статей расходов: ' + error.message);
            return [];
        }
    }

    async createCharge() {
        const formData = {
            expense_item_id: parseInt(document.getElementById('expense_item_id').value),
            amount: parseFloat(document.getElementById('amount').value)
        };

        try {
            await window.storeAPI.createCharge(formData);
            this.showChargesPage();
        } catch (error) {
            this.showFormError(error.message);
        }
    }

    async deleteCharge(id) {
        if (confirm('Вы уверены, что хотите удалить этот расход?')) {
            try {
                await window.storeAPI.deleteCharge(id);
                this.showChargesPage();
            } catch (error) {
                window.app.showError('Ошибка удаления расхода: ' + error.message);
            }
        }
    }

    showFormError(message) {
        const errorDiv = document.getElementById('formError');
        errorDiv.textContent = message;
        errorDiv.classList.remove('d-none');
    }
}

window.chargesManager = new ChargesManager();

// Integrate with main app
window.app.showCharges = () => window.chargesManager.showChargesPage();