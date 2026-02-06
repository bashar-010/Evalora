// Get elements
const logoutBtn = document.getElementById('logoutBtn');
const logoutModal = document.getElementById('logoutModal');
const cancelBtn = document.getElementById('cancelBtn');
const confirmBtn = document.getElementById('confirmBtn');

// Show modal when logout is clicked
logoutBtn.addEventListener('click', function () {
    logoutModal.classList.add('active');
});

// Hide modal when cancel is clicked
cancelBtn.addEventListener('click', function () {
    logoutModal.classList.remove('active');
});

// Handle logout confirmation
confirmBtn.addEventListener('click', function () {
    // Add your logout logic here
    alert('Logging out...');
    logoutModal.classList.remove('active');
    // Example: window.location.href = '/login';
});

// Close modal when clicking outside
logoutModal.addEventListener('click', function (e) {
    if (e.target === logoutModal) {
        logoutModal.classList.remove('active');
    }
});

// Open modal
function openModal(modalId) {
    document.getElementById(modalId).classList.add('active');
}

// Close modal
function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('active');
}

// Close modal when clicking outside
document.querySelectorAll('.modal').forEach(modal => {
    modal.addEventListener('click', function (e) {
        if (e.target === this) {
            this.classList.remove('active');
        }
    });
});

// Add Role button
document.getElementById('addRoleBtn').addEventListener('click', function () {
    openModal('addRoleModal');
});

// Add Role Form Submit
document.getElementById('addRoleForm').addEventListener('submit', function (e) {
    e.preventDefault();

    const name = document.getElementById('userName').value;
    const email = document.getElementById('userEmail').value;
    const role = document.getElementById('userRole').value;
    const status = document.getElementById('userStatus').value;

    // Add new user to array
    const newUser = {
        id: nextUserId++,
        name: name,
        email: email,
        role: role,
        status: status
    };

    users.push(newUser);

    // Re-render table
    renderTable();

    // Close modal and reset form
    closeModal('addRoleModal');
    this.reset();

    alert(`Successfully added ${name} as ${role}`);
});

// Edit User
function editUser(userId) {
    const user = users.find(u => u.id === userId);

    if (!user) return;

    // Populate edit form
    document.getElementById('editUserId').value = user.id;
    document.getElementById('editUserName').value = user.name;
    document.getElementById('editUserEmail').value = user.email;
    document.getElementById('editUserRole').value = user.role;
    document.getElementById('editUserStatus').value = user.status;

    openModal('editRoleModal');
}

// Edit Role Form Submit
document.getElementById('editRoleForm').addEventListener('submit', function (e) {
    e.preventDefault();

    const userId = parseInt(document.getElementById('editUserId').value);
    const name = document.getElementById('editUserName').value;
    const email = document.getElementById('editUserEmail').value;
    const role = document.getElementById('editUserRole').value;
    const status = document.getElementById('editUserStatus').value;

    // Find and update user
    const userIndex = users.findIndex(u => u.id === userId);

    if (userIndex !== -1) {
        users[userIndex] = {
            id: userId,
            name: name,
            email: email,
            role: role,
            status: status
        };

        // Re-render table
        renderTable();

        // Close modal
        closeModal('editRoleModal');

        alert(`Successfully updated ${name}'s information`);
    }
});

// Delete User
async function deleteUser(userId) {
    const user = users.find(u => u.id === userId);

    if (!user) return;

    if (await showConfirm(`Are you sure you want to delete ${user.name}?`)) {
        // Remove user from array
        users = users.filter(u => u.id !== userId);

        // Re-render table
        renderTable();

        alert(`${user.name} has been deleted`);
    }
}


// Render table
function renderTable() {
    const tbody = document.getElementById('adminTableBody');
    tbody.innerHTML = '';

    users.forEach(user => {
        const row = document.createElement('tr');
        row.setAttribute('data-id', user.id);

        const roleClass = user.role.toLowerCase().replace(' ', '-');
        const statusClass = user.status.toLowerCase();

        row.innerHTML = `
            <td>
                <div class="user-info">
                    <svg class="user-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                        <circle cx="12" cy="7" r="4"/>
                    </svg>
                    <div>
                        <div class="user-name">${user.name}</div>
                        <div class="user-email">${user.email}</div>
                    </div>
                </div>
            </td>
            <td><span class="role-badge ${roleClass}">${user.role}</span></td>
            <td><span class="status-badge ${statusClass}">${user.status}</span></td>
            <td>
                <div class="action-buttons">
                    <button class="action-btn edit-btn" title="Edit" onclick="editUser(${user.id})">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                        </svg>
                    </button>
                    <button class="action-btn delete-btn" title="Delete" onclick="deleteUser(${user.id})">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="3 6 5 6 21 6"/>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                        </svg>
                    </button>
                </div>
            </td>
        `;

        tbody.appendChild(row);
    });
}