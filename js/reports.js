// reports.js (updated for "сум" in employees report)
import { getClients } from './clients.js';
import { getActiveSubscriptions, getInactiveSubscriptions, getSubscriptionTemplates } from './subscriptions.js';
import { scheduleData } from './schedule.js';
import { getTrainers } from './employees.js';

export function loadReports() {
  const mainContent = document.getElementById('main-content');
  mainContent.innerHTML = '';

  const header = document.createElement('header');
  header.className = 'header';
  header.innerHTML = `
    <div class="header-content">
      <img src="images/icon-reports.svg" alt="Отчеты" class="header-icon">
      <h1>Отчеты</h1>
      <div class="report-date">
        <label>Период: </label>
        <input type="date" id="report-start-date" value="2025-01-01">
        <input type="date" id="report-end-date" value="${new Date().toISOString().split('T')[0]}">
        <button id="generate-report">Сформировать</button>
      </div>
    </div>
  `;
  mainContent.appendChild(header);

  const tabs = document.createElement('div');
  tabs.className = 'reports-tabs';
  tabs.innerHTML = `
    <button class="tab-button active" data-tab="payments">Оплаты</button>
    <button class="tab-button" data-tab="employees">Сотрудники</button>
  `;
  mainContent.appendChild(tabs);

  const reportsSection = document.createElement('div');
  reportsSection.className = 'reports-section';
  mainContent.appendChild(reportsSection);

  const templates = getSubscriptionTemplates();

  function getPeriod() {
    const start = document.getElementById('report-start-date').value;
    const end = document.getElementById('report-end-date').value;
    return { start, end };
  }

  function renderPayments() {
    const { start, end } = getPeriod();
    const activeSubs = getActiveSubscriptions();
    const inactiveSubs = getInactiveSubscriptions();
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
          <span class="summary-value">${totalSum.toLocaleString('ru-RU')} сум.</span>
        </div>
      </div>
      <table class="report-table">
        <thead>
          <tr>
            <th>Способ оплаты</th>
            <th>Количество</th>
            <th>Сумма (сум.)</th>
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
        return `${template ? template.type : 'Неизвестный'} (#${sub.subscriptionNumber})`;
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

  function renderEmployees() {
    const { start, end } = getPeriod();
    const trainers = getTrainers();
    const trainerStats = {};
    trainers.forEach(trainer => trainerStats[trainer] = { count: 0, sum: 0 });

    const filteredSchedule = scheduleData.filter(cls => {
      const clsDate = new Date(cls.date);
      return clsDate >= new Date(start) && clsDate <= new Date(end);
    });

    filteredSchedule.forEach(cls => {
      if (trainers.includes(cls.trainer)) {
        trainerStats[cls.trainer].count++;
        // Assume fixed price per class, e.g., 1000 sum
        trainerStats[cls.trainer].sum += 1000; // Adjust based on your pricing logic
      }
    });

    const totalClasses = Object.values(trainerStats).reduce((acc, stat) => acc + stat.count, 0);
    const totalSum = Object.values(trainerStats).reduce((acc, stat) => acc + stat.sum, 0);

    reportsSection.innerHTML = `
      <h2>Отчет по сотрудникам (${start} - ${end})</h2>
      <div class="report-summary">
        <div class="summary-item">
          <span class="summary-label">Всего занятий:</span>
          <span class="summary-value">${totalClasses}</span>
        </div>
        <div class="summary-item">
          <span class="summary-label">Общая сумма:</span>
          <span class="summary-value">${totalSum.toLocaleString('ru-RU')} сум</span>
        </div>
      </div>
      <table class="report-table">
        <thead>
          <tr>
            <th>Тренер</th>
            <th>Количество занятий</th>
            <th>Сумма (сум)</th>
            <th>Детали</th>
          </tr>
        </thead>
        <tbody>
          ${Object.entries(trainerStats).map(([trainer, stat]) => {
      const details = filteredSchedule.filter(cls => cls.trainer === trainer).map(cls => `${cls.name} (${cls.date})`).join('<br>');
      return `
              <tr>
                <td>${trainer}</td>
                <td>${stat.count}</td>
                <td>${stat.sum.toLocaleString('ru-RU')}</td>
                <td>${details || 'Нет деталей'}</td>
              </tr>
            `;
    }).join('')}
          <tr class="total-row">
            <td><strong>Итого</strong></td>
            <td><strong>${totalClasses}</strong></td>
            <td><strong>${totalSum.toLocaleString('ru-RU')}</strong></td>
            <td></td>
          </tr>
        </tbody>
      </table>
    `;
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

  tabs.addEventListener('click', (e) => {
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
