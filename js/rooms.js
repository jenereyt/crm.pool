// rooms.js
import { server } from './server.js'; // Adjust the path if server.js is elsewhere

export async function getRooms() {
  try {
    const token = localStorage.getItem('token');
    const response = await fetch(`${server}/rooms`, {
      method: 'GET',
      headers: { 
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` })
      },
    });
    if (!response.ok) {
      if (response.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('userRole');
        localStorage.removeItem('username');
        window.location.reload(); // Автоматический выход при 401
      }
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    const rooms = await response.json();
    return Array.isArray(rooms) ? rooms : [];
  } catch (error) {
    console.error('Error fetching rooms:', error);
    return [];
  }
}

export async function loadRooms(userRole) { // Добавлен параметр userRole для проверки роли
  const mainContent = document.getElementById('main-content');
  mainContent.innerHTML = '';

  const header = document.createElement('header');
  header.className = 'header';
  header.innerHTML = `
    <div class="header-content">
      <img src="./images/icon-rooms.svg" alt="Залы" class="header-icon"> <!-- Исправлен путь -->
      <h1>Залы</h1>
    </div>
  `;
  mainContent.appendChild(header);

  const filterBar = document.createElement('div');
  filterBar.className = 'filter-bar';
  filterBar.innerHTML = `
    <input type="text" id="room-filter" class="filter-input" placeholder="Поиск по названию">
    ${userRole === 'manager' ? '<button class="room-add-btn" id="room-add-btn">Добавить зал</button>' : ''} <!-- Показывать кнопку только для менеджера -->
  `;
  mainContent.appendChild(filterBar);

  const roomTable = document.createElement('div');
  roomTable.className = 'room-table';
  mainContent.appendChild(roomTable);

  async function renderRooms() {
    const rooms = await getRooms();
    const filter = document.getElementById('room-filter').value.toLowerCase();
    const filteredRooms = rooms.filter(room => room.name.toLowerCase().includes(filter));
    if (filteredRooms.length === 0) {
      roomTable.innerHTML = `
        <p class="no-rooms-message">Залы не найдены${filter ? ` по запросу "${filter}"` : ''}</p>
      `;
      return;
    }

    roomTable.innerHTML = `
      <table>
        <thead>
          <tr>
            <th>Название</th>
            <th>Действия</th>
          </tr>
        </thead>
        <tbody>
          ${filteredRooms
            .map(room => `
              <tr class="room-row" id="${room.id}">
                <td>${room.name}</td>
                <td>
                  ${userRole === 'manager' ? `
                    <button class="room-edit-btn" data-id="${room.id}">
                      <img src="./images/icon-edit.svg" alt="Редактировать" class="action-icon">
                    </button>
                    <button class="room-delete-btn" data-id="${room.id}">
                      <img src="./images/trash.svg" alt="Удалить" class="action-icon">
                    </button>
                  ` : ''}
                </td>
              </tr>
            `).join('')}
        </tbody>
      </table>
    `;
  }

  await renderRooms();

  document.getElementById('room-filter').addEventListener('input', renderRooms);

  if (userRole === 'manager') {
    document.getElementById('room-add-btn').addEventListener('click', () => {
      showRoomForm('Добавить зал', {}, async (data) => {
        try {
          const token = localStorage.getItem('token');
          const response = await fetch(`${server}/rooms`, {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              ...(token && { 'Authorization': `Bearer ${token}` })
            },
            body: JSON.stringify({ name: data.name }),
          });
          if (!response.ok) {
            if (response.status === 401) {
              localStorage.removeItem('token');
              localStorage.removeItem('userRole');
              localStorage.removeItem('username');
              window.location.reload();
            }
            throw new Error(`HTTP error! Status: ${response.status}`);
          }
          await renderRooms();
        } catch (error) {
          console.error('Error adding room:', error);
          alert('Ошибка при добавлении зала: ' + error.message);
        }
      });
    });

    roomTable.addEventListener('click', async (e) => {
      if (e.target.closest('.room-delete-btn')) {
        const roomId = e.target.closest('.room-delete-btn').getAttribute('data-id');
        if (confirm('Удалить зал?')) {
          try {
            const token = localStorage.getItem('token');
            const response = await fetch(`${server}/rooms/${roomId}`, {
              method: 'DELETE',
              headers: { 
                ...(token && { 'Authorization': `Bearer ${token}` })
              },
              // Убрали body — для DELETE оно не нужно
            });
            if (!response.ok) {
              if (response.status === 401) {
                localStorage.removeItem('token');
                localStorage.removeItem('userRole');
                localStorage.removeItem('username');
                window.location.reload();
              }
              const errorData = await response.text();
              console.error('Error response:', response.status, errorData);
              throw new Error(`HTTP error! Status: ${response.status}`);
            }
            await renderRooms();
          } catch (error) {
            console.error('Error deleting room:', error);
            alert('Ошибка при удалении зала: ' + error.message);
          }
        }
      } else if (e.target.closest('.room-edit-btn')) {
        const roomId = e.target.closest('.room-edit-btn').getAttribute('data-id');
        try {
          const token = localStorage.getItem('token');
          const response = await fetch(`${server}/rooms/${roomId}`, {
            method: 'GET',
            headers: { 
              ...(token && { 'Authorization': `Bearer ${token}` })
            },
          });
          if (!response.ok) {
            if (response.status === 401) {
              localStorage.removeItem('token');
              localStorage.removeItem('userRole');
              localStorage.removeItem('username');
              window.location.reload();
            }
            const errorData = await response.text();
            console.error('Error response:', response.status, errorData);
            throw new Error(`HTTP error! Status: ${response.status}`);
          }
          const room = await response.json();
          showRoomForm('Редактировать зал', room, async (data) => {
            try {
              const updateResponse = await fetch(`${server}/rooms/${roomId}`, {
                method: 'PUT',
                headers: { 
                  'Content-Type': 'application/json',
                  ...(token && { 'Authorization': `Bearer ${token}` })
                },
                body: JSON.stringify({ id: roomId, name: data.name }),
              });
              if (!updateResponse.ok) {
                if (updateResponse.status === 401) {
                  localStorage.removeItem('token');
                  localStorage.removeItem('userRole');
                  localStorage.removeItem('username');
                  window.location.reload();
                }
                const errorData = await updateResponse.text();
                console.error('Error response:', updateResponse.status, errorData);
                throw new Error(`HTTP error! Status: ${updateResponse.status}`);
              }
              await renderRooms();
            } catch (error) {
              console.error('Error updating room:', error);
              alert('Ошибка при обновлении зала: ' + error.message);
            }
          });
        } catch (error) {
          console.error('Error fetching room for edit:', error);
          alert('Ошибка при получении данных зала: ' + error.message);
        }
      }
    });
  }

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

    modal.addEventListener('click', (e) => {
      if (e.target.classList.contains('room-modal') && !window.getSelection().toString()) {
        modal.remove(); // Исправлено: используем 'click' вместо 'mousedown' для стабильности
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
