// groups.js (updated for history and date-based transition)
import { getTrainers } from './employees.js';
import { getClients, addGroupToClient, removeGroupFromClient } from './clients.js';

// Загрузка групп из localStorage
let groups = JSON.parse(localStorage.getItem('groups')) || [
  { id: 'group1', name: 'Йога для начинающих', trainer: 'Анна Иванова', clients: ['Иван Сергеев'] },
  { id: 'group2', name: 'Пилатес продвинутый', trainer: 'Мария Петрова', clients: [] },
  { id: 'group3', name: 'Зумба вечеринка1', trainer: 'Олег Смирнов', clients: ['Алексей Попов'] },
  { id: 'group4', name: 'Зумба вечеринка2', trainer: 'Олег Смирнов', clients: ['Алексей Попов'] },
  { id: 'group5', name: 'Зумба вечеринка4', trainer: 'Олег Смирнов', clients: ['Алексей Попов'] },
  { id: 'group6', name: 'Зумба вечеринка5', trainer: 'Олег Смирнов', clients: ['Алексей Попов'] },
  { id: 'group7', name: 'Зумба вечеринка6', trainer: 'Олег Смирнов', clients: ['Алексей Попов'] },
  { id: 'group8', name: 'Зумба вечеринка7', trainer: 'Олег Смирнов', clients: ['Алексей Попов'] },
  { id: 'group9', name: 'Зумба вечеринка8', trainer: 'Олег Смирнов', clients: ['Алексей Попов'] },
];

function saveGroups() {
  localStorage.setItem('groups', JSON.stringify(groups));
}

export function getGroups() {
  return groups.map(group => group.name);
}

export function getGroupById(id) {
  return groups.find(group => group.id === id);
}

export function getGroupByName(name) {
  return groups.find(group => group.name === name);
}

export function addClientToGroup(groupId, clientName, startDate) {
  const group = getGroupById(groupId);
  if (group && !group.clients.includes(clientName)) {
    group.clients.push({ name: clientName, startDate });
    addGroupToClient(clientName, group.name, 'added', startDate);
    saveGroups();
  }
}

export function removeClientFromGroup(groupId, clientName) {
  const group = getGroupById(groupId);
  if (group) {
    group.clients = group.clients.filter(c => c.name !== clientName);
    removeGroupFromClient(clientName, group.name);
    saveGroups();
  }
}

export function addNewGroup(data) {
  if (groups.some(g => g.name.toLowerCase() === data.name.toLowerCase())) {
    return null;
  }
  const newGroup = {
    id: `group${Date.now()}`,
    name: data.name,
    trainer: data.trainer,
    clients: data.clients || []
  };
  groups.push(newGroup);
  newGroup.clients.forEach(clientName => addClientToGroup(newGroup.id, clientName, new Date().toISOString().split('T')[0]));
  saveGroups();
  return newGroup;
}

function escapeHtml(s) {
  if (!s) return '';
  return String(s).replace(/[&<>"']/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
}

export function showGroupModal(title, group, trainers, selectedClients, callback) {
  const modal = document.createElement('div');
  modal.className = 'modal';
  modal.innerHTML = `
    <div class="modal-content">
      <h2>${escapeHtml(title)}</h2>
      <form id="group-form">
        <input type="text" id="group-name" placeholder="Название группы" value="${escapeHtml(group.name || '')}" required>
        <select id="group-trainer" required>
          <option value="">Выберите тренера</option>
          ${trainers.map(trainer => `<option value="${escapeHtml(trainer)}" ${group.trainer === trainer ? 'selected' : ''}>${escapeHtml(trainer)}</option>`).join('')}
        </select>
        <div class="modal-actions">
          <button type="submit" class="btn-primary">Сохранить</button>
          <button type="button" class="btn-secondary" id="modal-cancel-btn">Отмена</button>
        </div>
      </form>
    </div>
  `;
  document.body.appendChild(modal);

  modal.querySelector('#group-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const name = modal.querySelector('#group-name').value.trim();
    const trainer = modal.querySelector('#group-trainer').value;
    if (name && trainer) {
      callback({ name, trainer, clients: selectedClients });
      modal.remove();
    } else {
      alert('Заполните все поля корректно!');
    }
  });

  modal.querySelector('#modal-cancel-btn').addEventListener('click', () => {
    modal.remove();
  });

  modal.addEventListener('click', (e) => {
    if (e.target === modal) modal.remove();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') modal.remove();
  }, { once: true });
}

export function loadGroups() {
  const mainContent = document.getElementById('main-content');
  mainContent.innerHTML = '';

  const header = document.createElement('header');
  header.className = 'header';
  header.innerHTML = `
    <h1><img src="./images/icon-group.svg" alt="Группы"> Группы</h1>
  `;
  mainContent.appendChild(header);

  const filterBar = document.createElement('div');
  filterBar.className = 'filter-bar';
  filterBar.innerHTML = `
    <input type="text" placeholder="Поиск групп" class="filter-input" id="group-filter-input">
    <button class="btn-primary group-add-btn" id="group-add-btn">Добавить группу</button>
  `;
  mainContent.appendChild(filterBar);

  const groupTable = document.createElement('div');
  groupTable.className = 'group-table-container';
  groupTable.innerHTML = `
    <table class="group-table">
      <thead>
        <tr>
          <th data-sort="name">Название группы</th>
          <th data-sort="trainer">Тренер</th>
          <th data-sort="clients">Количество клиентов</th>
          <th>Действия</th>
        </tr>
      </thead>
      <tbody id="group-table-body"></tbody>
    </table>
  `;
  mainContent.appendChild(groupTable);
  let sortField = 'name';
  let sortOrder = 1;

  function renderGroups() {
    const searchTerm = document.getElementById('group-filter-input').value.toLowerCase();
    const tbody = document.getElementById('group-table-body');
    tbody.innerHTML = groups
      .filter(group => !searchTerm || group.name.toLowerCase().includes(searchTerm))
      .sort((a, b) => {
        if (sortField === 'name') return sortOrder * a.name.localeCompare(b.name);
        if (sortField === 'trainer') return sortOrder * a.trainer.localeCompare(b.trainer);
        if (sortField === 'clients') return sortOrder * (a.clients.length - b.clients.length);
        return 0;
      })
      .map(group => `
        <tr class="group-row" id="${escapeHtml(group.id)}">
          <td>${escapeHtml(group.name)}</td>
          <td>${escapeHtml(group.trainer)}</td>
          <td>${group.clients.length}</td>
          <td>
            <button class="btn-icon group-edit-btn" data-id="${escapeHtml(group.id)}" title="Редактировать">
              <img src="./images/icon-edit.svg" alt="Редактировать">
            </button>
            <button class="btn-icon group-clients-btn" data-id="${escapeHtml(group.id)}" title="Клиенты">
              <img src="./images/icon-clients.svg" alt="Клиенты">
            </button>
            <button class="btn-icon group-delete-btn" data-id="${escapeHtml(group.id)}" title="Удалить">
              <img src="./images/trash.svg" alt="Удалить">
            </button>
          </td>
        </tr>
      `).join('');
  }

  renderGroups();

  const filterInput = document.getElementById('group-filter-input');
  const addGroupBtn = document.getElementById('group-add-btn');
  const tableHead = groupTable.querySelector('thead');

  filterInput.addEventListener('input', renderGroups);

  tableHead.addEventListener('click', (e) => {
    const th = e.target.closest('th[data-sort]');
    if (th) {
      const field = th.getAttribute('data-sort');
      if (field === sortField) {
        sortOrder = -sortOrder;
      } else {
        sortField = field;
        sortOrder = 1;
      }
      renderGroups();
    }
  });

  addGroupBtn.addEventListener('click', () => {
    const trainers = getTrainers();
    if (trainers.length === 0) {
      alert('Нет доступных тренеров. Добавьте тренеров в разделе "Сотрудники".');
      return;
    }
    showGroupModal('Добавить группу', {}, trainers, [], (data) => {
      if (groups.some(g => g.name.toLowerCase() === data.name.toLowerCase())) {
        alert('Группа с таким именем уже существует!');
        return;
      }
      const newGroup = {
        id: `group${Date.now()}`,
        name: data.name,
        trainer: data.trainer,
        clients: data.clients || []
      };
      groups.push(newGroup);
      newGroup.clients.forEach(clientName => addClientToGroup(newGroup.id, clientName));
      saveGroups();
      renderGroups();
    });
  });

  groupTable.addEventListener('click', (e) => {
    if (e.target.closest('.group-delete-btn')) {
      const groupId = e.target.closest('.group-delete-btn').getAttribute('data-id');
      const group = getGroupById(groupId);
      showConfirmModal(`Удалить группу "${group.name}"?`, () => {
        group.clients.forEach(client => removeClientFromGroup(groupId, client.name));
        groups = groups.filter(g => g.id !== groupId);
        saveGroups();
        renderGroups();
      });
    } else if (e.target.closest('.group-edit-btn')) {
      const groupId = e.target.closest('.group-edit-btn').getAttribute('data-id');
      const group = getGroupById(groupId);
      const trainers = getTrainers();
      if (trainers.length === 0) {
        alert('Нет доступных тренеров. Добавьте тренеров в разделе "Сотрудники".');
        return;
      }
      showGroupModal('Редактировать группу', group, trainers, group.clients.map(c => c.name), (data) => {
        if (group.name !== data.name && groups.some(g => g.name.toLowerCase() === data.name.toLowerCase())) {
          alert('Группа с таким именем уже существует!');
          return;
        }
        const oldClients = group.clients.map(c => c.name).slice();
        group.name = data.name;
        group.trainer = data.trainer;
        group.clients = data.clients.map(name => ({ name, startDate: new Date().toISOString().split('T')[0] })) || [];
        oldClients.filter(c => !group.clients.some(gc => gc.name === c)).forEach(c => removeClientFromGroup(groupId, c));
        group.clients.filter(c => !oldClients.includes(c.name)).forEach(c => addClientToGroup(groupId, c.name, c.startDate));
        saveGroups();
        renderGroups();
      });
    } else if (e.target.closest('.group-clients-btn')) {
      const groupId = e.target.closest('.group-clients-btn').getAttribute('data-id');
      const group = getGroupById(groupId);
      const clients = getClients();
      showClientManagementModal(`Управление клиентами: ${group.name}`, group, clients, (selectedClients) => {
        const oldClients = group.clients.map(c => c.name).slice();
        group.clients = selectedClients.map(name => ({ name, startDate: new Date().toISOString().split('T')[0] }));
        oldClients.filter(c => !selectedClients.includes(c)).forEach(c => removeClientFromGroup(groupId, c));
        selectedClients.filter(c => !oldClients.includes(c)).forEach(c => addClientToGroup(groupId, c, new Date().toISOString().split('T')[0]));
        saveGroups();
        renderGroups();
      });
    }
  });

  function showClientManagementModal(title, group, clients, callback) {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
      <div class="modal-content">
        <h2>${escapeHtml(title)}</h2>
        <div class="client-management-container">
          <div class="history-panel">
            <h3>История переходов</h3>
            <div class="history-list" id="history-list"></div>
          </div>
          <div class="client-selector">
            <div class="client-search-container">
              <input type="text" id="group-client-search" placeholder="Поиск клиента (ФИО или телефон)">
            </div>
            <div class="client-table-container" style="max-height: 400px; overflow-y: auto;">
              <table class="client-table">
                <thead>
                  <tr>
                    <th></th>
                    <th data-sort="name">ФИО</th>
                    <th data-sort="phone">Телефон</th>
                    <th>Статус</th>
                  </tr>
                </thead>
                <tbody id="client-table-body"></tbody>
              </table>
            </div>
            <div class="client-selector-selected">
              <label>Выбранные:</label>
              <div class="selected-chips"></div>
            </div>
          </div>
        </div>
        <div class="modal-actions">
          <button class="btn-primary" id="group-save-btn">Сохранить</button>
          <button class="btn-secondary" id="group-cancel-btn">Отмена</button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);

    const searchInput = modal.querySelector('#group-client-search');
    const tableBody = modal.querySelector('#client-table-body');
    const selectedChips = modal.querySelector('.selected-chips');
    const tableHead = modal.querySelector('.client-table thead');
    const historyList = modal.querySelector('#history-list');
    let currentClients = group.clients.map(c => c.name).slice();
    let clientSortField = 'name';
    let clientSortOrder = 1;

    function getClientFullName(client) {
      return client.surname ? `${client.name} ${client.surname}` : client.name;
    }

    function renderHistory() {
      historyList.innerHTML = clients
        .filter(c => c.groupHistory.length > 0)
        .map(client => `
          <div class="history-entry">
            <h4>${getClientFullName(client)}</h4>
            <ul>
              ${client.groupHistory.map(entry => `<li>${formatDate(entry.date)}: ${entry.action === 'added' ? 'Добавлен' : 'Удален'} в ${entry.group}</li>`).join('')}
            </ul>
          </div>
        `).join('');
    }

    renderHistory();

    function renderClientTable() {
      const q = searchInput.value.trim().toLowerCase();
      const filteredClients = clients
        .filter(c => !q || getClientFullName(c).toLowerCase().includes(q) || (c.phone || '').toLowerCase().includes(q))
        .sort((a, b) => {
          if (clientSortField === 'name') return clientSortOrder * getClientFullName(a).localeCompare(getClientFullName(b));
          if (clientSortField === 'phone') return clientSortOrder * ((a.phone || '') > (b.phone || '') ? 1 : -1);
          return 0;
        });
      tableBody.innerHTML = filteredClients.map(client => {
        const fullName = getClientFullName(client);
        return `
          <tr class="client-row" data-name="${escapeHtml(client.name)}">
            <td><input type="checkbox" value="${escapeHtml(client.name)}" ${currentClients.includes(client.name) ? 'checked' : ''} ${client.blacklisted ? 'disabled' : ''}></td>
            <td>${escapeHtml(fullName)}</td>
            <td>${escapeHtml(client.phone || '')}</td>
            <td>${client.blacklisted ? 'В чёрном списке' : 'Активен'}</td>
          </tr>
        `;
      }).join('');
      refreshSelectedChips();
    }

    function refreshSelectedChips() {
      selectedChips.innerHTML = currentClients.map(c => {
        const client = clients.find(client => client.name === c);
        const fullName = client ? getClientFullName(client) : c;
        return `
          <span class="chip" data-name="${escapeHtml(c)}">${escapeHtml(fullName)} <button type="button" class="chip-remove" data-name="${escapeHtml(c)}">×</button></span>
        `;
      }).join('');
    }

    renderClientTable();

    searchInput.addEventListener('input', renderClientTable);

    tableBody.addEventListener('click', (ev) => {
      const row = ev.target.closest('.client-row');
      if (!row) return;
      const checkbox = row.querySelector('input[type="checkbox"]');
      if (!checkbox || checkbox.disabled) return;
      if (ev.target === checkbox || ev.target.closest('label') === checkbox.parentElement) return;
      checkbox.checked = !checkbox.checked;
      const changeEvent = new Event('change', { bubbles: true });
      checkbox.dispatchEvent(changeEvent);
    });

    tableBody.addEventListener('change', (ev) => {
      if (ev.target.matches('input[type="checkbox"]')) {
        const name = ev.target.value;
        if (ev.target.checked) {
          if (!currentClients.includes(name)) {
            // Show date selection modal for new addition
            showDateSelectionModal('Дата начала участия в группе', (startDate) => {
              if (startDate) {
                currentClients.push(name);
                refreshSelectedChips();
                showToast('Клиент добавлен в группу с ' + startDate, 'success');
              }
            });
          }
        } else {
          currentClients = currentClients.filter(c => c !== name);
          refreshSelectedChips();
        }
      }
    });

    selectedChips.addEventListener('click', (ev) => {
      if (ev.target.classList.contains('chip-remove')) {
        const name = ev.target.getAttribute('data-name');
        currentClients = currentClients.filter(c => c !== name);
        renderClientTable();
      }
    });

    tableHead.addEventListener('click', (e) => {
      const th = e.target.closest('th[data-sort]');
      if (th) {
        const field = th.getAttribute('data-sort');
        if (field === clientSortField) {
          clientSortOrder = -clientSortOrder;
        } else {
          clientSortField = field;
          clientSortOrder = 1;
        }
        renderClientTable();
      }
    });

    modal.querySelector('#group-save-btn').addEventListener('click', () => {
      callback(currentClients);
      modal.remove();
    });

    modal.querySelector('#group-cancel-btn').addEventListener('click', () => {
      modal.remove();
    });

    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.remove();
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') modal.remove();
    }, { once: true });

    function showDateSelectionModal(title, callback) {
      const dateModal = document.createElement('div');
      dateModal.className = 'date-modal';
      dateModal.innerHTML = `
        <div class="date-modal-content">
          <h2>${title}</h2>
          <input type="date" id="start-date-input" required>
          <div class="date-modal-actions">
            <button id="date-confirm-btn">Подтвердить</button>
            <button id="date-cancel-btn">Отмена</button>
          </div>
        </div>
      `;
      document.body.appendChild(dateModal);

      const input = dateModal.querySelector('#start-date-input');
      input.value = new Date().toISOString().split('T')[0];

      dateModal.querySelector('#date-confirm-btn').addEventListener('click', () => {
        if (input.value) {
          callback(input.value);
          dateModal.remove();
        }
      });

      dateModal.querySelector('#date-cancel-btn').addEventListener('click', () => {
        dateModal.remove();
        callback(null);
      });

      dateModal.addEventListener('click', (e) => {
        if (e.target === dateModal) {
          dateModal.remove();
          callback(null);
        }
      });
    }
  }

  function showConfirmModal(message, callback) {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
      <div class="modal-content confirm-modal">
        <h2>Подтверждение</h2>
        <p>${escapeHtml(message)}</p>
        <div class="modal-actions">
          <button class="btn-primary" id="confirm-btn">Да</button>
          <button class="btn-secondary" id="cancel-btn">Отмена</button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);

    modal.querySelector('#confirm-btn').addEventListener('click', () => {
      callback();
      modal.remove();
    });

    modal.querySelector('#cancel-btn').addEventListener('click', () => {
      modal.remove();
    });

    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.remove();
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') modal.remove();
    }, { once: true });
  }

  function formatDate(dateString) {
    if (!dateString) return 'Неизвестно';
    return new Date(dateString).toLocaleDateString('ru-RU');
  }

  function showToast(message, type) {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.classList.add('show'), 100);
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }
}
