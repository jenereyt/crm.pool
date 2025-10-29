// usersHttpService.js — ГОТОВАЯ ВЕРСИЯ С REFRESH TOKEN

import { server } from './server.js';

class UsersHttpService {
  constructor() {
    this.baseURL = server;
    this.isRefreshing = false;
    this.failedQueue = [];
  }

  // === Универсальный запрос с перехватом 401 ===
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

      // === 401 → Пытаемся обновить токен ===
      if (response.status === 401 && retry) {
        try {
          await this.refreshToken(); // ← используем метод ниже
          return await this.request(endpoint, method, body, isFormData, false);
        } catch (refreshError) {
          this.logout();
          throw new Error('Сессия истекла. Войдите заново.');
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

  // === Логин ===
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

    // Роль
    let role = data.role;
    if (!role) {
      const users = await this.getUsers();
      const user = users.find(u => u.name === username);
      role = user ? user.role : 'unknown';
    }
    localStorage.setItem('userRole', role || 'unknown');

    return data;
  }

  // === Обновление токена (через request, без retry) ===
  async refreshToken() {
    if (this.isRefreshing) {
      return new Promise((resolve, reject) => {
        this.failedQueue.push({ resolve, reject });
      });
    }

    this.isRefreshing = true;
    const refreshToken = localStorage.getItem('refresh_token');

    if (!refreshToken) {
      this.isRefreshing = false;
      throw new Error('Нет refresh_token');
    }

    const formData = new URLSearchParams();
    formData.append('grant_type', 'refresh_token');
    formData.append('refresh_token', refreshToken);

    try {
      // Используем this.request, но БЕЗ retry и БЕЗ токена в заголовке
      const data = await fetch(`${this.baseURL}/users/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: formData,
      }).then(r => {
        if (!r.ok) throw new Error('Ошибка обновления токена');
        return r.json();
      });

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

  // === Методы API ===
  async getUsers() { return await this.request('/users'); }
  async getUserById(id) { return await this.request(`/users/${id}`); }
  async createUser(data) { return await this.request('/users', 'POST', data); }
  async updateUser(id, data) { return await this.request(`/users/update/${id}`, 'PUT', data); }
  async deleteUser(id) { return await this.request(`/users/${id}`, 'DELETE'); }

  // === Дополнительно: можно добавить ===
  async getRooms() { return await this.request('/rooms'); }
  async createRoom(data) { return await this.request('/rooms', 'POST', data); }
  async updateRoom(id, data) { return await this.request(`/rooms/${id}`, 'PUT', data); }
  async deleteRoom(id) { return await this.request(`/rooms/${id}`, 'DELETE'); }

  // === Выход ===
  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('userRole');
    localStorage.removeItem('username');
    window.location.href = '/';
  }
}

export default new UsersHttpService();
