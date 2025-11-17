// web/js/expense-items.js
class ExpenseItemsManager {
    async showExpenseItemsPage() {
        try {
            const result = await window.storeAPI.getExpenseItems();
            const expenseItems = result.data || [];

            document.getElementById('content').innerHTML = `
                <div class="d-flex justify-content-between align-items-center mb-4">
                    <h2>Статьи расходов</h2>
                    <button class="btn btn-success" onclick="expenseItemsManager.showCreateExpenseItemForm()">Добавить статью</button>
                </div>
                
                <div class="table-responsive">
                    <table class="table table-striped">
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Название</th>
                                <th>Действия</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${expenseItems.map(item => `
                                <tr>
                                    <td>${item.id}</td>
                                    <td>${item.name}</td>
                                    <td>
                                        <button class="btn btn-sm btn-danger" onclick="expenseItemsManager.deleteExpenseItem(${item.id})">Удалить</button>
                                    </td>
                                </tr>
                            `).join('')}
                            ${expenseItems.length === 0 ? `
                                <tr>
                                    <td colspan="3" class="text-center text-muted">Нет статей расходов</td>
                                </tr>
                            ` : ''}
                        </tbody>
                    </table>
                </div>
            `;
        } catch (error) {
            window.app.showError('Ошибка загрузки статей расходов: ' + error.message);
        }
    }

    showCreateExpenseItemForm() {
        document.getElementById('content').innerHTML = `
            <div class="row">
                <div class="col-md-6 mx-auto">
                    <div class="card">
                        <div class="card-header">
                            <h4>Добавить статью расходов</h4>
                        </div>
                        <div class="card-body">
                            <form id="createExpenseItemForm">
                                <div class="mb-3">
                                    <label for="name" class="form-label">Название статьи</label>
                                    <input type="text" class="form-control" id="name" required>
                                </div>
                                <button type="submit" class="btn btn-primary">Создать</button>
                                <button type="button" class="btn btn-secondary" onclick="expenseItemsManager.showExpenseItemsPage()">Отмена</button>
                            </form>
                            <div id="formError" class="alert alert-danger mt-3 d-none"></div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.getElementById('createExpenseItemForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.createExpenseItem();
        });
    }

    async createExpenseItem() {
        const formData = {
            name: document.getElementById('name').value
        };

        try {
            await window.storeAPI.createExpenseItem(formData);
            this.showExpenseItemsPage();
        } catch (error) {
            this.showFormError(error.message);
        }
    }

    async deleteExpenseItem(id) {
        if (confirm('Вы уверены, что хотите удалить эту статью расходов?')) {
            try {
                await window.storeAPI.deleteExpenseItem(id);
                this.showExpenseItemsPage();
            } catch (error) {
                window.app.showError('Ошибка удаления статьи расходов: ' + error.message);
            }
        }
    }

    showFormError(message) {
        const errorDiv = document.getElementById('formError');
        errorDiv.textContent = message;
        errorDiv.classList.remove('d-none');
    }
}

window.expenseItemsManager = new ExpenseItemsManager();

// Integrate with main app
window.app.showExpenseItems = () => window.expenseItemsManager.showExpenseItemsPage();