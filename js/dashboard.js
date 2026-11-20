// Navigation, dashboard and reports

const sidebar = document.getElementById('sidebar');
const menuBtn = document.getElementById('menuBtn');
const statCards = document.getElementById('statCards');
const recentBody = document.getElementById('recentBody');
const reportCards = document.getElementById('reportCards');
const mostRentedBody = document.getElementById('mostRentedBody');
const browseEquipmentBtn = document.getElementById('browseEquipmentBtn');
const viewRentalsBtn = document.getElementById('viewRentalsBtn');

const pageTitles = {
  dashboard: 'Dashboard',
  equipment: 'Equipment',
  bookings: 'Rentals',
  users: 'Users',
  reports: 'Reports'
};

// Each page has one function that fills it with data
const renderers = {
  dashboard: showDashboard,
  equipment: showEquipment,
  bookings: showBookings,
  users: showUsers,
  reports: showReports
};

// Switch to another page of the app
function showPage(name) {
  // Fall back to the dashboard if the role cannot open this page
  const link = [...document.querySelectorAll('.nav-link')].find(l => l.dataset.page === name);
  if (!link || link.classList.contains('hidden')) name = 'dashboard';

  document.querySelectorAll('.page').forEach(page => page.classList.add('hidden'));
  document.getElementById(name).classList.remove('hidden');
  document.querySelectorAll('.nav-link').forEach(l => {
    l.classList.toggle('active', l.dataset.page === name);
  });

  document.getElementById('pageTitle').textContent = pageTitles[name];
  // Remember the page in the address bar without scrolling the page
  history.replaceState(null, '', '#' + name);
  sidebar.classList.remove('open');
  renderers[name]();
}

// Draw a row of summary cards. Each stat is [label, value]
function showCards(container, stats) {
  container.innerHTML = stats.map(stat => `
    <div class="card">
      <p class="card-label">${stat[0]}</p>
      <p class="card-value">${stat[1]}</p>
    </div>`).join('');
}

// Dashboard: summary cards and the latest rentals
function showDashboard() {
  const equipment = getData('equipment');
  const bookings = getVisibleBookings();
  const countStatus = status => bookings.filter(b => b.status === status).length;

  showCards(statCards, [
    ['Total equipment', equipment.length],
    ['Available equipment', equipment.filter(isAvailable).length],
    ['Active rentals', countStatus('Active')],
    ['Pending requests', countStatus('Pending')],
    ['Completed rentals', countStatus('Completed')]
  ]);

  const recent = bookings.slice(-5).reverse();
  recentBody.innerHTML = recent.length ? recent.map(b => `
    <tr>
      <td>${escapeHtml(b.equipmentName)}</td>
      <td>${escapeHtml(b.customerName)}</td>
      <td>${formatDate(b.startDate)} to ${formatDate(b.endDate)}</td>
      <td>${statusBadge(b.status)}</td>
    </tr>`).join('') : '<tr><td colspan="4">No rentals yet.</td></tr>';
}

if (browseEquipmentBtn) {
  browseEquipmentBtn.addEventListener('click', () => showPage('equipment'));
}

if (viewRentalsBtn) {
  viewRentalsBtn.addEventListener('click', () => showPage('bookings'));
}

// Reports: request totals and the most rented equipment
function showReports() {
  const bookings = getVisibleBookings();
  // These statuses mean the request was approved at some point
  const approvedStatuses = ['Approved', 'Active', 'Completed'];
  const rented = bookings.filter(b => approvedStatuses.includes(b.status));

  showCards(reportCards, [
    ['Total requests', bookings.length],
    ['Approved requests', rented.length],
    ['Rejected requests', bookings.filter(b => b.status === 'Rejected').length],
    ['Completed rentals', bookings.filter(b => b.status === 'Completed').length]
  ]);

  // Count how many times each item was rented
  const counts = {};
  rented.forEach(b => {
    counts[b.equipmentName] = (counts[b.equipmentName] || 0) + 1;
  });
  const topFive = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 5);

  mostRentedBody.innerHTML = topFive.length ? topFive.map(row => `
    <tr><td>${escapeHtml(row[0])}</td><td>${row[1]}</td></tr>`).join('')
    : '<tr><td colspan="2">No approved rentals yet.</td></tr>';
}

// Set up the sidebar and open the first page
function startApp() {
  const user = getCurrentUser();
  document.getElementById('userName').textContent = user.name;
  document.getElementById('userRole').textContent = ROLE_NAMES[user.role];

  // Hide the sidebar links this role is not allowed to use
  document.querySelectorAll('.nav-link').forEach(link => {
    const allowed = link.dataset.roles.split(' ').includes(user.role);
    link.classList.toggle('hidden', !allowed);
    link.addEventListener('click', () => showPage(link.dataset.page));
  });

  // Customers see "My Bookings", and cannot add equipment
  if (user.role === 'customer') {
    pageTitles.bookings = 'My Bookings';
    document.getElementById('bookingsLabel').textContent = 'My Bookings';
    addEquipmentBtn.classList.add('hidden');
  }

  menuBtn.addEventListener('click', () => sidebar.classList.toggle('open'));

  showCategoryOptions();
  showPage(location.hash.slice(1) || 'dashboard');
}

// Start only when someone is logged in (otherwise auth.js redirects to login)
if (getCurrentUser()) {
  startApp();
}
