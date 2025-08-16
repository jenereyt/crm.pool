import { getClients, getClientById, updateClient } from './clients.js';
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
      id: `sub_${client.id}_${client.subscription.subscriptionNumber}`,
      clientId: client.id,
      templateId: client.subscription.templateId,
      startDate: client.subscription.startDate,
      endDate: client.subscription.endDate,
      classesPerWeek: client.subscription.classesPerWeek || 0,
      daysOfWeek: client.subscription.daysOfWeek || [],
      classTime: client.subscription.classTime || '09:00',
      group: client.subscription.group || '',
      remainingClasses: client.subscription.remainingClasses !== undefined ? client.subscription.remainingClasses : Infinity,
      isPaid: client.subscription.isPaid !== undefined ? client.subscription.isPaid : true,
      renewalHistory: client.subscription.renewalHistory || [],
      subscriptionNumber: client.subscription.subscriptionNumber || `SUB-${String(client.id).replace('client', '').padStart(3, '0')}`
    }))
    .filter(sub => sub.isPaid && new Date(sub.endDate) >= new Date());
}

export function getInactiveSubscriptions() {
  return getClients()
    .filter(client => client.subscription)
    .map(client => ({
      id: `sub_${client.id}_${client.subscription.subscriptionNumber}`,
      clientId: client.id,
      templateId: client.subscription.templateId,
      startDate: client.subscription.startDate,
      endDate: client.subscription.endDate,
      classesPerWeek: client.subscription.classesPerWeek || 0,
      daysOfWeek: client.subscription.daysOfWeek || [],
      classTime: client.subscription.classTime || '09:00',
      group: client.subscription.group || '',
      remainingClasses: client.subscription.remainingClasses !== undefined ? client.subscription.remainingClasses : Infinity,
      isPaid: client.subscription.isPaid !== undefined ? client.subscription.isPaid : true,
      renewalHistory: client.subscription.renewalHistory || [],
      subscriptionNumber: client.subscription.subscriptionNumber || `SUB-${String(client.id).replace('client', '').padStart(3, '0')}`
    }))
    .filter(sub => !sub.isPaid || new Date(sub.endDate) < new Date());
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
    <button class="subscription-add-btn" id="subscription-add-btn">Добавить шаблон</button>
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

  const tabs = document.createElement('div');
  tabs.className = 'subscription-tabs';
  tabs.innerHTML = `
    <button class="tab-button active" data-tab="active">Активные</button>
    <button class="tab-button" data-tab="inactive">Неактивные</button>
  `;
  mainContent.appendChild(tabs);

  const subscriptionSection = document.createElement('div');
  subscriptionSection.className = 'subscription-section';
  const subscriptionHeader = document.createElement('h2');
  subscriptionHeader.textContent = 'Абонементы';
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
          <div class="template-info">
            <h3>${template.type}</h3>
            <p>Осталось занятий: ${template.remainingClasses === Infinity ? 'Безлимит' : template.remainingClasses}</p>
          </div>
          <div class="template-actions">
            <button class="template-action-icon edit" data-id="${template.id}" title="Редактировать"><img src="./images/icon-edit.svg" alt="Редактировать"></button>
            <button class="template-action-icon delete" data-id="${template.id}" title="Удалить"><img src="./images/trash.svg" alt="Удалить"></button>
          </div>
        </div>
      `).join('');
  }

  function renderSubscriptions(tab = 'active') {
    const filter = document.getElementById('subscription-filter').value.toLowerCase();
    const subscriptions = tab === 'active' ? getActiveSubscriptions() : getInactiveSubscriptions();
    subscriptionList.innerHTML = subscriptions
      .filter(sub => {
        const client = clients.find(c => c.id === sub.clientId);
        return client && client.name.toLowerCase().includes(filter);
      })
      .map(sub => {
        const client = clients.find(c => c.id === sub.clientId);
        const template = subscriptionTemplates.find(t => t.id === sub.templateId);
        return `
          <div class="subscription-container" data-id="${sub.id}">
            <div class="subscription-info">
              <h3>${client ? client.name : 'Неизвестный клиент'} (#${sub.subscriptionNumber})</h3>
              <p>Тип: ${template ? template.type : 'Неизвестный шаблон'}</p>
              <p>Статус: ${tab === 'active' ? 'Активный' : 'Неактивный'}</p>
            </div>
            <div class="subscription-actions">
              <button class="subscription-action-icon edit" data-id="${sub.id}" title="Редактировать"><img src="./images/icon-edit.svg" alt="Редактировать"></button>
              <button class="subscription-action-icon delete" data-id="${sub.id}" title="Удалить"><img src="./images/trash.svg" alt="Удалить"></button>
            </div>
          </div>
        `;
      }).join('');
  }

  renderTemplates();
  renderSubscriptions('active');

  document.getElementById('subscription-filter').addEventListener('input', () => {
    const activeTab = document.querySelector('.tab-button.active').getAttribute('data-tab');
    renderSubscriptions(activeTab);
  });

  document.getElementById('subscription-add-btn').addEventListener('click', () => {
    showTemplateForm('Добавить шаблон абонемента', {}, (data) => {
      subscriptionTemplates.push({ id: `template${Date.now()}`, ...data });
      renderTemplates();
    });
  });

  tabs.addEventListener('click', (e) => {
    if (e.target.classList.contains('tab-button')) {
      document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
      e.target.classList.add('active');
      const tab = e.target.getAttribute('data-tab');
      renderSubscriptions(tab);
    }
  });

  templateList.addEventListener('click', (e) => {
    const actionIcon = e.target.closest('.template-action-icon');
    if (!actionIcon) return;
    const templateId = actionIcon.getAttribute('data-id');
    if (actionIcon.classList.contains('delete')) {
      if (confirm('Удалить шаблон абонемента?')) {
        subscriptionTemplates = subscriptionTemplates.filter(t => t.id !== templateId);
        renderTemplates();
      }
    } else if (actionIcon.classList.contains('edit')) {
      const template = subscriptionTemplates.find(t => t.id === templateId);
      showTemplateForm('Редактировать шаблон абонемента', template, (data) => {
        Object.assign(template, data);
        renderTemplates();
        renderSubscriptions(document.querySelector('.tab-button.active').getAttribute('data-tab'));
      });
    }
  });

  subscriptionList.addEventListener('click', (e) => {
    const subContainer = e.target.closest('.subscription-container');
    if (!subContainer) return;
    const subId = subContainer.getAttribute('data-id');
    const sub = getActiveSubscriptions().concat(getInactiveSubscriptions()).find(s => s.id === subId);
    if (!sub) return;

    const actionIcon = e.target.closest('.subscription-action-icon');
    if (actionIcon) {
      if (actionIcon.classList.contains('delete')) {
        if (confirm('Удалить абонемент?')) {
          const client = getClientById(sub.clientId);
          if (client) {
            client.subscription = null;
            updateClient(client.id, client);
            renderSubscriptions(document.querySelector('.tab-button.active').getAttribute('data-tab'));
          }
        }
      } else if (actionIcon.classList.contains('edit')) {
        showSubscriptionForm('Редактировать абонемент', sub, clients, groups, (data) => {
          const client = getClientById(data.clientId);
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
              remainingClasses: template ? template.remainingClasses : Infinity,
              isPaid: data.isPaid,
              renewalHistory: data.renewalHistory || client.subscription?.renewalHistory || [],
              subscriptionNumber: data.subscriptionNumber || client.subscription?.subscriptionNumber || `SUB-${String(client.id).replace('client', '').padStart(3, '0')}`
            };
            updateClient(client.id, client);
            renderSubscriptions(document.querySelector('.tab-button.active').getAttribute('data-tab'));
          }
        });
      }
    } else {
      showSubscriptionDetails(sub);
    }
  });

  function showTemplateForm(title, template, callback) {
    const modal = document.createElement('div');
    modal.className = 'template-modal';
    modal.innerHTML = `
      <div class="template-modal-content">
        <h2>${title}</h2>
        <div class="client-form-field">
          <label for="template-type">Тип абонемента</label>
          <input type="text" id="template-type" placeholder="Тип абонемента" value="${template.type || ''}" required>
        </div>
        <div class="client-form-field">
          <label for="template-remaining-classes">Осталось занятий (пусто для безлимита)</label>
          <input type="number" id="template-remaining-classes" placeholder="Осталось занятий" value="${template.remainingClasses && template.remainingClasses !== Infinity ? template.remainingClasses : ''}">
        </div>
        <div class="template-modal-actions">
          <button id="template-save-btn">Сохранить</button>
          <button id="template-cancel-btn">Отмена</button>
        </div>
      </div>
    `;
    mainContent.appendChild(modal);

    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.remove();
    });

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

  function showSubscriptionDetails(sub) {
    const client = getClientById(sub.clientId);
    const template = subscriptionTemplates.find(t => t.id === sub.templateId);
    const modal = document.createElement('div');
    modal.className = 'subscription-details-modal';
    modal.innerHTML = `
      <div class="subscription-details-content">
        <h2>Абонемент для ${client ? client.name : 'Неизвестный клиент'} (#${sub.subscriptionNumber})</h2>
        <p>Тип: ${template ? template.type : 'Неизвестный шаблон'}</p>
        <p>Дата начала: ${sub.startDate}</p>
        <p>Дата окончания: ${sub.endDate}</p>
        <p>Осталось занятий: ${sub.remainingClasses === Infinity ? 'Безлимит' : sub.remainingClasses}</p>
        <p>Занятий в неделю: ${sub.classesPerWeek || 'Не указано'}</p>
        <p>Дни недели: ${sub.daysOfWeek?.length ? sub.daysOfWeek.join(', ') : 'Разовое'}</p>
        <p>Время: ${sub.classTime || 'Не указано'}</p>
        <p>Группа: ${sub.group || 'Не указана'}</p>
        <p>Статус: ${sub.isPaid && new Date(sub.endDate) >= new Date() ? 'Активный' : 'Неактивный'}</p>
        <p>История продлений: ${sub.renewalHistory.length ? sub.renewalHistory.map(entry => new Date(entry.date || entry).toISOString().split('T')[0]).join(', ') : 'Нет'}</p>
        <div class="subscription-details-actions">
          <button id="subscription-renew-btn" title="Продлить абонемент на 30 дней с выбранным шаблоном">Продлить</button>
          <button id="subscription-close-btn">Закрыть</button>
        </div>
      </div>
    `;
    mainContent.appendChild(modal);

    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.remove();
    });

    document.getElementById('subscription-renew-btn').addEventListener('click', () => {
      showRenewSubscriptionForm('Продление абонемента', client, sub, (data) => {
        const client = getClientById(sub.clientId);
        if (client) {
          client.subscription = { ...client.subscription, ...data };
          updateClient(client.id, client);
          modal.remove();
          renderSubscriptions(document.querySelector('.tab-button.active').getAttribute('data-tab'));
        }
      });
    });

    document.getElementById('subscription-close-btn').addEventListener('click', () => {
      modal.remove();
    });
  }

  function showRenewSubscriptionForm(title, client, sub, callback) {
    const subscriptionTemplate = subscriptionTemplates.find(t => t.id === sub.templateId);
    const defaultEndDate = new Date(Math.max(new Date(), new Date(sub.endDate)));
    defaultEndDate.setDate(defaultEndDate.getDate() + 30);
    const modal = document.createElement('div');
    modal.className = 'renew-subscription-modal';
    modal.innerHTML = `
      <div class="renew-subscription-modal-content">
        <h2>${title}</h2>
        <div class="renew-subscription-info">
          <h3>Текущий абонемент</h3>
          <p>Клиент: ${client.name}</p>
          <p>Номер абонемента: #${sub.subscriptionNumber}</p>
          <p>Тип: ${subscriptionTemplate ? subscriptionTemplate.type : 'Неизвестный шаблон'}</p>
          <p>Дата начала: ${sub.startDate}</p>
          <p>Дата окончания: ${sub.endDate}</p>
          <p>Осталось занятий: ${sub.remainingClasses === Infinity ? 'Безлимит' : sub.remainingClasses}</p>
          <p>Статус: ${sub.isPaid && new Date(sub.endDate) >= new Date() ? 'Активный' : 'Неактивный'}</p>
          <p>История продлений: ${sub.renewalHistory.length ? sub.renewalHistory.map(entry => new Date(entry.date || entry).toISOString().split('T')[0]).join(', ') : 'Нет'}</p>
        </div>
        <h3>Параметры продления</h3>
        <div class="client-form-field">
          <label for="renew-template">Шаблон абонемента <span class="tooltip" title="Выберите новый шаблон или оставьте текущий">ℹ️</span></label>
          <select id="renew-template" required>
            <option value="${sub.templateId}">${subscriptionTemplate ? subscriptionTemplate.type : 'Текущий шаблон'}</option>
            ${subscriptionTemplates.filter(t => t.id !== sub.templateId).map(t => `<option value="${t.id}">${t.type}</option>`).join('')}
          </select>
        </div>
        <div class="client-form-field">
          <label for="renew-end-date">Новая дата окончания <span class="tooltip" title="Дата окончания абонемента после продления (по умолчанию +30 дней)">ℹ️</span></label>
          <input type="date" id="renew-end-date" value="${defaultEndDate.toISOString().split('T')[0]}" required>
        </div>
        <div class="client-form-field">
          <label for="renew-is-paid">Оплачен <span class="tooltip" title="Отметьте, если продление оплачено (влияет на статус активности)">ℹ️</span></label>
          <input type="checkbox" id="renew-is-paid" checked>
        </div>
        <div class="renew-subscription-modal-actions">
          <button id="renew-save-btn">Продлить</button>
          <button id="renew-cancel-btn">Отмена</button>
        </div>
      </div>
    `;
    mainContent.appendChild(modal);

    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.remove();
      }
    });

    document.getElementById('renew-save-btn').addEventListener('click', () => {
      const templateId = document.getElementById('renew-template').value;
      const endDate = document.getElementById('renew-end-date').value;
      const isPaid = document.getElementById('renew-is-paid').checked;

      if (templateId && endDate) {
        const start = new Date(sub.startDate);
        const end = new Date(endDate);
        if (end > start) {
          const template = subscriptionTemplates.find(t => t.id === templateId);
          const renewalHistory = sub.renewalHistory || [];
          const renewalEntry = { date: new Date().toISOString() };
          if (templateId !== sub.templateId) {
            const oldTemplate = subscriptionTemplates.find(t => t.id === sub.templateId);
            renewalEntry.fromTemplate = oldTemplate ? oldTemplate.type : 'Неизвестный шаблон';
            renewalEntry.toTemplate = template ? template.type : 'Неизвестный шаблон';
          }
          renewalHistory.push(renewalEntry);
          callback({
            templateId,
            endDate,
            remainingClasses: template ? template.remainingClasses : sub.remainingClasses,
            isPaid,
            renewalHistory,
            subscriptionNumber: sub.subscriptionNumber
          });
          modal.remove();
        } else {
          alert('Дата окончания должна быть позже даты начала абонемента!');
        }
      } else {
        alert('Заполните все обязательные поля!');
      }
    });

    document.getElementById('renew-cancel-btn').addEventListener('click', () => {
      modal.remove();
    });
  }

  function showSubscriptionForm(title, sub, clients, groups, callback) {
    const modal = document.createElement('div');
    modal.className = 'subscription-modal';
    modal.innerHTML = `
      <div class="subscription-modal-content">
        <h2>${title}</h2>
        <div class="client-form-field">
          <label for="subscription-client">Клиент</label>
          <select id="subscription-client" required>
            <option value="">Выберите клиента</option>
            ${clients.map(c => `<option value="${c.id}" ${sub.clientId === c.id ? 'selected' : ''}>${c.name}${c.blacklisted ? ' (В чёрном списке)' : ''}</option>`).join('')}
          </select>
        </div>
        <div class="client-form-field">
          <label for="subscription-template">Шаблон абонемента</label>
          <select id="subscription-template" required>
            <option value="">Выберите шаблон</option>
            ${subscriptionTemplates.map(template => `<option value="${template.id}" ${sub.templateId === template.id ? 'selected' : ''}>${template.type}</option>`).join('')}
          </select>
        </div>
        <div class="client-form-field">
          <label for="subscription-classes-per-week">Занятий в неделю</label>
          <input type="number" id="subscription-classes-per-week" value="${sub.classesPerWeek || ''}" required>
        </div>
        <div class="days-of-week">
          <label>Дни недели:</label>
          <div class="days-of-week-buttons">
            ${['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map(day => `
              <button type="button" class="day-button${sub.daysOfWeek?.includes(day) ? ' selected' : ''}" data-day="${day}">${day}</button>
            `).join('')}
          </div>
        </div>
        <div class="client-form-field">
          <label for="subscription-start-date">Дата начала</label>
          <input type="date" id="subscription-start-date" value="${sub.startDate || ''}" required>
        </div>
        <div class="client-form-field">
          <label for="subscription-end-date">Дата окончания</label>
          <input type="date" id="subscription-end-date" value="${sub.endDate || ''}" required>
        </div>
        <div class="client-form-field">
          <label for="subscription-class-time">Время занятия</label>
          <input type="time" id="subscription-class-time" value="${sub.classTime || '09:00'}" required>
        </div>
        <div class="client-form-field">
          <label for="subscription-group">Группа (опционально)</label>
          <select id="subscription-group">
            <option value="">Выберите группу</option>
            ${groups.map(group => `<option value="${group}" ${sub.group === group ? 'selected' : ''}>${group}</option>`).join('')}
          </select>
        </div>
        <div class="client-form-field">
          <label for="subscription-is-paid">Оплачен <span class="tooltip" title="Отметьте, если абонемент оплачен (влияет на статус активности)">ℹ️</span></label>
          <input type="checkbox" id="subscription-is-paid" ${sub.isPaid !== false ? 'checked' : ''}>
        </div>
        <div class="subscription-modal-actions">
          <button id="subscription-save-btn">Сохранить</button>
          <button id="subscription-cancel-btn">Отмена</button>
        </div>
      </div>
    `;
    mainContent.appendChild(modal);

    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.remove();
      }
    });

    const dayButtons = modal.querySelectorAll('.day-button');
    dayButtons.forEach(button => {
      button.addEventListener('click', () => {
        button.classList.toggle('selected');
      });
    });

    document.getElementById('subscription-save-btn').addEventListener('click', () => {
      const clientId = document.getElementById('subscription-client').value;
      const templateId = document.getElementById('subscription-template').value;
      const classesPerWeek = parseInt(document.getElementById('subscription-classes-per-week').value);
      const daysOfWeek = Array.from(modal.querySelectorAll('.day-button.selected')).map(button => button.getAttribute('data-day'));
      const startDate = document.getElementById('subscription-start-date').value;
      const endDate = document.getElementById('subscription-end-date').value;
      const classTime = document.getElementById('subscription-class-time').value;
      const group = document.getElementById('subscription-group').value;
      const isPaid = document.getElementById('subscription-is-paid').checked;

      if (clientId && templateId && !isNaN(classesPerWeek) && startDate && endDate && classTime) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        if (end > start) {
          const client = getClientById(clientId);
          const template = subscriptionTemplates.find(t => t.id === templateId);
          if (client) {
            const subscriptionNumber = sub.subscriptionNumber || `SUB-${String(clientId).replace('client', '').padStart(3, '0')}`;
            client.subscription = {
              templateId,
              startDate,
              endDate,
              classesPerWeek,
              daysOfWeek,
              classTime,
              group,
              remainingClasses: template ? template.remainingClasses : Infinity,
              isPaid,
              renewalHistory: sub.renewalHistory || [],
              subscriptionNumber
            };

            const classesToAdd = [];
            let totalClasses = client.subscription.remainingClasses === Infinity ? Infinity : client.subscription.remainingClasses;
            const weeks = Math.ceil((new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24 * 7));
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
                  const clientsList = group ? getClients().filter(c => c.groups.includes(group)).map(c => c.name) : [client.name];
                  classesToAdd.push({
                    id: `class${Date.now() + classesToAdd.length}`,
                    name: template ? template.type : 'Занятие по абонементу',
                    roomId: 'room1',
                    type: group ? 'group' : 'individual',
                    trainer: 'Не указан',
                    group: group || '',
                    clients: clientsList,
                    date: new Date(d).toISOString().split('T')[0],
                    startTime: classTime,
                    endTime,
                    attendance: clientsList.reduce((acc, cl) => ({ ...acc, [cl]: 'Пришёл' }), {}),
                    daysOfWeek
                  });
                  if (totalClasses !== Infinity) totalClasses--;
                }
              }
            } else {
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
            updateClient(client.id, client);
          }

          callback({
            clientId, templateId, startDate, endDate, classesPerWeek, daysOfWeek, classTime, group, isPaid, renewalHistory: sub.renewalHistory || [], subscriptionNumber
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