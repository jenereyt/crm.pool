// classes.js (no changes, but ensure clientIds are used consistently)
import { getTrainers } from './employees.js';
import { getGroups } from './groups.js';
import { getClients } from './clients.js';
import { scheduleData } from './schedule.js';
import { getRooms } from './rooms.js';
import { getActiveSubscriptions } from './subscriptions.js';

export async function loadClasses() {
  const mainContent = document.getElementById('main-content');
  mainContent.innerHTML = '';

  // Кэшируем данные
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
      ${trainers.map(trainer => `<option value="${escapeHtml(trainer)}">${escapeHtml(trainer)}</option>`).join('')}
    </select>
    <select id="class-group-filter" class="filter-select">
      <option value="">Все группы</option>
      ${groups.map(group => `<option value="${escapeHtml(group)}">${escapeHtml(group)}</option>`).join('')}
    </select>
    <button class="class-add-btn" id="class-add-btn">Добавить занятие</button>
  `;
  mainContent.appendChild(filterBar);

  const classTable = document.createElement('div');
  classTable.className = 'class-table';
  mainContent.appendChild(classTable);

  function getClientFullName(client) {
    if (!client) return 'Без имени';
    const parts = [
      client.surname?.trim() || '',
      client.name?.trim() || '',
      client.patronymic?.trim() || ''
    ].filter(part => part); // Удаляем пустые строки
    return parts.join(' ') || 'Без имени';
  }

  function renderClasses() {
    const dateFilter = document.getElementById('class-date-filter').value;
    const trainerFilter = document.getElementById('class-trainer-filter').value;
    const groupFilter = document.getElementById('class-group-filter').value;

    const filteredClasses = scheduleData
      .filter(cls => (!dateFilter || cls.date === dateFilter) &&
        (!trainerFilter || cls.trainer === trainerFilter) &&
        (!groupFilter || cls.group === groupFilter));

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
          ${filteredClasses.map(cls => `
            <tr class="class-row" data-id="${cls.id}">
              <td>${escapeHtml(cls.name)}</td>
              <td>${escapeHtml(rooms.find(r => r.id === cls.roomId)?.name || 'Не указан')}</td>
              <td>${cls.type === 'group' ? 'Групповой' : cls.type === 'individual' ? 'Индивидуальный' : 'Специальный'}</td>
              <td>${escapeHtml(cls.trainer)}</td>
              <td>${escapeHtml(cls.group || 'Нет группы')}</td>
              <td>${escapeHtml(cls.date)}</td>
              <td>${escapeHtml(cls.startTime)}–${escapeHtml(cls.endTime)}</td>
              <td>
                <button class="class-edit-btn" data-id="${cls.id}">
                  <img src="images/icon-edit.svg" alt="Редактировать" class="action-icon">
                </button>
                <button class="class-delete-btn" data-id="${cls.id}">
                  <img src="images/icon-delete.svg" alt="Удалить" class="action-icon">
                </button>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  }

  renderClasses();

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
                const client = clients.find(c => c.id === clientId);
                return client ? { ...acc, [clientId]: 'Пришёл' } : acc;
              }, {}),
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
          clientIds: data.clientIds || [],
          date: data.date,
          startTime: data.startTime,
          endTime: data.endTime,
          attendance: (data.clientIds || []).reduce((acc, clientId) => {
            const client = clients.find(c => c.id === clientId);
            return client ? { ...acc, [clientId]: 'Пришёл' } : acc;
          }, {}),
          daysOfWeek: data.daysOfWeek || []
        });
      }

      classesToAdd.forEach(cls => scheduleData.push(cls));
      renderClasses();
    });
  });

  classTable.addEventListener('click', async (e) => {
    if (e.target.closest('.class-delete-btn')) {
      const classId = e.target.closest('.class-delete-btn').getAttribute('data-id');
      if (confirm('Удалить занятие?')) {
        scheduleData.splice(scheduleData.findIndex(cls => cls.id === classId), 1);
        renderClasses();
      }
      return;
    }

    if (e.target.closest('.class-edit-btn')) {
      const classId = e.target.closest('.class-edit-btn').getAttribute('data-id');
      const cls = scheduleData.find(cls => cls.id === classId);
      if (trainers.length === 0) {
        alert('Нет доступных тренеров. Добавьте тренеров в разделе "Сотрудники".');
        return;
      }
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
          const client = clients.find(c => c.id === clientId);
          return client ? { ...acc, [clientId]: cls.attendance && cls.attendance[clientId] ? cls.attendance[clientId] : 'Пришёл' } : acc;
        }, {});
        renderClasses();
      });
      return;
    }

    const row = e.target.closest('.class-row');
    if (row && !e.target.closest('td:last-child')) {
      const classId = row.getAttribute('data-id');
      const cls = scheduleData.find(c => c.id === classId);
      if (cls) {
        showJournalModal(cls, clients, subscriptions);
      }
    }
  });

  function showClassForm(title, cls = {}, trainers, groups, rooms, clients, subscriptions, callback) {
    const modal = document.createElement('div');
    modal.className = 'class-modal';
    modal.innerHTML = `
      <div class="class-modal-content">
        <h2>${title}</h2>
        <input type="text" id="class-name" placeholder="Название занятия" value="${escapeHtml(cls.name || '')}" required>
        <select id="class-room" required>
          <option value="">Выберите зал</option>
          ${Array.isArray(rooms) ? rooms.map(room => `<option value="${room.id}" ${cls.roomId === room.id ? 'selected' : ''}>${escapeHtml(room.name)}</option>`).join('') : ''}
        </select>
        <select id="class-type" required>
          <option value="">Выберите тип</option>
          <option value="group" ${cls.type === 'group' ? 'selected' : ''}>Групповой</option>
          <option value="individual" ${cls.type === 'individual' ? 'selected' : ''}>Индивидуальный</option>
          <option value="special" ${cls.type === 'special' ? 'selected' : ''}>Специальный</option>
        </select>
        <select id="class-trainer" required>
          <option value="">Выберите тренера</option>
          ${trainers.map(trainer => `<option value="${escapeHtml(trainer)}" ${cls.trainer === trainer ? 'selected' : ''}>${escapeHtml(trainer)}</option>`).join('')}
        </select>
        <select id="class-group">
          <option value="">Выберите группу (опционально)</option>
          ${groups.map(group => `<option value="${escapeHtml(group)}" ${cls.group === group ? 'selected' : ''}>${escapeHtml(group)}</option>`).join('')}
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
              <button type="button" class="day-button${cls.daysOfWeek?.includes(day) ? ' selected' : ''}" data-day="${day}">${day}</button>
            `).join('')}
          </div>
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

    modal.addEventListener('mousedown', (e) => {
      if (e.target.classList.contains('class-modal') && !window.getSelection().toString()) {
        modal.remove();
      }
    });

    let selectedClientIds = Array.isArray(cls.clientIds) ? cls.clientIds.slice() : [];

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
      const roomId = modal.querySelector('#class-room').value;
      const type = modal.querySelector('#class-type').value;
      const trainer = modal.querySelector('#class-trainer').value;
      const group = modal.querySelector('#class-group').value;
      const daysOfWeek = Array.from(modal.querySelectorAll('.day-button.selected')).map(b => b.getAttribute('data-day'));
      const date = modal.querySelector('#class-date').value;
      const startTime = modal.querySelector('#class-start').value;
      const endTime = modal.querySelector('#class-end').value;

      if (name && roomId && type && trainer && date && startTime && endTime) {
        const start = new Date(`1970-01-01T${startTime}:00`);
        const end = new Date(`1970-01-01T${endTime}:00`);
        if (end <= start) {
          alert('Время окончания должно быть позже времени начала!');
          return;
        }
        callback({ name, roomId, type, trainer, group, clientIds: selectedClientIds, date, startTime, endTime, daysOfWeek });
        modal.remove();
      } else {
        modal.querySelectorAll('input, select').forEach(el => {
          if (!el.value.trim()) el.classList.add('error');
        });
        alert('Заполните все поля корректно!');
      }
    });

    modal.querySelector('#class-cancel-btn').addEventListener('click', () => {
      modal.remove();
    });
  }

  async function showJournalModal(cls, clientsList, subscriptions) {
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
      <p><strong>Дата:</strong> ${escapeHtml(cls.date || '—')} ${cls.startTime ? `, ${escapeHtml(cls.startTime)}–${escapeHtml(cls.endTime)}` : ''}</p>
      <div class="journal-controls">
        <div class="client-search-container">
          <input type="text" id="journal-client-search" placeholder="Поиск по ФИО" aria-label="Поиск клиентов по ФИО">
        </div>
        <select id="journal-batch-action" aria-label="Выберите действие для всех">
          <option value="">Действие для всех</option>
          <option value="Пришёл">Отметить всех: Пришёл</option>
          <option value="Не пришёл">Отметить всех: Не пришёл</option>
          <option value="Опоздал">Отметить всех: Опоздал</option>
          <option value="Отменено">Отметить всех: Отменено</option>
        </select>
      </div>
      <div class="journal-table-container">
        <table class="journal-table">
          <thead>
            <tr>
              <th>Клиент</th>
              <th>Статус</th>
              <th>Подписка</th>
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
    if (Array.isArray(cls.clientIds) && cls.clientIds.length) {
      journalClients = clientsList.filter(c => cls.clientIds.includes(c.id) && (c.surname?.trim() || c.name?.trim() || c.patronymic?.trim()));
    } else if (cls.group) {
      journalClients = clientsList.filter(c => Array.isArray(c.groups) && c.groups.includes(cls.group) && (c.surname?.trim() || c.name?.trim() || c.patronymic?.trim()));
    }

    cls.attendance = cls.attendance || {};
    let originalAttendance = { ...cls.attendance }; // Store original state for undo
    let changedRows = new Set();

    function renderJournal(filter = '') {
      const q = filter.trim().toLowerCase();
      const rows = journalClients
        .filter(c => {
          const fullName = getClientFullName(c).toLowerCase();
          return !q || fullName.includes(q);
        })
        .sort((a, b) => {
          const aName = getClientFullName(a) || '';
          const bName = getClientFullName(b) || '';
          return aName.localeCompare(bName);
        })
        .map(c => {
          const clientId = c.id;
          const fullName = getClientFullName(c);
          const status = cls.attendance[clientId] || 'Пришёл'; // Default to "Пришёл"
          const disabled = c.blacklisted ? 'disabled' : '';
          const blackTag = c.blacklisted ? ' <small>(В чёрном списке)</small>' : '';
          const sub = subscriptions.find(s => s.clientId === c.id);
          const subStatus = sub ? (sub.remainingClasses === Infinity ? '∞' : sub.remainingClasses) : 'Нет';
          const subWarning = sub && sub.remainingClasses < 3 && sub.remainingClasses !== Infinity ? ' <span class="sub-warning" title="Осталось мало занятий">⚠</span>' : '';
          return `
          <tr data-clientid="${escapeHtml(clientId)}" class="${changedRows.has(clientId) ? 'row-changed' : ''}">
            <td>${escapeHtml(fullName)}${blackTag}</td>
            <td>
              <select class="journal-status" data-clientid="${escapeHtml(clientId)}" ${disabled} aria-label="Статус для ${escapeHtml(fullName)}">
                <option value="Пришёл" ${status === 'Пришёл' ? 'selected' : ''}>Пришёл</option>
                <option value="Не пришёл" ${status === 'Не пришёл' ? 'selected' : ''}>Не пришёл</option>
                <option value="Опоздал" ${status === 'Опоздал' ? 'selected' : ''}>Опоздал</option>
                <option value="Отменено" ${status === 'Отменено' ? 'selected' : ''}>Отменено</option>
              </select>
            </td>
            <td>${subStatus}${subWarning}</td>
          </tr>
        `;
        }).join('');
      modal.querySelector('#journal-tbody').innerHTML = rows || '<tr><td colspan="3">Нет клиентов</td></tr>';
    }

    renderJournal();

    modal.querySelector('#journal-client-search').addEventListener('input', (e) => {
      renderJournal(e.target.value);
    });

    modal.querySelector('#journal-batch-action').addEventListener('change', (e) => {
      const value = e.target.value;
      if (value) {
        const selects = modal.querySelectorAll('.journal-status:not([disabled])');
        selects.forEach(select => {
          select.value = value;
          const clientId = select.getAttribute('data-clientid');
          cls.attendance[clientId] = value;
          changedRows.add(clientId);
        });
        renderJournal(modal.querySelector('#journal-client-search').value);
        modal.querySelector('#journal-undo-btn').disabled = false;
        e.target.value = ''; // Reset dropdown
      }
    });

    modal.querySelector('#journal-tbody').addEventListener('change', (e) => {
      if (e.target.classList.contains('journal-status')) {
        const clientId = e.target.getAttribute('data-clientid');
        cls.attendance[clientId] = e.target.value;
        changedRows.add(clientId);
        renderJournal(modal.querySelector('#journal-client-search').value);
        modal.querySelector('#journal-undo-btn').disabled = false;
      }
    });

    modal.querySelector('#journal-undo-btn').addEventListener('click', () => {
      cls.attendance = { ...originalAttendance };
      changedRows.clear();
      renderJournal(modal.querySelector('#journal-client-search').value);
      modal.querySelector('#journal-undo-btn').disabled = true;
    });

    modal.querySelector('#journal-save-btn').addEventListener('click', async () => {
      const significantChanges = Object.values(cls.attendance).filter(status => status === 'Не пришёл' || status === 'Отменено').length > journalClients.length / 2;
      if (significantChanges && !confirm('Многие клиенты отмечены как "Не пришёл" или "Отменено". Сохранить изменения?')) {
        return;
      }

      modal.querySelector('#journal-save-status').textContent = 'Сохранение...';
      const subs = await getActiveSubscriptions();
      for (const clientId in cls.attendance) {
        if (cls.attendance[clientId] === 'Пришёл') {
          const clientObj = clientsList.find(c => c.id === clientId);
          if (clientObj) {
            const sub = subs.find(s => s.clientId === clientObj.id && s.remainingClasses !== Infinity);
            if (sub && typeof sub.remainingClasses === 'number' && sub.remainingClasses > 0) {
              sub.remainingClasses -= 1;
            }
          }
        }
      }

      originalAttendance = { ...cls.attendance }; // Update original state
      changedRows.clear();
      modal.querySelector('#journal-undo-btn').disabled = true;
      modal.querySelector('#journal-save-status').textContent = 'Сохранено!';
      setTimeout(() => {
        modal.querySelector('#journal-save-status').textContent = '';
        renderClasses();
        modal.remove();
      }, 1000);
    });

    modal.querySelector('#journal-close-btn').addEventListener('click', () => modal.remove());
    modal.querySelector('.journal-close-btn').addEventListener('click', () => modal.remove());

    // Keyboard navigation
    modal.querySelectorAll('.journal-status').forEach((select, index, selects) => {
      select.addEventListener('keydown', (e) => {
        if (e.key === 'Tab' && !e.shiftKey && index === selects.length - 1) {
          modal.querySelector('#journal-save-btn').focus();
          e.preventDefault();
        }
      });
    });
  }

  function showClientPickerModal(clientsList, subscriptions, selectedClientIds, callback) {
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
        .sort((a, b) => {
          const aName = getClientFullName(a) || '';
          const bName = getClientFullName(b) || '';
          return aName.localeCompare(bName);
        })
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
            if (!currentSelected.includes(clientId)) {
              currentSelected.push(clientId);
              row.classList.add('selected');
            }
          } else {
            currentSelected = currentSelected.filter(id => id !== clientId);
            row.classList.remove('selected');
          }
          // Обновляем таблицу для синхронизации визуального состояния
          renderClientTable(modal.querySelector('#client-picker-search').value);
        }
      }
    });

    modal.querySelector('#client-picker-tbody').addEventListener('change', (e) => {
      if (e.target.type === 'checkbox') {
        const clientId = e.target.value;
        const row = e.target.closest('tr');
        if (e.target.checked) {
          if (!currentSelected.includes(clientId)) {
            currentSelected.push(clientId);
            row.classList.add('selected');
          }
        } else {
          currentSelected = currentSelected.filter(id => id !== clientId);
          row.classList.remove('selected');
        }
        // Обновляем таблицу для синхронизации визуального состояния
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

  function formatDate(date) {
    return date.toISOString().split('T')[0];
  }

  function escapeHtml(s) {
    if (!s) return '';
    return String(s).replace(/[&<>"']/g, (m) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
  }
}

export function getClasses() {
  return scheduleData ? scheduleData.map(cls => cls.name) : [];
}
