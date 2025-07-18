export function openModal(subscriptionId) {
    const modal = document.createElement('div');
    modal.className = 'subscriptions-modal';
    const subscriptions = [
        { id: 1, clientName: 'Иванов Иван', type: 'Месячный', startDate: '2025-06-18', endDate: '2025-07-18', status: 'active', price: 5000 },
        { id: 2, clientName: 'Сидоров Сергей', type: 'Квартальный', startDate: '2025-04-01', endDate: '2025-06-30', status: 'expired', price: 12000 },
    ];
    const subscription = subscriptionId ? subscriptions.find(s => s.id === subscriptionId) : { clientName: '', type: '', startDate: '', endDate: '', status: 'active', price: '' };

    modal.innerHTML = `
    <div class="modal-content">
      <span class="modal-close">×</span>
      <div class="modal-header">
        <h2 class="modal-title">${subscriptionId ? 'Редактировать абонемент' : 'Добавить абонемент'}</h2>
      </div>
      <div class="modal-body">
        <div class="form-group">
          <label for="modal-clientName">Клиент</label>
          <input type="text" class="modal-input" id="modal-clientName" value="${subscription.clientName || ''}" placeholder="Введите имя клиента">
        </div>
        <div class="form-group">
          <label for="modal-type">Тип абонемента</label>
          <select class="modal-input" id="modal-type">
            <option value="" ${!subscription.type ? 'selected' : ''}>Выберите тип</option>
            <option value="Месячный" ${subscription.type === 'Месячный' ? 'selected' : ''}>Месячный</option>
            <option value="Квартальный" ${subscription.type === 'Квартальный' ? 'selected' : ''}>Квартальный</option>
            <option value="Годовой" ${subscription.type === 'Годовой' ? 'selected' : ''}>Годовой</option>
          </select>
        </div>
        <div class="form-group">
          <label for="modal-startDate">Дата начала</label>
          <input type="date" class="modal-input" id="modal-startDate" value="${subscription.startDate || ''}">
        </div>
        <div class="form-group">
          <label for="modal-endDate">Дата окончания</label>
          <input type="date" class="modal-input" id="modal-endDate" value="${subscription.endDate || ''}">
        </div>
        <div class="form-group">
          <label for="modal-status">Статус</label>
          <select class="modal-input" id="modal-status">
            <option value="active" ${subscription.status === 'active' ? 'selected' : ''}>Активный</option>
            <option value="expired" ${subscription.status === 'expired' ? 'selected' : ''}>Просрочен</option>
          </select>
        </div>
        <div class="form-group">
          <label for="modal-price">Цена</label>
          <input type="number" class="modal-input" id="modal-price" value="${subscription.price || ''}" placeholder="Введите цену в UZS">
        </div>
      </div>
      <div class="modal-footer">
        <button class="modal-save">Сохранить</button>
      </div>
    </div>
  `;
    document.body.appendChild(modal);

    console.log('Модалка добавлена в DOM:', modal); // Отладка

    const closeBtn = modal.querySelector('.modal-close');
    closeBtn.addEventListener('click', () => modal.remove());
    modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.remove();
    });

    const saveBtn = modal.querySelector('.modal-save');
    saveBtn.addEventListener('click', () => {
        console.log('Сохранение:', {
            clientName: document.getElementById('modal-clientName').value,
            type: document.getElementById('modal-type').value,
            startDate: document.getElementById('modal-startDate').value,
            endDate: document.getElementById('modal-endDate').value,
            status: document.getElementById('modal-status').value,
            price: document.getElementById('modal-price').value,
        });
        modal.remove();
    });
}