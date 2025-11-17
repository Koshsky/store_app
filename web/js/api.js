// web/js/api.js
class StoreAPI {
    constructor() {
        this.baseURL = '/api/v1';
        this.token = localStorage.getItem('jwtToken');
    }

    setToken(token) {
        this.token = token;
        localStorage.setItem('jwtToken', token);
    }

    getHeaders() {
        const headers = {
            'Content-Type': 'application/json'
        };
        if (this.token) {
            headers['Authorization'] = `Bearer ${this.token}`;
        }
        return headers;
    }

    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        const config = {
            headers: this.getHeaders(),
            ...options
        };

        try {
            const response = await fetch(url, config);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'API request failed');
            }

            return data;
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    }

    // Auth methods
    async login(username, password) {
        return this.request('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ username, password })
        });
    }

    async getProfile() {
        return this.request('/auth/profile');
    }

    // Warehouses methods
    async getWarehouses() {
        return this.request('/warehouses');
    }

    async getWarehouse(id) {
        return this.request(`/warehouses/${id}`);
    }

    async createWarehouse(warehouse) {
        return this.request('/warehouses', {
            method: 'POST',
            body: JSON.stringify(warehouse)
        });
    }

    async updateWarehouse(id, warehouse) {
        return this.request(`/warehouses/${id}`, {
            method: 'PUT',
            body: JSON.stringify(warehouse)
        });
    }

    async deleteWarehouse(id) {
        return this.request(`/warehouses/${id}`, {
            method: 'DELETE'
        });
    }

    // Sales methods
    async getSales() {
        return this.request('/sales');
    }

    async createSale(sale) {
        return this.request('/sales', {
            method: 'POST',
            body: JSON.stringify(sale)
        });
    }

    async deleteSale(id) {
        return this.request(`/sales/${id}`, {
            method: 'DELETE'
        });
    }

    // Charges methods
    async getCharges() {
        return this.request('/charges');
    }

    async createCharge(charge) {
        return this.request('/charges', {
            method: 'POST',
            body: JSON.stringify(charge)
        });
    }

    async deleteCharge(id) {
        return this.request(`/charges/${id}`, {
            method: 'DELETE'
        });
    }

    // Expense Items methods
    async getExpenseItems() {
        return this.request('/expense-items');
    }

    async createExpenseItem(expenseItem) {
        return this.request('/expense-items', {
            method: 'POST',
            body: JSON.stringify(expenseItem)
        });
    }

    async deleteExpenseItem(id) {
        return this.request(`/expense-items/${id}`, {
            method: 'DELETE'
        });
    }
}

// Global API instance
window.storeAPI = new StoreAPI();