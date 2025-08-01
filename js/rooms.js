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
    <input type="text" placeholder="Поиск залов" class="filter-input" id="room-filter-input">
    <select class="filter-select" id="room-filter-select">
      <option value="">Тип зала</option>
      <option value="group">Групповые</option>
      <option value="individual">Индивидуальные</option>
      <option value="special">Специальные</option>
    </select>
    <button class="room-add-btn" id="room-add-btn">Добавить зал</button>
  `;
    mainContent.appendChild(filterBar);

    let rooms = [
        { id: 'room1', class: 'room-container', name: 'Зал 1', type: 'group', capacity: 20 },
        { id: 'room2', class: 'room-container', name: 'Зал 2', type: 'individual', capacity: 5 },
        { id: 'room3', class: 'room-container', name: 'Зал 3', type: 'group', capacity: 15 },
        { id: 'room4', class: 'room-container room-large', name: 'Большой зал', type: 'special', capacity: 50 },
    ];

    const roomList = document.createElement('div');
    roomList.className = 'room-list';
    mainContent.appendChild(roomList);

    function renderRooms() {
        roomList.innerHTML = rooms.map(room => `
      <div class="${room.class}" id="${room.id}">
        <h3>${room.name}</h3>
        <p>Тип: ${room.type === 'group' ? 'Групповой' : room.type === 'individual' ? 'Индивидуальный' : 'Специальный'}</p>
        <p>Вместимость: ${room.capacity} человек</p>
        <div class="room-actions">
          <button class="room-edit-btn" data-id="${room.id}">Редактировать</button>
          <button class="room-delete-btn" data-id="${room.id}">Удалить</button>
        </div>
      </div>
    `).join('');
    }

    renderRooms();

    const filterInput = document.getElementById('room-filter-input');
    const filterSelect = document.getElementById('room-filter-select');
    const addRoomBtn = document.getElementById('room-add-btn');

    filterInput.addEventListener('input', filterRooms);
    filterSelect.addEventListener('change', filterRooms);

    addRoomBtn.addEventListener('click', () => {
        showRoomModal('Добавить зал', {}, (data) => {
            const newRoom = {
                id: `room${Date.now()}`,
                class: data.type === 'special' ? 'room-container room-large' : 'room-container',
                name: data.name,
                type: data.type,
                capacity: data.capacity
            };
            rooms.push(newRoom);
            renderRooms();
            filterRooms();
        });
    });

    roomList.addEventListener('click', (e) => {
        if (e.target.classList.contains('room-delete-btn')) {
            const roomId = e.target.getAttribute('data-id');
            rooms = rooms.filter(room => room.id !== roomId);
            renderRooms();
            filterRooms();
        } else if (e.target.classList.contains('room-edit-btn')) {
            const roomId = e.target.getAttribute('data-id');
            const room = rooms.find(room => room.id === roomId);
            showRoomModal('Редактировать зал', room, (data) => {
                room.name = data.name;
                room.type = data.type;
                room.capacity = data.capacity;
                room.class = data.type === 'special' ? 'room-container room-large' : 'room-container';
                renderRooms();
                filterRooms();
            });
        }
    });

    function showRoomModal(title, room, callback) {
        const modal = document.createElement('div');
        modal.className = 'room-modal';
        modal.innerHTML = `
      <div class="room-modal-content">
        <h2>${title}</h2>
        <input type="text" id="room-name" placeholder="Название зала" value="${room.name || ''}" required>
        <select id="room-type" required>
          <option value="">Выберите тип</option>
          <option value="group" ${room.type === 'group' ? 'selected' : ''}>Групповой</option>
          <option value="individual" ${room.type === 'individual' ? 'selected' : ''}>Индивидуальный</option>
          <option value="special" ${room.type === 'special' ? 'selected' : ''}>Специальный</option>
        </select>
        <input type="number" id="room-capacity" placeholder="Вместимость" value="${room.capacity || ''}" min="1" required>
        <div class="room-modal-actions">
          <button id="room-save-btn">Сохранить</button>
          <button id="room-cancel-btn">Отмена</button>
        </div>
      </div>
    `;
        mainContent.appendChild(modal);

        document.getElementById('room-save-btn').addEventListener('click', () => {
            const name = document.getElementById('room-name').value.trim();
            const type = document.getElementById('room-type').value;
            const capacity = parseInt(document.getElementById('room-capacity').value);
            if (name && type && capacity > 0) {
                callback({ name, type, capacity });
                modal.remove();
            } else {
                alert('Заполните все поля корректно!');
            }
        });

        document.getElementById('room-cancel-btn').addEventListener('click', () => {
            modal.remove();
        });
    }

    function filterRooms() {
        const searchTerm = filterInput.value.toLowerCase();
        const roomType = filterSelect.value;
        const roomBlocks = roomList.querySelectorAll('.room-container, .room-large');
        roomBlocks.forEach(block => {
            const name = block.querySelector('h3').textContent.toLowerCase();
            const type = rooms.find(room => room.id === block.id).type;
            block.classList.toggle('room-hidden',
                (searchTerm && !name.includes(searchTerm)) ||
                (roomType && type !== roomType)
            );
        });
    }
}