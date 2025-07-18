export function loadSubscriptions() {
    const mainContent = document.getElementById('main-content');
    mainContent.innerHTML = '';

    const header = document.createElement('header');
    header.className = 'header';
    header.innerHTML = `
    <h1>Абонементы</h1>
    <div class="user-actions">
      <span>Пользователь</span>
      <button>Выход</button>
    </div>
  `;
    mainContent.appendChild(header);

    const filterBar = document.createElement('div');
    filterBar.className = 'filter-bar';
    filterBar.innerHTML = `
    <input type="text" placeholder="Поиск абонементов" class="filter-input" id="subscriptions-filter-input">
    <select class="filter-select" id="subscriptions-filter-select">
      <option value="">Все абонементы</option>
      <option value="active">Активные</option>
      <option value="expired">Просроченные</option>
    </select>
  `;
    mainContent.appendChild(filterBar);

    const subscriptions = [
        { id: 1, clientName: 'Иванов Иван', type: 'Месячный', startDate: '2025-06-18', endDate: '2025-07-18', status: 'active', price: 5000 },
        { id: 2, clientName: 'Сидоров Сергей', type: 'Квартальный', startDate: '2025-04-01', endDate: '2025-06-30', status: 'expired', price: 12000 },
    ];

    const table = document.createElement('table');
    table.className = 'subscriptions-table';
    table.innerHTML = `
    <thead>
      <tr>
        <th>Клиент</th>
        <th>Тип</th>
        <th>Дата начала</th>
        <th>Дата окончания</th>
        <th>Статус</th>
        <th>Цена</th>
        <th>Действия</th>
      </tr>
    </thead>
    <tbody id="subscriptions-table-body"></tbody>
  `;
    mainContent.appendChild(table);

    const tbody = document.getElementById('subscriptions-table-body');
    subscriptions.forEach(subscription => {
        const row = document.createElement('tr');
        row.setAttribute('data-id', subscription.id);
        row.innerHTML = `
      <td>${subscription.clientName}</td>
      <td>${subscription.type}</td>
      <td>${subscription.startDate}</td>
      <td>${subscription.endDate}</td>
      <td>${subscription.status}</td>
      <td>${subscription.price} UZS</td>
      <td>
        <img src="./images/icon-edit.svg" alt="Edit" class="action-icon" data-id="${subscription.id}">
        <img src="./images/icon-delete.svg" alt="Delete" class="action-icon" data-id="${subscription.id}">
      </td>
    `;
        let hoverTimeout;
        row.addEventListener('mouseout', () => {
            clearTimeout(hoverTimeout);
        });
        row.addEventListener('click', (e) => {
            if (!e.target.classList.contains('action-icon')) {
                console.log('Клик по абонементу с ID:', subscription.id);
                import('./subscriptionsModal.js')
                    .then(module => {
                        console.log('Модуль subscriptionsModal.js загружен:', Object.keys(module));
                        if (typeof module.openModal === 'function') {
                            module.openModal(subscription.id);
                        } else {
                            console.error('Функция openModal не найдена в модуле. Экспортированные ключи:', Object.keys(module));
                        }
                    })
                    .catch(err => {
                        console.error('Ошибка при импорте subscriptionsModal.js:', err);
                    });
            }
        });
        tbody.appendChild(row);
    });

    const addSubscriptionBtn = document.createElement('button');
    addSubscriptionBtn.className = 'add-subscription-btn';
    addSubscriptionBtn.textContent = 'Добавить абонемент';
    addSubscriptionBtn.addEventListener('click', () => {
        console.log('Клик по добавлению абонемента');
        import('./subscriptionsModal.js')
            .then(module => {
                console.log('Модуль subscriptionsModal.js загружен:', Object.keys(module));
                if (typeof module.openModal === 'function') {
                    module.openModal(null);
                } else {
                    console.error('Функция openModal не найдена в модуле. Экспортированные ключи:', Object.keys(module));
                }
            })
            .catch(err => {
                console.error('Ошибка при импорте subscriptionsModal.js:', err);
            });
    });
    mainContent.appendChild(addSubscriptionBtn);

    const filterInput = document.getElementById('subscriptions-filter-input');
    const filterSelect = document.getElementById('subscriptions-filter-select');
    filterInput.addEventListener('input', filterTable);
    filterSelect.addEventListener('change', filterTable);

    function filterTable() {
        const searchTerm = filterInput.value.toLowerCase();
        const filter = filterSelect.value;
        const rows = tbody.querySelectorAll('tr');
        rows.forEach(row => {
            const text = row.textContent.toLowerCase();
            const subscription = subscriptions.find(s => s.id === parseInt(row.getAttribute('data-id')));
            const matchesSearch = !searchTerm || text.includes(searchTerm);
            const matchesFilter = !filter || (filter === 'active' ? subscription.status === 'active' : subscription.status === filter);
            row.style.display = matchesSearch && matchesFilter ? '' : 'none';
        });
    }
}