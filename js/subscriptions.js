import { getClients } from './clients.js';

let subscriptions = [
  {
    id: 'sub1',
    clientId: 'client1',
    type: '8 занятий',
    startDate: '2025-08-01',
    endDate: '2025-08-31',
    remainingClasses: 8
  },
  {
    id: 'sub2',
    clientId: 'client2',
    type: 'Безлимит',
    startDate: '2025-08-01',
    endDate: '2025-08-31',
    remainingClasses: Infinity
  }
];

export async function getSubscriptions() {
  return subscriptions;
}

export async function loadSubscriptions() {
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
    <input type="text" id="subscription-filter" class="filter-input" placeholder="Поиск по клиенту">
    <button class="subscription-add-btn" id="subscription-add-btn">Добавить абонемент</button>
  `;
  mainContent.appendChild(filterBar);

  const subscriptionList = document.createElement('div');
  subscriptionList.className = 'subscription-list';
  mainContent.appendChild(subscriptionList);

  const clients = await getClients();

  function renderSubscriptions() {
    const filter = document.getElementById('subscription-filter').value.toLowerCase();
    subscriptionList.innerHTML = subscriptions
      .filter(sub => {
        const client = clients.find(c => c.id === sub.clientId);
        return client && client.name.toLowerCase().includes(filter);
      })
      .map(sub => {
        const client = clients.find(c => c.id === sub.clientId);
        return `
          <div class="subscription-container" data-id="${sub.id}">
            <h3>Абонемент для ${client.name}</h3>
            <p>Тип: ${sub.type}</p>
            <p>Дата начала: ${sub.startDate}</p>
            <p>Дата окончания: ${sub.endDate}</p>
            <p>Осталось занятий: ${sub.remainingClasses === Infinity ? 'Безлимит' : sub.remainingClasses}</p>
            <div class="subscription-actions">
              <button class="subscription-edit-btn" data-id="${sub.id}">Редактировать</button>
              <button class="subscription-delete-btn" data-id="${sub.id}">Удалить</button>
            </div>
          </div>
        `;
      }).join('');
  }

  renderSubscriptions();

  document.getElementById('subscription-filter').addEventListener('input', renderSubscriptions);
  document.getElementById('subscription-add-btn').addEventListener('click', async () => {
    const clientsList = await getClients();
    showSubscriptionForm('Добавить абонемент', {}, clientsList, (data) => {
      subscriptions.push({
        id: `sub${Date.now()}`,
        ...data
      });
      renderSubscriptions();
    });
  });

  subscriptionList.addEventListener('click', async (e) => {
    if (e.target.classList.contains('subscription-delete-btn')) {
      const subId = e.target.getAttribute('data-id');
      if (confirm('Удалить абонемент?')) {
        subscriptions = subscriptions.filter(sub => sub.id !== subId);
        renderSubscriptions();
      }
    } else if (e.target.classList.contains('subscription-edit-btn')) {
      const subId = e.target.getAttribute('data-id');
      const sub = subscriptions.find(s => s.id === subId);
      const clientsList = await getClients();
      showSubscriptionForm('Редактировать абонемент', sub, clientsList, (data) => {
        Object.assign(sub, data);
        renderSubscriptions();
      });
    }
  });

  function showSubscriptionForm(title, sub, clients, callback) {
    const modal = document.createElement('div');
    modal.className = 'subscription-modal';
    modal.innerHTML = `
      <div class="subscription-modal-content">
        <h2>${title}</h2>
        <select id="subscription-client" required>
          <option value="">Выберите клиента</option>
          ${clients.map(client => `<option value="${client.id}" ${sub.clientId === client.id ? 'selected' : ''}>${client.name}</option>`).join('')}
        </select>
        <select id="subscription-type" required>
          <option value="">Выберите тип</option>
          <option value="8 занятий" ${sub.type === '8 занятий' ? 'selected' : ''}>8 занятий</option>
          <option value="12 занятий" ${sub.type === '12 занятий' ? 'selected' : ''}>12 занятий</option>
          <option value="Безлимит" ${sub.type === 'Безлимит' ? 'selected' : ''}>Безлимит</option>
        </select>
        <input type="date" id="subscription-start-date" value="${sub.startDate || ''}" required>
        <input type="date" id="subscription-end-date" value="${sub.endDate || ''}" required>
        <input type="number" id="subscription-remaining-classes" value="${sub.remainingClasses === Infinity ? '' : sub.remainingClasses || ''}" placeholder="Осталось занятий (пусто для безлимита)">
        <div class="subscription-modal-actions">
          <button id="subscription-save-btn">Сохранить</button>
          <button id="subscription-cancel-btn">Отмена</button>
        </div>
      </div>
    `;
    mainContent.appendChild(modal);

    document.getElementById('subscription-save-btn').addEventListener('click', () => {
      const clientId = document.getElementById('subscription-client').value;
      const type = document.getElementById('subscription-type').value;
      const startDate = document.getElementById('subscription-start-date').value;
      const endDate = document.getElementById('subscription-end-date').value;
      const remainingClassesInput = document.getElementById('subscription-remaining-classes').value;
      const remainingClasses = type === 'Безлимит' ? Infinity : parseInt(remainingClassesInput) || 0;

      if (clientId && type && startDate && endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        if (end > start) {
          callback({ clientId, type, startDate, endDate, remainingClasses });
          modal.remove();
        } else {
          alert('Дата окончания должна быть позже даты начала!');
        }
      } else {
        alert('Заполните все обязательные поля!');
      }
    });

    document.getElementById('subscription-cancel-btn').addEventListener('click', () => {
      modal.remove();
    });
  }
}