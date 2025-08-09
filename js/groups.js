// group.js
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

  function renderGroups() {
    const searchTerm = document.getElementById('group-filter-input').value.toLowerCase();
    groupList.innerHTML = groups
      .filter(group => !searchTerm || group.name.toLowerCase().includes(searchTerm))
      .map(group => `
        <div class="group-container" id="${group.id}">
          <h3>${group.name}</h3>
          <p>Тренер: ${group.trainer}</p>
          <p>Клиенты: ${group.clients.length ? group.clients.join(', ') : 'Нет клиентов'}</p>
          <div class="group-actions">
            <button class="group-edit-btn" data-id="${group.id}">Редактировать</button>
            <button class="group-clients-btn" data-id="${group.id}">Управление клиентами</button>
            <button class="group-delete-btn" data-id="${group.id}">Удалить</button>
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

  /* ---- модалки с улучшенным выбором клиентов (поиск + чекбоксы + выбранные чипы) ---- */

  function showGroupModal(title, group, trainers, selectedClients, callback) {
    const clients = getClients();
    const modal = document.createElement('div');
    modal.className = 'group-modal';
    modal.innerHTML = `
      <div class="group-modal-content">
        <h2>${title}</h2>
        <input type="text" id="group-name" placeholder="Название группы" value="${group.name || ''}" required>
        <select id="group-trainer" required>
          <option value="">Выберите тренера</option>
          ${trainers.map(trainer => `<option value="${trainer}" ${group.trainer === trainer ? 'selected' : ''}>${trainer}</option>`).join('')}
        </select>

        <div class="client-selector">
          <label>Клиенты</label>
          <input type="text" id="client-selector-search" placeholder="Поиск клиента...">
          <div class="client-selector-list">
            ${clients.map(client => `
              <label class="client-checkbox-item">
                <input type="checkbox" value="${client.name}" ${selectedClients.includes(client.name) ? 'checked' : ''}>
                ${client.name}${client.blacklisted ? ' (В чёрном списке)' : ''}
              </label>
            `).join('')}
          </div>
          <div class="client-selector-selected">
            <label>Выбранные:</label>
            <div class="selected-chips">
              ${selectedClients.map(c => `<span class="chip" data-name="${c}">${c} <button class="chip-remove" data-name="${c}">×</button></span>`).join('')}
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

    function refreshSelectedChips() {
      const checked = Array.from(listContainer.querySelectorAll('input[type="checkbox"]:checked')).map(i => i.value);
      selectedChips.innerHTML = checked.map(c => `<span class="chip" data-name="${c}">${c} <button class="chip-remove" data-name="${c}">×</button></span>`).join('');
    }

    refreshSelectedChips();

    // Поиск в списке клиентов
    searchInput.addEventListener('input', () => {
      const q = searchInput.value.toLowerCase();
      Array.from(listContainer.querySelectorAll('label.client-checkbox-item')).forEach(label => {
        label.style.display = label.textContent.toLowerCase().includes(q) ? '' : 'none';
      });
    });

    // Клики по чекбоксам
    listContainer.addEventListener('change', (ev) => {
      if (ev.target && ev.target.matches('input[type="checkbox"]')) {
        refreshSelectedChips();
      }
    });

    // Удаление через чип
    selectedChips.addEventListener('click', (ev) => {
      if (ev.target.classList.contains('chip-remove')) {
        const name = ev.target.getAttribute('data-name');
        const checkbox = listContainer.querySelector(`input[type="checkbox"][value="${name}"]`);
        if (checkbox) {
          checkbox.checked = false;
          refreshSelectedChips();
        }
      }
    });

    document.getElementById('group-save-btn').addEventListener('click', () => {
      const name = document.getElementById('group-name').value.trim();
      const trainer = document.getElementById('group-trainer').value;
      const clientsSelected = Array.from(listContainer.querySelectorAll('input[type="checkbox"]:checked')).map(i => i.value);
      if (name && trainer) {
        callback({ name, trainer, clients: clientsSelected });
        modal.remove();
      } else {
        alert('Заполните все поля корректно!');
      }
    });

    document.getElementById('group-cancel-btn').addEventListener('click', () => {
      modal.remove();
    });
  }

  function showClientManagementModal(title, group, clients, callback) {
    const modal = document.createElement('div');
    modal.className = 'group-modal';
    modal.innerHTML = `
      <div class="group-modal-content">
        <h2>${title}</h2>
        <p>Группа: ${group.name}</p>
        <input type="text" id="group-client-search" placeholder="Поиск клиента...">
        <div class="client-selector-list">
          ${clients.map(client => `<label class="client-checkbox-item"><input type="checkbox" value="${client.name}" ${group.clients.includes(client.name) ? 'checked' : ''}>${client.name}${client.blacklisted ? ' (В чёрном списке)' : ''}</label>`).join('')}
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

    searchInput.addEventListener('input', () => {
      const q = searchInput.value.toLowerCase();
      Array.from(listContainer.querySelectorAll('label.client-checkbox-item')).forEach(label => {
        label.style.display = label.textContent.toLowerCase().includes(q) ? '' : 'none';
      });
    });

    document.getElementById('group-save-btn').addEventListener('click', () => {
      const selectedClients = Array.from(listContainer.querySelectorAll('input[type="checkbox"]:checked')).map(i => i.value);
      callback(selectedClients);
      modal.remove();
    });

    document.getElementById('group-cancel-btn').addEventListener('click', () => {
      modal.remove();
    });
  }
}
