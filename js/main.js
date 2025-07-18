export function loadHome() {
  const mainContent = document.getElementById('main-content');
  mainContent.innerHTML = '';

  const header = document.createElement('header');
  header.className = 'header';
  header.innerHTML = `
    <h1>Главная</h1>
    <div class="user-actions">
      <span>Пользователь</span>
      <button>Выход</button>
    </div>
  `;
  mainContent.appendChild(header);

  const filterBar = document.createElement('div');
  filterBar.className = 'filter-bar';
  filterBar.innerHTML = `
    <input type="text" placeholder="Поиск клиентов" class="filter-input" id="home-filter-input">
    <select class="filter-select" id="home-filter-select">
      <option value="">Залы</option>
      <option value="hall1">Зал 1</option>
      <option value="hall2">Зал 2</option>
      <option value="hall3">Зал 3</option>
    </select>
  `;
  mainContent.appendChild(filterBar);

  const contentBlocks = document.createElement('div');
  contentBlocks.className = 'content-blocks';
  const blocks = [
    { id: 'block1', class: 'content-block', label: 'Блок 1' },
    { id: 'block2', class: 'content-block', label: 'Блок 2' },
    { id: 'block3', class: 'content-block', label: 'Блок 3' },
    { id: 'large', class: 'large-block', label: 'Большой блок' },
  ];
  contentBlocks.innerHTML = blocks.map(block => `
    <div class="${block.class}" id="${block.id}">
      ${block.label}
    </div>
  `).join('');
  mainContent.appendChild(contentBlocks);

  const filterInput = document.getElementById('home-filter-input');
  const filterSelect = document.getElementById('home-filter-select');
  filterInput.addEventListener('input', filterBlocks);
  filterSelect.addEventListener('change', filterBlocks);

  function filterBlocks() {
    const searchTerm = filterInput.value.toLowerCase();
    const hall = filterSelect.value;
    const blocks = contentBlocks.querySelectorAll('.content-block, .large-block');
    blocks.forEach(block => {
      const label = block.textContent.toLowerCase();
      block.classList.toggle('hidden', (searchTerm && !label.includes(searchTerm)) || (hall && !label.includes(hall)));
    });
  }
}