import { getTrainers } from './employees.js';
import { getGroups } from './groups.js';
import { getRooms } from './rooms.js';
import { getClients } from './clients.js';
import { getActiveSubscriptions, getSubscriptionTemplates } from './subscriptions.js';

export let scheduleData = [
  {
    id: 'class1',
    name: 'Аквааэробика',
    roomId: 'room3',
    type: 'group',
    trainer: 'Анна Иванова',
    group: 'Йога для начинающих',
    clients: ['Иван Сергеев'],
    date: '2025-08-01',
    startTime: '09:00',
    endTime: '11:00',
    attendance: { 'Иван Сергеев': 'Пришёл' },
    daysOfWeek: ['Пн', 'Ср']
  },
  {
    id: 'class2',
    name: 'Плавание',
    roomId: 'room1',
    type: 'individual',
    trainer: 'Мария Петрова',
    group: '',
    clients: ['Марина Ковалёва'],
    date: '2025-08-01',
    startTime: '09:00',
    endTime: '10:00',
    attendance: { 'Марина Ковалёва': 'Не пришёл' },
    daysOfWeek: []
  },
  {
    id: 'class3',
    name: 'Зумба',
    roomId: 'room4',
    type: 'group',
    trainer: 'Олег Смирнов',
    group: 'Зумба вечеринка',
    clients: ['Алексей Попов'],
    date: '2025-08-01',
    startTime: '10:00',
    endTime: '11:00',
    attendance: { 'Алексей Попов': 'Опоздал' },
    daysOfWeek: ['Вт', 'Чт']
  },
  {
    id: 'class4',
    name: 'Силовая тренировка',
    roomId: 'room4',
    type: 'special',
    trainer: 'Елена Козлова',
    group: '',
    clients: [],
    date: '2025-08-02',
    startTime: '11:00',
    endTime: '13:00',
    attendance: {},
    daysOfWeek: []
  }
];

export function loadSchedule() {
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
    <input type="date" id="schedule-date-input" class="schedule-date-input" value="2025-08-01">
    <select id="schedule-group-filter" class="filter-select">
      <option value="">Все группы</option>
    </select>
    <button class="schedule-view-btn active" id="schedule-day-view">День</button>
    <button class="schedule-view-btn" id="schedule-week-view">Неделя</button>
    <button class="schedule-add-btn" id="schedule-add-btn">Добавить занятие</button>
  `;
  mainContent.appendChild(filterBar);

  const scheduleContainer = document.createElement('div');
  scheduleContainer.className = 'schedule-container';
  mainContent.appendChild(scheduleContainer);

  const rooms = getRooms();
  console.log('Rooms loaded:', rooms);
  const groups = getGroups();
  const clients = getClients();
  const groupSelect = document.getElementById('schedule-group-filter');
  groupSelect.innerHTML += groups.map(group => `<option value="${group}">${group}</option>`).join('');

  let viewMode = 'day';
  let selectedDate = new Date('2025-08-01');

  function renderSchedule() {
    scheduleContainer.innerHTML = '';
    const hours = Array.from({ length: 15 }, (_, i) => `${String(i + 8).padStart(2, '0')}:00`);
    const groupFilter = document.getElementById('schedule-group-filter').value;
    const filteredScheduleData = groupFilter
      ? scheduleData.filter(c => c.group === groupFilter)
      : scheduleData;
    if (viewMode === 'day') {
      renderDayView(hours, filteredScheduleData);
    } else {
      renderWeekView(hours, filteredScheduleData);
    }
  }

  function renderDayView(hours, data) {
    const table = document.createElement('div');
    table.className = 'schedule-table';
    let html = '<div class="schedule-row schedule-header"><div class="schedule-time"></div>';

    if (!Array.isArray(rooms)) {
      console.error('Error: rooms is not an array:', rooms);
      html += '<div class="schedule-cell">Ошибка: Залы не загружены</div>';
    } else {
      rooms.forEach(room => {
        html += `<div class="schedule-cell">${room.name}</div>`;
      });
    }
    html += '</div>';

    const occupiedSlots = new Map();
    hours.forEach((hour, hourIndex) => {
      html += `<div class="schedule-row"><div class="schedule-time">${hour}</div>`;
      if (Array.isArray(rooms)) {
        rooms.forEach(room => {
          const classes = data.filter(c => c.date === formatDate(selectedDate) && c.roomId === room.id && isClassInHour(c, hour));
          html += `<div class="schedule-cell">`;
          classes.forEach(cls => {
            const duration = getDuration(cls.startTime, cls.endTime);
            const startHourIndex = hours.indexOf(cls.startTime);
            if (startHourIndex === hourIndex) {
              const slotKey = `${room.id}-${startHourIndex}`;
              if (!occupiedSlots.has(slotKey)) {
                const groupText = cls.type === 'group' && cls.group ? `<br><small>${cls.group}</small>` : '';
                html += `<div class="schedule-class schedule-${cls.type}" data-id="${cls.id}" style="grid-row: span ${duration}">${cls.name}${groupText}<br><small>${cls.clients.length ? cls.clients.join(', ') : 'Нет клиентов'}</small></div>`;
                occupiedSlots.set(slotKey, true);
              }
            }
          });
          html += `</div>`;
        });
      } else {
        html += '<div class="schedule-cell">Ошибка: Залы не загружены</div>';
      }
      html += `</div>`;
    });

    table.innerHTML = html;
    scheduleContainer.appendChild(table);
  }

  function renderWeekView(hours, data) {
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
        const classes = data.filter(c => c.date === formatDate(day) && isClassInHour(c, hour));
        html += `<div class="schedule-cell">`;
        classes.forEach(cls => {
          const duration = getDuration(cls.startTime, cls.endTime);
          const startHourIndex = hours.indexOf(cls.startTime);
          if (startHourIndex === hourIndex) {
            const room = Array.isArray(rooms) ? rooms.find(r => r.id === cls.roomId) : null;
            const groupText = cls.type === 'group' && cls.group ? `<br><small>${cls.group}</small>` : '';
            html += `<div class="schedule-class schedule-${cls.type}" data-id="${cls.id}" style="grid-row: span ${duration}">${cls.name}${groupText}<br><small>${cls.clients.length ? cls.clients.join(', ') : 'Нет клиентов'}</small> (${room ? room.name : 'Неизвестный зал'})</div>`;
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

  function getWeekDays(date) {
    const startOfWeek = new Date(date);
    startOfWeek.setDate(date.getDate() - date.getDay() + (date.getDay() === 0 ? -6 : 1));
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(startOfWeek);
      d.setDate(startOfWeek.getDate() + i);
      return d;
    });
  }

  function formatDate(date) {
    return date.toISOString().split('T')[0];
  }

  function formatDay(date) {
    const days = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
    return `${days[date.getDay()]} ${date.getDate()}.${date.getMonth() + 1}`;
  }

  function showClassForm(title, cls, trainers, groups, rooms, clients, callback) {
    const modal = document.createElement('div');
    modal.className = 'schedule-modal';
    modal.innerHTML = `
      <div class="schedule-modal-content">
        <h2>${title}</h2>
        <input type="text" id="schedule-class-name" placeholder="Название занятия" value="${cls.name || ''}" required>
        <select id="schedule-class-room" required>
          <option value="">Выберите зал</option>
          ${Array.isArray(rooms) ? rooms.map(room => `<option value="${room.id}" ${cls.roomId === room.id ? 'selected' : ''}>${room.name}</option>`).join('') : ''}
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
          ${clients.map(client => `<option value="${client.name}" ${cls.clients?.includes(client.name) ? 'selected' : ''}>${client.name}${client.blacklisted ? ' (В чёрном списке)' : ''}</option>`).join('')}
        </select>
        <div class="days-of-week">
          <label>Дни недели:</label>
          <div class="days-of-week-buttons">
            ${['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map(day => `
              <button type="button" class="day-button${cls.daysOfWeek?.includes(day) ? ' selected' : ''}" data-day="${day}">${day}</button>
            `).join('')}
          </div>
        </div>
        <input type="date" id="schedule-class-date" value="${cls.date || ''}" required>
        <input type="time" id="schedule-class-start" value="${cls.startTime || ''}" required>
        <input type="time" id="schedule-class-end" value="${cls.endTime || ''}" required>
        <div class="schedule-modal-actions">
          <button id="schedule-save-btn">Сохранить</button>
          ${cls.id ? `<button id="schedule-delete-btn" data-id="${cls.id}">Удалить</button>` : ''}
          <button id="schedule-cancel-btn">Отмена</button>
        </div>
      </div>
    `;
    mainContent.appendChild(modal);

    document.querySelectorAll('.day-button').forEach(button => {
      button.addEventListener('click', () => {
        button.classList.toggle('selected');
      });
    });

    document.getElementById('schedule-save-btn').addEventListener('click', () => {
      const name = document.getElementById('schedule-class-name').value.trim();
      const roomId = document.getElementById('schedule-class-room').value;
      const type = document.getElementById('schedule-class-type').value;
      const trainer = document.getElementById('schedule-class-trainer').value;
      const group = document.getElementById('schedule-class-group').value;
      const clientOptions = document.getElementById('schedule-class-clients').selectedOptions;
      const clients = Array.from(clientOptions).map(opt => opt.value);
      const daysOfWeek = Array.from(document.querySelectorAll('.day-button.selected')).map(button => button.getAttribute('data-day'));
      const date = document.getElementById('schedule-class-date').value;
      const startTime = document.getElementById('schedule-class-start').value;
      const endTime = document.getElementById('schedule-class-end').value;

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

    if (cls.id) {
      document.getElementById('schedule-delete-btn').addEventListener('click', () => {
        const classId = cls.id;
        if (confirm('Удалить занятие?')) {
          scheduleData.splice(scheduleData.findIndex(c => c.id === classId), 1);
          modal.remove();
          renderSchedule();
        }
      });
    }

    document.getElementById('schedule-cancel-btn').addEventListener('click', () => {
      modal.remove();
    });
  }

  function showClassDetails(classId) {
    const cls = scheduleData.find(c => c.id === classId);
    if (!cls) return;

    const modal = document.createElement('div');
    modal.className = 'schedule-modal';
    modal.innerHTML = `
      <div class="schedule-modal-content">
        <h2>${cls.name}</h2>
        <p><strong>Зал:</strong> ${Array.isArray(rooms) && rooms.find(r => r.id === cls.roomId)?.name || 'Не указан'}</p>
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
          <button id="schedule-attendance-btn">Отметить посещаемость</button>
          <button id="schedule-delete-btn" data-id="${cls.id}">Удалить</button>
          <button id="schedule-close-btn">Закрыть</button>
        </div>
      </div>
    `;
    mainContent.appendChild(modal);

    document.getElementById('schedule-edit-btn').addEventListener('click', () => {
      const trainers = getTrainers();
      const groupsList = getGroups();
      const roomsList = getRooms();
      const clientsList = getClients();
      if (trainers.length === 0) {
        alert('Нет доступных тренеров. Добавьте тренеров в разделе "Сотрудники".');
        modal.remove();
        return;
      }
      modal.remove();
      showClassForm('Редактировать занятие', cls, trainers, groupsList, roomsList, clientsList, (data) => {
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

    document.getElementById('schedule-attendance-btn').addEventListener('click', () => {
      const clientsList = getClients();
      modal.remove();
      showAttendanceForm('Отметить посещаемость', cls, clientsList, (attendance) => {
        cls.attendance = attendance;
        renderSchedule();
      });
    });

    document.getElementById('schedule-delete-btn').addEventListener('click', () => {
      const classId = cls.id;
      scheduleData.splice(scheduleData.findIndex(c => c.id === classId), 1);
      modal.remove();
      renderSchedule();
    });

    document.getElementById('schedule-close-btn').addEventListener('click', () => {
      modal.remove();
    });
  }

  function showAttendanceForm(title, cls, clients, callback) {
    const modal = document.createElement('div');
    modal.className = 'attendance-modal';
    modal.innerHTML = `
      <div class="attendance-modal-content">
        <h2>${title}</h2>
        <p>Занятие: ${cls.name} (${cls.date}, ${cls.startTime}–${cls.endTime})</p>
        <p>Группа: ${cls.group || 'Нет группы'}</p>
        <div class="attendance-list">
          ${cls.clients.length ? cls.clients.map(client => {
      const clientData = clients.find(c => c.name === client);
      return `
              <div class="attendance-item">
                <span>${client}${clientData?.blacklisted ? ' (В чёрном списке)' : ''}</span>
                <select class="attendance-select" data-client="${client}" ${clientData?.blacklisted ? 'disabled' : ''}>
                  <option value="Пришёл" ${cls.attendance[client] === 'Пришёл' ? 'selected' : ''}>Пришёл</option>
                  <option value="Не пришёл" ${cls.attendance[client] === 'Не пришёл' ? 'selected' : ''}>Не пришёл</option>
                  <option value="Опоздал" ${cls.attendance[client] === 'Опоздал' ? 'selected' : ''}>Опоздал</option>
                  <option value="Отменено" ${cls.attendance[client] === 'Отменено' ? 'selected' : ''}>Отменено</option>
                </select>
              </div>
            `;
    }).join('') : '<p>Нет клиентов</p>'}
        </div>
        <div class="attendance-modal-actions">
          <button id="attendance-save-btn">Сохранить</button>
          <button id="attendance-cancel-btn">Отмена</button>
        </div>
      </div>
    `;
    mainContent.appendChild(modal);

    document.getElementById('attendance-save-btn').addEventListener('click', () => {
      const attendance = {};
      cls.clients.forEach(client => {
        const select = document.querySelector(`.attendance-select[data-client="${client}"]`);
        attendance[client] = select ? select.value : cls.attendance[client] || 'Пришёл';
        if (attendance[client] === 'Пришёл') {
          const clientData = clients.find(c => c.name === client);
          if (clientData) {
            const sub = getActiveSubscriptions().find(s => s.clientId === clientData.id && s.templateId !== 'template3');
            if (sub) {
              const templates = getSubscriptionTemplates();
              const template = templates.find(t => t.id === sub.templateId);
              if (template && template.remainingClasses !== Infinity && template.remainingClasses > 0) {
                template.remainingClasses -= 1;
              }
            }
          }
        }
      });
      callback(attendance);
      modal.remove();
    });

    document.getElementById('attendance-cancel-btn').addEventListener('click', () => {
      modal.remove();
    });
  }

  document.getElementById('schedule-day-view').addEventListener('click', () => {
    viewMode = 'day';
    document.getElementById('schedule-day-view').classList.add('active');
    document.getElementById('schedule-week-view').classList.remove('active');
    renderSchedule();
  });

  document.getElementById('schedule-week-view').addEventListener('click', () => {
    viewMode = 'week';
    document.getElementById('schedule-week-view').classList.add('active');
    document.getElementById('schedule-day-view').classList.remove('active');
    renderSchedule();
  });

  document.getElementById('schedule-date-input').addEventListener('change', (e) => {
    selectedDate = new Date(e.target.value);
    renderSchedule();
  });

  document.getElementById('schedule-add-btn').addEventListener('click', () => {
    const trainers = getTrainers();
    const groupsList = getGroups();
    const roomsList = getRooms();
    const clientsList = getClients();
    if (trainers.length === 0) {
      alert('Нет доступных тренеров. Добавьте тренеров в разделе "Сотрудники".');
      return;
    }
    showClassForm('Добавить занятие', {}, trainers, groupsList, roomsList, clientsList, (data) => {
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
      renderSchedule();
    });
  });

  scheduleContainer.addEventListener('click', (e) => {
    const classElement = e.target.closest('.schedule-class');
    if (classElement) {
      const classId = classElement.getAttribute('data-id');
      showClassDetails(classId);
    }
  });

  renderSchedule();
}