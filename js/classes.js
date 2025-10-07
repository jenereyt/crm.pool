// classes.js (исправленная версия)

// Импорты остаются без изменений
import { getTrainers } from './employees.js';
import { getGroups, getGroupByName } from './groups.js';
import { getClients } from './clients.js';
import { getRooms } from './rooms.js';
import { getActiveSubscriptions } from './subscriptions.js';
import { getSchedules, addSchedule, updateSchedule, deleteSchedule } from './schedule.js'; // Импортируем функции для работы с API

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
  if (!rooms || !Array.isArray(rooms)) {
    console.error('Залы не являются массивом:', rooms);
    alert('Ошибка: Залы не загружены. Попробуйте позже.');
    return;
  }

  const modal = document.createElement('div');
  modal.className = 'class-modal';
  modal.innerHTML = `
    <div class="class-modal-content">
      <h2>${title}</h2>
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
        ${Array.isArray(trainers) ? trainers.map(trainer => `<option value="${escapeHtml(trainer)}" ${cls.trainer === trainer ? 'selected' : ''}>${escapeHtml(trainer)}</option>`).join('') : ''}
      </select>
      <select id="class-group">
        <option value="">Выберите группу (опционально)</option>
        ${Array.isArray(groups) ? groups.map(group => `<option value="${escapeHtml(group)}" ${cls.group === group ? 'selected' : ''}>${escapeHtml(group)}</option>`).join('') : ''}
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
      <input type="date" id="class-date" value="${cls.date || ''}" required>
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
    const selectedGroup = groupSelect.value;
    if (selectedGroup) {
      const group = getGroupByName(selectedGroup);
      if (group) {
        selectedClientIds = group.clients.map(clientObj => {
          const client = clients.find(c => c.name === clientObj.name);
          return client ? client.id : null;
        }).filter(id => id);
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

  modal.querySelector('#class-save-btn').addEventListener('click', () => {
    const name = modal.querySelector('#class-name').value.trim();
    const room_id = modal.querySelector('#class-room').value;
    const type = modal.querySelector('#class-type').value;
    const trainer = modal.querySelector('#class-trainer').value;
    const group = modal.querySelector('#class-group').value || '';
    const days_of_week = Array.from(modal.querySelectorAll('.day-button.selected')).map(b => b.getAttribute('data-day'));
    const date = modal.querySelector('#class-date').value;
    const start_time = modal.querySelector('#class-start').value;
    const end_time = modal.querySelector('#class-end').value;

    if (!name || !room_id || !type || !trainer || !date || !start_time || !end_time) {
      modal.querySelectorAll('input, select').forEach(el => {
        if (!el.value.trim()) el.classList.add('error');
      });
      alert('Заполните все обязательные поля корректно!');
      return;
    }

    // Проверка формата времени
    const timeFormat = /^\d{2}:\d{2}$/;
    if (!timeFormat.test(start_time) || !timeFormat.test(end_time)) {
      alert('Время должно быть в формате HH:MM');
      return;
    }

    // Проверка, что end_time позже start_time
    const start = new Date(`1970-01-01T${start_time}:00`);
    const end = new Date(`1970-01-01T${end_time}:00`);
    if (end <= start) {
      alert('Время окончания должно быть позже времени начала!');
      return;
    }

    callback({ name, room_id, type, trainer, group, client_ids: selectedClientIds, date, start_time, end_time, days_of_week });
    modal.remove();
  });

  modal.querySelector('#class-cancel-btn').addEventListener('click', () => {
    modal.remove();
  });
}

export async function showJournalModal(cls, clientsList, subscriptions, callback) {
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
      <p><strong>Тренер:</strong> ${escapeHtml(cls.trainer || 'Не указан')}</p>
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
          remaining = sub.remainingClasses === Infinity ? '∞' : sub.remainingClasses;
        }
        const ostClass = remaining === 0 ? 'ost-zero' : remaining === 1 ? 'ost-low' : '';
        const ostText = sub ? ` (${remaining} ост.)` : '';
        const subText = sub ? (sub.remainingClasses === Infinity ? 'Безлимит' : sub.remainingClasses > 0 ? `Абонемент (${sub.remainingClasses})` : 'Закончился') : 'Нет';
        const reasonOptions = `
          <select class="journal-reason" data-clientid="${escapeHtml(clientId)}" ${disabled} aria-label="Причина отсутствия для ${escapeHtml(fullName)}" ${att.present ? 'style="display:none;"' : ''}>
            <option value="Неуважительная" ${att.reason === 'Неуважительная' ? 'selected' : ''}>Неуважительная</option>
            <option value="Уважительная" ${att.reason === 'Уважительная' ? 'selected' : ''}>Уважительная</option>
            <option value="Отменено" ${att.reason === 'Отменено' ? 'selected' : ''}>Отменено</option>
          </select>
        `;
        return `
          <tr data-clientid="${escapeHtml(clientId)}" class="${changedRows.has(clientId) ? 'row-changed' : ''}">
            <td>
              <input type="checkbox" class="present-checkbox" data-clientid="${escapeHtml(clientId)}" ${att.present ? 'checked' : ''} ${disabled} aria-label="Присутствовал ${escapeHtml(fullName)}">
            </td>
            <td>${escapeHtml(fullName)}${blackTag}<span class="${ostClass}">${ostText}</span></td>
            <td>${subText}</td>
            <td>${att.present ? '—' : reasonOptions}</td>
          </tr>
        `;
      }).join('');
    modal.querySelector('#journal-tbody').innerHTML = rows || '<tr><td colspan="4">Нет клиентов</td></tr>';

    const allCheckboxes = modal.querySelectorAll('.present-checkbox:not([disabled])');
    const masterCheckbox = modal.querySelector('#batch-present-checkbox');
    const allChecked = Array.from(allCheckboxes).every(cb => cb.checked);
    const someChecked = Array.from(allCheckboxes).some(cb => cb.checked);
    masterCheckbox.checked = allChecked;
    masterCheckbox.indeterminate = someChecked && !allChecked;
  }

  renderJournal();

  modal.querySelector('#journal-client-search').addEventListener('input', (e) => {
    renderJournal(e.target.value);
  });

  modal.querySelector('#journal-batch-action').addEventListener('change', (e) => {
    const value = e.target.value;
    if (value) {
      const checkboxes = modal.querySelectorAll('.present-checkbox:not([disabled])');
      checkboxes.forEach(cb => {
        const clientId = cb.getAttribute('data-clientid');
        let newAtt;
        if (value === 'present') {
          cb.checked = true;
          newAtt = { present: true, reason: null };
        } else {
          cb.checked = false;
          let reason;
          if (value === 'absent-nonrespect') reason = 'Неуважительная';
          else if (value === 'absent-respect') reason = 'Уважительная';
          else if (value === 'canceled') reason = 'Отменено';
          newAtt = { present: false, reason };
        }
        cls.attendance[clientId] = newAtt;
        changedRows.add(clientId);
      });
      renderJournal(modal.querySelector('#journal-client-search').value);
      modal.querySelector('#journal-undo-btn').disabled = false;
      e.target.value = '';
    }
  });

  modal.querySelector('#batch-present-checkbox').addEventListener('change', (e) => {
    const checked = e.target.checked;
    const checkboxes = modal.querySelectorAll('.present-checkbox:not([disabled])');
    checkboxes.forEach(cb => {
      const clientId = cb.getAttribute('data-clientid');
      cb.checked = checked;
      cls.attendance[clientId] = { present: checked, reason: checked ? null : 'Неуважительная' };
      changedRows.add(clientId);
    });
    renderJournal(modal.querySelector('#journal-client-search').value);
    modal.querySelector('#journal-undo-btn').disabled = false;
  });

  modal.querySelector('#journal-tbody').addEventListener('change', (e) => {
    if (e.target.classList.contains('present-checkbox')) {
      const clientId = e.target.getAttribute('data-clientid');
      const present = e.target.checked;
      const att = cls.attendance[clientId] || {};
      att.present = present;
      if (present) att.reason = null;
      else if (!att.reason) att.reason = 'Неуважительная';
      cls.attendance[clientId] = att;
      changedRows.add(clientId);
      renderJournal(modal.querySelector('#journal-client-search').value);
      modal.querySelector('#journal-undo-btn').disabled = false;
      return;
    }
    if (e.target.classList.contains('journal-reason')) {
      const clientId = e.target.getAttribute('data-clientid');
      const att = cls.attendance[clientId] || {};
      att.reason = e.target.value;
      changedRows.add(clientId);
      renderJournal(modal.querySelector('#journal-client-search').value);
      modal.querySelector('#journal-undo-btn').disabled = false;
    }
  });

  modal.querySelector('#journal-undo-btn').addEventListener('click', () => {
    cls.attendance = JSON.parse(JSON.stringify(originalAttendance));
    changedRows.clear();
    renderJournal(modal.querySelector('#journal-client-search').value);
    modal.querySelector('#journal-undo-btn').disabled = true;
  });

  modal.querySelector('#journal-save-btn').addEventListener('click', async () => {
    console.log('Сохранение журнала для занятия:', cls); // Отладка
    const absentCount = Object.values(cls.attendance).filter(att => !att.present).length;
    const significantChanges = absentCount > journalClients.length / 2;
    if (significantChanges && !confirm('Многие клиенты отмечены как отсутствующие. Сохранить изменения?')) {
      return;
    }

    modal.querySelector('#journal-save-status').textContent = 'Сохранение...';
    const subs = await getActiveSubscriptions();
    for (const clientId in cls.attendance) {
      const att = cls.attendance[clientId];
      const shouldDebit = att.present || (!att.present && att.reason === 'Неуважительная');
      if (shouldDebit) {
        const clientObj = clientsList.find(c => c.id === clientId);
        if (clientObj) {
          const sub = subs.find(s => s.clientId === clientObj.id && s.remainingClasses !== Infinity);
          if (sub && typeof sub.remainingClasses === 'number' && sub.remainingClasses > 0) {
            sub.remainingClasses -= 1;
          }
        }
      }
    }

    cls.conducted = true;
    callback(cls); // Передаём обновлённое занятие в callback
    modal.querySelector('#journal-save-status').textContent = 'Сохранено!';
    setTimeout(() => {
      modal.querySelector('#journal-save-status').textContent = '';
      modal.remove();
    }, 1000);
  });

  modal.querySelector('#journal-close-btn').addEventListener('click', () => modal.remove());
  modal.querySelector('.journal-close-btn').addEventListener('click', () => modal.remove());

  modal.querySelectorAll('.present-checkbox, .journal-reason').forEach((el, index, els) => {
    el.addEventListener('keydown', (e) => {
      if (e.key === 'Tab' && !e.shiftKey && index === els.length - 1) {
        modal.querySelector('#journal-save-btn').focus();
        e.preventDefault();
      }
    });
  });
}

export function showConfirmModal(message, callback) {
  const modal = document.createElement('div');
  modal.className = 'modal';
  modal.innerHTML = `
    <div class="modal-content class-confirm-modal">
      <h2>Подтверждение удаления</h2>
      <p>${escapeHtml(message)}</p>
      <div class="modal-actions">
        <button class="btn-primary" id="confirm-btn">Да</button>
        <button class="btn-secondary" id="cancel-btn">Отмена</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);

  modal.querySelector('#confirm-btn').addEventListener('click', () => {
    callback();
    modal.remove();
  });

  modal.querySelector('#cancel-btn').addEventListener('click', () => {
    modal.remove();
  });

  modal.addEventListener('click', (e) => {
    if (e.target === modal) modal.remove();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') modal.remove();
  }, { once: true });
}

export function showClientPickerModal(clientsList, subscriptions, selectedClientIds, callback) {
  const modal = document.createElement('div');
  modal.className = 'client-picker-modal';
  modal.innerHTML = `
    <div class="client-picker-modal-content">
      <h2>Выбор клиентов</h2>
      <div class="client-search-container">
        <input type="text" id="client-picker-search" placeholder="Поиск по ФИО или телефону">
      </div>
      <div class="client-picker-table">
        <table>
          <thead>
            <tr>
              <th></th>
              <th>ФИО</th>
              <th>Телефон</th>
              <th>Статус</th>
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

  modal.addEventListener('mousedown', (e) => {
    if (e.target.classList.contains('client-picker-modal') && !window.getSelection().toString()) {
      modal.remove();
    }
  });

  let currentSelected = [...selectedClientIds];

  function renderClientTable(filter = '') {
    const q = filter.trim().toLowerCase();
    const validClients = clientsList.filter(c => c.id && (c.surname?.trim() || c.name?.trim() || c.patronymic?.trim()));
    const rows = validClients
      .filter(c => {
        const fullName = getClientFullName(c).toLowerCase();
        const phone = (c.phone || '').toLowerCase();
        return !q || fullName.includes(q) || phone.includes(q);
      })
      .sort((a, b) => getClientFullName(a).localeCompare(getClientFullName(b)))
      .map(c => {
        const fullName = getClientFullName(c);
        const hasSubscription = subscriptions.some(s => s.clientId === c.id && s.remainingClasses > 0);
        const status = c.blacklisted ? 'В чёрном списке' : hasSubscription ? 'Активный' : 'Нет подписки';
        const disabled = c.blacklisted ? 'disabled' : '';
        const selectedClass = currentSelected.includes(c.id) ? 'selected' : '';
        return `
          <tr data-clientid="${escapeHtml(c.id)}" class="${!c.blacklisted ? 'selectable' : ''} ${selectedClass}">
            <td>
              <input type="checkbox" value="${escapeHtml(c.id)}" ${currentSelected.includes(c.id) ? 'checked' : ''} ${disabled}>
            </td>
            <td>${escapeHtml(fullName)}</td>
            <td>${escapeHtml(c.phone || '—')}</td>
            <td>${status}</td>
          </tr>
        `;
      }).join('');
    modal.querySelector('#client-picker-tbody').innerHTML = rows || '<tr><td colspan="4">Нет клиентов</td></tr>';
  }

  renderClientTable();

  modal.querySelector('#client-picker-search').addEventListener('input', (e) => {
    renderClientTable(e.target.value);
  });

  modal.querySelector('#client-picker-tbody').addEventListener('click', (e) => {
    const row = e.target.closest('tr.selectable');
    if (row && e.target.type !== 'checkbox') {
      const checkbox = row.querySelector('input[type="checkbox"]');
      if (checkbox && !checkbox.disabled) {
        checkbox.checked = !checkbox.checked;
        const clientId = checkbox.value;
        if (checkbox.checked) {
          if (!currentSelected.includes(clientId)) currentSelected.push(clientId);
          row.classList.add('selected');
        } else {
          currentSelected = currentSelected.filter(id => id !== clientId);
          row.classList.remove('selected');
        }
        renderClientTable(modal.querySelector('#client-picker-search').value);
      }
    }
  });

  modal.querySelector('#client-picker-tbody').addEventListener('change', (e) => {
    if (e.target.type === 'checkbox') {
      const clientId = e.target.value;
      const row = e.target.closest('tr');
      if (e.target.checked) {
        if (!currentSelected.includes(clientId)) currentSelected.push(clientId);
        row.classList.add('selected');
      } else {
        currentSelected = currentSelected.filter(id => id !== clientId);
        row.classList.remove('selected');
      }
      renderClientTable(modal.querySelector('#client-picker-search').value);
    }
  });

  modal.querySelector('#client-picker-save-btn').addEventListener('click', () => {
    callback(currentSelected);
    modal.remove();
  });

  modal.querySelector('#client-picker-cancel-btn').addEventListener('click', () => {
    modal.remove();
  });
}

export async function loadClasses() {
  const mainContent = document.getElementById('main-content');
  mainContent.innerHTML = '';

  const trainers = await getTrainers();
  const groups = await getGroups();
  const rooms = await getRooms();
  const clients = await getClients();
  const subscriptions = await getActiveSubscriptions();

  const header = document.createElement('header');
  header.className = 'header';
  header.innerHTML = `
    <div class="header-content">
      <img src="images/icon-classes.svg" alt="Занятия" class="header-icon">
      <h1>Занятия</h1>
    </div>
  `;
  mainContent.appendChild(header);

  const filterBar = document.createElement('div');
  filterBar.className = 'filter-bar';
  filterBar.innerHTML = `
    <input type="date" id="class-date-filter" class="filter-input">
    <select id="class-trainer-filter" class="filter-select">
      <option value="">Все тренеры</option>
      ${Array.isArray(trainers) ? trainers.map(trainer => `<option value="${escapeHtml(trainer)}">${escapeHtml(trainer)}</option>`).join('') : ''}
    </select>
    <select id="class-group-filter" class="filter-select">
      <option value="">Все группы</option>
      ${Array.isArray(groups) ? groups.map(group => `<option value="${escapeHtml(group)}">${escapeHtml(group)}</option>`).join('') : ''}
    </select>
    <button class="class-add-btn" id="class-add-btn">Добавить занятие</button>
  `;
  mainContent.appendChild(filterBar);

  const classTable = document.createElement('div');
  classTable.className = 'class-table';
  mainContent.appendChild(classTable);

  async function renderClasses() {
    const dateFilter = document.getElementById('class-date-filter').value;
    const trainerFilter = document.getElementById('class-trainer-filter').value;
    const groupFilter = document.getElementById('class-group-filter').value;

    const today = formatDate(new Date());
    const classes = await getSchedules(); // Получаем занятия через API

    console.log('Занятия с conducted: true', classes.filter(cls => cls.conducted)); // Отладка

    const filteredClasses = classes.filter(cls =>
      (!dateFilter || cls.date === dateFilter) &&
      (!trainerFilter || cls.trainer === trainerFilter) &&
      (!groupFilter || cls.group === groupFilter)
    );

    classTable.innerHTML = `
      <table>
        <thead>
          <tr>
            <th>Название</th>
            <th>Зал</th>
            <th>Тип</th>
            <th>Тренер</th>
            <th>Группа</th>
            <th>Дата</th>
            <th>Время</th>
            <th>Действия</th>
          </tr>
        </thead>
        <tbody>
          ${filteredClasses.map(cls => {
      let rowClass = '';
      if (cls.conducted) {
        rowClass = 'conducted';
      } else if (cls.date < today) {
        rowClass = 'pending';
      }
      return `
              <tr class="class-row ${rowClass}" data-id="${cls.id}">
                <td>${escapeHtml(cls.name)}</td>
                <td>${escapeHtml(rooms.find(r => r.id === cls.room_id)?.name || 'Не указан')}</td>
                <td>${cls.type === 'group' ? 'Групповой' : cls.type === 'individual' ? 'Индивидуальный' : 'Специальный'}</td>
                <td>${escapeHtml(cls.trainer)}</td>
                <td>${escapeHtml(cls.group || 'Нет группы')}</td>
                <td>${escapeHtml(cls.date)}</td>
                <td>${escapeHtml(cls.start_time)}–${escapeHtml(cls.end_time)}</td>
                <td>
                  <button class="class-edit-btn" data-id="${cls.id}">
                    <img src="images/icon-edit.svg" alt="Редактировать" class="action-icon">
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
  }

  await renderClasses();

  const dateFilter = document.getElementById('class-date-filter');
  const trainerFilter = document.getElementById('class-trainer-filter');
  const groupFilter = document.getElementById('class-group-filter');
  const addClassBtn = document.getElementById('class-add-btn');

  dateFilter.addEventListener('change', renderClasses);
  trainerFilter.addEventListener('change', renderClasses);
  groupFilter.addEventListener('change', renderClasses);

  addClassBtn.addEventListener('click', () => {
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
              trainer: data.trainer,
              group: data.group,
              client_ids: data.client_ids || [],
              date: formatDate(d),
              start_time: data.start_time,
              end_time: data.end_time,
              days_of_week: data.days_of_week,
              conducted: false
            });
          }
        }
      } else {
        classesToAdd.push({
          name: data.name,
          room_id: data.room_id,
          type: data.type,
          trainer: data.trainer,
          group: data.group,
          client_ids: data.client_ids || [],
          date: data.date,
          start_time: data.start_time,
          end_time: data.end_time,
          days_of_week: data.days_of_week || [],
          conducted: false
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
        await renderClasses();
      }
    });
  });

  classTable.addEventListener('click', async (e) => {
    if (e.target.closest('.class-delete-btn')) {
      const classId = e.target.closest('.class-delete-btn').getAttribute('data-id');
      const cls = (await getSchedules()).find(cls => cls.id === classId);
      showConfirmModal(`Вы точно хотите удалить занятие "${cls.name}"?`, async () => {
        const success = await deleteSchedule(classId);
        if (success) {
          await renderClasses();
        }
      });
      return;
    }

    if (e.target.closest('.class-edit-btn')) {
      const classId = e.target.closest('.class-edit-btn').getAttribute('data-id');
      const cls = (await getSchedules()).find(cls => cls.id === classId);
      if (trainers.length === 0) {
        alert('Нет доступных тренеров. Добавьте тренеров в разделе "Сотрудники".');
        return;
      }
      showClassForm('Редактировать занятие', cls, trainers, groups, rooms, clients, subscriptions, async (data) => {
        const updatedData = {
          name: data.name,
          room_id: data.room_id,
          type: data.type,
          trainer: data.trainer,
          group: data.group,
          client_ids: data.client_ids,
          date: data.date,
          start_time: data.start_time,
          end_time: data.end_time,
          days_of_week: data.days_of_week,
          attendance: data.client_ids.reduce((acc, clientId) => {
            const existing = cls.attendance[clientId] || { present: true, reason: null };
            acc[clientId] = existing;
            return acc;
          }, {}),
          conducted: cls.conducted
        };
        const result = await updateSchedule(classId, updatedData);
        if (result) {
          await renderClasses();
        }
      });
      return;
    }

    const row = e.target.closest('.class-row');
    if (row && !e.target.closest('td:last-child')) {
      const classId = row.getAttribute('data-id');
      const cls = (await getSchedules()).find(c => c.id === classId);
      if (cls) {
        console.log('Открывается журнал для занятия:', cls); // Отладка
        showJournalModal(cls, clients, subscriptions, async (updatedClass) => {
          const result = await updateSchedule(classId, updatedClass);
          if (result) {
            await renderClasses();
          }
        });
      }
    }
  });
}

export async function getClasses() {
  const classes = await getSchedules();
  return classes ? classes.map(cls => cls.name) : [];
}
