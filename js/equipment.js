// Equipment page: list, search, filters, add, edit, delete and details

const equipmentGrid = document.getElementById('equipmentGrid');
const noResults = document.getElementById('noResults');
const searchInput = document.getElementById('searchInput');
const categoryFilter = document.getElementById('categoryFilter');
const availabilityFilter = document.getElementById('availabilityFilter');
const sortPrice = document.getElementById('sortPrice');
const addEquipmentBtn = document.getElementById('addEquipmentBtn');
const equipmentDialog = document.getElementById('equipmentDialog');
const equipmentForm = document.getElementById('equipmentForm');
const equipmentError = document.getElementById('equipmentError');
const detailsDialog = document.getElementById('detailsDialog');
const detailsContent = document.getElementById('detailsContent');

// Fill the category dropdowns (filter and form)
function showCategoryOptions() {
  const options = CATEGORIES.map(c => `<option value="${c}">${c}</option>`).join('');
  categoryFilter.innerHTML = '<option value="">All categories</option>' + options;
  document.getElementById('eqCategory').innerHTML = options;
}

// Admins can manage everything, owners their own equipment and the default equipment
function canManage(item, user) {
  const isOwnerOfItem = item.ownerId === user.id || item.ownerId === STORE_OWNER_ID;
  return user.role === 'admin' || (user.role === 'owner' && isOwnerOfItem);
}

// Build the HTML for one equipment card
function buildCard(item, user) {
  let buttons = `<button class="btn small" data-action="view" data-id="${item.id}">View</button>`;

  if (user.role === 'customer' && isAvailable(item)) {
    buttons += `<button class="btn small primary" data-action="rent" data-id="${item.id}">Rent</button>`;
  }

  if (canManage(item, user)) {
    const toggleText = item.available ? 'Set unavailable' : 'Set available';
    buttons += `<button class="btn small" data-action="edit" data-id="${item.id}">Edit</button>`;
    buttons += `<button class="btn small" data-action="toggle" data-id="${item.id}">${toggleText}</button>`;
    buttons += `<button class="btn small danger" data-action="delete" data-id="${item.id}">Delete</button>`;
  }

  return `
    <article class="equipment-card">
      <img src="${getImage(item)}" alt="${escapeHtml(item.name)}" onerror="this.onerror=null;this.src='assets/images/${item.category.toLowerCase().replace(' ', '-')}.svg'">
      <div class="card-body">
        <span class="category">${item.category}</span>
        <h3>${escapeHtml(item.name)}</h3>
        <p class="price">${formatMoney(item.price)} <small>per day</small></p>
        <p class="meta">In stock: ${item.quantity} | Owner: ${escapeHtml(item.ownerName)}</p>
        ${statusBadge(isAvailable(item) ? 'Available' : 'Unavailable')}
        <div class="card-actions">${buttons}</div>
      </div>
    </article>`;
}

// Show equipment after applying search, filters and sorting
function showEquipment() {
  const user = getCurrentUser();
  const search = searchInput.value.trim().toLowerCase();
  const category = categoryFilter.value;
  const availability = availabilityFilter.value;

  const list = getData('equipment').filter(item => {
    const matchesName = item.name.toLowerCase().includes(search);
    const matchesCategory = !category || item.category === category;
    // true when the filter says "available" and the item is available (same for unavailable)
    const matchesAvailability = !availability || (availability === 'available') === isAvailable(item);
    return matchesName && matchesCategory && matchesAvailability;
  });

  if (sortPrice.value === 'low') list.sort((a, b) => a.price - b.price);
  if (sortPrice.value === 'high') list.sort((a, b) => b.price - a.price);

  noResults.classList.toggle('hidden', list.length > 0);
  equipmentGrid.innerHTML = list.map(item => buildCard(item, user)).join('');
}

// Search and filters update the list straight away
[searchInput, categoryFilter, availabilityFilter, sortPrice].forEach(element => {
  element.addEventListener('input', showEquipment);
});

// Open the add / edit form (id is empty when adding)
function openEquipmentForm(id) {
  const fields = equipmentForm.elements;
  equipmentForm.reset();
  equipmentError.textContent = '';
  fields.eqId.value = id || '';
  document.getElementById('equipmentFormTitle').textContent = id ? 'Edit equipment' : 'Add equipment';

  if (id) {
    const item = getData('equipment').find(e => e.id === id);
    fields.eqName.value = item.name;
    fields.eqCategory.value = item.category;
    fields.eqDescription.value = item.description;
    fields.eqPrice.value = item.price;
    fields.eqQuantity.value = item.quantity;
    fields.eqAvailable.value = item.available ? 'yes' : 'no';
  }

  equipmentDialog.showModal();
}

addEquipmentBtn.addEventListener('click', () => openEquipmentForm());

// Check the form, then read the image (if any) and save
equipmentForm.addEventListener('submit', function (event) {
  event.preventDefault();
  const fields = equipmentForm.elements;

  const data = {
    name: fields.eqName.value.trim(),
    category: fields.eqCategory.value,
    description: fields.eqDescription.value.trim(),
    price: Number(fields.eqPrice.value),
    quantity: Number(fields.eqQuantity.value),
    available: fields.eqAvailable.value === 'yes'
  };

  if (!data.name || !data.description || !fields.eqPrice.value || !fields.eqQuantity.value) {
    equipmentError.textContent = 'Please fill in all the fields.';
    return;
  }
  if (data.price <= 0) {
    equipmentError.textContent = 'Price per day must be more than 0.';
    return;
  }
  if (!Number.isInteger(data.quantity) || data.quantity < 0) {
    equipmentError.textContent = 'Quantity must be a whole number, 0 or more.';
    return;
  }

  const file = fields.eqImage.files[0];
  if (!file) {
    saveEquipment(data, '');
    return;
  }
  if (file.size > 500000) {
    equipmentError.textContent = 'Image must be smaller than 500 KB.';
    return;
  }

  const reader = new FileReader();
  reader.onload = () => saveEquipment(data, reader.result);
  reader.readAsDataURL(file);
});

// Add a new item or update an existing one
function saveEquipment(data, image) {
  const user = getCurrentUser();
  const list = getData('equipment');
  const id = Number(equipmentForm.elements.eqId.value);

  if (id) {
    const item = list.find(e => e.id === id);
    Object.assign(item, data);
    if (image) item.image = image;
    showMessage('Equipment updated.');
  } else {
    list.push({ id: getNextId(list), ...data, image, ownerId: user.id, ownerName: user.name });
    showMessage('Equipment added.');
  }

  saveData('equipment', list);
  equipmentDialog.close();
  showEquipment();
}

// Switch an item between available and unavailable
function toggleAvailability(id) {
  const list = getData('equipment');
  const item = list.find(e => e.id === id);
  item.available = !item.available;
  saveData('equipment', list);
  showMessage('Availability updated.');
  showEquipment();
}

// Delete an item after asking, unless it still has open rentals
function deleteEquipment(id) {
  const hasOpenRentals = getData('bookings').some(b =>
    b.equipmentId === id && ['Pending', 'Approved', 'Active'].includes(b.status)
  );
  if (hasOpenRentals) {
    showMessage('This equipment has open rentals, so it cannot be deleted.', 'error');
    return;
  }
  if (!confirm('Delete this equipment? This cannot be undone.')) return;

  saveData('equipment', getData('equipment').filter(e => e.id !== id));
  showMessage('Equipment deleted.');
  showEquipment();
}

// Show the full details of one item
function openDetails(id) {
  const item = getData('equipment').find(e => e.id === id);
  const owner = getData('users').find(u => u.id === item.ownerId);
  const ownerInfo = escapeHtml(item.ownerName) + (owner ? ' (' + escapeHtml(owner.email) + ')' : '');

  detailsContent.innerHTML = `
    <img class="details-image" src="${getImage(item)}" alt="${escapeHtml(item.name)}" onerror="this.onerror=null;this.src='assets/images/${item.category.toLowerCase().replace(' ', '-')}.svg'">
    <h2>${escapeHtml(item.name)}</h2>
    ${statusBadge(isAvailable(item) ? 'Available' : 'Unavailable')}
    <p class="note">${escapeHtml(item.description)}</p>
    <dl class="details-list">
      <dt>Category</dt><dd>${item.category}</dd>
      <dt>Price</dt><dd>${formatMoney(item.price)} per day</dd>
      <dt>In stock</dt><dd>${item.quantity}</dd>
      <dt>Owner</dt><dd>${ownerInfo}</dd>
    </dl>`;

  detailsDialog.showModal();
}

// One click handler for all the card buttons
equipmentGrid.addEventListener('click', function (event) {
  const button = event.target.closest('button');
  if (!button) return;

  const id = Number(button.dataset.id);
  const action = button.dataset.action;
  const item = getData('equipment').find(e => e.id === id);

  // Only people who manage this item may edit, toggle or delete it
  if (['edit', 'toggle', 'delete'].includes(action) && !canManage(item, getCurrentUser())) return;

  if (action === 'view') openDetails(id);
  if (action === 'rent') openRentForm(id);
  if (action === 'edit') openEquipmentForm(id);
  if (action === 'toggle') toggleAvailability(id);
  if (action === 'delete') deleteEquipment(id);
});
