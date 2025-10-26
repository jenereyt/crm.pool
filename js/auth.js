// auth.js
import UsersHttpService from './usersHttpService.js';

export function loadAuth() {
  const mainContent = document.getElementById('main-content');
  mainContent.innerHTML = `
    <div class="auth-page">
      <h1>Добро пожаловать в CRM</h1>
      <div class="auth-form">
        <h2>Авторизация</h2>
        <form id="login-form">
          <input type="text" id="username" placeholder="Имя пользователя" autocomplete="username" required>
          <input type="password" id="password" placeholder="Пароль" autocomplete="current-password" required>
          <button type="submit" class="btn-primary">Войти</button>
        </form>
      </div>
    </div>
  `;

  document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const submitButton = e.target.querySelector('button[type="submit"]');
    submitButton.disabled = true;

    try {
      await UsersHttpService.login(username, password);
      window.location.reload();
    } catch (error) {
      alert(error.message === 'Ошибка авторизации' ? 'Неверный логин или пароль' : 'Ошибка сервера. Попробуйте позже.');
    } finally {
      submitButton.disabled = false;
    }
  });
}
