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
      remainingClasses: 8,
      isPaid: true,
      renewalHistory: [],
      subscriptionNumber: 'SUB-001'
    },
    photo: '',
    createdAt: '2025-01-15T10:00:00Z',
    lastVisit: '2025-08-15T09:00:00Z'
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
    },
    photo: '',
    createdAt: '2025-02-20T14:30:00Z',
    lastVisit: '2025-08-14T16:45:00Z'
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
    lastVisit: new Date().toISOString(),
    subscription: client.subscription ? {
      ...client.subscription,
      subscriptionNumber: `SUB-${String(clientsData.length + 1).padStart(3, '0')}`
    } : null
  };
  clientsData.push(newClient);
  return newClient;
}

export function updateClient(id, data) {
  const client = clientsData.find(c => c.id === id);
  if (client) {
    Object.assign(client, data);
    if (client.subscription && !client.subscription.subscriptionNumber) {
      client.subscription.subscriptionNumber = `SUB-${String(id).replace('client', '').padStart(3, '0')}`;
    }
  }
  return client;
}

export function removeClient(id) {
  clientsData = clientsData.filter(c => c.id !== id);
}

export function loadClients() {
  const mainContent = document.getElementById('main-content');
  mainContent.innerHTML = '';

  const header = document.createElement('header');
  header.className = 'header';
  header.innerHTML = `
    <div class="header-content">
      <h1><i class="icon-users"></i>Клиенты</h1>
      <div class="header-stats">
        <div class="stat-item">
          <span class="stat-number">${clientsData.length}</span>
          <span class="stat-label">всего</span>
        </div>
        <div class="stat-item">
          <span class="stat-number">${clientsData.filter(c => c.subscription && c.subscription.isPaid && new Date(c.subscription.endDate) >= new Date()).length}</span>
          <span class="stat-label">активных</span>
        </div>
        <div class="stat-item">
          <span class="stat-number">${clientsData.filter(c => c.blacklisted).length}</span>
          <span class="stat-label">в ЧС</span>
        </div>
      </div>
    </div>
    <div class="user-actions">
      <span>Пользователь</span>
      <button>Выход</button>
    </div>
  `;
  mainContent.appendChild(header);

  const controlBar = document.createElement('div');
  controlBar.className = 'control-bar';
  controlBar.innerHTML = `
    <div class="search-container">
      <div class="search-input-wrapper">
        <i class="search-icon">🔍</i>
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
        <option value="last-visit">По последнему визиту</option>
      </select>
    </div>
    <button class="client-add-btn" id="client-add-btn">
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
    <div class="empty-state-icon">👥</div>
    <h3>Клиенты не найдены</h3>
    <p>Попробуйте изменить параметры поиска или добавьте нового клиента</p>
  `;
  emptyState.style.display = 'none';
  clientSection.appendChild(emptyState);

  mainContent.appendChild(clientSection);

  function getSubscriptionStatus(client) {
    if (!client.subscription) return 'no-subscription';
    if (client.blacklisted) return 'blacklisted';

    const isActive = client.subscription.isPaid && new Date(client.subscription.endDate) >= new Date();
    return isActive ? 'active' : 'inactive';
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
          return a.name.localeCompare(b.name);
        case 'date-desc':
          return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
        case 'date-asc':
          return new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
        case 'last-visit':
          return new Date(b.lastVisit || 0) - new Date(a.lastVisit || 0);
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
      const matchesSearch = search === '' ||
        client.name.toLowerCase().includes(search) ||
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

    clientList.style.display = 'flex';
    emptyState.style.display = 'none';

    clientList.innerHTML = filteredClients
      .map(client => {
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

        return `
          <div class="client-card ${client.blacklisted ? 'blacklisted' : ''}" data-id="${client.id}">
            <div class="client-main-info">
              <div class="client-avatar">
                ${client.photo ?
            `<img src="${client.photo}" class="client-photo" alt="${client.name}">` :
            `<div class="client-photo-placeholder">${client.name.charAt(0).toUpperCase()}</div>`
          }
                <div class="status-indicator ${statusClass}" title="${statusText}"></div>
              </div>
              
              <div class="client-details">
                <div class="client-name-section">
                  <h3 class="client-name ${hasDiagnosis ? 'has-diagnosis' : ''}">${client.name}</h3>
                  <div class="client-meta">
                    <span class="client-phone">${client.phone}</span>
                    ${hasDiagnosis ? `<span class="diagnosis-badge">${client.diagnosis}</span>` : ''}
                  </div>
                </div>
                
                <div class="client-additional-info">
                  ${client.groups.length > 0 ?
            `<div class="groups-info">
                      <span class="info-label">Группы:</span> 
                      ${client.groups.map(group => `<span class="group-tag">${group}</span>`).join('')}
                    </div>` :
            '<div class="groups-info"><span class="no-groups">Без групп</span></div>'
          }
                  
                  <div class="visit-info">
                    <span class="info-label">Последний визит:</span>
                    <span class="last-visit">${formatDate(client.lastVisit)}</span>
                  </div>
                  
                  ${client.subscription && client.subscription.remainingClasses !== undefined ?
            `<div class="classes-info">
                      <span class="info-label">Осталось занятий:</span>
                      <span class="remaining-classes ${client.subscription.remainingClasses <= 3 && client.subscription.remainingClasses !== Infinity ? 'low' : ''}">
                        ${client.subscription.remainingClasses === Infinity ? '∞' : client.subscription.remainingClasses}
                      </span>
                    </div>` : ''
          }
                </div>
              </div>
            </div>
            
            <div class="client-actions">
              <div class="action-buttons-group">
                <button class="client-action-btn edit-btn" data-id="${client.id}" title="Редактировать">
                  <i class="btn-icon">✏️</i>
                </button>
                <button class="client-action-btn subscription-btn" data-id="${client.id}" title="Абонемент">
                  <i class="btn-icon">🎫</i>
                </button>
                <button class="client-action-btn group-btn" data-id="${client.id}" title="Группы">
                  <i class="btn-icon">👥</i>
                </button>
                <button class="client-action-btn blacklist-btn ${client.blacklisted ? 'active' : ''}" data-id="${client.id}" title="${client.blacklisted ? 'Убрать из чёрного списка' : 'В чёрный список'}">
                  <i class="btn-icon">${client.blacklisted ? '✅' : '🚫'}</i>
                </button>
                <button class="client-action-btn delete-btn" data-id="${client.id}" title="Удалить">
                  <i class="btn-icon">🗑️</i>
                </button>
              </div>
            </div>
          </div>
        `;
      }).join('');
  }

  renderClients();

  // Event listeners
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
      addClient({ ...data, groups: [], blacklisted: false, subscription: null });
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
        const sub = client.subscription ? { ...client.subscription, clientId } : {
          clientId,
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
          subscriptionNumber: `SUB-${String(clientId).replace('client', '').padStart(3, '0')}`
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
            remainingClasses: remaining,
            isPaid: data.isPaid,
            renewalHistory: data.renewalHistory || [],
            subscriptionNumber: data.subscriptionNumber || `SUB-${String(clientId).replace('client', '').padStart(3, '0')}`
          };
          renderClients();
          showToast('Абонемент обновлён', 'success');
        });
      } else if (actionBtn.classList.contains('group-btn')) {
        showGroupForm('Управление группами', client, getGroups(), (groups) => {
          client.groups = groups;
          renderClients();
          showToast('Группы клиента обновлены', 'success');
        });
      } else if (actionBtn.classList.contains('delete-btn')) {
        showConfirmDialog(
          'Удалить клиента?',
          `Вы уверены, что хотите удалить клиента "${client.name}"? Это действие нельзя отменить.`,
          () => {
            removeClient(clientId);
            renderClients();
            showToast('Клиент удалён', 'success');
          }
        );
      }
    } else {
      // Клик по карточке - показать детали
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
          <button class="confirm-btn-cancel">Отмена</button>
          <button class="confirm-btn-ok">Удалить</button>
        </div>
      </div>
    `;

    mainContent.appendChild(modal);

    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.remove();
    });

    modal.querySelector('.confirm-btn-cancel').addEventListener('click', () => modal.remove());
    modal.querySelector('.confirm-btn-ok').addEventListener('click', () => {
      onConfirm();
      modal.remove();
    });
  }

  // Остальные функции модальных окон остаются такими же, как в оригинале
  // (showPhotoZoomModal, showClientDetails, showClientForm, showSubscriptionForm, showRenewSubscriptionForm, showGroupForm)
  // Добавлю их в следующей части...

  function showPhotoZoomModal(photoSrc) {
    if (!photoSrc || photoSrc.includes('default-icon.svg')) return;

    const modal = document.createElement('div');
    modal.className = 'photo-zoom-modal';
    modal.innerHTML = `
      <div class="photo-zoom-content">
        <img src="${photoSrc}" class="photo-zoom-image" alt="Увеличенное фото">
        <button class="photo-zoom-close">Закрыть</button>
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
    const subscriptionTemplate = client.subscription ? getSubscriptionTemplates().find(t => t.id === client.subscription.templateId) : null;
    const isActive = client.subscription && client.subscription.isPaid && new Date(client.subscription.endDate) >= new Date();
    const modal = document.createElement('div');
    modal.className = 'client-details-modal';
    modal.innerHTML = `
      <div class="client-details-content">
        <div class="details-header">
          <div class="client-avatar-large">
            ${client.photo ?
        `<img src="${client.photo}" class="client-photo-large" alt="${client.name}">` :
        `<div class="client-photo-placeholder-large">${client.name.charAt(0).toUpperCase()}</div>`
      }
          </div>
          <div class="client-title">
            <h2>${client.name}${client.blacklisted ? ' (В чёрном списке)' : ''}</h2>
            <span class="client-id">ID: ${client.id}</span>
          </div>
        </div>
        
        <div class="details-grid">
          <div class="detail-section">
            <h4>Контактная информация</h4>
            <div class="detail-item">
              <span class="detail-label">Телефон:</span>
              <span class="detail-value">${client.phone}</span>
            </div>
            ${client.phoneSecondary ? `
              <div class="detail-item">
                <span class="detail-label">Доп. телефон:</span>
                <span class="detail-value">${client.phoneSecondary}</span>
              </div>
            ` : ''}
            ${client.parentName ? `
              <div class="detail-item">
                <span class="detail-label">Родитель:</span>
                <span class="detail-value">${client.parentName}</span>
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
            <h4>Группы и занятия</h4>
            <div class="detail-item">
              <span class="detail-label">Группы:</span>
              <div class="groups-list">
                ${client.groups.length ?
        client.groups.map(group => `<span class="group-tag">${group}</span>`).join('') :
        '<span class="no-data">Не назначены</span>'
      }
              </div>
            </div>
          </div>
          
          <div class="detail-section">
            <h4>Абонемент</h4>
            ${client.subscription ? `
              <div class="detail-item">
                <span class="detail-label">Тип:</span>
                <span class="detail-value">${subscriptionTemplate ? subscriptionTemplate.type : `Абонемент #${client.subscription.subscriptionNumber}`}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">Статус:</span>
                <span class="detail-value status-${isActive ? 'active' : 'inactive'}">${isActive ? 'Активный' : 'Неактивный'}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">Период:</span>
                <span class="detail-value">${client.subscription.startDate} — ${client.subscription.endDate}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">Занятий осталось:</span>
                <span class="detail-value">${client.subscription.remainingClasses === Infinity ? 'Безлимит' : client.subscription.remainingClasses}</span>
              </div>
            ` : `
              <div class="detail-item">
                <span class="no-data">Абонемент не оформлен</span>
              </div>
            `}
            ${client.subscription && client.subscription.renewalHistory?.length ? `
              <div class="detail-item">
                <span class="detail-label">История продлений:</span>
                <div class="renewal-history">
                  ${client.subscription.renewalHistory.map(entry => {
        const date = new Date(entry.date || entry).toLocaleDateString('ru-RU');
        return entry.fromTemplate ?
          `<span class="renewal-entry">${date}: ${entry.fromTemplate} → ${entry.toTemplate}</span>` :
          `<span class="renewal-entry">${date}</span>`;
      }).join('')}
                </div>
              </div>
            ` : ''}
          </div>
          
          <div class="detail-section">
            <h4>Активность</h4>
            <div class="detail-item">
              <span class="detail-label">Дата регистрации:</span>
              <span class="detail-value">${formatDate(client.createdAt)}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Последний визит:</span>
              <span class="detail-value">${formatDate(client.lastVisit)}</span>
            </div>
          </div>
        </div>
        
        <div class="client-details-actions">
          ${client.subscription ? `<button id="client-subscription-renew-btn" class="primary-btn">Продлить абонемент</button>` : ''}
          <button id="client-edit-details-btn" class="secondary-btn">Редактировать</button>
          <button id="client-close-btn" class="tertiary-btn">Закрыть</button>
        </div>
      </div>
    `;
    mainContent.appendChild(modal);

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

    if (client.subscription) {
      document.getElementById('client-subscription-renew-btn').addEventListener('click', () => {
        showRenewSubscriptionForm('Продление абонемента', client, client.subscription, (data) => {
          client.subscription = { ...client.subscription, ...data };
          updateClient(client.id, client);
          modal.remove();
          renderClients();
          showToast('Абонемент продлён', 'success');
        });
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
    modal.className = 'client-modal';
    modal.innerHTML = `
    <div class="client-modal-content">
      <div class="modal-header">
        <h2>${title}</h2>
        <button class="modal-close" type="button">×</button>
      </div>
      
      <div class="modal-body">
        <div class="client-photo-section">
          <div class="photo-upload-area">
            ${client.photo ?
        `<img src="${client.photo}" class="client-photo-preview" id="client-photo-preview" alt="${client.name || 'Клиент'}">` :
        `<div class="client-photo-preview placeholder" id="client-photo-preview">
                <i class="upload-icon">📷</i>
                <span>Добавить фото</span>
               </div>`
      }
            <input type="file" id="client-photo" accept="image/*" class="photo-input">
            <button type="button" class="photo-remove-btn" id="photo-remove-btn" ${!client.photo ? 'style="display: none;"' : ''}>
              <i>🗑️</i> Удалить фото
            </button>
          </div>
        </div>

        <div class="form-grid">
          <div class="form-group">
            <label for="client-name" class="required">Полное имя</label>
            <input type="text" id="client-name" value="${client.name || ''}" required placeholder="Введите имя и фамилию">
            <span class="field-error" id="name-error"></span>
          </div>

          <div class="form-group">
            <label for="client-phone" class="required">Основной телефон</label>
            <input type="tel" id="client-phone" value="${client.phone || ''}" required placeholder="+7 (999) 123-45-67">
            <span class="field-error" id="phone-error"></span>
          </div>

          <div class="form-group">
            <label for="client-phone-secondary">Дополнительный телефон</label>
            <input type="tel" id="client-phone-secondary" value="${client.phoneSecondary || ''}" placeholder="+7 (999) 123-45-67">
          </div>

          <div class="form-group">
            <label for="client-parent-name">Имя родителя/представителя</label>
            <input type="text" id="client-parent-name" value="${client.parentName || ''}" placeholder="Для несовершеннолетних">
          </div>

          <div class="form-group full-width">
            <label for="client-diagnosis">Медицинский диагноз</label>
            <input type="text" id="client-diagnosis" value="${client.diagnosis || ''}" placeholder="Укажите диагноз или 'Нет'">
          </div>

          <div class="form-group full-width">
            <label for="client-features">Особенности и примечания</label>
            <textarea id="client-features" placeholder="Дополнительная информация о клиенте, особенности занятий...">${client.features || ''}</textarea>
          </div>
        </div>
      </div>

      <div class="modal-footer">
        <button type="button" id="client-cancel-btn" class="btn-secondary">Отмена</button>
        <button type="button" id="client-save-btn" class="btn-primary">Сохранить</button>
      </div>
    </div>
  `;

    document.getElementById('main-content').appendChild(modal);

    // Обработка закрытия модального окна
    const closeModal = () => modal.remove();
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeModal();
    });
    modal.querySelector('.modal-close').addEventListener('click', closeModal);

    // Обработка фото
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
        if (file.size > 5 * 1024 * 1024) { // 5MB limit
          showToast('Размер файла не должен превышать 5MB', 'error');
          return;
        }

        const reader = new FileReader();
        reader.onload = (ev) => {
          photoPreview.innerHTML = `<img src="${ev.target.result}" alt="Предпросмотр">`;
          photoPreview.classList.remove('placeholder');
          photoRemoveBtn.style.display = 'block';
        };
        reader.readAsDataURL(file);
      }
    });

    photoRemoveBtn.addEventListener('click', () => {
      photoPreview.innerHTML = `
      <i class="upload-icon">📷</i>
      <span>Добавить фото</span>
    `;
      photoPreview.classList.add('placeholder');
      photoInput.value = '';
      photoRemoveBtn.style.display = 'none';
    });

    // Валидация полей
    function validateForm() {
      let isValid = true;

      const name = document.getElementById('client-name').value.trim();
      const phone = document.getElementById('client-phone').value.trim();

      // Очистка предыдущих ошибок
      document.querySelectorAll('.field-error').forEach(el => el.textContent = '');
      document.querySelectorAll('.form-group input').forEach(el => el.classList.remove('error'));

      if (!name) {
        document.getElementById('name-error').textContent = 'Имя обязательно для заполнения';
        document.getElementById('client-name').classList.add('error');
        isValid = false;
      }

      if (!phone) {
        document.getElementById('phone-error').textContent = 'Телефон обязателен для заполнения';
        document.getElementById('client-phone').classList.add('error');
        isValid = false;
      } else if (!/^[\+]?[0-9\s\-\(\)]{10,}$/.test(phone)) {
        document.getElementById('phone-error').textContent = 'Введите корректный номер телефона';
        document.getElementById('client-phone').classList.add('error');
        isValid = false;
      }

      return isValid;
    }

    // Обработчики кнопок
    document.getElementById('client-save-btn').addEventListener('click', () => {
      if (!validateForm()) return;

      const name = document.getElementById('client-name').value.trim();
      const phone = document.getElementById('client-phone').value.trim();
      const phoneSecondary = document.getElementById('client-phone-secondary').value.trim();
      const parentName = document.getElementById('client-parent-name').value.trim();
      const diagnosis = document.getElementById('client-diagnosis').value.trim();
      const features = document.getElementById('client-features').value.trim();

      let photo = '';
      const photoImg = photoPreview.querySelector('img');
      if (photoImg && !photoPreview.classList.contains('placeholder')) {
        photo = photoImg.src;
      }

      callback({
        name,
        phone,
        phoneSecondary,
        parentName,
        diagnosis: diagnosis || 'Нет',
        features,
        photo
      });
      closeModal();
    });

    document.getElementById('client-cancel-btn').addEventListener('click', closeModal);

    // Автофокус на первое поле
    setTimeout(() => document.getElementById('client-name').focus(), 100);
  }

  function showSubscriptionForm(title, sub, clients, groups, callback) {
    const modal = document.createElement('div');
    modal.className = 'subscription-modal';
    modal.innerHTML = `
    <div class="subscription-modal-content">
      <div class="modal-header">
        <h2>${title}</h2>
        <button class="modal-close" type="button">×</button>
      </div>

      <div class="modal-body">
        <div class="form-grid">
          <div class="form-group">
            <label for="subscription-client" class="required">Клиент</label>
            <select id="subscription-client" required>
              <option value="">Выберите клиента</option>
              ${clients.map(c => `
                <option value="${c.id}" ${sub.clientId === c.id ? 'selected' : ''}>
                  ${c.name}${c.blacklisted ? ' (В чёрном списке)' : ''}
                </option>
              `).join('')}
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

      <div class="modal-footer">
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
    modal.querySelector('.modal-close').addEventListener('click', closeModal);

    // Обработка кнопок дней недели
    const dayButtons = modal.querySelectorAll('.day-button');
    dayButtons.forEach(button => {
      button.addEventListener('click', () => {
        button.classList.toggle('selected');
      });
    });

    // Автообновление даты окончания при изменении даты начала
    const startDateInput = document.getElementById('subscription-start-date');
    const endDateInput = document.getElementById('subscription-end-date');

    startDateInput.addEventListener('change', () => {
      if (startDateInput.value && !endDateInput.value) {
        const startDate = new Date(startDateInput.value);
        startDate.setDate(startDate.getDate() + 30); // +30 дней по умолчанию
        endDateInput.value = startDate.toISOString().split('T')[0];
      }
    });

    document.getElementById('subscription-save-btn').addEventListener('click', () => {
      const clientId = document.getElementById('subscription-client').value;
      const templateId = document.getElementById('subscription-template').value;
      const classesPerWeek = parseInt(document.getElementById('subscription-classes-per-week').value);
      const daysOfWeek = Array.from(modal.querySelectorAll('.day-button.selected'))
        .map(button => button.getAttribute('data-day'));
      const startDate = document.getElementById('subscription-start-date').value;
      const endDate = document.getElementById('subscription-end-date').value;
      const classTime = document.getElementById('subscription-class-time').value;
      const group = document.getElementById('subscription-group').value;
      const isPaid = document.getElementById('subscription-is-paid').checked;

      // Валидация
      if (!clientId || !templateId || isNaN(classesPerWeek) || !startDate || !endDate || !classTime) {
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
        subscriptionNumber: sub.subscriptionNumber || `SUB-${String(clientId).replace('client', '').padStart(3, '0')}`
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
    <div class="renew-subscription-modal-content">
      <div class="modal-header">
        <h2>${title}</h2>
        <button class="modal-close" type="button">×</button>
      </div>

      <div class="modal-body">
        <div class="current-subscription-info">
          <h3><i>📋</i> Текущий абонемент</h3>
          <div class="info-grid">
            <div class="info-item">
              <span class="label">Клиент:</span>
              <span class="value">${client.name}</span>
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
          <h3><i>🔄</i> Параметры продления</h3>
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

      <div class="modal-footer">
        <button type="button" id="renew-cancel-btn" class="btn-secondary">Отмена</button>
        <button type="button" id="renew-save-btn" class="btn-primary">
          <i>🔄</i> Продлить абонемент
        </button>
      </div>
    </div>
  `;

    document.getElementById('main-content').appendChild(modal);

    const closeModal = () => modal.remove();
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeModal();
    });
    modal.querySelector('.modal-close').addEventListener('click', closeModal);

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
        renewalHistory,
        subscriptionNumber: sub.subscriptionNumber
      });
      closeModal();
    });

    document.getElementById('renew-cancel-btn').addEventListener('click', closeModal);
  }

  function showGroupForm(title, client, allGroups, callback) {
    const modal = document.createElement('div');
    modal.className = 'group-management-modal';
    let selectedGroups = [...client.groups];

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
          selectedGroups = selectedGroups.filter(g => g !== btn.getAttribute('data-group'));
          renderSelectedGroups();
        });
      });
    }

    modal.innerHTML = `
    <div class="group-management-modal-content">
      <div class="modal-header">
        <h2>${title}</h2>
        <button class="modal-close" type="button">×</button>
      </div>

      <div class="modal-body">
        <div class="client-info-bar">
          <div class="client-avatar-small">
            ${client.photo ?
        `<img src="${client.photo}" alt="${client.name}">` :
        `<div class="placeholder">${client.name.charAt(0).toUpperCase()}</div>`
      }
          </div>
          <div class="client-details-small">
            <h4>${client.name}</h4>
            <span>${client.phone}</span>
          </div>
        </div>

        <div class="group-management-section">
          <div class="add-group-section">
            <label for="group-search">Добавить в группу</label>
            <div class="group-input-container">
              <input type="text" id="group-search" placeholder="Введите название группы или выберите из существующих" 
                     list="existing-groups">
              <datalist id="existing-groups">
                ${allGroups.filter(group => !selectedGroups.includes(group))
        .map(group => `<option value="${group}">`).join('')}
              </datalist>
              <button type="button" id="add-group-btn" class="btn-add-group">Добавить</button>
            </div>
          </div>

          <div class="selected-groups-section">
            <label>Выбранные группы</label>
            <div class="selected-groups"></div>
          </div>

          ${allGroups.length > 0 ? `
            <div class="available-groups-section">
              <label>Доступные группы</label>
              <div class="available-groups">
                ${allGroups.filter(group => !selectedGroups.includes(group))
          .map(group => `
                            <button type="button" class="group-suggestion" data-group="${group}">
                              ${group}
                            </button>
                          `).join('')}
              </div>
            </div>
          ` : ''}
        </div>
      </div>

      <div class="modal-footer">
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
    modal.querySelector('.modal-close').addEventListener('click', closeModal);

    renderSelectedGroups();

    const searchInput = document.getElementById('group-search');
    const addBtn = document.getElementById('add-group-btn');
    const saveBtn = document.getElementById('group-save-btn');

    function addGroup(groupName) {
      const trimmedName = groupName.trim();
      if (trimmedName && !selectedGroups.includes(trimmedName)) {
        selectedGroups.push(trimmedName);
        renderSelectedGroups();
        searchInput.value = '';

        // Обновить счетчик в кнопке сохранения
        saveBtn.textContent = `Сохранить (${selectedGroups.length})`;

        // Обновить список доступных групп
        const availableGroups = modal.querySelector('.available-groups');
        if (availableGroups) {
          const existingBtn = availableGroups.querySelector(`[data-group="${trimmedName}"]`);
          if (existingBtn) existingBtn.remove();
        }

        // Обновить datalist
        const datalist = document.getElementById('existing-groups');
        datalist.innerHTML = allGroups.filter(group => !selectedGroups.includes(group))
          .map(group => `<option value="${group}">`).join('');
      }
    }

    addBtn.addEventListener('click', () => addGroup(searchInput.value));

    searchInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        addGroup(searchInput.value);
      }
    });

    // Обработка клика по предлагаемым группам
    modal.addEventListener('click', (e) => {
      if (e.target.classList.contains('group-suggestion')) {
        addGroup(e.target.getAttribute('data-group'));
      }
    });

    document.getElementById('group-save-btn').addEventListener('click', () => {
      callback(selectedGroups);
      closeModal();
    });

    document.getElementById('group-cancel-btn').addEventListener('click', closeModal);
  }
}