export function loadProfile(userRole) {
  const mainContent = document.getElementById('main-content');
  const username = localStorage.getItem('username');
  mainContent.innerHTML = `
    <div class="profile-page">
      <header class="header">
        <h1><img src="./images/icon-profile.svg" alt="Профиль"> Профиль</h1>
      </header>
      <div class="profile-content">
        <div class="profile-card">
          <h2>${username}</h2>
          <p>Роль: ${userRole === 'manager' ? 'Менеджер' : 'Администратор'}</p>
          <div class="profile-actions">
            <button id="logout-btn" class="btn-danger">Выход</button>
          </div>
        </div>
        ${userRole === 'manager' ? `
          <div class="admin-management">
            <h2>Управление администраторами</h2>
            <button id="register-admin-btn" class="btn-primary">Зарегистрировать администратора</button>
            <div class="admin-list">
              <h3>Список администраторов</h3>
              <table class="admin-table">
                <thead>
                  <tr>
                    <th>Имя пользователя</th>
                    <th>Действия</th>
                  </tr>
                </thead>
                <tbody id="admin-list-body"></tbody>
              </table>
            </div>
          </div>
        ` : ''}
      </div>
    </div>
  `;

  if (userRole === 'manager') {
    // Загрузка списка администраторов
    const adminListBody = document.getElementById('admin-list-body');
    const admins = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key.startsWith('user_')) {
        const userData = JSON.parse(localStorage.getItem(key));
        if (userData.role === 'admin') {
          admins.push({ username: key.replace('user_', ''), ...userData });
        }
      }
    }
    adminListBody.innerHTML = admins.map(admin => `
      <tr>
        <td>${admin.username}</td>
        <td>
        <div class="admin-actions">
          <button class="reset-password-btn btn-secondary" data-username="${admin.username}">Сбросить пароль</button>
          <button class="delete-admin-btn btn-danger" data-username="${admin.username}">Удалить</button>
        </div>
        </td>
      </tr>
    `).join('');

    // Регистрация нового администратора
    document.getElementById('register-admin-btn').addEventListener('click', () => {
      mainContent.innerHTML = `
        <div class="profile-page">
          <header class="header">
            <h1><img src="./images/icon-profile.svg" alt="Профиль"> Регистрация администратора</h1>
          </header>
          <div class="auth-form">
            <form id="register-admin-form">
              <input type="text" id="admin-username" placeholder="Имя пользователя" required>
              <input type="password" id="admin-password" placeholder="Пароль" required>
              <div class="form-actions">
                <button type="submit" class="btn-primary">Зарегистрировать</button>
                <button type="button" id="cancel-btn" class="btn-secondary">Отмена</button>
              </div>
            </form>
          </div>
        </div>
      `;

      document.getElementById('register-admin-form').addEventListener('submit', (e) => {
        e.preventDefault();
        const username = document.getElementById('admin-username').value;
        const password = document.getElementById('admin-password').value;
        const key = `user_${username}`;
        if (localStorage.getItem(key)) {
          alert('Пользователь уже существует');
        } else {
          localStorage.setItem(key, JSON.stringify({ password, role: 'admin' }));
          alert('Администратор успешно зарегистрирован');
          loadProfile(userRole);
        }
      });

      document.getElementById('cancel-btn').addEventListener('click', () => {
        loadProfile(userRole);
      });
    });

    // Сброс пароля
    document.querySelectorAll('.reset-password-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const username = e.target.getAttribute('data-username');
        const newPassword = prompt('Введите новый пароль для ' + username);
        if (newPassword) {
          localStorage.setItem(`user_${username}`, JSON.stringify({ password: newPassword, role: 'admin' }));
          alert(`Пароль для ${username} успешно сброшен`);
          loadProfile(userRole);
        }
      });
    });

    // Удаление администратора
    document.querySelectorAll('.delete-admin-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const username = e.target.getAttribute('data-username');
        if (confirm(`Вы уверены, что хотите удалить администратора ${username}?`)) {
          localStorage.removeItem(`user_${username}`);
          alert(`Администратор ${username} удален`);
          loadProfile(userRole);
        }
      });
    });
  }

  // Выход
  document.getElementById('logout-btn').addEventListener('click', () => {
    localStorage.removeItem('userRole');
    localStorage.removeItem('username');
    location.reload();
  });
}
