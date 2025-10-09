import { getTrainers } from './employees.js';
import { getGroups, getGroupByName } from './groups.js';
import { getClients } from './clients.js';
import { getRooms } from './rooms.js';
import { getActiveSubscriptions } from './subscriptions.js';
import { getSchedules, addSchedule, updateSchedule, deleteSchedule } from './schedule.js';

export function getClientFullName(client) {
  if (!client) return 'Без имени';
  const parts = [
    client.surname?.trim() || '',
    client.name?.trim() || '',
    client.patronymic?.trim() || ''
  ].filter(part => part);
  return parts.join(' ') || 'Без имени';
}

export function formatDate(date) {
  return date.toISOString().split('T')[0];
}

export function escapeHtml(s) {
  if (!s) return '';
  return String(s).replace(/[&<>"']/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
}

export function showClassForm(title, cls = {}, trainers, groups, rooms, clients, subscriptions, callback) {
  console.log('Trainers received in showClassForm:', trainers);
  if (!Array.isArray(trainers) || trainers.length === 0) {
    console.error('No trainers available for form:', trainers);
    alert('Ошибка: Тренеры не загружены. Проверьте раздел "Сотрудники".');
    return;
  }

  if (!rooms || !Array.isArray(rooms)) {
    console.error('Залы не являются массивом:', rooms);
    alert('Ошибка: Залы не загружены. Попробуйте позже.');
    return;
  }

  const modal = document.createElement('div');
  modal.className = 'class-modal';
  modal.innerHTML = `
    <div class="class-modal-content">
      <h2>${escapeHtml(title)}</h2>
      <input type="text" id="class-name" placeholder="Название занятия" value="${escapeHtml(cls.name || '')}" required>
      <select id="class-room" required>
        <option value="">Выберите зал</option>
        ${rooms && Array.isArray(rooms) ? rooms.map(room => `<option value="${room.id}" ${cls.room_id === room.id ? 'selected' : ''}>${escapeHtml(room.name)}</option>`).join('') : '<option value="" disabled>Залы не загружены</option>'}
      </select>
      <select id="class-type" required>
        <option value="">Выберите тип</option>
        <option value="group" ${cls.type === 'group' ? 'selected' : ''}>Групповой</option>
        <option value="individual" ${cls.type === 'individual' ? 'selected' : ''}>Индивидуальный</option>
        <option value="special" ${cls.type === 'special' ? 'selected' : ''}>Специальный</option>
      </select>
      <select id="class-trainer" required>
        <option value="">Выберите тренера</option>
        ${Array.isArray(trainers) ? trainers.map(trainer => {
    const trainerId = trainer.id || '';
    const trainerName = trainer.name || 'Без имени';
    console.log('Rendering trainer:', { id: trainerId, name: trainerName });
    return `<option value="${escapeHtml(trainerId)}" ${cls.trainer_id === trainerId ? 'selected' : ''}>${escapeHtml(trainerName)}</option>`;
  }).join('') : '<option value="" disabled>Тренеры не загружены</option>'}
      </select>
      <select id="class-group">
        <option value="">Выберите группу (опционально)</option>
        ${Array.isArray(groups) ? groups.map(group => `<option value="${group.id}" ${cls.group_id === group.id ? 'selected' : ''}>${escapeHtml(group.name)}</option>`).join('') : ''}
      </select>
      <button id="class-select-clients-btn">Выбрать клиентов</button>
      <div id="class-selected-clients" class="selected-clients">
        <label>Выбранные клиенты:</label>
        <div class="selected-chips"></div>
      </div>
      <div class="days-of-week">
        <label>Дни недели:</label>
        <div class="days-of-week-buttons">
          ${['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map(day => `
            <button type="button" class="day-button${cls.days_of_week?.includes(day) ? ' selected' : ''}" data-day="${day}">${day}</button>
          `).join('')}
        </div>
      </div>
      <input type="date" id="class-date" value="${cls.date || '2025-10-09'}" required>
      <input type="time" id="class-start" value="${cls.start_time || ''}" required>
      <input type="time" id="class-end" value="${cls.end_time || ''}" required>
      <div class="class-modal-actions">
        <button id="class-save-btn">Сохранить</button>
        <button id="class-cancel-btn">Отмена</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);

  modal.addEventListener('mousedown', (e) => {
    if (e.target.classList.contains('class-modal') && !window.getSelection().toString()) {
      modal.remove();
    }
  });

  let selectedClientIds = Array.isArray(cls.client_ids) ? cls.client_ids.slice() : [];

  function renderSelectedClients() {
    const selectedEl = modal.querySelector('.selected-chips');
    selectedEl.innerHTML = selectedClientIds
      .map(clientId => {
        const client = clients.find(c => c.id === clientId);
        if (!client || (!client.surname && !client.name && !client.patronymic)) return '';
        const fullName = getClientFullName(client);
        return `
          <span class="client-chip" data-clientid="${escapeHtml(clientId)}">
            ${escapeHtml(fullName)} <button class="client-remove-btn" data-clientid="${escapeHtml(clientId)}">×</button>
          </span>
        `;
      })
      .filter(chip => chip)
      .join('');
  }

  renderSelectedClients();

  modal.querySelector('.selected-chips').addEventListener('click', (e) => {
    if (e.target.classList.contains('client-remove-btn')) {
      const clientId = e.target.getAttribute('data-clientid');
      selectedClientIds = selectedClientIds.filter(id => id !== clientId);
      renderSelectedClients();
    }
  });

  const groupSelect = modal.querySelector('#class-group');
  groupSelect.addEventListener('change', () => {
    const selectedGroupId = groupSelect.value;
    if (selectedGroupId) {
      const group = groups.find(g => g.id === selectedGroupId);
      if (group && Array.isArray(group.clients)) {
        selectedClientIds = group.clients.map(clientObj => {
          const client = clients.find(c => c.name === clientObj.name);
          return client ? client.id : null;
        }).filter(id => id) || [];
        renderSelectedClients();
      }
    } else {
      selectedClientIds = [];
      renderSelectedClients();
    }
  });

  modal.querySelector('#class-select-clients-btn').addEventListener('click', () => {
    showClientPickerModal(clients, subscriptions, selectedClientIds, (newSelected) => {
      selectedClientIds = newSelected;
      renderSelectedClients();
    });
  });

  modal.querySelectorAll('.day-button').forEach(button => {
    button.addEventListener('click', () => {
      button.classList.toggle('selected');
    });
  });

  modal.querySelector('#class-save-btn').addEventListener('click', async () => {
    const saveButton = modal.querySelector('#class-save-btn');
    saveButton.disabled = true;
    saveButton.textContent = 'Сохранение...';

    const name = modal.querySelector('#class-name').value.trim();
    const room_id = modal.querySelector('#class-room').value;
    const type = modal.querySelector('#class-type').value;
    const trainer_id = modal.querySelector('#class-trainer').value;
    const group_id = modal.querySelector('#class-group').value || '';
    const days_of_week = Array.from(modal.querySelectorAll('.day-button.selected')).map(b => b.getAttribute('data-day'));
    const date = modal.querySelector('#class-date').value;
    const start_time = modal.querySelector('#class-start').value;
    const end_time = modal.querySelector('#class-end').value;

    console.log('Form submission data:', { name, room_id, type, trainer_id, group_id, client_ids: selectedClientIds, date, start_time, end_time, days_of_week });

    if (!name || !room_id || !type || !trainer_id || !date || !start_time || !end_time) {
      modal.querySelectorAll('input, select').forEach(el => {
        if (!el.value.trim()) el.classList.add('error');
      });
      alert('Заполните все обязательные поля корректно!');
      saveButton.disabled = false;
      saveButton.textContent = 'Сохранить';
      return;
    }

    const timeFormat = /^\d{2}:\d{2}$/;
    if (!timeFormat.test(start_time) || !timeFormat.test(end_time)) {
      alert('Время должно быть в формате HH:MM');
      saveButton.disabled = false;
      saveButton.textContent = 'Сохранить';
      return;
    }

    const start = new Date(`1970-01-01T${start_time}:00`);
    const end = new Date(`1970-01-01T${end_time}:00`);
    if (end <= start) {
      alert('Время окончания должно быть позже времени начала!');
      saveButton.disabled = false;
      saveButton.textContent = 'Сохранить';
      return;
    }

    callback({ name, room_id, type, trainer_id, group_id, client_ids: selectedClientIds, date, start_time, end_time, days_of_week });
    saveButton.disabled = false;
    saveButton.textContent = 'Сохранить';
    modal.remove();
  });

  modal.querySelector('#class-cancel-btn').addEventListener('click', () => {
    modal.remove();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      modal.remove();
    }
  }, { once: true });
}

export async function showJournalModal(cls, clientsList, subscriptions, trainers, callback) {
  console.log('Trainers received in showJournalModal:', trainers);
  if (!Array.isArray(trainers)) {
    console.error('Trainers is not an array:', trainers);
    alert('Ошибка: Тренеры не загружены. Проверьте раздел "Сотрудники".');
    return;
  }

  const modal = document.createElement('div');
  modal.className = 'journal-modal';
  modal.setAttribute('role', 'dialog');
  modal.setAttribute('aria-labelledby', 'journal-title');
  modal.innerHTML = `
    <div class="journal-modal-content">
      <div class="journal-header">
        <h2 id="journal-title">Журнал — ${escapeHtml(cls.name || cls.group || 'Занятие')}</h2>
        <button class="journal-close-btn" aria-label="Закрыть модальное окно">×</button>
      </div>
      <p><strong>Дата:</strong> ${escapeHtml(cls.date || '—')} ${cls.start_time ? `, ${escapeHtml(cls.start_time)}–${escapeHtml(cls.end_time)}` : ''}</p>
      <p><strong>Тренер:</strong> ${trainers.find(t => t.id === cls.trainer_id)?.name || 'Не указан'}</p>
      <div class="journal-controls">
        <div class="client-search-container">
          <input type="text" id="journal-client-search" placeholder="Поиск по ФИО" aria-label="Поиск клиентов по ФИО">
        </div>
        <select id="journal-batch-action" aria-label="Выберите действие для всех">
          <option value="">Действие для всех</option>
          <option value="present">Отметить всех: Присутствовал</option>
          <option value="absent-nonrespect">Отметить всех: Не пришёл (неуважительная)</option>
          <option value="absent-respect">Отметить всех: Не пришёл (уважительная)</option>
          <option value="canceled">Отметить всех: Отменено</option>
        </select>
      </div>
      <div class="journal-table-container">
        <table class="journal-table">
          <thead>
            <tr>
              <th><input type="checkbox" id="batch-present-checkbox" aria-label="Отметить всех присутствующими"></th>
              <th>Клиент</th>
              <th>Абонемент</th>
              <th>Причина отсутствия</th>
            </tr>
          </thead>
          <tbody id="journal-tbody"></tbody>
        </table>
      </div>
      <div class="journal-actions">
        <span id="journal-save-status" class="save-status"></span>
        <button id="journal-undo-btn" disabled>Отменить изменения</button>
        <button id="journal-save-btn">Сохранить</button>
        <button id="journal-close-btn">Закрыть</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);

  modal.addEventListener('mousedown', (e) => {
    if (e.target.classList.contains('journal-modal') && !window.getSelection().toString()) {
      modal.remove();
    }
  });

  let journalClients = [];
  if (Array.isArray(cls.client_ids) && cls.client_ids.length) {
    journalClients = clientsList.filter(c => cls.client_ids.includes(c.id) && (c.surname?.trim() || c.name?.trim() || c.patronymic?.trim()));
  } else if (cls.group) {
    journalClients = clientsList.filter(c => Array.isArray(c.groups) && c.groups.includes(cls.group) && (c.surname?.trim() || c.name?.trim() || c.patronymic?.trim()));
  }

  cls.attendance = cls.attendance || {};
  for (const clientId in cls.attendance) {
    const oldStatus = cls.attendance[clientId];
    if (typeof oldStatus === 'string') {
      if (oldStatus === 'Пришёл') {
        cls.attendance[clientId] = { present: true, reason: null };
      } else if (oldStatus === 'Не пришёл') {
        cls.attendance[clientId] = { present: false, reason: 'Неуважительная' };
      } else if (oldStatus === 'Отменено') {
        cls.attendance[clientId] = { present: false, reason: 'Отменено' };
      } else {
        cls.attendance[clientId] = { present: true, reason: null };
      }
    }
  }

  let originalAttendance = JSON.parse(JSON.stringify(cls.attendance));
  let changedRows = new Set();

  function renderJournal(filter = '') {
    const q = filter.trim().toLowerCase();
    const rows = journalClients
      .filter(c => {
        const fullName = getClientFullName(c).toLowerCase();
        return !q || fullName.includes(q);
      })
      .sort((a, b) => getClientFullName(a).localeCompare(getClientFullName(b)))
      .map(c => {
        const clientId = c.id;
        const att = cls.attendance[clientId] || { present: true, reason: null };
        const fullName = getClientFullName(c);
        const disabled = c.blacklisted ? 'disabled' : '';
        const blackTag = c.blacklisted ? ' <small>(В чёрном списке)</small>' : '';
        const sub = subscriptions.find(s => s.clientId === c.id);
        let remaining;
        if (sub) {
          remaining = sub.remainingClasses !== undefined ? sub.remainingClasses : '∞';
        } else {
          remaining = 'Нет';
        }
        return `
          <tr data-clientid="${clientId}">
            <td><input type="checkbox" class="present-checkbox" ${att.present ? 'checked' : ''} ${disabled} aria-label="Присутствие ${fullName}"></td>
            <td>${escapeHtml(fullName)}${blackTag}</td>
            <td>${remaining}</td>
            <td>
              <select class="absence-reason" ${att.present ? 'disabled' : ''} aria-label="Причина отсутствия ${fullName}">
                <option value="" ${!att.reason ? 'selected' : ''}>Выберите причину</option>
                <option value="Неуважительная" ${att.reason === 'Неуважительная' ? 'selected' : ''}>Неуважительная</option>
                <option value="Уважительная" ${att.reason === 'Уважительная' ? 'selected' : ''}>Уважительная</option>
                <option value="Отменено" ${att.reason === 'Отменено' ? 'selected' : ''}>Отменено</option>
              </select>
            </td>
          </tr>
        `;
      });
    modal.querySelector('#journal-tbody').innerHTML = rows.join('');
  }

  renderJournal();

  modal.querySelector('#journal-client-search').addEventListener('input', (e) => {
    renderJournal(e.target.value);
  });

  modal.querySelector('#batch-present-checkbox').addEventListener('change', (e) => {
    const checked = e.target.checked;
    modal.querySelectorAll('.present-checkbox:not(:disabled)').forEach(cb => {
      cb.checked = checked;
      const row = cb.closest('tr');
      const clientId = row.getAttribute('data-clientid');
      const select = row.querySelector('.absence-reason');
      cls.attendance[clientId] = { present: checked, reason: checked ? null : select.value || null };
      select.disabled = checked;
      changedRows.add(clientId);
      modal.querySelector('#journal-undo-btn').disabled = changedRows.size === 0;
    });
  });

  modal.querySelector('#journal-tbody').addEventListener('change', (e) => {
    const row = e.target.closest('tr');
    const clientId = row.getAttribute('data-clientid');
    if (e.target.classList.contains('present-checkbox')) {
      cls.attendance[clientId] = { present: e.target.checked, reason: e.target.checked ? null : row.querySelector('.absence-reason').value || null };
      row.querySelector('.absence-reason').disabled = e.target.checked;
    } else if (e.target.classList.contains('absence-reason')) {
      cls.attendance[clientId] = { present: false, reason: e.target.value || null };
    }
    changedRows.add(clientId);
    modal.querySelector('#journal-undo-btn').disabled = changedRows.size === 0;
  });

  modal.querySelector('#journal-batch-action').addEventListener('change', (e) => {
    const action = e.target.value;
    if (!action) return;
    modal.querySelectorAll('.present-checkbox:not(:disabled)').forEach(cb => {
      const row = cb.closest('tr');
      const clientId = row.getAttribute('data-clientid');
      const select = row.querySelector('.absence-reason');
      if (action === 'present') {
        cb.checked = true;
        select.disabled = true;
        cls.attendance[clientId] = { present: true, reason: null };
      } else if (action === 'absent-nonrespect') {
        cb.checked = false;
        select.disabled = false;
        select.value = 'Неуважительная';
        cls.attendance[clientId] = { present: false, reason: 'Неуважительная' };
      } else if (action === 'absent-respect') {
        cb.checked = false;
        select.disabled = false;
        select.value = 'Уважительная';
        cls.attendance[clientId] = { present: false, reason: 'Уважительная' };
      } else if (action === 'canceled') {
        cb.checked = false;
        select.disabled = false;
        select.value = 'Отменено';
        cls.attendance[clientId] = { present: false, reason: 'Отменено' };
      }
      changedRows.add(clientId);
    });
    modal.querySelector('#journal-undo-btn').disabled = changedRows.size === 0;
    e.target.value = '';
    renderJournal(modal.querySelector('#journal-client-search').value);
  });

  modal.querySelector('#journal-undo-btn').addEventListener('click', () => {
    cls.attendance = JSON.parse(JSON.stringify(originalAttendance));
    changedRows.clear();
    modal.querySelector('#journal-undo-btn').disabled = true;
    renderJournal(modal.querySelector('#journal-client-search').value);
  });

  modal.querySelector('#journal-save-btn').addEventListener('click', async () => {
    const saveButton = modal.querySelector('#journal-save-btn');
    saveButton.disabled = true;
    saveButton.textContent = 'Сохранение...';
    const saveStatus = modal.querySelector('#journal-save-status');
    saveStatus.textContent = 'Сохранение...';
    try {
      await callback(cls.attendance);
      saveStatus.textContent = 'Сохранено!';
      setTimeout(() => {
        modal.remove();
      }, 1000);
    } catch (error) {
      console.error('Error saving journal:', error);
      saveStatus.textContent = 'Ошибка при сохранении!';
      saveButton.disabled = false;
      saveButton.textContent = 'Сохранить';
    }
  });

  modal.querySelector('#journal-close-btn').addEventListener('click', () => {
    modal.remove();
  });

  modal.querySelector('.journal-close-btn').addEventListener('click', () => {
    modal.remove();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      modal.remove();
    }
  }, { once: true });
}

export async function loadClasses() {
  const mainContent = document.getElementById('main-content');
  mainContent.innerHTML = '';

  const header = document.createElement('header');
  header.className = 'header';
  header.innerHTML = `
    <h1><img src="./images/icon-classes.svg" alt="Занятия"> Занятия</h1>
  `;
  mainContent.appendChild(header);

  const filterBar = document.createElement('div');
  filterBar.className = 'filter-bar';
  filterBar.innerHTML = `
    <input type="date" id="class-date-filter" class="filter-date" value="2025-10-09">
    <select id="class-trainer-filter" class="filter-select">
      <option value="">Все тренеры</option>
    </select>
    <select id="class-group-filter" class="filter-select">
      <option value="">Все группы</option>
    </select>
    <button class="class-add-btn" id="class-add-btn">Добавить занятие</button>
  `;
  mainContent.appendChild(filterBar);

  const classTable = document.createElement('div');
  classTable.className = 'class-table';
  mainContent.appendChild(classTable);

  // Предзагрузка данных
  console.log('Предзагрузка данных для занятий...');
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

  const trainerSelect = document.getElementById('class-trainer-filter');
  trainerSelect.innerHTML += trainers.map(trainer => `<option value="${trainer.id}">${escapeHtml(trainer.name)}</option>`).join('');

  const groupSelect = document.getElementById('class-group-filter');
  groupSelect.innerHTML += groups.map(group => `<option value="${group.id}">${escapeHtml(group.name)}</option>`).join('');

  function renderClasses() {
    const dateFilter = document.getElementById('class-date-filter').value;
    const trainerFilter = document.getElementById('class-trainer-filter').value;
    const groupFilter = document.getElementById('class-group-filter').value;

    getSchedules().then(classes => {
      const filteredClasses = classes.filter(cls => {
        return (!dateFilter || cls.date === dateFilter) &&
          (!trainerFilter || cls.trainer_id === trainerFilter) &&
          (!groupFilter || cls.group_id === groupFilter);
      });

      classTable.innerHTML = `
        <table>
          <thead>
            <tr>
              <th>Название</th>
              <th>Дата</th>
              <th>Время</th>
              <th>Зал</th>
              <th>Тип</th>
              <th>Тренер</th>
              <th>Группа</th>
              <th>Клиенты</th>
              <th>Действия</th>
            </tr>
          </thead>
          <tbody>
            ${filteredClasses.map(cls => {
        const room = rooms.find(r => r.id === cls.room_id);
        const trainer = trainers.find(t => t.id === cls.trainer_id);
        const group = groups.find(g => g.id === cls.group_id);
        return `
                <tr class="class-row" data-id="${cls.id}">
                  <td>${escapeHtml(cls.name)}</td>
                  <td>${escapeHtml(cls.date)}</td>
                  <td>${escapeHtml(cls.start_time)}–${escapeHtml(cls.end_time)}</td>
                  <td>${room ? escapeHtml(room.name) : 'Не указан'}</td>
                  <td>${cls.type === 'group' ? 'Групповой' : cls.type === 'individual' ? 'Индивидуальный' : 'Специальный'}</td>
                  <td>${trainer ? escapeHtml(trainer.name) : 'Не указан'}</td>
                  <td>${group ? escapeHtml(group.name) : 'Нет группы'}</td>
                  <td>${cls.client_ids.length ? cls.client_ids.map(id => {
          const client = clients.find(c => c.id === id);
          return client ? escapeHtml(getClientFullName(client)) : 'Неизвестный клиент';
        }).join(', ') : 'Нет клиентов'}</td>
                  <td>
                    <button class="class-edit-btn" data-id="${cls.id}">
                      <img src="images/icon-edit.svg" alt="Редактировать" class="action-icon">
                    </button>
                    <button class="class-attendance-btn" data-id="${cls.id}">
                      <img src="images/icon-schedule.svg" alt="Журнал" class="action-icon">
                    </button>
                    <button class="class-delete-btn" data-id="${cls.id}">
                      <img src="images/trash.svg" alt="Удалить" class="action-icon">
                    </button>
                  </td>
                </tr>
              `;
      }).join('')}
          </tbody>
        </table>
      `;
    });
  }

  renderClasses();

  document.getElementById('class-date-filter').addEventListener('change', renderClasses);
  document.getElementById('class-trainer-filter').addEventListener('change', renderClasses);
  document.getElementById('class-group-filter').addEventListener('change', renderClasses);

  document.getElementById('class-add-btn').addEventListener('click', () => {
    if (window.getSelection().toString().length > 0) return;
    if (trainers.length === 0) {
      alert('Нет доступных тренеров. Добавьте тренеров в разделе "Сотрудники".');
      return;
    }
    showClassForm('Добавить занятие', {}, trainers, groups, rooms, clients, subscriptions, async (data) => {
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
        renderClasses();
      }
    });
  });

  classTable.addEventListener('click', async (e) => {
    if (window.getSelection().toString().length > 0) return;
    if (e.target.closest('.class-delete-btn')) {
      const classId = e.target.closest('.class-delete-btn').getAttribute('data-id');
      if (confirm('Удалить занятие?')) {
        const success = await deleteSchedule(classId);
        if (success) {
          renderClasses();
        }
      }
    } else if (e.target.closest('.class-edit-btn')) {
      const classId = e.target.closest('.class-edit-btn').getAttribute('data-id');
      const cls = await getSchedules().then(classes => classes.find(c => c.id === classId));
      if (cls) {
        showClassForm('Редактировать занятие', cls, trainers, groups, rooms, clients, subscriptions, async (data) => {
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
          const result = await updateSchedule(classId, updatedData);
          if (result) {
            renderClasses();
          }
        });
      }
    } else if (e.target.closest('.class-attendance-btn')) {
      const classId = e.target.closest('.class-attendance-btn').getAttribute('data-id');
      const cls = await getSchedules().then(classes => classes.find(c => c.id === classId));
      if (cls) {
        showJournalModal(cls, clients, subscriptions, trainers, async (attendance) => {
          const result = await updateSchedule(cls.id, { ...cls, attendance });
          if (result) {
            renderClasses();
          }
        });
      }
    }
  });
}

export function showClientPickerModal(clients, subscriptions, selectedClientIds, callback) {
  const modal = document.createElement('div');
  modal.className = 'client-picker-modal';
  modal.innerHTML = `
    <div class="client-picker-modal-content">
      <h2>Выбрать клиентов</h2>
      <input type="text" id="client-picker-search" placeholder="Поиск по ФИО" aria-label="Поиск клиентов по ФИО">
      <div class="client-picker-table">
        <table>
          <thead>
            <tr>
              <th><input type="checkbox" id="client-picker-select-all" aria-label="Выбрать всех клиентов"></th>
              <th>Клиент</th>
              <th>Абонемент</th>
            </tr>
          </thead>
          <tbody id="client-picker-tbody"></tbody>
        </table>
      </div>
      <div class="client-picker-actions">
        <button id="client-picker-save-btn">Сохранить</button>
        <button id="client-picker-cancel-btn">Отмена</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);

  function renderClients(filter = '') {
    const q = filter.trim().toLowerCase();
    const rows = clients
      .filter(c => {
        const fullName = getClientFullName(c).toLowerCase();
        return !q || fullName.includes(q);
      })
      .sort((a, b) => getClientFullName(a).localeCompare(getClientFullName(b)))
      .map(c => {
        const clientId = c.id;
        const fullName = getClientFullName(c);
        const disabled = c.blacklisted ? 'disabled' : '';
        const blackTag = c.blacklisted ? ' <small>(В чёрном списке)</small>' : '';
        const sub = subscriptions.find(s => s.clientId === c.id);
        let remaining;
        if (sub) {
          remaining = sub.remainingClasses !== undefined ? sub.remainingClasses : '∞';
        } else {
          remaining = 'Нет';
        }
        return `
          <tr data-clientid="${clientId}">
            <td><input type="checkbox" class="client-checkbox" ${selectedClientIds.includes(clientId) ? 'checked' : ''} ${disabled} aria-label="Выбрать ${fullName}"></td>
            <td>${escapeHtml(fullName)}${blackTag}</td>
            <td>${remaining}</td>
          </tr>
        `;
      });
    modal.querySelector('#client-picker-tbody').innerHTML = rows.join('');
  }

  renderClients();

  modal.querySelector('#client-picker-search').addEventListener('input', (e) => {
    renderClients(e.target.value);
  });

  modal.querySelector('#client-picker-select-all').addEventListener('change', (e) => {
    const checked = e.target.checked;
    modal.querySelectorAll('.client-checkbox:not(:disabled)').forEach(cb => {
      cb.checked = checked;
    });
  });

  modal.querySelector('#client-picker-tbody').addEventListener('change', (e) => {
    if (e.target.classList.contains('client-checkbox')) {
      const allChecked = Array.from(modal.querySelectorAll('.client-checkbox:not(:disabled)')).every(cb => cb.checked);
      modal.querySelector('#client-picker-select-all').checked = allChecked;
    }
  });

  modal.querySelector('#client-picker-save-btn').addEventListener('click', () => {
    const newSelected = Array.from(modal.querySelectorAll('.client-checkbox:checked')).map(cb => cb.closest('tr').getAttribute('data-clientid'));
    callback(newSelected);
    modal.remove();
  });

  modal.querySelector('#client-picker-cancel-btn').addEventListener('click', () => {
    modal.remove();
  });

  modal.addEventListener('mousedown', (e) => {
    if (e.target.classList.contains('client-picker-modal') && !window.getSelection().toString()) {
      modal.remove();
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      modal.remove();
    }
  }, { once: true });
}
