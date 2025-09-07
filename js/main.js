import { getClients, showClientForm, addClient, showClientDetails } from './clients.js';
import { scheduleData, setupModalClose, getRooms } from './schedule.js';

export function loadHome() {
  const mainContent = document.getElementById('main-content');
  mainContent.innerHTML = '';

  // Хедер с "Главная" и иконкой
  const header = document.createElement('header');
  header.className = 'header';
  header.innerHTML = `
    <h1><img src="./images/icon-home.svg" alt="Главная"> Главная</h1>
  `;
  mainContent.appendChild(header);

  // Контейнер для блоков
  const contentBlocks = document.createElement('div');
  contentBlocks.className = 'content-blocks';
  mainContent.appendChild(contentBlocks);

  // Блок 1: Клиенты с 1 уроком
  const block1 = document.createElement('div');
  block1.className = 'content-block';
  block1.innerHTML = `
    <h2>Клиенты с 1 уроком</h2>
    <span id="low-classes-count" class="badge">0</span>
    <ul id="low-classes-list"></ul>
    <p class="client-list-info">(Кликните для полного списка)</p>
  `;
  contentBlocks.appendChild(block1);

  // Блок 2: Добавить клиента
  const block2 = document.createElement('div');
  block2.className = 'content-block';
  block2.innerHTML = `
    <h2>Добавить клиента</h2>
    <button id="add-client-home" class="btn-primary">Добавить</button>
    <h3>Недавно добавленные</h3>
    <ul id="recent-clients-list"></ul>
  `;
  contentBlocks.appendChild(block2);

  // Блок 3: Плейсхолдер (Статистика)
  const block3 = document.createElement('div');
  block3.className = 'content-block';
  block3.innerHTML = `
    <h2>Статистика</h2>
    <p>Здесь будет статистика</p>
  `;
  contentBlocks.appendChild(block3);

  // Большой блок 4: Расписание на сегодня
  const block4 = document.createElement('div');
  block4.className = 'large-block';
  block4.innerHTML = `
    <h2>Расписание на сегодня</h2>
    <div class="schedule-container"></div>
  `;
  contentBlocks.appendChild(block4);

  // Логика для Блока 1: Клиенты с 1 уроком
  const today = new Date('2025-09-05');
  const lowClassesClients = [];
  getClients().forEach(client => {
    client.subscriptions.forEach(sub => {
      if (sub.remainingClasses === 1 && sub.isPaid && new Date(sub.endDate) >= today) {
        lowClassesClients.push(client);
      }
    });
  });
  const countEl = block1.querySelector('#low-classes-count');
  countEl.textContent = lowClassesClients.length;

  // Показать до 4 клиентов в блоке
  const listEl = block1.querySelector('#low-classes-list');
  listEl.innerHTML = lowClassesClients.slice(0, 4).map(client => `
    <li>${client.surname} ${client.name}</li>
  `).join('');

  block1.addEventListener('click', (e) => {
    if (window.getSelection().toString().length > 0) return;
    if (lowClassesClients.length === 0) return;

    const modal = document.createElement('div');
    modal.className = 'client-form-modal';
    modal.innerHTML = `
      <div class="client-form-content">
        <div class="client-form-header">
          <h2>Клиенты с 1 уроком</h2>
          <button class="client-form-close">×</button>
        </div>
        <div class="client-form-body">
          <div class="client-form-tabs">
            <button class="tab-button active" data-tab="clients">Список клиентов</button>
          </div>
          <div class="client-form-tab-content active" id="clients">
            <table class="parents-table">
              <thead>
                <tr>
                  <th>Фамилия</th>
                  <th>Имя</th>
                  <th>Остаток уроков</th>
                </tr>
              </thead>
              <tbody>
                ${lowClassesClients.map(client => `
                  <tr class="parent-group">
                    <td>${client.surname}</td>
                    <td>${client.name}</td>
                    <td>1</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;
    mainContent.appendChild(modal);

    // Закрытие модалки только при клике вне её без выделения текста
    modal.addEventListener('click', (e) => {
      if (e.target === modal && window.getSelection().toString().length === 0) {
        modal.remove();
      }
    });

    modal.querySelector('.client-form-close').addEventListener('click', () => modal.remove());
    setupModalClose(modal, () => modal.remove(), true);
  });

  // Логика для Блока 2: Добавить клиента и недавно добавленные
  const recentClientsList = block2.querySelector('#recent-clients-list');
  const updateRecentClients = () => {
    const sortedClients = getClients().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    recentClientsList.innerHTML = sortedClients.slice(0, 3).map(client => `
      <li class="recent-client" data-client-id="${client.id}">${client.surname} ${client.name}</li>
    `).join('');
  };
  updateRecentClients();

  block2.querySelector('#add-client-home').addEventListener('click', (e) => {
    if (window.getSelection().toString().length > 0) return;
    showClientForm('Добавить клиента', {}, (newClient) => {
      const addedClient = addClient(newClient);
      if (newClient.subscriptions.some(sub => sub.remainingClasses === 1 && sub.isPaid && new Date(sub.endDate) >= today)) {
        lowClassesClients.push(newClient);
        countEl.textContent = lowClassesClients.length;
        listEl.innerHTML = lowClassesClients.slice(0, 4).map(client => `
          <li>${client.surname} ${client.name}</li>
        `).join('');
      }
      updateRecentClients();
    });
  });

  // Обработчик клика по недавно добавленным клиентам
  recentClientsList.addEventListener('click', (e) => {
    const clientItem = e.target.closest('.recent-client');
    if (clientItem && window.getSelection().toString().length === 0) {
      const clientId = clientItem.getAttribute('data-client-id');
      const client = getClients().find(c => c.id === clientId);
      if (client) {
        import('./clients.js').then(module => {
          mainContent.innerHTML = '';
          module.loadClients();
          module.showClientDetails(client);
        });
      }
    }
  });

  // Логика для Блока 4: Расписание на сегодня
  const scheduleContainer = block4.querySelector('.schedule-container');
  const hours = Array.from({ length: 15 }, (_, i) => `${String(i + 8).padStart(2, '0')}:00`);
  const todayStr = formatDate(today);
  const todaySchedule = scheduleData.filter(c => c.date === todayStr);
  const rooms = getRooms();

  let html = '<div class="schedule-table"><div class="schedule-row schedule-header"><div class="schedule-time"></div>';
  if (!Array.isArray(rooms)) {
    console.error('Error: rooms is not an array:', rooms);
    html += '<div class="schedule-cell">Ошибка: Залы не загружены</div>';
  } else {
    rooms.forEach(room => html += `<div class="schedule-cell">${room.name}</div>`);
  }
  html += '</div>';

  const occupiedSlots = new Map();
  hours.forEach((hour, hourIndex) => {
    html += `<div class="schedule-row"><div class="schedule-time">${hour}</div>`;
    if (Array.isArray(rooms)) {
      rooms.forEach(room => {
        const classes = todaySchedule.filter(c => c.roomId === room.id && isClassInHour(c, hour));
        html += `<div class="schedule-cell">`;
        classes.forEach(cls => {
          const duration = getDuration(cls.startTime, cls.endTime);
          const startHourIndex = hours.indexOf(cls.startTime);
          if (startHourIndex === hourIndex) {
            const slotKey = `${room.id}-${startHourIndex}`;
            if (!occupiedSlots.has(slotKey)) {
              const groupText = cls.type === 'group' && cls.group ? `<br><small>${cls.group}</small>` : '';
              html += `<div class="schedule-class schedule-${cls.type}" data-id="${cls.id}" style="grid-row: span ${duration}">${cls.name}${groupText}<br><small>${cls.clients.length ? cls.clients.join(', ') : 'Нет клиентов'}</small></div>`;
              occupiedSlots.set(slotKey, true);
            }
          }
        });
        html += `</div>`;
      });
    } else {
      html += `<div class="schedule-cell">Ошибка: Залы не загружены</div>`;
    }
    html += `</div>`;
  });
  html += '</div>';
  scheduleContainer.innerHTML = html;

  // Вспомогательные функции
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

  function formatDate(date) {
    return date.toISOString().split('T')[0];
  }
}
