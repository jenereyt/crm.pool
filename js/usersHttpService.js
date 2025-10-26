// usersHttpService.js
import { server } from './server.js';

class UsersHttpService {
  constructor() {
    this.baseURL = server; // http://89.236.218.209:6577
  }

  async request(endpoint, method = 'GET', body = null, isFormData = false) {
    const headers = {
      'Content-Type': isFormData ? 'application/x-www-form-urlencoded' : 'application/json',
    };
    const token = localStorage.getItem('token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const config = {
      method,
      headers,
    };
    if (body) {
      config.body = isFormData ? body : JSON.stringify(body);
    }

    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, config);
      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('userRole');
          localStorage.removeItem('username');
          window.location.reload();
        }
        const error = new Error(`HTTP error! Status: ${response.status}`);
        error.status = response.status;
        throw error;
      }
      const data = await response.json();
      console.log(`Ответ сервера на ${endpoint}:`, data); // Для отладки
      return data;
    } catch (error) {
      console.error(`Ошибка при запросе к ${endpoint}:`, error);
      throw error;
    }
  }

  async login(username, password) {
    const formData = new URLSearchParams();
    formData.append('grant_type', 'password');
    formData.append('username', username);
    formData.append('password', password);
    formData.append('scope', '');
    formData.append('client_id', '');
    formData.append('client_secret', '');

    try {
      const data = await this.request('/users/token', 'POST', formData, true);
      localStorage.setItem('token', data.access_token);
      localStorage.setItem('username', username);

      let role = data.role;
      if (!role) {
        console.warn('Роль не возвращена в /users/token, запрашиваем /users');
        const users = await this.getUsers();
        const user = users.find(u => u.name === username);
        role = user ? user.role : 'unknown';
        console.log('Роль после запроса к /users:', role);
      }
      
      localStorage.setItem('userRole', role || 'unknown');
      return data;
    } catch (error) {
      throw new Error('Ошибка авторизации');
    }
  }

  async getUsers() {
    return await this.request('/users');
  }

  async getUserById(id) {
    return await this.request(`/users/${id}`);
  }

  async createUser(data) {
    return await this.request('/users', 'POST', data);
  }

  async updateUser(id, data) {
    return await this.request(`/users/update/${id}`, 'PUT', data);
  }

  async deleteUser(id) {
    return await this.request(`/users/${id}`, 'DELETE');
  }

  async logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('userRole');
    localStorage.removeItem('username');
    window.location.reload();
  }
}

export default new UsersHttpService();
