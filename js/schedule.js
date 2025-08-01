export function loadSchedule() {
  const mainContent = document.getElementById('main-content');
  if (!mainContent) {
    console.error('Элемент main-content не найден');
    return;
  }
  mainContent.innerHTML = '';

  const header = document.createElement('header');
  header.className = 'header';
  header.innerHTML = `
    <h1>Расписание</h1>
    <div class="user-actions">
      <span>Пользователь</span>
      <button id="logout-btn">Выход</button>
    </div>
  `;
  mainContent.appendChild(header);

  const filterBar = document.createElement('div');
  filterBar.className = 'schedule-filter-bar';
  filterBar.innerHTML = `
    <select class="filter-select" id="schedule-period-select">
      <option value="today">Сегодня</option>
      <option value="tomorrow">Завтра</option>
      <option value="week">Неделя</option>
    </select>
    <input type="date" id="schedule-date-filter" class="schedule-date-filter" value="${new Date().toISOString().split('T')[0]}">
  `;
  mainContent.appendChild(filterBar);

  const scheduleContainer = document.createElement('div');
  scheduleContainer.className = 'schedule-container';
  mainContent.appendChild(scheduleContainer);

  let scheduleData = JSON.parse(localStorage.getItem('scheduleData')) || {};

  function saveScheduleData() {
    localStorage.setItem('scheduleData', JSON.stringify(scheduleData));
  }

  function renderSchedule(period) {
    scheduleContainer.innerHTML = '';
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    let startDate, endDate;

    if (period === 'today') {
      startDate = new Date(today);
      endDate = new Date(today);
      endDate.setHours(23, 59, 59, 999);
      renderDailySchedule(startDate);
    } else if (period === 'tomorrow') {
      startDate = new Date(today);
      startDate.setDate(today.getDate() + 1);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(startDate);
      endDate.setHours(23, 59, 59, 999);
      renderDailySchedule(startDate);
    } else if (period === 'week') {
      const currentDay = today.getDay();
      const mondayOffset = currentDay === 0 ? -6 : 1 - currentDay;
      startDate = new Date(today);
      startDate.setDate(today.getDate() + mondayOffset);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + 6);
      endDate.setHours(23, 59, 59, 999);
      renderWeeklySchedule(startDate, endDate);
    }
  }

  function createTimeSlots() {
    const slots = [];
    for (let hour = 0; hour < 24; hour++) {
      slots.push({ time: `${hour}:00`, label: `${hour}:00` });
    }
    return slots;
  }

  function renderDailySchedule(date) {
    const dayKey = date.toISOString().split('T')[0];
    const timeSlots = createTimeSlots();

    scheduleContainer.innerHTML = `
      <div class="daily-schedule">
        <div class="time-column">
          <div class="time-header">Время</div>
          ${timeSlots.map(slot => `
            <div class="time-row">${slot.label}</div>
          `).join('')}
        </div>
        <div class="schedule-grid">
          <div class="room-header">
            <div class="room-column">Зал 1</div>
            <div class="room-column">Зал 2</div>
            <div class="room-column">Зал 3</div>
          </div>
          <div class="grid-body">
            ${timeSlots.map(slot => `
              <div class="time-slot" data-day="${dayKey}" data-time="${slot.time}">
                <div class="slot-content hall1"></div>
                <div class="slot-content hall2"></div>
                <div class="slot-content hall3"></div>
                <button class="add-event-btn" data-day="${dayKey}" data-time="${slot.time}">+</button>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;

    updateDailySlots(dayKey);

    const addBtns = scheduleContainer.querySelectorAll('.add-event-btn');
    addBtns.forEach(btn => {
      btn.removeEventListener('click', handleAddEvent); // Удаляем старые обработчики
      btn.addEventListener('click', handleAddEvent);
    });

    function handleAddEvent(e) {
      e.stopPropagation();
      const day = e.target.getAttribute('data-day');
      const time = e.target.getAttribute('data-time');
      console.log('Add button clicked:', { day, time });
      openScheduleModal(new Date(day), time);
    }
  }

  function renderWeeklySchedule(startDate, endDate) {
    const days = [];
    let currentDate = new Date(startDate);

    while (currentDate <= endDate) {
      days.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }

    const timeSlots = createTimeSlots();

    scheduleContainer.innerHTML = `
      <div class="weekly-schedule">
        <div class="time-column">
          <div class="time-header">Время</div>
          ${timeSlots.map(slot => `
            <div class="time-row">${slot.label}</div>
          `).join('')}
        </div>
        <div class="days-container">
          <div class="week-header">
            ${days.map(d => `
              <div class="day-header">
                ${d.toLocaleDateString('ru-RU', { weekday: 'short' })} 
                ${d.getDate()}.${(d.getMonth() + 1).toString().padStart(2, '0')}
              </div>
            `).join('')}
          </div>
          <div class="week-body">
            ${days.map(day => `
              <div class="day-column" data-day="${day.toISOString().split('T')[0]}">
                ${timeSlots.map(slot => `
                  <div class="time-slot" data-time="${slot.time}">
                    <div class="slot-content"></div>
                    <button class="add-event-btn" data-day="${day.toISOString().split('T')[0]}" data-time="${slot.time}">+</button>
                  </div>
                `).join('')}
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;

    days.forEach(day => updateWeeklySlots(day.toISOString().split('T')[0]));

    const addBtns = scheduleContainer.querySelectorAll('.add-event-btn');
    addBtns.forEach(btn => {
      btn.removeEventListener('click', handleAddEvent); // Удаляем старые обработчики
      btn.addEventListener('click', handleAddEvent);
    });

    function handleAddEvent(e) {
      e.stopPropagation();
      const day = e.target.getAttribute('data-day');
      const time = e.target.getAttribute('data-time');
      console.log('Add button clicked:', { day, time });
      openScheduleModal(new Date(day), time);
    }
  }

  function updateDailySlots(dayKey) {
    const timeSlots = createTimeSlots();
    const slotMap = new Map();

    timeSlots.forEach(slot => {
      const key = `${dayKey} ${slot.time}`;
      if (scheduleData[key] && scheduleData[key].length > 0) {
        scheduleData[key].forEach((event, index) => {
          const slotIndex = timeSlots.findIndex(s => s.time === event.time);
          slotMap.set(`${key}-${index}`, { event, slotIndex, index });
        });
      }
    });

    timeSlots.forEach(slot => {
      const timeSlot = scheduleContainer.querySelector(`.time-slot[data-day="${dayKey}"][data-time="${slot.time}"]`);
      if (!timeSlot) return;

      const slotContents = {
        hall1: timeSlot.querySelector('.slot-content.hall1'),
        hall2: timeSlot.querySelector('.slot-content.hall2'),
        hall3: timeSlot.querySelector('.slot-content.hall3')
      };

      Object.values(slotContents).forEach(slot => (slot.innerHTML = ''));

      slotMap.forEach(({ event, slotIndex, index }, key) => {
        if (event.time === slot.time) {
          const slotContent = slotContents[event.room];
          if (!slotContent) return;

          const eventHeight = Math.max(45, event.duration * 30);
          const events = scheduleData[key.split('-')[0]] || [];
          const eventWidth = events.length > 0 ? `${100 / events.length}%` : '100%';

          slotContent.innerHTML += `
            <div class="schedule-event" data-key="${key}" data-index="${index}" style="height: ${eventHeight}px; width: ${eventWidth};">
              <div class="event-content">
                <strong>${event.className}</strong>
                <div class="event-details">
                  <span class="event-room">${getRoomName(event.room)}</span>
                  <span class="event-duration">${event.duration}ч</span>
                </div>
                <div class="event-clients">${event.clients.join(', ')}</div>
              </div>
              <button class="edit-event-btn" data-key="${key}" data-index="${index}" title="Редактировать">✎</button>
              <button class="delete-event-btn" data-key="${key}" data-index="${index}" title="Удалить">×</button>
            </div>
          `;
        }
      });

      const addBtn = timeSlot.querySelector('.add-event-btn');
      if (addBtn) addBtn.style.display = 'block';
    });

    // Удаляем старые обработчики перед добавлением новых
    const events = scheduleContainer.querySelectorAll('.daily-schedule .schedule-event');
    events.forEach(event => {
      event.removeEventListener('click', handleEventClick);
      event.addEventListener('click', handleEventClick);
    });

    const editBtns = scheduleContainer.querySelectorAll('.daily-schedule .edit-event-btn');
    editBtns.forEach(btn => {
      btn.removeEventListener('click', handleEditClick);
      btn.addEventListener('click', handleEditClick);
    });

    const deleteBtns = scheduleContainer.querySelectorAll('.daily-schedule .delete-event-btn');
    deleteBtns.forEach(btn => {
      btn.removeEventListener('click', handleDeleteClick);
      btn.addEventListener('click', handleDeleteClick);
    });

    function handleEventClick(e) {
      if (e.target.classList.contains('edit-event-btn') || e.target.classList.contains('delete-event-btn')) return;
      e.stopPropagation();
      const key = e.currentTarget.getAttribute('data-key');
      const index = parseInt(e.currentTarget.getAttribute('data-index'));
      console.log('Daily event clicked:', { key, index });
      editScheduleEvent(key, index);
    }

    function handleEditClick(e) {
      e.stopPropagation();
      const key = e.currentTarget.getAttribute('data-key');
      const index = parseInt(e.currentTarget.getAttribute('data-index'));
      console.log('Daily edit button clicked:', { key, index });
      editScheduleEvent(key, index);
    }

    function handleDeleteClick(e) {
      e.stopPropagation();
      const key = e.currentTarget.getAttribute('data-key');
      const index = parseInt(e.currentTarget.getAttribute('data-index'));
      console.log('Daily delete button clicked:', { key, index });
      deleteScheduleEvent(key, index);
    }
  }

  function updateWeeklySlots(dayKey) {
    const timeSlots = createTimeSlots();
    const slotMap = new Map();

    timeSlots.forEach(slot => {
      const key = `${dayKey} ${slot.time}`;
      if (scheduleData[key] && scheduleData[key].length > 0) {
        scheduleData[key].forEach((event, index) => {
          const slotIndex = timeSlots.findIndex(s => s.time === event.time);
          slotMap.set(`${key}-${index}`, { event, slotIndex, index });
        });
      }
    });

    timeSlots.forEach(slot => {
      const timeSlot = scheduleContainer.querySelector(`.day-column[data-day="${dayKey}"] .time-slot[data-time="${slot.time}"]`);
      if (!timeSlot) return;

      const slotContent = timeSlot.querySelector('.slot-content');
      slotContent.innerHTML = '';

      const events = scheduleData[`${dayKey} ${slot.time}`] || [];
      timeSlot.style.minHeight = '45px';

      events.forEach((event, index) => {
        const key = `${dayKey} ${event.time}`;
        const eventWidth = events.length > 0 ? `${100 / events.length}%` : '100%';
        slotContent.innerHTML += `
          <div class="schedule-event" data-key="${key}" data-index="${index}" style="min-height: 45px; width: ${eventWidth};">
            <div class="event-content">
              <strong>${event.className}</strong>
              <div class="event-details">
                <span class="event-room">${getRoomName(event.room)}</span>
                <span class="event-duration">${event.duration}ч</span>
              </div>
              <div class="event-clients">${event.clients.join(', ')}</div>
            </div>
            <button class="edit-event-btn" data-key="${key}" data-index="${index}" title="Редактировать">✎</button>
            <button class="delete-event-btn" data-key="${key}" data-index="${index}" title="Удалить">×</button>
          </div>
        `;
      });

      const addBtn = timeSlot.querySelector('.add-event-btn');
      if (addBtn) addBtn.style.display = 'block';
    });

    // Удаляем старые обработчики перед добавлением новых
    const events = scheduleContainer.querySelectorAll('.day-column .schedule-event');
    events.forEach(event => {
      event.removeEventListener('click', handleWeeklyEventClick);
      event.addEventListener('click', handleWeeklyEventClick);
    });

    const editBtns = scheduleContainer.querySelectorAll('.day-column .edit-event-btn');
    editBtns.forEach(btn => {
      btn.removeEventListener('click', handleWeeklyEditClick);
      btn.addEventListener('click', handleWeeklyEditClick);
    });

    const deleteBtns = scheduleContainer.querySelectorAll('.day-column .delete-event-btn');
    deleteBtns.forEach(btn => {
      btn.removeEventListener('click', handleWeeklyDeleteClick);
      btn.addEventListener('click', handleWeeklyDeleteClick);
    });

    function handleWeeklyEventClick(e) {
      if (e.target.classList.contains('edit-event-btn') || e.target.classList.contains('delete-event-btn')) return;
      e.stopPropagation();
      const key = e.currentTarget.getAttribute('data-key');
      const index = parseInt(e.currentTarget.getAttribute('data-index'));
      console.log('Weekly event clicked:', { key, index });
      editScheduleEvent(key, index);
    }

    function handleWeeklyEditClick(e) {
      e.stopPropagation();
      const key = e.currentTarget.getAttribute('data-key');
      const index = parseInt(e.currentTarget.getAttribute('data-index'));
      console.log('Weekly edit button clicked:', { key, index });
      editScheduleEvent(key, index);
    }

    function handleWeeklyDeleteClick(e) {
      e.stopPropagation();
      const key = e.currentTarget.getAttribute('data-key');
      const index = parseInt(e.currentTarget.getAttribute('data-index'));
      console.log('Weekly delete button clicked:', { key, index });
      deleteScheduleEvent(key, index);
    }
  }

  function getRoomName(roomCode) {
    const rooms = {
      'hall1': 'Зал 1',
      'hall2': 'Зал 2',
      'hall3': 'Зал 3'
    };
    return rooms[roomCode] || roomCode;
  }

  function openScheduleModal(date, time, editingEvent = null) {
    // Закрываем все существующие модальные окна
    document.querySelectorAll('.schedule-modal').forEach(modal => modal.remove());

    const dayKey = date.toISOString().split('T')[0];
    const key = `${dayKey} ${time}`;

    const modal = document.createElement('div');
    modal.className = 'schedule-modal';
    modal.innerHTML = `
      <div class="modal-content">
        <span class="modal-close">×</span>
        <div class="modal-header">
          <h2 class="modal-title">${editingEvent ? 'Редактировать занятие' : 'Добавить занятие'}</h2>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label for="modal-class">Название занятия</label>
            <input type="text" class="modal-input" id="modal-class" 
                   value="${editingEvent ? editingEvent.className : ''}" 
                   placeholder="Введите название" required>
          </div>
          <div class="form-group">
            <label for="modal-room">Зал</label>
            <select class="modal-input" id="modal-room">
              <option value="hall1" ${editingEvent && editingEvent.room === 'hall1' ? 'selected' : ''}>Зал 1</option>
              <option value="hall2" ${editingEvent && editingEvent.room === 'hall2' ? 'selected' : ''}>Зал 2</option>
              <option value="hall3" ${editingEvent && editingEvent.room === 'hall3' ? 'selected' : ''}>Зал 3</option>
            </select>
          </div>
          <div class="form-group">
            <label for="modal-clients">Клиенты (через запятую)</label>
            <input type="text" class="modal-input" id="modal-clients" 
                   value="${editingEvent ? editingEvent.clients.join(', ') : ''}" 
                   placeholder="Иванов, Петров">
          </div>
          <div class="form-group">
            <label for="modal-duration">Длительность</label>
            <select class="modal-input" id="modal-duration">
              <option value="0.5" ${editingEvent && editingEvent.duration === 0.5 ? 'selected' : ''}>30 минут</option>
              <option value="1" ${editingEvent && editingEvent.duration === 1 ? 'selected' : ''}>1 час</option>
              <option value="1.5" ${editingEvent && editingEvent.duration === 1.5 ? 'selected' : ''}>1.5 часа</option>
              <option value="2" ${editingEvent && editingEvent.duration === 2 ? 'selected' : ''}>2 часа</option>
            </select>
          </div>
          <div class="form-group">
            <label for="modal-time">Время</label>
            <input type="text" class="modal-input" id="modal-time" value="${time}" readonly>
          </div>
          <div class="form-group">
            <label for="modal-date">Дата</label>
            <input type="text" class="modal-input" id="modal-date" 
                   value="${date.toLocaleDateString('ru-RU')}" readonly>
          </div>
        </div>
        <div class="modal-footer">
          <button class="modal-save">${editingEvent ? 'Сохранить изменения' : 'Добавить занятие'}</button>
          ${editingEvent ? '<button class="modal-delete">Удалить</button>' : ''}
          <button class="modal-cancel">Отмена</button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);

    const closeBtn = modal.querySelector('.modal-close');
    const cancelBtn = modal.querySelector('.modal-cancel');
    const saveBtn = modal.querySelector('.modal-save');
    const deleteBtn = modal.querySelector('.modal-delete');

    function closeModal() {
      modal.remove();
    }

    closeBtn.addEventListener('click', closeModal);
    cancelBtn.addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeModal();
    });

    saveBtn.addEventListener('click', () => {
      const className = document.getElementById('modal-class').value.trim();
      const room = document.getElementById('modal-room').value;
      const clients = document.getElementById('modal-clients').value
        .split(',')
        .map(c => c.trim())
        .filter(c => c);
      const duration = parseFloat(document.getElementById('modal-duration').value);

      if (!className) {
        alert('Введите название занятия!');
        return;
      }

      if (!scheduleData[key]) {
        scheduleData[key] = [];
      }

      const newEvent = { className, room, clients, duration, time, index: scheduleData[key].length };

      if (editingEvent) {
        const eventIndex = scheduleData[key].findIndex(e => e.index === editingEvent.index);
        if (eventIndex !== -1) {
          scheduleData[key][eventIndex] = newEvent;
        }
      } else {
        scheduleData[key].push(newEvent);
      }

      saveScheduleData();

      if (scheduleContainer.querySelector('.daily-schedule')) {
        updateDailySlots(dayKey);
      } else {
        updateWeeklySlots(dayKey);
      }
      closeModal();
    });

    if (deleteBtn) {
      deleteBtn.addEventListener('click', () => {
        if (confirm('Удалить это занятие?')) {
          if (scheduleData[key]) {
            scheduleData[key] = scheduleData[key].filter(e => e.index !== editingEvent.index);
            scheduleData[key].forEach((e, i) => e.index = i);
            if (scheduleData[key].length === 0) {
              delete scheduleData[key];
            }
            saveScheduleData();
            if (scheduleContainer.querySelector('.daily-schedule')) {
              updateDailySlots(dayKey);
            } else {
              updateWeeklySlots(dayKey);
            }
            closeModal();
          }
        }
      });
    }
  }

  function editScheduleEvent(key, index) {
    const [dayKey, time] = key.split(' ');
    const event = scheduleData[key] && scheduleData[key].find(e => e.index === index);
    if (event) {
      console.log('Opening modal for event:', { key, index, event });
      openScheduleModal(new Date(dayKey), time, event);
    } else {
      console.error('Event not found:', { key, index });
    }
  }

  function deleteScheduleEvent(key, index) {
    if (confirm('Удалить это занятие?')) {
      if (scheduleData[key]) {
        scheduleData[key] = scheduleData[key].filter(e => e.index !== index);
        scheduleData[key].forEach((e, i) => e.index = i);
        if (scheduleData[key].length === 0) {
          delete scheduleData[key];
        }
        saveScheduleData();
        const [dayKey] = key.split(' ');
        if (scheduleContainer.querySelector('.daily-schedule')) {
          updateDailySlots(dayKey);
        } else {
          updateWeeklySlots(dayKey);
        }
        console.log('Event deleted:', { key, index });
      } else {
        console.error('No events found for key:', key);
      }
    }
  }

  const periodSelect = document.getElementById('schedule-period-select');
  if (periodSelect) {
    periodSelect.addEventListener('change', (e) => renderSchedule(e.target.value));
  } else {
    console.error('Элемент schedule-period-select не найден');
  }

  const dateFilter = document.getElementById('schedule-date-filter');
  if (dateFilter) {
    dateFilter.addEventListener('change', (e) => {
      const date = new Date(e.target.value);
      if (date && !isNaN(date.getTime())) {
        renderDailySchedule(date);
        periodSelect.value = 'today';
      } else {
        console.error('Некорректная дата');
      }
    });
  } else {
    console.error('Элемент schedule-date-filter не найден');
  }

  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
      if (confirm('Выйти из системы?')) {
        localStorage.removeItem('scheduleData');
        scheduleData = {};
        renderSchedule('today');
      }
    });
  }

  const sidebarToggle = document.getElementById('sidebar-toggle');
  const sidebar = document.getElementById('sidebar');
  const mainContainer = document.getElementById('main-container');
  if (sidebarToggle && sidebar && mainContainer) {
    sidebarToggle.addEventListener('click', () => {
      sidebar.classList.toggle('closed');
      mainContainer.classList.toggle('sidebar-closed');
      if (!sidebar.classList.contains('closed')) {
        mainContainer.classList.add('sidebar-open');
      } else {
        mainContainer.classList.remove('sidebar-open');
      }
    });
  }

  renderSchedule('today');
}

window.loadSchedule = loadSchedule;