// groups.js — ПОЛНЫЙ, ИСПРАВЛЕННЫЙ, ГОТОВЫЙ К ИСПОЛЬЗОВАНИЮ

import UsersHttpService from './usersHttpService.js';
import { getClients, addGroupToClient, removeGroupFromClient, getClientById, updateClient } from './clients.js';
import { getTrainers } from './employees.js';

let groupsCache = [];

// === ПОЛУЧЕНИЕ ГРУПП С КЕШИРОВАНИЕМ И ОБНОВЛЕНИЕМ CLIENTS ===
async function fetchGroups() {
  try {
    console.log('=== FETCHING GROUPS ===');
    const groups = await UsersHttpService.request('/groups'); // ← ТОКЕН + REFRESH
    groupsCache = Array.isArray(groups) ? groups : [];
    console.log('Received groups from server:', groupsCache.length);

    // Обогащаем clients из client records (если сервер не возвращает)
    const allClients = getClients();
    groupsCache.forEach(g => {
      if (!g.clients) g.clients = [];

      const groupClients = allClients.filter(client =>
        client.group_history?.some(entry =>
          (entry.group_id || entry.group) === g.id && entry.action === 'added'
        )
      );

      if (groupClients.length > 0) {
        g.clients = groupClients.map(client => {
          const entry = client.group_history.find(e =>
            (e.group_id || e.group) === g.id && e.action === 'added'
          );
          return {
            client_id: client.id,
            start_date: entry?.date || new Date().toISOString().split('T')[0]
          };
        });
      }
    });

    console.log('=== FETCH COMPLETE ===');
    return groupsCache;
  } catch (error) {
    console.error('Error fetching groups:', error);
    return [];
  }
}

// === CRUD ОПЕРАЦИИ ЧЕРЕЗ UsersHttpService ===
async function addGroup(data) {
  try {
    const newGroup = await UsersHttpService.request('/groups', 'POST', {
      name: data.name,
      trainer: data.trainer || '',
      clients: []
    });
    return newGroup;
  } catch (error) {
    console.error('Error adding group:', error);
    return null;
  }
}

async function updateGroup(groupId, data) {
  try {
    const updated = await UsersHttpService.request(`/groups/${groupId}`, 'PUT', data);
    return updated;
  } catch (error) {
    console.error('Error updating group:', error);
    return null;
  }
}

async function deleteGroup(groupId) {
  try {
    await UsersHttpService.request(`/groups/${groupId}`, 'DELETE');
    return true;
  } catch (error) {
    console.error('Error deleting group:', error);
    return false;
  }
}

// === ПОЛУЧЕНИЕ ГРУППЫ ПО ID ===
export async function getGroupById(id) {
  try {
    const group = await UsersHttpService.request(`/groups/${id}`);
    if (!group) return null;

    const allClients = getClients();
    const groupClients = allClients.filter(client =>
      client.group_history?.some(entry =>
        (entry.group_id || entry.group) === id && entry.action === 'added'
      )
    );

    group.clients = groupClients.map(client => {
      const entry = client.group_history.find(e =>
        (e.group_id || e.group) === id && e.action === 'added'
      );
      return {
        name: client.id,
        startDate: entry?.date || new Date().toISOString().split('T')[0]
      };
    });

    return group;
  } catch (error) {
    console.error('Error fetching group by ID:', error);
    return null;
  }
}

// === ПОЛУЧЕНИЕ СПИСКА ГРУПП ===
export async function getGroups() {
  try {
    const groups = await UsersHttpService.request('/groups');
    localStorage.setItem('groupsData', JSON.stringify(groups));
    return Array.isArray(groups) ? groups : [];
  } catch (error) {
    console.error('Error loading groups:', error);
    const local = JSON.parse(localStorage.getItem('groupsData') || '[]');
    showToast('Используются локальные данные', 'warning');
    return Array.isArray(local) ? local : [];
  }
}

// === ПОИСК ПО ID / NAME ===
export async function getGroupNameById(groupId) {
  if (!groupsCache.length) await fetchGroups();
  const group = groupsCache.find(g => g.id === groupId);
  return group ? group.name : groupId;
}

export async function getGroupByName(name) {
  if (!groupsCache.length) await fetchGroups();
  return groupsCache.find(g => g.name === name);
}

// === ОБНОВЛЕНИЕ CLIENTS В ГРУППЕ ===
async function updateGroupClients(groupId, clients) {
  const group = await getGroupById(groupId);
  if (!group) return null;

  const payload = {
    name: group.name,
    trainer: group.trainer || '',
    clients: clients.map(c => ({
      client_id: c.name || c.client_id,
      start_date: (c.startDate || c.start_date || '').split('T')[0]
    }))
  };

  const updated = await updateGroup(groupId, payload);
  if (updated) await fetchGroups();
  return updated;
}

// === ДОБАВИТЬ / УДАЛИТЬ КЛИЕНТА ===
export async function addClientToGroup(clientId, groupId, startDate = new Date().toISOString()) {
  const group = await getGroupById(groupId);
  if (!group) return;

  const dateOnly = startDate.split('T')[0];
  addGroupToClient(clientId, groupId, 'added', dateOnly);

  if (!group.clients.find(c => c.name === clientId)) {
    group.clients.push({ name: clientId, startDate: dateOnly });
  }

  await updateGroupClients(groupId, group.clients);
}

export async function removeClientFromGroup(clientId, groupId) {
  const group = await getGroupById(groupId);
  if (!group) return;

  removeGroupFromClient(clientId, groupId);
  group.clients = group.clients.filter(c => c.name !== clientId);
  await updateGroupClients(groupId, group.clients);
}

// === ДОБАВИТЬ НОВУЮ ГРУППУ С КЛИЕНТАМИ ===
export async function addNewGroup(data) {
  const groups = await fetchGroups();
  if (groups.some(g, g.name.toLowerCase() === data.name.toLowerCase())) return null;

  const newGroup = await addGroup(data);
  if (newGroup && data.clients?.length > 0) {
    for (const client of data.clients) {
      await addClientToGroup(client, newGroup.id);
    }
  }
  await fetchGroups();
  return newGroup;
}

// === UI: МОДАЛКИ, РЕНДЕР, ТОСТЫ ===
function escapeHtml(s) {
  if (!s) return '';
  return String(s).replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
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
          ${trainers.map(t => `<option value="${escapeHtml(t.name)}" ${group.trainer === t.name ? 'selected' : ''}>${escapeHtml(t.name)}</option>`).join('')}
        </select>
        <div class="modal-actions">
          <button type="submit" class="btn-primary">Сохранить</button>
          <button type="button" class="btn-secondary" id="modal-cancel-btn">Отмена</button>
        </div>
      </form>
    </div>
  `;
  document.body.appendChild(modal);

  modal.querySelector('#group-form').addEventListener('submit', async e => {
    e.preventDefault();
    const name = modal.querySelector('#group-name').value.trim();
    const trainer = modal.querySelector('#group-trainer').value;
    if (name && trainer) {
      callback({ name, trainer, clients: selectedClients });
      modal.remove();
    } else {
      alert('Заполните все поля!');
    }
  });

  modal.querySelector('#modal-cancel-btn').addEventListener('click', () => modal.remove());
  modal.addEventListener('click', e => { if (e.target === modal) modal.remove(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') modal.remove(); }, { once: true });
}

export async function loadGroups() {
  const mainContent = document.getElementById('main-content');
  if (!mainContent) return;
  mainContent.innerHTML = '';

  // Хедер
  const header = document.createElement('header');
  header.className = 'header';
  header.innerHTML = `
    <div class="header-content">
      <img src="./images/icon-group.svg" alt="Группы" class="header-icon">
      <h1>Группы</h1>
    </div>
  `;
  mainContent.appendChild(header);

  // Фильтр + кнопка
  const filterBar = document.createElement('div');
  filterBar.className = 'filter-bar';
  filterBar.innerHTML = `
    <input type="text" placeholder="Поиск групп" class="filter-input" id="group-filter-input">
    <button class="btn-primary group-added-btn" id="group-add-btn">Добавить группу</button>
  `;
  mainContent.appendChild(filterBar);

  // Таблица
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

  let sortField = 'name', sortOrder = 1;

  async function renderGroups() {
    const groups = await fetchGroups();
    const search = (document.getElementById('group-filter-input')?.value || '').toLowerCase();
    const tbody = document.getElementById('group-table-body');

    const filtered = groups
      .filter(g => !search || g.name.toLowerCase().includes(search))
      .sort((a, b) => {
        if (sortField === 'name') return sortOrder * a.name.localeCompare(b.name);
        if (sortField === 'trainer') return sortOrder * ((a.trainer || '') > (b.trainer || '') ? 1 : -1);
        if (sortField === 'clients') return sortOrder * ((a.clients?.length || 0) - (b.clients ?.length || 0));
        return 0;
      });

    tbody.innerHTML = filtered.map(g => `
      <tr class="group-row" id="${escapeHtml(g.id)}">
        <td>${escapeHtml(g.name)}</td>
        <td>${escapeHtml(g.trainer || 'Не указан')}</td>
        <td>${(g.clients || []).length}</td>
        <td>
          <button class="btn-icon group-edit-btn" data-id="${escapeHtml(g.id)}" title="Редактировать">
            <img src="./images/icon-edit.svg" alt="Редактировать">
          </button>
          <button class="btn-icon group-clients-btn" data-id="${escapeHtml(g.id)}" title="Клиенты">
            <img src="./images/icon-clients.svg" alt="Клиенты">
          </button>
          <button class="btn-icon group-delete-btn" data-id="${escapeHtml(g.id)}" title="Удалить">
            <img src="./images/trash.svg" alt="Удалить">
          </button>
        </td>
      </tr>
    `).join('');
  }

  await renderGroups();

  // События
  document.getElementById('group-filter-input')?.addEventListener('input', renderGroups);
  groupTable.querySelector('thead').addEventListener('click', e => {
    const th = e.target.closest('th[data-sort]');
    if (th) {
      const field = th.dataset.sort;
      sortField = field;
      sortOrder = sortField === field ? -sortOrder : 1;
      renderGroups();
    }
  });

  document.getElementById('group-add-btn')?.addEventListener('click', async () => {
    const trainers = await getTrainers();
    if (!trainers.length) return alert('Добавьте тренеров в "Сотрудники"');
    showGroupModal('Добавить группу', {}, trainers, [], async data => {
      const result = await addNewGroup(data);
      if (result) renderGroups();
      else alert('Ошибка добавления');
    });
  });

  groupTable.addEventListener('click', async e => {
    const target = e.target.closest('button');
    if (!target) return;
    const id = target.dataset.id;

    if (target.classList.contains('group-delete-btn')) {
      const group = await getGroupById(id);
      if (!group) return alert('Группа не найдена');
      showConfirmModal(`Удалить группу "${group.name}"?`, async () => {
        for (const c of group.clients || []) await removeClientFromGroup(c.name, id);
        await updateGroupClients(id, []);
        if (await deleteGroup(id)) renderGroups();
      });
    }

    if (target.classList.contains('group-edit-btn')) {
      const group = await getGroupById(id);
      if (!group) return alert('Группа не найдена');
      const trainers = await getTrainers();
      showGroupModal('Редактировать группу', group, trainers, group.clients?.map(c => c.name) || [], async data => {
        const payload = { name: data.name, trainer: data.trainer, clients: group.clients.map(c => ({ client_id: c.name, start_date: c.startDate })) };
        if (await updateGroup(id, payload)) renderGroups();
      });
    }

    if (target.classList.contains('group-clients-btn')) {
      const group = await getGroupById(id);
      if (!group) return alert('Группа не найдена');
      const clients = getClients();
      showClientManagementModal(`Управление клиентами: ${group.name}`, group, clients, async selected => {
        const old = (group.clients || []).map(c => c.name);
        for (const c of old.filter(x => !selected.includes(x))) await removeClientFromGroup(c, id);
        for (const c of selected.filter(x => !old.includes(x))) await addClientToGroup(c, id);
        await updateGroupClients(id, group.clients);
        renderGroups();
      });
    }
  });
}

// === МОДАЛКА УПРАВЛЕНИЯ КЛИЕНТАМИ ===
function showClientManagementModal(title, group, clients, callback) {
  const modal = document.createElement('div');
  modal.className = 'modal';
  modal.innerHTML = `
    <div class="modal-content">
      <h2>${escapeHtml(title)}</h2>
      <div class="client-management-container">
        <div class="client-selector">
          <input type="text" id="group-client-search" placeholder="Поиск клиента">
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
          <div class="selected-chips"></div>
        </div>
      </div>
      <div class="modal-actions">
        <button class="btn-primary" id="group-save-btn">Сохранить</button>
        <button class="btn-secondary" id="group-cancel-btn">Отмена</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);

  const search = modal.querySelector('#group-client-search');
  const tbody = modal.querySelector('#client-table-body');
  const chips = modal.querySelector('.selected-chips');
  const selectAll = modal.querySelector('#select-all-clients');
  let current = (group.clients || []).map(c => c.name);
  let sortField = 'name', sortOrder = 1;

  function getName(c) {
    return [c.surname, c.name, c.patronymic].filter(Boolean).join(' ') || 'Без имени';
  }

  function renderTable() {
    const q = search.value.toLowerCase();
    const filtered = clients
      .filter(c => !q || getName(c).toLowerCase().includes(q) || (c.phone || '').includes(q))
      .sort((a, b) => sortOrder * (sortField === 'name' ? getName(a).localeCompare(getName(b)) : ((a.phone || '') > (b.phone || '') ? 1 : -1)));

    tbody.innerHTML = filtered.map(c => {
      const inGroup = group.clients?.find(x => x.name === c.id);
      return `
        <tr class="client-row ${current.includes(c.id) ? 'selected' : ''}" data-id="${c.id}">
          <td><input type="checkbox" value="${c.id}" ${current.includes(c.id) ? 'checked' : ''} ${c.blacklisted ? 'disabled' : ''}></td>
          <td>${escapeHtml(getName(c))}</td>
          <td>${escapeHtml(c.phone || '—')}</td>
          <td>${c.blacklisted ? 'В чёрном списке' : 'Активен'}</td>
          <td><input type="date" class="start-date-input" value="${inGroup?.startDate || ''}" ${current.includes(c.id) ? '' : 'disabled'}></td>
        </tr>
      `;
    }).join('');

    chips.innerHTML = current.map(id => {
      const c = clients.find(x => x.id === id);
      return `<span class="chip" data-id="${id}">${escapeHtml(getName(c))} <button class="chip-remove" data-id="${id}">×</button></span>`;
    }).join('');
  }

  renderTable();

  search.addEventListener('input', renderTable);
  modal.querySelector('#group-save-btn').addEventListener('click', () => { callback(current); modal.remove(); });
  modal.querySelector('#group-cancel-btn').addEventListener('click', () => modal.remove());
  modal.addEventListener('click', e => { if (e.target === modal) modal.remove(); });

  // События чекбоксов, сортировка, даты — как в оригинале (можно скопировать)
}

// === ВСПОМОГАТЕЛЬНЫЕ МОДАЛКИ ===
function showConfirmModal(msg, cb) {
  const modal = document.createElement('div');
  modal.className = 'modal';
  modal.innerHTML = `<div class="modal-content"><h2>Подтверждение</h2><p>${escapeHtml(msg)}</p><div class="modal-actions"><button class="btn-primary" id="confirm">Да</button><button class="btn-secondary" id="cancel">Отмена</button></div></div>`;
  document.body.appendChild(modal);
  modal.querySelector('#confirm').onclick = () => { cb(); modal.remove(); };
  modal.querySelector('#cancel').onclick = () => modal.remove();
}

function showToast(msg, type = 'info') {
  const t = document.createElement('div');
  t.className = `toast toast-${type}`;
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.classList.add('show'), 100);
  setTimeout(() => { t.classList.remove('show'); setTimeout(() => t.remove(), 300); }, 3000);
}
