class SalesManager {
    constructor() {
        this.warehouses = [];
        this.init();
    }

    init() {
        this.loadWarehouses();
        this.loadSales();
        this.attachEventListeners();
    }

    attachEventListeners() {
        const form = document.getElementById('saleForm');
        if (form) {
            form.addEventListener('submit', (e) => this.handleSubmit(e));
        }
    }

    async loadWarehouses() {
        try {
            const response = await apiService.get('/warehouses');
            if (response && response.success) {
                this.warehouses = response.data;
                this.renderWarehousesDropdown();
            }
        } catch (error) {
            console.error('Error loading warehouses:', error);
        }
    }

    renderWarehousesDropdown() {
        const select = document.getElementById('warehouse_id');
        select.innerHTML = '<option value="">Выберите товар</option>';

        this.warehouses.forEach(warehouse => {
            const option = document.createElement('option');
            option.value = warehouse.id;
            option.textContent = `${warehouse.name} (${warehouse.quantity} в наличии)`;
            select.appendChild(option);
        });
    }

    async loadSales() {
        try {
            const response = await apiService.get('/sales');
            if (response && response.success) {
                this.renderSales(response.data);
            }
        } catch (error) {
            console.error('Error loading sales:', error);
        }
    }

    renderSales(sales) {
        const tbody = document.getElementById('salesTableBody');
        tbody.innerHTML = '';

        sales.forEach(sale => {
            const warehouse = this.warehouses.find(w => w.id === sale.warehouse_id);
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${sale.id}</td>
                <td>${warehouse ? warehouse.name : 'Товар не найден'}</td>
                <td>${sale.quantity}</td>
                <td>${sale.amount} ₽</td>
                <td>${new Date(sale.sale_date).toLocaleDateString('ru-RU')}</td>
                <td>
                    <button class="btn-danger" onclick="salesManager.deleteSale(${sale.id})">
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
            warehouse_id: parseInt(document.getElementById('warehouse_id').value),
            quantity: parseInt(document.getElementById('quantity').value)
        };

        // Проверяем наличие товара
        const selectedWarehouse = this.warehouses.find(w => w.id === formData.warehouse_id);
        if (selectedWarehouse && formData.quantity > selectedWarehouse.quantity) {
            alert(`Недостаточно товара на складе. В наличии: ${selectedWarehouse.quantity}`);
            return;
        }

        try {
            const response = await apiService.post('/sales', formData);
            if (response && response.success) {
                this.loadSales();
                this.loadWarehouses(); // Обновляем список товаров (количества изменились)
                e.target.reset();
            }
        } catch (error) {
            console.error('Error creating sale:', error);
            alert('Ошибка при создании продажи: ' + (error.message || 'Неизвестная ошибка'));
        }
    }

    async deleteSale(id) {
        if (confirm('Вы уверены, что хотите удалить эту продажу? Товар будет возвращен на склад.')) {
            try {
                const response = await apiService.delete(`/sales/${id}`);
                if (response && response.success) {
                    this.loadSales();
                    this.loadWarehouses(); // Обновляем список товаров
                }
            } catch (error) {
                console.error('Error deleting sale:', error);
            }
        }
    }
}

const salesManager = new SalesManager();