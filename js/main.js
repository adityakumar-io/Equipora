// Shared settings and helper functions used on every page

const CURRENCY = '₹';
const CATEGORIES = ['Heavy Machinery', 'Construction', 'Power Tools', 'Utilities', 'Garden', 'Photography', 'Events'];
// Default equipment has this owner id, so every owner and admin can manage it
const STORE_OWNER_ID = 0;
const ROLE_NAMES = { admin: 'Admin', owner: 'Equipment Owner', customer: 'Customer' };

// Read a list from localStorage
function getData(key) {
  return JSON.parse(localStorage.getItem(key)) || [];
}

// Save a list to localStorage
function saveData(key, data) {
  localStorage.setItem(key, JSON.stringify(data));
}

// Get the next free id for a list
function getNextId(list) {
  return list.length ? Math.max(...list.map(item => item.id)) + 1 : 1;
}

// Find the logged-in user (undefined if nobody is logged in)
function getCurrentUser() {
  const id = Number(localStorage.getItem('currentUserId'));
  return getData('users').find(user => user.id === id);
}

// Show a short message at the top right of the screen
function showMessage(text, type = 'success') {
  let box = document.getElementById('message');
  if (!box) {
    box = document.createElement('div');
    box.id = 'message';
    document.body.appendChild(box);
  }
  box.textContent = text;
  box.className = 'message ' + type;
  clearTimeout(box.timer);
  box.timer = setTimeout(() => { box.className = 'message hidden'; }, 3000);
}

// Stop user text from being read as HTML
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function formatMoney(amount) {
  return CURRENCY + amount.toLocaleString('en-IN');
}

function formatDate(dateText) {
  return new Date(dateText + 'T00:00:00').toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric'
  });
}

// Today's date as YYYY-MM-DD in local time
function getToday() {
  return new Date().toLocaleDateString('en-CA');
}

// Number of rental days, counting both the first and last day
function countDays(start, end) {
  return Math.round((new Date(end) - new Date(start)) / 86400000) + 1;
}

// Equipment can be rented only when it is switched on and in stock
function isAvailable(item) {
  return item.available && item.quantity > 0;
}

function statusBadge(status) {
  return '<span class="badge ' + status.toLowerCase() + '">' + status + '</span>';
}

// Use the uploaded image, or a default picture for the category
function getImage(item) {
  return item.image || 'assets/images/' + item.category.toLowerCase().replace(' ', '-') + '.svg';
}

// Bookings this user is allowed to see
function getVisibleBookings() {
  const user = getCurrentUser();
  const list = getData('bookings');
  if (user.role === 'owner') return list.filter(b => b.ownerId === user.id || b.ownerId === STORE_OWNER_ID);
  if (user.role === 'customer') return list.filter(b => b.customerId === user.id);
  return list;
}

// Add demo users the first time the site is opened
function addSampleData() {
  if (localStorage.getItem('sampleDataAdded')) return;

  saveData('users', [
    { id: 1, name: 'Admin', email: 'admin@rental.com', password: 'admin123', role: 'admin' },
    { id: 2, name: 'Demo Owner', email: 'owner@rental.com', password: 'owner123', role: 'owner' },
    { id: 3, name: 'Demo Customer', email: 'customer@rental.com', password: 'customer123', role: 'customer' }
  ]);

  saveData('bookings', []);
  localStorage.setItem('sampleDataAdded', 'yes');
}

// The 10 default equipment listings
const defaultEquipment = [
  { name: 'Excavator', category: 'Heavy Machinery', description: 'Hydraulic crawler excavator for digging, trenching and site levelling.', price: 3500, quantity: 2, image: 'https://images.unsplash.com/photo-1580901369227-308f6f40bdeb?auto=format&fit=crop&w=900&q=85' },
  { name: 'Bulldozer', category: 'Heavy Machinery', description: 'Powerful dozer with a front blade for clearing and grading land.', price: 4500, quantity: 1, image: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=900&q=85' },
  { name: 'Concrete Mixer', category: 'Construction', description: 'Drum mixer on wheels, ideal for small and medium concrete jobs.', price: 800, quantity: 5, image: 'https://images.unsplash.com/photo-1590486803833-1c5dc8ddd4c8?auto=format&fit=crop&w=900&q=85' },
  { name: 'Power Generator', category: 'Utilities', description: 'Diesel generator that gives steady backup power for sites and events.', price: 1200, quantity: 4, image: 'https://images.unsplash.com/photo-1530124566582-a618bc2615dc?auto=format&fit=crop&w=900&q=85' },
  { name: 'Welding Machine', category: 'Power Tools', description: 'Arc welding machine with cable and torch for metal fabrication.', price: 500, quantity: 6, image: 'https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?auto=format&fit=crop&w=900&q=85' },
  { name: 'Air Compressor', category: 'Power Tools', description: 'Tank compressor for spray painting, nail guns and pneumatic tools.', price: 900, quantity: 3, image: 'https://images.unsplash.com/photo-1586864387967-d02ef85d93e8?auto=format&fit=crop&w=900&q=85' },
  { name: 'Forklift', category: 'Heavy Machinery', description: 'Diesel forklift for lifting and moving pallets and heavy loads.', price: 2000, quantity: 2, image: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=900&q=85' },
  { name: 'Electric Drill', category: 'Power Tools', description: 'Heavy-duty drill with a set of bits for wood, metal and concrete.', price: 250, quantity: 12, image: 'https://images.unsplash.com/photo-1504148455328-c376907d081c?auto=format&fit=crop&w=900&q=85' },
  { name: 'Water Pump', category: 'Utilities', description: 'Portable pump with hose for draining water and irrigation.', price: 400, quantity: 5, image: 'https://images.unsplash.com/photo-1581094794329-c8112a89af12?auto=format&fit=crop&w=900&q=85' },
  { name: 'Scaffolding Set', category: 'Construction', description: 'Steel frame scaffolding set with planks for working at height.', price: 600, quantity: 8, image: 'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&w=900&q=85' }
];

// Add the default equipment when there is none (or it was never added before).
// An item that is already in the list is skipped, so nothing gets duplicated.
function addDefaultEquipment() {
  const list = getData('equipment');

  defaultEquipment.forEach(item => {
    const existing = list.find(e => e.name.toLowerCase() === item.name.toLowerCase());
    const exists = Boolean(existing);
    if (!exists) {
      list.push({ id: getNextId(list), ...item, available: true, ownerId: STORE_OWNER_ID, ownerName: 'Equipora Rentals' });
    } else if (existing.image && existing.image.startsWith('assets/images/')) {
      existing.image = item.image;
    }
  });

  saveData('equipment', list);
  localStorage.setItem('defaultEquipmentAdded', 'yes');
}

addSampleData();
addDefaultEquipment();

// Every button with data-close closes the dialog it sits in
document.querySelectorAll('[data-close]').forEach(button => {
  button.addEventListener('click', () => button.closest('dialog').close());
});
