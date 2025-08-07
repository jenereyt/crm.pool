let rooms = [
  { id: 'room1', name: 'Большой бассейн' },
  { id: 'room2', name: 'Малый бассейн' },
  { id: 'room3', name: 'Зона аквааэробики' },
  { id: 'room4', name: 'Тренировочный зал' },
];

export function getRooms() {
  return Array.isArray(rooms) ? rooms : [];
}

export function loadRooms() {
  const mainContent = document.getElementById('main-content');
  mainContent.innerHTML = '';

  const header = document.createElement('header');
  header.className = 'header';
  header.innerHTML = `
    <h1>Залы</h1>
    <div class="user-actions">
      <span>Пользователь</span>
      <button>Выход</button>
    </div>
  `;
  mainContent.appendChild(header);

  const filterBar = document.createElement('div');
  filterBar.className = 'filter-bar';
  filterBar.innerHTML = `
    <input type="text" id="room-filter" class="filter-input" placeholder="Поиск по названию">
    <button class="room-add-btn" id="room-add-btn">Добавить зал</button>
  `;
  mainContent.appendChild(filterBar);

  const roomList = document.createElement('div');
  roomList.className = 'room-list';
  mainContent.appendChild(roomList);

  function renderRooms() {
    const filter = document.getElementById('room-filter').value.toLowerCase();
    roomList.innerHTML = rooms
      .filter(room => room.name.toLowerCase().includes(filter))
      .map(room => `
        <div class="room-container" data-id="${room.id}">
          <h3>${room.name}</h3>
          <div class="room-actions">
            <button class="room-edit-btn" data-id="${room.id}">Редактировать</button>
            <button class="room-delete-btn" data-id="${room.id}">Удалить</button>
          </div>
        </div>
      `).join('');
  }

  renderRooms();

  document.getElementById('room-filter').addEventListener('input', renderRooms);
  document.getElementById('room-add-btn').addEventListener('click', () => {
    showRoomForm('Добавить зал', {}, (data) => {
      rooms.push({ id: `room${Date.now()}`, name: data.name });
      renderRooms();
    });
  });

  roomList.addEventListener('click', (e) => {
    if (e.target.classList.contains('room-delete-btn')) {
      const roomId = e.target.getAttribute('data-id');
      if (confirm('Удалить зал?')) {
        rooms = rooms.filter(room => room.id !== roomId);
        renderRooms();
      }
    } else if (e.target.classList.contains('room-edit-btn')) {
      const roomId = e.target.getAttribute('data-id');
      const room = rooms.find(r => r.id === roomId);
      showRoomForm('Редактировать зал', room, (data) => {
        room.name = data.name;
        renderRooms();
      });
    }
  });

  function showRoomForm(title, room, callback) {
    const modal = document.createElement('div');
    modal.className = 'room-modal';
    modal.innerHTML = `
      <div class="room-modal-content">
        <h2>${title}</h2>
        <input type="text" id="room-name" placeholder="Название зала" value="${room.name || ''}" required>
        <div class="room-modal-actions">
          <button id="room-save-btn">Сохранить</button>
          <button id="room-cancel-btn">Отмена</button>
        </div>
      </div>
    `;
    mainContent.appendChild(modal);

    document.getElementById('room-save-btn').addEventListener('click', () => {
      const name = document.getElementById('room-name').value.trim();
      if (name) {
        callback({ name });
        modal.remove();
      } else {
        alert('Введите название зала!');
      }
    });

    document.getElementById('room-cancel-btn').addEventListener('click', () => {
      modal.remove();
    });
  }
}