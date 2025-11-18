class WarehousesManager {
    constructor() {
        this.init();
    }

    init() {
        this.loadWarehouses();
        this.attachEventListeners();
    }

    attachEventListeners() {
        const form = document.getElementById('warehouseForm');
        if (form) {
            form.addEventListener('submit', (e) => this.handleSubmit(e));
        }

        const editForm = document.getElementById('editForm');
        if (editForm) {
            editForm.addEventListener('submit', (e) => this.handleEditSubmit(e));
        }

        const modal = document.getElementById('editModal');
        const closeBtn = document.querySelector('.close');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                modal.style.display = 'none';
            });
        }

        window.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.style.display = 'none';
            }
        });
    }

    async loadWarehouses() {
        try {
            const response = await apiService.get('/warehouses');
            if (response && response.success) {
                this.renderWarehouses(response.data);
            }
        } catch (error) {
            console.error('Error loading warehouses:', error);
        }
    }

    renderWarehouses(warehouses) {
        const tbody = document.getElementById('warehousesTableBody');
        tbody.innerHTML = '';

        warehouses.forEach(warehouse => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${warehouse.id}</td>
                <td>${warehouse.name}</td>
                <td>${warehouse.quantity}</td>
                <td>${warehouse.amount} ₽</td>
                <td>
                    <button class="btn-edit" onclick="warehousesManager.openEditModal(${warehouse.id}, '${warehouse.name}', ${warehouse.quantity}, ${warehouse.amount})">
                        Редактировать
                    </button>
                    <button class="btn-danger" onclick="warehousesManager.deleteWarehouse(${warehouse.id})">
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
            name: document.getElementById('name').value,
            quantity: parseInt(document.getElementById('quantity').value),
            amount: parseFloat(document.getElementById('amount').value)
        };

        try {
            const response = await apiService.post('/warehouses', formData);
            if (response && response.success) {
                this.loadWarehouses();
                e.target.reset();
            }
        } catch (error) {
            console.error('Error creating warehouse:', error);
        }
    }

    openEditModal(id, name, quantity, amount) {
        document.getElementById('editId').value = id;
        document.getElementById('editName').value = name;
        document.getElementById('editQuantity').value = quantity;
        document.getElementById('editAmount').value = amount;

        document.getElementById('editModal').style.display = 'block';
    }

    async handleEditSubmit(e) {
        e.preventDefault();

        const id = document.getElementById('editId').value;
        const formData = {
            name: document.getElementById('editName').value,
            quantity: parseInt(document.getElementById('editQuantity').value),
            amount: parseFloat(document.getElementById('editAmount').value)
        };

        try {
            const response = await apiService.put(`/warehouses/${id}`, formData);
            if (response && response.success) {
                this.loadWarehouses();
                document.getElementById('editModal').style.display = 'none';
            }
        } catch (error) {
            console.error('Error updating warehouse:', error);
        }
    }

    async deleteWarehouse(id) {
        if (confirm('Вы уверены, что хотите удалить этот товар?')) {
            try {
                const response = await apiService.delete(`/warehouses/${id}`);
                if (response && response.success) {
                    this.loadWarehouses();
                }
            } catch (error) {
                console.error('Error deleting warehouse:', error);
            }
        }
    }
}

const warehousesManager = new WarehousesManager();