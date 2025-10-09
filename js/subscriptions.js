// subscriptions.js
import { getClients, getClientById, updateClient } from './clients.js';
import { scheduleData } from './schedule.js';
import { getGroups as getGroupNames } from './groups.js';
import { server } from './server.js'; // Импорт сервера: http://89.236.218.209:6577

export async function getSubscriptionTemplates() {
  try {
    const response = await fetch(`${server}/subscription_templates`);
    if (!response.ok) {
      throw new Error(`Failed to fetch subscription templates: ${response.status}`);
    }
    const templates = await response.json();
    console.log('Fetched templates:', templates); // Для отладки
    return templates.map(template => ({
      id: template.id,
      type: template.name,
      remainingClasses: template.name.includes('Безлимит') ? Infinity : parseInt(template.name) || Infinity
    }));
  } catch (error) {
    console.error('Error fetching subscription templates:', error);
    showToast('Не удалось загрузить шаблоны абонементов', 'error');
    return [];
  }
}

export async function createSubscriptionTemplate(name) {
  try {
    const response = await fetch(`${server}/subscription_templates`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name })
    });
    if (!response.ok) {
      throw new Error('Failed to create subscription template');
    }
    return await response.json();
  } catch (error) {
    console.error('Error creating subscription template:', error);
    showToast('Не удалось создать шаблон абонемента', 'error');
    throw error;
  }
}

export async function updateSubscriptionTemplate(id, name) {
  try {
    const response = await fetch(`${server}/subscription_templates/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name })
    });
    if (!response.ok) {
      throw new Error('Failed to update subscription template');
    }
    return await response.json();
  } catch (error) {
    console.error('Error updating subscription template:', error);
    showToast('Не удалось обновить шаблон абонемента', 'error');
    throw error;
  }
}

export async function deleteSubscriptionTemplate(id) {
  try {
    const response = await fetch(`${server}/subscription_templates/${id}`, {
      method: 'DELETE'
    });
    if (!response.ok) {
      throw new Error('Failed to delete subscription template');
    }
  } catch (error) {
    console.error('Error deleting subscription template:', error);
    showToast('Не удалось удалить шаблон абонемента', 'error');
    throw error;
  }
}

export async function getAllSubscriptions() {
  try {
    const response = await fetch(`${server}/subscriptions`);
    if (!response.ok) {
      throw new Error('Failed to fetch subscriptions');
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching subscriptions:', error);
    showToast('Не удалось загрузить абонементы', 'error');
    return [];
  }
}

export async function getActiveSubscriptions() {
  const allSubs = await getAllSubscriptions();
  return allSubs.filter(sub => sub.is_paid && new Date(sub.end_date) >= new Date());
}

export async function getInactiveSubscriptions() {
  const allSubs = await getAllSubscriptions();
  return allSubs.filter(sub => !sub.is_paid || new Date(sub.end_date) < new Date());
}

export async function createSubscription(subData) {
  try {
    const response = await fetch(`${server}/subscriptions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...subData,
        payment: {
          method: subData.paymentMethod,
          details: {},
          date: new Date().toISOString()
        }
      })
    });
    if (!response.ok) {
      throw new Error('Failed to create subscription');
    }
    const newSub = await response.json();
    const client = await getClientById(subData.client_id);
    if (client && !client.contract) {
      client.contract = {
        number: `CON-${Date.now().toString().slice(-6)}`,
        date: new Date().toISOString().split('T')[0]
      };
      await updateClient(client.id, client);
    }
    return newSub;
  } catch (error) {
    console.error('Error creating subscription:', error);
    showToast('Не удалось создать абонемент', 'error');
    throw error;
  }
}

export async function updateSubscription(id, subData) {
  try {
    const response = await fetch(`${server}/subscriptions/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...subData,
        payment: {
          method: subData.paymentMethod,
          details: {},
          date: new Date().toISOString()
        }
      })
    });
    if (!response.ok) {
      throw new Error('Failed to update subscription');
    }
    return await response.json();
  } catch (error) {
    console.error('Error updating subscription:', error);
    showToast('Не удалось обновить абонемент', 'error');
    throw error;
  }
}

export async function deleteSubscription(id) {
  try {
    const response = await fetch(`${server}/subscriptions/${id}`, {
      method: 'DELETE'
    });
    if (!response.ok) {
      throw new Error('Failed to delete subscription');
    }
  } catch (error) {
    console.error('Error deleting subscription:', error);
    showToast('Не удалось удалить абонемент', 'error');
    throw error;
  }
}

export async function loadSubscriptions() {
  const mainContent = document.getElementById('main-content');
  if (!mainContent) {
    console.error('Main content element not found');
    showToast('Ошибка: главный контейнер не найден', 'error');
    return;
  }
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

  const clients = await getClients();
  const groups = await getGroupNames();

  async function renderTemplates() {
    try {
      const subscriptionTemplates = await getSubscriptionTemplates();
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
    } catch (error) {
      console.error('Ошибка при рендеринге шаблонов:', error);
      showToast('Не удалось загрузить шаблоны абонементов', 'error');
    }
  }

  async function renderSubscriptions(tab = 'active') {
    try {
      const filter = document.getElementById('subscription-filter').value.toLowerCase();
      const subscriptions = tab === 'active' ? await getActiveSubscriptions() : await getInactiveSubscriptions();
      const subscriptionTemplates = await getSubscriptionTemplates();
      const subscriptionTable = document.querySelector('.subscription-table');
      
      if (!subscriptionTable) {
        console.error('Subscription table element not found');
        showToast('Ошибка: таблица абонементов не найдена', 'error');
        return;
      }

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
                const client = clients.find(c => c.id === sub.client_id);
                return client && `${client.surname} ${client.name} ${client.patronymic || ''}`.toLowerCase().includes(filter);
              })
              .map(sub => {
                const client = clients.find(c => c.id === sub.client_id);
                const template = subscriptionTemplates.find(t => t.id === sub.template_id);
                const fullName = client ? `${client.surname} ${client.name} ${client.patronymic || ''}` : 'Неизвестный клиент';
                const contract = client && client.contract ? `#${client.contract.number}` : 'Нет';
                const paymentMethod = sub.payment && sub.payment.method ? sub.payment.method : 'Не указан';
                return `
                  <tr class="subscription-row" data-id="${sub.id}">
                    <td>${fullName}</td>
                    <td>${contract}</td>
                    <td>#${sub.subscription_number}</td>
                    <td>${template ? template.type : 'Неизвестный'}</td>
                    <td>${sub.start_date} — ${sub.end_date}</td>
                    <td>${sub.remaining_classes === Infinity ? '∞' : sub.remaining_classes}</td>
                    <td>${sub.classes_per_week}</td>
                    <td>${sub.days_of_week.join(', ') || 'Не указаны'}</td>
                    <td>${sub.class_time}</td>
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
    } catch (error) {
      console.error('Ошибка при рендеринге абонементов:', error);
      showToast('Не удалось загрузить абонементы', 'error');
    }
  }

  try {
    await renderTemplates();
    await renderSubscriptions('active');
  } catch (error) {
    console.error('Ошибка при инициализации:', error);
    showToast('Ошибка при загрузке страницы абонементов', 'error');
  }

  document.getElementById('subscription-filter').addEventListener('input', async () => {
    const activeTab = document.querySelector('.tab-button.active').getAttribute('data-tab');
    await renderSubscriptions(activeTab);
  });

  document.getElementById('subscription-add-btn').addEventListener('click', () => {
    showTemplateForm('Добавить шаблон абонемента', {}, async (data) => {
      await createSubscriptionTemplate(data.type);
      await renderTemplates();
    });
  });

  tabs.addEventListener('click', async (e) => {
    if (e.target.classList.contains('tab-button')) {
      document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
      e.target.classList.add('active');
      const tab = e.target.getAttribute('data-tab');
      await renderSubscriptions(tab);
    }
  });

  templateList.addEventListener('click', async (e) => {
    const actionIcon = e.target.closest('.template-action-icon');
    if (!actionIcon) return;
    const templateId = actionIcon.closest('.template-container').getAttribute('data-id');
    if (actionIcon.classList.contains('delete')) {
      if (confirm('Удалить шаблон абонемента?')) {
        await deleteSubscriptionTemplate(templateId);
        await renderTemplates();
      }
    } else if (actionIcon.classList.contains('edit')) {
      const templates = await getSubscriptionTemplates();
      const template = templates.find(t => t.id === templateId);
      showTemplateForm('Редактировать шаблон абонемента', template, async (data) => {
        await updateSubscriptionTemplate(templateId, data.type);
        await renderTemplates();
        const activeTab = document.querySelector('.tab-button.active').getAttribute('data-tab');
        await renderSubscriptions(activeTab);
      });
    }
  });

  subscriptionTable.addEventListener('click', async (e) => {
    const subRow = e.target.closest('.subscription-row');
    if (!subRow) return;

    const selection = window.getSelection();
    if (selection.toString().length > 0) return;

    const subId = subRow.getAttribute('data-id');
    const allSubs = await getAllSubscriptions();
    const sub = allSubs.find(s => s.id === subId);
    if (!sub) return;

    const client = await getClientById(sub.client_id);

    const actionIcon = e.target.closest('.subscription-action-icon');
    if (actionIcon) {
      if (actionIcon.classList.contains('delete')) {
        if (confirm('Удалить абонемент?')) {
          await deleteSubscription(subId);
          const activeTab = document.querySelector('.tab-button.active').getAttribute('data-tab');
          await renderSubscriptions(activeTab);
        }
      } else if (actionIcon.classList.contains('edit')) {
        showSubscriptionForm('Редактировать абонемент', { ...sub, clientId: sub.client_id, paymentMethod: sub.payment.method }, clients, groups, async (data) => {
          const template = (await getSubscriptionTemplates()).find(t => t.id === data.template_id);
          const updatedSub = {
            ...data,
            template_id: data.template_id,
            start_date: data.startDate,
            end_date: data.endDate,
            classes_per_week: data.classesPerWeek,
            days_of_week: data.daysOfWeek,
            class_time: data.classTime,
            remaining_classes: template ? template.remainingClasses : data.remainingClasses || Infinity,
            is_paid: data.isPaid,
            subscription_number: sub.subscription_number,
            paymentMethod: data.paymentMethod,
            renewal_history: sub.renewal_history || [],
            group: data.group
          };
          await updateSubscription(subId, updatedSub);
          const activeTab = document.querySelector('.tab-button.active').getAttribute('data-tab');
          await renderSubscriptions(activeTab);
        });
      }
    } else {
      showSubscriptionDetails({ ...sub, clientId: sub.client_id, paymentMethod: sub.payment.method });
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
        showToast('Заполните поле типа абонемента!', 'error');
      }
    });

    document.getElementById('template-cancel-btn').addEventListener('click', () => {
      modal.remove();
    });
  }

  async function showSubscriptionDetails(sub) {
    const client = await getClientById(sub.clientId);
    const templates = await getSubscriptionTemplates();
    const template = templates.find(t => t.id === sub.template_id);
    const modal = document.createElement('div');
    modal.className = 'subscription-details-modal';
    modal.innerHTML = `
      <div class="subscription-details-content">
        <h2>Абонемент для ${client ? `${client.surname} ${client.name}` : 'Неизвестный клиент'} (#${sub.subscription_number})</h2>
        <p>Тип: ${template ? template.type : 'Неизвестный шаблон'}</p>
        <p>Дата начала: ${sub.start_date}</p>
        <p>Дата окончания: ${sub.end_date}</p>
        <p>Осталось занятий: ${sub.remaining_classes === Infinity ? 'Безлимит' : sub.remaining_classes}</p>
        <p>Занятий в неделю: ${sub.classes_per_week || 'Не указано'}</p>
        <p>Дни недели: ${sub.days_of_week.join(', ') || 'Не указаны'}</p>
        <p>Время: ${sub.class_time || 'Не указано'}</p>
        <p>Группа: ${sub.group || 'Не указана'}</p>
        <p>Способ оплаты: ${sub.paymentMethod || 'Не указан'}</p>
        <p>Статус: ${sub.is_paid && new Date(sub.end_date) >= new Date() ? 'Активный' : 'Неактивный'}</p>
        <p>История продлений: ${sub.renewal_history.length ? sub.renewal_history.map(entry => {
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
      showRenewSubscriptionForm('Продление абонемента', client, sub, async (data) => {
        await updateSubscription(sub.id, data);
        modal.remove();
        const activeTab = document.querySelector('.tab-button.active').getAttribute('data-tab');
        await renderSubscriptions(activeTab);
      });
    });

    document.getElementById('subscription-close-btn').addEventListener('click', () => {
      modal.remove();
    });
  }

  async function showRenewSubscriptionForm(title, client, sub, callback) {
    const subscriptionTemplates = await getSubscriptionTemplates();
    const subscriptionTemplate = subscriptionTemplates.find(t => t.id === sub.template_id);
    const defaultEndDate = new Date(Math.max(new Date(), new Date(sub.end_date)));
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
                <span class="value">#${sub.subscription_number}</span>
              </div>
              <div class="info-item">
                <span class="label">Тип:</span>
                <span class="value">${subscriptionTemplate ? subscriptionTemplate.type : 'Неизвестный'}</span>
              </div>
              <div class="info-item">
                <span class="label">Период:</span>
                <span class="value">${sub.start_date} — ${sub.end_date}</span>
              </div>
              <div class="info-item">
                <span class="label">Осталось занятий:</span>
                <span class="value ${sub.remaining_classes <= 3 && sub.remaining_classes !== Infinity ? 'low-classes' : ''}">
                  ${sub.remaining_classes === Infinity ? '∞' : sub.remaining_classes}
                </span>
              </div>
              <div class="info-item">
                <span class="label">Статус:</span>
                <span class="value status-${sub.is_paid && new Date(sub.end_date) >= new Date() ? 'active' : 'inactive'}">
                  ${sub.is_paid && new Date(sub.end_date) >= new Date() ? 'Активный' : 'Неактивный'}
                </span>
              </div>
            </div>
            ${sub.renewal_history && sub.renewal_history.length ? `
              <div class="renewal-history-section">
                <h4>История продлений:</h4>
                <div class="renewal-list">
                  ${sub.renewal_history.map(entry => {
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
                  <option value="${sub.template_id}">${subscriptionTemplate ? subscriptionTemplate.type : 'Текущий'}</option>
                  ${subscriptionTemplates.filter(t => t.id !== sub.template_id).map(t => `<option value="${t.id}">${t.type}</option>`).join('')}
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
                  <input type="checkbox" id="renew-is-paid" ${sub.is_paid ? 'checked' : ''}>
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
      const currentEnd = new Date(sub.end_date);
      if (newEnd <= currentEnd) {
        showToast('Новая дата окончания должна быть позже текущей!', 'error');
        return;
      }

      const newTemplate = subscriptionTemplates.find(t => t.id === templateId);
      const renewalHistory = [...sub.renewal_history];
      renewalHistory.push({
        date: new Date().toISOString(),
        fromTemplate: subscriptionTemplate ? subscriptionTemplate.type : 'Неизвестный',
        toTemplate: newTemplate ? newTemplate.type : 'Неизвестный'
      });

      callback({
        template_id: templateId,
        end_date: endDate,
        paymentMethod,
        is_paid: isPaid,
        remaining_classes: newTemplate ? newTemplate.remainingClasses : sub.remaining_classes,
        renewal_history: renewalHistory,
        start_date: sub.start_date,
        classes_per_week: sub.classes_per_week,
        days_of_week: sub.days_of_week,
        class_time: sub.class_time,
        group: sub.group,
        subscription_number: sub.subscription_number,
        client_id: sub.client_id
      });
      closeModal();
    });
  }

  async function showSubscriptionForm(title, sub, clients, groups, callback) {
    const subscriptionTemplates = await getSubscriptionTemplates();
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
                  <option value="${template.id}" ${sub.template_id === template.id ? 'selected' : ''}>
                    ${template.type}
                  </option>
                `).join('')}
              </select>
            </div>
            <div class="form-group">
              <label for="subscription-classes-per-week" class="required">Занятий в неделю</label>
              <input type="number" id="subscription-classes-per-week" 
                    value="${sub.classes_per_week || 0}" 
                    min="0" max="7" required>
            </div>
            <div class="form-group">
              <label for="subscription-class-time" class="required">Время занятия</label>
              <input type="time" id="subscription-class-time" 
                    value="${sub.class_time || '09:00'}" required>
            </div>
            <div class="form-group">
              <label for="subscription-start-date" class="required">Дата начала</label>
              <input type="date" id="subscription-start-date" 
                    value="${sub.start_date || ''}" required>
            </div>
            <div class="form-group">
              <label for="subscription-end-date" class="required">Дата окончания</label>
              <input type="date" id="subscription-end-date" 
                    value="${sub.end_date || ''}" required>
            </div>
            <div class="form-group full-width">
              <label>Дни недели занятий</label>
              <div class="days-of-week-selector">
                ${['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map(day => `
                  <button type="button" class="day-button${sub.days_of_week && sub.days_of_week.includes(day) ? ' selected' : ''}" 
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
                <input type="checkbox" id="subscription-is-paid" ${sub.is_paid !== false ? 'checked' : ''}>
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

    modal.querySelector('#subscription-save-btn').addEventListener('click', async () => {
      const clientId = modal.querySelector('#subscription-client').value;
      const templateId = modal.querySelector('#subscription-template').value;
      const classesPerWeek = parseInt(modal.querySelector('#subscription-classes-per-week').value);
      const daysOfWeek = Array.from(modal.querySelectorAll('.day-button.selected')).map(b => b.dataset.day);
      const startDate = modal.querySelector('#subscription-start-date').value;
      const endDate = modal.querySelector('#subscription-end-date').value;
      const classTime = modal.querySelector('#subscription-class-time').value;
      const group = modal.querySelector('#subscription-group').value;
      const paymentMethod = modal.querySelector('#subscription-payment-method').value;
      const isPaid = modal.querySelector('#subscription-is-paid').checked;

      if (!clientId || !templateId || isNaN(classesPerWeek) || !startDate || !endDate || !classTime || !paymentMethod) {
        showToast('Заполните все поля корректно!', 'error');
        return;
      }

      const start = new Date(startDate);
      const end = new Date(endDate);
      if (end <= start) {
        showToast('Дата окончания должна быть позже даты начала!', 'error');
        return;
      }
      if (classesPerWeek > 0 && daysOfWeek.length === 0) {
        showToast('Выберите дни недели для занятий!', 'error');
        return;
      }

      const template = subscriptionTemplates.find(t => t.id === templateId);
      const subscriptionNumber = sub.subscription_number || `SUB-${Date.now().toString().slice(-6)}`;

      const subData = {
        client_id: clientId,
        template_id: templateId,
        start_date: startDate,
        end_date: endDate,
        classes_per_week: classesPerWeek,
        days_of_week: daysOfWeek,
        class_time: classTime,
        group,
        paymentMethod,
        remaining_classes: template ? template.remainingClasses : Infinity,
        is_paid: isPaid,
        renewal_history: sub.renewal_history || [],
        subscription_number: subscriptionNumber
      };

      if (sub.id) {
        await updateSubscription(sub.id, subData);
      } else {
        await createSubscription(subData);
      }

      closeModal();
      const activeTab = document.querySelector('.tab-button.active').getAttribute('data-tab');
      await renderSubscriptions(activeTab);
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
