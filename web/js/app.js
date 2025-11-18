class SPbPUStoreApp {
    constructor() {
        this.init();
    }

    init() {
        this.checkAuthAndRedirect();
    }

    checkAuthAndRedirect() {
        const token = localStorage.getItem('authToken');

        if (!token) {
            window.location.href = 'login.html';
            return;
        }

        // Проверяем текущую страницу
        const currentPage = window.location.pathname.split('/').pop();

        if (currentPage === 'index.html' || currentPage === '') {
            window.location.href = 'home.html';
        }
    }
}

// Инициализация приложения
new SPbPUStoreApp();