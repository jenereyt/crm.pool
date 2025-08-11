// clients.js
import { getSubscriptionTemplates } from './subscriptions.js';
import { getGroups } from './groups.js';

let clientsData = [
  {
    id: 'client1',
    name: 'Иван Иванов',
    phone: '+7 (123) 456-78-90',
    phoneSecondary: '+7 (987) 654-32-10',
    parentName: 'Анна Иванова',
    diagnosis: 'Нет',
    features: 'Требуется индивидуальный подход',
    blacklisted: false,
    groups: ['Йога для начинающих'],
    subscription: {
      templateId: 'template1',
      startDate: '2025-08-01',
      endDate: '2025-08-31',
      classesPerWeek: 2,
      daysOfWeek: ['Пн', 'Ср'],
      classTime: '10:00',
      group: 'Йога для начинающих',
      remainingClasses: 8 // per-client remaining classes
    },
    photo: 'client1.jpg'
  },
  {
    id: 'client2',
    name: 'Мария Петрова',
    phone: '+7 (234) 567-89-01',
    phoneSecondary: '',
    parentName: '',
    diagnosis: 'Сколиоз',
    features: '',
    blacklisted: false,
    groups: [],
    subscription: {
      templateId: 'template3',
      startDate: '2025-08-01',
      endDate: '2025-08-31',
      classesPerWeek: 0,
      daysOfWeek: [],
      classTime: '09:00',
      group: '',
      remainingClasses: Infinity
    },
    photo: ''
  }
];

export function getClients() {
  return clientsData;
}

export function getClientById(id) {
  return clientsData.find(c => c.id === id) || null;
}

export function addClient(client) {
  const newClient = { id: `client${Date.now()}`, ...client };
  clientsData.push(newClient);
  return newClient;
}

export function updateClient(id, data) {
  const client = clientsData.find(c => c.id === id);
  if (client) Object.assign(client, data);
  return client;
}

export function removeClient(id) {
  clientsData = clientsData.filter(c => c.id !== id);
}

/* ---- UI: loadClients and forms ---- */

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
    <input type="text" id="client-search" class="client-search" placeholder="Поиск по имени или телефону">
    <button class="client-add-btn" id="client-add-btn">Добавить клиента</button>
  `;
  mainContent.appendChild(filterBar);

  const clientSection = document.createElement('div');
  clientSection.className = 'client-section';
  const clientList = document.createElement('div');
  clientList.className = 'client-list';
  clientSection.appendChild(clientList);
  mainContent.appendChild(clientSection);

  function renderClients() {
    const search = document.getElementById('client-search').value.toLowerCase();
    clientList.innerHTML = clientsData
      .filter(client => client.name.toLowerCase().includes(search) || client.phone.toLowerCase().includes(search))
      .map(client => {
        const hasDiagnosis = client.diagnosis && client.diagnosis !== 'Нет';
        return `
          <div class="client-container" data-id="${client.id}">
            <div class="client-info">
              ${client.photo ? `<img src="${client.photo}" class="client-photo" alt="${client.name}">` : `<img src="images/default-icon.svg" class="client-photo" alt="Нет фото">`}
              <div class="client-name-phone">
                <h3>${client.name}${client.blacklisted ? ' (В чёрном списке)' : ''}${hasDiagnosis ? ' <span class="client-diagnosis-icon">⚕️</span>' : ''}</h3>
                <p>${client.phone}</p>
              </div>
            </div>
            <div class="client-actions">
              <button class="client-action-icon edit" data-id="${client.id}" title="Редактировать">✏️</button>
              <button class="client-action-icon blacklist ${client.blacklisted ? 'blacklisted' : ''}" data-id="${client.id}" title="${client.blacklisted ? 'Убрать из чёрного списка' : 'В чёрный список'}">🚫</button>
              <button class="client-action-icon subscription" data-id="${client.id}" title="Абонемент">🎟️</button>
              <button class="client-action-icon group" data-id="${client.id}" title="Группы">👥</button>
              <button class="client-action-icon delete" data-id="${client.id}" title="Удалить">🗑️</button>
            </div>
          </div>
        `;
      }).join('');
  }

  renderClients();

  document.getElementById('client-search').addEventListener('input', renderClients);

  document.getElementById('client-add-btn').addEventListener('click', () => {
    showClientForm('Добавить клиента', {}, (data) => {
      addClient({ ...data, groups: [], blacklisted: false, subscription: null });
      renderClients();
    });
  });

  clientList.addEventListener('click', (e) => {
    const target = e.target;
    const clientId = target.closest('.client-container')?.getAttribute('data-id') || target.getAttribute('data-id');
    const client = clientsData.find(c => c.id === clientId);
    if (!client) return;

    if (target.classList.contains('client-action-icon')) {
      if (target.classList.contains('edit')) {
        showClientForm('Редактировать клиента', client, (data) => {
          updateClient(clientId, data);
          renderClients();
        });
      } else if (target.classList.contains('blacklist')) {
        client.blacklisted = !client.blacklisted;
        renderClients();
      } else if (target.classList.contains('subscription')) {
        const sub = client.subscription ? { ...client.subscription, clientId } : {
          clientId,
          templateId: '',
          startDate: '',
          endDate: '',
          classesPerWeek: 0,
          daysOfWeek: [],
          classTime: '09:00',
          group: '',
          remainingClasses: 0
        };
        showSubscriptionForm('Абонемент клиента', sub, clientsData, getGroups(), (data) => {
          const template = getSubscriptionTemplates().find(t => t.id === data.templateId);
          const remaining = template ? template.remainingClasses : (data.remainingClasses || 0);
          client.subscription = {
            templateId: data.templateId,
            startDate: data.startDate,
            endDate: data.endDate,
            classesPerWeek: data.classesPerWeek,
            daysOfWeek: data.daysOfWeek,
            classTime: data.classTime,
            group: data.group,
            remainingClasses: remaining
          };
          renderClients();
        });
      } else if (target.classList.contains('group')) {
        showGroupForm('Управление группами', client, getGroups(), (groups) => {
          client.groups = groups;
          renderClients();
        });
      } else if (target.classList.contains('delete')) {
        if (confirm('Удалить клиента?')) {
          removeClient(clientId);
          renderClients();
        }
      }
    } else if (target.closest('.client-info')) {
      showClientDetails(client);
    }
  });

  /* ---- Модалки ---- */

  function showClientDetails(client) {
    const subscriptionTemplate = client.subscription ? getSubscriptionTemplates().find(t => t.id === client.subscription.templateId) : null;
    const modal = document.createElement('div');
    modal.className = 'client-details-modal';
    modal.innerHTML = `
      <div class="client-details-content">
        <h2>${client.name}${client.blacklisted ? ' (В чёрном списке)' : ''}</h2>
        ${client.photo ? `<img src="${client.photo}" class="client-photo-preview" alt="${client.name}">` : `<img src="images/default-icon.svg" class="client-photo-preview" alt="Нет фото">`}
        <p>Телефон: ${client.phone}</p>
        ${client.phoneSecondary ? `<p>Доп. телефон: ${client.phoneSecondary}</p>` : ''}
        ${client.parentName ? `<p>Родитель: ${client.parentName}</p>` : ''}
        ${client.diagnosis ? `<p>Диагноз: ${client.diagnosis}</p>` : ''}
        ${client.features ? `<p>Особенности: ${client.features}</p>` : ''}
        <p>Группы: ${client.groups.length ? client.groups.join(', ') : 'Нет'}</p>
        <p>Абонемент: ${subscriptionTemplate ? subscriptionTemplate.type : (client.subscription ? 'Данные абонемента' : 'Нет')}</p>
        <div class="client-details-actions">
          <button id="client-close-btn">Закрыть</button>
        </div>
      </div>
    `;
    mainContent.appendChild(modal);

    document.getElementById('client-close-btn').addEventListener('click', () => {
      modal.remove();
    });
  }

  function showClientForm(title, client, callback) {
    const modal = document.createElement('div');
    modal.className = 'client-modal';
    modal.innerHTML = `
      <div class="client-modal-content">
        <h2>${title}</h2>
        <div class="client-photo-container">
          <img src="${client.photo || 'images/default-icon.svg'}" class="client-photo-preview" id="client-photo-preview" alt="${client.name || 'Клиент'}">
          <input type="file" id="client-photo" accept="image/*">
        </div>
        <div class="client-form-grid">
          <div class="client-form-field">
            <label for="client-name">Имя</label>
            <input type="text" id="client-name" value="${client.name || ''}" required>
          </div>
          <div class="client-form-field">
            <label for="client-phone">Телефон</label>
            <input type="text" id="client-phone" value="${client.phone || ''}" required>
          </div>
          <div class="client-form-field">
            <label for="client-phone-secondary">Доп. телефон</label>
            <input type="text" id="client-phone-secondary" value="${client.phoneSecondary || ''}">
          </div>
          <div class="client-form-field">
            <label for="client-parent-name">Имя родителя</label>
            <input type="text" id="client-parent-name" value="${client.parentName || ''}">
          </div>
          <div class="client-form-field client-form-field-full">
            <label for="client-diagnosis">Диагноз</label>
            <input type="text" id="client-diagnosis" value="${client.diagnosis || ''}">
          </div>
          <div class="client-form-field client-form-field-full">
            <label for="client-features">Особенности</label>
            <textarea id="client-features">${client.features || ''}</textarea>
          </div>
        </div>
        <div class="client-modal-actions">
          <button id="client-save-btn">Сохранить</button>
          <button id="client-cancel-btn">Отмена</button>
        </div>
      </div>
    `;
    mainContent.appendChild(modal);

    const photoInput = document.getElementById('client-photo');
    const photoPreview = document.getElementById('client-photo-preview');
    photoInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (ev) => {
          photoPreview.src = ev.target.result;
        };
        reader.readAsDataURL(file);
      } else {
        photoPreview.src = client.photo || 'images/default-icon.svg';
      }
    });

    document.getElementById('client-save-btn').addEventListener('click', () => {
      const name = document.getElementById('client-name').value.trim();
      const phone = document.getElementById('client-phone').value.trim();
      const phoneSecondary = document.getElementById('client-phone-secondary').value.trim();
      const parentName = document.getElementById('client-parent-name').value.trim();
      const diagnosis = document.getElementById('client-diagnosis').value.trim();
      const features = document.getElementById('client-features').value.trim();
      const photo = photoPreview.src === 'images/default-icon.svg' ? '' : photoPreview.src;

      if (name && phone) {
        callback({ name, phone, phoneSecondary, parentName, diagnosis, features, photo });
        modal.remove();
      } else {
        alert('Заполните обязательные поля: имя и телефон!');
      }
    });

    document.getElementById('client-cancel-btn').addEventListener('click', () => {
      modal.remove();
    });
  }

  function showSubscriptionForm(title, sub, clients, groups, callback) {
    const modal = document.createElement('div');
    modal.className = 'subscription-modal';
    modal.innerHTML = `
      <div class="subscription-modal-content">
        <h2>${title}</h2>
        <div class="client-form-field">
          <label for="subscription-client">Клиент</label>
          <select id="subscription-client" required>
            <option value="">Выберите клиента</option>
            ${clients.map(c => `<option value="${c.id}" ${sub.clientId === c.id ? 'selected' : ''}>${c.name}${c.blacklisted ? ' (В чёрном списке)' : ''}</option>`).join('')}
          </select>
        </div>
        <div class="client-form-field">
          <label for="subscription-template">Шаблон абонемента</label>
          <select id="subscription-template" required>
            <option value="">Выберите шаблон</option>
            ${getSubscriptionTemplates().map(template => `<option value="${template.id}" ${sub.templateId === template.id ? 'selected' : ''}>${template.type}</option>`).join('')}
          </select>
        </div>
        <div class="client-form-field">
          <label for="subscription-classes-per-week">Занятий в неделю</label>
          <input type="number" id="subscription-classes-per-week" value="${sub.classesPerWeek || ''}" required>
        </div>
        <div class="days-of-week">
          <label>Дни недели:</label>
          <div class="days-of-week-buttons">
            ${['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map(day => `
              <button type="button" class="day-button${sub.daysOfWeek?.includes(day) ? ' selected' : ''}" data-day="${day}">${day}</button>
            `).join('')}
          </div>
        </div>
        <div class="client-form-field">
          <label for="subscription-start-date">Дата начала</label>
          <input type="date" id="subscription-start-date" value="${sub.startDate || ''}" required>
        </div>
        <div class="client-form-field">
          <label for="subscription-end-date">Дата окончания</label>
          <input type="date" id="subscription-end-date" value="${sub.endDate || ''}" required>
        </div>
        <div class="client-form-field">
          <label for="subscription-class-time">Время занятия</label>
          <input type="time" id="subscription-class-time" value="${sub.classTime || '09:00'}" required>
        </div>
        <div class="client-form-field">
          <label for="subscription-group">Группа (опционально)</label>
          <select id="subscription-group">
            <option value="">Выберите группу</option>
            ${groups.map(group => `<option value="${group}" ${sub.group === group ? 'selected' : ''}>${group}</option>`).join('')}
          </select>
        </div>
        <div class="subscription-modal-actions">
          <button id="subscription-save-btn">Сохранить</button>
          <button id="subscription-cancel-btn">Отмена</button>
        </div>
      </div>
    `;
    mainContent.appendChild(modal);

    const dayButtons = modal.querySelectorAll('.day-button');
    dayButtons.forEach(button => {
      button.addEventListener('click', () => {
        button.classList.toggle('selected');
      });
    });

    document.getElementById('subscription-save-btn').addEventListener('click', () => {
      const clientId = document.getElementById('subscription-client').value;
      const templateId = document.getElementById('subscription-template').value;
      const classesPerWeek = parseInt(document.getElementById('subscription-classes-per-week').value);
      const daysOfWeek = Array.from(modal.querySelectorAll('.day-button.selected')).map(button => button.getAttribute('data-day'));
      const startDate = document.getElementById('subscription-start-date').value;
      const endDate = document.getElementById('subscription-end-date').value;
      const classTime = document.getElementById('subscription-class-time').value;
      const group = document.getElementById('subscription-group').value;

      if (clientId && templateId && !isNaN(classesPerWeek) && startDate && endDate && classTime) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        if (end > start) {
          callback({ clientId, templateId, startDate, endDate, classesPerWeek, daysOfWeek, classTime, group });
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

  function showGroupForm(title, client, allGroups, callback) {
    const modal = document.createElement('div');
    modal.className = 'group-management-modal';
    let selectedGroups = [...client.groups];

    function renderSelectedGroups() {
      const container = modal.querySelector('.selected-groups');
      container.innerHTML = selectedGroups.map(group => `
        <div class="selected-group-tag">
          ${group}
          <button data-group="${group}">×</button>
        </div>
      `).join('');
      container.querySelectorAll('button').forEach(btn => {
        btn.addEventListener('click', () => {
          selectedGroups = selectedGroups.filter(g => g !== btn.getAttribute('data-group'));
          renderSelectedGroups();
        });
      });
    }

    modal.innerHTML = `
      <div class="group-management-modal-content">
        <h2>${title}</h2>
        <div class="group-search-container">
          <input type="text" id="group-search" placeholder="Поиск или добавление группы">
          <button id="add-group-btn">Добавить</button>
        </div>
        <div class="selected-groups"></div>
        <div class="group-management-modal-actions">
          <button id="group-save-btn">Сохранить</button>
          <button id="group-cancel-btn">Отмена</button>
        </div>
      </div>
    `;
    mainContent.appendChild(modal);

    renderSelectedGroups();

    const searchInput = document.getElementById('group-search');
    const addBtn = document.getElementById('add-group-btn');

    addBtn.addEventListener('click', () => {
      const groupName = searchInput.value.trim();
      if (groupName && !selectedGroups.includes(groupName)) {
        selectedGroups.push(groupName);
        renderSelectedGroups();
        searchInput.value = '';
      }
    });

    searchInput.addEventListener('input', () => {
      // Можно добавить автокомплит, но для простоты оставим как поиск/добавление
    });

    document.getElementById('group-save-btn').addEventListener('click', () => {
      callback(selectedGroups);
      modal.remove();
    });

    document.getElementById('group-cancel-btn').addEventListener('click', () => {
      modal.remove();
    });
  }
}