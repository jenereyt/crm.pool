import { getClients } from './clients.js';
import { getActiveSubscriptions, getInactiveSubscriptions, getSubscriptionTemplates } from './subscriptions.js';
import { scheduleData } from './schedule.js';
import { getTrainers } from './employees.js';
import { getGroups } from './groups.js';

export function loadReports() {
  const mainContent = document.getElementById('main-content');
  mainContent.innerHTML = '';

  const header = document.createElement('header');
  header.className = 'header';
  header.innerHTML = `
      <div class="header-content">
        <img src="images/icon-reports.svg" alt="Отчеты" class="header-icon">
        <h1>Отчеты</h1>
      </div>
    `;
  mainContent.appendChild(header);

  const tabsAndDate = document.createElement('div');
  tabsAndDate.className = 'tabs-and-date';
  tabsAndDate.innerHTML = `
      <div class="reports-tabs">
        <button class="tab-button active" data-tab="payments">Оплаты</button>
        <button class="tab-button" data-tab="employees">Сотрудники</button>
      </div>
      <div class="report-date">
        <label>Период: </label>
        <input type="date" id="report-start-date" value="2025-01-01">
        <input type="date" id="report-end-date" value="${new Date().toISOString().split('T')[0]}">
        <button id="generate-report">Сформировать</button>
        <button id="export-report">Экспорт в CSV</button>
      </div>
    `;
  mainContent.appendChild(tabsAndDate);

  const reportsSection = document.createElement('div');
  reportsSection.className = 'reports-section';
  mainContent.appendChild(reportsSection);

  const templates = getSubscriptionTemplates();
  const groups = getGroups();

  function getPeriod() {
    const start = document.getElementById('report-start-date').value;
    const end = document.getElementById('report-end-date').value;
    if (!start || !end) {
      showToast('Выберите начальную и конечную дату периода', 'error');
      return null;
    }
    return { start, end };
  }

  async function renderPayments() {
    const period = getPeriod();
    if (!period) return;

    const { start, end } = period;
    let activeSubs = [];
    let inactiveSubs = [];

    try {
      activeSubs = (await getActiveSubscriptions()) || [];
      inactiveSubs = (await getInactiveSubscriptions()) || [];
    } catch (error) {
      console.error('Ошибка при получении подписок:', error);
      showToast('Ошибка при загрузке данных подписок', 'error');
      return;
    }

    // Дополнительная проверка на массив
    activeSubs = Array.isArray(activeSubs) ? activeSubs : [];
    inactiveSubs = Array.isArray(inactiveSubs) ? inactiveSubs : [];

    const allSubs = [...activeSubs, ...inactiveSubs].filter(sub => {
      const subDate = new Date(sub.startDate);
      return subDate >= new Date(start) && subDate <= new Date(end);
    });

    const paymentStats = {
      'cash_register_cash': { count: 0, sum: 0 },
      'cash_register_card': { count: 0, sum: 0 },
      'cash': { count: 0, sum: 0 },
      'bank_account': { count: 0, sum: 0 }
    };

    allSubs.forEach(sub => {
      if (sub.paymentMethod && paymentStats[sub.paymentMethod]) {
        const template = templates.find(t => t.id === sub.templateId);
        const price = template ? template.price || 0 : 0;
        paymentStats[sub.paymentMethod].count++;
        paymentStats[sub.paymentMethod].sum += price;
      }
    });

    const totalSum = Object.values(paymentStats).reduce((acc, stat) => acc + stat.sum, 0);

    reportsSection.innerHTML = `
      <h2>Отчет по оплатам (${start} - ${end})</h2>
      <div class="report-summary">
        <div class="summary-item">
          <span class="summary-label">Всего оплат:</span>
          <span class="summary-value">${allSubs.length}</span>
        </div>
        <div class="summary-item">
          <span class="summary-label">Общая сумма:</span>
          <span class="summary-value">${totalSum.toLocaleString('ru-RU')} сум</span>
        </div>
      </div>
      <table class="report-table">
        <thead>
          <tr>
            <th>Способ оплаты</th>
            <th>Количество</th>
            <th>Сумма (сум)</th>
            <th>Детали</th>
          </tr>
        </thead>
        <tbody>
          ${Object.entries(paymentStats).map(([method, stat]) => {
      const methodLabel = method === 'cash_register_cash' ? 'Касса (наличные)' :
        method === 'cash_register_card' ? 'Касса (карта)' :
          method === 'cash' ? 'Наличные' : 'Расчетный счет';
      const details = allSubs.filter(sub => sub.paymentMethod === method).map(sub => {
        const template = templates.find(t => t.id === sub.templateId);
        const client = getClients().find(c => c.id === sub.clientId);
        return `${client ? `${client.surname} ${client.name}` : 'Неизвестный клиент'} - ${template ? template.type : 'Неизвестный'} (#${sub.subscriptionNumber})`;
      }).join('<br>');
      return `
              <tr>
                <td>${methodLabel}</td>
                <td>${stat.count}</td>
                <td>${stat.sum.toLocaleString('ru-RU')}</td>
                <td>${details || 'Нет деталей'}</td>
              </tr>
            `;
    }).join('')}
          <tr class="total-row">
            <td><strong>Итого</strong></td>
            <td><strong>${allSubs.length}</strong></td>
            <td><strong>${totalSum.toLocaleString('ru-RU')}</strong></td>
            <td></td>
          </tr>
        </tbody>
      </table>
    `;
  }

  async function renderEmployees() {
    const period = getPeriod();
    if (!period) return;

    const { start, end } = period;
    let trainers = [];
    try {
      trainers = await getTrainers();
    } catch (error) {
      console.error('Ошибка при получении тренеров:', error);
      showToast('Ошибка при загрузке данных тренеров', 'error');
      return;
    }

    trainers = Array.isArray(trainers) ? trainers : [];

    const trainerStats = {};
    trainers.forEach(trainer => {
      trainerStats[trainer.name] = { count: 0, classes: [] };
    });

    const filteredSchedule = scheduleData.filter(cls => {
      const clsDate = new Date(cls.date);
      return clsDate >= new Date(start) && clsDate <= new Date(end);
    });

    filteredSchedule.forEach(cls => {
      if (trainers.find(t => t.name === cls.trainer)) {
        trainerStats[cls.trainer].count++;
        trainerStats[cls.trainer].classes.push({ name: cls.name, date: cls.date, group: cls.group || 'Без группы' });
      }
    });

    const totalClasses = Object.values(trainerStats).reduce((acc, stat) => acc + stat.count, 0);

    // Проверяем, что groups — это массив
    const groupsList = Array.isArray(groups) ? groups : [];
    const groupFilter = `
      <div class="group-filter">
        <label>Группа: </label>
        <select id="group-filter">
          <option value="">Все группы</option>
          ${groupsList.map(group => `<option value="${escapeHtml(group.name)}">${escapeHtml(group.name)}</option>`).join('')}
        </select>
      </div>
    `;

    reportsSection.innerHTML = `
      <h2>Отчет по сотрудникам (${start} - ${end})</h2>
      ${groupFilter}
      <div class="report-summary">
        <div class="summary-item">
          <span class="summary-label">Всего занятий:</span>
          <span class="summary-value">${totalClasses}</span>
        </div>
      </div>
      <table class="report-table">
        <thead>
          <tr>
            <th>Тренер</th>
            <th>Количество занятий</th>
            <th>Детали</th>
          </tr>
        </thead>
        <tbody>
          ${Object.entries(trainerStats).map(([trainerName, stat]) => {
      const groupFilterValue = document.getElementById('group-filter')?.value || '';
      const filteredClasses = groupFilterValue
        ? stat.classes.filter(cls => cls.group === groupFilterValue)
        : stat.classes;
      const displayCount = groupFilterValue ? filteredClasses.length : stat.count;
      const sortedClasses = filteredClasses.sort((a, b) => new Date(a.date) - new Date(b.date));
      const previewDetails = sortedClasses.slice(0, 3).map(cls => `${cls.name} (${formatDate(cls.date)})`).join('<br>');
      const allDetails = sortedClasses.map(cls => `${cls.name} (${formatDate(cls.date)}, группа: ${cls.group})`).join('<br>');
      return `
              <tr>
                <td>${trainerName}</td>
                <td>${displayCount}</td>
                <td>
                  ${previewDetails || 'Нет деталей'}
                  ${sortedClasses.length > 3 ? `<br><button class="details-btn" data-details="${encodeURIComponent(allDetails)}">Подробнее</button>` : ''}
                </td>
              </tr>
            `;
    }).join('')}
          <tr class="total-row">
            <td><strong>Итого</strong></td>
            <td><strong>${totalClasses}</strong></td>
            <td></td>
          </tr>
        </tbody>
      </table>
    `;

    const groupFilterSelect = reportsSection.querySelector('#group-filter');
    if (groupFilterSelect) {
      groupFilterSelect.addEventListener('change', () => {
        renderEmployees();
      });
    }

    reportsSection.querySelectorAll('.details-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const details = decodeURIComponent(btn.dataset.details);
        showDetailsModal(details);
      });
    });
  }

  function formatDate(dateString) {
    if (!dateString) return '—';
    const date = new Date(dateString);
    return date.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }

  function showDetailsModal(details) {
    const modal = document.createElement('div');
    modal.className = 'details-modal';
    modal.innerHTML = `
        <div class="details-modal-content">
          <h3>Детали занятий</h3>
          <div class="details-content">${details}</div>
          <button class="btn-primary close-details-btn">Закрыть</button>
        </div>
      `;
    document.body.appendChild(modal);

    modal.querySelector('.close-details-btn').addEventListener('click', () => modal.remove());
    modal.addEventListener('click', (e) => {
      if (e.target === modal) modal.remove();
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') modal.remove();
    }, { once: true });
  }

  function escapeCSVValue(value) {
    if (value === null || value === undefined) return '';
    const stringValue = String(value);
    if (stringValue.includes(';') || stringValue.includes('"') || stringValue.includes('\n') || stringValue.includes(',')) {
      return `"${stringValue.replace(/"/g, '""')}"`;
    }
    return stringValue;
  }

  function exportToCSV(tab) {
    const period = getPeriod();
    if (!period) return;

    const { start, end } = period;
    let csvRows = [];

    try {
      if (tab === 'payments') {
        const activeSubs = getActiveSubscriptions();
        const inactiveSubs = getInactiveSubscriptions();
        const allSubs = [...activeSubs, ...inactiveSubs].filter(sub => {
          const subDate = new Date(sub.startDate);
          return subDate >= new Date(start) && subDate <= new Date(end);
        });

        // Add header for payments
        csvRows.push(['Способ оплаты', 'Клиент', 'Абонемент', 'Номер абонемента', 'Сумма (сум)', 'Дата начала']);

        // Add individual subscription rows
        allSubs.forEach(sub => {
          const template = templates.find(t => t.id === sub.templateId);
          const client = getClients().find(c => c.id === sub.clientId);
          const methodLabel = sub.paymentMethod === 'cash_register_cash' ? 'Касса (наличные)' :
            sub.paymentMethod === 'cash_register_card' ? 'Касса (карта)' :
              sub.paymentMethod === 'cash' ? 'Наличные' :
                sub.paymentMethod === 'bank_account' ? 'Расчетный счет' : 'Неизвестно';
          const price = template ? template.price || 0 : 0;
          csvRows.push([
            methodLabel,
            client ? `${client.surname} ${client.name}` : 'Неизвестный клиент',
            template ? template.type : 'Неизвестный',
            sub.subscriptionNumber || '—',
            price,
            formatDate(sub.startDate)
          ]);
        });

        // Add summary row
        const totalSum = allSubs.reduce((acc, sub) => {
          const template = templates.find(t => t.id === sub.templateId);
          return acc + (template ? template.price || 0 : 0);
        }, 0);
        csvRows.push(['Итого', '', '', allSubs.length, totalSum, '']);
      } else if (tab === 'employees') {
        const trainers = getTrainers();
        const trainerStats = {};
        trainers.forEach(trainer => trainerStats[trainer] = { count: 0, classes: [] });

        const filteredSchedule = scheduleData.filter(cls => {
          const clsDate = new Date(cls.date);
          return clsDate >= new Date(start) && clsDate <= new Date(end);
        });

        filteredSchedule.forEach(cls => {
          if (trainers.includes(cls.trainer)) {
            trainerStats[cls.trainer].count++;
            trainerStats[cls.trainer].classes.push({ name: cls.name, date: cls.date, group: cls.group || 'Без группы' });
          }
        });

        // Add header for employees
        csvRows.push(['Тренер', 'Название занятия', 'Дата', 'Группа']);

        // Add individual class rows
        Object.entries(trainerStats).forEach(([trainer, stat]) => {
          const groupFilterValue = document.getElementById('group-filter')?.value || '';
          const filteredClasses = groupFilterValue ? stat.classes.filter(cls => cls.group === groupFilterValue) : stat.classes;
          filteredClasses.sort((a, b) => new Date(a.date) - new Date(b.date)).forEach(cls => {
            csvRows.push([
              trainer,
              cls.name,
              formatDate(cls.date),
              cls.group
            ]);
          });
        });

        // Add summary row
        const totalClasses = Object.values(trainerStats).reduce((acc, stat) => acc + stat.count, 0);
        csvRows.push(['Итого', '', totalClasses, '']);
      }

      // Convert rows to CSV format with semicolon delimiter
      const csvContent = '\uFEFF' + csvRows.map(row => row.map(escapeCSVValue).join(';')).join('\n');
      const encodedUri = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `report_${tab}_${start}_${end}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      showToast('Отчет успешно экспортирован в CSV', 'success');
    } catch (error) {
      console.error('Ошибка при экспорте CSV:', error);
      showToast('Ошибка при экспорте CSV. Попробуйте снова.', 'error');
    }
  }

  renderPayments();

  document.getElementById('generate-report').addEventListener('click', () => {
    const activeTab = document.querySelector('.tab-button.active').getAttribute('data-tab');
    if (activeTab === 'payments') {
      renderPayments();
    } else if (activeTab === 'employees') {
      renderEmployees();
    }
  });

  document.getElementById('export-report').addEventListener('click', () => {
    const activeTab = document.querySelector('.tab-button.active').getAttribute('data-tab');
    exportToCSV(activeTab);
  });

  tabsAndDate.addEventListener('click', (e) => {
    if (e.target.classList.contains('tab-button')) {
      document.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
      e.target.classList.add('active');
      const tab = e.target.getAttribute('data-tab');
      if (tab === 'payments') {
        renderPayments();
      } else if (tab === 'employees') {
        renderEmployees();
      }
    }
  });
}
