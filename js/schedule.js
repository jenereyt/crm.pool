import { getTrainers } from './employees.js';
import { getGroups, getGroupByName } from './groups.js';
import { getRooms as getRoomsFromRooms } from './rooms.js';
import { getClients } from './clients.js';
import { getActiveSubscriptions } from './subscriptions.js';
import { showClassForm, showJournalModal } from './classes.js';

export function getRooms() {
  return getRoomsFromRooms() || [
    { id: 'room1', name: 'Зал 1' },
    { id: 'room2', name: 'Зал 2' },
    { id: 'room3', name: 'Зал 3' }
  ];
}

export let scheduleData = [
  {
    id: 'class5',
    name: 'Йога',
    roomId: 'room1',
    type: 'group',
    trainer: 'Анна Иванова',
    group: 'Йога для начинающих',
    clientIds: ['client1'],
    date: '2025-09-05',
    startTime: '09:00',
    endTime: '10:00',
    attendance: { 'client1': { present: true, reason: null } },
    daysOfWeek: ['Пн'],
    conducted: false
  },
  {
    id: 'class6',
    name: 'Фитнес',
    roomId: 'room2',
    type: 'individual',
    trainer: 'Мария Петрова',
    group: '',
    clientIds: ['client2'],
    date: '2025-09-05',
    startTime: '18:00',
    endTime: '19:00',
    attendance: { 'client2': { present: true, reason: null } },
    daysOfWeek: [],
    conducted: false
  },
  {
    id: 'class7',
    name: 'Пилатес',
    roomId: 'room3',
    type: 'group',
    trainer: 'Олег Смирнов',
    group: 'Пилатес',
    clientIds: ['client3'],
    date: '2025-09-05',
    startTime: '19:00',
    endTime: '20:00',
    attendance: { 'client3': { present: true, reason: null } },
    daysOfWeek: ['Ср'],
    conducted: false
  }
];

export function setupModalClose(modal, closeFn, allowSelection = false) {
  modal.addEventListener('click', (e) => {
    if (e.target === modal && (!window.getSelection().toString() || allowSelection)) {
      closeFn();
    }
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeFn();
  }, { once: true });
}

export function loadSchedule() {
  const mainContent = document.getElementById('main-content');
  mainContent.innerHTML = '';

  const header = document.createElement('header');
  header.className = 'header';
  header.innerHTML = `
    <h1><img src="./images/icon-home.svg" alt="Расписание"> Расписание</h1>
  `;
  mainContent.appendChild(header);

  const filterBar = document.createElement('div');
  filterBar.className = 'filter-bar';
  filterBar.innerHTML = `
    <input type="date" id="schedule-date-input" class="schedule-date-input" value="2025-09-05">
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

  const trainers = getTrainers();
  const groups = getGroups();
  const rooms = getRooms();
  const clients = getClients();
  const subscriptions = getActiveSubscriptions();

  const groupSelect = document.getElementById('schedule-group-filter');
  groupSelect.innerHTML += groups.map(group => `<option value="${escapeHtml(group)}">${escapeHtml(group)}</option>`).join('');

  let viewMode = 'day';
  let selectedDate = new Date('2025-09-05');

  function getClientFullName(client) {
    if (!client) return 'Без имени';
    const parts = [
      client.surname?.trim() || '',
      client.name?.trim() || '',
      client.patronymic?.trim() || ''
    ].filter(part => part);
    return parts.join(' ') || 'Без имени';
  }

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
        html += `<div class="schedule-cell">${escapeHtml(room.name)}</div>`;
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
                const groupText = cls.type === 'group' && cls.group ? `<br><small>${escapeHtml(cls.group)}</small>` : '';
                const clientNames = cls.clientIds.map(id => {
                  const client = clients.find(c => c.id === id);
                  return client ? getClientFullName(client) : 'Неизвестный клиент';
                });
                html += `<div class="schedule-class schedule-${cls.type}" data-id="${cls.id}" style="grid-row: span ${duration}">${escapeHtml(cls.name)}${groupText}<br><small>${clientNames.length ? clientNames.map(c => escapeHtml(c)).join(', ') : 'Нет клиентов'}</small></div>`;
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
            const groupText = cls.type === 'group' && cls.group ? `<br><small>${escapeHtml(cls.group)}</small>` : '';
            const clientNames = cls.clientIds.map(id => {
              const client = clients.find(c => c.id === id);
              return client ? getClientFullName(client) : 'Неизвестный клиент';
            });
            html += `<div class="schedule-class schedule-${cls.type}" data-id="${cls.id}" style="grid-row: span ${duration}">${escapeHtml(cls.name)}${groupText}<br><small>${clientNames.length ? clientNames.map(c => escapeHtml(c)).join(', ') : 'Нет клиентов'}</small> (${room ? escapeHtml(room.name) : 'Неизвестный зал'})</div>`;
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
    const duration = Math.round((end - start) / 60);
    return duration > 0 ? duration : 1;
  }

  function getWeekDays(date) {
    const startOfWeek = new Date(date);
    startOfWeek.setDate(date.getDate() - date.getDay() + (date.getDay() === 0 ? -6 : 1));
    const maxDays = window.innerWidth <= 768 ? 5 : 7;
    return Array.from({ length: maxDays }, (_, i) => {
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

  function escapeHtml(s) {
    if (!s) return '';
    return String(s).replace(/[&<>"']/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
  }

  function showClassDetails(classId) {
    const cls = scheduleData.find(c => c.id === classId);
    if (!cls) return;

    const modal = document.createElement('div');
    modal.className = 'schedule-modal';
    modal.innerHTML = `
      <div class="schedule-modal-content">
        <h2>${escapeHtml(cls.name)}</h2>
        <p><strong>Зал:</strong> ${Array.isArray(rooms) && rooms.find(r => r.id === cls.roomId)?.name || 'Не указан'}</p>
        <p><strong>Тип:</strong> ${cls.type === 'group' ? 'Групповой' : cls.type === 'individual' ? 'Индивидуальный' : 'Специальный'}</p>
        <p><strong>Тренер:</strong> ${escapeHtml(cls.trainer)}</p>
        <p><strong>Группа:</strong> ${escapeHtml(cls.group || 'Нет группы')}</p>
        <p><strong>Дни недели:</strong> ${cls.daysOfWeek?.length ? cls.daysOfWeek.map(d => escapeHtml(d)).join(', ') : 'Разовое'}</p>
        <p><strong>Дата:</strong> ${escapeHtml(cls.date)}</p>
        <p><strong>Время:</strong> ${escapeHtml(cls.startTime)}–${escapeHtml(cls.endTime)}</p>
        <p><strong>Клиенты:</strong> ${cls.clientIds.length ? cls.clientIds.map(id => {
          const client = clients.find(c => c.id === id);
          return client ? escapeHtml(getClientFullName(client)) : 'Неизвестный клиент';
        }).join(', ') : 'Нет клиентов'}</p>
        <p><strong>Посещаемость:</strong> ${cls.clientIds.length ? cls.clientIds.map(id => {
          const client = clients.find(c => c.id === id);
          const name = client ? getClientFullName(client) : 'Неизвестный клиент';
          const att = cls.attendance[id] || { present: true, reason: null };
          const status = att.present ? 'Пришёл' : att.reason || 'Не пришёл';
          return `${escapeHtml(name)}: ${escapeHtml(status)}`;
        }).join(', ') : 'Нет данных'}</p>
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
      if (window.getSelection().toString().length > 0) return;
      if (trainers.length === 0) {
        alert('Нет доступных тренеров. Добавьте тренеров в разделе "Сотрудники".');
        modal.remove();
        return;
      }
      modal.remove();
      showClassForm('Редактировать занятие', cls, trainers, groups, rooms, clients, subscriptions, (data) => {
        cls.name = data.name;
        cls.roomId = data.roomId;
        cls.type = data.type;
        cls.trainer = data.trainer;
        cls.group = data.group;
        cls.clientIds = data.clientIds;
        cls.date = data.date;
        cls.startTime = data.startTime;
        cls.endTime = data.endTime;
        cls.daysOfWeek = data.daysOfWeek;
        cls.attendance = data.clientIds.reduce((acc, clientId) => {
          const existing = cls.attendance[clientId] || { present: true, reason: null };
          acc[clientId] = existing;
          return acc;
        }, {});
        renderSchedule();
      });
    });

    document.getElementById('schedule-attendance-btn').addEventListener('click', () => {
      if (window.getSelection().toString().length > 0) return;
      modal.remove();
      showJournalModal(cls, clients, subscriptions, (attendance) => {
        cls.attendance = attendance;
        renderSchedule();
      });
    });

    document.getElementById('schedule-delete-btn').addEventListener('click', () => {
      if (window.getSelection().toString().length > 0) return;
      const classId = cls.id;
      if (confirm('Удалить занятие?')) {
        scheduleData.splice(scheduleData.findIndex(c => c.id === classId), 1);
        modal.remove();
        renderSchedule();
      }
    });

    document.getElementById('schedule-close-btn').addEventListener('click', () => {
      if (window.getSelection().toString().length > 0) return;
      modal.remove();
    });

    setupModalClose(modal, () => modal.remove(), true);
  }

  document.getElementById('schedule-day-view').addEventListener('click', () => {
    if (window.getSelection().toString().length > 0) return;
    viewMode = 'day';
    document.getElementById('schedule-day-view').classList.add('active');
    document.getElementById('schedule-week-view').classList.remove('active');
    renderSchedule();
  });

  document.getElementById('schedule-week-view').addEventListener('click', () => {
    if (window.getSelection().toString().length > 0) return;
    viewMode = 'week';
    document.getElementById('schedule-week-view').classList.add('active');
    document.getElementById('schedule-day-view').classList.remove('active');
    renderSchedule();
  });

  document.getElementById('schedule-date-input').addEventListener('change', (e) => {
    if (window.getSelection().toString().length > 0) return;
    selectedDate = new Date(e.target.value);
    renderSchedule();
  });

  document.getElementById('schedule-group-filter').addEventListener('change', renderSchedule);

  document.getElementById('schedule-add-btn').addEventListener('click', () => {
    if (window.getSelection().toString().length > 0) return;
    if (trainers.length === 0) {
      alert('Нет доступных тренеров. Добавьте тренеров в разделе "Сотрудники".');
      return;
    }
    showClassForm('Добавить занятие', {}, trainers, groups, rooms, clients, subscriptions, (data) => {
      const classesToAdd = [];
      if (data.daysOfWeek && data.daysOfWeek.length > 0) {
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
              clientIds: data.clientIds || [],
              date: formatDate(d),
              startTime: data.startTime,
              endTime: data.endTime,
              attendance: (data.clientIds || []).reduce((acc, clientId) => {
                acc[clientId] = { present: true, reason: null };
                return acc;
              }, {}),
              daysOfWeek: data.daysOfWeek,
              conducted: false
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
          clientIds: data.clientIds || [],
          date: data.date,
          startTime: data.startTime,
          endTime: data.endTime,
          attendance: (data.clientIds || []).reduce((acc, clientId) => {
            acc[clientId] = { present: true, reason: null };
            return acc;
          }, {}),
          daysOfWeek: data.daysOfWeek || [],
          conducted: false
        });
      }

      classesToAdd.forEach(cls => scheduleData.push(cls));
      renderSchedule();
    });
  });

  scheduleContainer.addEventListener('click', (e) => {
    if (window.getSelection().toString().length > 0) return;
    const classElement = e.target.closest('.schedule-class');
    if (classElement) {
      const classId = classElement.getAttribute('data-id');
      showClassDetails(classId);
    }
  });

  renderSchedule();
}
