// classes.js
import { getTrainers } from './employees.js';
import { getGroups } from './groups.js';
import { getClients } from './clients.js';
import { scheduleData } from './schedule.js';
import { getRooms } from './rooms.js';
import { getActiveSubscriptions } from './subscriptions.js';

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
            ${cls.clients && cls.clients.length ? cls.clients.map(client => {
        const clientData = clients.find(c => c.name === client);
        return `
                <div class="attendance-item">
                  <span>${client}${clientData?.blacklisted ? ' (В чёрном списке)' : ''}</span>
                  <select class="attendance-select" data-client="${client}" data-class-id="${cls.id}" ${clientData?.blacklisted ? 'disabled' : ''}>
                    <option value="Пришёл" ${cls.attendance && cls.attendance[client] === 'Пришёл' ? 'selected' : ''}>Пришёл</option>
                    <option value="Не пришёл" ${cls.attendance && cls.attendance[client] === 'Не пришёл' ? 'selected' : ''}>Не пришёл</option>
                    <option value="Опоздал" ${cls.attendance && cls.attendance[client] === 'Опоздал' ? 'selected' : ''}>Опоздал</option>
                    <option value="Отменено" ${cls.attendance && cls.attendance[client] === 'Отменено' ? 'selected' : ''}>Отменено</option>
                  </select>
                </div>
              `;
      }).join('') : '<p>Нет клиентов</p>'}
          </div>
          <div class="class-actions">
            <button class="class-edit-btn" data-id="${cls.id}">Редактировать</button>
            <button class="class-attendance-btn" data-id="${cls.id}">Отметить посещаемость</button>
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
              clients: data.clients || [],
              date: formatDate(d),
              startTime: data.startTime,
              endTime: data.endTime,
              attendance: (data.clients || []).reduce((acc, client) => ({ ...acc, [client]: 'Пришёл' }), {}),
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
          clients: data.clients || [],
          date: data.date,
          startTime: data.startTime,
          endTime: data.endTime,
          attendance: (data.clients || []).reduce((acc, client) => ({ ...acc, [client]: 'Пришёл' }), {}),
          daysOfWeek: data.daysOfWeek || []
        });
      }

      classesToAdd.forEach(cls => scheduleData.push(cls));
      renderClasses();
    });
  });

  // Обработчик кликов на карточках — удаление/редактирование/отметка; плюс открытие журнала при клике на карточку (не на кнопки)
  classList.addEventListener('click', async (e) => {
    // кнопки (удаление/редактирование/отметка)
    if (e.target.classList.contains('class-delete-btn')) {
      const classId = e.target.getAttribute('data-id');
      if (confirm('Удалить занятие?')) {
        scheduleData.splice(scheduleData.findIndex(cls => cls.id === classId), 1);
        renderClasses();
      }
      return;
    }

    if (e.target.classList.contains('class-edit-btn')) {
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
          [client]: cls.attendance && cls.attendance[client] ? cls.attendance[client] : 'Пришёл'
        }), {});
        renderClasses();
      });
      return;
    }

    if (e.target.classList.contains('class-attendance-btn')) {
      const classId = e.target.getAttribute('data-id');
      const cls = scheduleData.find(cls => cls.id === classId);
      const clientsList = await getClients();
      showAttendanceForm('Отметить посещаемость', cls, clientsList, (attendance) => {
        cls.attendance = attendance;
        renderClasses();
      });
      return;
    }

    // если кликнули по карточке (не по кнопкам) — открываем онлайн-журнал
    const card = e.target.closest('.class-container');
    if (card && !e.target.closest('.class-actions')) {
      const classId = card.getAttribute('data-id');
      const cls = scheduleData.find(c => c.id === classId);
      if (cls) {
        const clientsList = await getClients();
        showJournalModal(cls, clientsList);
      }
    }
  });

  // Обновление select'ов посещаемости (обычный кейс — изменение select внутри карточки)
  classList.addEventListener('change', async (e) => {
    if (e.target.classList.contains('attendance-select')) {
      const classId = e.target.getAttribute('data-class-id');
      const client = e.target.getAttribute('data-client');
      const status = e.target.value;
      const cls = scheduleData.find(cls => cls.id === classId);
      if (cls) {
        cls.attendance = cls.attendance || {};
        cls.attendance[client] = status;
        if (status === 'Пришёл') {
          const clientData = clients.find(c => c.name === client);
          if (clientData) {
            const subs = await getActiveSubscriptions();
            const sub = subs.find(s => s.clientId === clientData.id && s.remainingClasses !== Infinity);
            if (sub && sub.remainingClasses > 0) {
              sub.remainingClasses -= 1;
            }
          }
        }
        renderClasses();
      }
    }
  });

  // --- улучшенная форма добавления/редактирования занятия (с клиент-пикером) ---
  async function showClassForm(title, cls = {}, trainers, groups, rooms, clients, callback) {
    const modal = document.createElement('div');
    modal.className = 'class-modal';
    modal.innerHTML = `
      <div class="class-modal-content">
        <h2>${title}</h2>

        <input type="text" id="class-name" placeholder="Название занятия" value="${cls.name || ''}" required>
        <select id="class-room" required>
          <option value="">Выберите зал</option>
          ${Array.isArray(rooms) ? rooms.map(room => `<option value="${room.id}" ${cls.roomId === room.id ? 'selected' : ''}>${room.name}</option>`).join('') : ''}
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

        <!-- Клиент-пикер: поиск + результаты + выбранные (чипсы) -->
        <div class="client-picker">
          <label>Клиенты:</label>
          <input type="text" id="class-client-search" placeholder="Поиск клиента (имя или телефон)">
          <div id="class-client-results" class="client-results" style="max-height:120px; overflow:auto; border:1px solid #ddd; padding:6px; margin:6px 0;"></div>
          <div id="class-client-selected" class="client-selected" style="min-height:34px; display:flex; gap:6px; flex-wrap:wrap;"></div>
          <!-- скрытый селект для совместимости (если потребуется) -->
          <select id="class-clients-hidden" multiple style="display:none;">
            ${clients.map(client => `<option value="${client.name}" ${cls.clients?.includes(client.name) ? 'selected' : ''}>${client.name}</option>`).join('')}
          </select>
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

    // Инициализация выбранных клиентов (из cls.clients)
    let selectedClients = Array.isArray(cls.clients) ? cls.clients.slice() : [];

    const resultsEl = modal.querySelector('#class-client-results');
    const selectedEl = modal.querySelector('#class-client-selected');
    const searchEl = modal.querySelector('#class-client-search');

    function renderResults() {
      const q = searchEl.value.trim().toLowerCase();
      const matches = clients
        .filter(c => {
          const name = (c.name || '').toLowerCase();
          const phone = (c.phone || '').toLowerCase();
          if (!q) return true;
          return name.includes(q) || phone.includes(q);
        })
        .slice(0, 50);
      resultsEl.innerHTML = matches.map(c => {
        const disabled = c.blacklisted ? 'data-blacklisted="1"' : '';
        return `<div class="client-result-item" ${disabled} data-name="${c.name}">
                  <button type="button" class="client-add-btn" data-name="${c.name}" ${c.blacklisted ? 'disabled' : ''}>+</button>
                  <span>${c.name}${c.blacklisted ? ' (В чёрном списке)' : ''}</span>
                </div>`;
      }).join('');
    }

    function renderSelected() {
      selectedEl.innerHTML = selectedClients.map(name => `
        <span class="client-chip" data-name="${name}" style="padding:4px 8px;border-radius:12px;background:#eef;display:inline-flex;align-items:center;gap:6px;">
          <span>${name}</span>
          <button type="button" class="client-remove-btn" data-name="${name}" aria-label="Удалить">&times;</button>
        </span>
      `).join('');
    }

    renderResults();
    renderSelected();

    // Поиск
    searchEl.addEventListener('input', renderResults);

    // Добавление клиента из результатов
    resultsEl.addEventListener('click', (e) => {
      const btn = e.target.closest('.client-add-btn');
      if (!btn) return;
      const name = btn.getAttribute('data-name');
      if (!selectedClients.includes(name)) {
        selectedClients.push(name);
        renderSelected();
        renderResults();
      }
    });

    // Удаление выбранного
    selectedEl.addEventListener('click', (e) => {
      if (e.target.classList.contains('client-remove-btn')) {
        const name = e.target.getAttribute('data-name');
        selectedClients = selectedClients.filter(n => n !== name);
        renderSelected();
        renderResults();
      }
    });

    // дни недели toggle
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
        callback({ name, roomId, type, trainer, group, clients: selectedClients, date, startTime, endTime, daysOfWeek });
        modal.remove();
      } else {
        alert('Заполните все поля корректно!');
      }
    });

    modal.querySelector('#class-cancel-btn').addEventListener('click', () => {
      modal.remove();
    });
  }

  // --- Онлайн-журнал модалка (при клике на карточку) ---
  async function showJournalModal(cls, clientsList) {
    const modal = document.createElement('div');
    modal.className = 'journal-modal';
    modal.innerHTML = `
      <div class="journal-modal-content">
        <h2>Журнал — ${cls.name || cls.group || 'Занятие'}</h2>
        <p><strong>Дата:</strong> ${cls.date || '—'} ${cls.startTime ? `, ${cls.startTime}–${cls.endTime}` : ''}</p>
        <div class="journal-controls" style="display:flex;gap:8px;align-items:center;margin:8px 0;">
          <input type="text" id="journal-search" placeholder="Поиск клиента">
          <button id="journal-add-client-btn">Добавить клиента</button>
        </div>
        <div style="max-height:360px; overflow:auto;">
          <table class="journal-table" style="width:100%; border-collapse:collapse;">
            <thead>
              <tr>
                <th style="text-align:left;padding:6px;border-bottom:1px solid #ddd;">Клиент</th>
                <th style="padding:6px;border-bottom:1px solid #ddd;">Посещ.</th>
                <th style="padding:6px;border-bottom:1px solid #ddd;">Оценка / заметка</th>
                <th style="padding:6px;border-bottom:1px solid #ddd;">Действия</th>
              </tr>
            </thead>
            <tbody id="journal-tbody"></tbody>
          </table>
        </div>

        <div style="margin-top:10px;text-align:right;">
          <button id="journal-save-btn">Сохранить</button>
          <button id="journal-close-btn">Закрыть</button>
        </div>
      </div>
    `;
    mainContent.appendChild(modal);

    // Список клиентов для журнала: приоритет — cls.clients, затем клиенты из группы, затем все клиенты
    let journalClients = [];
    const allClients = clientsList || await getClients();

    if (Array.isArray(cls.clients) && cls.clients.length) {
      journalClients = allClients.filter(c => cls.clients.includes(c.name));
    } else if (cls.group) {
      // клиенты, у которых указана эта группа
      journalClients = allClients.filter(c => Array.isArray(c.groups) && c.groups.includes(cls.group));
    }

    if (!journalClients.length) {
      // ограничим первые 30, чтобы не плодить DOM
      journalClients = allClients.slice(0, 30);
    }

    // attendance map: name -> {status, note, score}
    cls.attendance = cls.attendance || {};
    cls.notes = cls.notes || {};

    function renderJournal(filter = '') {
      const q = filter.trim().toLowerCase();
      const rows = journalClients
        .filter(c => !q || c.name.toLowerCase().includes(q) || (c.phone || '').toLowerCase().includes(q))
        .map(c => {
          const rec = cls.attendance[c.name] || 'Не пришёл';
          const note = cls.notes[c.name] || '';
          const checked = rec === 'Пришёл' ? 'checked' : '';
          const disabled = c.blacklisted ? 'disabled' : '';
          const blackTag = c.blacklisted ? ' <small>(В чёрном списке)</small>' : '';
          return `<tr data-name="${escapeHtml(c.name)}">
                    <td style="padding:6px;border-bottom:1px solid #eee;">${escapeHtml(c.name)}${blackTag}</td>
                    <td style="padding:6px;border-bottom:1px solid #eee; text-align:center;">
                      <input type="checkbox" class="journal-present" data-name="${escapeHtml(c.name)}" ${checked} ${disabled}>
                    </td>
                    <td style="padding:6px;border-bottom:1px solid #eee;">
                      <input type="text" class="journal-note" data-name="${escapeHtml(c.name)}" value="${escapeHtml(note)}" ${disabled} style="width:100%;">
                    </td>
                    <td style="padding:6px;border-bottom:1px solid #eee;">
                      <button class="remove-from-class-btn" data-name="${escapeHtml(c.name)}">Убрать</button>
                    </td>
                  </tr>`;
        }).join('');
      modal.querySelector('#journal-tbody').innerHTML = rows || '<tr><td colspan="4" style="padding:8px;">Нет клиентов</td></tr>';
    }

    renderJournal();

    // Поиск в журнале
    modal.querySelector('#journal-search').addEventListener('input', (e) => {
      renderJournal(e.target.value);
    });

    // Добавить клиента — покажем универсальный picker (встроенный)
    modal.querySelector('#journal-add-client-btn').addEventListener('click', () => {
      showInlineClientPicker(modal, async (selectedNames) => {
        selectedNames.forEach(name => {
          const clientObj = allClients.find(c => c.name === name);
          if (clientObj && !journalClients.find(j => j.name === name)) {
            journalClients.push(clientObj);
            // добавим в cls.clients при необходимости
            if (!cls.clients) cls.clients = [];
            if (!cls.clients.includes(name)) cls.clients.push(name);
            cls.attendance[name] = cls.attendance[name] || 'Пришёл';
          }
        });
        renderJournal(modal.querySelector('#journal-search').value);
      });
    });

    // Удаление из занятия по кнопке в журнале
    modal.querySelector('#journal-tbody').addEventListener('click', (e) => {
      if (e.target.classList.contains('remove-from-class-btn')) {
        const name = e.target.getAttribute('data-name');
        // удалить из cls.clients если есть
        if (Array.isArray(cls.clients)) {
          cls.clients = cls.clients.filter(n => n !== name);
        }
        // удалить из journalClients
        journalClients = journalClients.filter(c => c.name !== name);
        delete cls.attendance[name];
        delete cls.notes[name];
        renderJournal(modal.querySelector('#journal-search').value);
      }
    });

    // Сохранение журнала
    modal.querySelector('#journal-save-btn').addEventListener('click', async () => {
      // пройти по всем строкам и сохранить данные
      const rows = modal.querySelectorAll('#journal-tbody tr[data-name]');
      rows.forEach(row => {
        const name = row.getAttribute('data-name');
        const presentEl = row.querySelector('.journal-present');
        const noteEl = row.querySelector('.journal-note');
        const present = presentEl ? presentEl.checked : false;
        cls.attendance[name] = present ? 'Пришёл' : 'Не пришёл';
        cls.notes[name] = noteEl ? noteEl.value.trim() : '';
      });

      // уменьшить оставшиеся занятия по подписке, если кто-то пришёл
      const subs = await getActiveSubscriptions();
      for (const row of rows) {
        const name = row.getAttribute('data-name');
        const presentEl = row.querySelector('.journal-present');
        if (presentEl && presentEl.checked) {
          const clientObj = allClients.find(c => c.name === name);
          if (clientObj) {
            const sub = subs.find(s => s.clientId === clientObj.id && s.remainingClasses !== Infinity);
            if (sub && typeof sub.remainingClasses === 'number' && sub.remainingClasses > 0) {
              sub.remainingClasses -= 1;
            }
          }
        }
      }

      renderClasses();
      modal.remove();
    });

    modal.querySelector('#journal-close-btn').addEventListener('click', () => modal.remove());
  }

  // Встроенный универсальный клиент-пикер (используется в журнале для добавления)
  function showInlineClientPicker(parentModal, callback) {
    // создаём небольшой оверлейный блок внутри parentModal
    const picker = document.createElement('div');
    picker.className = 'inline-client-picker';
    picker.style.padding = '8px';
    picker.style.border = '1px solid #ddd';
    picker.style.margin = '8px 0';
    picker.style.background = '#fff';

    picker.innerHTML = `
      <div style="display:flex;gap:8px;align-items:center;">
        <input type="text" id="picker-search" placeholder="Поиск по имени или телефону">
        <button id="picker-add-btn">Добавить выбранных</button>
        <button id="picker-cancel-btn">Отмена</button>
      </div>
      <div id="picker-results" style="max-height:200px; overflow:auto; margin-top:8px; border-top:1px solid #eee; padding-top:8px;"></div>
      <div id="picker-selected" style="margin-top:8px; display:flex; gap:6px; flex-wrap:wrap;"></div>
    `;
    parentModal.querySelector('.journal-modal-content').insertBefore(picker, parentModal.querySelector('#journal-tbody'));

    const pickerResults = picker.querySelector('#picker-results');
    const pickerSelected = picker.querySelector('#picker-selected');
    const pickerSearch = picker.querySelector('#picker-search');

    let selected = [];

    async function loadClientsLocal() {
      const all = await getClients();
      return all;
    }

    async function renderPickerResults() {
      const all = await loadClientsLocal();
      const q = pickerSearch.value.trim().toLowerCase();
      const items = all
        .filter(c => !q || c.name.toLowerCase().includes(q) || (c.phone || '').toLowerCase().includes(q))
        .slice(0, 100)
        .map(c => {
          const disabled = c.blacklisted ? 'disabled' : '';
          return `
            <div class="picker-item" data-name="${escapeHtml(c.name)}" style="display:flex;align-items:center;gap:8px;padding:6px;border-bottom:1px solid #f0f0f0;">
              <input type="checkbox" class="picker-checkbox" data-name="${escapeHtml(c.name)}" ${selected.includes(c.name) ? 'checked' : ''} ${disabled}>
              <div style="flex:1">
                <div>${escapeHtml(c.name)}${c.blacklisted ? ' (В чёрном списке)' : ''}</div>
                <div style="font-size:12px;color:#666">${escapeHtml(c.phone || '')}</div>
              </div>
            </div>
          `;
        }).join('');
      pickerResults.innerHTML = items;
    }

    renderPickerResults();

    pickerSearch.addEventListener('input', renderPickerResults);

    pickerResults.addEventListener('change', (e) => {
      if (e.target.classList.contains('picker-checkbox')) {
        const name = e.target.getAttribute('data-name');
        if (e.target.checked) {
          if (!selected.includes(name)) selected.push(name);
        } else {
          selected = selected.filter(n => n !== name);
        }
        renderSelectedChips();
      }
    });

    pickerResults.addEventListener('click', (e) => {
      const item = e.target.closest('.picker-item');
      if (!item) return;
      const checkbox = item.querySelector('.picker-checkbox');
      if (checkbox && !checkbox.disabled) {
        checkbox.checked = !checkbox.checked;
        const ev = new Event('change', { bubbles: true });
        checkbox.dispatchEvent(ev);
      }
    });

    function renderSelectedChips() {
      pickerSelected.innerHTML = selected.map(n => `<span style="background:#eef;padding:4px 8px;border-radius:12px;">${escapeHtml(n)} <button class="picker-remove" data-name="${escapeHtml(n)}" style="margin-left:6px;">&times;</button></span>`).join('');
    }

    pickerSelected.addEventListener('click', (e) => {
      if (e.target.classList.contains('picker-remove')) {
        const name = e.target.getAttribute('data-name');
        selected = selected.filter(n => n !== name);
        renderSelectedChips();
        renderPickerResults();
      }
    });

    picker.querySelector('#picker-add-btn').addEventListener('click', () => {
      callback(selected);
      picker.remove();
    });

    picker.querySelector('#picker-cancel-btn').addEventListener('click', () => {
      picker.remove();
    });
  }

  async function showAttendanceForm(title, cls, clients, callback) {
    const modal = document.createElement('div');
    modal.className = 'attendance-modal';
    modal.innerHTML = `
      <div class="attendance-modal-content">
        <h2>${title}</h2>
        <p>Занятие: ${cls.name} (${cls.date}, ${cls.startTime}–${cls.endTime})</p>
        <p>Группа: ${cls.group || 'Нет группы'}</p>
        <div class="attendance-list">
          ${cls.clients && cls.clients.length ? cls.clients.map(client => {
      const clientData = clients.find(c => c.name === client);
      return `
              <div class="attendance-item">
                <span>${client}${clientData?.blacklisted ? ' (В чёрном списке)' : ''}</span>
                <select class="attendance-select" data-client="${client}" ${clientData?.blacklisted ? 'disabled' : ''}>
                  <option value="Пришёл" ${cls.attendance && cls.attendance[client] === 'Пришёл' ? 'selected' : ''}>Пришёл</option>
                  <option value="Не пришёл" ${cls.attendance && cls.attendance[client] === 'Не пришёл' ? 'selected' : ''}>Не пришёл</option>
                  <option value="Опоздал" ${cls.attendance && cls.attendance[client] === 'Опоздал' ? 'selected' : ''}>Опоздал</option>
                  <option value="Отменено" ${cls.attendance && cls.attendance[client] === 'Отменено' ? 'selected' : ''}>Отменено</option>
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

    modal.querySelector('#attendance-save-btn').addEventListener('click', async () => {
      const attendance = {};
      (cls.clients || []).forEach(client => {
        const select = modal.querySelector(`.attendance-select[data-client="${client}"]`);
        attendance[client] = select ? select.value : cls.attendance && cls.attendance[client] || 'Пришёл';
      });

      // уменьшение оставшихся в подписке, аналогично остальному коду
      const subs = await getActiveSubscriptions();
      (cls.clients || []).forEach(client => {
        if (attendance[client] === 'Пришёл') {
          const clientData = clients.find(c => c.name === client);
          if (clientData) {
            const sub = subs.find(s => s.clientId === clientData.id && s.remainingClasses !== Infinity);
            if (sub && typeof sub.remainingClasses === 'number' && sub.remainingClasses > 0) {
              sub.remainingClasses -= 1;
            }
          }
        }
      });

      callback(attendance);
      modal.remove();
    });

    modal.querySelector('#attendance-cancel-btn').addEventListener('click', () => {
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
