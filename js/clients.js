export function loadClients() {
  const mainContent = document.getElementById('main-content');
  mainContent.innerHTML = '';

  const header = document.createElement('header');
  header.className = 'header';
  header.innerHTML = `
    <h1>Клиенты</h1>
    <div class="user-actions">
      <span>Пользователь</span>
      <button>Выход</button>
    </div>
  `;
  mainContent.appendChild(header);

  const filterBar = document.createElement('div');
  filterBar.className = 'filter-bar';
  filterBar.innerHTML = `
    <input type="text" placeholder="Поиск клиентов" class="filter-input" id="clients-filter-input">
    <select class="filter-select" id="clients-filter-select">
      <option value="">Все клиенты</option>
      <option value="active">Действующие клиенты</option>
      <option value="hall1">Зал 1</option>
      <option value="hall2">Зал 2</option>
      <option value="hall3">Зал 3</option>
    </select>
  `;
  mainContent.appendChild(filterBar);

  const clients = [
    { id: 1, fullName: 'Иванов Иван', parentName: 'Петров Пётр', phones: ['+998-90-123-45-67', '+998-91-234-56-78'], diagnosis: 'Здоров', status: 'active' },
    { id: 2, fullName: 'Сидоров Сергей', parentName: 'Иванов Игорь', phones: ['+998-93-345-67-89', '+998-94-456-78-90'], diagnosis: 'Аллергія', status: 'inactive' },
  ];

  const table = document.createElement('table');
  table.className = 'clients-table';
  table.innerHTML = `
    <thead>
      <tr>
        <th>ФИО</th>
        <th>ФИО родителей</th>
        <th>Телефоны</th>
        <th>Диагноз</th>
        <th>Действия</th>
      </tr>
    </thead>
    <tbody id="clients-table-body"></tbody>
  `;
  mainContent.appendChild(table);

  const tbody = document.getElementById('clients-table-body');
  clients.forEach(client => {
    const row = document.createElement('tr');
    row.setAttribute('data-id', client.id);
    row.innerHTML = `
      <td>${client.fullName}</td>
      <td>${client.parentName}</td>
      <td>${client.phones.join(', ')}</td>
      <td>${client.diagnosis}</td>
      <td>
        <img src="./images/icon-edit.svg" alt="Edit" class="action-icon" data-id="${client.id}">
        <img src="./images/icon-delete.svg" alt="Delete" class="action-icon" data-id="${client.id}">
      </td>
    `;
    let hoverTimeout;

    row.addEventListener('mouseout', () => {
      clearTimeout(hoverTimeout);
    });
    row.addEventListener('click', (e) => {
      if (!e.target.classList.contains('action-icon')) {
        console.log('Клик по клиенту с ID:', client.id);
        import('./clientsModal.js')
          .then(module => {
            console.log('Модуль clientsModal.js загружен:', Object.keys(module));
            if (typeof module.openModal === 'function') {
              module.openModal(client.id);
            } else {
              console.error('Функция openModal не найдена в модуле. Экспортированные ключи:', Object.keys(module));
            }
          })
          .catch(err => {
            console.error('Ошибка при импорте clientsModal.js:', err);
          });
      }
    });
    tbody.appendChild(row);
  });

  const addClientBtn = document.createElement('button');
  addClientBtn.className = 'add-client-btn';
  addClientBtn.textContent = 'Добавить клиента';
  addClientBtn.addEventListener('click', () => {
    console.log('Клик по добавлению клиента');
    import('./clientsModal.js')
      .then(module => {
        console.log('Модуль clientsModal.js загружен:', Object.keys(module));
        if (typeof module.openModal === 'function') {
          module.openModal(null);
        } else {
          console.error('Функция openModal не найдена в модуле. Экспортированные ключи:', Object.keys(module));
        }
      })
      .catch(err => {
        console.error('Ошибка при импорте clientsModal.js:', err);
      });
  });
  mainContent.appendChild(addClientBtn);

  const filterInput = document.getElementById('clients-filter-input');
  const filterSelect = document.getElementById('clients-filter-select');
  filterInput.addEventListener('input', filterTable);
  filterSelect.addEventListener('change', filterTable);

  function filterTable() {
    const searchTerm = filterInput.value.toLowerCase();
    const filter = filterSelect.value;
    const rows = tbody.querySelectorAll('tr');
    rows.forEach(row => {
      const text = row.textContent.toLowerCase();
      const client = clients.find(c => c.id === parseInt(row.getAttribute('data-id')));
      const matchesSearch = !searchTerm || text.includes(searchTerm);
      const matchesFilter = !filter || (filter === 'active' ? client.status === 'active' : text.includes(filter));
      row.style.display = matchesSearch && matchesFilter ? '' : 'none';
    });
  }
}