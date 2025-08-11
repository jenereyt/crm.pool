import { getTrainers } from './employees.js';
import { getClients } from './clients.js';

let groups = [
  { id: 'group1', name: 'Йога для начинающих', trainer: 'Анна Иванова', clients: ['Иван Сергеев'] },
  { id: 'group2', name: 'Пилатес продвинутый', trainer: 'Мария Петрова', clients: [] },
  { id: 'group3', name: 'Зумба вечеринка', trainer: 'Олег Смирнов', clients: ['Алексей Попов'] },
];

export function getGroups() {
  return groups.map(group => group.name);
}

export function loadGroups() {
  const mainContent = document.getElementById('main-content');
  mainContent.innerHTML = '';

  const header = document.createElement('header');
  header.className = 'header';
  header.innerHTML = `
    <h1>Группы</h1>
    <div class="user-actions">
      <span>Пользователь</span>
      <button>Выход</button>
    </div>
  `;
  mainContent.appendChild(header);

  const filterBar = document.createElement('div');
  filterBar.className = 'filter-bar';
  filterBar.innerHTML = `
    <input type="text" placeholder="Поиск групп" class="filter-input" id="group-filter-input">
    <button class="group-add-btn" id="group-add-btn">Добавить группу</button>
  `;
  mainContent.appendChild(filterBar);

  const groupList = document.createElement('div');
  groupList.className = 'group-list';
  mainContent.appendChild(groupList);

  function escapeHtml(s) {
    if (!s) return '';
    return String(s).replace(/[&<>"']/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
  }

  function renderGroups() {
    const searchTerm = document.getElementById('group-filter-input').value.toLowerCase();
    groupList.innerHTML = groups
      .filter(group => !searchTerm || group.name.toLowerCase().includes(searchTerm))
      .map(group => `
        <div class="group-container" id="${escapeHtml(group.id)}">
          <h3>${escapeHtml(group.name)}</h3>
          <p>Тренер: ${escapeHtml(group.trainer)}</p>
          <p>Клиенты: ${group.clients.length ? group.clients.map(c => escapeHtml(c)).join(', ') : 'Нет клиентов'}</p>
          <div class="group-actions">
            <button class="group-edit-btn" data-id="${escapeHtml(group.id)}">Редактировать</button>
            <button class="group-clients-btn" data-id="${escapeHtml(group.id)}">Управление клиентами</button>
            <button class="group-delete-btn" data-id="${escapeHtml(group.id)}">Удалить</button>
          </div>
        </div>
      `).join('');
  }

  renderGroups();

  const filterInput = document.getElementById('group-filter-input');
  const addGroupBtn = document.getElementById('group-add-btn');

  filterInput.addEventListener('input', renderGroups);

  addGroupBtn.addEventListener('click', () => {
    const trainers = getTrainers();
    if (trainers.length === 0) {
      alert('Нет доступных тренеров. Добавьте тренеров в разделе "Сотрудники".');
      return;
    }
    showGroupModal('Добавить группу', {}, trainers, [], (data) => {
      const newGroup = {
        id: `group${Date.now()}`,
        name: data.name,
        trainer: data.trainer,
        clients: data.clients || []
      };
      groups.push(newGroup);
      renderGroups();
    });
  });

  groupList.addEventListener('click', (e) => {
    if (e.target.classList.contains('group-delete-btn')) {
      const groupId = e.target.getAttribute('data-id');
      groups = groups.filter(group => group.id !== groupId);
      renderGroups();
    } else if (e.target.classList.contains('group-edit-btn')) {
      const groupId = e.target.getAttribute('data-id');
      const group = groups.find(group => group.id === groupId);
      const trainers = getTrainers();
      if (trainers.length === 0) {
        alert('Нет доступных тренеров. Добавьте тренеров в разделе "Сотрудники".');
        return;
      }
      showGroupModal('Редактировать группу', group, trainers, group.clients, (data) => {
        group.name = data.name;
        group.trainer = data.trainer;
        group.clients = data.clients || [];
        renderGroups();
      });
    } else if (e.target.classList.contains('group-clients-btn')) {
      const groupId = e.target.getAttribute('data-id');
      const group = groups.find(group => group.id === groupId);
      const clients = getClients();
      showClientManagementModal('Управление клиентами группы', group, clients, (selectedClients) => {
        group.clients = selectedClients;
        renderGroups();
      });
    }
  });

  function showGroupModal(title, group, trainers, selectedClients, callback) {
    const clients = getClients();
    const modal = document.createElement('div');
    modal.className = 'group-modal';
    modal.innerHTML = `
      <div class="group-modal-content">
        <h2>${escapeHtml(title)}</h2>
        <input type="text" id="group-name" placeholder="Название группы" value="${escapeHtml(group.name || '')}" required>
        <select id="group-trainer" required>
          <option value="">Выберите тренера</option>
          ${trainers.map(trainer => `<option value="${escapeHtml(trainer)}" ${group.trainer === trainer ? 'selected' : ''}>${escapeHtml(trainer)}</option>`).join('')}
        </select>
        <div class="client-selector">
          <label>Клиенты:</label>
          <div class="client-search-container">
            <input type="text" id="client-selector-search" placeholder="Поиск клиента (имя или телефон)">
            <div class="client-selector-list"></div>
          </div>
          <div class="client-selector-selected">
            <label>Выбранные:</label>
            <div class="selected-chips">
              ${selectedClients.map(c => `<span class="chip" data-name="${escapeHtml(c)}">${escapeHtml(c)} <button class="chip-remove" data-name="${escapeHtml(c)}">×</button></span>`).join('')}
            </div>
          </div>
        </div>
        <div class="group-modal-actions">
          <button id="group-save-btn">Сохранить</button>
          <button id="group-cancel-btn">Отмена</button>
        </div>
      </div>
    `;
    mainContent.appendChild(modal);

    const searchInput = modal.querySelector('#client-selector-search');
    const listContainer = modal.querySelector('.client-selector-list');
    const selectedChips = modal.querySelector('.selected-chips');

    let currentClients = selectedClients.slice();

    function renderClientResults() {
      const q = searchInput.value.trim().toLowerCase();
      if (!q) {
        listContainer.classList.remove('visible');
        listContainer.innerHTML = '';
        return;
      }
      const matches = clients
        .filter(c => c.name.toLowerCase().includes(q) || (c.phone || '').toLowerCase().includes(q))
        .slice(0, 10);
      listContainer.innerHTML = matches.map(client => `
        <label class="client-checkbox-item" data-name="${escapeHtml(client.name)}">
          <input type="checkbox" value="${escapeHtml(client.name)}" ${currentClients.includes(client.name) ? 'checked' : ''} ${client.blacklisted ? 'disabled' : ''}>
          <span>${escapeHtml(client.name)}${client.blacklisted ? ' (В чёрном списке)' : ''}</span>
          <div class="client-phone">${escapeHtml(client.phone || '')}</div>
        </label>
      `).join('');
      listContainer.classList.add('visible');
    }

    function refreshSelectedChips() {
      selectedChips.innerHTML = currentClients.map(c => `
        <span class="chip" data-name="${escapeHtml(c)}">${escapeHtml(c)} <button class="chip-remove" data-name="${escapeHtml(c)}">×</button></span>
      `).join('');
    }

    searchInput.addEventListener('input', renderClientResults);

    listContainer.addEventListener('change', (ev) => {
      if (ev.target.matches('input[type="checkbox"]')) {
        const name = ev.target.value;
        if (ev.target.checked) {
          if (!currentClients.includes(name)) currentClients.push(name);
        } else {
          currentClients = currentClients.filter(c => c !== name);
        }
        refreshSelectedChips();
        listContainer.classList.remove('visible');
        searchInput.value = '';
        renderClientResults();
      }
    });

    listContainer.addEventListener('click', (ev) => {
      const item = ev.target.closest('.client-checkbox-item');
      if (!item) return;
      const checkbox = item.querySelector('input[type="checkbox"]');
      if (checkbox && !checkbox.disabled) {
        checkbox.checked = !checkbox.checked;
        const ev = new Event('change', { bubbles: true });
        checkbox.dispatchEvent(ev);
      }
    });

    selectedChips.addEventListener('click', (ev) => {
      if (ev.target.classList.contains('chip-remove')) {
        const name = ev.target.getAttribute('data-name');
        currentClients = currentClients.filter(c => c !== name);
        refreshSelectedChips();
        renderClientResults();
      }
    });

    modal.querySelector('#group-save-btn').addEventListener('click', () => {
      const name = modal.querySelector('#group-name').value.trim();
      const trainer = modal.querySelector('#group-trainer').value;
      if (name && trainer) {
        callback({ name, trainer, clients: currentClients });
        modal.remove();
      } else {
        alert('Заполните все поля корректно!');
      }
    });

    modal.querySelector('#group-cancel-btn').addEventListener('click', () => {
      modal.remove();
    });
  }

  function showClientManagementModal(title, group, clients, callback) {
    const modal = document.createElement('div');
    modal.className = 'group-modal';
    modal.innerHTML = `
      <div class="group-modal-content">
        <h2>${escapeHtml(title)}</h2>
        <p>Группа: ${escapeHtml(group.name)}</p>
        <div class="client-selector">
          <div class="client-search-container">
            <input type="text" id="group-client-search" placeholder="Поиск клиента (имя или телефон)">
            <div class="client-selector-list"></div>
          </div>
          <div class="client-selector-selected">
            <label>Выбранные:</label>
            <div class="selected-chips">
              ${group.clients.map(c => `<span class="chip" data-name="${escapeHtml(c)}">${escapeHtml(c)} <button class="chip-remove" data-name="${escapeHtml(c)}">×</button></span>`).join('')}
            </div>
          </div>
        </div>
        <div class="group-modal-actions">
          <button id="group-save-btn">Сохранить</button>
          <button id="group-cancel-btn">Отмена</button>
        </div>
      </div>
    `;
    mainContent.appendChild(modal);

    const searchInput = modal.querySelector('#group-client-search');
    const listContainer = modal.querySelector('.client-selector-list');
    const selectedChips = modal.querySelector('.selected-chips');

    let currentClients = group.clients.slice();

    function renderClientResults() {
      const q = searchInput.value.trim().toLowerCase();
      if (!q) {
        listContainer.classList.remove('visible');
        listContainer.innerHTML = '';
        return;
      }
      const matches = clients
        .filter(c => c.name.toLowerCase().includes(q) || (c.phone || '').toLowerCase().includes(q))
        .slice(0, 10);
      listContainer.innerHTML = matches.map(client => `
        <label class="client-checkbox-item" data-name="${escapeHtml(client.name)}">
          <input type="checkbox" value="${escapeHtml(client.name)}" ${currentClients.includes(client.name) ? 'checked' : ''} ${client.blacklisted ? 'disabled' : ''}>
          <span>${escapeHtml(client.name)}${client.blacklisted ? ' (В чёрном списке)' : ''}</span>
          <div class="client-phone">${escapeHtml(client.phone || '')}</div>
        </label>
      `).join('');
      listContainer.classList.add('visible');
    }

    function refreshSelectedChips() {
      selectedChips.innerHTML = currentClients.map(c => `
        <span class="chip" data-name="${escapeHtml(c)}">${escapeHtml(c)} <button class="chip-remove" data-name="${escapeHtml(c)}">×</button></span>
      `).join('');
    }

    searchInput.addEventListener('input', renderClientResults);

    listContainer.addEventListener('change', (ev) => {
      if (ev.target.matches('input[type="checkbox"]')) {
        const name = ev.target.value;
        if (ev.target.checked) {
          if (!currentClients.includes(name)) currentClients.push(name);
        } else {
          currentClients = currentClients.filter(c => c !== name);
        }
        refreshSelectedChips();
        listContainer.classList.remove('visible');
        searchInput.value = '';
        renderClientResults();
      }
    });

    listContainer.addEventListener('click', (ev) => {
      const item = ev.target.closest('.client-checkbox-item');
      if (!item) return;
      const checkbox = item.querySelector('input[type="checkbox"]');
      if (checkbox && !checkbox.disabled) {
        checkbox.checked = !checkbox.checked;
        const ev = new Event('change', { bubbles: true });
        checkbox.dispatchEvent(ev);
      }
    });

    selectedChips.addEventListener('click', (ev) => {
      if (ev.target.classList.contains('chip-remove')) {
        const name = ev.target.getAttribute('data-name');
        currentClients = currentClients.filter(c => c !== name);
        refreshSelectedChips();
        renderClientResults();
      }
    });

    modal.querySelector('#group-save-btn').addEventListener('click', () => {
      callback(currentClients);
      modal.remove();
    });

    modal.querySelector('#group-cancel-btn').addEventListener('click', () => {
      modal.remove();
    });
  }
}