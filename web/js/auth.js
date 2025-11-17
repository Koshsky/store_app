// web/js/auth.js
class AuthManager {
    constructor() {
        this.currentUser = null;
        this.init();
    }

    init() {
        this.checkAuthStatus();
    }

    async checkAuthStatus() {
        const token = localStorage.getItem('jwtToken');
        if (token) {
            try {
                window.storeAPI.setToken(token);
                const profile = await window.storeAPI.getProfile();
                this.currentUser = profile.data;
                this.showAuthenticatedUI();
            } catch (error) {
                this.logout();
            }
        } else {
            this.showLoginUI();
        }
    }

    async login(username, password) {
        try {
            const result = await window.storeAPI.login(username, password);
            window.storeAPI.setToken(result.token);
            this.currentUser = result.user;
            this.showAuthenticatedUI();
            return result;
        } catch (error) {
            throw error;
        }
    }

    logout() {
        localStorage.removeItem('jwtToken');
        this.currentUser = null;
        window.storeAPI.token = null;
        this.showLoginUI();
    }

    showLoginUI() {
        document.getElementById('app').innerHTML = `
            <div class="login-container">
                <div class="row justify-content-center">
                    <div class="col-md-4">
                        <div class="card mt-5">
                            <div class="card-header">
                                <h4>Вход в систему</h4>
                            </div>
                            <div class="card-body">
                                <form id="loginForm">
                                    <div class="mb-3">
                                        <label for="username" class="form-label">Логин</label>
                                        <input type="text" class="form-control" id="username" required>
                                    </div>
                                    <div class="mb-3">
                                        <label for="password" class="form-label">Пароль</label>
                                        <input type="password" class="form-control" id="password" required>
                                    </div>
                                    <button type="submit" class="btn btn-primary w-100">Войти</button>
                                </form>
                                <div id="loginError" class="alert alert-danger mt-3 d-none"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.getElementById('loginForm').addEventListener('submit', async (e) => {
            e.preventDefault();
            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;
            const errorDiv = document.getElementById('loginError');

            try {
                await this.login(username, password);
            } catch (error) {
                errorDiv.textContent = error.message;
                errorDiv.classList.remove('d-none');
            }
        });
    }

    showAuthenticatedUI() {
        // Main app navigation and layout
        document.getElementById('app').innerHTML = `
            <nav class="navbar navbar-expand-lg navbar-dark bg-dark">
                <div class="container">
                    <a class="navbar-brand" href="#" onclick="app.showDashboard()">Store App - SPbPU</a>
                    <div class="navbar-nav ms-auto">
                        <span class="navbar-text me-3">
                            ${this.currentUser.username} (${this.currentUser.role})
                        </span>
                        <button class="btn btn-outline-light btn-sm" onclick="auth.logout()">Выйти</button>
                    </div>
                </div>
            </nav>
            
            <div class="container mt-4">
                <div id="content">
                    <!-- Content will be loaded here -->
                </div>
            </div>
        `;

        // Show dashboard by default
        window.app.showDashboard();
    }
}

// Global auth instance
window.auth = new AuthManager();