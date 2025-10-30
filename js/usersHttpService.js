// usersHttpService.js (обновлённая версия)

import { server } from './server.js';

class UsersHttpService {
  constructor() {
    this.baseURL = server;
    this.isRefreshing = false;
    this.failedQueue = [];
  }

  // Универсальный метод запроса с перехватом 401
  async request(endpoint, method = 'GET', body = null, isFormData = false, retry = true) {
    const headers = {
      'Content-Type': isFormData ? 'application/x-www-form-urlencoded' : 'application/json',
    };
    const token = localStorage.getItem('token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const config = { method, headers };
    if (body) {
      config.body = isFormData ? body : JSON.stringify(body);
    }

    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, config);

      if (response.status === 401 && retry) {
        // Токен истёк — пытаемся обновить
        try {
          await this.refreshToken();
          // Повторяем исходный запрос с новым токеном
          return await this.request(endpoint, method, body, isFormData, false);
        } catch (refreshError) {
          this.logout();
          throw new Error('Сессия истекла. Требуется повторный вход.');
        }
      }

      if (!response.ok) {
        const error = new Error(`HTTP error! Status: ${response.status}`);
        error.status = response.status;
        throw error;
      }

      return await response.json();
    } catch (error) {
      console.error(`Ошибка при запросе к ${endpoint}:`, error);
      throw error;
    }
  }

  // --- Авторизация ---
  async login(username, password) {
    const formData = new URLSearchParams();
    formData.append('grant_type', 'password');
    formData.append('username', username);
    formData.append('password', password);
    formData.append('scope', '');
    formData.append('client_id', '');
    formData.append('client_secret', '');

    const data = await this.request('/users/token', 'POST', formData, true, false);

    localStorage.setItem('token', data.access_token);
    if (data.refresh_token) {
      localStorage.setItem('refresh_token', data.refresh_token);
    }
    localStorage.setItem('username', username);

    let role = data.role;
    if (!role) {
      const users = await this.getUsers();
      const user = users.find(u => u.name === username);
      role = user ? user.role : 'unknown';
    }
    localStorage.setItem('userRole', role || 'unknown');
    return data;
  }

  // --- Обновление токена ---
  async refreshToken() {
    if (this.isRefreshing) {
      // Если уже идёт обновление — ждём
      return new Promise((resolve, reject) => {
        this.failedQueue.push({ resolve, reject });
      });
    }

    this.isRefreshing = true;

    const refreshToken = localStorage.getItem('refresh_token');
    if (!refreshToken) {
      throw new Error('Нет refresh token');
    }

    const formData = new URLSearchParams();
    formData.append('grant_type', 'refresh_token');
    formData.append('refresh_token', refreshToken);
    // client_id/secret — если нужны, добавь

    try {
      const data = await fetch(`${this.baseURL}/users/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData,
      }).then(r => r.json());

      localStorage.setItem('token', data.access_token);
      if (data.refresh_token) {
        localStorage.setItem('refresh_token', data.refresh_token);
      }

      // Разрешаем все запросы в очереди
      this.failedQueue.forEach(({ resolve }) => resolve());
      this.failedQueue = [];

      return data;
    } catch (error) {
      this.failedQueue.forEach(({ reject }) => reject(error));
      this.failedQueue = [];
      throw error;
    } finally {
      this.isRefreshing = false;
    }
  }

  // --- Остальные методы без изменений ---
  async getUsers() { return await this.request('/users'); }
  async getUserById(id) { return await this.request(`/users/${id}`); }
  async createUser(data) { return await this.request('/users', 'POST', data); }
  async updateUser(id, data) { return await this.request(`/users/update/${id}`, 'PUT', data); }
  async deleteUser(id) { return await this.request(`/users/${id}`, 'DELETE'); }

  // --- Выход ---
  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('userRole');
    localStorage.removeItem('username');
    window.location.href = '/'; // или reload, если SPA
  }
}

export default new UsersHttpService();
