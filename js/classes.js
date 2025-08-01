import { getTrainers } from './employees.js';
import { getGroups } from './groups.js';
import { getClients } from './clients.js';
import { scheduleData } from './schedule.js';
import { getRooms } from './rooms.js'; // Fixed import

export async function loadClasses() {
    const mainContent = document.getElementById('main-content');
    mainContent.innerHTML = '';

    const header = document.createElement('header');
    header.className = 'header';
    header.innerHTML = `
    <h1>Занятия</h1>
    <div class="user-actions">
      <span>Пользователь</span>
      <button>Выход</button>
    </div>
  `;
    mainContent.appendChild(header);

    const filterBar = document.createElement('div');
    filterBar.className = 'filter-bar';
    filterBar.innerHTML = `
    <input type="date" id="class-date-filter" class="filter-input">
    <select id="class-trainer-filter" class="filter-select">
      <option value="">Все тренеры</option>
    </select>
    <select id="class-group-filter" class="filter-select">
      <option value="">Все группы</option>
    </select>
    <button class="class-add-btn" id="class-add-btn">Добавить занятие</button>
  `;
    mainContent.appendChild(filterBar);

    const classList = document.createElement('div');
    classList.className = 'class-list';
    mainContent.appendChild(classList);

    const trainers = await getTrainers();
    const groups = await getGroups();
    const rooms = await getRooms();
    const clients = await getClients();
    const trainerSelect = document.getElementById('class-trainer-filter');
    const groupSelect = document.getElementById('class-group-filter');
    trainerSelect.innerHTML += trainers.map(trainer => `<option value="${trainer}">${trainer}</option>`).join('');
    groupSelect.innerHTML += groups.map(group => `<option value="${group}">${group}</option>`).join('');

    function renderClasses() {
        const dateFilter = document.getElementById('class-date-filter').value;
        const trainerFilter = document.getElementById('class-trainer-filter').value;
        const groupFilter = document.getElementById('class-group-filter').value;

        classList.innerHTML = scheduleData
            .filter(cls => (!dateFilter || cls.date === dateFilter) &&
                (!trainerFilter || cls.trainer === trainerFilter) &&
                (!groupFilter || cls.group === groupFilter))
            .map(cls => `
        <div class="class-container" data-id="${cls.id}">
          <h3>${cls.name}</h3>
          <p>Зал: ${rooms.find(r => r.id === cls.roomId)?.name || 'Не указан'}</p>
          <p>Тип: ${cls.type === 'group' ? 'Групповой' : cls.type === 'individual' ? 'Индивидуальный' : 'Специальный'}</p>
          <p>Тренер: ${cls.trainer}</p>
          <p>Группа: ${cls.group || 'Нет группы'}</p>
          <p>Дни недели: ${cls.daysOfWeek?.length ? cls.daysOfWeek.join(', ') : 'Разовое'}</p>
          <p>Дата: ${cls.date}</p>
          <p>Время: ${cls.startTime}–${cls.endTime}</p>
          <div class="class-attendance">
            <h4>Посещаемость:</h4>
            ${cls.clients.length ? cls.clients.map(client => {
                const clientData = clients.find(c => c.name === client);
                return `
                <div class="attendance-item">
                  <span>${client}${clientData?.blacklisted ? ' (В чёрном списке)' : ''}</span>
                  <select class="attendance-select" data-client="${client}" data-class-id="${cls.id}" ${clientData?.blacklisted ? 'disabled' : ''}>
                    <option value="Пришёл" ${cls.attendance[client] === 'Пришёл' ? 'selected' : ''}>Пришёл</option>
                    <option value="Не пришёл" ${cls.attendance[client] === 'Не пришёл' ? 'selected' : ''}>Не пришёл</option>
                    <option value="Опоздал" ${cls.attendance[client] === 'Опоздал' ? 'selected' : ''}>Опоздал</option>
                    <option value="Отменено" ${cls.attendance[client] === 'Отменено' ? 'selected' : ''}>Отменено</option>
                  </select>
                </div>
              `;
            }).join('') : '<p>Нет клиентов</p>'}
          </div>
          <div class="class-actions">
            <button class="class-edit-btn" data-id="${cls.id}">Редактировать</button>
            <button class="class-delete-btn" data-id="${cls.id}">Удалить</button>
          </div>
        </div>
      `).join('');
    }

    renderClasses();

    const dateFilter = document.getElementById('class-date-filter');
    const trainerFilter = document.getElementById('class-trainer-filter');
    const groupFilter = document.getElementById('class-group-filter');
    const addClassBtn = document.getElementById('class-add-btn');

    dateFilter.addEventListener('change', renderClasses);
    trainerFilter.addEventListener('change', renderClasses);
    groupFilter.addEventListener('change', renderClasses);

    addClassBtn.addEventListener('click', async () => {
        const trainers = await getTrainers();
        const groups = await getGroups();
        const roomsList = await getRooms();
        const clientsList = await getClients();
        if (trainers.length === 0) {
            alert('Нет доступных тренеров. Добавьте тренеров в разделе "Сотрудники".');
            return;
        }
        showClassForm('Добавить занятие', {}, trainers, groups, roomsList, clientsList, (data) => {
            const classesToAdd = [];
            if (data.daysOfWeek.length > 0) {
                const startDate = new Date(data.date);
                const endDate = new Date(startDate);
                endDate.setMonth(startDate.getMonth() + 1);
                for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
                    const dayName = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'][d.getDay()];
                    if (data.daysOfWeek.includes(dayName)) {
                        classesToAdd.push({
                            id: `class${Date.now() + classesToAdd.length}`,
                            name: data.name,
                            roomId: data.roomId,
                            type: data.type,
                            trainer: data.trainer,
                            group: data.group,
                            clients: data.clients,
                            date: formatDate(d),
                            startTime: data.startTime,
                            endTime: data.endTime,
                            attendance: data.clients.reduce((acc, client) => ({ ...acc, [client]: 'Пришёл' }), {}),
                            daysOfWeek: data.daysOfWeek
                        });
                    }
                }
            } else {
                classesToAdd.push({
                    id: `class${Date.now()}`,
                    name: data.name,
                    roomId: data.roomId,
                    type: data.type,
                    trainer: data.trainer,
                    group: data.group,
                    clients: data.clients,
                    date: data.date,
                    startTime: data.startTime,
                    endTime: data.endTime,
                    attendance: data.clients.reduce((acc, client) => ({ ...acc, [client]: 'Пришёл' }), {}),
                    daysOfWeek: data.daysOfWeek
                });
            }

            classesToAdd.forEach(cls => scheduleData.push(cls));
            renderClasses();
        });
    });

    classList.addEventListener('click', async (e) => {
        if (e.target.classList.contains('class-delete-btn')) {
            const classId = e.target.getAttribute('data-id');
            if (confirm('Удалить занятие?')) {
                scheduleData = scheduleData.filter(cls => cls.id !== classId);
                renderClasses();
            }
        } else if (e.target.classList.contains('class-edit-btn')) {
            const classId = e.target.getAttribute('data-id');
            const cls = scheduleData.find(cls => cls.id === classId);
            const trainers = await getTrainers();
            const groups = await getGroups();
            const roomsList = await getRooms();
            const clientsList = await getClients();
            if (trainers.length === 0) {
                alert('Нет доступных тренеров. Добавьте тренеров в разделе "Сотрудники".');
                return;
            }
            showClassForm('Редактировать занятие', cls, trainers, groups, roomsList, clientsList, (data) => {
                cls.name = data.name;
                cls.roomId = data.roomId;
                cls.type = data.type;
                cls.trainer = data.trainer;
                cls.group = data.group;
                cls.clients = data.clients;
                cls.date = data.date;
                cls.startTime = data.startTime;
                cls.endTime = data.endTime;
                cls.daysOfWeek = data.daysOfWeek;
                cls.attendance = data.clients.reduce((acc, client) => ({
                    ...acc,
                    [client]: cls.attendance[client] || 'Пришёл'
                }), {});
                renderClasses();
            });
        }
    });

    classList.addEventListener('change', async (e) => {
        if (e.target.classList.contains('attendance-select')) {
            const classId = e.target.getAttribute('data-class-id');
            const client = e.target.getAttribute('data-client');
            const status = e.target.value;
            const cls = scheduleData.find(cls => cls.id === classId);
            if (cls) {
                cls.attendance[client] = status;
                if (status === 'Пришёл') {
                    const clientData = clients.find(c => c.name === client);
                    if (clientData) {
                        const sub = subscriptions.find(s => s.clientId === clientData.id && s.remainingClasses !== Infinity);
                        if (sub && sub.remainingClasses > 0) {
                            sub.remainingClasses -= 1;
                        }
                    }
                }
                renderClasses();
            }
        }
    });

    async function showClassForm(title, cls, trainers, groups, rooms, clients, callback) {
        const modal = document.createElement('div');
        modal.className = 'class-modal';
        modal.innerHTML = `
      <div class="class-modal-content">
        <h2>${title}</h2>
        <input type="text" id="class-name" placeholder="Название занятия" value="${cls.name || ''}" required>
        <select id="class-room" required>
          <option value="">Выберите зал</option>
          ${rooms.map(room => `<option value="${room.id}" ${cls.roomId === room.id ? 'selected' : ''}>${room.name}</option>`).join('')}
        </select>
        <select id="class-type" required>
          <option value="">Выберите тип</option>
          <option value="group" ${cls.type === 'group' ? 'selected' : ''}>Групповой</option>
          <option value="individual" ${cls.type === 'individual' ? 'selected' : ''}>Индивидуальный</option>
          <option value="special" ${cls.type === 'special' ? 'selected' : ''}>Специальный</option>
        </select>
        <select id="class-trainer" required>
          <option value="">Выберите тренера</option>
          ${trainers.map(trainer => `<option value="${trainer}" ${cls.trainer === trainer ? 'selected' : ''}>${trainer}</option>`).join('')}
        </select>
        <select id="class-group">
          <option value="">Выберите группу (опционально)</option>
          ${groups.map(group => `<option value="${group}" ${cls.group === group ? 'selected' : ''}>${group}</option>`).join('')}
        </select>
        <select id="class-clients" multiple>
          ${clients.map(client => `<option value="${client.name}" ${cls.clients?.includes(client.name) ? 'selected' : ''}>${client.name}${client.blacklisted ? ' (В чёрном списке)' : ''}</option>`).join('')}
        </select>
        <div class="days-of-week">
          <label>Дни недели:</label>
          <label><input type="checkbox" name="days" value="Пн" ${cls.daysOfWeek?.includes('Пн') ? 'checked' : ''}> Пн</label>
          <label><input type="checkbox" name="days" value="Вт" ${cls.daysOfWeek?.includes('Вт') ? 'checked' : ''}> Вт</label>
          <label><input type="checkbox" name="days" value="Ср" ${cls.daysOfWeek?.includes('Ср') ? 'checked' : ''}> Ср</label>
          <label><input type="checkbox" name="days" value="Чт" ${cls.daysOfWeek?.includes('Чт') ? 'checked' : ''}> Чт</label>
          <label><input type="checkbox" name="days" value="Пт" ${cls.daysOfWeek?.includes('Пт') ? 'checked' : ''}> Пт</label>
          <label><input type="checkbox" name="days" value="Сб" ${cls.daysOfWeek?.includes('Сб') ? 'checked' : ''}> Сб</label>
          <label><input type="checkbox" name="days" value="Вс" ${cls.daysOfWeek?.includes('Вс') ? 'checked' : ''}> Вс</label>
        </div>
        <input type="date" id="class-date" value="${cls.date || ''}" required>
        <input type="time" id="class-start" value="${cls.startTime || ''}" required>
        <input type="time" id="class-end" value="${cls.endTime || ''}" required>
        <div class="class-modal-actions">
          <button id="class-save-btn">Сохранить</button>
          <button id="class-cancel-btn">Отмена</button>
        </div>
      </div>
    `;
        mainContent.appendChild(modal);

        document.getElementById('class-save-btn').addEventListener('click', () => {
            const name = document.getElementById('class-name').value.trim();
            const roomId = document.getElementById('class-room').value;
            const type = document.getElementById('class-type').value;
            const trainer = document.getElementById('class-trainer').value;
            const group = document.getElementById('class-group').value;
            const clientOptions = document.getElementById('class-clients').selectedOptions;
            const clients = Array.from(clientOptions).map(opt => opt.value);
            const daysOfWeek = Array.from(document.querySelectorAll('input[name="days"]:checked')).map(input => input.value);
            const date = document.getElementById('class-date').value;
            const startTime = document.getElementById('class-start').value;
            const endTime = document.getElementById('class-end').value;

            if (name && roomId && type && trainer && date && startTime && endTime) {
                const start = new Date(`1970-01-01T${startTime}:00`);
                const end = new Date(`1970-01-01T${endTime}:00`);
                if (end > start) {
                    callback({ name, roomId, type, trainer, group, clients, date, startTime, endTime, daysOfWeek });
                    modal.remove();
                } else {
                    alert('Время окончания должно быть позже времени начала!');
                }
            } else {
                alert('Заполните все поля корректно!');
            }
        });

        document.getElementById('class-cancel-btn').addEventListener('click', () => {
            modal.remove();
        });
    }

    function formatDate(date) {
        return date.toISOString().split('T')[0];
    }
}

export function getClasses() {
    return scheduleData ? scheduleData.map(cls => cls.name) : [];
}