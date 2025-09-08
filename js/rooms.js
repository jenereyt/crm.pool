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
    <div class="header-content">
      <img src="images/icon-rooms.svg" alt="Залы" class="header-icon">
      <h1>Залы</h1>
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

  const roomTable = document.createElement('div');
  roomTable.className = 'room-table';
  mainContent.appendChild(roomTable);

  function renderRooms() {
    const filter = document.getElementById('room-filter').value.toLowerCase();
    roomTable.innerHTML = `
      <table>
        <thead>
          <tr>
            <th>Название</th>
            <th>Действия</th>
          </tr>
        </thead>
        <tbody>
          ${rooms
        .filter(room => room.name.toLowerCase().includes(filter))
        .map(room => `
              <tr class="room-row" id="${room.id}">
                <td>${room.name}</td>
                <td>
                  <button class="room-edit-btn" data-id="${room.id}">
                    <img src="images/icon-edit.svg" alt="Редактировать" class="action-icon">
                  </button>
                  <button class="room-delete-btn" data-id="${room.id}">
                    <img src="images/trash.svg" alt="Удалить" class="action-icon">
                  </button>
                </td>
              </tr>
            `).join('')}
        </tbody>
      </table>
    `;
  }

  renderRooms();

  document.getElementById('room-filter').addEventListener('input', renderRooms);
  document.getElementById('room-add-btn').addEventListener('click', () => {
    showRoomForm('Добавить зал', {}, (data) => {
      rooms.push({ id: `room${Date.now()}`, name: data.name });
      renderRooms();
    });
  });

  roomTable.addEventListener('click', (e) => {
    if (e.target.closest('.room-delete-btn')) {
      const roomId = e.target.closest('.room-delete-btn').getAttribute('data-id');
      if (confirm('Удалить зал?')) {
        rooms = rooms.filter(room => room.id !== roomId);
        renderRooms();
      }
    } else if (e.target.closest('.room-edit-btn')) {
      const roomId = e.target.closest('.room-edit-btn').getAttribute('data-id');
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

    modal.addEventListener('mousedown', (e) => {
      if (e.target.classList.contains('room-modal') && !window.getSelection().toString()) {
        modal.remove();
      }
    });

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
