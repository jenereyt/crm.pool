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
      ${trainers.map(trainer => `<option value="${escapeHtml(trainer)}">${escapeHtml(trainer)}</option>`).join('')}
    </select>
    <select id="class-group-filter" class="filter-select">
      <option value="">Все группы</option>
      ${groups.map(group => `<option value="${escapeHtml(group)}">${escapeHtml(group)}</option>`).join('')}
    </select>
    <button class="class-add-btn" id="class-add-btn">Добавить занятие</button>
  `;
  mainContent.appendChild(filterBar);

  const classList = document.createElement('div');
  classList.className = 'class-list';
  mainContent.appendChild(classList);

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
          <h3>${escapeHtml(cls.name)}</h3>
          <p>Зал: ${escapeHtml(rooms.find(r => r.id === cls.roomId)?.name || 'Не указан')}</p>
          <p>Тип: ${cls.type === 'group' ? 'Групповой' : cls.type === 'individual' ? 'Индивидуальный' : 'Специальный'}</p>
          <p>Тренер: ${escapeHtml(cls.trainer)}</p>
          <p>Группа: ${escapeHtml(cls.group || 'Нет группы')}</p>
          <p>Дни недели: ${cls.daysOfWeek?.length ? cls.daysOfWeek.map(d => escapeHtml(d)).join(', ') : 'Разовое'}</p>
          <p>Дата: ${escapeHtml(cls.date)}</p>
          <p>Время: ${escapeHtml(cls.startTime)}–${escapeHtml(cls.endTime)}</p>
          <div class="class-actions">
            <button class="class-edit-btn" data-id="${cls.id}">Редактировать</button>
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

  addClassBtn.addEventListener('click', () => {
    if (trainers.length === 0) {
      alert('Нет доступных тренеров. Добавьте тренеров в разделе "Сотрудники".');
      return;
    }
    showClassForm('Добавить занятие', {}, trainers, groups, rooms, clients, (data) => {
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

  // Обработчик кликов на карточках
  classList.addEventListener('click', async (e) => {
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
      if (trainers.length === 0) {
        alert('Нет доступных тренеров. Добавьте тренеров в разделе "Сотрудники".');
        return;
      }
      showClassForm('Редактировать занятие', cls, trainers, groups, rooms, clients, (data) => {
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

    // Открытие журнала при клике на карточку
    const card = e.target.closest('.class-container');
    if (card && !e.target.closest('.class-actions')) {
      const classId = card.getAttribute('data-id');
      const cls = scheduleData.find(c => c.id === classId);
      if (cls) {
        showJournalModal(cls, clients);
      }
    }
  });

  // --- Форма добавления/редактирования занятия ---
  function showClassForm(title, cls = {}, trainers, groups, rooms, clients, callback) {
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

        <!-- Клиент-пикер -->
        <div class="client-picker">
          <label>Клиенты:</label>
          <div class="client-search-container">
            <input type="text" id="class-client-search" placeholder="Поиск клиента (имя или телефон)">
            <div id="class-client-results" class="client-results"></div>
          </div>
          <div id="class-client-selected" class="client-selected">
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

    let selectedClients = Array.isArray(cls.clients) ? cls.clients.slice() : [];

    const resultsEl = modal.querySelector('#class-client-results');
    const selectedEl = modal.querySelector('.selected-chips');
    const searchEl = modal.querySelector('#class-client-search');

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

    resultsEl.addEventListener('change', (e) => {
      if (e.target.matches('input[type="checkbox"]')) {
        const name = e.target.value;
        if (e.target.checked) {
          if (!selectedClients.includes(name)) selectedClients.push(name);
        } else {
          selectedClients = selectedClients.filter(n => n !== name);
        }
        renderSelected();
        resultsEl.classList.remove('visible');
        searchEl.value = '';
        renderResults();
      }
    });

    resultsEl.addEventListener('click', (e) => {
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
      if (e.target.classList.contains('client-remove-btn')) {
        const name = e.target.getAttribute('data-name');
        selectedClients = selectedClients.filter(n => n !== name);
        renderSelected();
        renderResults();
      }
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

  // --- Журнал ---
  async function showJournalModal(cls, clientsList) {
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
    } else {
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

    resultsEl.addEventListener('click', (e) => {
      const item = e.target.closest('.client-checkbox-item');
      if (!item) return;
      const checkbox = item.querySelector('input[type="checkbox"]');
      if (checkbox && !checkbox.disabled) {
        checkbox.checked = !checkbox.checked;
        const ev = new Event('change', { bubbles: true });
        checkbox.dispatchEvent(ev);
      }
    });

    modal.querySelector('#journal-add-client-btn').addEventListener('click', () => {
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
      const rows = modal.querySelectorAll('#journal-tbody tr[data-name]');
      rows.forEach(row => {
        const name = row.getAttribute('data-name');
        const statusEl = row.querySelector('.journal-status');
        cls.attendance[name] = statusEl ? statusEl.value : 'Не пришёл';
      });

      const subs = await getActiveSubscriptions();
      for (const row of rows) {
        const name = row.getAttribute('data-name');
        const statusEl = row.querySelector('.journal-status');
        if (statusEl && statusEl.value === 'Пришёл') {
          const clientObj = clientsList.find(c => c.name === name);
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
    modal.querySelector('#journal-back-btn').addEventListener('click', () => modal.remove());
  }

  // --- Клиент-пикер ---
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

    const pickerResults = picker.querySelector('#picker-results');
    const pickerSelected = picker.querySelector('.selected-chips');
    const pickerSearch = picker.querySelector('#picker-search');

    let selected = [];

    function renderPickerResults() {
      const q = pickerSearch.value.trim().toLowerCase();
      if (!q) {
        pickerResults.classList.remove('visible');
        pickerResults.innerHTML = '';
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
      pickerResults.innerHTML = items;
      pickerResults.classList.add('visible');
    }

    function renderSelectedChips() {
      pickerSelected.innerHTML = selected.map(n => `
        <span class="client-chip" data-name="${escapeHtml(n)}">
          ${escapeHtml(n)} <button class="picker-remove" data-name="${escapeHtml(n)}">×</button>
        </span>
      `).join('');
    }

    renderPickerResults();
    renderSelectedChips();

    pickerSearch.addEventListener('input', renderPickerResults);

    pickerResults.addEventListener('change', (e) => {
      if (e.target.matches('input[type="checkbox"]')) {
        const name = e.target.value;
        if (e.target.checked) {
          if (!selected.includes(name)) selected.push(name);
        } else {
          selected = selected.filter(n => n !== name);
        }
        renderSelectedChips();
        pickerResults.classList.remove('visible');
        pickerSearch.value = '';
        renderPickerResults();
      }
    });

    pickerResults.addEventListener('click', (e) => {
      const item = e.target.closest('.client-checkbox-item');
      if (!item) return;
      const checkbox = item.querySelector('input[type="checkbox"]');
      if (checkbox && !checkbox.disabled) {
        checkbox.checked = !checkbox.checked;
        const ev = new Event('change', { bubbles: true });
        checkbox.dispatchEvent(ev);
      }
    });

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