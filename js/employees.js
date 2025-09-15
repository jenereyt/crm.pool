// employees.js (no changes)
let employees = [
  { id: 'emp1', name: 'Анна Иванова', position: 'trainer', phone: '+7 (900) 123-45-67' },
  { id: 'emp2', name: 'Мария Петрова', position: 'trainer', phone: '+7 (900) 234-56-78' },
  { id: 'emp3', name: 'Олег Смирнов', position: 'trainer', phone: '+7 (900) 345-67-89' },
  { id: 'emp4', name: 'Елена Козлова', position: 'admin', phone: '+7 (900) 456-78-90' },
  { id: 'emp5', name: 'Иван Кузнецов', position: 'manager', phone: '+7 (900) 567-89-01' },
];

export function loadEmployees() {
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
              <td>${emp.name}</td>
              <td>${emp.position === 'trainer' ? 'Тренер' : emp.position === 'admin' ? 'Администратор' : 'Менеджер'}</td>
              <td>${emp.phone}</td>
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

  renderEmployees();

  const filterInput = document.getElementById('employee-filter-input');
  const filterPosition = document.getElementById('employee-filter-position');
  const addEmployeeBtn = document.getElementById('employee-add-btn');

  filterInput.addEventListener('input', filterEmployees);
  filterPosition.addEventListener('change', filterEmployees);

  addEmployeeBtn.addEventListener('click', () => {
    showEmployeeModal('Добавить сотрудника', {}, (data) => {
      const newEmployee = {
        id: `emp${Date.now()}`,
        name: data.name,
        position: data.position,
        phone: data.phone
      };
      employees.push(newEmployee);
      renderEmployees();
      filterEmployees();
    });
  });

  employeeTable.addEventListener('click', (e) => {
    if (e.target.closest('.employee-delete-btn')) {
      const empId = e.target.closest('.employee-delete-btn').getAttribute('data-id');
      employees = employees.filter(emp => emp.id !== empId);
      renderEmployees();
      filterEmployees();
    } else if (e.target.closest('.employee-edit-btn')) {
      const empId = e.target.closest('.employee-edit-btn').getAttribute('data-id');
      const employee = employees.find(emp => emp.id === empId);
      showEmployeeModal('Редактировать сотрудника', employee, (data) => {
        employee.name = data.name;
        employee.position = data.position;
        employee.phone = data.phone;
        renderEmployees();
        filterEmployees();
      });
    }
  });

  function showEmployeeModal(title, employee, callback) {
    const modal = document.createElement('div');
    modal.className = 'employee-modal';
    modal.innerHTML = `
      <div class="employee-modal-content">
        <h2>${title}</h2>
        <input type="text" id="employee-name" placeholder="Имя сотрудника" value="${employee.name || ''}" required>
        <select id="employee-position" required>
          <option value="">Выберите должность</option>
          <option value="trainer" ${employee.position === 'trainer' ? 'selected' : ''}>Тренер</option>
          <option value="admin" ${employee.position === 'admin' ? 'selected' : ''}>Администратор</option>
          <option value="manager" ${employee.position === 'manager' ? 'selected' : ''}>Менеджер</option>
        </select>
        <input type="tel" id="employee-phone" placeholder="Телефон" value="${employee.phone || ''}" pattern="\\+7\\s\\(\\d{3}\\)\\s\\d{3}-\\d{2}-\\d{2}" required>
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

    document.getElementById('employee-save-btn').addEventListener('click', () => {
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

    document.getElementById('employee-cancel-btn').addEventListener('click', () => {
      modal.remove();
    });
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
}

export function getTrainers() {
  return employees
    ? employees.filter(emp => emp.position === 'trainer').map(emp => emp.name)
    : [];
}
