let clients = [
  {
    id: 'client1',
    photo: './images/default-icon.svg',
    name: 'Иван Сергеев',
    parentName: 'Сергей Иванов',
    phone: '+7 (900) 123-45-67',
    parentPhone: '+7 (900) 765-43-21',
    diagnosis: 'Нет',
    features: 'Аллергия на хлор',
    blacklisted: false
  },
  {
    id: 'client2',
    photo: './images/default-icon.svg',
    name: 'Марина Ковалёва',
    parentName: '',
    phone: '+7 (900) 234-56-78',
    parentPhone: '',
    diagnosis: 'Астма',
    features: 'Требуется сопровождение',
    blacklisted: false
  },
  {
    id: 'client3',
    photo: './images/default-icon.svg',
    name: 'Алексей Попов',
    parentName: 'Ольга Попова',
    phone: '+7 (900) 345-67-89',
    parentPhone: '+7 (900) 987-65-43',
    diagnosis: 'Нет',
    features: 'Новичок в плавании',
    blacklisted: false
  }
];

export async function getClients() {
  return clients;
}

export async function loadClients() {
  const mainContent = document.getElementById('main-content');
  mainContent.innerHTML = '';

  const header = document.createElement('header');
  header.className = 'header';
  header.innerHTML = `
    <h1>Клиенты</h1>
    <div class="user-actions">
      <span>Пользователь</span>
      <button>Выход</button>
    </div>
  `;
  mainContent.appendChild(header);

  const filterBar = document.createElement('div');
  filterBar.className = 'filter-bar';
  filterBar.innerHTML = `
    <input type="text" id="client-filter" class="filter-input" placeholder="Поиск по ФИО">
    <button class="client-add-btn" id="client-add-btn">Добавить клиента</button>
  `;
  mainContent.appendChild(filterBar);

  const clientList = document.createElement('div');
  clientList.className = 'client-list';
  mainContent.appendChild(clientList);

  function renderClients() {
    const filter = document.getElementById('client-filter').value.toLowerCase();
    clientList.innerHTML = clients
      .filter(client => client.name.toLowerCase().includes(filter))
      .map(client => `
        <div class="client-container" data-id="${client.id}">
          <img src="${client.photo || './images/default-icon.svg'}" alt="${client.name}" class="client-photo" onerror="this.src='./images/default-icon.svg'">
          <h3>${client.name}</h3>
          <p>ФИО родителя: ${client.parentName || 'Не указано'}</p>
          <p>Телефон: ${client.phone}</p>
          <p>Телефон родителя: ${client.parentPhone || 'Не указано'}</p>
          <p>Диагноз: ${client.diagnosis || 'Нет'}</p>
          <p>Особенности: ${client.features || 'Нет'}</p>
          <p>Чёрный список: ${client.blacklisted ? 'Да' : 'Нет'}</p>
          <div class="client-actions">
            <button class="client-edit-btn" data-id="${client.id}">Редактировать</button>
            <button class="client-blacklist-btn" data-id="${client.id}">${client.blacklisted ? 'Убрать из чёрного списка' : 'Добавить в чёрный список'}</button>
            <button class="client-delete-btn" data-id="${client.id}">Удалить</button>
          </div>
        </div>
      `).join('');
  }

  renderClients();

  document.getElementById('client-filter').addEventListener('input', renderClients);
  document.getElementById('client-add-btn').addEventListener('click', () => {
    showClientForm('Добавить клиента', {}, (data) => {
      clients.push({ id: `client${Date.now()}`, ...data, blacklisted: false });
      renderClients();
    });
  });

  clientList.addEventListener('click', (e) => {
    if (e.target.classList.contains('client-delete-btn')) {
      const clientId = e.target.getAttribute('data-id');
      if (confirm('Удалить клиента?')) {
        clients = clients.filter(client => client.id !== clientId);
        renderClients();
      }
    } else if (e.target.classList.contains('client-edit-btn')) {
      const clientId = e.target.getAttribute('data-id');
      const client = clients.find(c => c.id === clientId);
      showClientForm('Редактировать клиента', client, (data) => {
        Object.assign(client, data);
        renderClients();
      });
    } else if (e.target.classList.contains('client-blacklist-btn')) {
      const clientId = e.target.getAttribute('data-id');
      const client = clients.find(c => c.id === clientId);
      client.blacklisted = !client.blacklisted;
      renderClients();
    }
  });

  function showClientForm(title, client, callback) {
    const modal = document.createElement('div');
    modal.className = 'client-modal';
    modal.innerHTML = `
      <div class="client-modal-content">
        <h2>${title}</h2>
        <input type="file" id="client-photo-upload" accept="image/*">
        <img id="client-photo-preview" src="${client.photo || './images/default-icon.svg'}" alt="Preview" class="client-photo-preview">
        <input type="text" id="client-name" placeholder="ФИО" value="${client.name || ''}" required>
        <input type="text" id="client-parent-name" placeholder="ФИО родителя" value="${client.parentName || ''}">
        <input type="text" id="client-phone" placeholder="Номер телефона" value="${client.phone || ''}" required>
        <input type="text" id="client-parent-phone" placeholder="Номер телефона родителя" value="${client.parentPhone || ''}">
        <input type="text" id="client-diagnosis" placeholder="Диагноз" value="${client.diagnosis || ''}">
        <input type="text" id="client-features" placeholder="Особенности" value="${client.features || ''}">
        <div class="client-modal-actions">
          <button id="client-save-btn">Сохранить</button>
          <button id="client-cancel-btn">Отмена</button>
        </div>
      </div>
    `;
    mainContent.appendChild(modal);

    const photoUpload = document.getElementById('client-photo-upload');
    const photoPreview = document.getElementById('client-photo-preview');

    photoUpload.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          photoPreview.src = event.target.result;
        };
        reader.readAsDataURL(file);
      } else {
        photoPreview.src = './images/default-icon.svg';
      }
    });

    document.getElementById('client-save-btn').addEventListener('click', () => {
      const name = document.getElementById('client-name').value.trim();
      const parentName = document.getElementById('client-parent-name').value.trim();
      const phone = document.getElementById('client-phone').value.trim();
      const parentPhone = document.getElementById('client-parent-phone').value.trim();
      const diagnosis = document.getElementById('client-diagnosis').value.trim();
      const features = document.getElementById('client-features').value.trim();
      const photo = photoPreview.src !== './images/default-icon.svg' ? photoPreview.src : './images/default-icon.svg';

      if (name && phone) {
        callback({ photo, name, parentName, phone, parentPhone, diagnosis, features });
        modal.remove();
      } else {
        alert('Заполните обязательные поля (ФИО, телефон)!');
      }
    });

    document.getElementById('client-cancel-btn').addEventListener('click', () => {
      modal.remove();
    });
  }
}