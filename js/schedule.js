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
      <button>Выход</button>
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

    // Хранилище занятий
    const scheduleData = {};

    function renderSchedule(period) {
        scheduleContainer.innerHTML = '';
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Устанавливаем начало дня
        let startDate, endDate;

        if (period === 'today') {
            startDate = new Date(today);
            endDate = new Date(today.setHours(23, 59, 59, 999));
            renderDailySchedule(startDate);
        } else if (period === 'tomorrow') {
            startDate = new Date(today.setDate(today.getDate() + 1));
            startDate.setHours(0, 0, 0, 0);
            endDate = new Date(startDate.setHours(23, 59, 59, 999));
            renderDailySchedule(startDate);
        } else if (period === 'week') {
            startDate = new Date(today.setDate(today.getDate() - today.getDay() + 1)); // Понедельник
            endDate = new Date(startDate.setDate(startDate.getDate() + 5)); // Суббота
            renderWeeklySchedule(startDate, endDate);
        }
    }

    function renderDailySchedule(date) {
        const dayKey = date.toISOString().split('T')[0];
        scheduleContainer.innerHTML = `
      <div class="daily-schedule">
        ${Array.from({ length: 24 }, (_, i) => `
          <div class="time-slot" data-day="${dayKey}" data-time="${i}:00">
            <span class="time-label">${i}:00 - ${i + 1}:00</span>
            <div class="slot-content"></div>
          </div>
        `).join('')}
      </div>
    `;
        updateDailySlots(dayKey);
        const slots = scheduleContainer.querySelectorAll('.time-slot');
        slots.forEach(slot => {
            slot.addEventListener('click', () => {
                const time = slot.getAttribute('data-time');
                openScheduleModal(new Date(dayKey), time); // Всегда открываем модалку для добавления/редактирования
            });
        });
    }

    function renderWeeklySchedule(startDate, endDate) {
        const days = [];
        for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
            days.push(new Date(d));
        }
        scheduleContainer.innerHTML = `
      <div class="weekly-schedule">
        <div class="week-header">
          ${days.map(d => `<div class="day-header">${d.toLocaleDateString('ru-RU', { weekday: 'short' })} ${d.getDate()}</div>`).join('')}
        </div>
        <div class="week-body">
          ${days.map(day => `
            <div class="day-column" data-day="${day.toISOString().split('T')[0]}">
              ${Array.from({ length: 24 }, (_, i) => `
                <div class="time-slot" data-time="${i}:00">
                  <span class="time-label">${i}:00 - ${i + 1}:00</span>
                  <div class="slot-content"></div>
                </div>
              `).join('')}
            </div>
          `).join('')}
        </div>
      </div>
    `;
        days.forEach(day => updateDailySlots(day.toISOString().split('T')[0]));
        const slots = scheduleContainer.querySelectorAll('.time-slot');
        slots.forEach(slot => {
            const day = slot.closest('.day-column').getAttribute('data-day');
            slot.addEventListener('click', () => {
                const time = slot.getAttribute('data-time');
                openScheduleModal(new Date(day), time); // Всегда открываем модалку
            });
        });
    }

    function updateDailySlots(dayKey) {
        const slots = scheduleContainer.querySelectorAll(`.time-slot[data-day="${dayKey}"] .slot-content, .day-column[data-day="${dayKey}"] .time-slot .slot-content`);
        slots.forEach(slot => {
            const time = slot.parentElement.getAttribute('data-time');
            const key = `${dayKey} ${time}`;
            if (scheduleData[key]) {
                slot.innerHTML = scheduleData[key].map((event, index) => `
          <div class="schedule-event" data-key="${key}" data-index="${index}" style="height: ${event.duration * 80}px;">
            ${event.className} (${event.room}) <span class="edit-icon">✎</span>
          </div>
        `).join('');
            } else {
                slot.innerHTML = '';
            }
        });
        const events = scheduleContainer.querySelectorAll('.schedule-event');
        events.forEach(event => {
            event.addEventListener('click', (e) => {
                if (e.target.classList.contains('edit-icon')) {
                    const key = event.getAttribute('data-key');
                    const index = parseInt(event.getAttribute('data-index'));
                    editScheduleEvent(key, index);
                }
            });
        });
    }

    function openScheduleModal(date, time) {
        const dayKey = date.toISOString().split('T')[0];
        const key = `${dayKey} ${time}`;
        const existingEvents = scheduleData[key] || [];
        const existingEvent = existingEvents.length > 0 ? existingEvents.find(e => e.time === time) : null;

        const modal = document.createElement('div');
        modal.className = 'schedule-modal';
        modal.innerHTML = `
      <div class="modal-content">
        <span class="modal-close">×</span>
        <div class="modal-header">
          <h2 class="modal-title">${existingEvent ? 'Редактировать занятие' : 'Добавить занятие'}</h2>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label for="modal-class">Название занятия</label>
            <input type="text" class="modal-input" id="modal-class" value="${existingEvent ? existingEvent.className : ''}" placeholder="Введите название" required>
          </div>
          <div class="form-group">
            <label for="modal-room">Зал</label>
            <select class="modal-input" id="modal-room">
              <option value="hall1" ${existingEvent && existingEvent.room === 'hall1' ? 'selected' : ''}>Зал 1</option>
              <option value="hall2" ${existingEvent && existingEvent.room === 'hall2' ? 'selected' : ''}>Зал 2</option>
              <option value="hall3" ${existingEvent && existingEvent.room === 'hall3' ? 'selected' : ''}>Зал 3</option>
            </select>
          </div>
          <div class="form-group">
            <label for="modal-clients">Клиенты (через запятую)</label>
            <input type="text" class="modal-input" id="modal-clients" value="${existingEvent ? existingEvent.clients.join(', ') : ''}" placeholder="Иванов, Петров">
          </div>
          <div class="form-group">
            <label for="modal-duration">Длительность (часы)</label>
            <select class="modal-input" id="modal-duration">
              <option value="1" ${existingEvent && existingEvent.duration === 1 ? 'selected' : ''}>1 час</option>
              <option value="1.5" ${existingEvent && existingEvent.duration === 1.5 ? 'selected' : ''}>1.5 часа</option>
              <option value="2" ${existingEvent && existingEvent.duration === 2 ? 'selected' : ''}>2 часа</option>
            </select>
          </div>
          <div class="form-group">
            <label for="modal-time">Время</label>
            <input type="text" class="modal-input" id="modal-time" value="${time}" readonly>
          </div>
          <div class="form-group">
            <label for="modal-date">Дата</label>
            <input type="text" class="modal-input" id="modal-date" value="${date.toLocaleDateString('ru-RU')}" readonly>
          </div>
        </div>
        <div class="modal-footer">
          <button class="modal-save">Сохранить</button>
        </div>
      </div>
    `;
        document.body.appendChild(modal);

        const closeBtn = modal.querySelector('.modal-close');
        closeBtn.addEventListener('click', () => modal.remove());
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.remove();
        });

        const saveBtn = modal.querySelector('.modal-save');
        saveBtn.addEventListener('click', () => {
            const className = document.getElementById('modal-class').value.trim();
            const room = document.getElementById('modal-room').value;
            const clients = document.getElementById('modal-clients').value.split(',').map(c => c.trim()).filter(c => c);
            const duration = parseFloat(document.getElementById('modal-duration').value);
            if (className) {
                if (!scheduleData[key]) scheduleData[key] = [];
                const index = existingEvent ? scheduleData[key].findIndex(e => e.time === time && e.index === existingEvent.index) : scheduleData[key].length;
                scheduleData[key][index] = { className, room, clients, duration, time, index };
                updateDailySlots(dayKey);
                modal.remove();
            } else {
                alert('Введите название занятия!');
            }
        });
    }

    function editScheduleEvent(key, index) {
        const event = scheduleData[key] && scheduleData[key][index];
        if (event) {
            openScheduleModal(new Date(key.split(' ')[0]), event.time);
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
            } else {
                console.error('Некорректная дата');
            }
        });
    } else {
        console.error('Элемент schedule-date-filter не найден');
    }

    // Инициализация с "Сегодня"
    renderSchedule('today');
}