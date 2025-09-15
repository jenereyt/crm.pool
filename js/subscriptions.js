// subscriptions.js (updated for paymentMethod and contract)
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
  const activeSubs = [];
  getClients().forEach(client => {
    client.subscriptions.forEach(sub => {
      if (sub.isPaid && new Date(sub.endDate) >= new Date()) {
        activeSubs.push({
          id: `sub_${client.id}_${sub.subscriptionNumber}`,
          clientId: client.id,
          ...sub
        });
      }
    });
  });
  return activeSubs;
}

export function getInactiveSubscriptions() {
  const inactiveSubs = [];
  getClients().forEach(client => {
    client.subscriptions.forEach(sub => {
      if (!sub.isPaid || new Date(sub.endDate) < new Date()) {
        inactiveSubs.push({
          id: `sub_${client.id}_${sub.subscriptionNumber}`,
          clientId: client.id,
          ...sub
        });
      }
    });
  });
  return inactiveSubs;
}

export function loadSubscriptions() {
  const mainContent = document.getElementById('main-content');
  mainContent.innerHTML = '';

  const header = document.createElement('header');
  header.className = 'header';
  header.innerHTML = `
    <h1><img src="./images/icon-subscriptions.svg" alt="Абонементы"> Абонементы</h1>
  `;
  mainContent.appendChild(header);

  const filterBar = document.createElement('div');
  filterBar.className = 'filter-bar';
  filterBar.innerHTML = `
    <button class="subscription-add btn-primary" id="subscription-add-btn">Добавить шаблон</button>
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
    <div class="tabs-and-filter">
      <div class="tab-buttons">
        <button class="tab-button active" data-tab="active">Активные</button>
        <button class="tab-button" data-tab="inactive">Неактивные</button>
      </div>
      <input type="text" id="subscription-filter" class="filter-input" placeholder="Поиск по клиенту">
    </div>
  `;
  mainContent.appendChild(tabs);

  const subscriptionSection = document.createElement('div');
  subscriptionSection.className = 'subscription-section';
  const subscriptionHeader = document.createElement('h2');
  subscriptionHeader.textContent = 'Абонементы';
  subscriptionSection.appendChild(subscriptionHeader);

  const subscriptionTable = document.createElement('div');
  subscriptionTable.className = 'subscription-table';
  subscriptionSection.appendChild(subscriptionTable);
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
            <button class="template-action-icon edit" data-id="${template.id}" title="Редактировать">
              <img src="./images/icon-edit.svg" alt="Редактировать">
            </button>
            <button class="template-action-icon delete" data-id="${template.id}" title="Удалить">
              <img src="./images/trash.svg" alt="Удалить">
            </button>
          </div>
        </div>
      `).join('');
  }

  function renderSubscriptions(tab = 'active') {
    const filter = document.getElementById('subscription-filter').value.toLowerCase();
    const subscriptions = tab === 'active' ? getActiveSubscriptions() : getInactiveSubscriptions();
    const subscriptionTable = document.querySelector('.subscription-table');
    subscriptionTable.innerHTML = `
      <table>
        <thead>
          <tr>
            <th>Клиент</th>
            <th>Договор</th>
            <th>Номер</th>
            <th>Тип</th>
            <th>Период</th>
            <th>Занятий</th>
            <th>В неделю</th>
            <th>Дни</th>
            <th>Время</th>
            <th>Группа</th>
            <th>Способ оплаты</th>
            <th>Статус</th>
            <th>Действия</th>
          </tr>
        </thead>
        <tbody>
          ${subscriptions
        .filter(sub => {
          const client = clients.find(c => c.id === sub.clientId);
          return client && `${client.surname} ${client.name} ${client.patronymic || ''}`.toLowerCase().includes(filter);
        })
        .map(sub => {
          const client = clients.find(c => c.id === sub.clientId);
          const template = subscriptionTemplates.find(t => t.id === sub.templateId);
          const fullName = `${client.surname} ${client.name} ${client.patronymic || ''}`;
          const contract = client.contract ? `#${client.contract.number}` : 'Нет';
          const paymentMethod = sub.paymentMethod || 'Не указан';
          return `
                <tr class="subscription-row" data-id="${sub.id}">
                  <td>${fullName}</td>
                  <td>${contract}</td>
                  <td>#${sub.subscriptionNumber}</td>
                  <td>${template ? template.type : 'Неизвестный'}</td>
                  <td>${sub.startDate} — ${sub.endDate}</td>
                  <td>${sub.remainingClasses === Infinity ? '∞' : sub.remainingClasses}</td>
                  <td>${sub.classesPerWeek}</td>
                  <td>${sub.daysOfWeek.join(', ') || 'Не указаны'}</td>
                  <td>${sub.classTime}</td>
                  <td>${sub.group || 'Не указана'}</td>
                  <td>${paymentMethod}</td>
                  <td class="status-${tab === 'active' ? 'active' : 'inactive'}">
                    ${tab === 'active' ? 'Активный' : 'Неактивный'}
                  </td>
                  <td>
                    <div class="subscription-actions">
                      <button class="subscription-action-icon edit" data-id="${sub.id}" title="Редактировать">
                        <img src="./images/icon-edit.svg" alt="Редактировать">
                      </button>
                      <button class="subscription-action-icon delete" data-id="${sub.id}" title="Удалить">
                        <img src="./images/trash.svg" alt="Удалить">
                      </button>
                    </div>
                  </td>
                </tr>
              `;
        }).join('')}
        </tbody>
      </table>
    `;
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
    const templateId = actionIcon.closest('.template-container').getAttribute('data-id');
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

  subscriptionTable.addEventListener('click', (e) => {
    const subRow = e.target.closest('.subscription-row');
    if (!subRow) return;

    const selection = window.getSelection();
    if (selection.toString().length > 0) return;

    const subId = subRow.getAttribute('data-id');
    const [_, clientId, subscriptionNumber] = subId.split('_');
    const client = getClientById(clientId);
    const sub = client.subscriptions.find(s => s.subscriptionNumber === subscriptionNumber);
    if (!sub) return;

    const actionIcon = e.target.closest('.subscription-action-icon');
    if (actionIcon) {
      if (actionIcon.classList.contains('delete')) {
        if (confirm('Удалить абонемент?')) {
          client.subscriptions = client.subscriptions.filter(s => s.subscriptionNumber !== subscriptionNumber);
          updateClient(client.id, client);
          renderSubscriptions(document.querySelector('.tab-button.active').getAttribute('data-tab'));
        }
      } else if (actionIcon.classList.contains('edit')) {
        showSubscriptionForm('Редактировать абонемент', { ...sub, clientId: client.id }, clients, groups, (data) => {
          const template = subscriptionTemplates.find(t => t.id === data.templateId);
          const updatedSub = {
            ...data,
            remainingClasses: template ? template.remainingClasses : data.remainingClasses || Infinity,
            subscriptionNumber: sub.subscriptionNumber
          };
          const index = client.subscriptions.findIndex(s => s.subscriptionNumber === sub.subscriptionNumber);
          if (index !== -1) {
            client.subscriptions[index] = updatedSub;
            updateClient(client.id, client);
            renderSubscriptions(document.querySelector('.tab-button.active').getAttribute('data-tab'));
          }
        });
      }
    } else {
      showSubscriptionDetails({ ...sub, clientId: client.id });
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
          <button id="template-save-btn" class="btn-primary">Сохранить</button>
          <button id="template-cancel-btn" class="btn-secondary">Отмена</button>
        </div>
      </div>
    `;
    mainContent.appendChild(modal);

    modal.addEventListener('click', (e) => {
      const selection = window.getSelection();
      if (e.target === modal && selection.toString().length === 0) {
        modal.remove();
      }
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
        <h2>Абонемент для ${client ? `${client.surname} ${client.name}` : 'Неизвестный клиент'} (#${sub.subscriptionNumber})</h2>
        <p>Тип: ${template ? template.type : 'Неизвестный шаблон'}</p>
        <p>Дата начала: ${sub.startDate}</p>
        <p>Дата окончания: ${sub.endDate}</p>
        <p>Осталось занятий: ${sub.remainingClasses === Infinity ? 'Безлимит' : sub.remainingClasses}</p>
        <p>Занятий в неделю: ${sub.classesPerWeek || 'Не указано'}</p>
        <p>Дни недели: ${sub.daysOfWeek.join(', ') || 'Не указаны'}</p>
        <p>Время: ${sub.classTime || 'Не указано'}</p>
        <p>Группа: ${sub.group || 'Не указана'}</p>
        <p>Способ оплаты: ${sub.paymentMethod || 'Не указан'}</p>
        <p>Статус: ${sub.isPaid && new Date(sub.endDate) >= new Date() ? 'Активный' : 'Неактивный'}</p>
        <p>История продлений: ${sub.renewalHistory.length ? sub.renewalHistory.map(entry => {
      const date = new Date(entry.date || entry).toLocaleDateString('ru-RU');
      return entry.fromTemplate ? `${date}: ${entry.fromTemplate} → ${entry.toTemplate}` : date;
    }).join(', ') : 'Нет'}</p>
        <div class="subscription-details-actions">
          <button id="subscription-renew-btn" class="btn-primary">Продлить</button>
          <button id="subscription-close-btn" class="btn-secondary">Закрыть</button>
        </div>
      </div>
    `;
    mainContent.appendChild(modal);

    modal.addEventListener('click', (e) => {
      const selection = window.getSelection();
      if (e.target === modal && selection.toString().length === 0) {
        modal.remove();
      }
    });

    document.getElementById('subscription-renew-btn').addEventListener('click', () => {
      showRenewSubscriptionForm('Продление абонемента', client, sub, (data) => {
        const index = client.subscriptions.findIndex(s => s.subscriptionNumber === sub.subscriptionNumber);
        if (index !== -1) {
          client.subscriptions[index] = { ...client.subscriptions[index], ...data };
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
      <div class="renew-subscription-content">
        <div class="renew-header">
          <h2>${title}</h2>
          <button type="button" class="renew-close">×</button>
        </div>
        <div class="renew-body">
          <div class="current-subscription-info">
            <h3><img src="images/icon-subscription-info.svg" alt="Текущий абонемент" class="icon"> Текущий абонемент</h3>
            <div class="info-grid">
              <div class="info-item">
                <span class="label">Клиент:</span>
                <span class="value">${client.surname} ${client.name}</span>
              </div>
              <div class="info-item">
                <span class="label">Номер абонемента:</span>
                <span class="value">#${sub.subscriptionNumber}</span>
              </div>
              <div class="info-item">
                <span class="label">Тип:</span>
                <span class="value">${subscriptionTemplate ? subscriptionTemplate.type : 'Неизвестный'}</span>
              </div>
              <div class="info-item">
                <span class="label">Период:</span>
                <span class="value">${sub.startDate} — ${sub.endDate}</span>
              </div>
              <div class="info-item">
                <span class="label">Осталось занятий:</span>
                <span class="value ${sub.remainingClasses <= 3 && sub.remainingClasses !== Infinity ? 'low-classes' : ''}">
                  ${sub.remainingClasses === Infinity ? '∞' : sub.remainingClasses}
                </span>
              </div>
              <div class="info-item">
                <span class="label">Статус:</span>
                <span class="value status-${sub.isPaid && new Date(sub.endDate) >= new Date() ? 'active' : 'inactive'}">
                  ${sub.isPaid && new Date(sub.endDate) >= new Date() ? 'Активный' : 'Неактивный'}
                </span>
              </div>
            </div>
            ${sub.renewalHistory && sub.renewalHistory.length ? `
              <div class="renewal-history-section">
                <h4>История продлений:</h4>
                <div class="renewal-list">
                  ${sub.renewalHistory.map(entry => {
      const date = new Date(entry.date || entry).toLocaleDateString('ru-RU');
      return entry.fromTemplate ?
        `<span class="renewal-item">${date}: ${entry.fromTemplate} → ${entry.toTemplate}</span>` :
        `<span class="renewal-item">${date}</span>`;
    }).join('')}
                </div>
              </div>
            ` : ''}
          </div>
          <div class="renewal-form">
            <h3><img src="images/icon-renew.svg" alt="Параметры продления" class="icon"> Параметры продления</h3>
            <div class="form-grid">
              <div class="form-group">
                <label for="renew-template" class="required">Тип абонемента</label>
                <select id="renew-template" required>
                  <option value="${sub.templateId}">${subscriptionTemplate ? subscriptionTemplate.type : 'Текущий'}</option>
                  ${subscriptionTemplates.filter(t => t.id !== sub.templateId).map(t => `<option value="${t.id}">${t.type}</option>`).join('')}
                </select>
              </div>
              <div class="form-group">
                <label for="renew-end-date" class="required">Новая дата окончания</label>
                <input type="date" id="renew-end-date" value="${defaultEndDate.toISOString().split('T')[0]}" required>
              </div>
              <div class="form-group">
                <label for="renew-payment-method" class="required">Способ оплаты</label>
                <select id="renew-payment-method" required>
                  <option value="">Выберите способ</option>
                  <option value="cash_register_cash" ${sub.paymentMethod === 'cash_register_cash' ? 'selected' : ''}>Касса (наличные)</option>
                  <option value="cash_register_card" ${sub.paymentMethod === 'cash_register_card' ? 'selected' : ''}>Касса (карта)</option>
                  <option value="cash" ${sub.paymentMethod === 'cash' ? 'selected' : ''}>Наличные</option>
                  <option value="bank_account" ${sub.paymentMethod === 'bank_account' ? 'selected' : ''}>Расчетный счет</option>
                </select>
              </div>
              <div class="form-group">
                <label class="checkbox-label">
                  <input type="checkbox" id="renew-is-paid" ${sub.isPaid ? 'checked' : ''}>
                  <span class="checkmark"></span>
                  Абонемент оплачен
                </label>
              </div>
            </div>
          </div>
        </div>
        <div class="renew-footer">
          <button type="button" id="renew-cancel-btn" class="btn-secondary">Отмена</button>
          <button type="button" id="renew-save-btn" class="btn-primary">Продлить</button>
        </div>
      </div>
    `;
    mainContent.appendChild(modal);

    const closeModal = () => modal.remove();
    modal.addEventListener('click', (e) => {
      const selection = window.getSelection();
      if (e.target === modal && selection.toString().length === 0) {
        closeModal();
      }
    });
    modal.querySelector('.renew-close').addEventListener('click', closeModal);
    modal.querySelector('#renew-cancel-btn').addEventListener('click', closeModal);

    modal.querySelector('#renew-save-btn').addEventListener('click', () => {
      const templateId = modal.querySelector('#renew-template').value;
      const endDate = modal.querySelector('#renew-end-date').value;
      const paymentMethod = modal.querySelector('#renew-payment-method').value;
      const isPaid = modal.querySelector('#renew-is-paid').checked;

      if (!templateId || !endDate || !paymentMethod) {
        showToast('Заполните все обязательные поля!', 'error');
        return;
      }

      const newEnd = new Date(endDate);
      const currentEnd = new Date(sub.endDate);
      if (newEnd <= currentEnd) {
        showToast('Новая дата окончания должна быть позже текущей!', 'error');
        return;
      }

      const newTemplate = subscriptionTemplates.find(t => t.id === templateId);
      const renewalHistory = [...sub.renewalHistory];
      renewalHistory.push({
        date: new Date().toISOString(),
        fromTemplate: subscriptionTemplate ? subscriptionTemplate.type : 'Неизвестный',
        toTemplate: newTemplate ? newTemplate.type : 'Неизвестный'
      });

      callback({
        templateId,
        endDate,
        paymentMethod,
        isPaid,
        remainingClasses: newTemplate ? newTemplate.remainingClasses : sub.remainingClasses,
        renewalHistory
      });
      closeModal();
    });
  }

  function showSubscriptionForm(title, sub, clients, groups, callback) {
    const modal = document.createElement('div');
    modal.className = 'subscription-form-modal';
    modal.innerHTML = `
      <div class="subscription-form-content">
        <div class="subscription-form-header">
          <h2>${title}</h2>
          <button type="button" class="subscription-form-close">×</button>
        </div>
        <div class="subscription-form-body">
          <div class="form-grid">
            <div class="form-group">
              <label for="subscription-client" class="required">Клиент</label>
              <select id="subscription-client" required>
                <option value="">Выберите клиента</option>
                ${clients.map(c => `<option value="${c.id}" ${sub.clientId === c.id ? 'selected' : ''}>${c.surname} ${c.name}</option>`).join('')}
              </select>
            </div>
            <div class="form-group">
              <label for="subscription-template" class="required">Тип абонемента</label>
              <select id="subscription-template" required>
                <option value="">Выберите тип абонемента</option>
                ${subscriptionTemplates.map(template => `
                  <option value="${template.id}" ${sub.templateId === template.id ? 'selected' : ''}>
                    ${template.type}
                  </option>
                `).join('')}
              </select>
            </div>
            <div class="form-group">
              <label for="subscription-classes-per-week" class="required">Занятий в неделю</label>
              <input type="number" id="subscription-classes-per-week" 
                    value="${sub.classesPerWeek || 0}" 
                    min="0" max="7" required>
            </div>
            <div class="form-group">
              <label for="subscription-class-time" class="required">Время занятия</label>
              <input type="time" id="subscription-class-time" 
                    value="${sub.classTime || '09:00'}" required>
            </div>
            <div class="form-group">
              <label for="subscription-start-date" class="required">Дата начала</label>
              <input type="date" id="subscription-start-date" 
                    value="${sub.startDate || ''}" required>
            </div>
            <div class="form-group">
              <label for="subscription-end-date" class="required">Дата окончания</label>
              <input type="date" id="subscription-end-date" 
                    value="${sub.endDate || ''}" required>
            </div>
            <div class="form-group full-width">
              <label>Дни недели занятий</label>
              <div class="days-of-week-selector">
                ${['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map(day => `
                  <button type="button" class="day-button${sub.daysOfWeek && sub.daysOfWeek.includes(day) ? ' selected' : ''}" 
                          data-day="${day}">${day}</button>
                `).join('')}
              </div>
            </div>
            <div class="form-group">
              <label for="subscription-group">Группа (опционально)</label>
              <select id="subscription-group">
                <option value="">Без привязки к группе</option>
                ${groups.map(group => `
                  <option value="${group}" ${sub.group === group ? 'selected' : ''}>${group}</option>
                `).join('')}
              </select>
            </div>
            <div class="form-group">
              <label for="subscription-payment-method" class="required">Способ оплаты</label>
              <select id="subscription-payment-method" required>
                <option value="">Выберите способ</option>
                <option value="cash_register_cash" ${sub.paymentMethod === 'cash_register_cash' ? 'selected' : ''}>Касса (наличные)</option>
                <option value="cash_register_card" ${sub.paymentMethod === 'cash_register_card' ? 'selected' : ''}>Касса (карта)</option>
                <option value="cash" ${sub.paymentMethod === 'cash' ? 'selected' : ''}>Наличные</option>
                <option value="bank_account" ${sub.paymentMethod === 'bank_account' ? 'selected' : ''}>Расчетный счет</option>
              </select>
            </div>
            <div class="form-group">
              <label class="checkbox-label">
                <input type="checkbox" id="subscription-is-paid" ${sub.isPaid !== false ? 'checked' : ''}>
                <span class="checkmark"></span>
                Абонемент оплачен
              </label>
              <small class="field-hint">Влияет на активность абонемента</small>
            </div>
          </div>
        </div>
        <div class="subscription-form-footer">
          <button type="button" id="subscription-cancel-btn" class="btn-secondary">Отмена</button>
          <button type="button" id="subscription-save-btn" class="btn-primary">Сохранить</button>
        </div>
      </div>
    `;
    mainContent.appendChild(modal);

    const closeModal = () => modal.remove();
    modal.addEventListener('click', (e) => {
      const selection = window.getSelection();
      if (e.target === modal && selection.toString().length === 0) {
        closeModal();
      }
    });
    modal.querySelector('.subscription-form-close').addEventListener('click', closeModal);

    const dayButtons = modal.querySelectorAll('.day-button');
    dayButtons.forEach(button => {
      button.addEventListener('click', () => {
        button.classList.toggle('selected');
      });
    });

    const startDateInput = modal.querySelector('#subscription-start-date');
    const endDateInput = modal.querySelector('#subscription-end-date');

    startDateInput.addEventListener('change', () => {
      if (startDateInput.value && !endDateInput.value) {
        const startDate = new Date(startDateInput.value);
        startDate.setDate(startDate.getDate() + 30);
        endDateInput.value = startDate.toISOString().split('T')[0];
      }
    });

    modal.querySelector('#subscription-save-btn').addEventListener('click', () => {
      const clientId = modal.querySelector('#subscription-client').value;
      const templateId = modal.querySelector('#subscription-template').value;
      const classesPerWeek = parseInt(modal.querySelector('#subscription-classes-per-week').value);
      const daysOfWeek = Array.from(modal.querySelectorAll('.day-button.selected')).map(b => b.dataset.day);
      const date = modal.querySelector('#subscription-start-date').value;
      const endDate = modal.querySelector('#subscription-end-date').value;
      const classTime = modal.querySelector('#subscription-class-time').value;
      const group = modal.querySelector('#subscription-group').value;
      const paymentMethod = modal.querySelector('#subscription-payment-method').value;
      const isPaid = modal.querySelector('#subscription-is-paid').checked;

      if (!clientId || !templateId || isNaN(classesPerWeek) || !date || !endDate || !classTime || !paymentMethod) {
        alert('Заполните все поля корректно!');
        return;
      }

      const start = new Date(date);
      const end = new Date(endDate);
      if (end <= start) {
        alert('Дата окончания должна быть позже даты начала!');
        return;
      }
      if (classesPerWeek > 0 && daysOfWeek.length === 0) {
        alert('Выберите дни недели для занятий!');
        return;
      }

      const client = getClientById(clientId);
      if (!client.contract) {
        // Create contract if not exists
        client.contract = {
          number: `CON-${Date.now().toString().slice(-6)}`,
          date: new Date().toISOString().split('T')[0]
        };
      }

      const template = subscriptionTemplates.find(t => t.id === templateId);
      const subscriptionNumber = sub.subscriptionNumber || `SUB-${(client.subscriptions.length + 1).toString().padStart(3, '0')}`;

      callback({
        templateId,
        startDate: date,
        endDate,
        classesPerWeek,
        daysOfWeek,
        classTime,
        group,
        paymentMethod,
        remainingClasses: template ? template.remainingClasses : Infinity,
        isPaid,
        renewalHistory: sub.renewalHistory || [],
        subscriptionNumber
      });
      closeModal();
    });

    modal.querySelector('#subscription-cancel-btn').addEventListener('click', closeModal);
  }

  function showToast(message, type = 'info') {
    if (typeof window.showToast === 'function') {
      window.showToast(message, type);
    } else {
      alert(message);
    }
  }
}
