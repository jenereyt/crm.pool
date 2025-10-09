import { getTrainers } from './employees.js';
import { getGroups, getGroupByName } from './groups.js';
import { getRooms } from './rooms.js';
import { getClients } from './clients.js';
import { getActiveSubscriptions } from './subscriptions.js';
import { showClassForm, showJournalModal } from './classes.js';
import { server } from './server.js';

export let scheduleData = [];

export async function getSchedules() {
  try {
    const response = await fetch(`${server}/schedules`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!response.ok) throw new Error('Ошибка при получении расписания');
    const schedules = await response.json();
    return Array.isArray(schedules) ? schedules : [];
  } catch (error) {
    console.error('GET /schedules:', error);
    return [];
  }
}

export async function getScheduleById(id) {
  try {
    const response = await fetch(`${server}/schedules/${id}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!response.ok) throw new Error('Ошибка при получении занятия');
    return await response.json();
  } catch (error) {
    console.error(`GET /schedules/${id}:`, error);
    return null;
  }
}

export async function addSchedule(data) {
  console.log('Data received in addSchedule:', data);
  const requiredFields = ['name', 'room_id', 'type', 'trainer_id', 'date', 'start_time', 'end_time'];
  const missingFields = requiredFields.filter(field => !data[field] || data[field] === '' || data[field] === undefined);
  if (missingFields.length) {
    console.error('Отсутствуют или некорректны поля:', missingFields);
    alert(`Ошибка: Заполните корректно поля: ${missingFields.join(', ')}`);
    return null;
  }

  const timeFormat = /^\d{2}:\d{2}$/;
  if (!timeFormat.test(data.start_time) || !timeFormat.test(data.end_time)) {
    console.error('Неверный формат времени:', { start_time: data.start_time, end_time: data.end_time });
    alert('Ошибка: Время должно быть в формате HH:MM');
    return null;
  }

  const start = new Date(`1970-01-01T${data.start_time}:00`);
  const end = new Date(`1970-01-01T${data.end_time}:00`);
  if (end <= start) {
    console.error('Время окончания раньше времени начала:', { start_time: data.start_time, end_time: data.end_time });
    alert('Ошибка: Время окончания должно быть позже времени начала');
    return null;
  }

  if (!data.room_id || typeof data.room_id !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(data.room_id)) {
    console.error('room_id должен быть корректным UUID:', data.room_id);
    alert('Ошибка: ID зала должен быть корректным UUID');
    return null;
  }

  // Строгая валидация UUID для trainer_id
  if (!data.trainer_id || typeof data.trainer_id !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(data.trainer_id)) {
    console.error('trainer_id должен быть корректным UUID:', data.trainer_id);
    alert('Ошибка: ID тренера должен быть корректным UUID');
    return null;
  }
  // Если сервер не использует UUID, можно временно упростить валидацию:
  // if (!data.trainer_id || typeof data.trainer_id !== 'string') {
  //   console.error('trainer_id должен быть строкой:', data.trainer_id);
  //   alert('Ошибка: ID тренера должен быть указан');
  //   return null;
  // }

  const body = {
    ...data,
    attendance: (data.client_ids || []).reduce((acc, clientId) => {
      acc[clientId] = { present: true, reason: null };
      return acc;
    }, {}),
    conducted: false
  };

  if (!body.group_id) {
    delete body.group_id;
  }

  try {
    const response = await fetch(`${server}/schedules`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Ошибка сервера:', errorData);
      throw new Error(errorData.message || 'Ошибка при добавлении занятия');
    }

    return await response.json();
  } catch (error) {
    console.error('POST /schedules:', error);
    alert(`Ошибка при добавлении занятия: ${error.message}`);
    return null;
  }
}

export async function updateSchedule(id, data) {
  try {
    const response = await fetch(`${server}/schedules/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error('Ошибка при обновлении занятия');
    return await response.json();
  } catch (error) {
    console.error(`PUT /schedules/${id}:`, error);
    alert('Ошибка при обновлении занятия!');
    return null;
  }
}

export async function deleteSchedule(id) {
  try {
    const response = await fetch(`${server}/schedules/${id}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!response.ok) throw new Error('Ошибка при удалении занятия');
    return true;
  } catch (error) {
    console.error(`DELETE /schedules/${id}:`, error);
    alert('Ошибка при удалении занятия!');
    return false;
  }
}

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

export async function loadSchedule() {
  const mainContent = document.getElementById('main-content');
  mainContent.innerHTML = '';

  const header = document.createElement('header');
  header.className = 'header';
  header.innerHTML = `
    <h1><img src="./images/icon-schedule.svg" alt="Расписание"> Расписание</h1>
  `;
  mainContent.appendChild(header);

  const filterBar = document.createElement('div');
  filterBar.className = 'filter-bar';
  filterBar.innerHTML = `
    <input type="date" id="schedule-date-input" class="schedule-date-input" value="2025-10-09">
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

  // Предзагрузка всех данных
  console.log('Предзагрузка данных для расписания...');
  const trainers = await getTrainers();
  console.log('Loaded trainers:', trainers);
  if (!Array.isArray(trainers) || trainers.length === 0) {
    console.error('No trainers available or trainers is not an array:', trainers);
    alert('Ошибка: Тренеры не загружены. Проверьте раздел "Сотрудники".');
    return;
  }
  const groups = await getGroups();
  const rooms = await getRooms();
  const clients = await getClients();
  const subscriptions = await getActiveSubscriptions();
  console.log('Loaded groups:', groups);
  console.log('Loaded rooms:', rooms);
  console.log('Loaded clients:', clients);
  console.log('Loaded subscriptions:', subscriptions);

  const groupSelect = document.getElementById('schedule-group-filter');
  groupSelect.innerHTML += groups.map(group => `<option value="${group.id}">${escapeHtml(group.name)}</option>`).join('');

  let viewMode = 'day';
  let selectedDate = new Date('2025-10-09');

  function getClientFullName(client) {
    if (!client) return 'Без имени';
    const parts = [
      client.surname?.trim() || '',
      client.name?.trim() || '',
      client.patronymic?.trim() || ''
    ].filter(part => part);
    return parts.join(' ') || 'Без имени';
  }

  async function renderSchedule() {
    scheduleContainer.innerHTML = '';
    const hours = Array.from({ length: 15 }, (_, i) => `${String(i + 8).padStart(2, '0')}:00`);
    const groupFilter = document.getElementById('schedule-group-filter').value;
    const schedules = await getSchedules();
    const filteredScheduleData = groupFilter
      ? schedules.filter(c => c.group_id === groupFilter)
      : schedules;
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
          const classes = data.filter(c => c.date === formatDate(selectedDate) && c.room_id === room.id && isClassInHour(c, hour));
          html += `<div class="schedule-cell">`;
          classes.forEach(cls => {
            const duration = getDuration(cls.start_time, cls.end_time);
            const startHourIndex = hours.indexOf(cls.start_time);
            if (startHourIndex === hourIndex) {
              const slotKey = `${room.id}-${startHourIndex}`;
              if (!occupiedSlots.has(slotKey)) {
                const group = groups.find(g => g.id === cls.group_id);
                const groupText = cls.type === 'group' && group ? `<br><small>${escapeHtml(group.name)}</small>` : '';
                const clientNames = cls.client_ids.map(id => {
                  const client = clients.find(c => c.id === id);
                  return client ? getClientFullName(client) : 'Неизвестный клиент';
                });
                const trainer = trainers.find(t => t.id === cls.trainer_id);
                html += `<div class="schedule-class schedule-${cls.type}" data-id="${cls.id}" style="grid-row: span ${duration}">${escapeHtml(cls.name)}${groupText}<br><small>${trainer ? escapeHtml(trainer.name) : 'Неизвестный тренер'}</small><br><small>${clientNames.length ? clientNames.map(c => escapeHtml(c)).join(', ') : 'Нет клиентов'}</small></div>`;
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
          const duration = getDuration(cls.start_time, cls.end_time);
          const startHourIndex = hours.indexOf(cls.start_time);
          if (startHourIndex === hourIndex) {
            const room = Array.isArray(rooms) ? rooms.find(r => r.id === cls.room_id) : null;
            const group = groups.find(g => g.id === cls.group_id);
            const groupText = cls.type === 'group' && group ? `<br><small>${escapeHtml(group.name)}</small>` : '';
            const clientNames = cls.client_ids.map(id => {
              const client = clients.find(c => c.id === id);
              return client ? getClientFullName(client) : 'Неизвестный клиент';
            });
            const trainer = trainers.find(t => t.id === cls.trainer_id);
            html += `<div class="schedule-class schedule-${cls.type}" data-id="${cls.id}" style="grid-row: span ${duration}">${escapeHtml(cls.name)}${groupText}<br><small>${trainer ? escapeHtml(trainer.name) : 'Неизвестный тренер'}</small><br><small>${clientNames.length ? clientNames.map(c => escapeHtml(c)).join(', ') : 'Нет клиентов'}</small> (${room ? escapeHtml(room.name) : 'Неизвестный зал'})</div>`;
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
    const [startHour] = cls.start_time.split(':').map(Number);
    const [endHour] = cls.end_time.split(':').map(Number);
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

  async function showClassDetails(classId) {
    const cls = await getScheduleById(classId);
    if (!cls) {
      alert('Занятие не найдено!');
      return;
    }

    const modal = document.createElement('div');
    modal.className = 'schedule-modal';
    modal.innerHTML = `
      <div class="schedule-modal-content">
        <h2>${escapeHtml(cls.name)}</h2>
        <p><strong>Зал:</strong> ${Array.isArray(rooms) && rooms.find(r => r.id === cls.room_id)?.name || 'Не указан'}</p>
        <p><strong>Тип:</strong> ${cls.type === 'group' ? 'Групповой' : cls.type === 'individual' ? 'Индивидуальный' : 'Специальный'}</p>
        <p><strong>Тренер:</strong> ${trainers.find(t => t.id === cls.trainer_id)?.name || 'Не указан'}</p>
        <p><strong>Группа:</strong> ${groups.find(g => g.id === cls.group_id)?.name || 'Нет группы'}</p>
        <p><strong>Дни недели:</strong> ${cls.days_of_week?.length ? cls.days_of_week.map(d => escapeHtml(d)).join(', ') : 'Разовое'}</p>
        <p><strong>Дата:</strong> ${escapeHtml(cls.date)}</p>
        <p><strong>Время:</strong> ${escapeHtml(cls.start_time)}–${escapeHtml(cls.end_time)}</p>
        <p><strong>Клиенты:</strong> ${cls.client_ids.length ? cls.client_ids.map(id => {
          const client = clients.find(c => c.id === id);
          return client ? escapeHtml(getClientFullName(client)) : 'Неизвестный клиент';
        }).join(', ') : 'Нет клиентов'}</p>
        <p><strong>Посещаемость:</strong> ${cls.client_ids.length ? cls.client_ids.map(id => {
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
      showClassForm('Редактировать занятие', cls, trainers, groups, rooms, clients, subscriptions, async (data) => {
        console.log('Form data for edit:', data);
        const updatedData = {
          name: data.name,
          room_id: data.room_id,
          type: data.type,
          trainer_id: data.trainer_id,
          group_id: data.group_id || null,
          client_ids: data.client_ids,
          date: data.date,
          start_time: data.start_time,
          end_time: data.end_time,
          days_of_week: data.days_of_week,
          attendance: data.client_ids.reduce((acc, clientId) => {
            const existing = cls.attendance[clientId] || { present: true, reason: null };
            acc[clientId] = existing;
            return acc;
          }, {})
        };
        const result = await updateSchedule(cls.id, updatedData);
        if (result) {
          await renderSchedule();
        }
      });
    });

    document.getElementById('schedule-attendance-btn').addEventListener('click', () => {
      if (window.getSelection().toString().length > 0) return;
      modal.remove();
      showJournalModal(cls, clients, subscriptions, trainers, async (attendance) => {
        const result = await updateSchedule(cls.id, { ...cls, attendance });
        if (result) {
          await renderSchedule();
        }
      });
    });

    document.getElementById('schedule-delete-btn').addEventListener('click', async () => {
      if (window.getSelection().toString().length > 0) return;
      if (confirm('Удалить занятие?')) {
        const success = await deleteSchedule(cls.id);
        if (success) {
          modal.remove();
          await renderSchedule();
        }
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
    if (!Array.isArray(trainers) || trainers.length === 0) {
      console.error('No trainers available for form:', trainers);
      alert('Нет доступных тренеров. Добавьте тренеров в разделе "Сотрудники".');
      return;
    }
    showClassForm('Добавить занятие', {}, trainers, groups, rooms, clients, subscriptions, async (data) => {
      console.log('Form data from showClassForm:', data);
      const classesToAdd = [];
      if (data.days_of_week && data.days_of_week.length > 0) {
        const startDate = new Date(data.date);
        const endDate = new Date(startDate);
        endDate.setMonth(startDate.getMonth() + 1);
        for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
          const dayName = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'][d.getDay()];
          if (data.days_of_week.includes(dayName)) {
            classesToAdd.push({
              name: data.name,
              room_id: data.room_id,
              type: data.type,
              trainer_id: data.trainer_id,
              group_id: data.group_id || null,
              client_ids: data.client_ids || [],
              date: formatDate(d),
              start_time: data.start_time,
              end_time: data.end_time,
              days_of_week: data.days_of_week
            });
          }
        }
      } else {
        classesToAdd.push({
          name: data.name,
          room_id: data.room_id,
          type: data.type,
          trainer_id: data.trainer_id,
          group_id: data.group_id || null,
          client_ids: data.client_ids || [],
          date: data.date,
          start_time: data.start_time,
          end_time: data.end_time,
          days_of_week: data.days_of_week || []
        });
      }

      let success = true;
      for (const cls of classesToAdd) {
        const result = await addSchedule(cls);
        if (!result) {
          success = false;
        }
      }
      if (success) {
        await renderSchedule();
      }
    });
  });

  scheduleContainer.addEventListener('click', async (e) => {
    if (window.getSelection().toString().length > 0) return;
    const classElement = e.target.closest('.schedule-class');
    if (classElement) {
      const classId = classElement.getAttribute('data-id');
      await showClassDetails(classId);
    }
  });

  await renderSchedule();
}
