class AuthService {
    constructor() {
        this.init();
    }

    init() {
        this.checkAuthState();
        this.attachEventListeners();
    }

    async handleLogin(e) {
        e.preventDefault();

        const formData = new FormData(e.target);
        const credentials = {
            username: formData.get('username'),
            password: formData.get('password')
        };

        try {
            const response = await apiService.post('/auth/login', credentials);

            if (response && response.success) {
                localStorage.setItem('authToken', response.data.token);
                localStorage.setItem('userInfo', JSON.stringify(response.data.user));
                window.location.href = 'home.html';
            } else {
                this.showError(response.error || 'Ошибка авторизации');
            }
        } catch (error) {
            this.showError('Ошибка: ' + error.message);
        }
    }

    checkAuthState() {
        const token = localStorage.getItem('authToken');
        const userInfo = localStorage.getItem('userInfo');

        if (token && userInfo) {
            const user = JSON.parse(userInfo);
            this.updateUI(user);
        } else if (!window.location.pathname.includes('login.html')) {
            window.location.href = 'login.html';
        }
    }

    attachEventListeners() {
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        }
    }

    showError(message) {
        const errorDiv = document.getElementById('errorMessage');
        if (errorDiv) {
            errorDiv.textContent = message;
        }
    }

    updateUI(user) {
        const userNameElement = document.getElementById('userName');
        if (userNameElement) {
            userNameElement.textContent = `Пользователь: ${user.username} (${user.role})`;
        }
    }

    getAuthHeaders() {
        const token = localStorage.getItem('authToken');
        return {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        };
    }
}

// Глобальная функция выхода
function logout() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userInfo');
    window.location.href = 'login.html';
}

// Инициализация сервиса аутентификации
const authService = new AuthService();