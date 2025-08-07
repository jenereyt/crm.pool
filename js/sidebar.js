document.addEventListener('DOMContentLoaded', () => {
  const sidebar = document.getElementById('sidebar');
  const sidebarNav = document.getElementById('sidebar-nav');
  const toggleButton = document.querySelector('.sidebar-toggle');
  const mainContent = document.getElementById('main-content');

  const userRole = 'manager'; // или 'admin'

  const menuItems = [
    { id: 'home', icon: './images/icon-home.svg', label: 'Главная' },
    { id: 'clients', icon: './images/icon-clients.svg', label: 'Клиенты' },
    { id: 'subscriptions', icon: './images/icon-subscriptions.svg', label: 'Абонементы' },
    { id: 'schedule', icon: './images/icon-schedule.svg', label: 'Расписание' },
    { id: 'rooms', icon: './images/icon-rooms.svg', label: 'Залы' },
    { id: 'employees', icon: './images/icon-employees.svg', label: 'Сотрудники' },
    { id: 'groups', icon: './images/icon-group.svg', label: 'Группы' },
    { id: 'classes', icon: './images/icon-classes.svg', label: 'Занятия' },
  ];

  if (userRole === 'manager') {
    menuItems.push({ id: 'reports', icon: './images/icon-reports.svg', label: 'Отчеты' });
  }

  sidebarNav.innerHTML = `
    <ul>
      ${menuItems.map(item => `
        <li>
          <a href="#${item.id}" class="sidebar-link" data-section="${item.id}">
            <img src="${item.icon}" alt="${item.label}" class="sidebar-icon">
            <span>${item.label}</span>
          </a>
        </li>
      `).join('')}
    </ul>
  `;

  sidebarNav.addEventListener('click', (e) => {
    const link = e.target.closest('.sidebar-link');
    if (link) {
      const section = link.getAttribute('data-section');
      const mainContent = document.getElementById('main-content');
      mainContent.innerHTML = '';

      if (section === 'home') {
        import('./main.js').then(({ loadHome }) => loadHome());
      } else if (section === 'clients') {
        import('./clients.js').then(({ loadClients }) => loadClients());
      } else if (section === 'subscriptions') {
        import('./subscriptions.js').then(({ loadSubscriptions }) => loadSubscriptions());
      } else if (section === 'schedule') {
        import('./schedule.js').then(({ loadSchedule }) => loadSchedule());
      } else if (section === 'rooms') {
        import('./rooms.js').then(({ loadRooms }) => loadRooms());
      } else if (section === 'employees') {
        import('./employees.js').then(({ loadEmployees }) => loadEmployees());
      } else if (section === 'groups') {
        import('./groups.js').then(({ loadGroups }) => loadGroups());
      } else if (section === 'classes') {
        import('./classes.js').then(({ loadClasses }) => loadClasses());
      } else if (section === 'reports' && userRole === 'manager') {
        mainContent.innerHTML = '<h1>Отчеты (в разработке)</h1>';
      }
    }
  });

  toggleButton.addEventListener('click', () => {
    sidebar.classList.toggle('closed');
    mainContent.classList.toggle('sidebar-closed');
    mainContent.classList.toggle('sidebar-open');
  });

  if (sidebar.classList.contains('closed')) {
    mainContent.classList.add('sidebar-closed');
    mainContent.classList.remove('sidebar-open');
  } else {
    mainContent.classList.add('sidebar-open');
    mainContent.classList.remove('sidebar-closed');
  }
});