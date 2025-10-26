// profile.js
import UsersHttpService from './usersHttpService.js';

export function loadProfile(userRole) {
  console.log('Роль пользователя в loadProfile:', userRole); // Для отладки
  const mainContent = document.getElementById('main-content');
  const username = localStorage.getItem('username');
  
  const roleDisplay = userRole === 'manager' ? 'Менеджер' : 
                     userRole === 'admin' ? 'Администратор' : 
                     'Неизвестная роль';
  
  mainContent.innerHTML = `
    <div class="profile-page">
      <header class="header">
        <h1><img src="./images/icon-profile.svg" alt="Профиль" width="24" height="24"> Профиль</h1>
      </header>
      <div class="profile-content">
        <div class="profile-card">
          <h2>${username}</h2>
          <p>Роль: ${roleDisplay}</p>
          <div class="profile-actions">
            <button id="logout-btn" class="btn-danger">Выход</button>
          </div>
        </div>
        ${userRole === 'manager' ? `
          <div class="admin-management">
            <h2>Управление пользователями</h2>
            <button id="register-admin-btn" class="btn-primary">Зарегистрировать администратора</button>
            <div class="admin-list">
              <h3>Администраторы</h3>
              <table class="admin-table">
                <thead>
                  <tr>
                    <th>Имя пользователя</th>
                    <th>Действия</th>
                  </tr>
                </thead>
                <tbody id="admin-list-body"></tbody>
              </table>
              <h3>Менеджеры</h3>
              <table class="manager-table">
                <thead>
                  <tr>
                    <th>Имя пользователя</th>
                    <th>Действия</th>
                  </tr>
                </thead>
                <tbody id="manager-list-body"></tbody>
              </table>
            </div>
          </div>
        ` : ''}
      </div>
    </div>
  `;

  if (userRole === 'manager') {
    const adminListBody = document.getElementById('admin-list-body');
    const managerListBody = document.getElementById('manager-list-body');
    UsersHttpService.getUsers()
      .then(users => {
        const adminData = users.filter(user => user.role === 'admin');
        const managerData = users.filter(user => user.role === 'manager');
        console.log('Администраторы:', adminData); // Для отладки
        console.log('Менеджеры:', managerData); // Для отладки

        // Заполняем таблицу администраторов
        if (adminData.length === 0) {
          adminListBody.innerHTML = '<tr><td colspan="2">Администраторы не найдены</td></tr>';
        } else {
          adminListBody.innerHTML = adminData.map(admin => `
            <tr>
              <td>${admin.name}</td>
              <td>
                <div class="admin-actions">
                  <button class="reset-password-btn btn-secondary" data-username="${admin.name}" data-id="${admin.id}">Сбросить пароль</button>
                  <button class="delete-admin-btn btn-danger" data-username="${admin.name}" data-id="${admin.id}">
                    <img src="./images/trash.svg" alt="Удалить" width="16" height="16" class="action-icon">
                  </button>
                </div>
              </td>
            </tr>
          `).join('');
        }

        // Заполняем таблицу менеджеров
        if (managerData.length === 0) {
          managerListBody.innerHTML = '<tr><td colspan="2">Менеджеры не найдены</td></tr>';
        } else {
          managerListBody.innerHTML = managerData.map(manager => `
            <tr>
              <td>${manager.name}</td>
              <td>
                <div class="admin-actions">
                  <button class="delete-admin-btn btn-danger" data-username="${manager.name}" data-id="${manager.id}">
                    <img src="./images/trash.svg" alt="Удалить" width="16" height="16" class="action-icon">
                  </button>
                </div>
              </td>
            </tr>
          `).join('');
        }

        document.getElementById('register-admin-btn').addEventListener('click', () => {
          mainContent.innerHTML = `
            <div class="profile-page">
              <header class="header">
                <h1><img src="./images/icon-profile.svg" alt="Профиль" width="24" height="24"> Регистрация администратора</h1>
              </header>
              <div class="auth-form">
                <form id="register-admin-form">
                  <input type="text" id="admin-username" placeholder="Имя пользователя" autocomplete="username" required>
                  <input type="password" id="admin-password" placeholder="Пароль" autocomplete="new-password" required>
                  <div class="form-actions">
                    <button type="submit" class="btn-primary">Зарегистрировать</button>
                    <button type="button" id="cancel-btn" class="btn-secondary">Отмена</button>
                  </div>
                </form>
              </div>
            </div>
          `;

          document.getElementById('register-admin-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const username = document.getElementById('admin-username').value;
            const password = document.getElementById('admin-password').value;
            const submitButton = e.target.querySelector('button[type="submit"]');
            submitButton.disabled = true;

            try {
              await UsersHttpService.createUser({ name: username, password, role: 'admin' });
              alert('Администратор успешно зарегистрирован');
              loadProfile(userRole);
            } catch (error) {
              console.error('Ошибка при регистрации администратора:', error); // Для отладки
              if (error.status === 400 || error.status === 409) {
                alert('Пользователь с таким именем уже существует');
              } else {
                alert('Ошибка при регистрации администратора: ' + error.message);
              }
            } finally {
              submitButton.disabled = false;
            }
          });

          document.getElementById('cancel-btn').addEventListener('click', () => {
            loadProfile(userRole);
          });
        });

        document.querySelectorAll('.reset-password-btn').forEach(btn => {
          btn.addEventListener('click', async (e) => {
            const id = e.target.getAttribute('data-id');
            const username = e.target.getAttribute('data-username');
            const newPassword = prompt(`Введите новый пароль для ${username}`);
            if (newPassword) {
              try {
                await UsersHttpService.updateUser(id, { password: newPassword });
                alert(`Пароль для ${username} успешно сброшен`);
                loadProfile(userRole);
              } catch (error) {
                alert('Ошибка при сбросе пароля: ' + error.message);
              }
            }
          });
        });

        document.querySelectorAll('.delete-admin-btn').forEach(btn => {
          btn.addEventListener('click', async (e) => {
            const id = e.target.getAttribute('data-id');
            const username = e.target.getAttribute('data-username');
            if (confirm(`Вы уверены, что хотите удалить пользователя ${username}?`)) {
              try {
                await UsersHttpService.deleteUser(id);
                alert(`Пользователь ${username} удален`);
                loadProfile(userRole);
              } catch (error) {
                alert('Ошибка при удалении пользователя: ' + error.message);
              }
            }
          });
        });
      })
      .catch(error => {
        console.error('Ошибка загрузки пользователей:', error);
        adminListBody.innerHTML = '<tr><td colspan="2">Не удалось загрузить список администраторов</td></tr>';
        managerListBody.innerHTML = '<tr><td colspan="2">Не удалось загрузить список менеджеров</td></tr>';
      });
  }

  document.getElementById('logout-btn').addEventListener('click', async () => {
    await UsersHttpService.logout();
  });
}
