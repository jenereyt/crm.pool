import UsersHttpService from './usersHttpService.js';
import { getClients, getClientById, updateClient } from './clients.js';
import { getGroups as getGroupNames } from './groups.js';

function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => toast.classList.add('show'), 100);
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

const LOCAL_TEMPLATES_KEY = 'local_subscription_templates';

function getLocalTemplates() {
  try {
    return JSON.parse(localStorage.getItem(LOCAL_TEMPLATES_KEY) || '{}');
  } catch {
    return {};
  }
}

function saveLocalTemplate(id, data) {
  const local = getLocalTemplates();
  local[id] = data;
  localStorage.setItem(LOCAL_TEMPLATES_KEY, JSON.stringify(local));
}

function deleteLocalTemplate(id) {
  const local = getLocalTemplates();
  delete local[id];
  localStorage.setItem(LOCAL_TEMPLATES_KEY, JSON.stringify(local));
}

export async function getSubscriptionTemplates() {
  try {
    const serverTemplates = await UsersHttpService.request('/subscription_templates');
    const localTemplates = getLocalTemplates();

    // Серверные шаблоны
    const serverMapped = serverTemplates.map(t => {
      const local = localTemplates[t.id];
      let remainingClasses = Infinity;

      if (local && local.remainingClasses != null) {
        remainingClasses = local.remainingClasses;
      } else if (t.remaining_classes != null) {
        remainingClasses = t.remaining_classes === -1 ? Infinity : t.remaining_classes;
      } else if (typeof t.name === 'string') {
        if (t.name.toLowerCase().includes('безлимит')) {
          remainingClasses = Infinity;
        } else {
          const num = parseInt(t.name);
          remainingClasses = isNaN(num) ? Infinity : num;
        }
      }

      return {
        id: t.id,
        type: t.name,
        remainingClasses
      };
    });

    const localOnly = Object.entries(localTemplates)
      .filter(([id]) => !serverTemplates.some(st => st.id == id))
      .map(([id, data]) => ({
        id: id.startsWith('local_') ? id : `local_${id}`,
        type: data.type,
        remainingClasses: data.remainingClasses
      }));

    return [...serverMapped, ...localOnly];
  } catch (error) {
    console.warn('Сервер недоступен — используем только localStorage', error);
    showToast('Работаем оффлайн: шаблоны из localStorage', 'warning');
    const localTemplates = getLocalTemplates();
    return Object.entries(localTemplates).map(([id, data]) => ({
      id: id.startsWith('local_') ? id : `local_${id}`,
      type: data.type,
      remainingClasses: data.remainingClasses
    }));
  }
}

export async function createSubscriptionTemplate(name, remainingClasses) {
  try {
    const payload = { name };
    if (remainingClasses !== Infinity) payload.remaining_classes = remainingClasses;
    const created = await UsersHttpService.request('/subscription_templates', 'POST', payload);
    saveLocalTemplate(created.id, { type: name, remainingClasses });
    showToast('Шаблон создан', 'success');
    return created;
  } catch (error) {
    console.warn('Сервер не принял шаблон — сохраняем локально');
    showToast('Шаблон сохранён локально (оффлайн)', 'warning');
    const fakeId = `local_${Date.now()}`;
    saveLocalTemplate(fakeId, { type: name, remainingClasses });
    return { id: fakeId, name };
  }
}

export async function updateSubscriptionTemplate(id, name, remainingClasses) {
  const isLocal = typeof id === 'string' && id.startsWith('local_');

  if (isLocal) {
    saveLocalTemplate(id, { type: name, remainingClasses });
    showToast('Шаблон обновлён локально', 'success');
    return;
  }

  try {
    const payload = { name };
    if (remainingClasses !== Infinity) payload.remaining_classes = remainingClasses;
    await UsersHttpService.request(`/subscription_templates/${id}`, 'PUT', payload);
    saveLocalTemplate(id, { type: name, remainingClasses });
    showToast('Шаблон обновлён', 'success');
  } catch (error) {
    console.warn('Не удалось обновить на сервере — обновляем локально');
    saveLocalTemplate(id, { type: name, remainingClasses });
    showToast('Шаблон обновлён локально', 'warning');
  }
}

export async function deleteSubscriptionTemplate(id) {
  const isLocal = typeof id === 'string' && id.startsWith('local_');

  if (!isLocal) {
    try {
      await UsersHttpService.request(`/subscription_templates/${id}`, 'DELETE');
    } catch (error) {
      if (error.message.includes('404')) {
        console.warn(`Шаблон ${id} не найден на сервере — удаляем только локально`);
      } else {
        console.error('Ошибка при удалении с сервера:', error);
        showToast('Не удалось удалить шаблон с сервера', 'error');
        throw error;
      }
    }
  }

  deleteLocalTemplate(id);
  showToast('Шаблон удалён', 'success');
}

export async function getAllSubscriptions() {
  try {
    return await UsersHttpService.request('/subscriptions');
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
    const newSub = await UsersHttpService.request('/subscriptions', 'POST', {
      ...subData,
      payment: {
        method: subData.paymentMethod,
        details: {},
        date: new Date().toISOString()
      }
    });
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
    return await UsersHttpService.request(`/subscriptions/${id}`, 'PUT', {
      ...subData,
      payment: {
        method: subData.paymentMethod,
        details: {},
        date: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error updating subscription:', error);
    showToast('Не удалось обновить абонемент', 'error');
    throw error;
  }
}

export async function deleteSubscription(id) {
  try {
    await UsersHttpService.request(`/subscriptions/${id}`, 'DELETE');
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
  header.innerHTML = `<h1><img src="./images/icon-subscriptions.svg" alt="Абонементы"> Абонементы</h1>`;
  mainContent.appendChild(header);

  const filterBar = document.createElement('div');
  filterBar.className = 'filter-bar';
  filterBar.innerHTML = `<button class="subscription-add btn-primary" id="subscription-add-btn">Добавить шаблон</button>`;
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
      const templates = await getSubscriptionTemplates();
      templateList.innerHTML = templates
        .map(t => `
          <div class="template-container" data-id="${t.id}">
            <div class="template-info">
              <h3>${escapeHtml(t.type)}</h3>
              <p>Осталось занятий: ${t.remainingClasses === Infinity ? 'Безлимит' : t.remainingClasses}</p>
            </div>
            <div class="template-actions">
              <button class="template-action-icon edit" data-id="${t.id}" title="Редактировать">
                <img src="./images/icon-edit.svg" alt="Редактировать">
              </button>
              <button class="template-action-icon delete" data-id="${t.id}" title="Удалить">
                <img src="./images/trash.svg" alt="Удалить">
              </button>
            </div>
          </div>
        `).join('');
    } catch (error) {
      console.error('Ошибка при рендеринге шаблонов:', error);
      showToast('Не удалось загрузить шаблоны', 'error');
    }
  }

  async function renderSubscriptions(tab = 'active') {
    try {
      const filter = document.getElementById('subscription-filter').value.toLowerCase();
      const subscriptions = tab === 'active' ? await getActiveSubscriptions() : await getInactiveSubscriptions();
      const templates = await getSubscriptionTemplates();
      
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
                const template = templates.find(t => t.id == sub.template_id);
                const fullName = client ? `${client.surname} ${client.name} ${client.patronymic || ''}` : 'Неизвестный клиент';
                const contract = client && client.contract ? `#${client.contract.number}` : 'Нет';
                const paymentMethod = sub.payment?.method || 'Не указан';
                return `
                  <tr class="subscription-row" data-id="${sub.id}">
                    <td>${escapeHtml(fullName)}</td>
                    <td>${contract}</td>
                    <td>#${sub.subscription_number}</td>
                    <td>${template ? escapeHtml(template.type) : 'Неизвестный'}</td>
                    <td>${sub.start_date} — ${sub.end_date}</td>
                    <td>${sub.remaining_classes === Infinity ? '∞' : sub.remaining_classes}</td>
                    <td>${sub.classes_per_week}</td>
                    <td>${sub.days_of_week?.join(', ') || 'Не указаны'}</td>
                    <td>${sub.class_time || 'Не указано'}</td>
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
    showToast('Ошибка при загрузке страницы', 'error');
  }

  document.getElementById('subscription-filter').addEventListener('input', async () => {
    const activeTab = document.querySelector('.tab-button.active').getAttribute('data-tab');
    await renderSubscriptions(activeTab);
  });

  document.getElementById('subscription-add-btn').addEventListener('click', () => {
    showTemplateForm('Добавить шаблон', {}, async (data) => {
      await createSubscriptionTemplate(data.type, data.remainingClasses);
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
      if (confirm('Удалить шаблон?')) {
        await deleteSubscriptionTemplate(templateId);
        await renderTemplates();
      }
    } else if (actionIcon.classList.contains('edit')) {
      const templates = await getSubscriptionTemplates();
      const template = templates.find(t => t.id == templateId);
      showTemplateForm('Редактировать шаблон', template, async (data) => {
        await updateSubscriptionTemplate(templateId, data.type, data.remainingClasses);
        await renderTemplates();
        const activeTab = document.querySelector('.tab-button.active').getAttribute('data-tab');
        await renderSubscriptions(activeTab);
      });
    }
  });

  subscriptionTable.addEventListener('click', async (e) => {
    const subRow = e.target.closest('.subscription-row');
    if (!subRow) return;
    if (window.getSelection().toString()) return;

    const subId = subRow.getAttribute('data-id');
    const allSubs = await getAllSubscriptions();
    const sub = allSubs.find(s => s.id === subId);
    if (!sub) return;

    const actionIcon = e.target.closest('.subscription-action-icon');
    if (actionIcon) {
      if (actionIcon.classList.contains('delete')) {
        if (confirm('Удалить абонемент?')) {
          await deleteSubscription(subId);
          const activeTab = document.querySelector('.tab-button.active').getAttribute('data-tab');
          await renderSubscriptions(activeTab);
        }
      } else if (actionIcon.classList.contains('edit')) {
        showSubscriptionForm('Редактировать абонемент', { ...sub, clientId: sub.client_id, paymentMethod: sub.payment?.method }, clients, groups, async (data) => {
          const template = (await getSubscriptionTemplates()).find(t => t.id == data.template_id);
          const updatedSub = {
            ...data,
            template_id: data.template_id,
            start_date: data.startDate,
            end_date: data.endDate,
            classes_per_week: data.classesPerWeek,
            days_of_week: data.daysOfWeek,
            class_time: data.classTime,
            remaining_classes: template ? template.remainingClasses : Infinity,
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
      showSubscriptionDetails({ ...sub, clientId: sub.client_id, paymentMethod: sub.payment?.method });
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
          <input type="text" id="template-type" value="${escapeHtml(template.type || '')}" required>
        </div>
        <div class="client-form-field">
          <label for="template-remaining-classes">Остаток занятий (пусто = безлимит)</label>
          <input type="number" id="template-remaining-classes" value="${template.remainingClasses && template.remainingClasses !== Infinity ? template.remainingClasses : ''}">
        </div>
        <div class="template-modal-actions">
          <button id="template-save-btn" class="btn-primary">Сохранить</button>
          <button id="template-cancel-btn" class="btn-secondary">Отмена</button>
        </div>
      </div>
    `;
    mainContent.appendChild(modal);

    modal.addEventListener('click', (e) => {
      if (e.target === modal && !window.getSelection().toString()) modal.remove();
    });

    document.getElementById('template-save-btn').addEventListener('click', () => {
      const type = document.getElementById('template-type').value.trim();
      const input = document.getElementById('template-remaining-classes').value;
      const remainingClasses = input ? parseInt(input) : Infinity;

      if (!type) {
        showToast('Введите тип абонемента!', 'error');
        return;
      }

      callback({ type, remainingClasses });
      modal.remove();
    });

    document.getElementById('template-cancel-btn').addEventListener('click', () => modal.remove());
  }

  async function showSubscriptionDetails(sub) {
    const client = await getClientById(sub.clientId);
    const templates = await getSubscriptionTemplates();
    const template = templates.find(t => t.id == sub.template_id);
    const modal = document.createElement('div');
    modal.className = 'subscription-details-modal';
    modal.innerHTML = `
      <div class="subscription-details-content">
        <h2>Абонемент для ${client ? `${escapeHtml(client.surname)} ${escapeHtml(client.name)}` : 'Неизвестный клиент'} (#${sub.subscription_number})</h2>
        <p>Тип: ${template ? escapeHtml(template.type) : 'Неизвестный шаблон'}</p>
        <p>Дата начала: ${sub.start_date}</p>
        <p>Дата окончания: ${sub.end_date}</p>
        <p>Осталось занятий: ${sub.remaining_classes === Infinity ? 'Безлимит' : sub.remaining_classes}</p>
        <p>Занятий в неделю: ${sub.classes_per_week || 'Не указано'}</p>
        <p>Дни недели: ${sub.days_of_week?.join(', ') || 'Не указаны'}</p>
        <p>Время: ${sub.class_time || 'Не указано'}</p>
        <p>Группа: ${sub.group || 'Не указана'}</p>
        <p>Способ оплаты: ${sub.paymentMethod || 'Не указан'}</p>
        <p>Статус: ${sub.is_paid && new Date(sub.end_date) >= new Date() ? 'Активный' : 'Неактивный'}</p>
        <p>История продлений: ${sub.renewal_history?.length ? sub.renewal_history.map(entry => {
          const date = new Date(entry.date || entry).toLocaleDateString('ru-RU');
          return entry.fromTemplate ? `${date}: ${escapeHtml(entry.fromTemplate)} → ${escapeHtml(entry.toTemplate)}` : date;
        }).join(', ') : 'Нет'}</p>
        <div class="subscription-details-actions">
          <button id="subscription-renew-btn" class="btn-primary">Продлить</button>
          <button id="subscription-close-btn" class="btn-secondary">Закрыть</button>
        </div>
      </div>
    `;
    mainContent.appendChild(modal);

    modal.addEventListener('click', (e) => {
      if (e.target === modal && !window.getSelection().toString()) modal.remove();
    });

    document.getElementById('subscription-renew-btn').addEventListener('click', () => {
      showRenewSubscriptionForm('Продление абонемента', client, sub, async (data) => {
        await updateSubscription(sub.id, data);
        modal.remove();
        const activeTab = document.querySelector('.tab-button.active').getAttribute('data-tab');
        await renderSubscriptions(activeTab);
      });
    });

    document.getElementById('subscription-close-btn').addEventListener('click', () => modal.remove());
  }

  async function showRenewSubscriptionForm(title, client, sub, callback) {
    const subscriptionTemplates = await getSubscriptionTemplates();
    const subscriptionTemplate = subscriptionTemplates.find(t => t.id == sub.template_id);
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
            <h3>Текущий абонемент</h3>
            <div class="info-grid">
              <div class="info-item"><span class="label">Клиент:</span><span class="value">${escapeHtml(client.surname)} ${escapeHtml(client.name)}</span></div>
              <div class="info-item"><span class="label">Номер:</span><span class="value">#${sub.subscription_number}</span></div>
              <div class="info-item"><span class="label">Тип:</span><span class="value">${subscriptionTemplate ? escapeHtml(subscriptionTemplate.type) : 'Неизвестный'}</span></div>
              <div class="info-item"><span class="label">Период:</span><span class="value">${sub.start_date} — ${sub.end_date}</span></div>
              <div class="info-item"><span class="label">Осталось:</span><span class="value ${sub.remaining_classes <= 3 && sub.remaining_classes !== Infinity ? 'low-classes' : ''}">${sub.remaining_classes === Infinity ? '∞' : sub.remaining_classes}</span></div>
              <div class="info-item"><span class="label">Статус:</span><span class="value status-${sub.is_paid && new Date(sub.end_date) >= new Date() ? 'active' : 'inactive'}">${sub.is_paid && new Date(sub.end_date) >= new Date() ? 'Активный' : 'Неактивный'}</span></div>
            </div>
            ${sub.renewal_history?.length ? `
              <div class="renewal-history-section">
                <h4>История продлений:</h4>
                <div class="renewal-list">
                  ${sub.renewal_history.map(entry => {
                    const date = new Date(entry.date || entry).toLocaleDateString('ru-RU');
                    return entry.fromTemplate ?
                      `<span class="renewal-item">${date}: ${escapeHtml(entry.fromTemplate)} → ${escapeHtml(entry.toTemplate)}</span>` :
                      `<span class="renewal-item">${date}</span>`;
                  }).join('')}
                </div>
              </div>
            ` : ''}
          </div>
          <div class="renewal-form">
            <h3>Параметры продления</h3>
            <div class="form-grid">
              <div class="form-group">
                <label for="renew-template" class="required">Тип абонемента</label>
                <select id="renew-template" required>
                  <option value="${sub.template_id}">${subscriptionTemplate ? escapeHtml(subscriptionTemplate.type) : 'Текущий'}</option>
                  ${subscriptionTemplates.filter(t => t.id != sub.template_id).map(t => `<option value="${t.id}">${escapeHtml(t.type)}</option>`).join('')}
                </select>
              </div>
              <div class="form-group">
                <label for="renew-end-date" class="required">Новая дата окончания</label>
                <input type="date" id="renew-end-date" value="${defaultEndDate.toISOString().split('T')[0]}" required>
              </div>
              <div class="form-group">
                <label for="renew-payment-method" class="required">Способ оплаты</label>
                <select id="renew-payment-method" required>
                  <option value="">Выберите</option>
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
      if (e.target === modal && !window.getSelection().toString()) closeModal();
    });
    modal.querySelector('.renew-close').addEventListener('click', closeModal);
    modal.querySelector('#renew-cancel-btn').addEventListener('click', closeModal);

    modal.querySelector('#renew-save-btn').addEventListener('click', () => {
      const templateId = modal.querySelector('#renew-template').value;
      const endDate = modal.querySelector('#renew-end-date').value;
      const paymentMethod = modal.querySelector('#renew-payment-method').value;
      const isPaid = modal.querySelector('#renew-is-paid').checked;

      if (!templateId || !endDate || !paymentMethod) {
        showToast('Заполните все поля!', 'error');
        return;
      }

      const newEnd = new Date(endDate);
      const currentEnd = new Date(sub.end_date);
      if (newEnd <= currentEnd) {
        showToast('Дата окончания должна быть позже текущей!', 'error');
        return;
      }

      const newTemplate = subscriptionTemplates.find(t => t.id == templateId);
      const renewalHistory = [...(sub.renewal_history || [])];
      renewalHistory.push({
        date: new Date().toISOString(),
        fromTemplate: subscriptionTemplate?.type || 'Неизвестный',
        toTemplate: newTemplate?.type || 'Неизвестный'
      });

      callback({
        template_id: templateId,
        end_date: endDate,
        paymentMethod,
        is_paid: isPaid,
        remaining_classes: newTemplate?.remainingClasses ?? sub.remaining_classes,
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
                ${clients.map(c => `<option value="${c.id}" ${sub.clientId === c.id ? 'selected' : ''}>${escapeHtml(c.surname)} ${escapeHtml(c.name)}</option>`).join('')}
              </select>
            </div>
            <div class="form-group">
              <label for="subscription-template" class="required">Тип абонемента</label>
              <select id="subscription-template" required>
                <option value="">Выберите тип</option>
                ${subscriptionTemplates.map(t => `<option value="${t.id}" ${sub.template_id == t.id ? 'selected' : ''}>${escapeHtml(t.type)}</option>`).join('')}
              </select>
            </div>
            <div class="form-group">
              <label for="subscription-classes-per-week" class="required">Занятий в неделю</label>
              <input type="number" id="subscription-classes-per-week" value="${sub.classes_per_week || 0}" min="0" max="7" required>
            </div>
            <div class="form-group">
              <label for="subscription-class-time" class="required">Время</label>
              <input type="time" id="subscription-class-time" value="${sub.class_time || '09:00'}" required>
            </div>
            <div class="form-group">
              <label for="subscription-start-date" class="required">Дата начала</label>
              <input type="date" id="subscription-start-date" value="${sub.start_date || ''}" required>
            </div>
            <div class="form-group">
              <label for="subscription-end-date" class="required">Дата окончания</label>
              <input type="date" id="subscription-end-date" value="${sub.end_date || ''}" required>
            </div>
            <div class="form-group full-width">
              <label>Дни недели</label>
              <div class="days-of-week-selector">
                ${['Пн','Вт','Ср','Чт','Пт','Сб','Вс'].map(day => `
                  <button type="button" class="day-button${sub.days_of_week?.includes(day) ? ' selected' : ''}" data-day="${day}">${day}</button>
                `).join('')}
              </div>
            </div>
            <div class="form-group">
              <label for="subscription-group">Группа</label>
              <select id="subscription-group">
                <option value="">Без группы</option>
                ${groups.map(g => `<option value="${g}" ${sub.group === g ? 'selected' : ''}>${g}</option>`).join('')}
              </select>
            </div>
            <div class="form-group">
              <label for="subscription-payment-method" class="required">Оплата</label>
              <select id="subscription-payment-method" required>
                <option value="">Выберите</option>
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
                Оплачен
              </label>
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
      if (e.target === modal && !window.getSelection().toString()) closeModal();
    });
    modal.querySelector('.subscription-form-close').addEventListener('click', closeModal);

    const dayButtons = modal.querySelectorAll('.day-button');
    dayButtons.forEach(btn => btn.addEventListener('click', () => btn.classList.toggle('selected')));

    const startInput = modal.querySelector('#subscription-start-date');
    const endInput = modal.querySelector('#subscription-end-date');
    startInput.addEventListener('change', () => {
      if (startInput.value && !endInput.value) {
        const d = new Date(startInput.value);
        d.setDate(d.getDate() + 30);
        endInput.value = d.toISOString().split('T')[0];
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
        showToast('Заполните все поля!', 'error');
        return;
      }
      if (new Date(endDate) <= new Date(startDate)) {
        showToast('Дата окончания должна быть позже начала!', 'error');
        return;
      }
      if (classesPerWeek > 0 && daysOfWeek.length === 0) {
        showToast('Выберите дни недели!', 'error');
        return;
      }

      const template = subscriptionTemplates.find(t => t.id == templateId);
      const number = sub.subscription_number || `SUB-${Date.now().toString().slice(-6)}`;

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
        remaining_classes: template?.remainingClasses ?? Infinity,
        is_paid: isPaid,
        renewal_history: sub.renewal_history || [],
        subscription_number: number
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

  function escapeHtml(s) {
    if (!s) return '';
    return String(s).replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
  }
}
