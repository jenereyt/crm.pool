import { getSubscriptionTemplates } from './subscriptions.js';
import { getGroups } from './groups.js';

export let clientsData = [
  {
    id: 'client1',
    surname: 'Иванов',
    name: 'Иван',
    patronymic: 'Иванович',
    phone: '+7 (123) 456-78-90',
    birthDate: '1990-01-01',
    gender: 'male',
    parents: [
      {
        fullName: 'Анна Иванова',
        phone: '+7 (987) 654-32-10',
        relation: 'Мать'
      }
    ],
    diagnosis: [{ name: 'Нет', notes: '' }],
    features: 'Требуется индивидуальный подход',
    blacklisted: false,
    groups: ['Йога для начинающих'],
    groupHistory: [
      { date: '2025-08-01', action: 'added', group: 'Йога для начинающих' }
    ],
    contract: {
      id: 'contract1',
      creationDate: '2025-01-15T10:00:00Z',
      subscriptions: [
        {
          templateId: 'template1',
          startDate: '2025-08-01',
          endDate: '2025-09-30',
          classesPerWeek: 2,
          daysOfWeek: ['Пн', 'Ср'],
          classTime: '10:00',
          group: 'Йога для начинающих',
          remainingClasses: 1,
          isPaid: true,
          payment: {
            method: 'cash_register',
            details: { cash: 1000, card: 2000 },
            date: '2025-08-01'
          },
          renewalHistory: [
            { date: '2025-08-15', fromTemplate: 'Стандартный', toTemplate: 'Премиум' },
            { date: '2025-08-20' }
          ],
          subscriptionNumber: 'SUB-001'
        },
        {
          templateId: 'template2',
          startDate: '2025-07-01',
          endDate: '2025-07-31',
          classesPerWeek: 3,
          daysOfWeek: ['Пн', 'Вт', 'Чт'],
          classTime: '09:00',
          group: 'Фитнес',
          remainingClasses: 0,
          isPaid: true,
          payment: {
            method: 'cash',
            details: { amount: 3000 },
            date: '2025-07-01'
          },
          renewalHistory: [
            { date: '2025-07-10' }
          ],
          subscriptionNumber: 'SUB-002'
        },
        {
          templateId: 'template1',
          startDate: '2025-06-01',
          endDate: '2025-06-30',
          classesPerWeek: 1,
          daysOfWeek: ['Пт'],
          classTime: '18:00',
          group: 'Йога',
          remainingClasses: Infinity,
          isPaid: false,
          payment: null,
          renewalHistory: [],
          subscriptionNumber: 'SUB-003'
        },
        {
          templateId: 'template3',
          startDate: '2025-05-01',
          endDate: '2025-05-31',
          classesPerWeek: 4,
          daysOfWeek: ['Пн', 'Ср', 'Пт', 'Сб'],
          classTime: '11:00',
          group: 'Пилатес',
          remainingClasses: 5,
          isPaid: true,
          payment: {
            method: 'bank_transfer',
            details: { amount: 4000, reference: 'BT-12345' },
            date: '2025-05-01'
          },
          renewalHistory: [
            { date: '2025-05-05', fromTemplate: 'Базовый', toTemplate: 'Расширенный' },
            { date: '2025-05-20', fromTemplate: 'Расширенный', toTemplate: 'Премиум' }
          ],
          subscriptionNumber: 'SUB-004'
        }
      ]
    },
    photo: '',
    createdAt: '2025-01-15T10:00:00Z'
  },
  {
    id: 'client2',
    surname: 'Петрова',
    name: 'Мария',
    patronymic: 'Сергеевна',
    phone: '+7 (234) 567-89-01',
    birthDate: '2005-05-05',
    gender: 'female',
    parents: [],
    diagnosis: [{ name: 'Сколиоз', notes: 'Легкая степень' }],
    features: '',
    blacklisted: false,
    groups: [],
    groupHistory: [],
    contract: {
      id: 'contract2',
      creationDate: '2025-02-20T14:30:00Z',
      subscriptions: [
        {
          templateId: 'template1',
          startDate: '2025-08-01',
          endDate: '2025-09-30',
          classesPerWeek: 0,
          daysOfWeek: [],
          classTime: '09:00',
          group: '',
          remainingClasses: 1,
          isPaid: true,
          payment: {
            method: 'cash',
            details: { amount: 1500 },
            date: '2025-08-01'
          },
          renewalHistory: [],
          subscriptionNumber: 'SUB-002'
        }
      ]
    },
    photo: '',
    createdAt: '2025-02-20T14:30:00Z'
  },
  {
    id: 'client3',
    surname: 'Сидоров',
    name: 'Алексей',
    patronymic: 'Петрович',
    phone: '+7 (345) 678-90-12',
    birthDate: '1985-03-15',
    gender: 'male',
    parents: [],
    diagnosis: [{ name: 'Нет', notes: '' }],
    features: '',
    blacklisted: false,
    groups: ['Фитнес'],
    groupHistory: [],
    contract: {
      id: 'contract3',
      creationDate: '2025-03-10T09:00:00Z',
      subscriptions: [
        {
          templateId: 'template2',
          startDate: '2025-09-01',
          endDate: '2025-09-30',
          classesPerWeek: 3,
          daysOfWeek: ['Пн', 'Ср', 'Пт'],
          classTime: '18:00',
          group: 'Фитнес',
          remainingClasses: 1,
          isPaid: true,
          payment: {
            method: 'bank_transfer',
            details: { amount: 2500, reference: 'BT-67890' },
            date: '2025-09-01'
          },
          renewalHistory: [],
          subscriptionNumber: 'SUB-005'
        }
      ]
    },
    photo: '',
    createdAt: '2025-03-10T09:00:00Z'
  },
  {
    id: 'client4',
    surname: 'Кузнецова',
    name: 'Ольга',
    patronymic: 'Викторовна',
    phone: '+7 (456) 789-01-23',
    birthDate: '1992-07-20',
    gender: 'female',
    parents: [],
    diagnosis: [{ name: 'Нет', notes: '' }],
    features: 'Предпочитает утренние занятия',
    blacklisted: false,
    groups: ['Пилатес'],
    groupHistory: [],
    contract: {
      id: 'contract4',
      creationDate: '2025-04-15T12:00:00Z',
      subscriptions: [
        {
          templateId: 'template1',
          startDate: '2025-09-01',
          endDate: '2025-09-30',
          classesPerWeek: 2,
          daysOfWeek: ['Вт', 'Чт'],
          classTime: '09:00',
          group: 'Пилатес',
          remainingClasses: 1,
          isPaid: true,
          payment: {
            method: 'cash_register',
            details: { cash: 500, card: 1500 },
            date: '2025-09-01'
          },
          renewalHistory: [],
          subscriptionNumber: 'SUB-006'
        }
      ]
    },
    photo: '',
    createdAt: '2025-04-15T12:00:00Z'
  },
  {
    id: 'client5',
    surname: 'Смирнов',
    name: 'Дмитрий',
    patronymic: 'Александрович',
    phone: '+7 (567) 890-12-34',
    birthDate: '1988-11-11',
    gender: 'male',
    parents: [],
    diagnosis: [{ name: 'Гипертония', notes: 'Контролируемая' }],
    features: '',
    blacklisted: false,
    groups: ['Зумба вечеринка'],
    groupHistory: [],
    contract: {
      id: 'contract5',
      creationDate: '2025-05-20T15:00:00Z',
      subscriptions: [
        {
          templateId: 'template2',
          startDate: '2025-09-01',
          endDate: '2025-09-30',
          classesPerWeek: 3,
          daysOfWeek: ['Пн', 'Ср', 'Пт'],
          classTime: '19:00',
          group: 'Зумба вечеринка',
          remainingClasses: 1,
          isPaid: true,
          payment: {
            method: 'cash',
            details: { amount: 3000 },
            date: '2025-09-01'
          },
          renewalHistory: [],
          subscriptionNumber: 'SUB-007'
        }
      ]
    },
    photo: '',
    createdAt: '2025-05-20T15:00:00Z'
  }
];

let commonDiagnoses = ['Сколиоз', 'Кифоз', 'Лордоз', 'Остеохондроз', 'Артрит', 'Астма', 'Диабет', 'Нет', 'Гипертония', 'Аллергия'];
let commonRelations = ['Бабушка', 'Брат', 'Дедушка', 'Другая степень родства', 'Мать', 'Мачеха', 'Отец', 'Отчим', 'Сестра', 'Тетя', 'Дядя'];

export function getClients() {
  return clientsData;
}

export function getClientById(id) {
  return clientsData.find(c => c.id === id) || null;
}

export function addClient(client) {
  const newClient = {
    id: `client${Date.now()}`,
    ...client,
    createdAt: new Date().toISOString(),
    groupHistory: [],
    contract: {
      id: `contract${Date.now()}`,
      creationDate: new Date().toISOString(),
      subscriptions: []
    },
    parents: client.parents || [],
    groups: client.groups || []
  };
  clientsData.push(newClient);
  return newClient;
}

export function updateClient(id, data) {
  const client = clientsData.find(c => c.id === id);
  if (client) {
    Object.assign(client, {
      ...data,
      groups: Array.isArray(data.groups) ? data.groups : client.groups || [],
      groupHistory: Array.isArray(data.groupHistory) ? data.groupHistory : client.groupHistory || []
    });
  }
  return client;
}

export function removeClient(id) {
  clientsData = clientsData.filter(c => c.id !== id);
}

export function addGroupToClient(clientId, group, action = 'added', date = new Date().toISOString()) {
  const client = getClientById(clientId);
  if (client && !client.groups.includes(group)) {
    client.groups.push(group);
    client.groupHistory.push({ date, action, group });
  }
}

export function removeGroupFromClient(clientId, group) {
  const client = getClientById(clientId);
  if (client) {
    client.groups = client.groups.filter(g => g !== group);
    client.groupHistory.push({ date: new Date().toISOString(), action: 'removed', group });
  }
}

function setupModalClose(modal, closeModal) {
  modal.addEventListener('click', (e) => {
    const selection = window.getSelection();
    if (e.target === modal && selection.toString().length === 0) {
      closeModal();
    }
  });
}

export function showClientForm(title, client, callback) {
  const modal = document.createElement('div');
  modal.className = 'client-form-modal';
  let parents = client.parents ? [...client.parents.map(p => ({
    fullName: p.fullName || '',
    phone: p.phone || '',
    relation: p.relation || ''
  }))] : [];
  let diagnoses = client.diagnosis ? [...client.diagnosis] : [];
  const isEdit = !!client.id;

  function calculateAge(birthDate) {
    if (!birthDate) return null;
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  }

  function isAdult(birthDate) {
    const age = calculateAge(birthDate);
    return age !== null && age >= 18;
  }

  function renderParents(container) {
    container.innerHTML = `
      <div class="parents-controls">
        <button type="button" id="add-parent-btn" class="btn-primary add-parent-btn">Добавить</button>
        <button type="button" id="delete-parent-btn" class="btn-danger delete-parent-btn">Удалить</button>
      </div>
      <table class="parents-table">
        <thead>
          <tr>
            <th>ФИО</th>
            <th>Телефон</th>
            <th>Кем приходится</th>
          </tr>
        </thead>
        <tbody>
          ${parents.length ? parents.map((p, index) => `
            <tr class="parent-row" data-index="${index}">
              <td><input type="text" class="parent-fullname" value="${p.fullName}" required></td>
              <td><input type="tel" class="parent-phone" value="${p.phone}" required></td>
              <td>
                <div class="input-with-button">
                  <input type="text" list="relation-list" class="parent-relation" value="${p.relation}" required>
                  <datalist id="relation-list">
                    ${commonRelations.map(rel => `<option value="${rel}">`).join('')}
                  </datalist>
                  <button type="button" class="relation-dictionary-btn">...</button>
                </div>
              </td>
            </tr>
          `).join('') : `
            <tr>
              <td colspan="3" class="no-parents">Нет добавленных родителей/опекунов</td>
            </tr>
          `}
        </tbody>
      </table>
    `;

    const addBtn = container.querySelector('#add-parent-btn');
    addBtn.addEventListener('click', () => {
      parents.push({ fullName: '', phone: '', relation: '' });
      renderParents(container);
    });

    const deleteBtn = container.querySelector('#delete-parent-btn');
    deleteBtn.addEventListener('click', () => {
      showToast('Выберите строку для удаления', 'info');
      const rows = container.querySelectorAll('.parent-row');
      rows.forEach(row => {
        row.style.cursor = 'pointer';
        const deleteHandler = () => {
          const index = parseInt(row.dataset.index);
          showConfirmDialog(
            'Удалить родителя?',
            'Вы уверены, что хотите удалить этого родителя/опекуна? Это действие нельзя отменить.',
            () => {
              parents.splice(index, 1);
              renderParents(container);
              showToast('Родитель удален', 'success');
            }
          );
          rows.forEach(r => {
            r.removeEventListener('click', deleteHandler);
            r.style.cursor = 'default';
          });
        };
        row.addEventListener('click', deleteHandler, { once: true });
      });
    });

    parents.forEach((_, index) => {
      const row = container.querySelector(`.parent-row[data-index="${index}"]`);
      if (!row) return;

      const fullnameInput = row.querySelector('.parent-fullname');
      const phoneInput = row.querySelector('.parent-phone');
      const relationInput = row.querySelector('.parent-relation');
      const dictionaryBtn = row.querySelector('.relation-dictionary-btn');

      fullnameInput.addEventListener('input', (e) => parents[index].fullName = e.target.value);
      phoneInput.addEventListener('input', (e) => parents[index].phone = e.target.value);
      relationInput.addEventListener('input', (e) => parents[index].relation = e.target.value);

      dictionaryBtn.addEventListener('click', () => {
        showRelationDictionary((selectedRelation) => {
          if (selectedRelation) {
            relationInput.value = selectedRelation;
            parents[index].relation = selectedRelation;
          }
        });
      });
    });
  }

  function renderDiagnoses(container) {
    container.innerHTML = `
      <div class="diagnoses-controls">
        <button type="button" id="add-diagnosis-btn" class="btn-primary add-diagnosis-btn">Добавить</button>
        <button type="button" id="delete-diagnosis-btn" class="btn-danger delete-diagnosis-btn">Удалить</button>
      </div>
      <table class="diagnoses-table">
        <thead>
          <tr>
            <th>Диагноз</th>
            <th>Описание</th>
          </tr>
        </thead>
        <tbody>
          ${diagnoses.length ? diagnoses.map((d, index) => `
            <tr class="diagnosis-row" data-index="${index}">
              <td>
                <div class="input-with-button">
                  <input type="text" list="diagnosis-list" class="diagnosis-name" value="${d.name}" required>
                  <datalist id="diagnosis-list">
                    ${commonDiagnoses.map(diag => `<option value="${diag}">`).join('')}
                  </datalist>
                  <button type="button" class="diagnosis-dictionary-btn">...</button>
                </div>
              </td>
              <td><input type="text" class="diagnosis-notes" value="${d.notes || ''}"></td>
            </tr>
          `).join('') : `
            <tr>
              <td colspan="2" class="no-diagnoses">Нет добавленных диагнозов</td>
            </tr>
          `}
        </tbody>
      </table>
    `;

    const addBtn = container.querySelector('#add-diagnosis-btn');
    addBtn.addEventListener('click', () => {
      diagnoses.push({ name: '', notes: '' });
      renderDiagnoses(container);
    });

    const deleteBtn = container.querySelector('#delete-diagnosis-btn');
    deleteBtn.addEventListener('click', () => {
      showToast('Выберите строку для удаления', 'info');
      const rows = container.querySelectorAll('.diagnosis-row');
      rows.forEach(row => {
        row.style.cursor = 'pointer';
        const deleteHandler = () => {
          const index = parseInt(row.dataset.index);
          showConfirmDialog(
            'Удалить диагноз?',
            'Вы уверены, что хотите удалить этот диагноз? Это действие нельзя отменить.',
            () => {
              diagnoses.splice(index, 1);
              renderDiagnoses(container);
              showToast('Диагноз удален', 'success');
            }
          );
          rows.forEach(r => {
            r.removeEventListener('click', deleteHandler);
            r.style.cursor = 'default';
          });
        };
        row.addEventListener('click', deleteHandler, { once: true });
      });
    });

    diagnoses.forEach((_, index) => {
      const row = container.querySelector(`.diagnosis-row[data-index="${index}"]`);
      if (!row) return;

      const nameInput = row.querySelector('.diagnosis-name');
      const notesInput = row.querySelector('.diagnosis-notes');
      const dictionaryBtn = row.querySelector('.diagnosis-dictionary-btn');

      nameInput.addEventListener('input', (e) => diagnoses[index].name = e.target.value);
      notesInput.addEventListener('input', (e) => diagnoses[index].notes = e.target.value);

      dictionaryBtn.addEventListener('click', () => {
        showDiagnosisDictionary((selectedDiagnosis) => {
          if (selectedDiagnosis) {
            nameInput.value = selectedDiagnosis;
            diagnoses[index].name = selectedDiagnosis;
          }
        });
      });
    });
  }

  modal.innerHTML = `
    <div class="client-form-content">
      <div class="client-form-header">
        <h2>${title}</h2>
        <button type="button" class="client-form-close">×</button>
      </div>
      
      <div class="client-form-tabs">
        <button type="button" class="tab-button active" data-tab="personal">Личные данные</button>
        <button type="button" class="tab-button" data-tab="parents">Родители/опекуны</button>
        <button type="button" class="tab-button" data-tab="medical">Медицинская информация</button>
      </div>
      
      <div class="client-form-tab-content active" id="client-tab-personal">
        <div class="form-grid">
          <div class="form-group">
            <label for="client-surname" class="required">Фамилия</label>
            <input type="text" id="client-surname" value="${client.surname || ''}" required>
            <span class="field-error" id="surname-error"></span>
          </div>
          <div class="form-group">
            <label for="client-name" class="required">Имя</label>
            <input type="text" id="client-name" value="${client.name || ''}" required>
            <span class="field-error" id="name-error"></span>
          </div>
          <div class="form-group">
            <label for="client-patronymic">Отчество</label>
            <input type="text" id="client-patronymic" value="${client.patronymic || ''}">
          </div>
        </div>
        <div class="form-grid">
          <div class="form-group">
            <label for="client-birthdate" class="required">Дата рождения</label>
            <input type="date" id="client-birthdate" value="${client.birthDate || ''}" required>
            <span class="field-error" id="birthdate-error"></span>
          </div>
          <div class="form-group">
            <label for="client-gender" class="required">Пол</label>
            <select id="client-gender" required>
              <option value="">Выберите пол</option>
              <option value="male" ${client.gender === 'male' ? 'selected' : ''}>Мужской</option>
              <option value="female" ${client.gender === 'female' ? 'selected' : ''}>Женский</option>
            </select>
            <span class="field-error" id="gender-error"></span>
          </div>
          <div class="form-group">
            <label for="client-phone">Телефон</label>
            <input type="tel" id="client-phone" value="${client.phone || ''}" placeholder="+7 (999) 123-45-67">
            <span class="field-error" id="phone-error"></span>
          </div>
        </div>
        <div class="client-photo-section">
          <div class="photo-upload-area">
            <div class="for-flex flex-end">
              <button type="button" class="photo-remove-btn" id="photo-remove-btn" ${!client.photo ? 'style="display: none;"' : ''}>
                X
              </button>
            </div>
            <div id="client-photo-preview" class="client-photo-preview ${!client.photo ? 'placeholder' : ''}">
              ${client.photo ?
      `<img src="${client.photo}" alt="${client.surname || 'Клиент'}">` :
      `<img src="images/icon-photo.svg" alt="Загрузить фото" class="upload-icon">`
    }
            </div>
            <input type="file" id="client-photo" accept="image/*" style="display: none;">
          </div>
        </div>
      </div>

      <div class="client-form-tab-content" id="client-tab-parents">
        <div id="parents-container"></div>
      </div>

      <div class="client-form-tab-content" id="client-tab-medical">
        <div id="diagnoses-container"></div>
        <div class="form-group full-width">
          <label for="client-features">Примечания</label>
          <input type="text" id="client-features" value="${client.features || ''}" placeholder="Дополнительная информация о клиенте, особенности занятий...">
        </div>
      </div>

      <div class="client-form-footer">
        <button type="button" id="client-cancel-btn" class="btn-secondary">Отмена</button>
        <button type="button" id="client-save-btn" class="btn-primary">Сохранить</button>
      </div>
    </div>
  `;

  document.getElementById('main-content').appendChild(modal);

  const tabButtons = modal.querySelectorAll('.client-form-tabs .tab-button');
  const tabContents = modal.querySelectorAll('.client-form-tab-content');

  tabButtons.forEach(button => {
    button.addEventListener('click', () => {
      tabButtons.forEach(btn => btn.classList.remove('active'));
      tabContents.forEach(content => content.classList.remove('active'));
      button.classList.add('active');
      modal.querySelector(`#client-tab-${button.dataset.tab}`).classList.add('active');
    });
  });

  const closeModal = () => modal.remove();
  setupModalClose(modal, closeModal);

  // Добавляем обработчик для кнопки крестика
  modal.querySelector('.client-form-close').addEventListener('click', closeModal);

  const photoInput = document.getElementById('client-photo');
  const photoPreview = document.getElementById('client-photo-preview');
  const photoRemoveBtn = document.getElementById('photo-remove-btn');

  photoPreview.addEventListener('click', () => {
    if (photoPreview.classList.contains('placeholder')) {
      photoInput.click();
    } else {
      showPhotoZoomModal(photoPreview.querySelector('img').src);
    }
  });

  photoInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        showToast('Размер файла не должен превышать 5MB', 'error');
        return;
      }

      const reader = new FileReader();
      reader.onload = (ev) => {
        const img = document.createElement('img');
        img.src = ev.target.result;
        img.alt = 'Предпросмотр';
        img.style.width = '100%';
        img.style.height = '100%';
        img.style.objectFit = 'cover';
        img.style.borderRadius = '8px';

        photoPreview.innerHTML = '';
        photoPreview.appendChild(img);
        photoPreview.classList.remove('placeholder');
        photoRemoveBtn.style.display = 'block';
      };
      reader.readAsDataURL(file);
    }
  });

  photoRemoveBtn.addEventListener('click', () => {
    photoPreview.innerHTML = `
      <img src="images/icon-photo.svg" alt="Загрузить фото" class="upload-icon">
      <span>Файл не выбран</span>
    `;
    photoPreview.classList.add('placeholder');
    photoInput.value = '';
    photoRemoveBtn.style.display = 'none';
  });

  const parentsContainer = modal.querySelector('#parents-container');
  renderParents(parentsContainer);

  const diagnosesContainer = modal.querySelector('#diagnoses-container');
  renderDiagnoses(diagnosesContainer);

  function validateForm() {
    let isValid = true;

    document.querySelectorAll('.field-error').forEach(el => el.textContent = '');
    document.querySelectorAll('.form-group input, .form-group select').forEach(el => el.classList.remove('error'));

    const surname = document.getElementById('client-surname').value.trim();
    if (!surname) {
      document.getElementById('surname-error').textContent = 'Фамилия обязательна';
      document.getElementById('client-surname').classList.add('error');
      isValid = false;
    }

    const name = document.getElementById('client-name').value.trim();
    if (!name) {
      document.getElementById('name-error').textContent = 'Имя обязательно';
      document.getElementById('client-name').classList.add('error');
      isValid = false;
    }

    const phone = document.getElementById('client-phone').value.trim();

    const birthDate = document.getElementById('client-birthdate').value;
    if (!birthDate) {
      document.getElementById('birthdate-error').textContent = 'Дата рождения обязательна';
      document.getElementById('client-birthdate').classList.add('error');
      isValid = false;
    }

    const gender = document.getElementById('client-gender').value;
    if (!gender) {
      document.getElementById('gender-error').textContent = 'Пол обязателен';
      document.getElementById('client-gender').classList.add('error');
      isValid = false;
    }

    // Проверка на наличие родителей для несовершеннолетних с информативным уведомлением
    if (!isAdult(birthDate) && parents.length === 0) {
      showToast('Клиент несовершеннолетний: перейдите на вкладку "Родители/опекуны" и добавьте хотя бы одного родителя.', 'info');
      isValid = false;
    }

    parents.forEach((p, index) => {
      const row = modal.querySelector(`.parent-row[data-index="${index}"]`);
      if (!row) return;

      const fullnameInput = row.querySelector('.parent-fullname');
      const phoneInput = row.querySelector('.parent-phone');
      const relationInput = row.querySelector('.parent-relation');

      if (!fullnameInput.value.trim()) {
        fullnameInput.classList.add('error');
        isValid = false;
      }
      if (!phoneInput.value.trim()) {
        phoneInput.classList.add('error');
        isValid = false;
      }
      if (!relationInput.value.trim()) {
        relationInput.classList.add('error');
        isValid = false;
      }
    });

    diagnoses.forEach((d, index) => {
      const row = modal.querySelector(`.diagnosis-row[data-index="${index}"]`);
      if (!row) return;

      const nameInput = row.querySelector('.diagnosis-name');

      if (!nameInput.value.trim()) {
        nameInput.classList.add('error');
        isValid = false;
      }
    });

    return isValid;
  }

  document.getElementById('client-save-btn').addEventListener('click', () => {
    if (!validateForm()) return;

    const surname = document.getElementById('client-surname').value.trim();
    const name = document.getElementById('client-name').value.trim();
    const patronymic = document.getElementById('client-patronymic').value.trim();
    const phone = document.getElementById('client-phone').value.trim();
    const birthDate = document.getElementById('client-birthdate').value;
    const gender = document.getElementById('client-gender').value;
    const features = document.getElementById('client-features').value.trim();

    let photo = '';
    const photoImg = photoPreview.querySelector('img:not(.upload-icon)');
    if (photoImg) {
      photo = photoImg.src;
    }

    const updatedParents = parents.filter(p => p.fullName.trim() !== '').map(p => ({
      fullName: p.fullName.trim(),
      phone: p.phone,
      relation: p.relation
    }));

    const updatedDiagnoses = diagnoses.filter(d => d.name.trim() !== '');

    callback({
      surname,
      name,
      patronymic,
      phone,
      birthDate,
      gender,
      parents: updatedParents,
      diagnosis: updatedDiagnoses,
      features,
      photo,
      groups: []
    });
    closeModal();
  });

  document.getElementById('client-cancel-btn').addEventListener('click', closeModal);

  setTimeout(() => document.getElementById('client-surname').focus(), 100);
}

export function loadClients() {
  const mainContent = document.getElementById('main-content');
  mainContent.innerHTML = '';

  const header = document.createElement('header');
  header.className = 'header';
  header.innerHTML = `
      <div class="header-content">
        <h1><img src="images/icon-clients.svg" alt="Клиенты" class="icon-users">Клиенты</h1>
        <div class="header-stats">
          <div class="stat-item">
            <span class="stat-number">${clientsData.length}</span>
            <span class="stat-label">всего</span>
          </div>
          <div class="stat-item">
            <span class="stat-number">${clientsData.filter(c => c.contract.subscriptions.some(s => s.isPaid && new Date(s.endDate) >= new Date())).length}</span>
            <span class="stat-label">активных</span>
          </div>
          <div class="stat-item">
            <span class="stat-number">${clientsData.filter(c => c.blacklisted).length}</span>
            <span class="stat-label">в ЧС</span>
          </div>
        </div>
      </div>
    `;
  mainContent.appendChild(header);

  const controlBar = document.createElement('div');
  controlBar.className = 'control-bar';
  controlBar.innerHTML = `
      <div class="search-container">
        <div class="search-input-wrapper">
          <img src="images/icon-search.svg" alt="Поиск" class="search-icon">
          <input type="text" id="client-search" class="client-search" placeholder="Поиск по имени, телефону или группе...">
          <button id="search-clear" class="search-clear" style="display: none;">×</button>
        </div>
      </div>
      <div class="filter-controls">
        <select id="status-filter" class="status-filter">
          <option value="">Все статусы</option>
          <option value="active">Активные абонементы</option>
          <option value="inactive">Неактивные абонементы</option>
          <option value="no-subscription">Без абонемента</option>
          <option value="blacklisted">В чёрном списке</option>
        </select>
        <select id="sort-by" class="sort-select">
          <option value="name">По имени</option>
          <option value="date-desc">Сначала новые</option>
          <option value="date-asc">Сначала старые</option>
        </select>
      </div>
      <button type="button" class="btn-primary client-add-btn" id="client-add-btn">
        <i class="add-icon">+</i>
        <span>Добавить клиента</span>
      </button>
    `;
  mainContent.appendChild(controlBar);

  const clientSection = document.createElement('div');
  clientSection.className = 'client-section';

  const clientList = document.createElement('div');
  clientList.className = 'client-list';
  clientSection.appendChild(clientList);

  const emptyState = document.createElement('div');
  emptyState.className = 'empty-state';
  emptyState.innerHTML = `
      <div class="empty-state-icon"><img src="images/icon-clients.svg" alt="Клиенты"></div>
      <h3>Клиенты не найдены</h3>
      <p>Попробуйте изменить параметры поиска или добавьте нового клиента</p>
    `;
  emptyState.style.display = 'none';
  clientSection.appendChild(emptyState);

  mainContent.appendChild(clientSection);

  function getSubscriptionStatus(client) {
    if (!client.contract || !client.contract.subscriptions || client.contract.subscriptions.length === 0) return 'no-subscription';
    if (client.blacklisted) return 'blacklisted';
    const hasActive = client.contract.subscriptions.some(s => s.isPaid && new Date(s.endDate) >= new Date());
    return hasActive ? 'active' : 'inactive';
  }

  function formatDate(dateString) {
    if (!dateString) return 'Никогда';
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) return 'Сегодня';
    if (diffDays === 2) return 'Вчера';
    if (diffDays <= 7) return `${diffDays - 1} дн. назад`;
    if (diffDays <= 30) return `${Math.floor(diffDays / 7)} нед. назад`;
    return date.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }

  function sortClients(clients, sortBy) {
    return [...clients].sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return `${a.surname} ${a.name}`.localeCompare(`${b.surname} ${b.name}`);
        case 'date-desc':
          return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
        case 'date-asc':
          return new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
        default:
          return 0;
      }
    });
  }

  function renderClients() {
    const search = document.getElementById('client-search').value.toLowerCase();
    const statusFilter = document.getElementById('status-filter').value;
    const sortBy = document.getElementById('sort-by').value;

    let filteredClients = clientsData.filter(client => {
      const fullName = `${client.surname} ${client.name} ${client.patronymic || ''}`.toLowerCase();
      const matchesSearch = search === '' ||
        fullName.includes(search) ||
        client.phone.toLowerCase().includes(search) ||
        (Array.isArray(client.groups) && client.groups.some(group => group.toLowerCase().includes(search)));

      const matchesStatus = statusFilter === '' || getSubscriptionStatus(client) === statusFilter;

      return matchesSearch && matchesStatus;
    });

    filteredClients = sortClients(filteredClients, sortBy);

    if (filteredClients.length === 0) {
      clientList.style.display = 'none';
      emptyState.style.display = 'flex';
      return;
    }

    clientList.style.display = 'grid';
    emptyState.style.display = 'none';

    clientList.innerHTML = filteredClients
      .map(client => {
        const fullName = `${client.surname} ${client.name} ${client.patronymic || ''}`;
        const hasDiagnosis = client.diagnosis && client.diagnosis.length > 0 && !(client.diagnosis.length === 1 && client.diagnosis[0].name === 'Нет');
        const status = getSubscriptionStatus(client);
        const statusClass = {
          'active': 'status-active',
          'inactive': 'status-inactive',
          'no-subscription': 'status-none',
          'blacklisted': 'status-blacklisted'
        }[status];

        const statusText = {
          'active': 'Активный',
          'inactive': 'Неактивный',
          'no-subscription': 'Без абонемента',
          'blacklisted': 'В чёрном списке'
        }[status];

        const activeSub = client.contract.subscriptions.find(s => s.isPaid && new Date(s.endDate) >= new Date());
        const remainingClasses = activeSub ? activeSub.remainingClasses : undefined;

        return `
        <div class="client-card ${client.blacklisted ? 'blacklisted' : ''}" data-id="${client.id}">
          <div class="client-main-info">
            <div class="client-avatar">
              ${client.photo ?
            `<img src="${client.photo}" class="client-photo" alt="${fullName}" style="object-fit: cover;">` :
            `<div class="client-photo-placeholder">${client.name.charAt(0).toUpperCase()}</div>`
          }
              <div class="status-indicator ${statusClass}" title="${statusText}"></div>
            </div>
            <div class="client-details">
              <div class="client-name-section">
                <h3 class="client-name ${hasDiagnosis ? 'has-diagnosis' : ''}">${fullName}</h3>
                <div class="client-meta">
                  <span class="client-phone">${client.phone}</span>
                  ${hasDiagnosis ? `
                    <div class="diagnosis-badge">
                      ${client.diagnosis.map(d => `<span class="diagnosis-tag">${d.name}${d.notes ? ` (${d.notes})` : ''}</span>`).join('')}
                    </div>
                  ` : ''}
                </div>
              </div>
              <div class="client-additional-info">
                <span class="groups-info">
                  <span class="info-label">Группы:</span>
                  ${Array.isArray(client.groups) && client.groups.length ? client.groups.map(group => `<span class="group-tag">${group}</span>`).join('') : '<span class="no-groups">Без групп</span>'}
                </span>
                ${remainingClasses !== undefined ?
            `<span class="classes-info">
                  <span class="info-label">Осталось занятий:</span>
                  <span class="classes-value ${remainingClasses <= 3 && remainingClasses !== Infinity ? 'low-classes' : ''}">
                    ${remainingClasses === Infinity ? 'Безлимит' : remainingClasses}
                  </span>
                </span>` : ''
          }
              </div>
            </div>
          </div>
          <div class="action-buttons-group">
            <button type="button" class="client-action-btn edit-btn" data-id="${client.id}" title="Редактировать">
              <img src="images/icon-edit.svg" alt="Редактировать" class="btn-icon">
            </button>
            <button type="button" class="client-action-btn subscription-btn" data-id="${client.id}" title="Абонемент">
              <img src="images/icon-subscriptions.svg" alt="Абонемент" class="btn-icon">
            </button>
            <button type="button" class="client-action-btn group-btn" data-id="${client.id}" title="Группы">
              <img src="images/icon-group.svg" alt="Группы" class="btn-icon">
            </button>
            <button type="button" class="client-action-btn blacklist-btn ${client.blacklisted ? 'active' : ''}" data-id="${client.id}" title="${client.blacklisted ? 'Убрать из чёрного списка' : 'В чёрный список'}">
              <img src="images/icon-delete.svg" alt="${client.blacklisted ? 'Убрать из чёрного списка' : 'В чёрный список'}" class="btn-icon">
            </button>
            <button type="button" class="client-action-btn delete-btn" data-id="${client.id}" title="Удалить">
              <img src="images/trash.svg" alt="Удалить" class="btn-icon">
            </button>
          </div>
        </div>
      `;
      }).join('');
  }

  renderClients();

  const searchInput = document.getElementById('client-search');
  const searchClear = document.getElementById('search-clear');

  searchInput.addEventListener('input', (e) => {
    renderClients();
    searchClear.style.display = e.target.value ? 'block' : 'none';
  });

  searchClear.addEventListener('click', () => {
    searchInput.value = '';
    searchClear.style.display = 'none';
    renderClients();
  });

  document.getElementById('status-filter').addEventListener('change', renderClients);
  document.getElementById('sort-by').addEventListener('change', renderClients);

  document.getElementById('client-add-btn').addEventListener('click', () => {
    showClientForm('Добавить клиента', {}, (data) => {
      addClient(data);
      renderClients();
      showToast('Клиент успешно добавлен', 'success');
    });
  });

  clientList.addEventListener('click', (e) => {
    const target = e.target;
    const clientCard = target.closest('.client-card');
    const clientId = clientCard ? clientCard.getAttribute('data-id') : null;
    const client = clientsData.find(c => c.id === clientId);
    if (!client) return;

    const actionBtn = target.closest('.client-action-btn');
    if (actionBtn) {
      e.stopPropagation();

      if (actionBtn.classList.contains('edit-btn')) {
        showClientForm('Редактировать клиента', client, (data) => {
          updateClient(clientId, data);
          renderClients();
          showToast('Данные клиента обновлены', 'success');
        });
      } else if (actionBtn.classList.contains('blacklist-btn')) {
        client.blacklisted = !client.blacklisted;
        renderClients();
        showToast(client.blacklisted ? 'Клиент добавлен в чёрный список' : 'Клиент удалён из чёрного списка', 'info');
      } else if (actionBtn.classList.contains('subscription-btn')) {
        showSubscriptionManagement(client);
      } else if (actionBtn.classList.contains('group-btn')) {
        showGroupForm('Управление группами', client, getGroups(), (groups, history) => {
          client.groups = groups;
          client.groupHistory = history;
          renderClients();
          showToast('Группы клиента обновлены', 'success');
        });
      } else if (actionBtn.classList.contains('delete-btn')) {
        showConfirmDialog(
          'Удалить клиента?',
          `Вы уверены, что хотите удалить клиента "${client.surname} ${client.name}"? Это действие нельзя отменить.`,
          () => {
            removeClient(clientId);
            renderClients();
            showToast('Клиент удалён', 'success');
          }
        );
      }
    } else {
      const selection = window.getSelection();
      if (selection.toString().length === 0) {
        showClientDetails(client);
      }
    }
  });
}

export function showToast(message, type = 'info') {
  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
      <div class="toast-content">
        <span class="toast-icon">${type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️'}</span>
        <span class="toast-message">${message}</span>
      </div>
    `;
  document.body.appendChild(toast);
  setTimeout(() => toast.classList.add('show'), 100);
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => document.body.removeChild(toast), 300);
  }, 3000);
}

export function showConfirmDialog(title, message, onConfirm) {
  const modal = document.createElement('div');
  modal.className = 'confirm-modal';
  modal.innerHTML = `
      <div class="confirm-modal-content">
        <div class="confirm-header">
          <h3>${title}</h3>
        </div>
        <div class="confirm-body">
          <p>${message}</p>
        </div>
        <div class="confirm-actions">
          <button type="button" class="confirm-btn-cancel btn-secondary">Отмена</button>
          <button type="button" class="confirm-btn-ok btn-primary">Удалить</button>
        </div>
      </div>
    `;
  document.getElementById('main-content').appendChild(modal);
  setupModalClose(modal, () => modal.remove());
  modal.querySelector('.confirm-btn-cancel').addEventListener('click', () => modal.remove());
  modal.querySelector('.confirm-btn-ok').addEventListener('click', () => {
    onConfirm();
    modal.remove();
  });
}

export function showPhotoZoomModal(photoSrc) {
  if (!photoSrc || photoSrc.includes('default-icon.svg')) return;
  const modal = document.createElement('div');
  modal.className = 'photo-zoom-modal';
  modal.innerHTML = `
      <div class="photo-zoom-content">
        <img src="${photoSrc}" class="photo-zoom-image" alt="Увеличенное фото">
        <button type="button" class="photo-zoom-close btn-secondary">Закрыть</button>
      </div>
    `;
  document.getElementById('main-content').appendChild(modal);
  setupModalClose(modal, () => modal.remove());
  modal.querySelector('.photo-zoom-close').addEventListener('click', () => modal.remove());
}

export function showClientDetails(client) {
  const fullName = `${client.surname} ${client.name} ${client.patronymic || ''}`;
  const modal = document.createElement('div');
  modal.className = 'client-details-modal';
  modal.innerHTML = `
    <div class="client-details-content">
      <div class="client-details-header">
        <h2>Клиент: ${fullName}</h2>
        <button type="button" class="client-details-close">×</button>
      </div>
      <div class="client-details-body">
        <div class="tabs">
          <button class="tab-btn active" data-tab="info">Информация</button>
          <button class="tab-btn" data-tab="groups-subs">Группы и абонементы</button>
        </div>
        <div class="tab-content" id="tab-info">
          <div class="info-grid">
            <div class="info-item">
              <span class="label">ФИО:</span>
              <span class="value">${fullName}</span>
            </div>
            <div class="info-item">
              <span class="label">Телефон:</span>
              <span class="value">${client.phone}</span>
            </div>
            <div class="info-item">
              <span class="label">Дата рождения:</span>
              <span class="value">${client.birthDate ? formatDate(client.birthDate) : '—'}</span>
            </div>
            <div class="info-item">
              <span class="label">Пол:</span>
              <span class="value">${client.gender === 'male' ? 'Мужской' : client.gender === 'female' ? 'Женский' : '—'}</span>
            </div>
            <div class="info-item full-width">
              <span class="label">Диагноз:</span>
              <span class="value">${client.diagnosis?.length ? client.diagnosis.map(d => `${d.name}${d.notes ? ` (${d.notes})` : ''}`).join(', ') : '—'}</span>
            </div>
            <div class="info-item full-width">
              <span class="label">Родители/Контактные лица:</span>
              <span class="value">${client.parents?.length ? client.parents.map(p => `${p.fullName} (${p.relation}): ${p.phone}`).join(', ') : '—'}</span>
            </div>
            <div class="info-item full-width">
              <span class="label">Особенности:</span>
              <span class="value">${client.features || '—'}</span>
            </div>
            <div class="info-item">
              <span class="label">Статус:</span>
              <span class="value">${client.blacklisted ? 'В чёрном списке' : 'Активен'}</span>
            </div>
            ${client.photo ? `
              <div class="info-item">
                <span class="label">Фото:</span>
                <img src="${client.photo}" alt="Фото клиента" class="client-photo" onclick="showPhotoZoomModal('${client.photo}')">
              </div>
            ` : ''}
          </div>
        </div>
        <div class="tab-content" id="tab-groups-subs" style="display: none;">
          <div class="groups-subs-grid">
            <div class="groups-section">
              <h3>Группы</h3>
              <div class="groups-list">
                ${client.groups?.length ? client.groups.map(g => `<span class="group-item">${g}</span>`).join('') : '—'}
              </div>
              <button type="button" class="btn-primary manage-groups-btn">Управление группами</button>
            </div>
            <div class="subscriptions-section">
              <h3>Абонементы</h3>
              <div class="subscriptions-list">
                ${client.contract.subscriptions.length ? client.contract.subscriptions.filter(s => s.isPaid && new Date(s.endDate) >= new Date()).map((sub, index) => {
    const template = getSubscriptionTemplates().find(t => t.id === sub.templateId);
    return `
                    <div class="subscription-item ${sub.isPaid && new Date(s.endDate) >= new Date() ? 'active' : 'inactive'}">
                      <div class="subscription-number">#${sub.subscriptionNumber}</div>
                      <div class="detail-item">
                        <span class="detail-label">Тип:</span>
                        <span class="detail-value">${template ? template.type : 'Неизвестный'}</span>
                      </div>
                      <div class="detail-item">
                        <span class="detail-label">Период:</span>
                        <span class="detail-value">${sub.startDate} — ${sub.endDate}</span>
                      </div>
                      <div class="detail-item">
                        <span class="detail-label">Осталось занятий:</span>
                        <span class="detail-value ${sub.remainingClasses <= 3 && sub.remainingClasses !== Infinity ? 'low-classes' : ''}">${sub.remainingClasses === Infinity ? '∞' : sub.remainingClasses}</span>
                      </div>
                      <div class="detail-item">
                        <span class="detail-label">Группа:</span>
                        <span class="detail-value">${sub.group || '—'}</span>
                      </div>
                      <button type="button" class="btn-primary manage-sub-btn" data-sub-index="${index}">Управление</button>
                    </div>
                  `;
  }).join('') : '<div class="no-data">Нет активных абонементов</div>'}
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="client-details-footer">
        <button type="button" class="btn-secondary close-btn">Закрыть</button>
      </div>
    </div>
  `;

  document.getElementById('main-content').appendChild(modal);

  const closeModal = () => modal.remove();
  setupModalClose(modal, closeModal);

  modal.querySelector('.client-details-close').addEventListener('click', closeModal);
  modal.querySelector('.close-btn').addEventListener('click', closeModal);

  modal.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      modal.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      modal.querySelectorAll('.tab-content').forEach(content => content.style.display = 'none');
      modal.querySelector(`#tab-${btn.dataset.tab}`).style.display = 'block';
    });
  });

  modal.querySelector('.manage-groups-btn').addEventListener('click', () => {
    showGroupForm('Управление группами', client, getGroups(), (groups, groupHistory) => {
      updateClient(client.id, { ...client, groups, groupHistory });
      modal.remove();
      loadClients();
      showToast('Группы обновлены', 'success');
    });
  });

  modal.querySelectorAll('.manage-sub-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      showSubscriptionManagement(client);
    });
  });
}

export function formatDate(dateString) {
  if (!dateString) return 'Никогда';
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = Math.abs(now - date);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 1) return 'Сегодня';
  if (diffDays === 2) return 'Вчера';
  if (diffDays <= 7) return `${diffDays - 1} дн. назад`;
  if (diffDays <= 30) return `${Math.floor(diffDays / 7)} нед. назад`;
  return date.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export function showDiagnosisDictionary(callback) {
  const modal = document.createElement('div');
  modal.className = 'diagnosis-dictionary-modal';
  let selectedDiagnosis = null;

  function renderDiagnosesList(filter = '') {
    const list = modal.querySelector('.diagnoses-list');
    const filteredDiagnoses = commonDiagnoses.filter(d => d.toLowerCase().includes(filter.toLowerCase()));
    list.innerHTML = filteredDiagnoses.map(d => `
      <div class="diagnosis-item ${selectedDiagnosis === d ? 'selected' : ''}" data-diagnosis="${d}">
        ${d}
      </div>
    `).join('');

    list.querySelectorAll('.diagnosis-item').forEach(item => {
      item.addEventListener('click', () => {
        selectedDiagnosis = item.dataset.diagnosis;
        renderDiagnosesList(filter);
      });
    });
  }

  modal.innerHTML = `
    <div class="diagnosis-dictionary-content">
      <div class="diagnosis-header">
        <h2>Справочник диагнозов</h2>
        <button type="button" class="diagnosis-close">×</button>
      </div>
      <div class="diagnosis-body">
        <input type="text" id="diagnosis-search" placeholder="Поиск диагноза...">
        <div class="diagnoses-list"></div>
        <button type="button" id="add-new-diagnosis-btn" class="btn-primary">Создать новый</button>
      </div>
      <div class="diagnosis-footer">
        <button type="button" id="diagnosis-cancel-btn" class="btn-secondary">Отмена</button>
        <button type="button" id="diagnosis-select-btn" class="btn-primary">Выбрать</button>
      </div>
    </div>
  `;

  document.getElementById('main-content').appendChild(modal);

  const closeModal = () => {
    modal.remove();
    callback(null);
  };
  setupModalClose(modal, closeModal);

  modal.querySelector('.diagnosis-close').addEventListener('click', closeModal);
  modal.querySelector('#diagnosis-cancel-btn').addEventListener('click', closeModal);

  modal.querySelector('#diagnosis-select-btn').addEventListener('click', () => {
    if (selectedDiagnosis) {
      modal.remove();
      callback(selectedDiagnosis);
    } else {
      showToast('Выберите диагноз', 'error');
    }
  });

  modal.querySelector('#add-new-diagnosis-btn').addEventListener('click', () => {
    const newDiagnosis = prompt('Введите новый диагноз:');
    if (newDiagnosis && newDiagnosis.trim() && !commonDiagnoses.includes(newDiagnosis.trim())) {
      commonDiagnoses.push(newDiagnosis.trim());
      renderDiagnosesList(modal.querySelector('#diagnosis-search').value);
      showToast('Новый диагноз добавлен', 'success');
    }
  });

  const searchInput = modal.querySelector('#diagnosis-search');
  searchInput.addEventListener('input', (e) => {
    renderDiagnosesList(e.target.value);
  });

  renderDiagnosesList();
}

export function showRelationDictionary(callback) {
  const modal = document.createElement('div');
  modal.className = 'relation-dictionary-modal';
  let selectedRelation = null;

  function renderRelationsList(filter = '') {
    const list = modal.querySelector('.relations-list');
    const filteredRelations = commonRelations.filter(r => r.toLowerCase().includes(filter.toLowerCase()));
    list.innerHTML = filteredRelations.map(r => `
      <div class="relation-item ${selectedRelation === r ? 'selected' : ''}" data-relation="${r}">
        ${r}
      </div>
    `).join('');

    list.querySelectorAll('.relation-item').forEach(item => {
      item.addEventListener('click', () => {
        selectedRelation = item.dataset.relation;
        renderRelationsList(filter);
      });
    });
  }

  modal.innerHTML = `
    <div class="relation-dictionary-content">
      <div class="relation-header">
        <h2>Справочник отношений</h2>
        <button type="button" class="relation-close">×</button>
      </div>
      <div class="relation-body">
        <input type="text" id="relation-search" placeholder="Поиск отношения...">
        <div class="relations-list"></div>
        <button type="button" id="add-new-relation-btn" class="btn-primary">Создать новое</button>
      </div>
      <div class="relation-footer">
        <button type="button" id="relation-cancel-btn" class="btn-secondary">Отмена</button>
        <button type="button" id="relation-select-btn" class="btn-primary">Выбрать</button>
      </div>
    </div>
  `;

  document.getElementById('main-content').appendChild(modal);

  const closeModal = () => {
    modal.remove();
    callback(null);
  };
  setupModalClose(modal, closeModal);

  modal.querySelector('.relation-close').addEventListener('click', closeModal);
  modal.querySelector('#relation-cancel-btn').addEventListener('click', closeModal);

  modal.querySelector('#relation-select-btn').addEventListener('click', () => {
    if (selectedRelation) {
      modal.remove();
      callback(selectedRelation);
    } else {
      showToast('Выберите отношение', 'error');
    }
  });

  modal.querySelector('#add-new-relation-btn').addEventListener('click', () => {
    const newRelation = prompt('Введите новое отношение:');
    if (newRelation && newRelation.trim() && !commonRelations.includes(newRelation.trim())) {
      commonRelations.push(newRelation.trim());
      renderRelationsList(modal.querySelector('#relation-search').value);
      showToast('Новое отношение добавлено', 'success');
    }
  });

  const searchInput = modal.querySelector('#relation-search');
  searchInput.addEventListener('input', (e) => {
    renderRelationsList(e.target.value);
  });

  renderRelationsList();
}

export function showSubscriptionManagement(client) {
  const fullName = `${client.surname} ${client.name} ${client.patronymic || ''}`;
  const modal = document.createElement('div');
  modal.className = 'subscription-management-modal two-column-modal';
  modal.innerHTML = `
    <div class="subscription-management-content">
      <div class="subscription-management-header">
        <h2>Абонементы: ${fullName}</h2>
        <button type="button" class="subscription-management-close">×</button>
      </div>
      <div class="subscription-management-body">
        <div class="history-section">
          <h3>История абонементов</h3>
          <table class="subscription-history-table">
            <thead>
              <tr>
                <th>№</th>
                <th>Тип</th>
                <th>Статус</th>
                <th>Период</th>
                <th>Занятий</th>
                <th>Стоимость</th>
                <th>Продления</th>
              </tr>
            </thead>
            <tbody>
              ${client.contract.subscriptions.length ? client.contract.subscriptions.map((sub, index) => {
    const template = getSubscriptionTemplates().find(t => t.id === sub.templateId);
    const isActive = sub.isPaid && new Date(sub.endDate) >= new Date();
    return `
                  <tr class="subscription-row ${isActive ? 'active' : 'inactive'}">
                    <td>#${sub.subscriptionNumber}</td>
                    <td>${template ? template.type : 'Неизвестный'}</td>
                    <td><span class="status-${isActive ? 'active' : 'inactive'}">${isActive ? 'Акт.' : 'Неакт.'}</span></td>
                    <td>${sub.startDate} — ${sub.endDate}</td>
                    <td>${sub.remainingClasses === Infinity ? '∞' : sub.remainingClasses}</td>
                    <td>${sub.price ? sub.price + ' сум' : 'Не указана'}</td>
                    <td>
                      ${sub.renewalHistory?.length ?
        `<span class="renewal-count" title="${sub.renewalHistory.map(entry => {
          const date = new Date(entry.date || entry).toLocaleDateString('ru-RU');
          return entry.fromTemplate ? `${date}: ${entry.fromTemplate} → ${entry.toTemplate}` : date;
        }).join('\n')}">${sub.renewalHistory.length}</span>`
        : '—'}
                    </td>
                  </tr>
                `;
  }).join('') : `
                  <tr>
                    <td colspan="7" class="no-data">Нет абонементов</td>
                  </tr>
                `}
            </tbody>
          </table>
        </div>
        <div class="management-section">
          <h3>Текущий абонемент</h3>
          ${client.contract.subscriptions.find(s => s.isPaid && new Date(s.endDate) >= new Date()) ? (() => {
      const sub = client.contract.subscriptions.find(s => s.isPaid && new Date(s.endDate) >= new Date());
      const template = getSubscriptionTemplates().find(t => t.id === sub.templateId);
      return `
              <div class="subscription-item active-sub">
                <div class="detail-item">
                  <span class="detail-label">Номер:</span>
                  <span class="detail-value">#${sub.subscriptionNumber}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">Тип:</span>
                  <span class="detail-value">${template ? template.type : 'Неизвестный'}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">Период:</span>
                  <span class="detail-value">${sub.startDate} — ${sub.endDate}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">Осталось занятий:</span>
                  <span class="detail-value">${sub.remainingClasses === Infinity ? '∞' : sub.remainingClasses}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">Способ оплаты:</span>
                  <span class="detail-value">${sub.payment ? sub.payment.method : 'Не указан'}</span>
                </div>
                <button type="button" class="btn-primary renew-sub-btn" data-sub-index="${client.contract.subscriptions.indexOf(sub)}">Продлить</button>
              </div>
            `;
    })() : `
              <div class="no-data">Нет активного абонемента</div>
            `}
          <button type="button" class="btn-primary new-sub-btn">Новый абонемент</button>
        </div>
      </div>
    </div>
  `;

  document.getElementById('main-content').appendChild(modal);

  const closeModal = () => modal.remove();
  setupModalClose(modal, closeModal);

  modal.querySelector('.subscription-management-close').addEventListener('click', closeModal);

  modal.querySelectorAll('.renew-sub-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const index = parseInt(btn.dataset.subIndex);
      const sub = client.contract.subscriptions[index];
      showRenewSubscriptionForm('Продление абонемента', client, sub, (data) => {
        client.contract.subscriptions[index] = { ...sub, ...data };
        updateClient(client.id, client);
        modal.remove();
        loadClients();
        showToast('Абонемент продлён', 'success');
      });
    });
  });

  modal.querySelector('.new-sub-btn').addEventListener('click', () => {
    const newSub = {
      templateId: '',
      startDate: '',
      endDate: '',
      classesPerWeek: 0,
      daysOfWeek: [],
      classTime: '09:00',
      group: '',
      remainingClasses: 0,
      isPaid: true,
      payment: null,
      renewalHistory: [],
      subscriptionNumber: generateUniqueSubscriptionNumber(client.contract),
      clientId: client.id
    };
    showSubscriptionForm('Новый абонемент', newSub, [client], getGroups(), (data) => {
      const template = getSubscriptionTemplates().find(t => t.id === data.templateId);
      client.contract.subscriptions.push({
        ...data,
        remainingClasses: template ? template.remainingClasses : data.remainingClasses || 0
      });
      updateClient(client.id, client);
      modal.remove();
      loadClients();
      showToast('Новый абонемент создан', 'success');
    });
  });
}

export function showSubscriptionForm(title, sub, clients, groups, callback) {
  const modal = document.createElement('div');
  modal.className = 'subscription-form-modal';
  const client = clients.find(c => c.id === sub.clientId) || { surname: '', name: '' };
  modal.innerHTML = `
    <div class="subscription-form-content">
      <div class="subscription-form-header">
        <h2>${title}</h2>
        <button type="button" class="subscription-form-close">×</button>
      </div>
      <div class="subscription-form-body">
        <div class="form-grid">
          <div class="form-group">
            <label for="subscription-client" class="required">Клиент</label>
            <select id="subscription-client" required disabled>
              <option value="${sub.clientId}">${client.surname} ${client.name}</option>
            </select>
          </div>
          <div class="form-group">
            <label for="subscription-template" class="required">Тип абонемента</label>
            <select id="subscription-template" required>
              <option value="">Выберите тип</option>
              ${getSubscriptionTemplates().map(t => `<option value="${t.id}" ${sub.templateId === t.id ? 'selected' : ''}>${t.type}</option>`).join('')}
            </select>
          </div>
          <div class="form-group">
            <label for="subscription-classes-per-week" class="required">Занятий в неделю</label>
            <input type="number" id="subscription-classes-per-week" value="${sub.classesPerWeek || ''}" min="0" max="7" required>
          </div>
          <div class="form-group">
            <label for="subscription-class-time" class="required">Время занятия</label>
            <input type="time" id="subscription-class-time" value="${sub.classTime || '09:00'}" required>
          </div>
          <div class="form-group">
            <label for="subscription-start-date" class="required">Дата начала</label>
            <input type="date" id="subscription-start-date" value="${sub.startDate || ''}" required>
          </div>
          <div class="form-group">
            <label for="subscription-end-date" class="required">Дата окончания</label>
            <input type="date" id="subscription-end-date" value="${sub.endDate || ''}" required>
          </div>
          <div class="form-group full-width">
            <label>Дни недели</label>
            <div class="days-of-week-selector">
              ${['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map(day => `
                <button type="button" class="day-button ${sub.daysOfWeek?.includes(day) ? 'selected' : ''}" data-day="${day}">${day}</button>
              `).join('')}
            </div>
          </div>
          <div class="form-group">
            <label for="subscription-group">Группа</label>
            <select id="subscription-group">
              <option value="">Без группы</option>
              ${groups.map(g => `<option value="${g}" ${sub.group === g ? 'selected' : ''}>${g}</option>`).join('')}
            </select>
          </div>
          <div class="form-group">
            <label class="checkbox-label">
              <input type="checkbox" id="subscription-is-paid" ${sub.isPaid !== false ? 'checked' : ''}>
              <span class="checkmark"></span>
              Оплачен
            </label>
          </div>
          <div class="form-group full-width" id="payment-section" style="display: ${sub.isPaid !== false ? 'block' : 'none'};">
            <label for="payment-method" class="required">Способ оплаты</label>
            <select id="payment-method" required>
              <option value="">Выберите способ</option>
              <option value="cash">Наличные</option>
              <option value="cash_register">Касса (нал/карта)</option>
              <option value="bank_transfer">Расчётный счёт</option>
            </select>
            <div id="payment-details"></div>
          </div>
        </div>
      </div>
      <div class="subscription-form-footer">
        <button type="button" id="subscription-cancel-btn" class="btn-secondary">Отмена</button>
        <button type="button" id="subscription-save-btn" class="btn-primary">Сохранить</button>
      </div>
    </div>
  `;

  document.getElementById('main-content').appendChild(modal);

  const closeModal = () => modal.remove();
  setupModalClose(modal, closeModal);
  modal.querySelector('.subscription-form-close').addEventListener('click', closeModal);

  const dayButtons = modal.querySelectorAll('.day-button');
  dayButtons.forEach(btn => btn.addEventListener('click', () => btn.classList.toggle('selected')));

  const startInput = modal.querySelector('#subscription-start-date');
  const endInput = modal.querySelector('#subscription-end-date');
  startInput.addEventListener('change', () => {
    if (startInput.value && !endInput.value) {
      const start = new Date(startInput.value);
      start.setDate(start.getDate() + 30);
      endInput.value = start.toISOString().split('T')[0];
    }
  });

  const isPaidCheckbox = modal.querySelector('#subscription-is-paid');
  const paymentSection = modal.querySelector('#payment-section');
  isPaidCheckbox.addEventListener('change', () => {
    paymentSection.style.display = isPaidCheckbox.checked ? 'block' : 'none';
  });

  const paymentMethodSelect = modal.querySelector('#payment-method');
  const paymentDetailsDiv = modal.querySelector('#payment-details');
  paymentMethodSelect.addEventListener('change', () => {
    paymentDetailsDiv.innerHTML = '';
    const method = paymentMethodSelect.value;
    if (method === 'cash' || method === 'bank_transfer') {
      paymentDetailsDiv.innerHTML = `
        <label for="payment-amount">Сумма</label>
        <input type="number" id="payment-amount" placeholder="Введите сумму" required>
        ${method === 'bank_transfer' ? `
          <label for="payment-reference">Ссылка/номер</label>
          <input type="text" id="payment-reference" placeholder="Введите ссылку или номер">
        ` : ''}
      `;
    } else if (method === 'cash_register') {
      paymentDetailsDiv.innerHTML = `
        <label for="payment-cash">Наличные</label>
        <input type="number" id="payment-cash" placeholder="Сумма наличными" required>
        <label for="payment-card">Карта/терминал</label>
        <input type="number" id="payment-card" placeholder="Сумма по карте" required>
      `;
    }
  });

  modal.querySelector('#subscription-save-btn').addEventListener('click', () => {
    const templateId = modal.querySelector('#subscription-template').value;
    const classesPerWeek = parseInt(modal.querySelector('#subscription-classes-per-week').value);
    const daysOfWeek = Array.from(modal.querySelectorAll('.day-button.selected')).map(b => b.dataset.day);
    const startDate = modal.querySelector('#subscription-start-date').value;
    const endDate = modal.querySelector('#subscription-end-date').value;
    const classTime = modal.querySelector('#subscription-class-time').value;
    const group = modal.querySelector('#subscription-group').value;
    const isPaid = modal.querySelector('#subscription-is-paid').checked;

    if (!templateId || isNaN(classesPerWeek) || !startDate || !endDate || !classTime) {
      showToast('Заполните все обязательные поля!', 'error');
      return;
    }

    if (new Date(endDate) <= new Date(startDate)) {
      showToast('Дата окончания должна быть позже начала!', 'error');
      return;
    }

    if (classesPerWeek > 0 && daysOfWeek.length === 0) {
      showToast('Выберите дни недели!', 'error');
      return;
    }

    let payment = null;
    if (isPaid) {
      const method = paymentMethodSelect.value;
      if (!method) {
        showToast('Выберите способ оплаты!', 'error');
        return;
      }
      payment = {
        method,
        date: new Date().toISOString(),
        details: {}
      };
      if (method === 'cash' || method === 'bank_transfer') {
        const amount = parseFloat(modal.querySelector('#payment-amount').value);
        if (isNaN(amount) || amount <= 0) {
          showToast('Введите корректную сумму!', 'error');
          return;
        }
        payment.details.amount = amount;
        if (method === 'bank_transfer') {
          payment.details.reference = modal.querySelector('#payment-reference').value.trim();
        }
      } else if (method === 'cash_register') {
        const cash = parseFloat(modal.querySelector('#payment-cash').value);
        const card = parseFloat(modal.querySelector('#payment-card').value);
        if (isNaN(cash) || cash < 0 || isNaN(card) || card < 0) {
          showToast('Введите корректные суммы для наличных и карты!', 'error');
          return;
        }
        payment.details.cash = cash;
        payment.details.card = card;
      }
    }

    callback({
      templateId,
      startDate,
      endDate,
      classesPerWeek,
      daysOfWeek,
      classTime,
      group,
      isPaid,
      payment,
      renewalHistory: sub.renewalHistory || [],
      subscriptionNumber: sub.subscriptionNumber
    });

    closeModal();
  });

  modal.querySelector('#subscription-cancel-btn').addEventListener('click', closeModal);
}

export function showRenewSubscriptionForm(title, client, sub, callback) {
  const subscriptionTemplate = getSubscriptionTemplates().find(t => t.id === sub.templateId);
  const defaultEndDate = new Date(Math.max(new Date('2025-09-17'), new Date(sub.endDate)));
  defaultEndDate.setDate(defaultEndDate.getDate() + 30);

  const modal = document.createElement('div');
  modal.className = 'renew-subscription-modal two-column-modal';
  modal.innerHTML = `
    <div class="renew-subscription-content">
      <div class="renew-header">
        <h2>${title}</h2>
        <button type="button" class="renew-close">×</button>
      </div>
      <div class="renew-body">
        <div class="history-section">
          <h3>Текущий абонемент</h3>
          <div class="info-grid">
            <div class="info-item">
              <span class="label">Номер:</span>
              <span class="value">#${sub.subscriptionNumber}</span>
            </div>
            <div class="info-item">
              <span class="label">Тип:</span>
              <span class="value">${subscriptionTemplate ? subscriptionTemplate.type : 'Неизвестный'}</span>
            </div>
            <div class="info-item">
              <span class="label">Период:</span>
              <span class="value">${sub.startDate} — ${sub.endDate}</span>
            </div>
            <div class="info-item">
              <span class="label">Осталось занятий:</span>
              <span class="value ${sub.remainingClasses <= 3 && sub.remainingClasses !== Infinity ? 'low-classes' : ''}">${sub.remainingClasses === Infinity ? '∞' : sub.remainingClasses}</span>
            </div>
            <div class="info-item">
              <span class="label">Оплата:</span>
              <span class="value">${sub.payment ? sub.payment.method : 'Не оплачено'}</span>
            </div>
            <div class="info-item">
              <span class="label">Статус:</span>
              <span class="value status-${sub.isPaid && new Date(sub.endDate) >= new Date() ? 'active' : 'inactive'}">${sub.isPaid && new Date(sub.endDate) >= new Date() ? 'Активный' : 'Неактивный'}</span>
            </div>
          </div>
          ${sub.renewalHistory && sub.renewalHistory.length ? `
            <div class="renewal-history-section">
              <h4>История продлений</h4>
              <div class="renewal-list">
                ${sub.renewalHistory.map(entry => {
    const date = new Date(entry.date || entry).toLocaleDateString('ru-RU');
    return entry.fromTemplate ?
      `<span class="renewal-item">${date}: ${entry.fromTemplate} → ${entry.toTemplate}</span>` :
      `<span class="renewal-item">${date}</span>`;
  }).join('')}
              </div>
            </div>
          ` : ''}
        </div>
        <div class="management-section">
          <h3>Параметры продления</h3>
          <div class="form-grid">
            <div class="form-group">
              <label for="renew-template" class="required">Тип абонемента</label>
              <select id="renew-template" required>
                <option value="${sub.templateId}">${subscriptionTemplate ? subscriptionTemplate.type : 'Текущий'}</option>
                ${getSubscriptionTemplates().filter(t => t.id !== sub.templateId).map(t => `<option value="${t.id}">${t.type}</option>`).join('')}
              </select>
            </div>
            <div class="form-group">
              <label for="renew-classes-per-week" class="required">Занятий в неделю</label>
              <input type="number" id="renew-classes-per-week" value="${sub.classesPerWeek || ''}" min="0" max="7" required>
            </div>
            <div class="form-group">
              <label for="renew-class-time" class="required">Время занятия</label>
              <input type="time" id="renew-class-time" value="${sub.classTime || '09:00'}" required>
            </div>
            <div class="form-group">
              <label for="renew-start-date" class="required">Дата начала</label>
              <input type="date" id="renew-start-date" value="${sub.startDate || ''}" required>
            </div>
            <div class="form-group">
              <label for="renew-end-date" class="required">Дата окончания</label>
              <input type="date" id="renew-end-date" value="${defaultEndDate.toISOString().split('T')[0]}" required>
            </div>
            <div class="form-group full-width">
              <label>Дни недели</label>
              <div class="days-of-week-selector">
                ${['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map(day => `
                  <button type="button" class="day-button ${sub.daysOfWeek?.includes(day) ? 'selected' : ''}" data-day="${day}">${day}</button>
                `).join('')}
              </div>
            </div>
            <div class="form-group">
              <label for="renew-group">Группа</label>
              <select id="renew-group">
                <option value="">Без группы</option>
                ${getGroups().map(g => `<option value="${g}" ${sub.group === g ? 'selected' : ''}>${g}</option>`).join('')}
              </select>
            </div>
            <div class="form-group">
              <label class="checkbox-label">
                <input type="checkbox" id="renew-is-paid" ${sub.isPaid !== false ? 'checked' : ''}>
                <span class="checkmark"></span>
                Оплачен
              </label>
            </div>
            <div class="form-group full-width" id="renew-payment-section" style="display: ${sub.isPaid !== false ? 'block' : 'none'};">
              <label for="renew-payment-method" class="required">Способ оплаты</label>
              <select id="renew-payment-method" required>
                <option value="">Выберите способ</option>
                <option value="cash">Наличные</option>
                <option value="cash_register">Касса (нал/карта)</option>
                <option value="bank_transfer">Расчётный счёт</option>
              </select>
              <div id="renew-payment-details"></div>
            </div>
          </div>
        </div>
      </div>
      <div class="renew-footer">
        <button type="button" id="renew-cancel-btn" class="btn-secondary">Отмена</button>
        <button type="button" id="renew-save-btn" class="btn-primary">Продлить</button>
      </div>
    </div>
  `;

  document.getElementById('main-content').appendChild(modal);

  const closeModal = () => modal.remove();
  setupModalClose(modal, closeModal);

  modal.querySelector('.renew-close').addEventListener('click', closeModal);
  modal.querySelector('#renew-cancel-btn').addEventListener('click', closeModal);

  const dayButtons = modal.querySelectorAll('.day-button');
  dayButtons.forEach(button => {
    button.addEventListener('click', () => {
      button.classList.toggle('selected');
    });
  });

  const startDateInput = document.getElementById('renew-start-date');
  const endDateInput = document.getElementById('renew-end-date');

  startDateInput.addEventListener('change', () => {
    if (startDateInput.value && !endDateInput.value) {
      const startDate = new Date(startDateInput.value);
      startDate.setDate(startDate.getDate() + 30);
      endDateInput.value = startDate.toISOString().split('T')[0];
    }
  });

  const isPaidCheckbox = document.getElementById('renew-is-paid');
  const paymentSection = document.getElementById('renew-payment-section');
  isPaidCheckbox.addEventListener('change', () => {
    paymentSection.style.display = isPaidCheckbox.checked ? 'block' : 'none';
  });

  const paymentMethodSelect = document.getElementById('renew-payment-method');
  const paymentDetailsDiv = document.getElementById('renew-payment-details');
  paymentMethodSelect.addEventListener('change', () => {
    paymentDetailsDiv.innerHTML = '';
    const method = paymentMethodSelect.value;
    if (method === 'cash' || method === 'bank_transfer') {
      paymentDetailsDiv.innerHTML = `
        <label for="renew-payment-amount">Сумма</label>
        <input type="number" id="renew-payment-amount" placeholder="Введите сумму" required>
        ${method === 'bank_transfer' ? `
          <label for="renew-payment-reference">Ссылка/номер</label>
          <input type="text" id="renew-payment-reference" placeholder="Введите ссылку или номер">
        ` : ''}
      `;
    } else if (method === 'cash_register') {
      paymentDetailsDiv.innerHTML = `
        <label for="renew-payment-cash">Наличные</label>
        <input type="number" id="renew-payment-cash" placeholder="Сумма наличными" required>
        <label for="renew-payment-card">Карта/терминал</label>
        <input type="number" id="renew-payment-card" placeholder="Сумма по карте" required>
      `;
    }
  });

  document.getElementById('renew-save-btn').addEventListener('click', () => {
    const templateId = document.getElementById('renew-template').value;
    const classesPerWeek = parseInt(document.getElementById('renew-classes-per-week').value);
    const daysOfWeek = Array.from(modal.querySelectorAll('.day-button.selected'))
      .map(button => button.getAttribute('data-day'));
    const startDate = document.getElementById('renew-start-date').value;
    const endDate = document.getElementById('renew-end-date').value;
    const classTime = document.getElementById('renew-class-time').value;
    const group = document.getElementById('renew-group').value;
    const isPaid = document.getElementById('renew-is-paid').checked;

    if (!templateId || isNaN(classesPerWeek) || !startDate || !endDate || !classTime) {
      showToast('Заполните все обязательные поля!', 'error');
      return;
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    if (end <= start) {
      showToast('Дата окончания должна быть позже даты начала!', 'error');
      return;
    }

    if (classesPerWeek > 0 && daysOfWeek.length === 0) {
      showToast('Выберите дни недели для занятий!', 'error');
      return;
    }

    let payment = null;
    if (isPaid) {
      const method = paymentMethodSelect.value;
      if (!method) {
        showToast('Выберите способ оплаты!', 'error');
        return;
      }
      payment = {
        method,
        date: new Date().toISOString(),
        details: {}
      };
      if (method === 'cash' || method === 'bank_transfer') {
        const amount = parseFloat(document.getElementById('renew-payment-amount').value);
        if (isNaN(amount) || amount <= 0) {
          showToast('Введите корректную сумму!', 'error');
          return;
        }
        payment.details.amount = amount;
        if (method === 'bank_transfer') {
          payment.details.reference = document.getElementById('renew-payment-reference').value.trim();
        }
      } else if (method === 'cash_register') {
        const cash = parseFloat(document.getElementById('renew-payment-cash').value);
        const card = parseFloat(document.getElementById('renew-payment-card').value);
        if (isNaN(cash) || cash < 0 || isNaN(card) || card < 0) {
          showToast('Введите корректные суммы для наличных и карты!', 'error');
          return;
        }
        payment.details.cash = cash;
        payment.details.card = card;
      }
    }

    const template = getSubscriptionTemplates().find(t => t.id === templateId);
    const renewalEntry = {
      date: new Date().toISOString(),
      fromTemplate: subscriptionTemplate ? subscriptionTemplate.type : 'Неизвестный',
      toTemplate: template ? template.type : 'Неизвестный'
    };

    callback({
      templateId,
      startDate,
      endDate,
      classesPerWeek,
      daysOfWeek,
      classTime,
      group,
      isPaid,
      payment,
      subscriptionNumber: sub.subscriptionNumber,
      remainingClasses: template ? template.remainingClasses : sub.remainingClasses,
      renewalHistory: [...(sub.renewalHistory || []), renewalEntry]
    });

    closeModal();
  });
}

export function showGroupForm(title, client, groups, callback) {
  const modal = document.createElement('div');
  modal.className = 'group-form-modal two-column-modal';
  let selectedGroups = [...(client.groups || [])];
  let groupHistory = [...(client.groupHistory || [])];

  function renderHistory() {
    return groupHistory.length ? groupHistory.map(entry => `
      <li>${formatDate(entry.date)}: ${entry.action === 'added' ? 'Добавлен в' : 'Удалён из'} ${entry.group}</li>
    `).join('') : '<div class="no-data">Нет истории переходов</div>';
  }

  function renderGroups(searchTerm = '') {
    const filteredGroups = groups.filter(g => g.toLowerCase().includes(searchTerm.toLowerCase())).sort((a, b) => a.localeCompare(b));
    return filteredGroups.map(group => `
      <div class="group-item ${selectedGroups.includes(group) ? 'selected' : ''}" data-group="${group}">
        ${group}
      </div>
    `).join('');
  }

  modal.innerHTML = `
    <div class="group-form-content">
      <div class="group-form-header">
        <h2>${title}</h2>
        <button type="button" class="group-form-close">×</button>
      </div>
      <div class="group-form-body">
        <div class="history-section">
          <h3>История переходов</h3>
          <ul class="history-list">${renderHistory()}</ul>
        </div>
        <div class="management-section">
          <h3>Управление группами</h3>
          <div class="group-search-container">
            <input type="text" id="group-search" placeholder="Поиск группы...">
          </div>
          <div class="groups-list-container">
            <div class="groups-list">${renderGroups()}</div>
          </div>
        </div>
      </div>
      <div class="group-form-footer">
        <button type="button" id="group-cancel-btn" class="btn-secondary">Отмена</button>
        <button type="button" id="group-save-btn" class="btn-primary">Сохранить</button>
      </div>
    </div>
  `;

  document.getElementById('main-content').appendChild(modal);

  const closeModal = () => modal.remove();
  setupModalClose(modal, closeModal);

  modal.querySelector('.group-form-close').addEventListener('click', closeModal);
  modal.querySelector('#group-cancel-btn').addEventListener('click', closeModal);

  const searchInput = modal.querySelector('#group-search');
  searchInput.addEventListener('input', (e) => {
    modal.querySelector('.groups-list').innerHTML = renderGroups(e.target.value);
    attachGroupListeners();
  });

  function attachGroupListeners() {
    modal.querySelectorAll('.group-item').forEach(item => {
      item.addEventListener('click', () => {
        const group = item.dataset.group;
        const action = selectedGroups.includes(group) ? 'removed' : 'added';
        showGroupTransitionForm(client, group, action, (transitionDate) => {
          if (transitionDate) {
            if (action === 'added') {
              if (!selectedGroups.includes(group)) {
                selectedGroups.push(group);
                groupHistory.push({ date: transitionDate, action: 'added', group });
              }
            } else {
              selectedGroups = selectedGroups.filter(g => g !== group);
              groupHistory.push({ date: transitionDate, action: 'removed', group });
            }
            modal.querySelector('.history-list').innerHTML = renderHistory();
            item.classList.toggle('selected', selectedGroups.includes(group));
            showToast(`${action === 'added' ? 'Добавлен' : 'Удалён'} в ${group} с ${transitionDate}`, 'success');
          }
        });
      });
    });
  }

  attachGroupListeners();

  modal.querySelector('#group-save-btn').addEventListener('click', () => {
    callback(selectedGroups, groupHistory);
    closeModal();
    showToast('Группы обновлены', 'success');
  });
}

function showGroupTransitionForm(client, group, action, callback) {
  const modal = document.createElement('div');
  modal.className = 'group-transition-modal';
  modal.innerHTML = `
    <div class="group-transition-content">
      <h2>${action === 'added' ? 'Дата добавления' : 'Дата удаления'}</h2>
      <p>Группа: ${group}</p>
      <input type="date" id="transition-date" value="${new Date('2025-09-17').toISOString().split('T')[0]}" required>
      <div class="group-transition-actions">
        <button type="button" class="btn-secondary" id="transition-cancel">Отмена</button>
        <button type="button" class="btn-primary" id="transition-confirm">Подтвердить</button>
      </div>
    </div>
  `;

  document.getElementById('main-content').appendChild(modal);

  const closeModal = () => modal.remove();
  setupModalClose(modal, closeModal);

  modal.querySelector('#transition-cancel').addEventListener('click', closeModal);

  modal.querySelector('#transition-confirm').addEventListener('click', () => {
    const transitionDate = modal.querySelector('#transition-date').value;
    if (transitionDate) {
      callback(transitionDate);
      closeModal();
    } else {
      showToast('Выберите дату!', 'error');
    }
  });
}

function generateUniqueSubscriptionNumber(contract) {
  const existingNumbers = contract.subscriptions.map(sub => sub.subscriptionNumber);
  let number = contract.subscriptions.length + 1;
  let newNumber = `SUB-${String(number).padStart(3, '0')}`;
  while (existingNumbers.includes(newNumber)) {
    number++;
    newNumber = `SUB-${String(number).padStart(3, '0')}`;
  }
  return newNumber;
}