export function openModal(clientId) {
    const modal = document.createElement('div');
    modal.className = 'clients-modal';
    const clients = [
        { id: 1, fullName: 'Иванов Иван', parentName: 'Петров Пётр', phones: ['+998-90-123-45-67', '+998-91-234-56-78'], diagnosis: 'Здоров', status: 'active' },
        { id: 2, fullName: 'Сидоров Сергей', parentName: 'Иванов Игорь', phones: ['+998-93-345-67-89', '+998-94-456-78-90'], diagnosis: 'Аллергія', status: 'inactive' },
    ];
    const client = clientId ? clients.find(c => c.id === clientId) : { fullName: '', parentName: '', phones: ['', ''], diagnosis: '', status: 'active' };

    modal.innerHTML = `
    <div class="modal-content">
      <span class="modal-close">×</span>
      <div class="modal-header">
        <h2 class="modal-title">${clientId ? 'Редактировать клиента' : 'Добавить клиента'}</h2>
      </div>
      <div class="modal-body">
        <div class="form-group">
          <label for="modal-fullName">ФИО</label>
          <input type="text" class="modal-input" id="modal-fullName" value="${client.fullName || ''}" placeholder="Введите ФИО">
        </div>
        <div class="form-group">
          <label for="modal-parentName">ФИО родителей</label>
          <input type="text" class="modal-input" id="modal-parentName" value="${client.parentName || ''}" placeholder="Введите ФИО родителей">
        </div>
        <div class="form-group">
          <label for="modal-phone1">Мобильный</label>
          <input type="text" class="modal-input" id="modal-phone1" value="${client.phones?.[0] || ''}" placeholder="Введите номер">
        </div>
        <div class="form-group">
          <label for="modal-phone2">Телефон родителя</label>
          <input type="text" class="modal-input" id="modal-phone2" value="${client.phones?.[1] || ''}" placeholder="Введите номер">
        </div>
        <div class="form-group">
          <label for="modal-diagnosis">Диагноз</label>
          <textarea class="modal-textarea" id="modal-diagnosis" placeholder="Введите диагноз">${client.diagnosis || ''}</textarea>
        </div>
        <div class="form-group">
          <label for="modal-photo">Фотография</label>
          <input type="file" class="modal-input" id="modal-photo" accept="image/*">
        </div>
        <div class="form-group">
          <label for="modal-features">Особенности</label>
          <textarea class="modal-textarea" id="modal-features" placeholder="Введите особенности"></textarea>
        </div>
        <div class="form-group">
          <label for="modal-blacklist">Черный список</label>
          <input type="checkbox" id="modal-blacklist" ${client.status === 'inactive' ? 'checked' : ''}>
        </div>
        <div class="form-group">
          <label for="modal-history">История переходов</label>
          <textarea class="modal-textarea" id="modal-history" placeholder="Введите историю"></textarea>
        </div>
        <div class="form-group">
          <label for="modal-contracts">Договор/Абонементы</label>
          <textarea class="modal-textarea" id="modal-contracts" placeholder="Введите данные"></textarea>
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
            fullName: document.getElementById('modal-fullName').value,
            parentName: document.getElementById('modal-parentName').value,
            phones: [document.getElementById('modal-phone1').value, document.getElementById('modal-phone2').value],
            diagnosis: document.getElementById('modal-diagnosis').value,
            status: document.getElementById('modal-blacklist').checked ? 'inactive' : 'active',
        });
        modal.remove();
    });
}