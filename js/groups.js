import { getTrainers } from './employees.js';
import { getClients, addGroupToClient, removeGroupFromClient, getClientById } from './clients.js';
import { server } from './server.js'; 

async function fetchGroups() {
  try {
    console.log('Fetching groups from:', `${server}/groups`);
    const response = await fetch(`${server}/group`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!response.ok) {
      throw new Error(`Failed to fetch groups: ${response.status} ${response.statusText}`);
    }
    const groups = await response.json();
    console.log('Received groups:', groups);
    return Array.isArray(groups) ? groups : [];
  } catch (error) {
    console.error('Error fetching groups:', error.message, error.stack);
    return [];
  }
}

async function addGroup(data) {
  try {
    console.log('Adding group:', data);
    const response = await fetch(`${server}/groups`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: data.name }),
    });
    if (!response.ok) {
      throw new Error(`Failed to add group: ${response.status} ${response.statusText}`);
    }
    const newGroup = await response.json();
    // Если сервер поддерживает trainer и clients, раскомментируй:
    // newGroup.trainer = data.trainer;
    // newGroup.clients = data.clients.map(name => ({ name, startDate: new Date().toISOString().split('T')[0] }));
    return newGroup;
  } catch (error) {
    console.error('Error adding group:', error.message, error.stack);
    return null;
  }
}

async function updateGroup(groupId, data) {
  try {
    console.log('Updating group:', groupId, data);
    const response = await fetch(`${server}/groups/${groupId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: data.name }),
    });
    if (!response.ok) {
      throw new Error(`Failed to update group: ${response.status} ${response.statusText}`);
    }
    const updatedGroup = await response.json();
    // Если сервер поддерживает trainer и clients, раскомментируй:
    // updatedGroup.trainer = data.trainer;
    // updatedGroup.clients = data.clients.map(name => ({
    //   name,
    //   startDate: data.clients.find(c => c.name === name)?.startDate || new Date().toISOString().split('T')[0]
    // }));
    return updatedGroup;
  } catch (error) {
    console.error('Error updating group:', error.message, error.stack);
    return null;
  }
}

async function deleteGroup(groupId) {
  try {
    console.log('Deleting group:', groupId);
    const response = await fetch(`${server}/groups/${groupId}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!response.ok) {
      throw new Error(`Failed to delete group: ${response.status} ${response.statusText}`);
    }
    return true;
  } catch (error) {
    console.error('Error deleting group:', error.message, error.stack);
    return false;
  }
}

async function getGroupById(id) {
  try {
    console.log('Fetching group:', id);
    const response = await fetch(`${server}/groups/${id}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!response.ok) {
      throw new Error(`Failed to fetch group: ${response.status} ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching group by ID:', error.message, error.stack);
    return null;
  }
}

export async function getGroups() {
  const groups = await fetchGroups();
  return groups.map(group => group.name);
}

export async function getGroupByName(name) {
  const groups = await fetchGroups();
  return groups.find(group => group.name === name);
}

export async function addClientToGroup(clientId, groupName, startDate = new Date().toISOString()) {
  console.log(`addClientToGroup: clientId=${clientId}, groupName=${groupName}, startDate=${startDate}`);
  const group = await getGroupByName(groupName);
  if (!group) {
    console.log(`Группа ${groupName} не найдена`);
    return;
  }
  // Предполагаем, что сервер поддерживает clients в будущем
  // Здесь нужно будет отправить PATCH/POST запрос, например:
  /*
  try {
    const response = await fetch(`${server}/groups/${group.id}/clients`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clientId, startDate }),
    });
    if (!response.ok) {
      throw new Error(`Failed to add client: ${response.status} ${response.statusText}`);
    }
  } catch (error) {
    console.error('Error adding client to group:', error.message, error.stack);
    throw error;
  }
  */
  console.log(`Клиент ${clientId} добавлен в группу ${groupName} с датой ${startDate}`);
  addGroupToClient(clientId, groupName, 'added', startDate);
}

export async function removeClientFromGroup(clientId, groupName) {
  console.log(`removeClientFromGroup: clientId=${clientId}, groupName=${groupName}`);
  const group = await getGroupByName(groupName);
  if (!group) {
    console.log(`Группа ${groupName} не найдена`);
    return;
  }
  // Предполагаем, что сервер поддерживает clients в будущем
  // Здесь нужно будет отправить PATCH/DELETE запрос, например:
  /*
  try {
    const response = await fetch(`${server}/groups/${group.id}/clients/${clientId}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!response.ok) {
      throw new Error(`Failed to remove client: ${response.status} ${response.statusText}`);
    }
  } catch (error) {
    console.error('Error removing client from group:', error.message, error.stack);
    throw error;
  }
  */
  console.log(`Клиент ${clientId} удалён из группы ${groupName}`);
  removeGroupFromClient(clientId, groupName);
}

export async function addNewGroup(data) {
  const groups = await fetchGroups();
  if (groups.some(g => g.name.toLowerCase() === data.name.toLowerCase())) {
    return null;
  }
  const newGroup = await addGroup(data);
  if (newGroup && data.clients.length > 0) {
    for (const client of data.clients) {
      await addClientToGroup(client, newGroup.name, new Date().toISOString().split('T')[0]);
    }
  }
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
    tbody.innerHTML = groups
      .filter(group => !searchTerm || group.name.toLowerCase().includes(searchTerm))
      .sort((a, b) => {
        if (sortField === 'name') return sortOrder * a.name.localeCompare(b.name);
        if (sortField === 'trainer') return sortOrder * (a.trainer || '').localeCompare(b.trainer || '');
        if (sortField === 'clients') return sortOrder * ((a.clients?.length || 0) - (b.clients?.length || 0));
        return 0;
      })
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
      const trainers = getTrainers();
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
            await removeClientFromGroup(client.name, group.name);
          }
        }
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
      const trainers = getTrainers();
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
        const updatedGroup = await updateGroup(groupId, data);
        if (updatedGroup) {
          await renderGroups();
        } else {
          alert('Ошибка при обновлении группы!');
        }
      });
    } else if (e.target.closest('.group-clients-btn')) {
      const groupId = e.target.closest('.group-clients-btn').getAttribute('data-id');
      const group = await getGroupById(groupId);
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
          await removeClientFromGroup(client, group.name);
        }
        for (const client of selectedClients.filter(c => !oldClients.includes(c))) {
          await addClientToGroup(client, group.name, new Date().toISOString().split('T')[0]);
        }
        await renderGroups();
      });
    }
  });

  function showClientManagementModal(title, group, clients, callback) {
    console.log(`showClientManagementModal: group=${group.name}, clients=`, clients);
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
              try {
                await addGroupToClient(clientId, group.name, 'added', newDate);
                showToast(`Дата для клиента ${clientId} в группе ${group.name} обновлена`, 'success');
              } catch (error) {
                console.error('Ошибка при обновлении даты клиента:', error.message, error.stack);
                showToast(`Ошибка при обновлении даты: ${error.message}`, 'error');
              }
            }
          }
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
                    await addClientToGroup(clientId, group.name, startDate);
                    showToast(`Клиент ${clientId} добавлен в группу с ${formatDate(startDate)}`, 'success');
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
              await removeClientFromGroup(clientId, group.name);
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
                    await addClientToGroup(clientId, group.name, startDate);
                    showToast(`Клиент ${clientId} добавлен в группу с ${formatDate(startDate)}`, 'success');
                  } catch (error) {
                    console.error('Ошибка при добавлении клиента в группу:', error.message, error.stack);
                    showToast(`Ошибка при добавлении клиента: ${error.message}`, 'error');
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
            });
          }
        } else {
          currentClients = currentClients.filter(c => c !== clientId);
          if (group && group.id) {
            group.clients = group.clients.filter(c => c.name !== clientId);
            try {
              await removeClientFromGroup(clientId, group.name);
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
            await removeClientFromGroup(clientId, group.name);
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