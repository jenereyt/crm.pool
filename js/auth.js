export function loadAuth() {
  const mainContent = document.getElementById('main-content');
  mainContent.innerHTML = `
    <div class="auth-page">
      <h1>Добро пожаловать в CRM</h1>
      <div class="auth-form">
        <h2>Авторизация</h2>
        <form id="login-form">
          <input type="text" id="username" placeholder="Имя пользователя" required>
          <input type="password" id="password" placeholder="Пароль" required>
          <button type="submit" class="btn-primary">Войти</button>
        </form>
      </div>
    </div>
  `;

  // Логин
  document.getElementById('login-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const storedUser = localStorage.getItem(`user_${username}`);
    if (storedUser) {
      const userData = JSON.parse(storedUser);
      if (userData.password === password) {
        localStorage.setItem('userRole', userData.role);
        localStorage.setItem('username', username);
        location.reload();
      } else {
        alert('Неверный пароль');
      }
    } else {
      alert('Пользователь не найден');
    }
  });
}
