import { server } from './server.js'; // Adjust the path if server.js is elsewhere

export async function getRooms() {
  try {
    const response = await fetch(`${server}/rooms`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!response.ok) throw new Error('Failed to fetch rooms');
    const rooms = await response.json();
    return Array.isArray(rooms) ? rooms : [];
  } catch (error) {
    console.error('Error fetching rooms:', error);
    return [];
  }
}

export async function loadRooms() {
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

  async function renderRooms() {
    const rooms = await getRooms();
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

  await renderRooms();

  document.getElementById('room-filter').addEventListener('input', renderRooms);
  document.getElementById('room-add-btn').addEventListener('click', () => {
    showRoomForm('Добавить зал', {}, async (data) => {
      try {
        const response = await fetch(`${server}/rooms`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: data.name }),
        });
        if (!response.ok) throw new Error('Failed to add room');
        await renderRooms();
      } catch (error) {
        console.error('Error adding room:', error);
        alert('Ошибка при добавлении зала!');
      }
    });
  });

  roomTable.addEventListener('click', async (e) => {
    if (e.target.closest('.room-delete-btn')) {
      const roomId = e.target.closest('.room-delete-btn').getAttribute('data-id');
      if (confirm('Удалить зал?')) {
        try {
          const response = await fetch(`${server}/rooms/${roomId}`, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: roomId }),
          });
          if (!response.ok) {
            const errorData = await response.text();
            console.error('Error response:', response.status, errorData);
            throw new Error('Failed to delete room');
          }
          await renderRooms();
        } catch (error) {
          console.error('Error deleting room:', error);
          alert('Ошибка при удалении зала!');
        }
      }
    } else if (e.target.closest('.room-edit-btn')) {
      const roomId = e.target.closest('.room-edit-btn').getAttribute('data-id');
      try {
        const response = await fetch(`${server}/rooms/${roomId}`, {
          method: 'GET',
        });
        if (!response.ok) {
          const errorData = await response.text();
          console.error('Error response:', response.status, errorData);
          throw new Error('Failed to fetch room');
        }
        const room = await response.json();
        showRoomForm('Редактировать зал', room, async (data) => {
          try {
            const response = await fetch(`${server}/rooms/${roomId}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ id: roomId, name: data.name }),
            });
            if (!response.ok) {
              const errorData = await response.text();
              console.error('Error response:', response.status, errorData);
              throw new Error('Failed to update room');
            }
            await renderRooms();
          } catch (error) {
            console.error('Error updating room:', error);
            alert('Ошибка при обновлении зала!');
          }
        });
      } catch (error) {
        console.error('Error fetching room for edit:', error);
        alert('Ошибка при получении данных зала!');
      }
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
