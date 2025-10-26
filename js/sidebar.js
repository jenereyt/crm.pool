// sidebar.js
document.addEventListener('DOMContentLoaded', () => {
  const sidebar = document.getElementById('sidebar');
  const sidebarNav = document.getElementById('sidebar-nav');
  const toggleButton = document.querySelector('.sidebar-toggle');
  const mainContent = document.getElementById('main-content');

  let userRole = localStorage.getItem('userRole');
  sidebar.style.display = userRole ? 'block' : 'none';

  if (!userRole) {
    import('./auth.js')
      .then(({ loadAuth }) => loadAuth())
      .catch(error => {
        console.error('Ошибка загрузки модуля auth.js:', error);
        mainContent.innerHTML = '<p>Ошибка загрузки формы авторизации. Попробуйте позже.</p>';
      });
    return;
  }

  import('./main.js')
    .then(({ loadHome }) => loadHome())
    .catch(error => {
      console.error('Ошибка загрузки модуля main.js:', error);
      mainContent.innerHTML = '<p>Ошибка загрузки главной страницы. Попробуйте позже.</p>';
    });

  const menuItems = [
    { id: 'home', icon: './images/icon-home.svg', label: 'Главная' },
    { id: 'clients', icon: './images/icon-clients.svg', label: 'Клиенты' },
    { id: 'subscriptions', icon: './images/icon-subscriptions.svg', label: 'Абонементы' },
    { id: 'schedule', icon: './images/icon-schedule.svg', label: 'Расписание' },
    { id: 'rooms', icon: './images/icon-rooms.svg', label: 'Залы' },
    { id: 'groups', icon: './images/icon-group.svg', label: 'Группы' },
    { id: 'classes', icon: './images/icon-classes.svg', label: 'Занятия' },
  ];

  if (userRole === 'manager') {
    menuItems.splice(5, 0, { id: 'employees', icon: './images/icon-employees.svg', label: 'Сотрудники' });
    menuItems.push({ id: 'reports', icon: './images/icon-reports.svg', label: 'Отчеты' });
  }

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

  sidebarNav.addEventListener('click', (e) => {
    const link = e.target.closest('.sidebar-link');
    if (link) {
      const section = link.getAttribute('data-section');
      mainContent.innerHTML = '';

      const loadModule = (modulePath, loadFunction) => {
        import(modulePath)
          .then(module => module[loadFunction](section === 'profile' || section === 'clients' ? userRole : undefined))
          .catch(error => {
            console.error(`Ошибка загрузки модуля ${modulePath}:`, error);
            mainContent.innerHTML = `<p>Ошибка загрузки раздела "${section}". Попробуйте позже.</p>`;
          });
      };

      if (section === 'home') {
        loadModule('./main.js', 'loadHome');
      } else if (section === 'clients') {
        loadModule('./clients.js', 'loadClients');
      } else if (section === 'subscriptions') {
        loadModule('./subscriptions.js', 'loadSubscriptions');
      } else if (section === 'schedule') {
        loadModule('./schedule.js', 'loadSchedule');
      } else if (section === 'rooms') {
        loadModule('./rooms.js', 'loadRooms');
      } else if (section === 'employees' && userRole === 'manager') {
        loadModule('./employees.js', 'loadEmployees');
      } else if (section === 'groups') {
        loadModule('./groups.js', 'loadGroups');
      } else if (section === 'classes') {
        loadModule('./classes.js', 'loadClasses');
      } else if (section === 'reports' && userRole === 'manager') {
        loadModule('./reports.js', 'loadReports');
      } else if (section === 'profile') {
        loadModule('./profile.js', 'loadProfile');
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
