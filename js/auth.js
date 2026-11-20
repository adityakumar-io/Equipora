// Register, login, logout and user management.
// Note: passwords are saved as plain text because this is only a demo project.

const loginForm = document.getElementById('loginForm');
const registerForm = document.getElementById('registerForm');
const logoutBtn = document.getElementById('logoutBtn');
const usersBody = document.getElementById('usersBody');
const isAppPage = document.getElementById('sidebar');

// Logged-in users do not need the login or register page
if ((loginForm || registerForm) && getCurrentUser()) {
  location.href = 'index.html';
}

// The main app needs a logged-in user
if (isAppPage && !getCurrentUser()) {
  location.href = 'login.html';
}

// Login form
if (loginForm) {
  loginForm.addEventListener('submit', function (event) {
    event.preventDefault();
    const email = document.getElementById('email').value.trim().toLowerCase();
    const password = document.getElementById('password').value;
    const error = document.getElementById('formError');

    if (!email || !password) {
      error.textContent = 'Please enter your email and password.';
      return;
    }

    const user = getData('users').find(u => u.email === email && u.password === password);
    if (!user) {
      error.textContent = 'Wrong email or password.';
      return;
    }

    localStorage.setItem('currentUserId', user.id);
    location.href = 'index.html';
  });
}

// Register form
if (registerForm) {
  registerForm.addEventListener('submit', function (event) {
    event.preventDefault();
    const name = document.getElementById('name').value.trim();
    const email = document.getElementById('email').value.trim().toLowerCase();
    const role = document.getElementById('role').value;
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const error = document.getElementById('formError');

    if (!name || !email || !password || !confirmPassword) {
      error.textContent = 'Please fill in all fields.';
      return;
    }
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      error.textContent = 'Please enter a valid email address.';
      return;
    }
    if (password.length < 6) {
      error.textContent = 'Password must be at least 6 characters.';
      return;
    }
    if (password !== confirmPassword) {
      error.textContent = 'Passwords do not match.';
      return;
    }

    const users = getData('users');
    if (users.some(u => u.email === email)) {
      error.textContent = 'This email is already registered.';
      return;
    }

    users.push({ id: getNextId(users), name, email, password, role });
    saveData('users', users);

    error.textContent = '';
    showMessage('Account created. Taking you to the login page...');
    setTimeout(() => { location.href = 'login.html'; }, 1500);
  });
}

// Logout button
if (logoutBtn) {
  logoutBtn.addEventListener('click', function () {
    localStorage.removeItem('currentUserId');
    location.href = 'login.html';
  });
}

// Fill the users table (admin only)
function showUsers() {
  const me = getCurrentUser();

  usersBody.innerHTML = getData('users').map(user => {
    const roleOptions = Object.keys(ROLE_NAMES).map(role =>
      `<option value="${role}" ${role === user.role ? 'selected' : ''}>${ROLE_NAMES[role]}</option>`
    ).join('');
    const isMe = user.id === me.id;

    return `
      <tr>
        <td>${escapeHtml(user.name)}</td>
        <td>${escapeHtml(user.email)}</td>
        <td><select class="role-select" data-id="${user.id}" ${isMe ? 'disabled' : ''}>${roleOptions}</select></td>
        <td>${isMe ? '-' : `<button class="btn small danger" data-id="${user.id}">Delete</button>`}</td>
      </tr>`;
  }).join('');
}

if (usersBody) {
  // Change a user's role
  usersBody.addEventListener('change', function (event) {
    if (!event.target.classList.contains('role-select')) return;

    const users = getData('users');
    const user = users.find(u => u.id === Number(event.target.dataset.id));
    user.role = event.target.value;
    saveData('users', users);
    showMessage('Role updated for ' + user.name + '.');
  });

  // Delete a user
  usersBody.addEventListener('click', function (event) {
    const button = event.target.closest('button');
    if (!button) return;
    if (!confirm('Delete this user? This cannot be undone.')) return;

    const id = Number(button.dataset.id);
    saveData('users', getData('users').filter(u => u.id !== id));
    showMessage('User deleted.');
    showUsers();
  });
}
