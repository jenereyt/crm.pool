document.addEventListener('DOMContentLoaded', () => {
  const sidebar = document.getElementById('sidebar');
  const sidebarNav = document.getElementById('sidebar-nav');
  const toggleButton = document.querySelector('.sidebar-toggle');
  const mainContent = document.getElementById('main-content');

  // Тестовые данные менеджера
  if (!localStorage.getItem('user_manager1')) {
    localStorage.setItem('user_manager1', JSON.stringify({ password: 'manager123', role: 'manager' }));
  }

  // Получаем роль из localStorage
  let userRole = localStorage.getItem('userRole');

  // Скрываем сайдбар до авторизации
  sidebar.style.display = userRole ? 'block' : 'none';

  // Если не залогинен, загрузить авторизацию
  if (!userRole) {
    import('./auth.js').then(({ loadAuth }) => loadAuth());
    return;
  }

  // После авторизации загружаем главную страницу
  import('./main.js').then(({ loadHome }) => loadHome());

  // Меню items
  const menuItems = [
    { id: 'home', icon: './images/icon-home.svg', label: 'Главная' },
    { id: 'clients', icon: './images/icon-clients.svg', label: 'Клиенты' },
    { id: 'subscriptions', icon: './images/icon-subscriptions.svg', label: 'Абонементы' },
    { id: 'schedule', icon: './images/icon-schedule.svg', label: 'Расписание' },
    { id: 'rooms', icon: './images/icon-rooms.svg', label: 'Залы' },
    { id: 'groups', icon: './images/icon-group.svg', label: 'Группы' },
    { id: 'classes', icon: './images/icon-classes.svg', label: 'Занятия' },
  ];

  // Добавляем employees и reports только для менеджера
  if (userRole === 'manager') {
    menuItems.splice(5, 0, { id: 'employees', icon: './images/icon-employees.svg', label: 'Сотрудники' });
    menuItems.push({ id: 'reports', icon: './images/icon-reports.svg', label: 'Отчеты' });
  }

  // Добавляем профиль в конец
  menuItems.push({ id: 'profile', icon: './images/icon-profile.svg', label: 'Профиль' });

  sidebarNav.innerHTML = `
    <ul>
      ${menuItems.map(item => `
        <li class="${item.id === 'profile' ? 'profile-item' : ''}">
          <a href="#${item.id}" class="sidebar-link" data-section="${item.id}">
            <img src="${item.icon}" alt="${item.label}" class="sidebar-icon">
            <span>${item.label}</span>
          </a>
        </li>
      `).join('')}
    </ul>
  `;

  // Функция для обновления состояния сайдбара
  function updateSidebarState() {
    const isMobile = window.innerWidth <= 768;
    if (isMobile) {
      sidebar.classList.add('closed');
      sidebar.classList.remove('open');
      mainContent.classList.add('sidebar-closed');
      mainContent.classList.remove('sidebar-open');
    } else {
      sidebar.classList.remove('closed');
      sidebar.classList.add('open');
      mainContent.classList.add('sidebar-open');
      mainContent.classList.remove('sidebar-closed');
    }
  }

  updateSidebarState();
  window.addEventListener('resize', updateSidebarState);

  // Обработчик кликов в меню
  sidebarNav.addEventListener('click', (e) => {
    const link = e.target.closest('.sidebar-link');
    if (link) {
      const section = link.getAttribute('data-section');
      mainContent.innerHTML = '';

      if (section === 'home') {
        import('./main.js').then(({ loadHome }) => loadHome());
      } else if (section === 'clients') {
        import('./clients.js').then(({ loadClients }) => loadClients(userRole));
      } else if (section === 'subscriptions') {
        import('./subscriptions.js').then(({ loadSubscriptions }) => loadSubscriptions());
      } else if (section === 'schedule') {
        import('./schedule.js').then(({ loadSchedule }) => loadSchedule());
      } else if (section === 'rooms') {
        import('./rooms.js').then(({ loadRooms }) => loadRooms());
      } else if (section === 'employees' && userRole === 'manager') {
        import('./employees.js').then(({ loadEmployees }) => loadEmployees());
      } else if (section === 'groups') {
        import('./groups.js').then(({ loadGroups }) => loadGroups());
      } else if (section === 'classes') {
        import('./classes.js').then(({ loadClasses }) => loadClasses());
      } else if (section === 'reports' && userRole === 'manager') {
        mainContent.innerHTML = '<h1>Отчеты (в разработке)</h1>';
      } else if (section === 'profile') {
        import('./profile.js').then(({ loadProfile }) => loadProfile(userRole));
      }
    }
  });

  toggleButton.addEventListener('click', () => {
    sidebar.classList.toggle('closed');
    sidebar.classList.toggle('open');
    mainContent.classList.toggle('sidebar-closed');
    mainContent.classList.toggle('sidebar-open');
  });
});
