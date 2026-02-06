let admins = [];

async function fetchAdmins() {
    try {
        admins = await window.api.getAdmins();
        renderTable();
    } catch (error) {
        console.error("Failed to fetch admins:", error);
    }
}

// Get elements
const logoutBtn = document.getElementById('logoutBtn');

if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
        if (await showConfirm("Are you sure you want to log out?", "Confirm Logout")) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = 'login.html';
        }
    });
}

function openModal(modalId) {
    document.getElementById(modalId).classList.add('active');
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('active');
}

document.querySelectorAll('.modal').forEach(modal => {
    modal.addEventListener('click', function (e) {
        if (e.target === this) {
            this.classList.remove('active');
        }
    });
});

document.getElementById('addRoleBtn').addEventListener('click', function () {
    openModal('addRoleModal');
});

document.getElementById('addRoleForm').addEventListener('submit', async function (e) {
    e.preventDefault();

    const data = {
        name: document.getElementById('userName').value,
        email: document.getElementById('userEmail').value,
        password: document.getElementById('userPassword').value,
        subRole: document.getElementById('userRole').value,
        status: document.getElementById('userStatus').value
    };

    try {
        await window.api.createAdmin(data);
        await showAlert(`Successfully added ${data.name} as ${data.subRole}`);
        fetchAdmins();
        closeModal('addRoleModal');
        this.reset();
    } catch (error) {
        await showAlert(error.message, 'error');
    }
});

function editUser(userId) {
    const user = admins.find(u => u._id === userId);
    if (!user) return;

    document.getElementById('editUserId').value = user._id;
    document.getElementById('editUserName').value = user.name;
    document.getElementById('editUserEmail').value = user.email;
    document.getElementById('editUserRole').value = user.subRole;
    document.getElementById('editUserStatus').value = user.status;

    openModal('editRoleModal');
}

document.getElementById('editRoleForm').addEventListener('submit', async function (e) {
    e.preventDefault();

    const id = document.getElementById('editUserId').value;
    const data = {
        name: document.getElementById('editUserName').value,
        email: document.getElementById('editUserEmail').value,
        subRole: document.getElementById('editUserRole').value,
        status: document.getElementById('editUserStatus').value
    };

    try {
        await window.api.updateAdmin(id, data);
        await showAlert(`Successfully updated admin information`);
        fetchAdmins();
        closeModal('editRoleModal');
    } catch (error) {
        await showAlert(error.message, 'error');
    }
});

async function deleteUser(userId) {
    if (await showConfirm(`Are you sure you want to delete this admin?`)) {
        try {
            await window.api.deleteAdmin(userId);
            await showAlert(`Admin has been deleted`);
            fetchAdmins();
        } catch (error) {
            await showAlert(error.message, 'error');
        }
    }
}

function renderTable() {
    const tbody = document.getElementById('adminTableBody');
    if (!tbody) return;
    tbody.innerHTML = '';

    // Filter to ensure only admins are shown (redundant with API but safe)
    const adminUsers = admins.filter(u => u.role === 'admin');

    adminUsers.forEach(user => {
        const row = document.createElement('tr');
        row.setAttribute('data-id', user._id);

        const roleClass = (user.subRole || 'admin').toLowerCase();
        const statusClass = (user.status || 'active').toLowerCase();

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
            <td><span class="role-badge ${roleClass}">${user.subRole || 'Admin'}</span></td>
            <td><span class="status-badge ${statusClass}">${user.status || 'Active'}</span></td>
            <td>
                <div class="action-buttons">
                    <button class="action-btn edit-btn" title="Edit" onclick="editUser('${user._id}')">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                        </svg>
                    </button>
                    <button class="action-btn delete-btn" title="Delete" onclick="deleteUser('${user._id}')">
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

document.addEventListener('DOMContentLoaded', fetchAdmins);