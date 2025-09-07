import { getTrainers } from './employees.js';
import { getGroups } from './groups.js';
import { getRooms as getRoomsFromRooms } from './rooms.js';
import { getClients } from './clients.js';
import { getActiveSubscriptions, getSubscriptionTemplates } from './subscriptions.js';

// Прокси-экспорт getRooms
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
    clients: ['Иван Иванов'],
    date: '2025-09-05',
    startTime: '09:00',
    endTime: '10:00',
    attendance: { 'Иван Иванов': 'Пришёл' },
    daysOfWeek: ['Пн']
  },
  {
    id: 'class6',
    name: 'Фитнес',
    roomId: 'room2',
    type: 'individual',
    trainer: 'Мария Петрова',
    group: '',
    clients: ['Мария Петрова'],
    date: '2025-09-05',
    startTime: '18:00',
    endTime: '19:00',
    attendance: { 'Мария Петрова': 'Пришёл' },
    daysOfWeek: []
  },
  {
    id: 'class7',
    name: 'Пилатес',
    roomId: 'room3',
    type: 'group',
    trainer: 'Олег Смирнов',
    group: 'Пилатес',
    clients: ['Ольга Кузнецова'],
    date: '2025-09-05',
    startTime: '19:00',
    endTime: '20:00',
    attendance: { 'Ольга Кузнецова': 'Пришёл' },
    daysOfWeek: ['Ср']
  }
];

export function setupModalClose(modal, closeModal, checkInnerSelection = false) {
  modal.addEventListener('click', (e) => {
    const selection = window.getSelection();
    if (e.target === modal && (!checkInnerSelection || !modal.querySelector('.client-form-content, .schedule-modal-content, .journal-modal-content, .inline-client-picker')?.contains(selection.anchorNode))) {
      closeModal();
    }
  });
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

  const rooms = getRooms();
  const groups = getGroups();
  const clients = getClients();
  const groupSelect = document.getElementById('schedule-group-filter');
  groupSelect.innerHTML += groups.map(group => `<option value="${escapeHtml(group)}">${escapeHtml(group)}</option>`).join('');

  let viewMode = 'day';
  let selectedDate = new Date('2025-09-05');

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
                html += `<div class="schedule-class schedule-${cls.type}" data-id="${cls.id}" style="grid-row: span ${duration}">${escapeHtml(cls.name)}${groupText}<br><small>${cls.clients.length ? cls.clients.map(c => escapeHtml(c)).join(', ') : 'Нет клиентов'}</small></div>`;
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
            html += `<div class="schedule-class schedule-${cls.type}" data-id="${cls.id}" style="grid-row: span ${duration}">${escapeHtml(cls.name)}${groupText}<br><small>${cls.clients.length ? cls.clients.map(c => escapeHtml(c)).join(', ') : 'Нет клиентов'}</small> (${room ? escapeHtml(room.name) : 'Неизвестный зал'})</div>`;
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

  function showClassForm(title, cls, trainers, groups, rooms, clients, callback) {
    const modal = document.createElement('div');
    modal.className = 'schedule-modal';
    modal.innerHTML = `
      <div class="schedule-modal-content">
        <h2>${title}</h2>
        <input type="text" id="schedule-class-name" placeholder="Название занятия" value="${escapeHtml(cls.name || '')}" required>
        <select id="schedule-class-room" required>
          <option value="">Выберите зал</option>
          ${Array.isArray(rooms) ? rooms.map(room => `<option value="${room.id}" ${cls.roomId === room.id ? 'selected' : ''}>${escapeHtml(room.name)}</option>`).join('') : ''}
        </select>
        <select id="schedule-class-type" required>
          <option value="">Выберите тип</option>
          <option value="group" ${cls.type === 'group' ? 'selected' : ''}>Групповой</option>
          <option value="individual" ${cls.type === 'individual' ? 'selected' : ''}>Индивидуальный</option>
          <option value="special" ${cls.type === 'special' ? 'selected' : ''}>Специальный</option>
        </select>
        <select id="schedule-class-trainer" required>
          <option value="">Выберите тренера</option>
          ${trainers.map(trainer => `<option value="${escapeHtml(trainer)}" ${cls.trainer === trainer ? 'selected' : ''}>${escapeHtml(trainer)}</option>`).join('')}
        </select>
        <select id="schedule-class-group">
          <option value="">Выберите группу (опционально)</option>
          ${groups.map(group => `<option value="${escapeHtml(group)}" ${cls.group === group ? 'selected' : ''}>${escapeHtml(group)}</option>`).join('')}
        </select>
        <div class="client-picker">
          <label>Клиенты:</label>
          <div class="client-search-container">
            <input type="text" id="schedule-client-search" placeholder="Поиск клиента (имя или телефон)">
            <div id="schedule-client-results" class="client-results"></div>
          </div>
          <div id="schedule-client-selected" class="client-selected">
            <label>Выбранные:</label>
            <div class="selected-chips"></div>
          </div>
        </div>
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

    let selectedClients = Array.isArray(cls.clients) ? cls.clients.slice() : [];

    const resultsEl = modal.querySelector('#schedule-client-results');
    const selectedEl = modal.querySelector('.selected-chips');
    const searchEl = modal.querySelector('#schedule-client-search');

    function renderResults() {
      const q = searchEl.value.trim().toLowerCase();
      if (!q) {
        resultsEl.classList.remove('visible');
        resultsEl.innerHTML = '';
        return;
      }
      const matches = clients
        .filter(c => {
          const name = (c.name || '').toLowerCase();
          const phone = (c.phone || '').toLowerCase();
          return name.includes(q) || phone.includes(q);
        })
        .slice(0, 10);
      resultsEl.innerHTML = matches.map(c => `
        <label class="client-checkbox-item" data-name="${escapeHtml(c.name)}">
          <input type="checkbox" value="${escapeHtml(c.name)}" ${selectedClients.includes(c.name) ? 'checked' : ''} ${c.blacklisted ? 'disabled' : ''}>
          <span>${escapeHtml(c.name)}${c.blacklisted ? ' (В чёрном списке)' : ''}</span>
          <div class="client-phone">${escapeHtml(c.phone || '')}</div>
        </label>
      `).join('');
      resultsEl.classList.add('visible');
    }

    function renderSelected() {
      selectedEl.innerHTML = selectedClients.map(name => `
        <span class="client-chip" data-name="${escapeHtml(name)}">
          ${escapeHtml(name)} <button class="client-remove-btn" data-name="${escapeHtml(name)}">×</button>
        </span>
      `).join('');
    }

    renderResults();
    renderSelected();

    searchEl.addEventListener('input', renderResults);

    resultsEl.addEventListener('click', (e) => {
      if (window.getSelection().toString().length > 0) return;
      const item = e.target.closest('.client-checkbox-item');
      if (!item) return;
      const checkbox = item.querySelector('input[type="checkbox"]');
      if (checkbox && !checkbox.disabled) {
        checkbox.checked = !checkbox.checked;
        const ev = new Event('change', { bubbles: true });
        checkbox.dispatchEvent(ev);
      }
    });

    selectedEl.addEventListener('click', (e) => {
      if (window.getSelection().toString().length > 0) return;
      if (e.target.classList.contains('client-remove-btn')) {
        const name = e.target.getAttribute('data-name');
        selectedClients = selectedClients.filter(n => n !== name);
        renderSelected();
        renderResults();
      }
    });

    modal.querySelectorAll('.day-button').forEach(button => {
      button.addEventListener('click', (e) => {
        if (window.getSelection().toString().length > 0) return;
        button.classList.toggle('selected');
      });
    });

    modal.querySelector('#schedule-save-btn').addEventListener('click', (e) => {
      if (window.getSelection().toString().length > 0) return;
      const name = modal.querySelector('#schedule-class-name').value.trim();
      const roomId = modal.querySelector('#schedule-class-room').value;
      const type = modal.querySelector('#schedule-class-type').value;
      const trainer = modal.querySelector('#schedule-class-trainer').value;
      const group = modal.querySelector('#schedule-class-group').value;
      const daysOfWeek = Array.from(modal.querySelectorAll('.day-button.selected')).map(b => b.getAttribute('data-day'));
      const date = modal.querySelector('#schedule-class-date').value;
      const startTime = modal.querySelector('#schedule-class-start').value;
      const endTime = modal.querySelector('#schedule-class-end').value;

      if (name && roomId && type && trainer && date && startTime && endTime) {
        const start = new Date(`1970-01-01T${startTime}:00`);
        const end = new Date(`1970-01-01T${endTime}:00`);
        if (end > start) {
          callback({ name, roomId, type, trainer, group, clients: selectedClients, date, startTime, endTime, daysOfWeek });
          modal.remove();
        } else {
          alert('Время окончания должно быть позже времени начала!');
        }
      } else {
        alert('Заполните все поля корректно!');
      }
    });

    if (cls.id) {
      modal.querySelector('#schedule-delete-btn').addEventListener('click', () => {
        if (window.getSelection().toString().length > 0) return;
        const classId = cls.id;
        if (confirm('Удалить занятие?')) {
          scheduleData.splice(scheduleData.findIndex(c => c.id === classId), 1);
          modal.remove();
          renderSchedule();
        }
      });
    }

    modal.querySelector('#schedule-cancel-btn').addEventListener('click', () => {
      if (window.getSelection().toString().length > 0) return;
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
        <h2>${escapeHtml(cls.name)}</h2>
        <p><strong>Зал:</strong> ${Array.isArray(rooms) && rooms.find(r => r.id === cls.roomId)?.name || 'Не указан'}</p>
        <p><strong>Тип:</strong> ${cls.type === 'group' ? 'Групповой' : cls.type === 'individual' ? 'Индивидуальный' : 'Специальный'}</p>
        <p><strong>Тренер:</strong> ${escapeHtml(cls.trainer)}</p>
        <p><strong>Группа:</strong> ${escapeHtml(cls.group || 'Нет группы')}</p>
        <p><strong>Дни недели:</strong> ${cls.daysOfWeek?.length ? cls.daysOfWeek.map(d => escapeHtml(d)).join(', ') : 'Разовое'}</p>
        <p><strong>Дата:</strong> ${escapeHtml(cls.date)}</p>
        <p><strong>Время:</strong> ${escapeHtml(cls.startTime)}–${escapeHtml(cls.endTime)}</p>
        <p><strong>Клиенты:</strong> ${cls.clients.length ? cls.clients.map(c => escapeHtml(c)).join(', ') : 'Нет клиентов'}</p>
        <p><strong>Посещаемость:</strong> ${cls.clients.length ? cls.clients.map(client => `${escapeHtml(client)}: ${escapeHtml(cls.attendance[client] || 'Не указано')}`).join(', ') : 'Нет данных'}</p>
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
      if (window.getSelection().toString().length > 0) return;
      const clientsList = getClients();
      modal.remove();
      showJournalModal(cls, clientsList, (attendance) => {
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
  }

  function showJournalModal(cls, clientsList, callback) {
    const modal = document.createElement('div');
    modal.className = 'journal-modal';
    modal.innerHTML = `
      <div class="journal-modal-content">
        <div class="journal-header">
          <h2>Журнал — ${escapeHtml(cls.name || cls.group || 'Занятие')}</h2>
          <button id="journal-back-btn">← Назад</button>
        </div>
        <p><strong>Дата:</strong> ${escapeHtml(cls.date || '—')} ${cls.startTime ? `, ${escapeHtml(cls.startTime)}–${escapeHtml(cls.endTime)}` : ''}</p>
        <div class="journal-controls">
          <div class="client-search-container">
            <input type="text" id="journal-search" placeholder="Поиск клиента">
            <div id="journal-client-results" class="client-results"></div>
          </div>
          <button id="journal-add-client-btn">Добавить клиента</button>
        </div>
        <div>
          <table class="journal-table">
            <thead>
              <tr>
                <th>Клиент</th>
                <th>Статус</th>
              </tr>
            </thead>
            <tbody id="journal-tbody"></tbody>
          </table>
        </div>
        <div class="journal-actions">
          <button id="journal-save-btn">Сохранить</button>
          <button id="journal-close-btn">Закрыть</button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);

    let journalClients = [];
    if (Array.isArray(cls.clients) && cls.clients.length) {
      journalClients = clientsList.filter(c => cls.clients.includes(c.name));
    } else if (cls.group) {
      journalClients = clientsList.filter(c => Array.isArray(c.groups) && c.groups.includes(cls.group));
    }
    if (!journalClients.length) {
      journalClients = clientsList.slice(0, 10);
    }

    cls.attendance = cls.attendance || {};

    function renderJournal(filter = '') {
      const q = filter.trim().toLowerCase();
      const rows = journalClients
        .filter(c => !q || c.name.toLowerCase().includes(q) || (c.phone || '').toLowerCase().includes(q))
        .map(c => {
          const status = cls.attendance[c.name] || 'Не пришёл';
          const disabled = c.blacklisted ? 'disabled' : '';
          const blackTag = c.blacklisted ? ' <small>(В чёрном списке)</small>' : '';
          return `<tr data-name="${escapeHtml(c.name)}">
                    <td>${escapeHtml(c.name)}${blackTag}</td>
                    <td>
                      <select class="journal-status" data-name="${escapeHtml(c.name)}" ${disabled}>
                        <option value="Пришёл" ${status === 'Пришёл' ? 'selected' : ''}>Пришёл</option>
                        <option value="Не пришёл" ${status === 'Не пришёл' ? 'selected' : ''}>Не пришёл</option>
                        <option value="Опоздал" ${status === 'Опоздал' ? 'selected' : ''}>Опоздал</option>
                        <option value="Отменено" ${status === 'Отменено' ? 'selected' : ''}>Отменено</option>
                      </select>
                    </td>
                  </tr>`;
        }).join('');
      modal.querySelector('#journal-tbody').innerHTML = rows || '<tr><td colspan="2">Нет клиентов</td></tr>';
    }

    renderJournal();

    const searchEl = modal.querySelector('#journal-search');
    const resultsEl = modal.querySelector('#journal-client-results');

    function renderSearchResults() {
      const q = searchEl.value.trim().toLowerCase();
      if (!q) {
        resultsEl.classList.remove('visible');
        resultsEl.innerHTML = '';
        return;
      }
      const matches = clientsList
        .filter(c => c.name.toLowerCase().includes(q) || (c.phone || '').toLowerCase().includes(q))
        .slice(0, 10);
      resultsEl.innerHTML = matches.map(c => `
        <label class="client-checkbox-item" data-name="${escapeHtml(c.name)}">
          <input type="checkbox" value="${escapeHtml(c.name)}" ${journalClients.find(j => j.name === c.name) ? 'checked' : ''} ${c.blacklisted ? 'disabled' : ''}>
          <span>${escapeHtml(c.name)}${c.blacklisted ? ' (В чёрном списке)' : ''}</span>
          <div class="client-phone">${escapeHtml(c.phone || '')}</div>
        </label>
      `).join('');
      resultsEl.classList.add('visible');
    }

    searchEl.addEventListener('input', renderSearchResults);

    resultsEl.addEventListener('click', (e) => {
      if (window.getSelection().toString().length > 0) return;
      const item = e.target.closest('.client-checkbox-item');
      if (!item) return;
      const checkbox = item.querySelector('input[type="checkbox"]');
      if (checkbox && !checkbox.disabled) {
        checkbox.checked = !checkbox.checked;
        const ev = new Event('change', { bubbles: true });
        checkbox.dispatchEvent(ev);
      }
    });

    resultsEl.addEventListener('change', (e) => {
      if (e.target.matches('input[type="checkbox"]')) {
        const name = e.target.value;
        const clientObj = clientsList.find(c => c.name === name);
        if (e.target.checked) {
          if (!journalClients.find(j => j.name === name)) {
            journalClients.push(clientObj);
            if (!cls.clients) cls.clients = [];
            if (!cls.clients.includes(name)) cls.clients.push(name);
            cls.attendance[name] = cls.attendance[name] || 'Пришёл';
          }
        } else {
          journalClients = journalClients.filter(c => c.name !== name);
          cls.clients = cls.clients.filter(c => c !== name);
          delete cls.attendance[name];
        }
        renderJournal(searchEl.value);
        resultsEl.classList.remove('visible');
        searchEl.value = '';
        renderSearchResults();
      }
    });

    modal.querySelector('#journal-add-client-btn').addEventListener('click', () => {
      if (window.getSelection().toString().length > 0) return;
      showInlineClientPicker(modal, clientsList, (selectedNames) => {
        selectedNames.forEach(name => {
          const clientObj = clientsList.find(c => c.name === name);
          if (clientObj && !journalClients.find(j => j.name === name)) {
            journalClients.push(clientObj);
            if (!cls.clients) cls.clients = [];
            if (!cls.clients.includes(name)) cls.clients.push(name);
            cls.attendance[name] = cls.attendance[name] || 'Пришёл';
          }
        });
        renderJournal(modal.querySelector('#journal-search').value);
      });
    });

    modal.querySelector('#journal-save-btn').addEventListener('click', async () => {
      if (window.getSelection().toString().length > 0) return;
      const rows = modal.querySelectorAll('#journal-tbody tr[data-name]');
      const attendance = {};
      rows.forEach(row => {
        const name = row.getAttribute('data-name');
        const statusEl = row.querySelector('.journal-status');
        attendance[name] = statusEl ? statusEl.value : 'Не пришёл';
      });

      const subs = await getActiveSubscriptions();
      const templates = await getSubscriptionTemplates();
      for (const row of rows) {
        const name = row.getAttribute('data-name');
        const statusEl = row.querySelector('.journal-status');
        if (statusEl && statusEl.value === 'Пришёл') {
          const clientData = clientsList.find(c => c.name === name);
          if (clientData) {
            const sub = subs.find(s => s.clientId === clientData.id && s.templateId !== 'template3');
            if (sub) {
              const template = templates.find(t => t.id === sub.templateId);
              if (template && template.remainingClasses !== Infinity && template.remainingClasses > 0) {
                template.remainingClasses -= 1;
              }
            }
          }
        }
      }

      callback(attendance);
      modal.remove();
    });

    modal.querySelector('#journal-close-btn').addEventListener('click', () => {
      if (window.getSelection().toString().length > 0) return;
      modal.remove();
    });
    modal.querySelector('#journal-back-btn').addEventListener('click', () => {
      if (window.getSelection().toString().length > 0) return;
      modal.remove();
    });
  }

  function showInlineClientPicker(parentModal, allClients, callback) {
    const picker = document.createElement('div');
    picker.className = 'inline-client-picker';
    picker.innerHTML = `
      <div class="client-search-container">
        <input type="text" id="picker-search" placeholder="Поиск по имени или телефону">
        <div id="picker-results" class="picker-results"></div>
      </div>
      <div id="picker-selected" class="picker-selected">
        <label>Выбранные:</label>
        <div class="selected-chips"></div>
      </div>
      <div>
        <button id="picker-add-btn">Добавить выбранных</button>
        <button id="picker-cancel-btn">Отмена</button>
      </div>
    `;
    parentModal.querySelector('.journal-modal-content').insertBefore(picker, parentModal.querySelector('#journal-tbody'));

    let selected = [];

    function renderPickerResults() {
      const q = picker.querySelector('#picker-search').value.trim().toLowerCase();
      if (!q) {
        picker.querySelector('#picker-results').classList.remove('visible');
        picker.querySelector('#picker-results').innerHTML = '';
        return;
      }
      const items = allClients
        .filter(c => c.name.toLowerCase().includes(q) || (c.phone || '').toLowerCase().includes(q))
        .slice(0, 10)
        .map(c => `
          <label class="client-checkbox-item" data-name="${escapeHtml(c.name)}">
            <input type="checkbox" value="${escapeHtml(c.name)}" ${selected.includes(c.name) ? 'checked' : ''} ${c.blacklisted ? 'disabled' : ''}>
            <span>${escapeHtml(c.name)}${c.blacklisted ? ' (В чёрном списке)' : ''}</span>
            <div class="client-phone">${escapeHtml(c.phone || '')}</div>
          </label>
        `).join('');
      picker.querySelector('#picker-results').innerHTML = items;
      picker.querySelector('#picker-results').classList.add('visible');
    }

    function renderSelectedChips() {
      picker.querySelector('.selected-chips').innerHTML = selected.map(n => `
        <span class="client-chip" data-name="${escapeHtml(n)}">
          ${escapeHtml(n)} <button class="picker-remove" data-name="${escapeHtml(n)}">×</button>
        </span>
      `).join('');
    }

    renderPickerResults();
    renderSelectedChips();

    picker.querySelector('#picker-search').addEventListener('input', renderPickerResults);

    picker.querySelector('#picker-results').addEventListener('change', (e) => {
      if (e.target.matches('input[type="checkbox"]')) {
        const name = e.target.value;
        if (e.target.checked) {
          if (!selected.includes(name)) selected.push(name);
        } else {
          selected = selected.filter(n => n !== name);
        }
        renderSelectedChips();
        picker.querySelector('#picker-results').classList.remove('visible');
        picker.querySelector('#picker-search').value = '';
        renderPickerResults();
      }
    });

    picker.querySelector('#picker-results').addEventListener('click', (e) => {
      if (window.getSelection().toString().length > 0) return;
      const item = e.target.closest('.client-checkbox-item');
      if (!item) return;
      const checkbox = item.querySelector('input[type="checkbox"]');
      if (checkbox && !checkbox.disabled) {
        checkbox.checked = !checkbox.checked;
        const ev = new Event('change', { bubbles: true });
        checkbox.dispatchEvent(ev);
      }
    });

    picker.querySelector('.selected-chips').addEventListener('click', (e) => {
      if (window.getSelection().toString().length > 0) return;
      if (e.target.classList.contains('picker-remove')) {
        const name = e.target.getAttribute('data-name');
        selected = selected.filter(n => n !== name);
        renderSelectedChips();
        renderPickerResults();
      }
    });

    picker.querySelector('#picker-add-btn').addEventListener('click', () => {
      if (window.getSelection().toString().length > 0) return;
      callback(selected);
      picker.remove();
    });

    picker.querySelector('#picker-cancel-btn').addEventListener('click', () => {
      if (window.getSelection().toString().length > 0) return;
      picker.remove();
    });
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
    if (window.getSelection().toString().length > 0) return;
    const classElement = e.target.closest('.schedule-class');
    if (classElement) {
      const classId = classElement.getAttribute('data-id');
      showClassDetails(classId);
    }
  });

  renderSchedule();
}
