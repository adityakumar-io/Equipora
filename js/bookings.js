// Rentals: request form, status workflow and bookings table

const bookingsBody = document.getElementById('bookingsBody');
const noBookings = document.getElementById('noBookings');
const statusFilter = document.getElementById('statusFilter');
const rentDialog = document.getElementById('rentDialog');
const rentForm = document.getElementById('rentForm');
const rentError = document.getElementById('rentError');
const rentTotal = document.getElementById('rentTotal');
const rentEquipmentId = document.getElementById('rentEquipmentId');
const rentEquipmentName = document.getElementById('rentEquipmentName');
const startDate = document.getElementById('startDate');
const endDate = document.getElementById('endDate');

// Open the rental request form for one item (customers only)
function openRentForm(equipmentId) {
  const user = getCurrentUser();
  const item = getData('equipment').find(e => e.id === equipmentId);

  if (user.role !== 'customer') return;
  if (!item || !isAvailable(item)) {
    showMessage('This equipment is not available right now.', 'error');
    return;
  }

  rentForm.reset();
  rentError.textContent = '';
  rentTotal.textContent = '';
  rentEquipmentId.value = item.id;
  rentEquipmentName.textContent = item.name + ' - ' + formatMoney(item.price) + ' per day';
  startDate.min = getToday();
  endDate.min = getToday();
  rentDialog.showModal();
}

// Show the total price while the customer picks dates
function updateTotal() {
  const item = getData('equipment').find(e => e.id === Number(rentEquipmentId.value));
  const days = countDays(startDate.value, endDate.value);

  if (startDate.value && endDate.value && days > 0) {
    rentTotal.textContent = days + ' day(s), total ' + formatMoney(days * item.price);
  } else {
    rentTotal.textContent = '';
  }
}

startDate.addEventListener('change', updateTotal);
endDate.addEventListener('change', updateTotal);

// Check the dates and save the rental request
rentForm.addEventListener('submit', function (event) {
  event.preventDefault();
  const user = getCurrentUser();
  const item = getData('equipment').find(e => e.id === Number(rentEquipmentId.value));
  const start = startDate.value;
  const end = endDate.value;

  if (!start || !end) {
    rentError.textContent = 'Please choose both a start and an end date.';
    return;
  }
  if (start < getToday()) {
    rentError.textContent = 'The start date cannot be in the past.';
    return;
  }
  if (end < start) {
    rentError.textContent = 'The end date cannot be before the start date.';
    return;
  }
  if (!isAvailable(item)) {
    rentError.textContent = 'This equipment is no longer available.';
    return;
  }

  const days = countDays(start, end);
  const bookings = getData('bookings');
  bookings.push({
    id: getNextId(bookings),
    equipmentId: item.id,
    equipmentName: item.name,
    customerId: user.id,
    customerName: user.name,
    ownerId: item.ownerId,
    startDate: start,
    endDate: end,
    days: days,
    total: days * item.price,
    status: 'Pending'
  });
  saveData('bookings', bookings);

  rentDialog.close();
  showMessage('Rental request sent. You can track it under My Bookings.');
});

// Small helper that builds one action button
function actionButton(action, id, label, style) {
  return `<button class="btn small ${style}" data-action="${action}" data-id="${id}">${label}</button>`;
}

// Choose which buttons a booking row gets, based on role and status
function bookingButtons(booking, user) {
  const isManager = user.role === 'admin' || user.role === 'owner';
  let html = '';

  if (isManager && booking.status === 'Pending') {
    html += actionButton('approve', booking.id, 'Approve', 'primary');
    html += actionButton('reject', booking.id, 'Reject', 'danger');
  }
  if (isManager && booking.status === 'Approved') {
    html += actionButton('activate', booking.id, 'Mark active', 'primary');
  }
  if (isManager && booking.status === 'Active') {
    html += actionButton('complete', booking.id, 'Mark completed', 'primary');
  }
  if (user.role === 'customer' && booking.status === 'Pending') {
    html += actionButton('cancel', booking.id, 'Cancel request', 'danger');
  }
  // Admin can clean up finished records
  if (user.role === 'admin' && ['Rejected', 'Completed', 'Cancelled'].includes(booking.status)) {
    html += actionButton('delete', booking.id, 'Delete', 'danger');
  }

  return html || '-';
}

// Fill the bookings table
function showBookings() {
  const user = getCurrentUser();
  const status = statusFilter.value;
  const list = getVisibleBookings().filter(b => !status || b.status === status).reverse();

  noBookings.classList.toggle('hidden', list.length > 0);
  bookingsBody.innerHTML = list.map(b => `
    <tr>
      <td>${escapeHtml(b.equipmentName)}</td>
      <td>${escapeHtml(b.customerName)}</td>
      <td>${formatDate(b.startDate)} to ${formatDate(b.endDate)} (${b.days} days)</td>
      <td>${formatMoney(b.total)}</td>
      <td>${statusBadge(b.status)}</td>
      <td>${bookingButtons(b, user)}</td>
    </tr>`).join('');
}

statusFilter.addEventListener('change', showBookings);

// Move a booking to a new status and keep the stock count correct
function changeStatus(id, newStatus) {
  const bookings = getData('bookings');
  const equipment = getData('equipment');
  const booking = bookings.find(b => b.id === id);
  const item = equipment.find(e => e.id === booking.equipmentId);

  // Approving takes one unit out of stock
  if (newStatus === 'Approved') {
    if (item.quantity < 1) {
      showMessage('Cannot approve: no stock left for this equipment.', 'error');
      return;
    }
    item.quantity -= 1;
  }

  // A completed rental puts the unit back in stock
  if (newStatus === 'Completed') {
    item.quantity += 1;
  }

  booking.status = newStatus;
  saveData('bookings', bookings);
  saveData('equipment', equipment);
  showMessage('Rental marked as ' + newStatus.toLowerCase() + '.');
  showBookings();
}

// One click handler for all the buttons in the table
bookingsBody.addEventListener('click', function (event) {
  const button = event.target.closest('button');
  if (!button) return;

  const id = Number(button.dataset.id);
  const action = button.dataset.action;

  if (action === 'approve') changeStatus(id, 'Approved');
  if (action === 'reject') changeStatus(id, 'Rejected');
  if (action === 'activate') changeStatus(id, 'Active');
  if (action === 'complete') changeStatus(id, 'Completed');

  if (action === 'cancel' && confirm('Cancel this rental request?')) {
    changeStatus(id, 'Cancelled');
  }

  if (action === 'delete' && confirm('Delete this rental record? This cannot be undone.')) {
    saveData('bookings', getData('bookings').filter(b => b.id !== id));
    showMessage('Rental record deleted.');
    showBookings();
  }
});
