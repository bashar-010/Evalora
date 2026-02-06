document.addEventListener('DOMContentLoaded', () => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    updateSidebar(role = user.role);
    loadUserProfile();
    setupLogout();
});

function updateSidebar(role) {
    const navMenu = document.getElementById('navMenu');
    if (!navMenu) return;

    let items = '';
    if (role === 'admin') {
        items = `
            <a href="dashboard.html" class="nav-item"><img src="photos/dashboard.png" width="25px"> Dashboard</a>
            <a href="settings.html" class="nav-item"><img src="photos/settingg.svg" width="25px"> General</a>
            <a href="roles.html" class="nav-item"><img src="photos/roles.png" width="25px"> Roles</a>
            <a href="notifications_center.html" class="nav-item"><img src="photos/notificationnn.png" width="25px"> Notifications</a>
            <a href="logs.html" class="nav-item"><img src="photos/logs.svg" width="25px"> Logs</a>
        `;
    } else if (role === 'company') {
        const dashboardUrl = role === 'admin' ? 'dashboard.html' : 'company_dashboard.html';
        items = `
            <a href="${dashboardUrl}" class="nav-item"><img src="photos/dashboard.png" width="25px"> Dashboard</a>
             <a href="managesopport.html" class="nav-item"><img src="photos/logs.svg" width="25px"> Manage Jobs</a>
            <a href="notifications_center.html" class="nav-item"><img src="photos/notificationnn.png" width="25px"> NotificationsCenter</a>
        `;
    } else {
        items = `
            <a href="posts.html" class="nav-item"><img src="photos/dashboard.png" width="25px"> Feed</a>
            <a href="profile.html" class="nav-item"><img src="photos/account.png" width="25px"> My Profile</a>
            <a href="notifications_center.html" class="nav-item"><img src="photos/notificationnn.png" width="25px"> Notifications</a>
        `;
    }
    navMenu.innerHTML = items;
}

function loadUserProfile() {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (user.name) {
        document.getElementById('userNameDisplay').textContent = user.name;
        document.getElementById('userEmailDisplay').textContent = user.email;
        document.getElementById('fullNameInput').value = user.name;
        document.getElementById('emailInput').value = user.email;
    }
}

function setupLogout() {
    const logoutBtn = document.getElementById('logoutBtn');
    const logoutModal = document.getElementById('logoutModal');
    const cancelBtn = document.getElementById('cancelBtn');
    const confirmBtn = document.getElementById('confirmBtn');

    logoutBtn.addEventListener('click', () => logoutModal.classList.add('active'));
    cancelBtn.addEventListener('click', () => logoutModal.classList.remove('active'));
    confirmBtn.addEventListener('click', () => {
        localStorage.clear();
        window.location.href = 'login.html';
    });

    logoutModal.addEventListener('click', (e) => {
        if (e.target === logoutModal) logoutModal.classList.remove('active');
    });
}
