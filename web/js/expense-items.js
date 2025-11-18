class ExpenseItemsManager {
    constructor() {
        this.init();
    }

    init() {
        this.loadExpenseItems();
        this.attachEventListeners();
    }

    attachEventListeners() {
        const form = document.getElementById('expenseItemForm');
        if (form) {
            form.addEventListener('submit', (e) => this.handleSubmit(e));
        }
    }

    async loadExpenseItems() {
        try {
            const response = await apiService.get('/expense-items');
            if (response && response.success) {
                this.renderExpenseItems(response.data);
            }
        } catch (error) {
            console.error('Error loading expense items:', error);
        }
    }

    renderExpenseItems(expenseItems) {
        const tbody = document.getElementById('expenseItemsTableBody');
        tbody.innerHTML = '';

        expenseItems.forEach(item => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${item.id}</td>
                <td>${item.name}</td>
                <td>
                    <button class="btn-danger" onclick="expenseItemsManager.deleteExpenseItem(${item.id})">
                        Удалить
                    </button>
                </td>
            `;
            tbody.appendChild(row);
        });
    }

    async handleSubmit(e) {
        e.preventDefault();

        const formData = {
            name: document.getElementById('name').value
        };

        try {
            const response = await apiService.post('/expense-items', formData);
            if (response && response.success) {
                this.loadExpenseItems();
                e.target.reset();
            }
        } catch (error) {
            console.error('Error creating expense item:', error);
        }
    }

    async deleteExpenseItem(id) {
        if (confirm('Вы уверены, что хотите удалить эту статью расходов?')) {
            try {
                const response = await apiService.delete(`/expense-items/${id}`);
                if (response && response.success) {
                    this.loadExpenseItems();
                }
            } catch (error) {
                console.error('Error deleting expense item:', error);
                alert('Нельзя удалить статью расходов, которая используется в расходах');
            }
        }
    }
}

const expenseItemsManager = new ExpenseItemsManager();