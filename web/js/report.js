class ReportManager {
    constructor() {
        this.init();
    }

    init() {
        this.attachEventListeners();
        this.setDefaultDates();
    }

    setDefaultDates() {
        // Устанавливаем текущий месяц для отчета по прибыли
        const now = new Date();
        const month = now.toISOString().slice(0, 7);
        document.getElementById('profitMonth').value = month;

        // Устанавливаем текущий месяц для топа товаров
        const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
        const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);

        document.getElementById('startDate').value = firstDay.toISOString().slice(0, 10);
        document.getElementById('endDate').value = lastDay.toISOString().slice(0, 10);
    }

    attachEventListeners() {
        const profitForm = document.getElementById('profitForm');
        if (profitForm) {
            profitForm.addEventListener('submit', (e) => this.handleProfitRequest(e));
        }

        const topProductsForm = document.getElementById('topProductsForm');
        if (topProductsForm) {
            topProductsForm.addEventListener('submit', (e) => this.handleTopProductsRequest(e));
        }
    }

    async handleProfitRequest(e) {
        e.preventDefault();

        const month = document.getElementById('profitMonth').value;
        const [year, monthNum] = month.split('-');

        try {
            const response = await apiService.get(`/reports/profit?month=${month}&year=${year}`);
            if (response && response.success) {
                this.displayProfitResult(response.data);
            } else {
                this.displayProfitResult({ error: response?.error || 'Ошибка при получении данных' });
            }
        } catch (error) {
            console.error('Error getting profit report:', error);
            this.displayProfitResult({ error: 'Ошибка сети: ' + error.message });
        }
    }

    async handleTopProductsRequest(e) {
        e.preventDefault();

        const startDate = document.getElementById('startDate').value;
        const endDate = document.getElementById('endDate').value;

        try {
            const response = await apiService.get(`/reports/top-products?start_date=${startDate}&end_date=${endDate}`);
            if (response && response.success) {
                this.displayTopProductsResult(response.data);
            } else {
                this.displayTopProductsResult({ error: response?.error || 'Ошибка при получении данных' });
            }
        } catch (error) {
            console.error('Error getting top products report:', error);
            this.displayTopProductsResult({ error: 'Ошибка сети: ' + error.message });
        }
    }

    displayProfitResult(data) {
        const resultDiv = document.getElementById('profitResult');

        if (data.error) {
            resultDiv.innerHTML = `<div class="error-message">${data.error}</div>`;
            return;
        }

        const month = document.getElementById('profitMonth').value;
        const monthNames = [
            'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
            'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
        ];
        const [year, monthNum] = month.split('-');
        const monthName = monthNames[parseInt(monthNum) - 1];

        resultDiv.innerHTML = `
            <h3>Отчет о прибыли</h3>
            <div style="font-size: 1.2em; margin: 20px 0;">
                <strong>Период:</strong> ${monthName} ${year} года
            </div>
            <div style="font-size: 1.5em; color: #27ae60; font-weight: bold;">
                Прибыль: ${data.profit !== undefined ? data.profit.toFixed(2) : '0.00'} ₽
            </div>
            ${data.details ? `
                <div style="margin-top: 20px;">
                    <h4>Детали:</h4>
                    <p>Общий доход: ${data.details.total_revenue || 0} ₽</p>
                    <p>Общие расходы: ${data.details.total_expenses || 0} ₽</p>
                </div>
            ` : ''}
        `;
    }

    displayTopProductsResult(data) {
        const resultDiv = document.getElementById('topProductsResult');

        if (data.error) {
            resultDiv.innerHTML = `<div class="error-message">${data.error}</div>`;
            return;
        }

        if (!data || !data.products || data.products.length === 0) {
            resultDiv.innerHTML = `
                <p>Нет данных за выбранный период</p>
                <p>Попробуйте выбрать другой интервал дат</p>
            `;
            return;
        }

        const startDate = document.getElementById('startDate').value;
        const endDate = document.getElementById('endDate').value;

        let html = `
            <h3>Топ-5 самых доходных товаров</h3>
            <p><strong>Период:</strong> ${new Date(startDate).toLocaleDateString('ru-RU')} - ${new Date(endDate).toLocaleDateString('ru-RU')}</p>
            <div class="table-container" style="margin-top: 15px;">
                <table>
                    <thead>
                        <tr>
                            <th>#</th>
                            <th>Товар</th>
                            <th>Доход</th>
                            <th>Продано</th>
                            <th>Средняя цена</th>
                        </tr>
                    </thead>
                    <tbody>
        `;

        data.products.forEach((product, index) => {
            const avgPrice = product.quantity_sold > 0 ? product.revenue / product.quantity_sold : 0;
            html += `
                <tr>
                    <td>${index + 1}</td>
                    <td>${product.name}</td>
                    <td style="color: #27ae60; font-weight: bold;">${product.revenue.toFixed(2)} ₽</td>
                    <td>${product.quantity_sold} шт.</td>
                    <td>${avgPrice.toFixed(2)} ₽</td>
                </tr>
            `;
        });

        html += `
                    </tbody>
                </table>
            </div>
            <div style="margin-top: 15px; font-style: italic;">
                Всего товаров в отчете: ${data.products.length}
            </div>
        `;
        resultDiv.innerHTML = html;
    }
}

const reportManager = new ReportManager();