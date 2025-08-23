import { getSubscriptionTemplates } from './subscriptions.js';
import { getGroups } from './groups.js';

let clientsData = [
  {
    id: 'client1',
    surname: 'Иванов',
    name: 'Иван',
    patronymic: 'Иванович',
    phone: '+7 (123) 456-78-90',
    birthDate: '1990-01-01',
    gender: 'male',
    parents: [
      {
        fullName: 'Анна Иванова',
        phone: '+7 (987) 654-32-10'
      }
    ],
    diagnosis: 'Нет',
    features: 'Требуется индивидуальный подход',
    blacklisted: false,
    groups: ['Йога для начинающих'],
    groupHistory: [
      { date: '2025-08-01', action: 'added', group: 'Йога для начинающих' }
    ],
    subscriptions: [
      {
        templateId: 'template1',
        startDate: '2025-08-01',
        endDate: '2025-08-31',
        classesPerWeek: 2,
        daysOfWeek: ['Пн', 'Ср'],
        classTime: '10:00',
        group: 'Йога для начинающих',
        remainingClasses: 8,
        isPaid: true,
        renewalHistory: [],
        subscriptionNumber: 'SUB-001'
      }
    ],
    photo: '',
    createdAt: '2025-01-15T10:00:00Z'
  },
  {
    id: 'client2',
    surname: 'Петрова',
    name: 'Мария',
    patronymic: 'Сергеевна',
    phone: '+7 (234) 567-89-01',
    birthDate: '2005-05-05',
    gender: 'female',
    parents: [],
    diagnosis: 'Сколиоз',
    features: '',
    blacklisted: false,
    groups: [],
    groupHistory: [],
    subscriptions: [
      {
        templateId: 'template1',
        startDate: '2025-08-01',
        endDate: '2025-08-31',
        classesPerWeek: 0,
        daysOfWeek: [],
        classTime: '09:00',
        group: '',
        remainingClasses: Infinity,
        isPaid: true,
        renewalHistory: [],
        subscriptionNumber: 'SUB-002'
      }
    ],
    photo: '',
    createdAt: '2025-02-20T14:30:00Z'
  }
];

export function getClients() {
  return clientsData;
}

export function getClientById(id) {
  return clientsData.find(c => c.id === id) || null;
}

export function addClient(client) {
  const newClient = {
    id: `client${Date.now()}`,
    ...client,
    createdAt: new Date().toISOString(),
    groupHistory: [],
    subscriptions: [],
    parents: client.parents || []
  };
  clientsData.push(newClient);
  return newClient;
}

export function updateClient(id, data) {
  const client = clientsData.find(c => c.id === id);
  if (client) {
    Object.assign(client, data);
  }
  return client;
}

export function removeClient(id) {
  clientsData = clientsData.filter(c => c.id !== id);
}

export function addGroupToClient(clientId, group, action = 'added', date = new Date().toISOString()) {
  const client = getClientById(clientId);
  if (client && !client.groups.includes(group)) {
    client.groups.push(group);
    client.groupHistory.push({ date, action, group });
  }
}

export function removeGroupFromClient(clientId, group) {
  const client = getClientById(clientId);
  if (client) {
    client.groups = client.groups.filter(g => g !== group);
    client.groupHistory.push({ date: new Date().toISOString(), action: 'removed', group });
  }
}

export function loadClients() {
  const mainContent = document.getElementById('main-content');
  mainContent.innerHTML = '';

  const header = document.createElement('header');
  header.className = 'header';
  header.innerHTML = `
      <div class="header-content">
        <h1><img src="images/icon-clients.svg" alt="Клиенты" class="icon-users">Клиенты</h1>
        <div class="header-stats">
          <div class="stat-item">
            <span class="stat-number">${clientsData.length}</span>
            <span class="stat-label">всего</span>
          </div>
          <div class="stat-item">
            <span class="stat-number">${clientsData.filter(c => c.subscriptions.some(s => s.isPaid && new Date(s.endDate) >= new Date())).length}</span>
            <span class="stat-label">активных</span>
          </div>
          <div class="stat-item">
            <span class="stat-number">${clientsData.filter(c => c.blacklisted).length}</span>
            <span class="stat-label">в ЧС</span>
          </div>
        </div>
      </div>
    `;
  mainContent.appendChild(header);

  const controlBar = document.createElement('div');
  controlBar.className = 'control-bar';
  controlBar.innerHTML = `
      <div class="search-container">
        <div class="search-input-wrapper">
          <img src="images/icon-search.svg" alt="Поиск" class="search-icon">
          <input type="text" id="client-search" class="client-search" placeholder="Поиск по имени, телефону или группе...">
          <button id="search-clear" class="search-clear" style="display: none;">×</button>
        </div>
      </div>
      <div class="filter-controls">
        <select id="status-filter" class="status-filter">
          <option value="">Все статусы</option>
          <option value="active">Активные абонементы</option>
          <option value="inactive">Неактивные абонементы</option>
          <option value="no-subscription">Без абонемента</option>
          <option value="blacklisted">В чёрном списке</option>
        </select>
        <select id="sort-by" class="sort-select">
          <option value="name">По имени</option>
          <option value="date-desc">Сначала новые</option>
          <option value="date-asc">Сначала старые</option>
        </select>
      </div>
      <button type="button" class="btn-primary client-add-btn" id="client-add-btn">
        <i class="add-icon">+</i>
        <span>Добавить клиента</span>
      </button>
    `;
  mainContent.appendChild(controlBar);

  const clientSection = document.createElement('div');
  clientSection.className = 'client-section';

  const clientList = document.createElement('div');
  clientList.className = 'client-list';
  clientSection.appendChild(clientList);

  const emptyState = document.createElement('div');
  emptyState.className = 'empty-state';
  emptyState.innerHTML = `
      <div class="empty-state-icon"><img src="images/icon-clients.svg" alt="Клиенты"></div>
      <h3>Клиенты не найдены</h3>
      <p>Попробуйте изменить параметры поиска или добавьте нового клиента</p>
    `;
  emptyState.style.display = 'none';
  clientSection.appendChild(emptyState);

  mainContent.appendChild(clientSection);

  function getSubscriptionStatus(client) {
    if (!client.subscriptions || client.subscriptions.length === 0) return 'no-subscription';
    if (client.blacklisted) return 'blacklisted';
    const hasActive = client.subscriptions.some(s => s.isPaid && new Date(s.endDate) >= new Date());
    return hasActive ? 'active' : 'inactive';
  }

  function formatDate(dateString) {
    if (!dateString) return 'Никогда';
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) return 'Сегодня';
    if (diffDays === 2) return 'Вчера';
    if (diffDays <= 7) return `${diffDays - 1} дн. назад`;
    if (diffDays <= 30) return `${Math.floor(diffDays / 7)} нед. назад`;
    return date.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }

  function sortClients(clients, sortBy) {
    return [...clients].sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return `${a.surname} ${a.name}`.localeCompare(`${b.surname} ${b.name}`);
        case 'date-desc':
          return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
        case 'date-asc':
          return new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
        default:
          return 0;
      }
    });
  }

  function renderClients() {
    const search = document.getElementById('client-search').value.toLowerCase();
    const statusFilter = document.getElementById('status-filter').value;
    const sortBy = document.getElementById('sort-by').value;

    let filteredClients = clientsData.filter(client => {
      const fullName = `${client.surname} ${client.name} ${client.patronymic || ''}`.toLowerCase();
      const matchesSearch = search === '' ||
        fullName.includes(search) ||
        client.phone.toLowerCase().includes(search) ||
        client.groups.some(group => group.toLowerCase().includes(search));

      const matchesStatus = statusFilter === '' || getSubscriptionStatus(client) === statusFilter;

      return matchesSearch && matchesStatus;
    });

    filteredClients = sortClients(filteredClients, sortBy);

    if (filteredClients.length === 0) {
      clientList.style.display = 'none';
      emptyState.style.display = 'flex';
      return;
    }

    clientList.style.display = 'grid';
    emptyState.style.display = 'none';

    clientList.innerHTML = filteredClients
      .map(client => {
        const fullName = `${client.surname} ${client.name} ${client.patronymic || ''}`;
        const hasDiagnosis = client.diagnosis && client.diagnosis !== 'Нет';
        const status = getSubscriptionStatus(client);
        const statusClass = {
          'active': 'status-active',
          'inactive': 'status-inactive',
          'no-subscription': 'status-none',
          'blacklisted': 'status-blacklisted'
        }[status];

        const statusText = {
          'active': 'Активный',
          'inactive': 'Неактивный',
          'no-subscription': 'Без абонемента',
          'blacklisted': 'В чёрном списке'
        }[status];

        const activeSub = client.subscriptions.find(s => s.isPaid && new Date(s.endDate) >= new Date());
        const remainingClasses = activeSub ? activeSub.remainingClasses : undefined;

        return `
          <div class="client-card ${client.blacklisted ? 'blacklisted' : ''}" data-id="${client.id}">
            <div class="client-main-info">
              <div class="client-avatar">
                ${client.photo ?
            `<img src="${client.photo}" class="client-photo" alt="${fullName}" style="object-fit: cover;">` :
            `<div class="client-photo-placeholder">${client.name.charAt(0).toUpperCase()}</div>`
          }
                <div class="status-indicator ${statusClass}" title="${statusText}"></div>
              </div>
              <div class="client-details">
                <div class="client-name-section">
                  <h3 class="client-name ${hasDiagnosis ? 'has-diagnosis' : ''}">${fullName}</h3>
                  <div class="client-meta">
                    <span class="client-phone">${client.phone}</span>
                    ${hasDiagnosis ? `<span class="diagnosis-badge">${client.diagnosis}</span>` : ''}
                  </div>
                </div>
                <div class="client-additional-info">
                  <span class="groups-info">
                    <span class="info-label">Группы:</span>
                    ${client.groups.length ? client.groups.map(group => `<span class="group-tag">${group}</span>`).join('') : '<span class="no-groups">Без групп</span>'}
                  </span>
                  ${remainingClasses !== undefined ?
            `<span class="classes-info">
                      <span class="info-label">Осталось:</span>
                      <span class="remaining-classes ${remainingClasses <= 3 && remainingClasses !== Infinity ? 'low' : ''}">
                        ${remainingClasses === Infinity ? '∞' : remainingClasses}
                      </span>
                    </span>` : ''
          }
                </div>
              </div>
            </div>
            <div class="action-buttons-group">
              <button type="button" class="client-action-btn edit-btn" data-id="${client.id}" title="Редактировать">
                <img src="images/icon-edit.svg" alt="Редактировать" class="btn-icon">
              </button>
              <button type="button" class="client-action-btn subscription-btn" data-id="${client.id}" title="Абонемент">
                <img src="images/icon-subscriptions.svg" alt="Абонемент" class="btn-icon">
              </button>
              <button type="button" class="client-action-btn group-btn" data-id="${client.id}" title="Группы">
                <img src="images/icon-group.svg" alt="Группы" class="btn-icon">
              </button>
              <button type="button" class="client-action-btn blacklist-btn ${client.blacklisted ? 'active' : ''}" data-id="${client.id}" title="${client.blacklisted ? 'Убрать из чёрного списка' : 'В чёрный список'}">
                <img src="images/icon-delete.svg" alt="${client.blacklisted ? 'Убрать из чёрного списка' : 'В чёрный список'}" class="btn-icon">
              </button>
              <button type="button" class="client-action-btn delete-btn" data-id="${client.id}" title="Удалить">
                <img src="images/trash.svg" alt="Удалить" class="btn-icon">
              </button>
            </div>
          </div>
        `;
      }).join('');
  }

  renderClients();

  const searchInput = document.getElementById('client-search');
  const searchClear = document.getElementById('search-clear');

  searchInput.addEventListener('input', (e) => {
    renderClients();
    searchClear.style.display = e.target.value ? 'block' : 'none';
  });

  searchClear.addEventListener('click', () => {
    searchInput.value = '';
    searchClear.style.display = 'none';
    renderClients();
  });

  document.getElementById('status-filter').addEventListener('change', renderClients);
  document.getElementById('sort-by').addEventListener('change', renderClients);

  document.getElementById('client-add-btn').addEventListener('click', () => {
    showClientForm('Добавить клиента', {}, (data) => {
      addClient(data);
      renderClients();
      showToast('Клиент успешно добавлен', 'success');
    });
  });

  clientList.addEventListener('click', (e) => {
    const target = e.target;
    const clientCard = target.closest('.client-card');
    const clientId = clientCard ? clientCard.getAttribute('data-id') : null;
    const client = clientsData.find(c => c.id === clientId);
    if (!client) return;

    const actionBtn = target.closest('.client-action-btn');
    if (actionBtn) {
      e.stopPropagation();

      if (actionBtn.classList.contains('edit-btn')) {
        showClientForm('Редактировать клиента', client, (data) => {
          updateClient(clientId, data);
          renderClients();
          showToast('Данные клиента обновлены', 'success');
        });
      } else if (actionBtn.classList.contains('blacklist-btn')) {
        client.blacklisted = !client.blacklisted;
        renderClients();
        showToast(client.blacklisted ? 'Клиент добавлен в чёрный список' : 'Клиент удалён из чёрного списка', 'info');
      } else if (actionBtn.classList.contains('subscription-btn')) {
        showSubscriptionManagement(client);
      } else if (actionBtn.classList.contains('group-btn')) {
        showGroupForm('Управление группами', client, getGroups(), (groups, history) => {
          client.groups = groups;
          client.groupHistory = history;
          renderClients();
          showToast('Группы клиента обновлены', 'success');
        });
      } else if (actionBtn.classList.contains('delete-btn')) {
        showConfirmDialog(
          'Удалить клиента?',
          `Вы уверены, что хотите удалить клиента "${client.surname} ${client.name}"? Это действие нельзя отменить.`,
          () => {
            removeClient(clientId);
            renderClients();
            showToast('Клиент удалён', 'success');
          }
        );
      }
    } else {
      showClientDetails(client);
    }
  });

  function showToast(message, type = 'info') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
        <div class="toast-content">
          <span class="toast-icon">${type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️'}</span>
          <span class="toast-message">${message}</span>
        </div>
      `;

    document.body.appendChild(toast);

    setTimeout(() => toast.classList.add('show'), 100);
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => document.body.removeChild(toast), 300);
    }, 3000);
  }

  function showConfirmDialog(title, message, onConfirm) {
    const modal = document.createElement('div');
    modal.className = 'confirm-modal';
    modal.innerHTML = `
        <div class="confirm-modal-content">
          <div class="confirm-header">
            <h3>${title}</h3>
          </div>
          <div class="confirm-body">
            <p>${message}</p>
          </div>
          <div class="confirm-actions">
            <button type="button" class="confirm-btn-cancel btn-secondary">Отмена</button>
            <button type="button" class="confirm-btn-ok btn-primary">Удалить</button>
          </div>
        </div>
      `;

    document.getElementById('main-content').appendChild(modal);

    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.remove();
    });

    modal.querySelector('.confirm-btn-cancel').addEventListener('click', () => modal.remove());
    modal.querySelector('.confirm-btn-ok').addEventListener('click', () => {
      onConfirm();
      modal.remove();
    });
  }

  function showPhotoZoomModal(photoSrc) {
    if (!photoSrc || photoSrc.includes('default-icon.svg')) return;

    const modal = document.createElement('div');
    modal.className = 'photo-zoom-modal';
    modal.innerHTML = `
        <div class="photo-zoom-content">
          <img src="${photoSrc}" class="photo-zoom-image" alt="Увеличенное фото">
          <button type="button" class="photo-zoom-close btn-secondary">Закрыть</button>
        </div>
      `;
    document.getElementById('main-content').appendChild(modal);

    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.remove();
      }
    });

    modal.querySelector('.photo-zoom-close').addEventListener('click', () => {
      modal.remove();
    });
  }

  function showClientDetails(client) {
    const fullName = `${client.surname} ${client.name} ${client.patronymic || ''}`;
    const modal = document.createElement('div');
    modal.className = 'client-details-modal';
    modal.innerHTML = `
        <div class="client-details-content">
          <div class="details-header">
            <div class="client-avatar-large">
              ${client.photo ?
        `<img src="${client.photo}" class="client-photo-large" alt="${fullName}">` :
        `<div class="client-photo-placeholder-large">${client.name.charAt(0).toUpperCase()}</div>`
      }
            </div>
            <div class="client-title">
              <h2>${fullName}${client.blacklisted ? ' (В чёрном списке)' : ''}</h2>
              <span class="client-id">ID: ${client.id}</span>
            </div>
          </div>
          
          <div class="tabs">
            <button type="button" class="tab-button active" data-tab="main">Основная информация</button>
            <button type="button" class="tab-button" data-tab="groups-subs">Группы и абонементы</button>
          </div>
          
          <div class="tab-content active" id="tab-main">
            <div class="details-grid">
              <div class="detail-section">
                <h4>Контактная информация</h4>
                <div class="detail-item">
                  <span class="detail-label">Телефон:</span>
                  <span class="detail-value">${client.phone}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">Дата рождения:</span>
                  <span class="detail-value">${client.birthDate || 'Не указана'}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">Пол:</span>
                  <span class="detail-value">${client.gender === 'male' ? 'Мужской' : client.gender === 'female' ? 'Женский' : 'Не указан'}</span>
                </div>
                ${client.parents.length > 0 ? `
                  <div class="detail-item">
                    <span class="detail-label">Родители/опекуны:</span>
                    <div class="detail-value">
                      ${client.parents.map(p => `${p.fullName} (${p.phone})`).join('<br>')}
                    </div>
                  </div>
                ` : ''}
              </div>
              
              <div class="detail-section">
                <h4>Медицинская информация</h4>
                <div class="detail-item">
                  <span class="detail-label">Диагноз:</span>
                  <span class="detail-value ${client.diagnosis && client.diagnosis !== 'Нет' ? 'has-diagnosis' : ''}">${client.diagnosis || 'Нет'}</span>
                </div>
                ${client.features ? `
                  <div class="detail-item">
                    <span class="detail-label">Особенности:</span>
                    <span class="detail-value">${client.features}</span>
                  </div>
                ` : ''}
              </div>
              
              <div class="detail-section">
                <h4>Активность</h4>
                <div class="detail-item">
                  <span class="detail-label">Дата регистрации:</span>
                  <span class="detail-value">${formatDate(client.createdAt)}</span>
                </div>
              </div>
            </div>
          </div>
          
          <div class="tab-content" id="tab-groups-subs">
            <div class="details-grid">
              <div class="detail-section">
                <h4>Группы</h4>
                <div class="detail-item">
                  <span class="detail-label">Текущие группы:</span>
                  <div class="groups-list">
                    ${client.groups.length ?
        client.groups.map(group => `<span class="group-tag">${group}</span>`).join('') :
        '<span class="no-data">Не назначены</span>'
      }
                  </div>
                </div>
                ${client.groupHistory.length ? `
                  <div class="detail-item">
                    <span class="detail-label">История групп:</span>
                    <div class="renewal-history">
                      ${client.groupHistory.map(entry => `
                        <span class="renewal-entry">${formatDate(entry.date)}: ${entry.action === 'added' ? 'Добавлен в' : 'Удален из'} ${entry.group}</span>
                      `).join('')}
                    </div>
                  </div>
                ` : ''}
              </div>
              
              <div class="detail-section">
                <h4>Абонементы</h4>
                ${client.subscriptions.length ? client.subscriptions.filter(s => s.isPaid && new Date(s.endDate) >= new Date()).map((sub, index) => {
        const template = getSubscriptionTemplates().find(t => t.id === sub.templateId);
        return `
                    <div class="subscription-item" data-sub-index="${index}">
                      <div class="detail-item">
                        <span class="detail-label">Номер:</span>
                        <span class="detail-value">#${sub.subscriptionNumber}</span>
                      </div>
                      <div class="detail-item">
                        <span class="detail-label">Тип:</span>
                        <span class="detail-value">${template ? template.type : 'Неизвестный'}</span>
                      </div>
                      <div class="detail-item">
                        <span class="detail-label">Период:</span>
                        <span class="detail-value">${sub.startDate} — ${sub.endDate}</span>
                      </div>
                      <div class="detail-item">
                        <span class="detail-label">Осталось занятий:</span>
                        <span class="detail-value">${sub.remainingClasses === Infinity ? 'Безлимит' : sub.remainingClasses}</span>
                      </div>
                    </div>
                  `;
      }).join('') : `
                  <div class="detail-item">
                    <span class="no-data">Абонементы не оформлены</span>
                  </div>
                `}
              </div>
            </div>
          </div>
          
          <div class="client-details-actions">
            <button type="button" id="client-edit-details-btn" class="btn-secondary">Редактировать</button>
            <button type="button" id="client-close-btn" class="btn-secondary">Закрыть</button>
          </div>
        </div>
      `;

    document.getElementById('main-content').appendChild(modal);

    const tabButtons = modal.querySelectorAll('.tab-button');
    const tabContents = modal.querySelectorAll('.tab-content');

    tabButtons.forEach(button => {
      button.addEventListener('click', () => {
        tabButtons.forEach(btn => btn.classList.remove('active'));
        tabContents.forEach(content => content.classList.remove('active'));
        button.classList.add('active');
        modal.querySelector(`#tab-${button.dataset.tab}`).classList.add('active');
      });
    });

    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.remove();
      }
    });

    const photo = modal.querySelector('.client-photo-large, .client-photo-placeholder-large');
    if (client.photo) {
      photo.addEventListener('click', () => {
        showPhotoZoomModal(client.photo);
      });
    }

    const editBtn = document.getElementById('client-edit-details-btn');
    if (editBtn) {
      editBtn.addEventListener('click', () => {
        modal.remove();
        showClientForm('Редактировать клиента', client, (data) => {
          updateClient(client.id, data);
          renderClients();
          showToast('Данные клиента обновлены', 'success');
        });
      });
    }

    document.getElementById('client-close-btn').addEventListener('click', () => {
      modal.remove();
    });
  }

  function showClientForm(title, client, callback) {
    const modal = document.createElement('div');
    modal.className = 'client-form-modal';
    let parents = client.parents ? [...client.parents] : [];
    const isEdit = !!client.id;

    function calculateAge(birthDate) {
      if (!birthDate) return null;
      const today = new Date();
      const birth = new Date(birthDate);
      let age = today.getFullYear() - birth.getFullYear();
      const m = today.getMonth() - birth.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
        age--;
      }
      return age;
    }

    function isAdult(birthDate) {
      const age = calculateAge(birthDate);
      return age !== null && age >= 18;
    }

    function renderParents() {
      const container = modal.querySelector('#parents-container');
      container.innerHTML = parents.map((p, index) => `
      <div class="parent-form" data-index="${index}">
        <div class="form-group">
          <label for="parent-fullname-${index}" class="required">ФИО родителя/опекуна</label>
          <input type="text" id="parent-fullname-${index}" value="${p.fullName || ''}" required>
        </div>
        <div class="form-group">
          <label for="parent-phone-${index}" class="required">Телефон</label>
          <input type="tel" id="parent-phone-${index}" value="${p.phone || ''}" required>
        </div>
        <button type="button" class="btn-danger remove-parent-btn" data-index="${index}">Удалить</button>
      </div>
    `).join('');

      container.querySelectorAll('.remove-parent-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const index = parseInt(btn.dataset.index);
          parents.splice(index, 1);
          renderParents();
        });
      });

      parents.forEach((_, index) => {
        const fullnameInput = document.getElementById(`parent-fullname-${index}`);
        const phoneInput = document.getElementById(`parent-phone-${index}`);

        if (fullnameInput) {
          fullnameInput.addEventListener('input', (e) => {
            parents[index].fullName = e.target.value;
          });
        }

        if (phoneInput) {
          phoneInput.addEventListener('input', (e) => {
            parents[index].phone = e.target.value;
          });
        }
      });
    }

    modal.innerHTML = `
    <div class="client-form-content">
      <div class="client-form-header">
        <h2>${title}</h2>
        <button type="button" class="client-form-close">×</button>
      </div>
      
      <div class="client-form-tabs">
        <button type="button" class="tab-button active" data-tab="personal">Личные данные</button>
        <button type="button" class="tab-button" data-tab="parents">Родители/опекуны</button>
        <button type="button" class="tab-button" data-tab="medical">Медицинская информация</button>
      </div>
      
      <div class="client-form-tab-content active" id="client-tab-personal">
        <div class="form-grid">
          <div class="form-group">
            <label for="client-surname" class="required">Фамилия</label>
            <input type="text" id="client-surname" value="${client.surname || ''}" required>
            <span class="field-error" id="surname-error"></span>
          </div>
          <div class="form-group">
            <label for="client-name" class="required">Имя</label>
            <input type="text" id="client-name" value="${client.name || ''}" required>
            <span class="field-error" id="name-error"></span>
          </div>
          <div class="form-group">
            <label for="client-patronymic">Отчество</label>
            <input type="text" id="client-patronymic" value="${client.patronymic || ''}">
          </div>
        </div>
        <div class="form-grid">
          <div class="form-group">
            <label for="client-birthdate" class="required">Дата рождения</label>
            <input type="date" id="client-birthdate" value="${client.birthDate || ''}" required>
            <span class="field-error" id="birthdate-error"></span>
          </div>
          <div class="form-group">
            <label for="client-gender" class="required">Пол</label>
            <select id="client-gender" required>
              <option value="">Выберите пол</option>
              <option value="male" ${client.gender === 'male' ? 'selected' : ''}>Мужской</option>
              <option value="female" ${client.gender === 'female' ? 'selected' : ''}>Женский</option>
            </select>
            <span class="field-error" id="gender-error"></span>
          </div>
          <div class="form-group">
            <label for="client-phone" class="required">Телефон</label>
            <input type="tel" id="client-phone" value="${client.phone || ''}" required placeholder="+7 (999) 123-45-67">
            <span class="field-error" id="phone-error"></span>
          </div>
        </div>
        <div class="client-photo-section">
          <div class="photo-upload-area">
            ${client.photo ?
        `<img src="${client.photo}" class="client-photo-preview" id="client-photo-preview" alt="${client.surname || 'Клиент'}">` :
        `<div class="client-photo-preview placeholder" id="client-photo-preview">
                 <img src="images/icon-photo.svg" alt="Загрузить фото" class="upload-icon">
                 <span>Добавить фото</span>
               </div>`
      }
          <div class= for-flex>
            <input type="file" id="client-photo" accept="image/*" class="photo-input">
            <button type="button" class="photo-remove-btn" id="photo-remove-btn" ${!client.photo ? 'style="display: none;"' : ''}>
              <img src="images/trash.svg" alt="Удалить фото" class="btn-icon invert">
            </button>
          </div>
          </div>
        </div>
      </div>

      <div class="client-form-tab-content" id="client-tab-parents">
        <div id="parents-container"></div>
        <button type="button" id="add-parent-btn" class="btn-primary">Добавить родителя/опекуна</button>
      </div>

      <div class="client-form-tab-content" id="client-tab-medical">
        <div class="form-grid">
          <div class="form-group full-width">
            <label for="client-diagnosis">Медицинский диагноз</label>
            <input type="text" id="client-diagnosis" value="${client.diagnosis || ''}" placeholder="Укажите диагноз или 'Нет'">
          </div>
          <div class="form-group full-width">
            <label for="client-features">Особенности и примечания</label>
            <input type="text" id="client-features" value="${client.features || ''}" placeholder="Дополнительная информация о клиенте, особенности занятий...">
          </div>
        </div>
      </div>

      <div class="client-form-footer">
        <button type="button" id="client-cancel-btn" class="btn-secondary">Отмена</button>
        <button type="button" id="client-save-btn" class="btn-primary">Сохранить</button>
      </div>
    </div>
  `;

    document.getElementById('main-content').appendChild(modal);

    const tabButtons = modal.querySelectorAll('.tab-button');
    const tabContents = modal.querySelectorAll('.client-form-tab-content');

    tabButtons.forEach(button => {
      button.addEventListener('click', () => {
        tabButtons.forEach(btn => btn.classList.remove('active'));
        tabContents.forEach(content => content.classList.remove('active'));
        button.classList.add('active');
        modal.querySelector(`#client-tab-${button.dataset.tab}`).classList.add('active');
      });
    });

    const closeModal = () => modal.remove();
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeModal();
    });
    modal.querySelector('.client-form-close').addEventListener('click', closeModal);

    const photoInput = document.getElementById('client-photo');
    const photoPreview = document.getElementById('client-photo-preview');
    const photoRemoveBtn = document.getElementById('photo-remove-btn');

    photoPreview.addEventListener('click', () => {
      if (photoPreview.classList.contains('placeholder')) {
        photoInput.click();
      } else {
        showPhotoZoomModal(photoPreview.src);
      }
    });

    photoInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        if (file.size > 5 * 1024 * 1024) {
          showToast('Размер файла не должен превышать 5MB', 'error');
          return;
        }

        const reader = new FileReader();
        reader.onload = (ev) => {
          const img = document.createElement('img');
          img.src = ev.target.result;
          img.alt = 'Предпросмотр';
          img.style.width = '100%';
          img.style.height = '100%';
          img.style.objectFit = 'cover';
          img.style.borderRadius = '8px';

          photoPreview.innerHTML = '';
          photoPreview.appendChild(img);
          photoPreview.classList.remove('placeholder');
          photoRemoveBtn.style.display = 'block';
        };
        reader.readAsDataURL(file);
      }
    });

    photoRemoveBtn.addEventListener('click', () => {
      photoPreview.innerHTML = `
      <img src="images/icon-photo.svg" alt="Загрузить фото" class="upload-icon">
      <span>Добавить фото</span>
    `;
      photoPreview.classList.add('placeholder');
      photoInput.value = '';
      photoRemoveBtn.style.display = 'none';
    });

    renderParents();

    document.getElementById('add-parent-btn').addEventListener('click', () => {
      parents.push({ fullName: '', phone: '' });
      renderParents();
    });

    function validateForm() {
      let isValid = true;

      document.querySelectorAll('.field-error').forEach(el => el.textContent = '');
      document.querySelectorAll('.form-group input, .form-group select').forEach(el => el.classList.remove('error'));

      const surname = document.getElementById('client-surname').value.trim();
      if (!surname) {
        document.getElementById('surname-error').textContent = 'Фамилия обязательна';
        document.getElementById('client-surname').classList.add('error');
        isValid = false;
      }

      const name = document.getElementById('client-name').value.trim();
      if (!name) {
        document.getElementById('name-error').textContent = 'Имя обязательно';
        document.getElementById('client-name').classList.add('error');
        isValid = false;
      }

      const phone = document.getElementById('client-phone').value.trim();
      if (!phone) {
        document.getElementById('phone-error').textContent = 'Телефон обязателен';
        document.getElementById('client-phone').classList.add('error');
        isValid = false;
      } else if (!/^[\+]?[0-9\s\-\(\)]{10,}$/.test(phone)) {
        document.getElementById('phone-error').textContent = 'Некорректный номер телефона';
        document.getElementById('client-phone').classList.add('error');
        isValid = false;
      }

      const birthDate = document.getElementById('client-birthdate').value;
      if (!birthDate) {
        document.getElementById('birthdate-error').textContent = 'Дата рождения обязательна';
        document.getElementById('client-birthdate').classList.add('error');
        isValid = false;
      }

      const gender = document.getElementById('client-gender').value;
      if (!gender) {
        document.getElementById('gender-error').textContent = 'Пол обязателен';
        document.getElementById('client-gender').classList.add('error');
        isValid = false;
      }

      if (!isAdult(birthDate) && parents.length === 0) {
        showToast('Для несовершеннолетних обязателен хотя бы один родитель/опекун', 'error');
        tabButtons[1].click();
        isValid = false;
      }

      parents.forEach((p, index) => {
        const fullname = document.getElementById(`parent-fullname-${index}`);
        const parentPhone = document.getElementById(`parent-phone-${index}`);
        if (fullname && !fullname.value.trim()) {
          fullname.classList.add('error');
          isValid = false;
        }
        if (parentPhone && !parentPhone.value.trim()) {
          parentPhone.classList.add('error');
          isValid = false;
        }
      });

      return isValid;
    }

    document.getElementById('client-save-btn').addEventListener('click', () => {
      if (!validateForm()) return;

      const surname = document.getElementById('client-surname').value.trim();
      const name = document.getElementById('client-name').value.trim();
      const patronymic = document.getElementById('client-patronymic').value.trim();
      const phone = document.getElementById('client-phone').value.trim();
      const birthDate = document.getElementById('client-birthdate').value;
      const gender = document.getElementById('client-gender').value;
      const diagnosis = document.getElementById('client-diagnosis').value.trim();
      const features = document.getElementById('client-features').value.trim();

      let photo = '';
      const photoImg = photoPreview.querySelector('img');
      if (photoImg && !photoPreview.classList.contains('placeholder')) {
        photo = photoImg.src;
      }

      const updatedParents = [...parents];

      callback({
        surname,
        name,
        patronymic,
        phone,
        birthDate,
        gender,
        parents: updatedParents,
        diagnosis: diagnosis || 'Нет',
        features,
        photo
      });
      closeModal();
    });

    document.getElementById('client-cancel-btn').addEventListener('click', closeModal);

    setTimeout(() => document.getElementById('client-surname').focus(), 100);

    const birthInput = document.getElementById('client-birthdate');
    birthInput.addEventListener('change', () => {
      if (!isAdult(birthInput.value) && parents.length === 0) {
        tabButtons[1].click();
        showToast('Клиент несовершеннолетний: заполните данные родителей/опекунов', 'info');
      }
    });

    if (isEdit && !isAdult(client.birthDate)) {
      if (parents.length === 0) {
        tabButtons[1].click();
      }
    }
  }

  function showSubscriptionManagement(client) {
    const fullName = `${client.surname} ${client.name} ${client.patronymic || ''}`;
    const modal = document.createElement('div');
    modal.className = 'subscription-management-modal';
    modal.innerHTML = `
      <div class="subscription-management-content">
        <div class="subscription-management-header">
          <h2>Управление абонементами: ${fullName}</h2>
          <button type="button" class="subscription-management-close" >×</button>
        </div>
        
        <div class="subscription-management-body">
          <div class="subscription-history-section">
            <h3>История абонементов</h3>
            <div class="subscription-history-list">
              ${client.subscriptions.length ? client.subscriptions.map((sub, index) => {
      const template = getSubscriptionTemplates().find(t => t.id === sub.templateId);
      const isActive = sub.isPaid && new Date(sub.endDate) >= new Date();
      return `
                  <div class="subscription-item" data-sub-index="${index}">
                    <div class="detail-item">
                      <span class="detail-label">Номер:</span>
                      <span class="detail-value">#${sub.subscriptionNumber}</span>
                    </div>
                    <div class="detail-item">
                      <span class="detail-label">Тип:</span>
                      <span class="detail-value">${template ? template.type : 'Неизвестный'}</span>
                    </div>
                    <div class="detail-item">
                      <span class="detail-label">Статус:</span>
                      <span class="detail-value status-${isActive ? 'active' : 'inactive'}">${isActive ? 'Активный' : 'Неактивный'}</span>
                    </div>
                    <div class="detail-item">
                      <span class="detail-label">Период:</span>
                      <span class="detail-value">${sub.startDate} — ${sub.endDate}</span>
                    </div>
                    <div class="detail-item">
                      <span class="detail-label">Осталось занятий:</span>
                      <span class="detail-value">${sub.remainingClasses === Infinity ? 'Безлимит' : sub.remainingClasses}</span>
                    </div>
                    ${sub.renewalHistory?.length ? `
                      <div class="detail-item">
                        <span class="detail-label">История продлений:</span>
                        <div class="renewal-history">
                          ${sub.renewalHistory.map(entry => {
        const date = new Date(entry.date || entry).toLocaleDateString('ru-RU');
        return entry.fromTemplate ?
          `<span class="renewal-entry">${date}: ${entry.fromTemplate} → ${entry.toTemplate}</span>` :
          `<span class="renewal-entry">${date}</span>`;
      }).join('')}
                        </div>
                      </div>
                    ` : ''}
                  </div>
                `;
    }).join('') : `
                <div class="detail-item">
                  <span class="no-data">История абонементов отсутствует</span>
                </div>
              `}
            </div>
          </div>
          
          <div class="active-subscription-section">
            <h3>Текущий абонемент</h3>
            ${client.subscriptions.find(s => s.isPaid && new Date(s.endDate) >= new Date()) ? (() => {
        const sub = client.subscriptions.find(s => s.isPaid && new Date(s.endDate) >= new Date());
        const template = getSubscriptionTemplates().find(t => t.id === sub.templateId);
        return `
                <div class="subscription-item active-sub">
                  <div class="detail-item">
                    <span class="detail-label">Номер:</span>
                    <span class="detail-value">#${sub.subscriptionNumber}</span>
                  </div>
                  <div class="detail-item">
                    <span class="detail-label">Тип:</span>
                    <span class="detail-value">${template ? template.type : 'Неизвестный'}</span>
                  </div>
                  <div class="detail-item">
                    <span class="detail-label">Период:</span>
                    <span class="detail-value">${sub.startDate} — ${sub.endDate}</span>
                  </div>
                  <div class="detail-item">
                    <span class="detail-label">Осталось занятий:</span>
                    <span class="detail-value">${sub.remainingClasses === Infinity ? 'Безлимит' : sub.remainingClasses}</span>
                  </div>
                  <button type="button" class="btn-primary renew-sub-btn" data-sub-index="${client.subscriptions.indexOf(sub)}">Продлить</button>
                </div>
              `;
      })() : `
              <div class="detail-item">
                <span class="no-data">Нет активного абонемента</span>
              </div>
            `}
            <button type="button" class="btn-primary new-sub-btn">Создать новый абонемент</button>
          </div>
      </div>  ё
      </div>
    `;

    document.getElementById('main-content').appendChild(modal);

    const closeModal = () => modal.remove();
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeModal();
    });
    modal.querySelector('.subscription-management-close').addEventListener('click', closeModal);

    modal.querySelectorAll('.renew-sub-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const index = parseInt(btn.dataset.subIndex);
        const sub = client.subscriptions[index];
        showRenewSubscriptionForm('Продление абонемента', client, sub, (data) => {
          client.subscriptions[index] = { ...sub, ...data };
          updateClient(client.id, client);
          modal.remove();
          renderClients();
          showToast('Абонемент продлён', 'success');
        });
      });
    });

    modal.querySelector('.new-sub-btn').addEventListener('click', () => {
      const newSub = {
        templateId: '',
        startDate: '',
        endDate: '',
        classesPerWeek: 0,
        daysOfWeek: [],
        classTime: '09:00',
        group: '',
        remainingClasses: 0,
        isPaid: true,
        renewalHistory: [],
        subscriptionNumber: `SUB-${String(client.subscriptions.length + 1).padStart(3, '0')}`,
        clientId: client.id
      };
      showSubscriptionForm('Новый абонемент', newSub, [client], getGroups(), (data) => {
        const template = getSubscriptionTemplates().find(t => t.id === data.templateId);
        client.subscriptions.push({
          ...data,
          remainingClasses: template ? template.remainingClasses : data.remainingClasses || 0
        });
        updateClient(client.id, client);
        modal.remove();
        renderClients();
        showToast('Новый абонемент создан', 'success');
      });
    });
  }

  function showSubscriptionForm(title, sub, clients, groups, callback) {
    const modal = document.createElement('div');
    modal.className = 'subscription-form-modal';
    modal.innerHTML = `
      <div class="subscription-form-content">
        <div class="subscription-form-header">
          <h2>${title}</h2>
          <button type="button" class="subscription-form-close" >×</button>
        </div>

        <div class="subscription-form-body">
          <div class="form-grid">
            <div class="form-group">
              <label for="subscription-client" class="required">Клиент</label>
              <select id="subscription-client" required disabled>
                <option value="${sub.clientId}">${clients.find(c => c.id === sub.clientId).name}</option>
              </select>
            </div>

            <div class="form-group">
              <label for="subscription-template" class="required">Тип абонемента</label>
              <select id="subscription-template" required>
                <option value="">Выберите тип абонемента</option>
                ${getSubscriptionTemplates().map(template => `
                  <option value="${template.id}" ${sub.templateId === template.id ? 'selected' : ''}>
                    ${template.type}
                  </option>
                `).join('')}
              </select>
            </div>

            <div class="form-group">
              <label for="subscription-classes-per-week" class="required">Занятий в неделю</label>
              <input type="number" id="subscription-classes-per-week" 
                    value="${sub.classesPerWeek || ''}" 
                    min="0" max="7" required>
            </div>

            <div class="form-group">
              <label for="subscription-class-time" class="required">Время занятия</label>
              <input type="time" id="subscription-class-time" 
                    value="${sub.classTime || '09:00'}" required>
            </div>

            <div class="form-group">
              <label for="subscription-start-date" class="required">Дата начала</label>
              <input type="date" id="subscription-start-date" 
                    value="${sub.startDate || ''}" required>
            </div>

            <div class="form-group">
              <label for="subscription-end-date" class="required">Дата окончания</label>
              <input type="date" id="subscription-end-date" 
                    value="${sub.endDate || ''}" required>
            </div>

            <div class="form-group full-width">
              <label>Дни недели занятий</label>
              <div class="days-of-week-selector">
                ${['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map(day => `
                  <button type="button" class="day-button${sub.daysOfWeek?.includes(day) ? ' selected' : ''}" 
                          data-day="${day}">${day}</button>
                `).join('')}
              </div>
            </div>

            <div class="form-group">
              <label for="subscription-group">Группа (опционально)</label>
              <select id="subscription-group">
                <option value="">Без привязки к группе</option>
                ${groups.map(group => `
                  <option value="${group}" ${sub.group === group ? 'selected' : ''}>${group}</option>
                `).join('')}
              </select>
            </div>

            <div class="form-group">
              <label class="checkbox-label">
                <input type="checkbox" id="subscription-is-paid" ${sub.isPaid !== false ? 'checked' : ''}>
                <span class="checkmark"></span>
                Абонемент оплачен
              </label>
              <small class="field-hint">Влияет на активность абонемента</small>
            </div>
          </div>
        </div>

        <div class="subscription-form-footer">
          <button type="button" id="subscription-cancel-btn" class="btn-secondary">Отмена</button>
          <button type="button" id="subscription-save-btn" class="btn-primary">Сохранить</button>
        </div>
      </div>
    `;

    document.getElementById('main-content').appendChild(modal);

    const closeModal = () => modal.remove();
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeModal();
    });
    modal.querySelector('.subscription-form-close').addEventListener('click', closeModal);

    const dayButtons = modal.querySelectorAll('.day-button');
    dayButtons.forEach(button => {
      button.addEventListener('click', () => {
        button.classList.toggle('selected');
      });
    });

    const startDateInput = document.getElementById('subscription-start-date');
    const endDateInput = document.getElementById('subscription-end-date');

    startDateInput.addEventListener('change', () => {
      if (startDateInput.value && !endDateInput.value) {
        const startDate = new Date(startDateInput.value);
        startDate.setDate(startDate.getDate() + 30);
        endDateInput.value = startDate.toISOString().split('T')[0];
      }
    });

    document.getElementById('subscription-save-btn').addEventListener('click', () => {
      const clientId = sub.clientId;
      const templateId = document.getElementById('subscription-template').value;
      const classesPerWeek = parseInt(document.getElementById('subscription-classes-per-week').value);
      const daysOfWeek = Array.from(modal.querySelectorAll('.day-button.selected'))
        .map(button => button.getAttribute('data-day'));
      const startDate = document.getElementById('subscription-start-date').value;
      const endDate = document.getElementById('subscription-end-date').value;
      const classTime = document.getElementById('subscription-class-time').value;
      const group = document.getElementById('subscription-group').value;
      const isPaid = document.getElementById('subscription-is-paid').checked;

      if (!templateId || isNaN(classesPerWeek) || !startDate || !endDate || !classTime) {
        showToast('Заполните все обязательные поля!', 'error');
        return;
      }

      const start = new Date(startDate);
      const end = new Date(endDate);
      if (end <= start) {
        showToast('Дата окончания должна быть позже даты начала!', 'error');
        return;
      }

      if (classesPerWeek > 0 && daysOfWeek.length === 0) {
        showToast('Выберите дни недели для занятий!', 'error');
        return;
      }

      callback({
        clientId,
        templateId,
        startDate,
        endDate,
        classesPerWeek,
        daysOfWeek,
        classTime,
        group,
        isPaid,
        renewalHistory: sub.renewalHistory || [],
        subscriptionNumber: sub.subscriptionNumber
      });
      closeModal();
    });

    document.getElementById('subscription-cancel-btn').addEventListener('click', closeModal);
  }

  function showRenewSubscriptionForm(title, client, sub, callback) {
    const subscriptionTemplate = getSubscriptionTemplates().find(t => t.id === sub.templateId);
    const defaultEndDate = new Date(Math.max(new Date(), new Date(sub.endDate)));
    defaultEndDate.setDate(defaultEndDate.getDate() + 30);

    const modal = document.createElement('div');
    modal.className = 'renew-subscription-modal';
    modal.innerHTML = `
      <div class="renew-subscription-content">
        <div class="renew-header">
          <h2>${title}</h2>
          <button type="button" class="renew-close" >×</button>
        </div>

        <div class="renew-body">
          <div class="current-subscription-info">
            <h3><img src="images/icon-subscription-info.svg" alt="Текущий абонемент" class="icon"> Текущий абонемент</h3>
            <div class="info-grid">
              <div class="info-item">
                <span class="label">Клиент:</span>
                <span class="value">${client.surname} ${client.name}</span>
              </div>
              <div class="info-item">
                <span class="label">Номер абонемента:</span>
                <span class="value">#${sub.subscriptionNumber}</span>
              </div>
              <div class="info-item">
                <span class="label">Тип:</span>
                <span class="value">${subscriptionTemplate ? subscriptionTemplate.type : 'Неизвестный шаблон'}</span>
              </div>
              <div class="info-item">
                <span class="label">Период:</span>
                <span class="value">${sub.startDate} — ${sub.endDate}</span>
              </div>
              <div class="info-item">
                <span class="label">Осталось занятий:</span>
                <span class="value ${sub.remainingClasses <= 3 && sub.remainingClasses !== Infinity ? 'low-classes' : ''}">
                  ${sub.remainingClasses === Infinity ? 'Безлимит' : sub.remainingClasses}
                </span>
              </div>
              <div class="info-item">
                <span class="label">Статус:</span>
                <span class="value status-${sub.isPaid && new Date(sub.endDate) >= new Date() ? 'active' : 'inactive'}">
                  ${sub.isPaid && new Date(sub.endDate) >= new Date() ? 'Активный' : 'Неактивный'}
                </span>
              </div>
            </div>
            
            ${sub.renewalHistory && sub.renewalHistory.length ? `
              <div class="renewal-history-section">
                <h4>История продлений:</h4>
                <div class="renewal-list">
                  ${sub.renewalHistory.map(entry => {
      const date = new Date(entry.date || entry).toLocaleDateString('ru-RU');
      return entry.fromTemplate ?
        `<span class="renewal-item">${date}: ${entry.fromTemplate} → ${entry.toTemplate}</span>` :
        `<span class="renewal-item">${date}</span>`;
    }).join('')}
                </div>
              </div>
            ` : ''}
          </div>

          <div class="renewal-form">
            <h3><img src="images/icon-renew.svg" alt="Параметры продления" class="icon"> Параметры продления</h3>
            <div class="form-grid">
              <div class="form-group">
                <label for="renew-template" class="required">Тип абонемента</label>
                <select id="renew-template" required>
                  <option value="${sub.templateId}">${subscriptionTemplate ? subscriptionTemplate.type : 'Текущий шаблон'}</option>
                  ${getSubscriptionTemplates().filter(t => t.id !== sub.templateId).map(t =>
      `<option value="${t.id}">${t.type}</option>`
    ).join('')}
                </select>
                <small class="field-hint">Можно изменить тип абонемента при продлении</small>
              </div>

              <div class="form-group">
                <label for="renew-end-date" class="required">Новая дата окончания</label>
                <input type="date" id="renew-end-date" 
                      value="${defaultEndDate.toISOString().split('T')[0]}" required>
                <small class="field-hint">По умолчанию +30 дней от текущей даты</small>
              </div>

              <div class="form-group full-width">
                <label class="checkbox-label">
                  <input type="checkbox" id="renew-is-paid" checked>
                  <span class="checkmark"></span>
                  Продление оплачено
                </label>
                <small class="field-hint">Влияет на активность абонемента после продления</small>
              </div>
            </div>
          </div>
        </div>

        <div class="renew-footer">
          <button type="button" id="renew-cancel-btn" class="btn-secondary">Отмена</button>
          <button type="button" id="renew-save-btn" class="btn-primary">
            <img src="images/icon-renew.svg" alt="Продлить" class="btn-icon"> Продлить абонемент
          </button>
        </div>
      </div>
    `;

    document.getElementById('main-content').appendChild(modal);

    const closeModal = () => modal.remove();
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeModal();
    });
    modal.querySelector('.renew-close').addEventListener('click', closeModal);

    document.getElementById('renew-save-btn').addEventListener('click', () => {
      const templateId = document.getElementById('renew-template').value;
      const endDate = document.getElementById('renew-end-date').value;
      const isPaid = document.getElementById('renew-is-paid').checked;

      if (!templateId || !endDate) {
        showToast('Заполните все обязательные поля!', 'error');
        return;
      }

      const start = new Date(sub.startDate);
      const end = new Date(endDate);
      if (end <= start) {
        showToast('Дата окончания должна быть позже даты начала абонемента!', 'error');
        return;
      }

      const template = getSubscriptionTemplates().find(t => t.id === templateId);
      const renewalHistory = sub.renewalHistory || [];
      const renewalEntry = { date: new Date().toISOString() };

      if (templateId !== sub.templateId) {
        const oldTemplate = getSubscriptionTemplates().find(t => t.id === sub.templateId);
        renewalEntry.fromTemplate = oldTemplate ? oldTemplate.type : 'Неизвестный шаблон';
        renewalEntry.toTemplate = template ? template.type : 'Неизвестный шаблон';
      }

      renewalHistory.push(renewalEntry);

      callback({
        templateId,
        endDate,
        remainingClasses: template ? template.remainingClasses : sub.remainingClasses,
        isPaid,
        renewalHistory
      });
      closeModal();
    });

    document.getElementById('renew-cancel-btn').addEventListener('click', closeModal);
  }

  function showGroupForm(title, client, allGroups, callback) {
    const modal = document.createElement('div');
    modal.className = 'group-management-modal';
    let selectedGroups = [...client.groups];
    let groupHistory = [...client.groupHistory];

    function renderSelectedGroups() {
      const container = modal.querySelector('.selected-groups');
      if (selectedGroups.length === 0) {
        container.innerHTML = '<div class="no-groups-selected">Группы не выбраны</div>';
      } else {
        container.innerHTML = selectedGroups.map(group => `
          <div class="selected-group-tag">
            <span class="group-name">${group}</span>
            <button type="button" class="remove-group-btn" data-group="${group}">×</button>
          </div>
        `).join('');
      }

      container.querySelectorAll('.remove-group-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const group = btn.getAttribute('data-group');
          selectedGroups = selectedGroups.filter(g => g !== group);
          groupHistory.push({ date: new Date().toISOString(), action: 'removed', group });
          renderSelectedGroups();
          renderGroupHistory();
          renderAvailableGroups();
        });
      });
    }

    function renderAvailableGroups() {
      const container = modal.querySelector('.available-groups');
      container.innerHTML = allGroups.filter(group => !selectedGroups.includes(group))
        .map(group => `
          <button type="button" class="group-suggestion btn-secondary" data-group="${group}">
            ${group}
          </button>
        `).join('');
    }

    function renderGroupHistory() {
      const container = modal.querySelector('.group-history');
      container.innerHTML = groupHistory.map(entry => `
        <span class="renewal-entry">${formatDate(entry.date)}: ${entry.action === 'added' ? 'Добавлен в' : 'Удален из'} ${entry.group}</span>
      `).join('');
    }

    modal.innerHTML = `
      <div class="group-management-content">
        <div class="group-management-header">
          <h2>${title}</h2>
          <button type="button" class="group-management-close" >×</button>
        </div>

        <div class="group-management-body">
          <div class="client-info-bar">
            <div class="client-avatar-small">
              ${client.photo ?
        `<img src="${client.photo}" alt="${client.name}">` :
        `<div class="placeholder">${client.name.charAt(0).toUpperCase()}</div>`
      }
            </div>
            <div class="client-details-small">
              <h4>${client.surname} ${client.name}</h4>
              <span>${client.phone}</span>
            </div>
          </div>

          <div class="group-sections">
            <div class="selected-groups-section">
              <label>Текущие группы</label>
              <div class="selected-groups"></div>
              <div class="group-history-section">
                <h4>История изменений групп</h4>
                <div class="group-history"></div>
              </div>
            </div>
            <div class="available-groups-section">
              <label>Справочник групп</label>
              <div class="available-groups"></div>
            </div>
          </div>

          <div class="add-group-section">
            <label for="group-search">Добавить в группу</label>
            <div class="group-input-container">
              <input type="text" id="group-search" placeholder="Введите название группы или выберите из справочника" 
                    list="existing-groups">
              <datalist id="existing-groups">
                ${allGroups.filter(group => !selectedGroups.includes(group))
        .map(group => `<option value="${group}">`).join('')}
              </datalist>
              <input type="date" id="group-start-date" placeholder="Дата начала">
              <button type="button" id="add-group-btn" class="btn-add-group btn-primary">Добавить</button>
            </div>
          </div>
        </div>

        <div class="group-management-footer">
          <button type="button" id="group-cancel-btn" class="btn-secondary">Отмена</button>
          <button type="button" id="group-save-btn" class="btn-primary">
            Сохранить (${selectedGroups.length})
          </button>
        </div>
      </div>
    `;

    document.getElementById('main-content').appendChild(modal);

    const closeModal = () => modal.remove();
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeModal();
    });
    modal.querySelector('.group-management-close').addEventListener('click', closeModal);

    renderSelectedGroups();
    renderAvailableGroups();
    renderGroupHistory();

    const searchInput = document.getElementById('group-search');
    const startDateInput = document.getElementById('group-start-date');
    const addBtn = document.getElementById('add-group-btn');
    const saveBtn = document.getElementById('group-save-btn');

    function addGroup(groupName) {
      const trimmedName = groupName.trim();
      const startDate = startDateInput.value || new Date().toISOString().split('T')[0];
      if (trimmedName && !selectedGroups.includes(trimmedName)) {
        selectedGroups.push(trimmedName);
        groupHistory.push({ date: startDate, action: 'added', group: trimmedName });
        renderSelectedGroups();
        renderGroupHistory();
        renderAvailableGroups();
        searchInput.value = '';
        startDateInput.value = '';
        saveBtn.textContent = `Сохранить (${selectedGroups.length})`;
      }
    }

    addBtn.addEventListener('click', () => {
      if (!searchInput.value.trim()) {
        showToast('Введите название группы!', 'error');
        return;
      }
      addGroup(searchInput.value);
    });

    searchInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        if (!searchInput.value.trim()) {
          showToast('Введите название группы!', 'error');
          return;
        }
        addGroup(searchInput.value);
      }
    });

    modal.addEventListener('click', (e) => {
      if (e.target.classList.contains('group-suggestion')) {
        addGroup(e.target.getAttribute('data-group'));
      }
    });

    document.getElementById('group-save-btn').addEventListener('click', () => {
      callback(selectedGroups, groupHistory);
      closeModal();
    });

    document.getElementById('group-cancel-btn').addEventListener('click', closeModal);
  }
}