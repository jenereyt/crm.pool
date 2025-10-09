import { getTrainers } from './employees.js';
import { getClients, addGroupToClient, removeGroupFromClient, getClientById, updateClient } from './clients.js';
import { server } from './server.js';
let groupsCache = [];

async function fetchGroups() {
  try {
    console.log('=== FETCHING GROUPS ===');
    const response = await fetch(`${server}/groups`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!response.ok) {
      const errorData = await response.text();
      console.error('Error response:', response.status, errorData);
      throw new Error(`Failed to fetch groups: ${response.status} ${response.statusText}`);
    }
    groupsCache = await response.json();
    console.log('Received groups from server:', groupsCache.length, 'groups');

    // WORKAROUND: Since server doesn't return clients field, populate from client records
    const allClients = getClients();
    console.log('Total clients for enrichment:', allClients.length);

    groupsCache.forEach(g => {
      if (!g.clients) {
        g.clients = [];
      }

      // Find clients that belong to this group
      const groupClients = allClients.filter(client => {
        const hasGroup = client.group_history && client.group_history.some(entry => {
          const entryGroupId = entry.group_id || entry.group;
          return entryGroupId === g.id && entry.action === 'added';
        });
        return hasGroup;
      });

      console.log(`Group "${g.name}": found ${groupClients.length} clients`);

      if (groupClients.length > 0) {
        g.clients = groupClients.map(client => {
          const historyEntry = client.group_history.find(e => {
            const entryGroupId = e.group_id || e.group;
            return entryGroupId === g.id && e.action === 'added';
          });
          return {
            client_id: client.id,
            start_date: historyEntry ? historyEntry.date : new Date().toISOString().split('T')[0]
          };
        });
      }
    });

    console.log('=== FETCH COMPLETE ===');
    return Array.isArray(groupsCache) ? groupsCache : [];
  } catch (error) {
    console.error('Error fetching groups:', error.message);
    return [];
  }
}

async function addGroup(data) {
  try {
    const response = await fetch(`${server}/groups`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: data.name,
        trainer: data.trainer || '',
        clients: []
      }),
    });
    if (!response.ok) {
      throw new Error(`Failed to add group: ${response.status}`);
    }
    const newGroup = await response.json();
    return newGroup;
  } catch (error) {
    console.error('Error adding group:', error.message);
    return null;
  }
}

async function updateGroup(groupId, data) {
  try {
    const response = await fetch(`${server}/groups/${groupId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      throw new Error(`Failed to update group: ${response.status}`);
    }
    const updatedGroup = await response.json();
    return updatedGroup;
  } catch (error) {
    console.error('Error updating group:', error.message);
    return null;
  }
}

async function deleteGroup(groupId) {
  try {
    const response = await fetch(`${server}/groups/${groupId}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!response.ok) {
      throw new Error(`Failed to delete group: ${response.status}`);
    }
    return true;
  } catch (error) {
    console.error('Error deleting group:', error.message);
    return false;
  }
}

export async function getGroupById(id) {
  try {
    const response = await fetch(`${server}/groups/${id}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!response.ok) {
      throw new Error(`Failed to fetch group: ${response.status}`);
    }
    const group = await response.json();

    if (!group.clients) {
      group.clients = [];
    }

    // Normalize clients
    group.clients = (group.clients || []).map(c => {
      const clientId = c.client_id || c.name;
      const startDate = c.start_date || c.startDate;
      return {
        name: clientId,
        startDate: startDate
      };
    });

    // Get clients from client records
    const allClients = getClients();
    const groupClients = allClients.filter(client => {
      return client.group_history && client.group_history.some(entry => {
        const entryGroupId = entry.group_id || entry.group;
        return entryGroupId === id && entry.action === 'added';
      });
    });

    if (groupClients.length > 0) {
      group.clients = groupClients.map(client => {
        const historyEntry = client.group_history.find(e => {
          const entryGroupId = e.group_id || e.group;
          return entryGroupId === id && e.action === 'added';
        });
        return {
          name: client.id,
          startDate: historyEntry ? historyEntry.date : new Date().toISOString().split('T')[0]
        };
      });
    }

    return group;
  } catch (error) {
    console.error('Error fetching group by ID:', error.message);
    return null;
  }
}

// Функция для получения списка групп
export async function getGroups() {
  try {
    // Выполняем запрос к серверу для получения групп
    const response = await fetch(`${server}/groups`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });

    // Проверяем, успешен ли запрос
    if (!response.ok) {
      throw new Error(`Не удалось загрузить группы: ${response.status} ${response.statusText}`);
    }

    // Получаем данные в формате JSON
    const data = await response.json();

    // Проверяем, является ли data массивом, если нет — возвращаем пустой массив
    const groups = Array.isArray(data) ? data : [];

    // Сохраняем группы в localStorage для использования в оффлайн-режиме
    localStorage.setItem('groupsData', JSON.stringify(groups));
    console.log('Группы успешно загружены с сервера:', groups);

    return groups;
  } catch (error) {
    // Логируем ошибку
    console.error('Ошибка при загрузке групп:', error);

    // Пробуем загрузить группы из localStorage
    const localGroups = JSON.parse(localStorage.getItem('groupsData')) || [];

    // Убедимся, что возвращается массив
    if (!Array.isArray(localGroups)) {
      console.warn('Данные групп в localStorage не являются массивом:', localGroups);
      return [];
    }

    // Показываем уведомление об ошибке
    showToast('Ошибка загрузки групп с сервера. Используются локальные данные.', 'warning');
    return localGroups;
  }
}

export async function getGroupNameById(groupId) {
  if (!groupsCache.length) {
    await fetchGroups();
  }
  const group = groupsCache.find(g => g.id === groupId);
  return group ? group.name : groupId;
}

export async function getGroupByName(name) {
  if (!groupsCache.length) {
    await fetchGroups();
  }
  return groupsCache.find(group => group.name === name);
}

async function updateGroupClients(groupId, clients) {
  const group = await getGroupById(groupId);
  if (!group) return null;

  group.clients = clients;
  const payload = {
    name: group.name,
    trainer: group.trainer || '',
    clients: group.clients.map(c => {
      const clientId = c.name || c.client_id;
      const startDate = c.startDate || c.start_date;
      const dateOnly = startDate ? startDate.split('T')[0] : new Date().toISOString().split('T')[0];
      return {
        client_id: clientId,
        start_date: dateOnly
      };
    })
  };

  const updated = await updateGroup(groupId, payload);
  if (updated) {
    await fetchGroups();
  }
  return updated;
}

export async function addClientToGroup(clientId, groupId, startDate = new Date().toISOString()) {
  const group = await getGroupById(groupId);
  if (!group) {
    console.log(`Группа с ID ${groupId} не найдена`);
    return;
  }

  const dateOnly = startDate.split('T')[0];

  addGroupToClient(clientId, groupId, 'added', dateOnly);

  group.clients = group.clients || [];
  if (!group.clients.find(c => (c.name || c.client_id) === clientId)) {
    group.clients.push({ name: clientId, startDate: dateOnly });
  }

  await updateGroupClients(groupId, group.clients);
}

export async function removeClientFromGroup(clientId, groupId) {
  const group = await getGroupById(groupId);
  if (!group) {
    console.log(`Группа с ID ${groupId} не найдена`);
    return;
  }

  // Remove from client's group_history with 'removed' action
  removeGroupFromClient(clientId, groupId);

  // Update group on server
  group.clients = group.clients || [];
  group.clients = group.clients.filter(c => (c.name || c.client_id) !== clientId);

  await updateGroupClients(groupId, group.clients);
}

export async function addNewGroup(data) {
  const groups = await fetchGroups();
  if (groups.some(g => g.name.toLowerCase() === data.name.toLowerCase())) {
    return null;
  }
  const newGroup = await addGroup(data);
  if (newGroup && data.clients.length > 0) {
    for (const client of data.clients) {
      await addClientToGroup(client, newGroup.id, new Date().toISOString().split('T')[0]);
    }
  }
  await fetchGroups();
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
          ${trainers.map(trainer => `<option value="${escapeHtml(trainer.name)}" ${group.trainer === trainer.name ? 'selected' : ''}>${escapeHtml(trainer.name)}</option>`).join('')}
        </select>
        <div class="modal-actions">
          <button type="submit" class="btn-primary">Сохранить</button>
          <button type="button" class="btn-secondary" id="modal-cancel-btn">Отмена</button>
        </div>
      </form>
    </div>
  `;
  document.body.appendChild(modal);

  modal.querySelector('#group-form').addEventListener('submit', async (e) => {
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

export async function loadGroups() {
  const mainContent = document.getElementById('main-content');
  if (!mainContent) {
    console.error('main-content element not found');
    return;
  }
  mainContent.innerHTML = '';

  const header = document.createElement('div');
  header.className = 'header';
  header.innerHTML = `
    <h1><img class="width" src="./images/icon-group.svg" alt="Группы"> Группы</h1>
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

  async function renderGroups() {
    const groups = await fetchGroups();
    const searchTerm = document.getElementById('group-filter-input')?.value.toLowerCase() || '';
    const tbody = document.getElementById('group-table-body');
    if (!tbody) {
      console.error('group-table-body not found');
      return;
    }
    // Normalize clients for display
    const normalizedGroups = groups.map(group => {
      const normalized = {
        ...group,
        clients: (group.clients || []).map(c => ({
          name: c.client_id,
          startDate: c.start_date
        }))
      };
      console.log(`Group ${group.name} has ${normalized.clients.length} normalized clients`);
      return normalized;
    });
    const filteredGroups = normalizedGroups
      .filter(group => !searchTerm || group.name.toLowerCase().includes(searchTerm))
      .sort((a, b) => {
        if (sortField === 'name') return sortOrder * a.name.localeCompare(b.name);
        if (sortField === 'trainer') return sortOrder * (a.trainer || '').localeCompare(b.trainer || '');
        if (sortField === 'clients') return sortOrder * ((a.clients?.length || 0) - (b.clients?.length || 0));
        return 0;
      });
    console.log('Rendering groups, filtered count:', filteredGroups.length);
    tbody.innerHTML = filteredGroups
      .map(group => `
        <tr class="group-row" id="${escapeHtml(group.id)}">
          <td>${escapeHtml(group.name)}</td>
          <td>${escapeHtml(group.trainer || 'Не указан')}</td>
          <td>${(group.clients || []).length}</td>
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

  await renderGroups();

  const filterInput = document.getElementById('group-filter-input');
  const addGroupBtn = document.getElementById('group-add-btn');
  const tableHead = groupTable.querySelector('thead');

  if (filterInput) {
    filterInput.addEventListener('input', renderGroups);
  } else {
    console.error('group-filter-input not found');
  }

  if (tableHead) {
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
  }

  if (addGroupBtn) {
    addGroupBtn.addEventListener('click', async () => {
      const trainers = await getTrainers();
      if (trainers.length === 0) {
        alert('Нет доступных тренеров. Добавьте тренеров в разделе "Сотрудники".');
        return;
      }
      showGroupModal('Добавить группу', {}, trainers, [], async (data) => {
        const newGroup = await addNewGroup(data);
        if (newGroup) {
          await renderGroups();
        } else {
          alert('Ошибка при добавлении группы!');
        }
      });
    });
  } else {
    console.error('group-add-btn not found');
  }

  groupTable.addEventListener('click', async (e) => {
    if (e.target.closest('.group-delete-btn')) {
      const groupId = e.target.closest('.group-delete-btn').getAttribute('data-id');
      const group = await getGroupById(groupId);
      if (!group) {
        console.error('Группа не найдена для удаления:', groupId);
        alert('Ошибка: Группа не найдена.');
        return;
      }
      showConfirmModal(`Удалить группу "${group.name}"?`, async () => {
        if (group.clients) {
          for (const client of group.clients) {
            await removeClientFromGroup(client.name, groupId);
          }
        }
        // Clear clients before delete
        await updateGroupClients(groupId, []);
        if (await deleteGroup(groupId)) {
          await renderGroups();
        } else {
          alert('Ошибка при удалении группы!');
        }
      });
    } else if (e.target.closest('.group-edit-btn')) {
      const groupId = e.target.closest('.group-edit-btn').getAttribute('data-id');
      const group = await getGroupById(groupId);
      if (!group) {
        console.error('Группа не найдена для редактирования:', groupId);
        alert('Ошибка: Группа не найдена.');
        return;
      }
      const trainers = await getTrainers();
      if (trainers.length === 0) {
        alert('Нет доступных тренеров. Добавьте тренеров в разделе "Сотрудники".');
        return;
      }
      showGroupModal('Редактировать группу', group, trainers, group.clients?.map(c => c.name) || [], async (data) => {
        const groups = await fetchGroups();
        if (group.name !== data.name && groups.some(g => g.name.toLowerCase() === data.name.toLowerCase())) {
          alert('Группа с таким именем уже существует!');
          return;
        }
        const payload = {
          name: data.name,
          trainer: data.trainer,
          clients: group.clients.map(c => ({
            client_id: c.name,
            start_date: c.startDate
          }))
        };
        const updatedGroup = await updateGroup(groupId, payload);
        if (updatedGroup) {
          await renderGroups();
        } else {
          alert('Ошибка при обновлении группы!');
        }
      });
    } else if (e.target.closest('.group-clients-btn')) {
      const groupId = e.target.closest('.group-clients-btn').getAttribute('data-id');
      const group = await getGroupById(groupId);
      console.log('Opening modal for group:', group);
      if (!group) {
        console.error('Группа не найдена для управления клиентами:', groupId);
        alert('Ошибка: Группа не найдена.');
        return;
      }
      const clients = getClients();
      showClientManagementModal(`Управление клиентами: ${group.name}`, group, clients, async (selectedClients) => {
        console.log('Сохранение клиентов:', selectedClients);
        const oldClients = (group.clients || []).map(c => c.name);
        group.clients = selectedClients.map(name => ({
          name,
          startDate: group.clients?.find(c => c.name === name)?.startDate || new Date().toISOString().split('T')[0]
        }));
        for (const client of oldClients.filter(c => !selectedClients.includes(c))) {
          await removeClientFromGroup(client, groupId);
        }
        for (const client of selectedClients.filter(c => !oldClients.includes(c))) {
          await addClientToGroup(client, groupId, new Date().toISOString().split('T')[0]);
        }
        // Persist changes to group on server
        await updateGroupClients(groupId, group.clients);
        await renderGroups();
      });
    }
  });

  function showClientManagementModal(title, group, clients, callback) {
    console.log(`showClientManagementModal: group=${group.name}, group.clients=${JSON.stringify(group.clients)}, clients length=${clients.length}`);
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
      <div class="modal-content">
        <h2>${escapeHtml(title)}</h2>
        <div class="client-management-container">
          <div class="client-selector">
            <div class="client-search-container">
              <input type="text" id="group-client-search" placeholder="Поиск клиента (ФИО или телефон)">
            </div>
            <div class="client-table-container">
              <table class="client-table">
                <thead>
                  <tr>
                    <th><input type="checkbox" id="select-all-clients"></th>
                    <th data-sort="name">ФИО</th>
                    <th data-sort="phone">Телефон</th>
                    <th>Статус</th>
                    <th>Дата начала</th>
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
    const selectAllCheckbox = modal.querySelector('#select-all-clients');
    let currentClients = (group.clients || []).map(c => c.name).slice();
    console.log('Initial currentClients:', currentClients);
    let clientSortField = 'name';
    let clientSortOrder = 1;

    function getClientFullName(client) {
      const parts = [
        client.surname?.trim() || '',
        client.name?.trim() || '',
        client.patronymic?.trim() || ''
      ].filter(part => part);
      return parts.join(' ') || 'Без имени';
    }

    function formatDate(dateString) {
      if (!dateString) return '—';
      const date = new Date(dateString);
      return date.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' });
    }

    async function refreshGroupDisplay() {
      await renderGroups();
    }

    function renderClientTable() {
      console.log('Обновление таблицы, currentClients:', currentClients);
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
        const isSelected = currentClients.includes(client.id);
        console.log(`Client ${client.id} isSelected: ${isSelected}`);
        const clientInGroup = (group.clients || []).find(c => c.name === client.id);
        const startDate = clientInGroup ? clientInGroup.startDate : '';
        return `
          <tr class="client-row ${isSelected ? 'selected' : ''}" data-id="${escapeHtml(client.id)}">
            <td><input type="checkbox" value="${escapeHtml(client.id)}" ${isSelected ? 'checked' : ''} ${client.blacklisted ? 'disabled' : ''}></td>
            <td>${escapeHtml(fullName)}</td>
            <td>${escapeHtml(client.phone || '—')}</td>
            <td>${client.blacklisted ? 'В чёрном списке' : 'Активен'}</td>
            <td><input type="date" class="start-date-input" value="${isSelected ? startDate.split('T')[0] : ''}" ${!isSelected ? 'disabled' : ''}></td>
          </tr>
        `;
      }).join('');
      refreshSelectedChips();
      updateSelectAllCheckbox();

      tableBody.querySelectorAll('.start-date-input').forEach(input => {
        input.addEventListener('change', async (e) => {
          const clientId = e.target.closest('.client-row').dataset.id;
          const newDate = e.target.value;
          if (newDate && group && group.id) {
            const clientInGroup = (group.clients || []).find(c => c.name === clientId);
            if (clientInGroup) {
              clientInGroup.startDate = newDate;
              // Update client history
              const clientObj = getClientById(clientId);
              if (clientObj) {
                let entry = clientObj.group_history.find(e => e.group === group.id && e.action === 'added');
                if (entry) {
                  entry.date = newDate;
                } else {
                  clientObj.group_history.push({ date: newDate, action: 'added', group: group.id });
                }
                await updateClient(clientId, clientObj);
              }
              // Update group on server
              await updateGroupClients(group.id, group.clients);
              showToast(`Дата для клиента обновлена`, 'success');
              await refreshGroupDisplay();
            }
          }
          renderClientTable();
        });
      });
    }

    function refreshSelectedChips() {
      selectedChips.innerHTML = currentClients.map(c => {
        const client = clients.find(client => client.id === c);
        const fullName = client ? getClientFullName(client) : c;
        return `
          <span class="chip" data-id="${escapeHtml(c)}">${escapeHtml(fullName)} <button type="button" class="chip-remove" data-id="${escapeHtml(c)}">×</button></span>
        `;
      }).join('');
    }

    function updateSelectAllCheckbox() {
      const checkboxes = tableBody.querySelectorAll('input[type="checkbox"]:not(:disabled)');
      const allChecked = Array.from(checkboxes).every(cb => cb.checked);
      const someChecked = Array.from(checkboxes).some(cb => cb.checked);
      selectAllCheckbox.checked = allChecked;
      selectAllCheckbox.indeterminate = someChecked && !allChecked;
    }

    renderClientTable();

    searchInput.addEventListener('input', renderClientTable);

    selectAllCheckbox.addEventListener('change', async (e) => {
      const checked = e.target.checked;
      const checkboxes = tableBody.querySelectorAll('input[type="checkbox"]:not(:disabled)');
      for (const cb of checkboxes) {
        const clientId = cb.value;
        if (checked && !currentClients.includes(clientId)) {
          await new Promise((resolve) => {
            showDateSelectionModal('Дата начала участия в группе', async (startDate) => {
              if (startDate) {
                currentClients.push(clientId);
                if (group && group.id) {
                  group.clients = group.clients || [];
                  group.clients.push({ name: clientId, startDate });
                  try {
                    await addClientToGroup(clientId, group.id, startDate);
                    showToast(`Клиент ${clientId} добавлен в группу с ${formatDate(startDate)}`, 'success');
                    await refreshGroupDisplay();
                  } catch (error) {
                    console.error('Ошибка при добавлении клиента:', error.message, error.stack);
                    showToast(`Ошибка при добавлении клиента: ${error.message}`, 'error');
                    currentClients = currentClients.filter(c => c !== clientId);
                    group.clients = group.clients.filter(c => c.name !== clientId);
                    cb.checked = false;
                    renderClientTable();
                    resolve();
                    return;
                  }
                } else {
                  console.error('Группа не определена или отсутствует ID:', group);
                  cb.checked = false;
                }
                renderClientTable();
              } else {
                cb.checked = false;
                renderClientTable();
              }
              resolve();
            });
          });
        } else if (!checked) {
          currentClients = currentClients.filter(c => c !== clientId);
          if (group && group.id) {
            group.clients = group.clients.filter(c => c.name !== clientId);
            try {
              await removeClientFromGroup(clientId, group.id);
              await refreshGroupDisplay();
            } catch (error) {
              console.error('Ошибка при удалении клиента:', error.message, error.stack);
              showToast(`Ошибка при удалении клиента: ${error.message}`, 'error');
              group.clients.push({ name: clientId, startDate: new Date().toISOString().split('T')[0] });
              currentClients.push(clientId);
              renderClientTable();
              return;
            }
          }
          renderClientTable();
        }
      }
      updateSelectAllCheckbox();
    });

    tableBody.addEventListener('click', (ev) => {
      const row = ev.target.closest('.client-row');
      if (!row) return;
      const checkbox = row.querySelector('input[type="checkbox"]');
      if (!checkbox || checkbox.disabled) return;
      if (ev.target === checkbox) return;
      checkbox.checked = !checkbox.checked;
      const changeEvent = new Event('change', { bubbles: true });
      checkbox.dispatchEvent(changeEvent);
    });

    tableBody.addEventListener('change', async (ev) => {
      if (ev.target.matches('input[type="checkbox"]')) {
        const clientId = ev.target.value;
        if (ev.target.checked) {
          if (!currentClients.includes(clientId)) {
            showDateSelectionModal('Дата начала участия в группе', async (startDate) => {
              if (startDate) {
                console.log('Клиент добавлен:', clientId, 'Дата:', startDate);
                currentClients.push(clientId);
                if (group && group.id) {
                  group.clients = group.clients || [];
                  group.clients.push({ name: clientId, startDate });
                  try {
                    await addClientToGroup(clientId, group.id, startDate);
                    showToast(`Клиент ${clientId} добавлен в группу с ${formatDate(startDate)}`, 'success');
                    await refreshGroupDisplay();
                  } catch (error) {
                    console.error('Ошибка при добавлении клиента в группу:', error.message, error.stack);
                    showToast(`Ошибка при добавления клиента: ${error.message}`, 'error');
                    currentClients = currentClients.filter(c => c !== clientId);
                    group.clients = group.clients.filter(c => c.name !== clientId);
                    ev.target.checked = false;
                    renderClientTable();
                    return;
                  }
                  renderClientTable();
                } else {
                  console.error('Группа не определена или отсутствует ID:', group);
                  showToast('Ошибка: Группа не найдена', 'error');
                  ev.target.checked = false;
                  renderClientTable();
                }
              } else {
                console.log('Дата не выбрана для клиента:', clientId);
                ev.target.checked = false;
                renderClientTable();
              }
              updateSelectAllCheckbox();
            });
          } else {
            renderClientTable();
            updateSelectAllCheckbox();
          }
        } else {
          currentClients = currentClients.filter(c => c !== clientId);
          if (group && group.id) {
            group.clients = group.clients.filter(c => c.name !== clientId);
            try {
              await removeClientFromGroup(clientId, group.id);
              await refreshGroupDisplay();
            } catch (error) {
              console.error('Ошибка при удалении клиента из группы:', error.message, error.stack);
              showToast(`Ошибка при удалении клиента: ${error.message}`, 'error');
              group.clients.push({ name: clientId, startDate: new Date().toISOString().split('T')[0] });
              currentClients.push(clientId);
              renderClientTable();
              return;
            }
          }
          renderClientTable();
          updateSelectAllCheckbox();
        }
      }
    });

    selectedChips.addEventListener('click', async (ev) => {
      if (ev.target.classList.contains('chip-remove')) {
        const clientId = ev.target.getAttribute('data-id');
        currentClients = currentClients.filter(c => c !== clientId);
        if (group && group.id) {
          group.clients = group.clients.filter(c => c.name !== clientId);
          try {
            await removeClientFromGroup(clientId, group.id);
            await refreshGroupDisplay();
          } catch (error) {
            console.error('Ошибка при удалении клиента из группы:', error.message, error.stack);
            showToast(`Ошибка при удалении клиента: ${error.message}`, 'error');
            group.clients.push({ name: clientId, startDate: new Date().toISOString().split('T')[0] });
            currentClients.push(clientId);
            renderClientTable();
            return;
          }
        }
        renderClientTable();
        updateSelectAllCheckbox();
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

    modal.querySelector('#group-save-btn').addEventListener('click', async (e) => {
      e.stopPropagation();
      console.log('Кнопка Сохранить нажата, currentClients:', currentClients);
      callback(currentClients);
      modal.remove();
    });

    modal.querySelector('#group-cancel-btn').addEventListener('click', () => {
      modal.remove();
    });

    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        console.log('Закрытие модального окна по клику на фон');
        modal.remove();
      }
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        console.log('Закрытие модального окна по Escape');
        modal.remove();
      }
    }, { once: true });

    function showDateSelectionModal(title, callback) {
      const dateModal = document.createElement('div');
      dateModal.className = 'date-modal';
      dateModal.innerHTML = `
        <div class="date-modal-content">
          <h2>${escapeHtml(title)}</h2>
          <input type="date" id="start-date-input" required>
          <div class="date-modal-actions">
            <button class="btn-primary" id="date-confirm-btn">Подтвердить</button>
            <button class="btn-secondary" id="date-cancel-btn">Отмена</button>
          </div>
        </div>
      `;
      document.body.appendChild(dateModal);

      const input = dateModal.querySelector('#start-date-input');
      input.value = new Date().toISOString().split('T')[0];

      dateModal.querySelector('#date-confirm-btn').addEventListener('click', () => {
        if (input.value) {
          console.log('Дата подтверждена:', input.value);
          callback(input.value);
          dateModal.remove();
        } else {
          showToast('Выберите дату!', 'error');
        }
      });

      dateModal.querySelector('#date-cancel-btn').addEventListener('click', () => {
        console.log('Отмена выбора даты');
        dateModal.remove();
        callback(null);
      });

      dateModal.addEventListener('click', (e) => {
        if (e.target === dateModal) {
          console.log('Закрытие модального окна даты по клику на фон');
          dateModal.remove();
          callback(null);
        }
      });

      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
          console.log('Закрытие модального окна даты по Escape');
          dateModal.remove();
          callback(null);
        }
      }, { once: true });
    }
  }

  function showConfirmModal(message, callback) {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.innerHTML = `
      <div class="modal-content group-confirm-modal">
        <h2>Подтверждение удаления</h2>
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
