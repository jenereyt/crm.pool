// subscriptions.js
import { getClients } from './clients.js';
import { scheduleData } from './schedule.js';
import { getGroups as getGroupNames } from './groups.js';

let subscriptionTemplates = [
  { id: 'template1', type: '8 занятий', remainingClasses: 8 },
  { id: 'template2', type: '12 занятий', remainingClasses: 12 },
  { id: 'template3', type: 'Безлимит', remainingClasses: Infinity }
];

export function getSubscriptionTemplates() {
  return subscriptionTemplates;
}

export function getActiveSubscriptions() {
  return getClients()
    .filter(client => client.subscription)
    .map(client => ({
      id: `sub${client.id}`,
      clientId: client.id,
      templateId: client.subscription.templateId,
      startDate: client.subscription.startDate,
      endDate: client.subscription.endDate,
      classesPerWeek: client.subscription.classesPerWeek || 0,
      daysOfWeek: client.subscription.daysOfWeek || [],
      classTime: client.subscription.classTime || '09:00',
      group: client.subscription.group || '',
      remainingClasses: client.subscription.remainingClasses !== undefined ? client.subscription.remainingClasses : Infinity
    }));
}

export function loadSubscriptions() {
  const mainContent = document.getElementById('main-content');
  mainContent.innerHTML = '';

  const header = document.createElement('header');
  header.className = 'header';
  header.innerHTML = `
    <h1>Абонементы</h1>
    <div class="user-actions">
      <span>Пользователь</span>
      <button>Выход</button>
    </div>
  `;
  mainContent.appendChild(header);

  const filterBar = document.createElement('div');
  filterBar.className = 'filter-bar';
  filterBar.innerHTML = `
    <input type="text" id="subscription-filter" class="filter-input" placeholder="Поиск по клиенту">
    <button class="subscription-add-btn" id="subscription-add-btn">Добавить шаблон абонемента</button>
  `;
  mainContent.appendChild(filterBar);

  const templateSection = document.createElement('div');
  templateSection.className = 'template-section';
  const templateHeader = document.createElement('h2');
  templateHeader.textContent = 'Шаблоны абонементов';
  templateSection.appendChild(templateHeader);

  const templateList = document.createElement('div');
  templateList.className = 'template-list';
  templateSection.appendChild(templateList);
  mainContent.appendChild(templateSection);

  const subscriptionSection = document.createElement('div');
  subscriptionSection.className = 'subscription-section';
  const subscriptionHeader = document.createElement('h2');
  subscriptionHeader.textContent = 'Активные абонементы';
  subscriptionSection.appendChild(subscriptionHeader);

  const subscriptionList = document.createElement('div');
  subscriptionList.className = 'subscription-list';
  subscriptionSection.appendChild(subscriptionList);
  mainContent.appendChild(subscriptionSection);

  const clients = getClients();
  const groups = getGroupNames();

  function renderTemplates() {
    templateList.innerHTML = subscriptionTemplates
      .map(template => `
        <div class="template-container" data-id="${template.id}">
          <h3>${template.type}</h3>
          <p>Осталось занятий: ${template.remainingClasses === Infinity ? 'Безлимит' : template.remainingClasses}</p>
          <div class="template-actions">
            <button class="template-edit-btn" data-id="${template.id}">Редактировать</button>
            <button class="template-delete-btn" data-id="${template.id}">Удалить</button>
          </div>
        </div>
      `).join('');
  }

  function renderActiveSubscriptions() {
    const filter = document.getElementById('subscription-filter').value.toLowerCase();
    subscriptionList.innerHTML = getActiveSubscriptions()
      .filter(sub => {
        const client = clients.find(c => c.id === sub.clientId);
        return client && client.name.toLowerCase().includes(filter);
      })
      .map(sub => {
        const client = clients.find(c => c.id === sub.clientId);
        const template = subscriptionTemplates.find(t => t.id === sub.templateId);
        return `
          <div class="subscription-container" data-id="${sub.id}">
            <h3>Абонемент для ${client ? client.name : 'Неизвестный клиент'}</h3>
            <p>Тип: ${template ? template.type : 'Неизвестный шаблон'}</p>
            <p>Дата начала: ${sub.startDate}</p>
            <p>Дата окончания: ${sub.endDate}</p>
            <p>Осталось занятий: ${sub.remainingClasses === Infinity ? 'Безлимит' : sub.remainingClasses}</p>
            <p>Занятий в неделю: ${sub.classesPerWeek || 'Не указано'}</p>
            <p>Дни недели: ${sub.daysOfWeek?.length ? sub.daysOfWeek.join(', ') : 'Разовое'}</p>
            <p>Время: ${sub.classTime || 'Не указано'}</p>
            <p>Группа: ${sub.group || 'Не указана'}</p>
            <div class="subscription-actions">
              <button class="subscription-edit-btn" data-id="${sub.id}">Редактировать</button>
              <button class="subscription-delete-btn" data-id="${sub.id}">Удалить</button>
            </div>
          </div>
        `;
      }).join('');
  }

  renderTemplates();
  renderActiveSubscriptions();

  document.getElementById('subscription-filter').addEventListener('input', renderActiveSubscriptions);
  document.getElementById('subscription-add-btn').addEventListener('click', () => {
    showTemplateForm('Добавить шаблон абонемента', {}, (data) => {
      subscriptionTemplates.push({ id: `template${Date.now()}`, ...data });
      renderTemplates();
    });
  });

  templateList.addEventListener('click', (e) => {
    if (e.target.classList.contains('template-delete-btn')) {
      const templateId = e.target.getAttribute('data-id');
      if (confirm('Удалить шаблон абонемента?')) {
        subscriptionTemplates = subscriptionTemplates.filter(t => t.id !== templateId);
        renderTemplates();
      }
    } else if (e.target.classList.contains('template-edit-btn')) {
      const templateId = e.target.getAttribute('data-id');
      const template = subscriptionTemplates.find(t => t.id === templateId);
      showTemplateForm('Редактировать шаблон абонемента', template, (data) => {
        Object.assign(template, data);
        renderTemplates();
        renderActiveSubscriptions();
      });
    }
  });

  subscriptionList.addEventListener('click', (e) => {
    if (e.target.classList.contains('subscription-delete-btn')) {
      const subId = e.target.getAttribute('data-id');
      if (confirm('Удалить абонемент?')) {
        const clientId = subId.replace('sub', '');
        const client = clients.find(c => c.id === clientId);
        if (client) {
          client.subscription = null;
          renderActiveSubscriptions();
        }
      }
    } else if (e.target.classList.contains('subscription-edit-btn')) {
      const subId = e.target.getAttribute('data-id');
      const sub = getActiveSubscriptions().find(s => s.id === subId);
      showSubscriptionForm('Редактировать абонемент', sub, clients, groups, (data) => {
        const client = clients.find(c => c.id === data.clientId);
        if (client) {
          const template = subscriptionTemplates.find(t => t.id === data.templateId);
          client.subscription = {
            templateId: data.templateId,
            startDate: data.startDate,
            endDate: data.endDate,
            classesPerWeek: data.classesPerWeek,
            daysOfWeek: data.daysOfWeek,
            classTime: data.classTime,
            group: data.group,
            remainingClasses: template ? template.remainingClasses : Infinity
          };
          renderActiveSubscriptions();
        }
      });
    }
  });

  function showTemplateForm(title, template, callback) {
    const modal = document.createElement('div');
    modal.className = 'template-modal';
    modal.innerHTML = `
      <div class="template-modal-content">
        <h2>${title}</h2>
        <input type="text" id="template-type" placeholder="Тип абонемента" value="${template.type || ''}" required>
        <input type="number" id="template-remaining-classes" placeholder="Осталось занятий (пусто для безлимита)" value="${template.remainingClasses && template.remainingClasses !== Infinity ? template.remainingClasses : ''}">
        <div class="template-modal-actions">
          <button id="template-save-btn">Сохранить</button>
          <button id="template-cancel-btn">Отмена</button>
        </div>
      </div>
    `;
    mainContent.appendChild(modal);

    document.getElementById('template-save-btn').addEventListener('click', () => {
      const type = document.getElementById('template-type').value.trim();
      const remainingClassesInput = document.getElementById('template-remaining-classes').value;
      const remainingClasses = remainingClassesInput ? parseInt(remainingClassesInput) : Infinity;

      if (type) {
        callback({ type, remainingClasses });
        modal.remove();
      } else {
        alert('Заполните поле типа абонемента!');
      }
    });

    document.getElementById('template-cancel-btn').addEventListener('click', () => {
      modal.remove();
    });
  }

  function showSubscriptionForm(title, sub, clients, groups, callback) {
    const modal = document.createElement('div');
    modal.className = 'subscription-modal';
    modal.innerHTML = `
      <div class="subscription-modal-content">
        <h2>${title}</h2>
        <select id="subscription-client" required>
          <option value="">Выберите клиента</option>
          ${clients.map(client => `<option value="${client.id}" ${sub.clientId === client.id ? 'selected' : ''}>${client.name}${client.blacklisted ? ' (В чёрном списке)' : ''}</option>`).join('')}
        </select>
        <select id="subscription-template" required>
          <option value="">Выберите шаблон</option>
          ${subscriptionTemplates.map(template => `<option value="${template.id}" ${sub.templateId === template.id ? 'selected' : ''}>${template.type}</option>`).join('')}
        </select>
        <input type="number" id="subscription-classes-per-week" placeholder="Занятий в неделю" value="${sub.classesPerWeek || ''}" required>
        <div class="days-of-week">
          <label>Дни недели:</label>
          <div class="days-of-week-buttons">
            ${['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map(day => `
              <button type="button" class="day-button${sub.daysOfWeek?.includes(day) ? ' selected' : ''}" data-day="${day}">${day}</button>
            `).join('')}
          </div>
        </div>
        <input type="date" id="subscription-start-date" value="${sub.startDate || ''}" required>
        <input type="date" id="subscription-end-date" value="${sub.endDate || ''}" required>
        <input type="time" id="subscription-class-time" value="${sub.classTime || '09:00'}" required>
        <select id="subscription-group">
          <option value="">Выберите группу (опционально)</option>
          ${groups.map(group => `<option value="${group}" ${sub.group === group ? 'selected' : ''}>${group}</option>`).join('')}
        </select>
        <div class="subscription-modal-actions">
          <button id="subscription-save-btn">Сохранить</button>
          <button id="subscription-cancel-btn">Отмена</button>
        </div>
      </div>
    `;
    mainContent.appendChild(modal);

    const dayButtons = document.querySelectorAll('.day-button');
    dayButtons.forEach(button => {
      button.addEventListener('click', () => {
        button.classList.toggle('selected');
      });
    });

    document.getElementById('subscription-save-btn').addEventListener('click', () => {
      const clientId = document.getElementById('subscription-client').value;
      const templateId = document.getElementById('subscription-template').value;
      const classesPerWeek = parseInt(document.getElementById('subscription-classes-per-week').value);
      const daysOfWeek = Array.from(document.querySelectorAll('.day-button.selected')).map(button => button.getAttribute('data-day'));
      const startDate = document.getElementById('subscription-start-date').value;
      const endDate = document.getElementById('subscription-end-date').value;
      const classTime = document.getElementById('subscription-class-time').value;
      const group = document.getElementById('subscription-group').value;

      if (clientId && templateId && !isNaN(classesPerWeek) && startDate && endDate && classTime) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        if (end > start) {
          // Создаём/обновляем подписку у клиента с установкой remainingClasses по шаблону
          const client = clients.find(c => c.id === clientId);
          const template = subscriptionTemplates.find(t => t.id === templateId);
          if (client) {
            client.subscription = {
              templateId,
              startDate,
              endDate,
              classesPerWeek,
              daysOfWeek,
              classTime,
              group,
              remainingClasses: template ? template.remainingClasses : Infinity
            };

            // Автоматически сгенерировать занятия по подписке (ограничено remainingClasses клиента)
            const classesToAdd = [];
            let totalClasses = client.subscription.remainingClasses === Infinity ? Infinity : client.subscription.remainingClasses;
            const weeks = Math.ceil((new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24 * 7));
            // Ограничение: classesPerWeek * weeks
            if (totalClasses !== Infinity) {
              totalClasses = Math.min(totalClasses, classesPerWeek * weeks);
            } else {
              totalClasses = classesPerWeek * weeks;
            }

            const startHour = classTime.split(':')[0];
            const endHour = (parseInt(startHour) + 1).toString().padStart(2, '0');
            const endTime = `${endHour}:00`;

            if (daysOfWeek.length > 0) {
              const startObj = new Date(startDate);
              const endObj = new Date(endDate);
              for (let d = new Date(startObj); d <= endObj; d.setDate(d.getDate() + 1)) {
                const dayName = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'][d.getDay()];
                if (daysOfWeek.includes(dayName) && (totalClasses === Infinity || totalClasses > 0)) {
                  // clients of group or individual client
                  const clientsList = group ? getClients().filter(c => c.groups.includes(group)).map(c => c.name) : [client.name];
                  classesToAdd.push({
                    id: `class${Date.now() + classesToAdd.length}`,
                    name: template ? template.type : 'Занятие по абонементу',
                    roomId: 'room1',
                    type: group ? 'group' : 'individual',
                    trainer: 'Не указан',
                    group: group || '',
                    clients: clientsList,
                    date: formatDate(d),
                    startTime: classTime,
                    endTime,
                    attendance: clientsList.reduce((acc, cl) => ({ ...acc, [cl]: 'Пришёл' }), {}),
                    daysOfWeek
                  });
                  if (totalClasses !== Infinity) totalClasses--;
                }
              }
            } else {
              // Single date fallback
              const clientsList = group ? getClients().filter(c => c.groups.includes(group)).map(c => c.name) : [client.name];
              classesToAdd.push({
                id: `class${Date.now()}`,
                name: template ? template.type : 'Занятие по абонементу',
                roomId: 'room1',
                type: group ? 'group' : 'individual',
                trainer: 'Не указан',
                group: group || '',
                clients: clientsList,
                date: startDate,
                startTime: classTime,
                endTime,
                attendance: clientsList.reduce((acc, cl) => ({ ...acc, [cl]: 'Пришёл' }), {}),
                daysOfWeek: []
              });
            }

            classesToAdd.forEach(cls => scheduleData.push(cls));
          }

          callback({
            clientId, templateId, startDate, endDate, classesPerWeek, daysOfWeek, classTime, group
          });
          modal.remove();
        } else {
          alert('Дата окончания должна быть позже даты начала!');
        }
      } else {
        alert('Заполните все обязательные поля!');
      }
    });

    document.getElementById('subscription-cancel-btn').addEventListener('click', () => {
      modal.remove();
    });
  }

  function formatDate(date) {
    return date.toISOString().split('T')[0];
  }
}
