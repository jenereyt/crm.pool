// employees.js — ПОЛНЫЙ, ИСПРАВЛЕННЫЙ, ГОТОВЫЙ К ИСПОЛЬЗОВАНИЮ

import UsersHttpService from './usersHttpService.js';

let employees = [];

// === ПОЛУЧЕНИЕ СОТРУДНИКОВ ===
export async function getEmployees() {
  try {
    const employeesData = await UsersHttpService.request('/employees');
    employees = Array.isArray(employeesData) ? employeesData : [];
    return employees;
  } catch (error) {
    console.error('GET /employees:', error);
    return [];
  }
}

// === ПОЛУЧЕНИЕ ПО ID ===
export async function getEmployeeById(id) {
  try {
    return await UsersHttpService.request(`/employees/${id}`);
  } catch (error) {
    console.error(`GET /employees/${id}:`, error);
    return null;
  }
}

// === ДОБАВЛЕНИЕ ===
export async function addEmployee(data) {
  console.log('Data received in addEmployee:', data);
  const required = ['name', 'position', 'phone'];
  const missing = required.filter(f => !data[f]?.trim());
  if (missing.length) {
    alert(`Заполните: ${missing.join(', ')}`);
    return null;
  }

  try {
    const newEmployee = await UsersHttpService.request('/employees', 'POST', data);
    employees.push(newEmployee);
    return newEmployee;
  } catch (error) {
    console.error('POST /employees:', error);
    alert(`Ошибка: ${error.message || 'Не удалось добавить'}`);
    return null;
  }
}

// === ОБНОВЛЕНИЕ ===
export async function updateEmployee(id, data) {
  try {
    const updated = await UsersHttpService.request(`/employees/${id}`, 'PUT', data);
    employees = employees.map(e => e.id === id ? updated : e);
    return updated;
  } catch (error) {
    console.error(`PUT /employees/${id}:`, error);
    alert('Ошибка обновления!');
    return null;
  }
}

// === УДАЛЕНИЕ ===
export async function deleteEmployee(id) {
  try {
    await UsersHttpService.request(`/employees/${id}`, 'DELETE');
    employees = employees.filter(e => e.id !== id);
    return true;
  } catch (error) {
    console.error(`DELETE /employees/${id}:`, error);
    alert('Ошибка удаления!');
    return false;
  }
}

// === ТРЕНЕРЫ ===
export async function getTrainers() {
  if (!employees.length) await getEmployees();
  return employees
    .filter(e => e.position === 'trainer')
    .map(e => ({ id: e.id, name: e.name }));
}

// === UI: ЗАГРУЗКА СТРАНИЦЫ ===
export async function loadEmployees() {
  const mainContent = document.getElementById('main-content');
  if (!mainContent) return;
  mainContent.innerHTML = '';

  // Хедер
  const header = document.createElement('header');
  header.className = 'header';
  header.innerHTML = `
    <div class="header-content">
      <img src="images/icon-employees.svg" alt="Employees Icon" class="header-icon">
      <h1>Сотрудники</h1>
    </div>
  `;
  mainContent.appendChild(header);

  // Фильтры
  const filterBar = document.createElement('div');
  filterBar.className = 'filter-bar';
  filterBar.innerHTML = `
    <input type="text" placeholder="Поиск сотрудников" class="filter-input" id="employee-filter-input">
    <select class="filter-select" id="employee-filter-position">
      <option value="">Все должности</option>
      <option value="trainer">Тренер</option>
      <option value="admin">Администратор</option>
      <option value="manager">Менеджер</option>
    </select>
    <button class="employee-add-btn" id="employee-add-btn">Добавить сотрудника</button>
  `;
  mainContent.appendChild(filterBar);

  // Таблица
  const employeeTable = document.createElement('div');
  employeeTable.className = 'employee-table';
  mainContent.appendChild(employeeTable);

  await getEmployees();
  renderEmployees();

  function renderEmployees() {
    employeeTable.innerHTML = `
      <table>
        <thead>
          <tr>
            <th>Имя</th>
            <th>Должность</th>
            <th>Телефон</th>
            <th>Действия</th>
          </tr>
        </thead>
        <tbody>
          ${employees.map(emp => `
            <tr class="employee-row" id="${emp.id}" data-position="${emp.position}">
              <td>${escapeHtml(emp.name)}</td>
              <td>${formatPosition(emp.position)}</td>
              <td>${escapeHtml(emp.phone)}</td>
              <td>
                <button class="employee-edit-btn" data-id="${emp.id}">
                  <img src="images/icon-edit.svg" alt="Редактировать" class="action-icon">
                </button>
                <button class="employee-delete-btn" data-id="${emp.id}">
                  <img src="images/icon-delete.svg" alt="Удалить" class="action-icon">
                </button>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  }

  function formatPosition(pos) {
    return pos === 'trainer' ? 'Тренер' : pos === 'admin' ? 'Администратор' : 'Менеджер';
  }

  // Фильтрация
  const filterInput = document.getElementById('employee-filter-input');
  const filterPosition = document.getElementById('employee-filter-position');
  const addBtn = document.getElementById('employee-add-btn');

  const filter = () => {
    const term = filterInput.value.toLowerCase();
    const pos = filterPosition.value;
    document.querySelectorAll('.employee-row').forEach(row => {
      const name = row.cells[0].textContent.toLowerCase();
      const emp = employees.find(e => e.id === row.id);
      row.classList.toggle('employee-hidden',
        (term && !name.includes(term)) ||
        (pos && emp.position !== pos)
      );
    });
  };

  filterInput.addEventListener('input', filter);
  filterPosition.addEventListener('change', filter);

  // Добавление
  addBtn.addEventListener('click', () => {
    showEmployeeModal('Добавить сотрудника', {}, async data => {
      const result = await addEmployee(data);
      if (result) {
        renderEmployees();
        filter();
      }
    });
  });

  // Действия
  employeeTable.addEventListener('click', async e => {
    const btn = e.target.closest('button');
    if (!btn) return;
    const id = btn.dataset.id;

    if (btn.classList.contains('employee-delete-btn')) {
      if (confirm('Удалить сотрудника?')) {
        if (await deleteEmployee(id)) {
          renderEmployees();
          filter();
        }
      }
    }

    if (btn.classList.contains('employee-edit-btn')) {
      const emp = employees.find(e => e.id === id);
      showEmployeeModal('Редактировать сотрудника', emp, async data => {
        if (await updateEmployee(id, data)) {
          renderEmployees();
          filter();
        }
      });
    }
  });

  // === МОДАЛКА ===
  function showEmployeeModal(title, employee, callback) {
    const modal = document.createElement('div');
    modal.className = 'employee-modal';
    modal.innerHTML = `
      <div class="employee-modal-content">
        <h2>${escapeHtml(title)}</h2>
        <input type="text" id="employee-name" placeholder="Имя" value="${escapeHtml(employee.name || '')}" required>
        <select id="employee-position" required>
          <option value="">Должность</option>
          <option value="trainer" ${employee.position === 'trainer' ? 'selected' : ''}>Тренер</option>
          <option value="admin" ${employee.position === 'admin' ? 'selected' : ''}>Администратор</option>
          <option value="manager" ${employee.position === 'manager' ? 'selected' : ''}>Менеджер</option>
        </select>
        <input type="tel" id="employee-phone" placeholder="Телефон" value="${escapeHtml(employee.phone || '')}" required>
        <div class="employee-modal-actions">
          <button id="employee-save-btn">Сохранить</button>
          <button id="employee-cancel-btn">Отмена</button>
        </div>
      </div>
    `;
    mainContent.appendChild(modal);

    modal.addEventListener('mousedown', e => {
      if (e.target === modal && !window.getSelection().toString()) modal.remove();
    });

    document.getElementById('employee-save-btn').onclick = () => {
      const name = document.getElementById('employee-name').value.trim();
      const position = document.getElementById('employee-position').value;
      const phone = document.getElementById('employee-phone').value.trim();
      if (name && position && phone) {
        callback({ name, position, phone });
        modal.remove();
      } else {
        alert('Заполните все поля!');
      }
    };

    document.getElementById('employee-cancel-btn').onclick = () => modal.remove();

    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') modal.remove();
    }, { once: true });
  }

  function escapeHtml(s) {
    if (!s) return '';
    return String(s).replace(/[&<>"']/g, m => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[m]));
  }
}
