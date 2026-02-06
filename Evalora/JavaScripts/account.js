document.addEventListener('DOMContentLoaded', () => {
    const userString = localStorage.getItem('user');
    const user = userString ? JSON.parse(userString) : {};

    updateSidebar(user.role);
    loadUserProfile(user);
    setupEventListeners();
});

function updateSidebar(role) {
    const navMenu = document.getElementById('navMenu');
    if (!navMenu) return;

    let items = '';
    if (role === 'admin') {
        items = `
            <a href="dashboard.html" class="nav-item"><svg width="25" height="25" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg> Dashboard</a>
            <a href="settings.html" class="nav-item"><img src="photos/settingg.svg" width="25px"> General</a>
            <a href="roles.html" class="nav-item"><img src="photos/roles.png" width="25px"> Roles</a>
            <a href="notifications.html" class="nav-item"><img src="photos/notificationnn.png" width="25px"> Notifications</a>
            <a href="logs.html" class="nav-item"><img src="photos/logs.svg" width="25px"> Logs</a>
        `;
    } else if (role === 'company') {
        items = `
            <a href="company_dashboard.html" class="nav-item"><svg width="25" height="25" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg> Dashboard</a>
             <a href="managesopport.html" class="nav-item"><img src="photos/logs.svg" width="25px"> Manage Jobs</a>
        `;
    } else {
        items = `
            <a href="posts.html" class="nav-item"><svg width="25" height="25" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h6v6H4V4zm10 0h6v6h-6V4zM4 14h6v6H4v-6zm10 3h6m-6 3h4"/></svg> Feed</a>
            <a href="profile.html" class="nav-item"><img src="photos/account.png" width="25px"> My Profile</a>
        `;
    }
    navMenu.innerHTML = items;
}

function loadUserProfile(user) {
    const nameDisplay = document.getElementById('userNameDisplay');
    const emailDisplay = document.getElementById('userEmailDisplay');
    const nameInput = document.getElementById('fullNameInput');
    const emailInput = document.getElementById('emailInput');
    const phoneInput = document.querySelector('input[type="tel"]');

    if (nameDisplay) nameDisplay.textContent = user.name || 'User';
    if (emailDisplay) emailDisplay.textContent = user.email || 'Email not set';
    if (nameInput) nameInput.value = user.name || '';
    if (emailInput) emailInput.value = user.email || '';
    if (phoneInput) phoneInput.value = user.phone || '+962 793 547 354';
}

async function saveAccountChanges() {
    const nameInput = document.getElementById('fullNameInput');
    const emailInput = document.getElementById('emailInput');
    const phoneInput = document.querySelector('input[type="tel"]');

    const userString = localStorage.getItem('user');
    const user = userString ? JSON.parse(userString) : {};

    const updatedUser = {
        ...user,
        name: nameInput.value,
        email: emailInput.value,
        phone: phoneInput.value
    };

    try {
        // Save to localStorage
        localStorage.setItem('user', JSON.stringify(updatedUser));

        // Update display labels
        const nameDisplay = document.getElementById('userNameDisplay');
        const emailDisplay = document.getElementById('userEmailDisplay');
        if (nameDisplay) nameDisplay.textContent = updatedUser.name;
        if (emailDisplay) emailDisplay.textContent = updatedUser.email;

        // Backend API call would go here
        // await window.api.request('/users/me', 'PUT', { name: updatedUser.name, email: updatedUser.email, phone: updatedUser.phone });

        await showAlert('Changes saved successfully!', 'success');
    } catch (error) {
        console.error('Save changes error:', error);
        await showAlert('Failed to save changes.', 'error');
    }
}

function setupEventListeners() {
    // Logout
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.onclick = async (e) => {
            e.preventDefault();
            if (await showConfirm('Are you sure you want to logout?', 'Confirm Logout')) {
                localStorage.clear();
                window.location.href = 'login.html';
            }
        };
    }

    // Delete Account
    const deleteBtn = document.querySelector('.btn-delete');
    if (deleteBtn) {
        deleteBtn.onclick = async (e) => {
            e.preventDefault();
            if (await showConfirm('Are you sure you want to delete your account? This action cannot be undone.', 'Delete Account')) {
                try {
                    await showAlert('Account deleted successfully. Redirecting...', 'success');
                    setTimeout(() => {
                        localStorage.clear();
                        window.location.href = 'login.html';
                    }, 2000);
                } catch (error) {
                    showAlert('Failed to delete account: ' + error.message, 'error');
                }
            }
        };
    }

    // Change Button - Acts as Save for all fields
    const changeBtn = document.querySelector('.btn-change');
    if (changeBtn) {
        changeBtn.onclick = async () => {
            await saveAccountChanges();
        };
    }

    // Optional: Auto-save on input change or blur could be added here
}
