import { server } from './server.js';

let employees = [];

export async function getEmployees() {
  try {
    const response = await fetch(`${server}/employees`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!response.ok) throw new Error('Ошибка при получении сотрудников');
    const employeesData = await response.json();
    employees = Array.isArray(employeesData) ? employeesData : [];
    return employees;
  } catch (error) {
    console.error('GET /employees:', error);
    return [];
  }
}

export async function getEmployeeById(id) {
  try {
    const response = await fetch(`${server}/employees/${id}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!response.ok) throw new Error('Ошибка при получении сотрудника');
    return await response.json();
  } catch (error) {
    console.error(`GET /employees/${id}:`, error);
    return null;
  }
}

export async function addEmployee(data) {
  console.log('Data received in addEmployee:', data);
  const requiredFields = ['name', 'position', 'phone'];
  const missingFields = requiredFields.filter(field => !data[field] || data[field] === '');
  if (missingFields.length) {
    console.error('Отсутствуют или некорректны поля:', missingFields);
    alert(`Ошибка: Заполните корректно поля: ${missingFields.join(', ')}`);
    return null;
  }

  const phoneFormat = /^\+7\s\(\d{3}\)\s\d{3}-\d{2}-\d{2}$/;
  if (!phoneFormat.test(data.phone)) {
    console.error('Неверный формат телефона:', data.phone);
    alert('Ошибка: Телефон должен быть в формате +7 (XXX) XXX-XX-XX');
    return null;
  }

  try {
    const response = await fetch(`${server}/employees`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Ошибка сервера:', errorData);
      throw new Error(errorData.message || 'Ошибка при добавлении сотрудника');
    }

    const newEmployee = await response.json();
    employees.push(newEmployee);
    return newEmployee;
  } catch (error) {
    console.error('POST /employees:', error);
    alert(`Ошибка при добавлении сотрудника: ${error.message}`);
    return null;
  }
}

export async function updateEmployee(id, data) {
  try {
    const response = await fetch(`${server}/employees/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error('Ошибка при обновлении сотрудника');
    const updatedEmployee = await response.json();
    employees = employees.map(emp => emp.id === id ? updatedEmployee : emp);
    return updatedEmployee;
  } catch (error) {
    console.error(`PUT /employees/${id}:`, error);
    alert('Ошибка при обновлении сотрудника!');
    return null;
  }
}

export async function deleteEmployee(id) {
  try {
    const response = await fetch(`${server}/employees/${id}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!response.ok) throw new Error('Ошибка при удалении сотрудника');
    employees = employees.filter(emp => emp.id !== id);
    return true;
  } catch (error) {
    console.error(`DELETE /employees/${id}:`, error);
    alert('Ошибка при удалении сотрудника!');
    return false;
  }
}

export async function loadEmployees() {
  const mainContent = document.getElementById('main-content');
  mainContent.innerHTML = '';

  const header = document.createElement('header');
  header.className = 'header';
  header.innerHTML = `
    <div class="header-content">
      <img src="images/icon-employees.svg" alt="Employees Icon" class="header-icon">
      <h1>Сотрудники</h1>
    </div>
  `;
  mainContent.appendChild(header);

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
              <td>${emp.position === 'trainer' ? 'Тренер' : emp.position === 'admin' ? 'Администратор' : 'Менеджер'}</td>
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

  const filterInput = document.getElementById('employee-filter-input');
  const filterPosition = document.getElementById('employee-filter-position');
  const addEmployeeBtn = document.getElementById('employee-add-btn');

  filterInput.addEventListener('input', filterEmployees);
  filterPosition.addEventListener('change', filterEmployees);

  addEmployeeBtn.addEventListener('click', () => {
    showEmployeeModal('Добавить сотрудника', {}, async (data) => {
      const newEmployee = {
        name: data.name,
        position: data.position,
        phone: data.phone
      };
      const result = await addEmployee(newEmployee);
      if (result) {
        renderEmployees();
        filterEmployees();
      }
    });
  });

  employeeTable.addEventListener('click', async (e) => {
    if (e.target.closest('.employee-delete-btn')) {
      const empId = e.target.closest('.employee-delete-btn').getAttribute('data-id');
      if (confirm('Удалить сотрудника?')) {
        const success = await deleteEmployee(empId);
        if (success) {
          renderEmployees();
          filterEmployees();
        }
      }
    } else if (e.target.closest('.employee-edit-btn')) {
      const empId = e.target.closest('.employee-edit-btn').getAttribute('data-id');
      const employee = employees.find(emp => emp.id === empId);
      showEmployeeModal('Редактировать сотрудника', employee, async (data) => {
        const updatedEmployee = {
          name: data.name,
          position: data.position,
          phone: data.phone
        };
        const result = await updateEmployee(empId, updatedEmployee);
        if (result) {
          renderEmployees();
          filterEmployees();
        }
      });
    }
  });

  function showEmployeeModal(title, employee, callback) {
    const modal = document.createElement('div');
    modal.className = 'employee-modal';
    modal.innerHTML = `
      <div class="employee-modal-content">
        <h2>${escapeHtml(title)}</h2>
        <input type="text" id="employee-name" placeholder="Имя сотрудника" value="${escapeHtml(employee.name || '')}" required>
        <select id="employee-position" required>
          <option value="">Выберите должность</option>
          <option value="trainer" ${employee.position === 'trainer' ? 'selected' : ''}>Тренер</option>
          <option value="admin" ${employee.position === 'admin' ? 'selected' : ''}>Администратор</option>
          <option value="manager" ${employee.position === 'manager' ? 'selected' : ''}>Менеджер</option>
        </select>
        <input type="tel" id="employee-phone" placeholder="Телефон" value="${escapeHtml(employee.phone || '')}" pattern="\\+7\\s\\(\\d{3}\\)\\s\\d{3}-\\d{2}-\\d{2}" required>
        <div class="employee-modal-actions">
          <button id="employee-save-btn">Сохранить</button>
          <button id="employee-cancel-btn">Отмена</button>
        </div>
      </div>
    `;
    mainContent.appendChild(modal);

    modal.addEventListener('mousedown', (e) => {
      if (e.target.classList.contains('employee-modal') && !window.getSelection().toString()) {
        modal.remove();
      }
    });

    const saveBtn = document.getElementById('employee-save-btn');
    const cancelBtn = document.getElementById('employee-cancel-btn');

    if (saveBtn) {
      saveBtn.addEventListener('click', () => {
        const name = document.getElementById('employee-name').value.trim();
        const position = document.getElementById('employee-position').value;
        const phone = document.getElementById('employee-phone').value.trim();
        if (name && position && phone.match(/\+7\s\(\d{3}\)\s\d{3}-\d{2}-\d{2}/)) {
          callback({ name, position, phone });
          modal.remove();
        } else {
          alert('Заполните все поля корректно! Телефон должен быть в формате +7 (XXX) XXX-XX-XX');
        }
      });
    } else {
      console.error('Save button not found in modal');
    }

    if (cancelBtn) {
      cancelBtn.addEventListener('click', () => {
        modal.remove();
      });
    } else {
      console.error('Cancel button not found in modal');
    }

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        modal.remove();
      }
    }, { once: true });
  }

  function filterEmployees() {
    const searchTerm = filterInput.value.toLowerCase();
    const position = filterPosition.value;
    const employeeRows = employeeTable.querySelectorAll('.employee-row');
    employeeRows.forEach(row => {
      const name = row.querySelector('td').textContent.toLowerCase();
      const emp = employees.find(emp => emp.id === row.id);
      row.classList.toggle('employee-hidden',
        (searchTerm && !name.includes(searchTerm)) ||
        (position && emp.position !== position)
      );
    });
  }

  function escapeHtml(s) {
    if (!s) return '';
    return String(s).replace(/[&<>"']/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
  }
}

export function getTrainers() {
  return employees
    ? employees.filter(emp => emp.position === 'trainer').map(emp => emp.name)
    : [];
}
