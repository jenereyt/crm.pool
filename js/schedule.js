import { getTrainers } from './employees.js';
import { getGroups } from './groups.js';
import { getRooms } from './rooms.js';

export let scheduleData = [
  { id: 'class1', name: 'Йога', roomId: 'room1', type: 'group', trainer: 'Анна Иванова', group: 'Йога для начинающих', clients: ['Иван Сергеев'], date: '2025-08-01', startTime: '09:00', endTime: '11:00', attendance: { 'Иван Сергеев': 'Пришёл' }, daysOfWeek: ['Пн', 'Ср'] },
  { id: 'class2', name: 'Пилатес', roomId: 'room2', type: 'individual', trainer: 'Мария Петрова', group: '', clients: ['Марина Ковалёва'], date: '2025-08-01', startTime: '09:00', endTime: '10:00', attendance: { 'Марина Ковалёва': 'Не пришёл' }, daysOfWeek: [] },
  { id: 'class3', name: 'Зумба', roomId: 'room3', type: 'group', trainer: 'Олег Смирнов', group: 'Зумба вечеринка', clients: ['Алексей Попов'], date: '2025-08-01', startTime: '10:00', endTime: '11:00', attendance: { 'Алексей Попов': 'Опоздал' }, daysOfWeek: ['Вт', 'Чт'] },
  { id: 'class4', name: 'Плавание', roomId: 'room4', type: 'special', trainer: 'Елена Козлова', group: '', clients: [], date: '2025-08-02', startTime: '11:00', endTime: '13:00', attendance: {}, daysOfWeek: [] },
];

export async function loadSchedule() {
  const mainContent = document.getElementById('main-content');
  mainContent.innerHTML = '';

  const header = document.createElement('header');
  header.className = 'header';
  header.innerHTML = `
    <h1>Расписание</h1>
    <div class="user-actions">
      <span>Пользователь</span>
      <button>Выход</button>
    </div>
  `;
  mainContent.appendChild(header);

  const filterBar = document.createElement('div');
  filterBar.className = 'filter-bar';
  filterBar.innerHTML = `
    <input type="date" id="schedule-date-input" class="schedule-date-input">
    <button class="schedule-view-btn" id="schedule-day-view">День</button>
    <button class="schedule-view-btn" id="schedule-week-view">Неделя</button>
    <button class="schedule-add-btn" id="schedule-add-btn">Добавить занятие</button>
  `;
  mainContent.appendChild(filterBar);

  const scheduleContainer = document.createElement('div');
  scheduleContainer.className = 'schedule-container';
  mainContent.appendChild(scheduleContainer);

  const rooms = await getRooms();
  let viewMode = 'day';
  let selectedDate = new Date('2025-08-01');

  function renderSchedule() {
    scheduleContainer.innerHTML = '';
    const hours = Array.from({ length: 15 }, (_, i) => `${String(i + 8).padStart(2, '0')}:00`);
    if (viewMode === 'day') {
      renderDayView(hours);
    } else {
      renderWeekView(hours);
    }
  }

  function renderDayView(hours) {
    const table = document.createElement('div');
    table.className = 'schedule-table';
    let html = '<div class="schedule-row schedule-header"><div class="schedule-time"></div>';
    rooms.forEach(room => {
      html += `<div class="schedule-cell">${room.name}</div>`;
    });
    html += '</div>';

    const occupiedSlots = new Map();
    hours.forEach((hour, hourIndex) => {
      html += `<div class="schedule-row"><div class="schedule-time">${hour}</div>`;
      rooms.forEach(room => {
        const classes = scheduleData.filter(c => c.date === formatDate(selectedDate) && c.roomId === room.id && isClassInHour(c, hour));
        html += `<div class="schedule-cell">`;
        classes.forEach(cls => {
          const duration = getDuration(cls.startTime, cls.endTime);
          const startHourIndex = hours.indexOf(cls.startTime);
          if (startHourIndex === hourIndex) {
            const slotKey = `${room.id}-${startHourIndex}`;
            if (!occupiedSlots.has(slotKey)) {
              const groupText = cls.type === 'group' && cls.group ? `<br><small>${cls.group}</small>` : '';
              html += `<div class="schedule-class schedule-${cls.type}" data-id="${cls.id}" style="grid-row: span ${duration}">${cls.name}${groupText}</div>`;
              occupiedSlots.set(slotKey, true);
            }
          }
        });
        html += `</div>`;
      });
      html += `</div>`;
    });

    table.innerHTML = html;
    scheduleContainer.appendChild(table);
  }

  function renderWeekView(hours) {
    const table = document.createElement('div');
    table.className = 'schedule-table';
    const days = getWeekDays(selectedDate);
    let html = '<div class="schedule-row schedule-header"><div class="schedule-time"></div>';
    days.forEach(day => {
      html += `<div class="schedule-cell">${formatDay(day)}</div>`;
    });
    html += '</div>';

    hours.forEach((hour, hourIndex) => {
      html += `<div class="schedule-row"><div class="schedule-time">${hour}</div>`;
      days.forEach(day => {
        const classes = scheduleData.filter(c => c.date === formatDate(day) && isClassInHour(c, hour));
        html += `<div class="schedule-cell">`;
        classes.forEach(cls => {
          const duration = getDuration(cls.startTime, cls.endTime);
          const startHourIndex = hours.indexOf(cls.startTime);
          if (startHourIndex === hourIndex) {
            const room = rooms.find(r => r.id === cls.roomId);
            const groupText = cls.type === 'group' && cls.group ? `<br><small>${cls.group}</small>` : '';
            html += `<div class="schedule-class schedule-${cls.type}" data-id="${cls.id}" style="grid-row: span ${duration}">${cls.name}${groupText} (${room.name})</div>`;
          }
        });
        html += `</div>`;
      });
      html += `</div>`;
    });

    table.innerHTML = html;
    scheduleContainer.appendChild(table);
  }

  function isClassInHour(cls, hour) {
    const [startHour] = cls.startTime.split(':').map(Number);
    const [endHour] = cls.endTime.split(':').map(Number);
    const [checkHour] = hour.split(':').map(Number);
    return checkHour >= startHour && checkHour < endHour;
  }

  function getDuration(startTime, endTime) {
    const [startHour, startMin] = startTime.split(':').map(Number);
    const [endHour, endMin] = endTime.split(':').map(Number);
    const start = startHour * 60 + startMin;
    const end = endHour * 60 + endMin;
    const duration = Math.ceil((end - start) / 60);
    return duration > 0 ? duration : 1;
  }

  function showClassDetails(classId) {
    const cls = scheduleData.find(c => c.id === classId);
    if (!cls) return;

    const modal = document.createElement('div');
    modal.className = 'schedule-modal';
    modal.innerHTML = `
      <div class="schedule-modal-content">
        <h2>${cls.name}</h2>
        <p><strong>Зал:</strong> ${rooms.find(r => r.id === cls.roomId)?.name || 'Не указан'}</p>
        <p><strong>Тип:</strong> ${cls.type === 'group' ? 'Групповой' : cls.type === 'individual' ? 'Индивидуальный' : 'Специальный'}</p>
        <p><strong>Тренер:</strong> ${cls.trainer}</p>
        <p><strong>Группа:</strong> ${cls.group || 'Нет группы'}</p>
        <p><strong>Дни недели:</strong> ${cls.daysOfWeek?.length ? cls.daysOfWeek.join(', ') : 'Разовое'}</p>
        <p><strong>Дата:</strong> ${cls.date}</p>
        <p><strong>Время:</strong> ${cls.startTime}–${cls.endTime}</p>
        <p><strong>Клиенты:</strong> ${cls.clients.length ? cls.clients.join(', ') : 'Нет клиентов'}</p>
        <p><strong>Посещаемость:</strong> ${cls.clients.length ? cls.clients.map(client => `${client}: ${cls.attendance[client] || 'Не указано'}`).join(', ') : 'Нет данных'}</p>
        <div class="schedule-modal-actions">
          <button id="schedule-edit-btn">Редактировать</button>
          <button id="schedule-delete-btn" data-id="${cls.id}">Удалить</button>
          <button id="schedule-close-btn">Закрыть</button>
        </div>
      </div>
    `;
    mainContent.appendChild(modal);

    document.getElementById('schedule-edit-btn').addEventListener('click', async () => {
      const trainers = await getTrainers();
      const groups = await getGroups();
      const roomsList = await getRooms();
      if (trainers.length === 0) {
        alert('Нет доступных тренеров. Добавьте тренеров в разделе "Сотрудники".');
        modal.remove();
        return;
      }
      modal.remove();
      showClassForm('Редактировать занятие', cls, trainers, groups, roomsList, (data) => {
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
        renderSchedule();
      });
    });

    document.getElementById('schedule-delete-btn').addEventListener('click', () => {
      const classId = cls.id;
      scheduleData = scheduleData.filter(c => c.id !== classId);
      modal.remove();
      renderSchedule();
    });

    document.getElementById('schedule-close-btn').addEventListener('click', () => {
      modal.remove();
    });
  }

  async function showClassForm(title, cls, trainers, groups, rooms, callback) {
    const clients = await import('./clients.js').then(({ getClients }) => getClients()).catch(() => [
      { id: 'client1', name: 'Иван Сергеев' },
      { id: 'client2', name: 'Марина Ковалёва' },
      { id: 'client3', name: 'Алексей Попов' },
    ]);

    const modal = document.createElement('div');
    modal.className = 'schedule-modal';
    modal.innerHTML = `
      <div class="schedule-modal-content">
        <h2>${title}</h2>
        <input type="text" id="schedule-class-name" placeholder="Название занятия" value="${cls.name || ''}" required>
        <select id="schedule-class-room" required>
          <option value="">Выберите зал</option>
          ${rooms.map(room => `<option value="${room.id}" ${cls.roomId === room.id ? 'selected' : ''}>${room.name}</option>`).join('')}
        </select>
        <select id="schedule-class-type" required>
          <option value="">Выберите тип</option>
          <option value="group" ${cls.type === 'group' ? 'selected' : ''}>Групповой</option>
          <option value="individual" ${cls.type === 'individual' ? 'selected' : ''}>Индивидуальный</option>
          <option value="special" ${cls.type === 'special' ? 'selected' : ''}>Специальный</option>
        </select>
        <select id="schedule-class-trainer" required>
          <option value="">Выберите тренера</option>
          ${trainers.map(trainer => `<option value="${trainer}" ${cls.trainer === trainer ? 'selected' : ''}>${trainer}</option>`).join('')}
        </select>
        <select id="schedule-class-group">
          <option value="">Выберите группу (опционально)</option>
          ${groups.map(group => `<option value="${group}" ${cls.group === group ? 'selected' : ''}>${group}</option>`).join('')}
        </select>
        <select id="schedule-class-clients" multiple>
          ${clients.map(client => `<option value="${client.name}" ${cls.clients?.includes(client.name) ? 'selected' : ''}>${client.name}</option>`).join('')}
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
        <input type="date" id="schedule-class-date" value="${cls.date || formatDate(selectedDate)}" required>
        <input type="time" id="schedule-class-start" value="${cls.startTime || ''}" required>
        <input type="time" id="schedule-class-end" value="${cls.endTime || ''}" required>
        <div class="schedule-modal-actions">
          <button id="schedule-save-btn">Сохранить</button>
          <button id="schedule-cancel-btn">Отмена</button>
        </div>
      </div>
    `;
    mainContent.appendChild(modal);

    document.getElementById('schedule-save-btn').addEventListener('click', () => {
      const name = document.getElementById('schedule-class-name').value.trim();
      const roomId = document.getElementById('schedule-class-room').value;
      const type = document.getElementById('schedule-class-type').value;
      const trainer = document.getElementById('schedule-class-trainer').value;
      const group = document.getElementById('schedule-class-group').value;
      const clientOptions = document.getElementById('schedule-class-clients').selectedOptions;
      const clients = Array.from(clientOptions).map(opt => opt.value);
      const daysOfWeek = Array.from(document.querySelectorAll('input[name="days"]:checked')).map(input => input.value);
      const date = document.getElementById('schedule-class-date').value;
      const startTime = document.getElementById('schedule-class-start').value;
      const endTime = document.getElementById('schedule-class-end').value;

      if (name && roomId && type && trainer && date && startTime && endTime) {
        const start = new Date(`1970-01-01T${startTime}:00`);
        const end = new Date(`1970-01-01T${endTime}:00`);
        if (end > start) {
          // Создание занятий для выбранных дней недели на месяц вперёд
          const classesToAdd = [];
          if (daysOfWeek.length > 0) {
            const startDate = new Date(date);
            const endDate = new Date(startDate);
            endDate.setMonth(startDate.getMonth() + 1);
            for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
              const dayName = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'][d.getDay()];
              if (daysOfWeek.includes(dayName)) {
                classesToAdd.push({
                  id: `class${Date.now() + classesToAdd.length}`,
                  name,
                  roomId,
                  type,
                  trainer,
                  group,
                  clients,
                  date: formatDate(d),
                  startTime,
                  endTime,
                  attendance: clients.reduce((acc, client) => ({ ...acc, [client]: 'Пришёл' }), {}),
                  daysOfWeek
                });
              }
            }
          } else {
            classesToAdd.push({
              id: `class${Date.now()}`,
              name,
              roomId,
              type,
              trainer,
              group,
              clients,
              date,
              startTime,
              endTime,
              attendance: clients.reduce((acc, client) => ({ ...acc, [client]: 'Пришёл' }), {}),
              daysOfWeek
            });
          }

          classesToAdd.forEach(cls => scheduleData.push(cls));
          callback({ name, roomId, type, trainer, group, clients, date, startTime, endTime, daysOfWeek });
          modal.remove();
        } else {
          alert('Время окончания должно быть позже времени начала!');
        }
      } else {
        alert('Заполните все поля корректно!');
      }
    });

    document.getElementById('schedule-cancel-btn').addEventListener('click', () => {
      modal.remove();
    });
  }

  function formatDate(date) {
    return date.toISOString().split('T')[0];
  }

  function formatDay(date) {
    const options = { weekday: 'short', day: 'numeric', month: 'short' };
    return date.toLocaleDateString('ru-RU', options);
  }

  function getWeekDays(startDate) {
    const days = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(startDate);
      day.setDate(startDate.getDate() + i);
      days.push(day);
    }
    return days;
  }

  document.getElementById('schedule-date-input').value = formatDate(selectedDate);
  document.getElementById('schedule-day-view').addEventListener('click', () => {
    viewMode = 'day';
    renderSchedule();
  });
  document.getElementById('schedule-week-view').addEventListener('click', () => {
    viewMode = 'week';
    renderSchedule();
  });
  document.getElementById('schedule-date-input').addEventListener('change', (e) => {
    selectedDate = new Date(e.target.value);
    document.getElementById('schedule-date-input').value = formatDate(selectedDate);
    renderSchedule();
  });
  document.getElementById('schedule-add-btn').addEventListener('click', async () => {
    const trainers = await getTrainers();
    const groups = await getGroups();
    const roomsList = await getRooms();
    if (trainers.length === 0) {
      alert('Нет доступных тренеров. Добавьте тренеров в разделе "Сотрудники".');
      return;
    }
    showClassForm('Добавить занятие', {}, trainers, groups, roomsList, (data) => {
      renderSchedule();
    });
  });

  scheduleContainer.addEventListener('click', (e) => {
    const classEl = e.target.closest('.schedule-class');
    if (classEl) {
      const classId = classEl.getAttribute('data-id');
      showClassDetails(classId);
    }
  });

  renderSchedule();
}