import { getSubscriptionTemplates } from './subscriptions.js';
import { getGroups, addClientToGroup, removeClientFromGroup, getGroupById } from './groups.js';
import { server } from './server.js'; // Adjust the path if server.js is elsewhere


let groupHistoryData = JSON.parse(localStorage.getItem('groupHistoryData')) || [];

// Массив клиентов (инициализируется из localStorage)
let clientsData = JSON.parse(localStorage.getItem('clientsData')) || [];

let commonDiagnoses = [];
let commonRelations = [];




async function syncRelations() {
  try {
    const response = await fetch(`${server}/relations`);
    if (!response.ok) throw new Error('Failed to fetch relations');
    const data = await response.json();
    commonRelations = data; // Теперь массив объектов [{id, name}]
    localStorage.setItem('commonRelations', JSON.stringify(commonRelations));
    return commonRelations;
  } catch (error) {
    console.error('Error syncing relations with server:', error);
    showToast('Ошибка синхронизации отношений с сервером. Используются локальные данные.', 'warning');
    return JSON.parse(localStorage.getItem('commonRelations')) || [];
  }
}

async function syncDiagnoses() {
  try {
    const response = await fetch(`${server}/diagnoses`);
    if (!response.ok) throw new Error('Failed to fetch diagnoses');
    const data = await response.json();
    commonDiagnoses = data; // Теперь массив объектов [{id, name}]
    localStorage.setItem('commonDiagnoses', JSON.stringify(commonDiagnoses));
    return commonDiagnoses;
  } catch (error) {
    console.error('Error syncing diagnoses with server:', error);
    showToast('Ошибка синхронизации диагнозов с сервером. Используются локальные данные.', 'warning');
    return JSON.parse(localStorage.getItem('commonDiagnoses')) || [];
  }
}

async function addRelation(newRelation) {
  try {
    const response = await fetch(`${server}/relations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newRelation })
    });
    if (!response.ok) throw new Error('Failed to add relation');
    await syncRelations(); // Синхронизируем после добавления
    showToast('Отношение добавлено на сервер', 'success');
  } catch (error) {
    console.error('Error adding relation to server:', error);
    showToast('Ошибка добавления отношения на сервер.', 'error');
  }
}

async function addDiagnosis(newDiagnosis) {
  try {
    const response = await fetch(`${server}/diagnoses`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newDiagnosis })
    });
    if (!response.ok) throw new Error('Failed to add diagnosis');
    await syncDiagnoses(); // Синхронизируем после добавления
    showToast('Диагноз добавлен на сервер', 'success');
  } catch (error) {
    console.error('Error adding diagnosis to server:', error);
    showToast('Ошибка добавления диагноза на сервер.', 'error');
  }
}

async function updateDiagnosis(oldName, newName) {
  try {
    const diag = commonDiagnoses.find(d => d.name === oldName);
    if (!diag) throw new Error('Diagnosis not found');
    const response = await fetch(`${server}/diagnoses/${diag.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newName })
    });
    if (!response.ok) throw new Error('Failed to update diagnosis');
    await syncDiagnoses();
    showToast('Диагноз обновлен на сервере', 'success');
  } catch (error) {
    console.error('Error updating diagnosis:', error);
    showToast('Ошибка обновления диагноза', 'error');
  }
}

async function updateRelation(oldName, newName) {
  try {
    const rel = commonRelations.find(r => r.name === oldName);
    if (!rel) throw new Error('Relation not found');
    const response = await fetch(`${server}/relations/${rel.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newName })
    });
    if (!response.ok) throw new Error('Failed to update relation');
    await syncRelations();
    showToast('Отношение обновлено на сервере', 'success');
  } catch (error) {
    console.error('Error updating relation:', error);
    showToast('Ошибка обновления отношения', 'error');
  }
}

async function deleteDiagnosis(name) {
  try {
    const diag = commonDiagnoses.find(d => d.name === name);
    if (!diag) throw new Error('Diagnosis not found');
    const response = await fetch(`${server}/diagnoses/${diag.id}`, {
      method: 'DELETE'
    });
    if (!response.ok) throw new Error('Failed to delete diagnosis');
    await syncDiagnoses();
    showToast('Диагноз удален с сервера', 'success');
  } catch (error) {
    console.error('Error deleting diagnosis:', error);
    showToast('Ошибка удаления диагноза', 'error');
  }
}

async function deleteRelation(name) {
  try {
    const rel = commonRelations.find(r => r.name === name);
    if (!rel) throw new Error('Relation not found');
    const response = await fetch(`${server}/relations/${rel.id}`, {
      method: 'DELETE'
    });
    if (!response.ok) throw new Error('Failed to delete relation');
    await syncRelations();
    showToast('Отношение удалено с сервера', 'success');
  } catch (error) {
    console.error('Error deleting relation:', error);
    showToast('Ошибка удаления отношения', 'error');
  }
}

function getRelationName(id) {
  return commonRelations.find(r => r.id === id)?.name || 'Неизвестно';
}

function getDiagnosisName(id) {
  return commonDiagnoses.find(d => d.id === id)?.name || 'Неизвестно';
}

async function getOrCreateRelationId(name) {
  if (!name) return null;
  let rel = commonRelations.find(r => r.name === name);
  if (rel) return rel.id;
  await addRelation(name);
  rel = commonRelations.find(r => r.name === name);
  return rel?.id || null;
}

async function getOrCreateDiagnosisId(name) {
  if (!name) return null;
  let diag = commonDiagnoses.find(d => d.name === name);
  if (diag) return diag.id;
  await addDiagnosis(name);
  diag = commonDiagnoses.find(d => d.name === name);
  return diag?.id || null;
}

async function syncClientsWithServer() {
  try {
    const response = await fetch(`${server}/clients`);
    if (!response.ok) throw new Error('Failed to fetch clients');
    const serverData = await response.json();
    clientsData = serverData;
    localStorage.setItem('clientsData', JSON.stringify(clientsData));
    return serverData;
  } catch (error) {
    console.error('Error syncing with server:', error);
    showToast('Ошибка синхронизации с сервером. Используются локальные данные.', 'error');
    return clientsData;
  }
}

export function getClients() {
  return clientsData;
}

export function getClientById(id) {
  return clientsData.find(c => c.id === id) || null;
}

export async function addClient(client) {
  const parentsWithIds = await Promise.all((client.parents || []).map(async p => ({
    full_name: p.fullName || '',
    phone: p.phone || '',
    relation_id: await getOrCreateRelationId(p.relation)
  })));

  const diagnosesWithIds = await Promise.all((client.diagnoses || []).map(async d => ({
    diagnosis_id: await getOrCreateDiagnosisId(d.name),
    notes: d.notes || ''
  })));

  const payload = {
    surname: client.surname,
    name: client.name,
    patronymic: client.patronymic || '',
    phone: client.phone || '',
    birth_date: client.birth_date,
    gender: client.gender,
    parents: parentsWithIds,
    diagnoses: diagnosesWithIds,
    features: client.features || '',
    blacklisted: false,
    groups: client.groups || [],
    group_history: [],
    subscriptions: [],
    photo: '' // Изначально пустое
  };

  let photoUrl = '';
  if (client.photo instanceof File) {
    const reader = new FileReader();
    reader.readAsDataURL(client.photo);
    await new Promise(resolve => reader.onload = resolve);
    photoUrl = reader.result; // Base64
    payload.photo = photoUrl;
    console.log('Photo converted to base64 in addClient:', photoUrl.substring(0, 50) + '...');
  }

  const newClient = {
    id: `client${Date.now()}`,
    ...payload,
    created_at: new Date().toISOString(),
  };

  clientsData.push(newClient);
  localStorage.setItem('clientsData', JSON.stringify(clientsData));
  console.log('Client added locally with photo:', newClient.photo ? newClient.photo.substring(0, 50) + '...' : 'null');

  try {
    console.log('Sending payload to server:', {
      ...payload,
      photo: payload.photo ? payload.photo.substring(0, 50) + '...' : 'null'
    });

    const response = await fetch(`${server}/clients`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorBody = await response.json();
      console.error('Server error details:', errorBody);
      throw new Error(`Failed to add client: ${response.status} - ${errorBody.message || 'Unknown error'}`);
    }

    const serverClient = await response.json();
    console.log('Server response:', {
      ...serverClient,
      photo: serverClient.photo ? serverClient.photo.substring(0, 50) + '...' : 'null'
    });

    if (!serverClient.photo && photoUrl) {
      console.warn('Server did not return photo, keeping local base64');
      serverClient.photo = photoUrl;
    }

    Object.assign(newClient, serverClient);
    localStorage.setItem('clientsData', JSON.stringify(clientsData));
    showToast('Клиент добавлен и синхронизирован с сервером', 'success');
    if (typeof renderClients === 'function') renderClients(); // Автообновление списка
  } catch (error) {
    console.error('Error adding client to server:', error);
    showToast('Ошибка добавления на сервер. Клиент сохранён локально.', 'error');
  }

  return newClient;
}

export async function updateClient(id, data) {
  const client = clientsData.find(c => c.id === id);
  if (!client) {
    console.error('Client not found:', id);
    return null;
  }

  // Handle photo
  let photoUrl = client.photo || '';
  if (data.photo instanceof File) {
    const reader = new FileReader();
    reader.readAsDataURL(data.photo);
    await new Promise(resolve => reader.onload = resolve);
    photoUrl = reader.result;
    console.log('Photo converted to base64:', photoUrl.substring(0, 50) + '...');
  } else if (data.photo === '') {
    photoUrl = '';
  }

  const parentsWithIds = await Promise.all((data.parents || []).map(async p => ({
    full_name: p.fullName || '',
    phone: p.phone || '',
    relation_id: await getOrCreateRelationId(p.relation)
  })));

  const diagnosesWithIds = await Promise.all((data.diagnoses || []).map(async d => ({
    diagnosis_id: await getOrCreateDiagnosisId(d.name),
    notes: d.notes || ''
  })));

  // Update client locally (для форм храним name, но можно хранить как есть)
  Object.assign(client, {
    ...data,
    photo: photoUrl,
    parents: data.parents,  // В форме: {fullName, phone, relation}
    diagnoses: data.diagnoses,  // В форме: {name, notes}
    groups: Array.isArray(data.groups) ? data.groups : client.groups || []
  });
  localStorage.setItem('clientsData', JSON.stringify(clientsData));
  console.log('Client updated locally with photo:', client.photo ? client.photo.substring(0, 50) + '...' : 'null');

  // Prepare payload for server
  const updatedPayload = {
    surname: client.surname,
    name: client.name,
    patronymic: client.patronymic || '',
    phone: client.phone || '',
    birth_date: client.birth_date,
    gender: client.gender,
    parents: parentsWithIds,
    diagnoses: diagnosesWithIds,
    features: data.features || '',
    blacklisted: client.blacklisted !== undefined ? client.blacklisted : false,
    groups: Array.isArray(client.groups) ? client.groups : [],
    group_history: Array.isArray(client.group_history)
      ? client.group_history
        .filter(entry => {
          if (!entry.group) {
            console.warn('Invalid group_history entry missing group:', entry);
            return false;
          }
          return true;
        })
        .map(entry => ({
          date: entry.date.split('T')[0],
          action: entry.action,
          group_id: entry.group
        }))
      : [],
    subscriptions: Array.isArray(client.subscriptions) ? client.subscriptions : [],
    photo: photoUrl
  };

  try {
    console.log('Sending payload to server:', {
      ...updatedPayload,
      photo: updatedPayload.photo ? updatedPayload.photo.substring(0, 50) + '...' : 'null'
    });

    const response = await fetch(`${server}/clients/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedPayload)
    });

    if (!response.ok) {
      let errorMessage = `Failed to update: ${response.status} ${response.statusText}`;
      try {
        const errorBody = await response.json();
        console.error('Server error details:', JSON.stringify(errorBody, null, 2));
        errorMessage += ` - ${errorBody.message || JSON.stringify(errorBody.detail) || 'Unknown error'}`;
      } catch (parseError) {
        console.error('Could not parse error body:', parseError);
      }
      throw new Error(errorMessage);
    }

    const serverClient = await response.json();
    console.log('Server response:', {
      ...serverClient,
      photo: serverClient.photo ? serverClient.photo.substring(0, 50) + '...' : 'null'
    });

    if (!serverClient.photo && photoUrl) {
      console.warn('Server did not return photo, keeping local base64');
      serverClient.photo = photoUrl;
    }

    Object.assign(client, serverClient);
    localStorage.setItem('clientsData', JSON.stringify(clientsData));
    showToast('Клиент обновлён и синхронизирован с сервером', 'success');
    if (typeof renderClients === 'function') renderClients(); // Автообновление списка
  } catch (error) {
    console.error('Error updating client on server:', error);
    showToast('Ошибка обновления на сервере. Изменения сохранены локально.', 'warning');
  }

  return client;
}

export async function removeClient(id) {
  clientsData = clientsData.filter(c => c.id !== id);
  localStorage.setItem('clientsData', JSON.stringify(clientsData));

  try {
    const response = await fetch(`${server}/clients/${id}`, {
      method: 'DELETE'
    });
    if (!response.ok) throw new Error('Failed to delete client');
    showToast('Клиент удалён с сервера', 'success');
  } catch (error) {
    console.error('Error deleting client from server:', error);
    showToast('Ошибка удаления с сервера. Клиент удалён локально.', 'error');
  }
}

export function addGroupToClient(clientId, groupId, action = 'added', date = new Date().toISOString().split('T')[0]) {
  console.log(`addGroupToClient: clientId=${clientId}, groupId=${groupId}, date=${date}`);
  const client = getClientById(clientId);
  if (!client) {
    console.error(`Клиент с ID ${clientId} не найден`);
    return;
  }
  if (!client.groups.includes(groupId)) {
    client.groups.push(groupId);
    client.group_history.push({ date, action, group: groupId });
    groupHistoryData.push({ clientId, date, action, group: groupId });
    localStorage.setItem('groupHistoryData', JSON.stringify(groupHistoryData));
    localStorage.setItem('clientsData', JSON.stringify(clientsData));
    console.log(`Клиент ${clientId} добавлен в группу ${groupId} с датой ${date}`);
    updateClient(clientId, client).then(() => {
      console.log('Group update synced with server');
    });
    if (typeof renderClients === 'function') {
      renderClients();
    }
  } else {
    console.log(`Клиент ${clientId} уже в группе ${groupId}`);
  }
}

export function removeGroupFromClient(clientId, groupId) {
  console.log(`removeGroupFromClient: clientId=${clientId}, groupId=${groupId}`);
  const client = getClientById(clientId);
  if (!client) {
    console.error(`Клиент с ID ${clientId} не найден`);
    return;
  }
  if (client.groups.includes(groupId)) {
    client.groups = client.groups.filter(g => g !== groupId);
    const date = new Date().toISOString().split('T')[0]; // Use date-only format
    client.group_history.push({ date, action: 'removed', group: groupId });
    groupHistoryData.push({ clientId, date, action: 'removed', group: groupId });
    localStorage.setItem('groupHistoryData', JSON.stringify(groupHistoryData));
    localStorage.setItem('clientsData', JSON.stringify(clientsData));
    console.log(`Клиент ${clientId} удалён из группы ${groupId}`);
    updateClient(clientId, client).then(() => {
      console.log('Group removal synced with server');
    });
    if (typeof renderClients === 'function') {
      renderClients();
    }
  } else {
    console.log(`Клиент ${clientId} не состоит в группе ${groupId}`);
  }
}

function generateUniqueSubscriptionNumber(client) {
  const existingNumbers = client.subscriptions.map(sub => sub.subscriptionNumber);
  let number = client.subscriptions.length + 1;
  let newNumber = `SUB-${String(number).padStart(3, '0')}`;
  while (existingNumbers.includes(newNumber)) {
    number++;
    newNumber = `SUB-${String(number).padStart(3, '0')}`;
  }
  return newNumber;
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

  // Инициализация родителей: из сервера full_name и relation_id → fullName и relation (name)
  let parents = client.parents
    ? [...client.parents.map(p => ({
        fullName: p.full_name || p.fullName || '',
        phone: p.phone || '',
        relation: getRelationName(p.relation_id) || p.relation || ''
      }))]
    : [];

  // Инициализация диагнозов: из сервера diagnosis_id и notes → name и notes
  let diagnoses = client.diagnoses
    ? [...client.diagnoses
        .filter(d => d.diagnosis_id !== undefined && d.diagnosis_id !== null) // Фильтруем некорректные diagnosis_id
        .map(d => {
          const diagnosisName = d.name || getDiagnosisName(d.diagnosis_id) || 'Неизвестный диагноз';
          if (!d.diagnosis_id || getDiagnosisName(d.diagnosis_id) === 'Неизвестно') {
            console.warn(`Диагноз с ID ${d.diagnosis_id} не найден в commonDiagnoses`, d);
          }
          return {
            name: diagnosisName,
            notes: d.notes || ''
          };
        })]
    : [];

  // Логирование для отладки
  console.log('client.diagnoses:', client.diagnoses);
  console.log('Инициализированные диагнозы:', diagnoses);
  console.log('commonDiagnoses:', commonDiagnoses);

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
          ${parents.length
            ? parents
                .map(
                  (p, index) => `
            <tr class="parent-row" data-index="${index}">
              <td><input type="text" class="parent-fullname" value="${p.fullName || ''}" required></td>
              <td><input type="tel" class="parent-phone" value="${p.phone || ''}" required></td>
              <td>
                <div class="input-with-button">
                  <input type="text" list="relation-list" class="parent-relation" value="${p.relation || ''}" required>
                  <datalist id="relation-list">
                    ${commonRelations.map(rel => `<option value="${rel.name}">`).join('')}
                  </datalist>
                  <button type="button" class="relation-dictionary-btn">...</button>
                </div>
              </td>
            </tr>
          `
                )
                .join('')
            : `
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

      fullnameInput.addEventListener('input', e => (parents[index].fullName = e.target.value));
      phoneInput.addEventListener('input', e => (parents[index].phone = e.target.value));
      relationInput.addEventListener('input', e => (parents[index].relation = e.target.value));

      dictionaryBtn.addEventListener('click', () => {
        showRelationDictionary(selectedRelation => {
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
          ${diagnoses.length
            ? diagnoses
                .map(
                  (d, index) => `
                <tr class="diagnosis-row" data-index="${index}">
                  <td>
                    <div class="input-with-button">
                      <input type="text" list="diagnosis-list" class="diagnosis-name" value="${
                        d.name || ''
                      }" required>
                      <datalist id="diagnosis-list">
                        ${commonDiagnoses.map(diag => `<option value="${diag.name}">`).join('')}
                      </datalist>
                      <button type="button" class="diagnosis-dictionary-btn">...</button>
                    </div>
                  </td>
                  <td><input type="text" class="diagnosis-notes" value="${d.notes || ''}"></td>
                </tr>
              `
                )
                .join('')
            : `
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

      nameInput.addEventListener('input', e => (diagnoses[index].name = e.target.value));
      notesInput.addEventListener('input', e => (diagnoses[index].notes = e.target.value));

      dictionaryBtn.addEventListener('click', () => {
        showDiagnosisDictionary(selectedDiagnosis => {
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
            <input type="date" id="client-birthdate" value="${client.birth_date || ''}" required> 
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
              <button type="button" class="photo-remove-btn" id="photo-remove-btn" ${
                !client.photo ? 'style="display: none;"' : ''
              }>
                X
              </button>
            </div>
            <div id="client-photo-preview" class="client-photo-preview ${!client.photo ? 'placeholder' : ''}">
              ${client.photo
                ? `<img src="${client.photo}" alt="${client.surname || 'Клиент'}">`
                : `<img src="images/icon-photo.svg" alt="Загрузить фото" class="upload-icon">`}
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
          <input type="text" id="client-features" value="${
            client.features || ''
          }" placeholder="Дополнительная информация о клиенте, особенности занятий...">
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

  photoInput.addEventListener('change', e => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        showToast('Размер файла не должен превышать 5MB', 'error');
        return;
      }

      const reader = new FileReader();
      reader.onload = ev => {
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
  // Проверка commonDiagnoses перед рендерингом
  if (!commonDiagnoses.length) {
    console.warn('commonDiagnoses пуст, пытаемся синхронизировать');
    showToast('Справочник диагнозов не загружен, синхронизация...', 'warning');
    syncDiagnoses().then(() => {
      console.log('commonDiagnoses после синхронизации:', commonDiagnoses);
      // Повторная инициализация диагнозов после синхронизации
      diagnoses = client.diagnoses
        ? [...client.diagnoses
            .filter(d => d.diagnosis_id !== undefined && d.diagnosis_id !== null)
            .map(d => {
              const diagnosisName = d.name || getDiagnosisName(d.diagnosis_id) || 'Неизвестный диагноз';
              return {
                name: diagnosisName,
                notes: d.notes || ''
              };
            })]
        : [];
      renderDiagnoses(diagnosesContainer);
    });
  } else {
    renderDiagnoses(diagnosesContainer);
  }

  function validateForm() {
    let isValid = true;

    document.querySelectorAll('.field-error').forEach(el => (el.textContent = ''));
    document
      .querySelectorAll('.form-group input, .form-group select')
      .forEach(el => el.classList.remove('error'));

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

    if (!isAdult(birthDate) && parents.length === 0) {
      showToast('Клиент несовершеннолетний: добавьте хотя бы одного родителя.', 'info');
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
    const birth_date = document.getElementById('client-birthdate').value;
    const gender = document.getElementById('client-gender').value;
    const features = document.getElementById('client-features').value.trim() || '';

    const photo = photoInput.files[0] || '';

    const updatedParents = parents
      .filter(p => p.fullName.trim() !== '')
      .map(p => ({
        fullName: p.fullName.trim(),
        phone: p.phone,
        relation: p.relation
      }));

    const updatedDiagnoses = diagnoses
      .filter(d => d.name.trim() !== '')
      .map(d => ({
        name: d.name.trim(),
        notes: d.notes
      }));

    callback({
      surname,
      name,
      patronymic,
      phone,
      birth_date,
      gender,
      parents: updatedParents,
      diagnoses: updatedDiagnoses,
      features,
      photo,
      groups: client.groups || []
    });
    closeModal();
  });

  document.getElementById('client-cancel-btn').addEventListener('click', closeModal);

  setTimeout(() => document.getElementById('client-surname').focus(), 100);
}

export async function loadClients() {
  // Сначала синхронизируем справочники
  await syncDiagnoses();
  await syncRelations();

  // Затем загружаем из localStorage
  clientsData = JSON.parse(localStorage.getItem('clientsData')) || [];
  // Затем синхронизируем с сервером асинхронно
  syncClientsWithServer().then(updatedData => {
    clientsData = updatedData;
    if (typeof renderClients === 'function') renderClients();
  });

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
            <span class="stat-number">${clientsData.filter(c => c.subscriptions.some(s => s.isPaid && new Date(s.endDate) >= new Date())).length}</span>
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
    if (!client.subscriptions || client.subscriptions.length === 0) return 'no-subscription';
    if (client.blacklisted) return 'blacklisted';
    const hasActive = client.subscriptions.some(s => s.isPaid && new Date(s.endDate) >= new Date());
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
          return new Date(b.created_at || 0) - new Date(a.created_at || 0);
        case 'date-asc':
          return new Date(a.created_at || 0) - new Date(b.created_at || 0);
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
        console.log('Client photo URL in render:', client.photo ? client.photo.substring(0, 50) + '...' : 'null');
        const fullName = `${client.surname} ${client.name} ${client.patronymic || ''}`;
        const hasDiagnosis = client.diagnoses && client.diagnoses.length > 0 && !(client.diagnoses.length === 1 && client.diagnoses[0].name === 'Нет');
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

        const activeSub = client.subscriptions.find(s => s.isPaid && new Date(s.endDate) >= new Date());
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
                    ${client.diagnoses.map(d => `<span class="diagnosis-tag">${d.name}${d.notes ? ` (${d.notes})` : ''}</span>`).join('')}
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
    showClientForm('Добавить клиента', {}, async (data) => {
      await addClient(data);
      renderClients();
      showToast('Клиент успешно добавлен', 'success');
    });
  });

  clientList.addEventListener('click', async (e) => { // Добавляем async
    e.preventDefault(); // Добавляем preventDefault для предотвращения возможных проблем
    const target = e.target;
    const clientCard = target.closest('.client-card');
    const clientId = clientCard ? clientCard.getAttribute('data-id') : null;
    const client = clientsData.find(c => c.id === clientId);
    if (!client) return;

    const actionBtn = target.closest('.client-action-btn');
    if (actionBtn) {
      e.stopPropagation();

      if (actionBtn.classList.contains('edit-btn')) {
        showClientForm('Редактировать клиента', client, async (data) => {
          await updateClient(clientId, data);
          renderClients();
          showToast('Данные клиента обновлены', 'success');
        });
      } else if (actionBtn.classList.contains('blacklist-btn')) {
        client.blacklisted = !client.blacklisted;
        console.log('Blacklisted toggled to:', client.blacklisted); // Added for debugging
        await updateClient(clientId, client); // Теперь await работает корректно
        renderClients();
        showToast(client.blacklisted ? 'Клиент добавлен в чёрный список' : 'Клиент удалён из чёрного списка', 'info');
      } else if (actionBtn.classList.contains('subscription-btn')) {
        showSubscriptionManagement(client);
      } else if (actionBtn.classList.contains('group-btn')) {
        showGroupForm('Управление группами', client, getGroups(), async (groups, history) => {
          client.groups = groups;
          client.group_history = history;
          await updateClient(clientId, client);
          renderClients();
          showToast('Группы клиента обновлены', 'success');
        });
      } else if (actionBtn.classList.contains('delete-btn')) {
        showConfirmDialog(
          'Удалить клиента?',
          `Вы уверены, что хотите удалить клиента "${client.surname} ${client.name}"? Это действие нельзя отменить.`,
          async () => {
            await removeClient(clientId);
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
        <div class="details-header">
          <div class="client-avatar-large">
            ${client.photo ?
      `<img src="${client.photo}" class="client-photo-large" alt="${fullName}">` :
      `<div class="client-photo-placeholder-large">${client.name.charAt(0).toUpperCase()}</div>`
    }
          </div>
          <div class="client-title">
            <h2>${fullName}${client.blacklisted ? ' (В чёрном списке)' : ''}</h2>
            <span class="client-id">ID: ${client.id}</span>
          </div>
        </div>
        
        <div class="tabs">
          <button type="button" class="tab-button active" data-tab="main">Основная информация</button>
          <button type="button" class="tab-button" data-tab="groups-subs">Группы и абонементы</button>
        </div>
        
        <div class="tab-content active" id="tab-main">
          <div class="details-grid">
            <div class="detail-section">
              <h4>Контактная информация</h4>
              <div class="detail-item">
                <span class="detail-label">Телефон:</span>
                <span class="detail-value">${client.phone}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">Дата рождения:</span>
                <span class="detail-value">${client.birth_date || 'Не указана'}</span>
              </div>
              <div class="detail-item">
                <span class="detail-label">Пол:</span>
                <span class="detail-value">${client.gender === 'male' ? 'Мужской' : client.gender === 'female' ? 'Женский' : 'Не указан'}</span>
              </div>
              ${client.parents && client.parents.length > 0 ? `
                <div class="detail-item">
                  <span class="detail-label">Родители/опекуны:</span>
                  <div class="detail-value">
                    ${client.parents.map(p => `${p.full_name || ''} (${p.phone || ''})${p.relation_id ? ` - ${getRelationName(p.relation_id)}` : ''}`).join('<br>')}
                  </div>
                </div>
              ` : ''}
            </div>
            
            <div class="detail-section">
              <h4>Медицинская информация</h4>
              <div class="detail-item">
                <span class="detail-label">Диагнозы:</span>
                <div class="detail-value ${client.diagnoses && client.diagnoses.some(d => (d.name || getDiagnosisName(d.diagnosis_id)) !== 'Нет') ? 'has-diagnosis' : ''}">
                  ${client.diagnoses && client.diagnoses.length > 0 ?
      client.diagnoses.map(d => `${d.name || getDiagnosisName(d.diagnosis_id) || 'Неизвестный диагноз'}${d.notes ? ` (${d.notes})` : ''}`).join('<br>') : 'Нет'}
                </div>
              </div>
              ${client.features ? `
                <div class="detail-item">
                  <span class="detail-label">Особенности:</span>
                  <span class="detail-value">${client.features}</span>
                </div>
              ` : ''}
            </div>
            
            <div class="detail-section">
              <h4>Активность</h4>
              <div class="detail-item">
                <span class="detail-label">Дата регистрации:</span>
                <span class="detail-value">${formatDate(client.created_at)}</span>
              </div>
            </div>
          </div>
        </div>
        
        <div class="tab-content" id="tab-groups-subs">
          <div class="details-grid">
            <div class="detail-section">
              <h4>Группы</h4>
              <div class="detail-item">
                <span class="detail-label">Текущие группы:</span>
                <div class="groups-list">
                  ${Array.isArray(client.groups) && client.groups.length ?
      client.groups.map(group => `<span class="group-tag">${group}</span>`).join('') :
      '<span class="no-data">Не назначены</span>'
    }
                </div>
              </div>
              ${client.group_history && client.group_history.length ? `
                <div class="detail-item">
                  <span class="detail-label">История групп:</span>
                  <div class="renewal-history">
                    ${client.group_history.map(entry => `
                      <span class="renewal-entry">${formatDate(entry.date)}: ${entry.action === 'added' ? 'Добавлен в' : 'Удален из'} ${entry.group}</span>
                    `).join('')}
                  </div>
                </div>
              ` : ''}
            </div>
            
            <div class="detail-section">
              <h4>Абонементы</h4>
              ${client.subscriptions && client.subscriptions.length ? client.subscriptions.filter(s => s.isPaid && new Date(s.endDate) >= new Date()).map((sub, index) => {
      const template = getSubscriptionTemplates().find(t => t.id === sub.templateId);
      return `
                  <div class="subscription-item" data-sub-index="${index}">
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
                      <span class="detail-value">${sub.remainingClasses === Infinity ? 'Безлимит' : sub.remainingClasses}</span>
                    </div>
                    <div class="detail-item">
                      <span class="detail-label">Стоимость:</span>
                      <span class="detail-value">${sub.price ? sub.price + ' сум' : 'Не указана'}</span>
                    </div>
                  </div>
                `;
    }).join('') : `
                <div class="detail-item">
                  <span class="no-data">Абонементы не оформлены</span>
                </div>
              `}
            </div>
          </div>
        </div>
        
        <div class="client-details-actions">
          <button type="button" id="client-edit-details-btn" class="btn-secondary">Редактировать</button>
          <button type="button" id="client-close-btn" class="btn-secondary">Закрыть</button>
        </div>
      </div>
    `;

  document.getElementById('main-content').appendChild(modal);

  const tabButtons = modal.querySelectorAll('.tab-button');
  const tabContents = modal.querySelectorAll('.tab-content');

  tabButtons.forEach(button => {
    button.addEventListener('click', () => {
      tabButtons.forEach(btn => btn.classList.remove('active'));
      tabContents.forEach(content => content.classList.remove('active'));
      button.classList.add('active');
      modal.querySelector(`#tab-${button.dataset.tab}`).classList.add('active');
    });
  });

  setupModalClose(modal, () => modal.remove());

  const photo = modal.querySelector('.client-photo-large, .client-photo-placeholder-large');
  if (client.photo) {
    photo.addEventListener('click', () => {
      showPhotoZoomModal(client.photo);
    });
  }

  const editBtn = document.getElementById('client-edit-details-btn');
  if (editBtn) {
    editBtn.addEventListener('click', () => {
      modal.remove();
      showClientForm('Редактировать клиента', client, async (data) => {
        await updateClient(client.id, data);
        showToast('Данные клиента обновлены', 'success');
      });
    });
  }

  document.getElementById('client-close-btn').addEventListener('click', () => modal.remove());
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
    const filteredDiagnoses = commonDiagnoses.filter(d => d.name.toLowerCase().includes(filter.toLowerCase()));
    list.innerHTML = filteredDiagnoses.map(d => `
      <div class="diagnosis-item ${selectedDiagnosis?.id === d.id ? 'selected' : ''}" data-diagnosis-id="${d.id}" data-diagnosis-name="${d.name}">
        <span class="diagnosis-text">${d.name}</span>
        <button type="button" class="edit-diagnosis-btn" data-diagnosis-name="${d.name}">
          <img src="/images/icon-edit.svg" alt="Редактировать" class="btn-icon">
        </button>
        <button type="button" class="delete-diagnosis-btn" data-diagnosis-name="${d.name}">
          <img src="/images/trash.svg" alt="Удалить" class="btn-icon">
        </button>
      </div>
    `).join('');
    console.log('Список диагнозов отрисован с фильтром:', filter, 'Выбрано:', selectedDiagnosis);
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
    console.log('Закрытие модального окна диагнозов, selectedDiagnosis:', selectedDiagnosis);
    modal.remove();
    callback(null);
  };
  setupModalClose(modal, closeModal);

  modal.querySelector('.diagnosis-close').addEventListener('click', closeModal);
  modal.querySelector('#diagnosis-cancel-btn').addEventListener('click', closeModal);

  modal.querySelector('#diagnosis-select-btn').addEventListener('click', () => {
    console.log('Кнопка "Выбрать" нажата, selectedDiagnosis:', selectedDiagnosis);
    if (selectedDiagnosis) {
      modal.remove();
      callback(selectedDiagnosis.name);  // Возвращаем name для формы
    } else {
      showToast('Выберите диагноз', 'error');
    }
  });

  modal.querySelector('#add-new-diagnosis-btn').addEventListener('click', () => {
    const newDiagnosis = prompt('Введите новый диагноз:');
    if (newDiagnosis && newDiagnosis.trim() && !commonDiagnoses.some(d => d.name === newDiagnosis.trim())) {
      addDiagnosis(newDiagnosis.trim()).then(() => {
        renderDiagnosesList(modal.querySelector('#diagnosis-search').value);
        showToast('Новый диагноз добавлен', 'success');
      }).catch(err => {
        showToast('Ошибка при добавлении', 'error');
      });
    }
  });

  const list = modal.querySelector('.diagnoses-list');
  list.addEventListener('click', (e) => {
    const target = e.target.closest('button') || e.target; // Учитываем клик по img внутри button
    const diagnosisItem = target.closest('.diagnosis-item');
    if (!diagnosisItem) return;

    const name = diagnosisItem.dataset.diagnosisName;
    const id = diagnosisItem.dataset.diagnosisId;
    console.log('Клик по элементу диагноза:', name, 'ID:', id, 'Цель:', target.tagName, target.className);

    if (!target.classList.contains('edit-diagnosis-btn') && !target.classList.contains('delete-diagnosis-btn')) {
      selectedDiagnosis = { id, name };
      console.log('Выбран диагноз:', selectedDiagnosis);
      renderDiagnosesList(modal.querySelector('#diagnosis-search').value);
    } else if (target.classList.contains('edit-diagnosis-btn')) {
      const oldName = name;
      const newName = prompt('Введите новое название диагноза:', oldName);
      if (newName && newName.trim() && newName !== oldName) {
        updateDiagnosis(oldName, newName.trim()).then(() => {
          if (selectedDiagnosis && selectedDiagnosis.name === oldName) selectedDiagnosis.name = newName.trim();
          renderDiagnosesList(modal.querySelector('#diagnosis-search').value);
        }).catch(err => {
          showToast('Ошибка при обновлении', 'error');
        });
      }
    } else if (target.classList.contains('delete-diagnosis-btn')) {
      showConfirmDialog(
        'Удалить диагноз?',
        `Вы уверены, что хотите удалить диагноз "${name}"?`,
        () => {
          deleteDiagnosis(name).then(() => {
            if (selectedDiagnosis && selectedDiagnosis.name === name) selectedDiagnosis = null;
            renderDiagnosesList(modal.querySelector('#diagnosis-search').value);
          }).catch(err => {
            showToast('Ошибка при удалении', 'error');
          });
        }
      );
    }
  });

  let searchTimeout;
  const searchInput = modal.querySelector('#diagnosis-search');
  searchInput.addEventListener('input', (e) => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      renderDiagnosesList(e.target.value);
    }, 300);
  });

  renderDiagnosesList();
}

export function showRelationDictionary(callback) {
  const modal = document.createElement('div');
  modal.className = 'relation-dictionary-modal';
  let selectedRelation = null;

  function renderRelationsList(filter = '') {
    const list = modal.querySelector('.relations-list');
    const filteredRelations = commonRelations.filter(r => r.name.toLowerCase().includes(filter.toLowerCase()));
    list.innerHTML = filteredRelations.map(r => `
      <div class="relation-item ${selectedRelation?.id === r.id ? 'selected' : ''}" data-relation-id="${r.id}" data-relation-name="${r.name}">
        <span class="relation-text">${r.name}</span>
        <button type="button" class="edit-relation-btn" data-relation-name="${r.name}">
          <img src="/images/icon-edit.svg" alt="Редактировать" class="btn-icon">
        </button>
        <button type="button" class="delete-relation-btn" data-relation-name="${r.name}">
          <img src="/images/trash.svg" alt="Удалить" class="btn-icon">
        </button>
      </div>
    `).join('');
    console.log('Список отношений отрисован с фильтром:', filter, 'Выбрано:', selectedRelation);
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
    console.log('Закрытие модального окна отношений, selectedRelation:', selectedRelation);
    modal.remove();
    callback(null);
  };
  setupModalClose(modal, closeModal);

  modal.querySelector('.relation-close').addEventListener('click', closeModal);
  modal.querySelector('#relation-cancel-btn').addEventListener('click', closeModal);

  modal.querySelector('#relation-select-btn').addEventListener('click', () => {
    console.log('Кнопка "Выбрать" нажата, selectedRelation:', selectedRelation);
    if (selectedRelation) {
      modal.remove();
      callback(selectedRelation.name);  // Возвращаем name для формы
    } else {
      showToast('Выберите отношение', 'error');
    }
  });

  modal.querySelector('#add-new-relation-btn').addEventListener('click', () => {
    const newRelation = prompt('Введите новое отношение:');
    if (newRelation && newRelation.trim() && !commonRelations.some(r => r.name === newRelation.trim())) {
      addRelation(newRelation.trim()).then(() => {
        renderRelationsList(modal.querySelector('#relation-search').value);
        showToast('Новое отношение добавлено', 'success');
      }).catch(err => {
        showToast('Ошибка при добавлении', 'error');
      });
    }
  });

  const list = modal.querySelector('.relations-list');
  list.addEventListener('click', (e) => {
    const target = e.target.closest('button') || e.target; // Учитываем клик по img внутри button
    const relationItem = target.closest('.relation-item');
    if (!relationItem) return;

    const name = relationItem.dataset.relationName;
    const id = relationItem.dataset.relationId;
    console.log('Клик по элементу отношения:', name, 'ID:', id, 'Цель:', target.tagName, target.className);

    if (!target.classList.contains('edit-relation-btn') && !target.classList.contains('delete-relation-btn')) {
      selectedRelation = { id, name };
      console.log('Выбрано отношение:', selectedRelation);
      renderRelationsList(modal.querySelector('#relation-search').value);
    } else if (target.classList.contains('edit-relation-btn')) {
      const oldName = name;
      const newName = prompt('Введите новое название отношения:', oldName);
      if (newName && newName.trim() && newName !== oldName) {
        updateRelation(oldName, newName.trim()).then(() => {
          if (selectedRelation && selectedRelation.name === oldName) selectedRelation.name = newName.trim();
          renderRelationsList(modal.querySelector('#relation-search').value);
        }).catch(err => {
          showToast('Ошибка при обновлении', 'error');
        });
      }
    } else if (target.classList.contains('delete-relation-btn')) {
      showConfirmDialog(
        'Удалить отношение?',
        `Вы уверены, что хотите удалить отношение "${name}"?`,
        () => {
          deleteRelation(name).then(() => {
            if (selectedRelation && selectedRelation.name === name) selectedRelation = null;
            renderRelationsList(modal.querySelector('#relation-search').value);
          }).catch(err => {
            showToast('Ошибка при удалении', 'error');
          });
        }
      );
    }
  });

  let searchTimeout;
  const searchInput = modal.querySelector('#relation-search');
  searchInput.addEventListener('input', (e) => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      renderRelationsList(e.target.value);
    }, 300);
  });

  renderRelationsList();
}

export function showSubscriptionManagement(client) {
  const fullName = `${client.surname} ${client.name} ${client.patronymic || ''}`;
  const modal = document.createElement('div');
  modal.className = 'subscription-management-modal';
  modal.innerHTML = `
  <div class="subscription-management-content">
    <div class="subscription-management-header">
      <h2>Абонементы: ${fullName}</h2>
      <button type="button" class="subscription-management-close">×</button>
    </div>
    
    <div class="subscription-management-body">
      <div class="subscription-history-section">
        <h3>История</h3>
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
            ${client.subscriptions.length ? client.subscriptions.map((sub, index) => {
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
      
      <div class="active-subscription-section">
        <h3>Текущий</h3>
        ${client.subscriptions.find(s => s.isPaid && new Date(s.endDate) >= new Date()) ? (() => {
      const sub = client.subscriptions.find(s => s.isPaid && new Date(s.endDate) >= new Date());
      const template = getSubscriptionTemplates().find(t => t.id === sub.templateId);
      return `
          <div class="subscription-item active-sub">
            <div class="detail-item">
              <span class="detail-label">№:</span>
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
              <span class="detail-label">Занятий:</span>
              <span class="detail-value">${sub.remainingClasses === Infinity ? '∞' : sub.remainingClasses}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Стоимость:</span>
              <span class="detail-value">${sub.price ? sub.price + ' сум' : 'Не указана'}</span>
            </div>
            <button type="button" class="btn-primary renew-sub-btn" data-sub-index="${client.subscriptions.indexOf(sub)}">Продлить</button>
          </div>
        `;
    })() : `
        <div class="detail-item">
          <span class="no-data">Нет активного абонемента</span>
        </div>
      `}
      <button type="button" class="btn-primary new-sub-btn">Новый</button>
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
      const sub = client.subscriptions[index];
      showRenewSubscriptionForm('Продление абонемента', client, sub, async (data) => {
        client.subscriptions[index] = { ...sub, ...data };
        await updateClient(client.id, client);
        modal.remove();
        if (typeof renderClients === 'function') renderClients();
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
      price: 0,
      isPaid: true,
      renewalHistory: [],
      subscriptionNumber: generateUniqueSubscriptionNumber(client),
      clientId: client.id
    };
    showSubscriptionForm('Новый абонемент', newSub, [client], getGroups(), async (data) => {
      const template = getSubscriptionTemplates().find(t => t.id === data.templateId);
      client.subscriptions.push({
        ...data,
        remainingClasses: template ? template.remainingClasses : data.remainingClasses || 0
      });
      await updateClient(client.id, client);
      modal.remove();
      if (typeof renderClients === 'function') renderClients();
      showToast('Новый абонемент создан', 'success');
    });
  });
}

export async function showSubscriptionForm(title, sub, clients, groups, callback) {
  const modal = document.createElement('div');
  modal.className = 'subscription-form-modal';
  let templates;
  try {
    templates = await getSubscriptionTemplates(); // Ждём результат, если функция асинхронная
    if (!Array.isArray(templates)) {
      console.error('getSubscriptionTemplates не вернул массив:', templates);
      templates = [];
    }
  } catch (error) {
    console.error('Ошибка при загрузке шаблонов абонементов:', error);
    templates = [];
    showToast('Не удалось загрузить шаблоны абонементов', 'error');
  }

  // Проверяем, что groups — массив, иначе используем пустой массив
  const validGroups = Array.isArray(groups) ? groups : [];
  if (!Array.isArray(groups)) {
    console.error('Параметр groups не является массивом:', groups);
    showToast('Группы недоступны, используется пустой список', 'warning');
  }

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
              <option value="${sub.clientId}">${clients.find(c => c.id === sub.clientId).name}</option>
            </select>
          </div>
          <div class="form-group">
            <label for="subscription-template" class="required">Тип абонемента</label>
            <select id="subscription-template" required>
              <option value="">Выберите тип абонемента</option>
              ${templates.map(template => `
                <option value="${template.id}" ${sub.templateId === template.id ? 'selected' : ''}>
                  ${template.type}
                </option>
              `).join('')}
            </select>
          </div>
          <div class="form-group">
            <label for="subscription-classes-per-week" class="required">Занятий в неделю</label>
            <input type="number" id="subscription-classes-per-week" 
                  value="${sub.classesPerWeek || ''}" 
                  min="0" max="7" required>
          </div>
          <div class="form-group">
            <label for="subscription-class-time" class="required">Время занятия</label>
            <input type="time" id="subscription-class-time" 
                  value="${sub.classTime || '09:00'}" required>
          </div>
          <div class="form-group">
            <label for="subscription-start-date" class="required">Дата начала</label>
            <input type="date" id="subscription-start-date" 
                  value="${sub.startDate || ''}" required>
          </div>
          <div class="form-group">
            <label for="subscription-end-date" class="required">Дата окончания</label>
            <input type="date" id="subscription-end-date" 
                  value="${sub.endDate || ''}" required>
          </div>
          <div class="form-group full-width">
            <label>Дни недели занятий</label>
            <div class="days-of-week-selector">
              ${['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map(day => `
                <button type="button" class="day-button${sub.daysOfWeek?.includes(day) ? ' selected' : ''}" 
                        data-day="${day}">${day}</button>
              `).join('')}
            </div>
          </div>
          <div class="form-group">
            <label for="subscription-group">Группа (опционально)</label>
            <select id="subscription-group">
              <option value="">Без привязки к группе</option>
              ${validGroups.map(group => `
                <option value="${group}" ${sub.group === group ? 'selected' : ''}>${group}</option>
              `).join('')}
            </select>
          </div>
          <div class="form-group">
            <label class="checkbox-label">
              <input type="checkbox" id="subscription-is-paid" ${sub.isPaid !== false ? 'checked' : ''}>
              <span class="checkmark"></span>
              Абонемент оплачен
            </label>
            <small class="field-hint">Влияет на активность абонемента</small>
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
  dayButtons.forEach(button => {
    button.addEventListener('click', () => {
      button.classList.toggle('selected');
    });
  });

  const startDateInput = document.getElementById('subscription-start-date');
  const endDateInput = document.getElementById('subscription-end-date');

  startDateInput.addEventListener('change', () => {
    if (startDateInput.value && !endDateInput.value) {
      const startDate = new Date(startDateInput.value);
      startDate.setDate(startDate.getDate() + 30);
      endDateInput.value = startDate.toISOString().split('T')[0];
    }
  });

  document.getElementById('subscription-save-btn').addEventListener('click', () => {
    const clientId = sub.clientId;
    const templateId = document.getElementById('subscription-template').value;
    const classesPerWeek = parseInt(document.getElementById('subscription-classes-per-week').value);
    const daysOfWeek = Array.from(modal.querySelectorAll('.day-button.selected'))
      .map(button => button.getAttribute('data-day'));
    const startDate = document.getElementById('subscription-start-date').value;
    const endDate = document.getElementById('subscription-end-date').value;
    const classTime = document.getElementById('subscription-class-time').value;
    const group = document.getElementById('subscription-group').value;
    const isPaid = document.getElementById('subscription-is-paid').checked;

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

    callback({
      clientId,
      templateId,
      startDate,
      endDate,
      classesPerWeek,
      daysOfWeek,
      classTime,
      group,
      isPaid,
      renewalHistory: sub.renewalHistory || [],
      subscriptionNumber: sub.subscriptionNumber
    });

    closeModal();

    const subscriptionManagementModal = document.querySelector('.subscription-management-modal');
    if (subscriptionManagementModal) {
      const client = clients.find(c => c.id === sub.clientId);
      subscriptionManagementModal.remove();
      showSubscriptionManagement(client);
    }
  });

  document.getElementById('subscription-cancel-btn').addEventListener('click', closeModal);
}

export function showRenewSubscriptionForm(title, client, sub, callback) {
  const subscriptionTemplate = getSubscriptionTemplates().find(t => t.id === sub.templateId);
  const defaultEndDate = new Date(Math.max(new Date(), new Date(sub.endDate)));
  defaultEndDate.setDate(defaultEndDate.getDate() + 30);

  const modal = document.createElement('div');
  modal.className = 'renew-subscription-modal';
  modal.innerHTML = `
  <div class="renew-subscription-content">
    <div class="renew-header">
      <h2>${title}</h2>
      <button type="button" class="renew-close">×</button>
    </div>
    <div class="renew-body">
      <div class="current-subscription-info">
        <h3><img src="images/icon-subscription-info.svg" alt="Текущий абонемент" class="icon"> Текущий абонемент</h3>
        <div class="info-grid">
          <div class="info-item">
            <span class="label">Клиент:</span>
            <span class="value">${client.surname} ${client.name}</span>
          </div>
          <div class="info-item">
            <span class="label">Номер абонемента:</span>
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
            <span class="value ${sub.remainingClasses <= 3 && sub.remainingClasses !== Infinity ? 'low-classes' : ''}">
              ${sub.remainingClasses === Infinity ? '∞' : sub.remainingClasses}
            </span>
          </div>
          <div class="info-item">
            <span class="label">Статус:</span>
            <span class="value status-${sub.isPaid && new Date(sub.endDate) >= new Date() ? 'active' : 'inactive'}">
              ${sub.isPaid && new Date(sub.endDate) >= new Date() ? 'Активный' : 'Неактивный'}
            </span>
          </div>
        </div>
        ${sub.renewalHistory && sub.renewalHistory.length ? `
          <div class="renewal-history-section">
            <h4>История продлений:</h4>
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
      
      <div class="renew-form-section">
        <h3><img src="images/icon-renew.svg" alt="Продление" class="icon"> Продление</h3>
        <div class="form-grid">
          <div class="form-group">
            <label for="renew-template" class="required">Тип абонемента</label>
            <select id="renew-template" required>
              <option value="">Выберите тип абонемента</option>
              ${getSubscriptionTemplates().map(template => `
                <option value="${template.id}" ${sub.templateId === template.id ? 'selected' : ''}>
                  ${template.type}
                </option>
              `).join('')}
            </select>
          </div>
          <div class="form-group">
            <label for="renew-classes-per-week" class="required">Занятий в неделю</label>
            <input type="number" id="renew-classes-per-week" 
                  value="${sub.classesPerWeek || ''}" 
                  min="0" max="7" required>
          </div>
          <div class="form-group">
            <label for="renew-class-time" class="required">Время занятия</label>
            <input type="time" id="renew-class-time" 
                  value="${sub.classTime || '09:00'}" required>
          </div>
          <div class="form-group">
            <label for="renew-start-date" class="required">Дата начала</label>
            <input type="date" id="renew-start-date" 
                  value="${sub.startDate || ''}" required>
          </div>
          <div class="form-group">
            <label for="renew-end-date" class="required">Дата окончания</label>
            <input type="date" id="renew-end-date" 
                  value="${defaultEndDate.toISOString().split('T')[0]}" required>
          </div>
          <div class="form-group full-width">
            <label>Дни недели занятий</label>
            <div class="days-of-week-selector">
              ${['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map(day => `
                <button type="button" class="day-button${sub.daysOfWeek?.includes(day) ? ' selected' : ''}" 
                        data-day="${day}">${day}</button>
              `).join('')}
            </div>
          </div>
          <div class="form-group">
            <label for="renew-group">Группа (опционально)</label>
            <select id="renew-group">
              <option value="">Без привязки к группе</option>
              ${getGroups().map(group => `
                <option value="${group}" ${sub.group === group ? 'selected' : ''}>${group}</option>
              `).join('')}
            </select>
          </div>
          <div class="form-group">
            <label class="checkbox-label">
              <input type="checkbox" id="renew-is-paid" ${sub.isPaid !== false ? 'checked' : ''}>
              <span class="checkmark"></span>
              Абонемент оплачен
            </label>
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
      subscriptionNumber: sub.subscriptionNumber,
      remainingClasses: template ? template.remainingClasses : sub.remainingClasses,
      renewalHistory: [...(sub.renewalHistory || []), renewalEntry]
    });

    closeModal();
  });
}

// Функция для отображения формы управления группами клиента
export function showGroupForm(title, client, groups, callback) {
  console.log(`showGroupForm: клиент=${client.id}, группы=`, groups);

  // Создаем модальное окно
  const modal = document.createElement('div');
  modal.className = 'group-form-modal';

  // Копия текущих групп клиента
  let selectedGroups = [...(client.groups || [])];

  // Копия истории групп с преобразованием дат в формат YYYY-MM-DD
  let groupHistory = Array.isArray(client.group_history)
    ? client.group_history.map(entry => ({
      ...entry,
      date: entry.date.split('T')[0] // Удаляем временную часть
    }))
    : [];

  // Проверяем, что groups — это массив, если нет — устанавливаем пустой массив
  const validGroups = Array.isArray(groups) ? groups : [];
  if (!Array.isArray(groups)) {
    console.warn('Параметр groups не является массивом:', groups);
    showToast('Группы недоступны, отображается пустой список.', 'warning');
  }

  // Функция для форматирования даты
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

  // Функция для рендеринга истории групп
  function renderGroupHistory() {
    const historyContainer = modal.querySelector('.group-history-container');
    historyContainer.innerHTML = `
      <h3>История групп</h3>
      ${groupHistory.length ? `
        <table class="group-history-table">
          <thead>
            <tr>
              <th>Дата</th>
              <th>Действие</th>
              <th>Группа</th>
            </tr>
          </thead>
          <tbody>
            ${groupHistory.map(entry => `
              <tr>
                <td>${formatDate(entry.date)}</td>
                <td>${entry.action === 'added' ? 'Добавлен' : 'Удалён'}</td>
                <td>${entry.group}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      ` : `
        <div class="no-data">Нет истории групп</div>
      `}
    `;
  }

  // Функция для рендеринга списка групп
  function renderGroups(searchTerm = '') {
    const groupList = modal.querySelector('.groups-list');
    const filteredGroups = validGroups
      .filter(group => group.toLowerCase().includes(searchTerm.toLowerCase()))
      .sort((a, b) => a.localeCompare(b));

    groupList.innerHTML = `
      <table class="group-selection-table">
        <thead>
          <tr>
            <th><input type="checkbox" id="select-all-groups"></th>
            <th>Название группы</th>
            <th>Дата начала</th>
          </tr>
        </thead>
        <tbody>
          ${filteredGroups.length ? filteredGroups.map(group => {
      const isSelected = selectedGroups.includes(group);
      const historyEntry = groupHistory.find(entry => entry.group === group && entry.action === 'added');
      const startDate = historyEntry ? historyEntry.date.split('T')[0] : new Date().toISOString().split('T')[0];
      return `
              <tr class="group-row" data-group="${group}">
                <td><input type="checkbox" value="${group}" ${isSelected ? 'checked' : ''}></td>
                <td>${group}</td>
                <td><input type="date" class="start-date-input" value="${isSelected ? startDate : ''}" ${!isSelected ? 'disabled' : ''}></td>
              </tr>
            `;
    }).join('') : `
            <tr>
              <td colspan="3" class="no-data">Нет доступных групп</td>
            </tr>
          `}
        </tbody>
      </table>
    `;

    // Обработка чекбокса "Выбрать все"
    const selectAllCheckbox = modal.querySelector('#select-all-groups');
    const checkboxes = modal.querySelectorAll('.group-row input[type="checkbox"]');
    const allChecked = Array.from(checkboxes).every(cb => cb.checked);
    const someChecked = Array.from(checkboxes).some(cb => cb.checked);
    selectAllCheckbox.checked = allChecked;
    selectAllCheckbox.indeterminate = someChecked && !allChecked;

    selectAllCheckbox.addEventListener('change', (e) => {
      const checked = e.target.checked;
      checkboxes.forEach(cb => {
        cb.checked = checked;
        const row = cb.closest('.group-row');
        const group = cb.value;
        const dateInput = row.querySelector('.start-date-input');
        dateInput.disabled = !checked;
        if (checked && !selectedGroups.includes(group)) {
          showDateSelectionModal('Дата начала участия в группе', (startDate) => {
            if (startDate) {
              selectedGroups.push(group);
              groupHistory.push({ date: startDate, action: 'added', group });
              addClientToGroup(client.id, group, startDate);
              dateInput.value = startDate;
              dateInput.disabled = false;
              renderGroupHistory();
              showToast(`Клиент добавлен в группу ${group} с ${formatDate(startDate)}`, 'success');
            } else {
              cb.checked = false;
              dateInput.disabled = true;
            }
            renderGroups(searchTerm);
          });
        } else if (!checked) {
          selectedGroups = selectedGroups.filter(g => g !== group);
          groupHistory.push({ date: new Date().toISOString().split('T')[0], action: 'removed', group });
          removeClientFromGroup(client.id, group);
          dateInput.disabled = true;
          renderGroupHistory();
        }
      });
      renderGroups(searchTerm);
    });

    // Обработка отдельных чекбоксов
    groupList.querySelectorAll('.group-row input[type="checkbox"]').forEach(checkbox => {
      checkbox.addEventListener('change', (e) => {
        const group = e.target.value;
        const row = e.target.closest('.group-row');
        const dateInput = row.querySelector('.start-date-input');
        if (e.target.checked) {
          if (!selectedGroups.includes(group)) {
            showDateSelectionModal('Дата начала участия в группе', (startDate) => {
              if (startDate) {
                selectedGroups.push(group);
                groupHistory.push({ date: startDate, action: 'added', group });
                addClientToGroup(client.id, group, startDate);
                dateInput.value = startDate;
                dateInput.disabled = false;
                renderGroupHistory();
                showToast(`Клиент добавлен в группу ${group} с ${formatDate(startDate)}`, 'success');
              } else {
                e.target.checked = false;
                dateInput.disabled = true;
                renderGroups(searchTerm);
              }
            });
          }
        } else {
          selectedGroups = selectedGroups.filter(g => g !== group);
          groupHistory.push({ date: new Date().toISOString().split('T')[0], action: 'removed', group });
          removeClientFromGroup(client.id, group);
          dateInput.disabled = true;
          renderGroupHistory();
        }
        renderGroups(searchTerm);
      });
    });

    // Обработка изменения даты
    groupList.querySelectorAll('.start-date-input').forEach(input => {
      input.addEventListener('change', (e) => {
        const group = e.target.closest('.group-row').dataset.group;
        const existingEntry = groupHistory.find(entry => entry.group === group && entry.action === 'added');
        if (existingEntry) {
          existingEntry.date = e.target.value;
        } else {
          groupHistory.push({ date: e.target.value, action: 'added', group });
        }
        addClientToGroup(client.id, group, e.target.value);
        renderGroupHistory();
      });
    });
  }

  // HTML-структура модального окна
  modal.innerHTML = `
    <div class="group-form-content">
      <div class="group-form-header">
        <h2>${title}</h2>
        <button type="button" class="group-form-close">×</button>
      </div>
      <div class="group-form-body split-layout">
        <div class="group-history-section">
          <div class="group-history-container"></div>
        </div>
        <div class="group-selection-section">
          <div class="client-info">
            <span>Клиент: ${client.surname} ${client.name}</span>
          </div>
          <div class="group-search-container">
            <input type="text" id="group-search" placeholder="Поиск группы...">
          </div>
          <div class="groups-list-container">
            <div class="groups-list"></div>
          </div>
        </div>
      </div>
      <div class="group-form-footer">
        <button type="button" id="group-cancel-btn" class="btn-secondary">Отмена</button>
        <button type="button" id="group-save-btn" class="btn-primary">Сохранить</button>
      </div>
    </div>
  `;

  // Добавляем модальное окно в DOM
  document.getElementById('main-content').appendChild(modal);

  // Функция для закрытия модального окна
  const closeModal = () => modal.remove();
  setupModalClose(modal, closeModal);

  // Обработчики кнопок
  modal.querySelector('.group-form-close').addEventListener('click', closeModal);
  modal.querySelector('#group-cancel-btn').addEventListener('click', closeModal);

  // Обработчик поиска
  const searchInput = modal.querySelector('#group-search');
  searchInput.addEventListener('input', (e) => {
    renderGroups(e.target.value);
  });

  // Обработчик сохранения
  modal.querySelector('#group-save-btn').addEventListener('click', () => {
    console.log(`Сохранение групп для клиента ${client.id}:`, selectedGroups);
    const finalGroups = selectedGroups.map(group => {
      const historyEntry = groupHistory.find(entry => entry.group === group && entry.action === 'added');
      return { name: group, startDate: historyEntry ? historyEntry.date : new Date().toISOString().split('T')[0] };
    });
    callback(finalGroups.map(g => g.name), groupHistory);
    if (typeof renderClients === 'function') {
      renderClients();
    }
    closeModal();
  });

  // Функция для отображения модального окна выбора даты
  function showDateSelectionModal(title, callback) {
    const dateModal = document.createElement('div');
    dateModal.className = 'date-modal';
    dateModal.innerHTML = `
      <div class="date-modal-content">
        <h2>${title}</h2>
        <input type="date" id="start-date-input" required>
        <div class="date-modal-actions">
          <button class="btn-primary" id="date-confirm-btn">Подтвердить</button>
          <button class="btn-secondary" id="date-cancel-btn">Отмена</button>
        </div>
      </div>
    `;
    document.body.appendChild(dateModal);

    const input = dateModal.querySelector('#start-date-input');
    input.value = new Date().toISOString().split('T')[0];

    dateModal.querySelector('#date-confirm-btn').addEventListener('click', () => {
      if (input.value) {
        callback(input.value);
        dateModal.remove();
      } else {
        showToast('Выберите дату!', 'error');
      }
    });

    dateModal.querySelector('#date-cancel-btn').addEventListener('click', () => {
      callback(null);
      dateModal.remove();
    });

    dateModal.addEventListener('click', (e) => {
      if (e.target === dateModal) {
        callback(null);
        dateModal.remove();
      }
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        callback(null);
        dateModal.remove();
      }
    }, { once: true });
  }

  // Инициализация рендеринга
  renderGroupHistory();
  renderGroups();
}
