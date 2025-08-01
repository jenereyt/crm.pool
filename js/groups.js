import { getTrainers } from './employees.js';

let groups = [
    { id: 'group1', name: 'Йога для начинающих', trainer: 'Анна Иванова', clients: [] },
    { id: 'group2', name: 'Пилатес продвинутый', trainer: 'Мария Петрова', clients: [] },
    { id: 'group3', name: 'Зумба вечеринка', trainer: 'Олег Смирнов', clients: [] },
];

export async function loadGroups() {
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
        groupList.innerHTML = groups.map(group => `
      <div class="group-container" id="${group.id}">
        <h3>${group.name}</h3>
        <p>Тренер: ${group.trainer}</p>
        <p>Клиенты: ${group.clients.length ? group.clients.join(', ') : 'Нет клиентов'}</p>
        <div class="group-actions">
          <button class="group-edit-btn" data-id="${group.id}">Редактировать</button>
          <button class="group-delete-btn" data-id="${group.id}">Удалить</button>
        </div>
      </div>
    `).join('');
    }

    renderGroups();

    const filterInput = document.getElementById('group-filter-input');
    const addGroupBtn = document.getElementById('group-add-btn');

    filterInput.addEventListener('input', filterGroups);

    addGroupBtn.addEventListener('click', async () => {
        const trainers = await getTrainers();
        if (trainers.length === 0) {
            alert('Нет доступных тренеров. Добавьте тренеров в разделе "Сотрудники".');
            return;
        }
        showGroupModal('Добавить группу', {}, trainers, (data) => {
            const newGroup = {
                id: `group${Date.now()}`,
                name: data.name,
                trainer: data.trainer,
                clients: []
            };
            groups.push(newGroup);
            renderGroups();
            filterGroups();
        });
    });

    groupList.addEventListener('click', async (e) => {
        if (e.target.classList.contains('group-delete-btn')) {
            const groupId = e.target.getAttribute('data-id');
            groups = groups.filter(group => group.id !== groupId);
            renderGroups();
            filterGroups();
        } else if (e.target.classList.contains('group-edit-btn')) {
            const groupId = e.target.getAttribute('data-id');
            const group = groups.find(group => group.id === groupId);
            const trainers = await getTrainers();
            if (trainers.length === 0) {
                alert('Нет доступных тренеров. Добавьте тренеров в разделе "Сотрудники".');
                return;
            }
            showGroupModal('Редактировать группу', group, trainers, (data) => {
                group.name = data.name;
                group.trainer = data.trainer;
                renderGroups();
                filterGroups();
            });
        }
    });

    async function showGroupModal(title, group, trainers, callback) {
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
        <div class="group-modal-actions">
          <button id="group-save-btn">Сохранить</button>
          <button id="group-cancel-btn">Отмена</button>
        </div>
      </div>
    `;
        mainContent.appendChild(modal);

        document.getElementById('group-save-btn').addEventListener('click', () => {
            const name = document.getElementById('group-name').value.trim();
            const trainer = document.getElementById('group-trainer').value;
            if (name && trainer) {
                callback({ name, trainer });
                modal.remove();
            } else {
                alert('Заполните все поля корректно!');
            }
        });

        document.getElementById('group-cancel-btn').addEventListener('click', () => {
            modal.remove();
        });
    }

    function filterGroups() {
        const searchTerm = filterInput.value.toLowerCase();
        const groupBlocks = groupList.querySelectorAll('.group-container');
        groupBlocks.forEach(block => {
            const name = block.querySelector('h3').textContent.toLowerCase();
            block.classList.toggle('group-hidden', searchTerm && !name.includes(searchTerm));
        });
    }
}

export function getGroups() {
    return groups ? groups.map(group => group.name) : [];
}