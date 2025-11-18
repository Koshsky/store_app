class ChargesManager {
    constructor() {
        this.expenseItems = [];
        this.init();
    }

    init() {
        this.loadExpenseItems();
        this.loadCharges();
        this.attachEventListeners();
    }

    attachEventListeners() {
        const form = document.getElementById('chargeForm');
        if (form) {
            form.addEventListener('submit', (e) => this.handleSubmit(e));
        }
    }

    async loadExpenseItems() {
        try {
            const response = await apiService.get('/expense-items');
            if (response && response.success) {
                this.expenseItems = response.data;
                this.renderExpenseItemsDropdown();
            }
        } catch (error) {
            console.error('Error loading expense items:', error);
        }
    }

    renderExpenseItemsDropdown() {
        const select = document.getElementById('expense_item_id');
        select.innerHTML = '<option value="">Выберите статью расхода</option>';

        this.expenseItems.forEach(item => {
            const option = document.createElement('option');
            option.value = item.id;
            option.textContent = item.name;
            select.appendChild(option);
        });
    }

    async loadCharges() {
        try {
            const response = await apiService.get('/charges');
            if (response && response.success) {
                this.renderCharges(response.data);
            }
        } catch (error) {
            console.error('Error loading charges:', error);
        }
    }

    renderCharges(charges) {
        const tbody = document.getElementById('chargesTableBody');
        tbody.innerHTML = '';

        charges.forEach(charge => {
            const expenseItem = this.expenseItems.find(item => item.id === charge.expense_item_id);
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${charge.id}</td>
                <td>${expenseItem ? expenseItem.name : 'Статья не найдена'}</td>
                <td>${charge.amount} ₽</td>
                <td>${new Date(charge.charge_date).toLocaleDateString('ru-RU')}</td>
                <td>
                    <button class="btn-danger" onclick="chargesManager.deleteCharge(${charge.id})">
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
            expense_item_id: parseInt(document.getElementById('expense_item_id').value),
            amount: parseFloat(document.getElementById('amount').value)
        };

        try {
            const response = await apiService.post('/charges', formData);
            if (response && response.success) {
                this.loadCharges();
                e.target.reset();
            }
        } catch (error) {
            console.error('Error creating charge:', error);
        }
    }

    async deleteCharge(id) {
        if (confirm('Вы уверены, что хотите удалить этот расход?')) {
            try {
                const response = await apiService.delete(`/charges/${id}`);
                if (response && response.success) {
                    this.loadCharges();
                }
            } catch (error) {
                console.error('Error deleting charge:', error);
            }
        }
    }
}

const chargesManager = new ChargesManager();