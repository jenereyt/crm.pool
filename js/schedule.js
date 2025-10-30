// schedule.js — ПОЛНЫЙ, ИСПРАВЛЕННЫЙ, ГОТОВЫЙ К ИСПОЛЬЗОВАНИЮ

import UsersHttpService from './usersHttpService.js';
import { getTrainers } from './employees.js';
import { getGroups } from './groups.js';
import { getRooms } from './rooms.js';
import { getClients } from './clients.js';
import { getActiveSubscriptions } from './subscriptions.js';
import { showClassForm, showJournalModal } from './classes.js';

export let scheduleData = [];

// === API ЧЕРЕЗ UsersHttpService ===
export async function getSchedules() {
  try {
    const schedules = await UsersHttpService.request('/schedules');
    return Array.isArray(schedules) ? schedules : [];
  } catch (error) {
    console.error('GET /schedules:', error);
    showToast('Ошибка загрузки расписания', 'error');
    return [];
  }
}

export async function getScheduleById(id) {
  try {
    return await UsersHttpService.request(`/schedules/${id}`);
  } catch (error) {
    console.error(`GET /schedules/${id}:`, error);
    showToast('Занятие не найдено', 'error');
    return null;
  }
}

export async function addSchedule(data) {
  console.log('addSchedule data:', data);

  const required = ['name', 'room_id', 'type', 'trainer_id', 'date', 'start_time', 'end_time'];
  const missing = required.filter(f => !data[f]);
  if (missing.length) {
    alert(`Заполните: ${missing.join(', ')}`);
    return null;
  }

  const timeFormat = /^\d{2}:\d{2}$/;
  if (!timeFormat.test(data.start_time) || !timeFormat.test(data.end_time)) {
    alert('Время: HH:MM');
    return null;
  }

  const [sh, sm] = data.start_time.split(':').map(Number);
  const [eh, em] = data.end_time.split(':').map(Number);
  if (eh * 60 + em <= sh * 60 + sm) {
    alert('Конец позже начала');
    return null;
  }

  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(data.room_id) || !uuidRegex.test(data.trainer_id)) {
    alert('Некорректный ID');
    return null;
  }

  const body = {
    ...data,
    attendance: (data.client_ids || []).reduce((acc, id) => {
      acc[id] = { present: true, reason: null };
      return acc;
    }, {}),
    conducted: false
  };
  if (!body.group_id) delete body.group_id;

  try {
    return await UsersHttpService.request('/schedules', 'POST', body);
  } catch (error) {
    console.error('POST /schedules:', error);
    showToast(`Ошибка: ${error.message}`, 'error');
    return null;
  }
}

export async function updateSchedule(id, data) {
  try {
    return await UsersHttpService.request(`/schedules/${id}`, 'PUT', data);
  } catch (error) {
    console.error(`PUT /schedules/${id}:`, error);
    showToast('Ошибка обновления', 'error');
    return null;
  }
}

export async function deleteSchedule(id) {
  try {
    await UsersHttpService.request(`/schedules/${id}`, 'DELETE');
    return true;
  } catch (error) {
    console.error(`DELETE /schedules/${id}:`, error);
    showToast('Ошибка удаления', 'error');
    return false;
  }
}

// === МОДАЛКИ ===
export function setupModalClose(modal, closeFn, allowSelection = false) {
  modal.addEventListener('click', e => {
    if (e.target === modal && (!window.getSelection().toString() || allowSelection)) closeFn();
  });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeFn(); }, { once: true });
}

// === UI: РАСПИСАНИЕ ===
export async function loadSchedule() {
  const mainContent = document.getElementById('main-content');
  if (!mainContent) return;
  mainContent.innerHTML = '';

  // Хедер
  const header = document.createElement('header');
  header.className = 'header';
  header.innerHTML = `<h1><img src="./images/icon-schedule.svg" alt="Расписание"> Расписание</h1>`;
  mainContent.appendChild(header);

  // Фильтры
  const filterBar = document.createElement('div');
  filterBar.className = 'filter-bar';
  filterBar.innerHTML = `
    <input type="date" id="schedule-date-input" value="${new Date().toISOString().split('T')[0]}">
    <select id="schedule-group-filter" class="filter-select"><option value="">Все группы</option></select>
    <button class="schedule-view-btn active" id="schedule-day-view">День</button>
    <button class="schedule-view-btn" id="schedule-week-view">Неделя</button>
    <button class="schedule-add-btn" id="schedule-add-btn">Добавить занятие</button>
  `;
  mainContent.appendChild(filterBar);

  const scheduleContainer = document.createElement('div');
  scheduleContainer.className = 'schedule-container';
  mainContent.appendChild(scheduleContainer);

  // Данные
  const [trainers, groups, rooms, clients, subscriptions] = await Promise.all([
    getTrainers(),
    getGroups(),
    getRooms(),
    getClients(),
    getActiveSubscriptions()
  ]);

  if (!trainers?.length) {
    showToast('Добавьте тренеров в "Сотрудники"', 'warning');
    return;
  }

  const groupSelect = document.getElementById('schedule-group-filter');
  groupSelect.innerHTML += groups.map(g => `<option value="${g.id}">${escapeHtml(g.name)}</option>`).join('');

  let viewMode = 'day';
  let selectedDate = new Date();

  function getClientFullName(c) {
    return [c?.surname, c?.name, c?.patronymic].filter(Boolean).join(' ') || 'Без имени';
  }

  async function renderSchedule() {
    scheduleContainer.innerHTML = '';
    const hours = Array.from({ length: 15 }, (_, i) => `${String(i + 8).padStart(2, '0')}:00`);
    const groupFilter = groupSelect.value;
    const allSchedules = await getSchedules();
    const data = groupFilter ? allSchedules.filter(s => s.group_id === groupFilter) : allSchedules;

    if (viewMode === 'day') renderDayView(hours, data);
    else renderWeekView(hours, data);
  }

  function renderDayView(hours, data) {
    const table = document.createElement('div');
    table.className = 'schedule-table';
    let html = '<div class="schedule-row schedule-header"><div class="schedule-time"></div>';
    rooms.forEach(r => html += `<div class="schedule-cell">${escapeHtml(r.name)}</div>`);
    html += '</div>';

    const occupied = new Map();
    hours.forEach((hour, hi) => {
      html += `<div class="schedule-row"><div class="schedule-time">${hour}</div>`;
      rooms.forEach(room => {
        const classes = data.filter(c =>
          c.date === formatDate(selectedDate) &&
          c.room_id === room.id &&
          isClassInHour(c, hour)
        );
        html += `<div class="schedule-cell">`;
        classes.forEach(cls => {
          const duration = getDuration(cls.start_time, cls.end_time);
          const startIdx = hours.indexOf(cls.start_time);
          if (startIdx === hi && !occupied.has(`${room.id}-${startIdx}`)) {
            const group = groups.find(g => g.id === cls.group_id);
            const trainer = trainers.find(t => t.id === cls.trainer_id);
            const clientNames = (cls.client_ids || []).map(id => {
              const c = clients.find(x => x.id === id);
              return c ? getClientFullName(c) : '—';
            });
            html += `<div class="schedule-class schedule-${cls.type}" data-id="${cls.id}" style="grid-row: span ${duration}">
              ${escapeHtml(cls.name)}${cls.type === 'group' && group ? `<br><small>${escapeHtml(group.name)}</small>` : ''}
              <br><small>${trainer ? escapeHtml(trainer.name) : '—'}</small>
              <br><small>${clientNames.length ? clientNames.map(escapeHtml).join(', ') : '—'}</small>
            </div>`;
            occupied.set(`${room.id}-${startIdx}`, true);
          }
        });
        html += `</div>`;
      });
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
    days.forEach(d => html += `<div class="schedule-cell">${formatDay(d)}</div>`);
    html += '</div>';

    hours.forEach((hour, hi) => {
      html += `<div class="schedule-row"><div class="schedule-time">${hour}</div>`;
      days.forEach(day => {
        const classes = data.filter(c => c.date === formatDate(day) && isClassInHour(c, hour));
        html += `<div class="schedule-cell">`;
        classes.forEach(cls => {
          const duration = getDuration(cls.start_time, cls.end_time);
          const startIdx = hours.indexOf(cls.start_time);
          if (startIdx === hi) {
            const room = rooms.find(r => r.id === cls.room_id);
            const group = groups.find(g => g.id === cls.group_id);
            const trainer = trainers.find(t => t.id === cls.trainer_id);
            const clientNames = (cls.client_ids || []).map(id => {
              const c = clients.find(x => x.id === id);
              return c ? getClientFullName(c) : '—';
            });
            html += `<div class="schedule-class schedule-${cls.type}" data-id="${cls.id}" style="grid-row: span ${duration}">
              ${escapeHtml(cls.name)}${group ? `<br><small>${escapeHtml(group.name)}</small>` : ''}
              <br><small>${trainer ? escapeHtml(trainer.name) : '—'}</small>
              <br><small>${clientNames.length ? clientNames.map(escapeHtml).join(', ') : '—'}</small>
              <br><small>(${room ? escapeHtml(room.name) : '—'})</small>
            </div>`;
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
    const [sh] = cls.start_time.split(':').map(Number);
    const [eh] = cls.end_time.split(':').map(Number);
    const [ch] = hour.split(':').map(Number);
    return ch >= sh && ch < eh;
  }

  function getDuration(start, end) {
    const [sh, sm] = start.split(':').map(Number);
    const [eh, em] = end.split(':').map(Number);
    return Math.max(1, Math.round((eh * 60 + em - sh * 60 - sm) / 60));
  }

  function getWeekDays(date) {
    const start = new Date(date);
    start.setDate(date.getDate() - date.getDay() + (date.getDay() === 0 ? -6 : 1));
    const max = window.innerWidth <= 768 ? 5 : 7;
    return Array.from({ length: max }, (_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      return d;
    });
  }

  function formatDate(d) { return d.toISOString().split('T')[0]; }
  function formatDay(d) {
    const days = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
    return `${days[d.getDay()]} ${d.getDate()}.${d.getMonth() + 1}`;
  }

  function escapeHtml(s) {
    if (!s) return '';
    return String(s).replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
  }

  // === ДЕТАЛИ ЗАНЯТИЯ ===
  async function showClassDetails(id) {
    const cls = await getScheduleById(id);
    if (!cls) return showToast('Занятие не найдено', 'error');

    const modal = document.createElement('div');
    modal.className = 'schedule-modal';
    modal.innerHTML = `
      <div class="schedule-modal-content">
        <h2>${escapeHtml(cls.name)}</h2>
        <p><strong>Зал:</strong> ${rooms.find(r => r.id === cls.room_id)?.name || '—'}</p>
        <p><strong>Тип:</strong> ${cls.type === 'group' ? 'Групповой' : cls.type === 'individual' ? 'Индивидуальный' : 'Специальный'}</p>
        <p><strong>Тренер:</strong> ${trainers.find(t => t.id === cls.trainer_id)?.name || '—'}</p>
        <p><strong>Группа:</strong> ${groups.find(g => g.id === cls.group_id)?.name || 'Нет'}</p>
        <p><strong>Дата:</strong> ${cls.date}</p>
        <p><strong>Время:</strong> ${cls.start_time}–${cls.end_time}</p>
        <p><strong>Клиенты:</strong> ${(cls.client_ids || []).map(id => {
          const c = clients.find(x => x.id === id);
          return c ? escapeHtml(getClientFullName(c)) : '—';
        }).join(', ') || 'Нет'}</p>
        <div class="schedule-modal-actions">
          <button id="edit">Редактировать</button>
          <button id="attendance">Посещаемость</button>
          <button id="delete" data-id="${cls.id}">Удалить</button>
          <button id="close">Закрыть</button>
        </div>
      </div>
    `;
    mainContent.appendChild(modal);

    modal.querySelector('#edit').onclick = () => {
      if (window.getSelection().toString()) return;
      modal.remove();
      showClassForm('Редактировать', cls, trainers, groups, rooms, clients, subscriptions, async data => {
        const updated = { ...cls, ...data, attendance: cls.attendance };
        if (await updateSchedule(cls.id, updated)) renderSchedule();
      });
    };

    modal.querySelector('#attendance').onclick = () => {
      modal.remove();
      showJournalModal(cls, clients, subscriptions, trainers, async att => {
        if (await updateSchedule(cls.id, { ...cls, attendance: att })) renderSchedule();
      });
    };

    modal.querySelector('#delete').onclick = async () => {
      if (confirm('Удалить?') && await deleteSchedule(cls.id)) {
        modal.remove();
        renderSchedule();
      }
    };

    modal.querySelector('#close').onclick = () => modal.remove();
    setupModalClose(modal, () => modal.remove(), true);
  }

  // === СОБЫТИЯ ===
  document.getElementById('schedule-day-view').onclick = () => { viewMode = 'day'; renderSchedule(); updateViewButtons(); };
  document.getElementById('schedule-week-view').onclick = () => { viewMode = 'week'; renderSchedule(); updateViewButtons(); };
  document.getElementById('schedule-date-input').onchange = e => { selectedDate = new Date(e.target.value); renderSchedule(); };
  document.getElementById('schedule-group-filter').onchange = renderSchedule;

  function updateViewButtons() {
    document.querySelectorAll('.schedule-view-btn').forEach(b => b.classList.remove('active'));
    document.getElementById(`schedule-${viewMode}-view`).classList.add('active');
  }

  document.getElementById('schedule-add-btn').onclick = () => {
    showClassForm('Добавить', {}, trainers, groups, rooms, clients, subscriptions, async data => {
      const classes = [];
      if (data.days_of_week?.length) {
        const start = new Date(data.date);
        const end = new Date(start); end.setMonth(start.getMonth() + 1);
        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
          if (data.days_of_week.includes(['Вс','Пн','Вт','Ср','Чт','Пт','Сб'][d.getDay()])) {
            classes.push({ ...data, date: formatDate(d) });
          }
        }
      } else classes.push(data);

      let ok = true;
      for (const c of classes) if (!await addSchedule(c)) ok = false;
      if (ok) renderSchedule();
    });
  };

  scheduleContainer.onclick = e => {
    const el = e.target.closest('.schedule-class');
    if (el && !window.getSelection().toString()) showClassDetails(el.dataset.id);
  };

  await renderSchedule();
  updateViewButtons();
}

// === ТОСТЫ ===
export function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => toast.classList.add('show'), 100);
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}
