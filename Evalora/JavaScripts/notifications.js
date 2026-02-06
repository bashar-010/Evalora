document.addEventListener('DOMContentLoaded', () => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    updateSidebar(user.role);

    // Initialize UI from user data if available
    if (user.notificationSettings) {
        if (user.notificationSettings.email !== undefined) document.getElementById('emailChannel').checked = user.notificationSettings.email;
        if (user.notificationSettings.site !== undefined) document.getElementById('siteChannel').checked = user.notificationSettings.site;

        // Triggers
        if (user.notificationSettings.triggers) {
            const t = user.notificationSettings.triggers;
            if (t.newProjectEmail !== undefined) document.getElementById('triggerNewProjectEmail').checked = t.newProjectEmail;
            if (t.newProjectSite !== undefined) document.getElementById('triggerNewProjectSite').checked = t.newProjectSite;
            if (t.deadlineEmail !== undefined) document.getElementById('triggerDeadlineEmail').checked = t.deadlineEmail;
            if (t.deadlineSite !== undefined) document.getElementById('triggerDeadlineSite').checked = t.deadlineSite;
            if (t.registerEmail !== undefined) document.getElementById('triggerRegisterEmail').checked = t.registerEmail;
            if (t.registerSite !== undefined) document.getElementById('triggerRegisterSite').checked = t.registerSite;
            if (t.resubmitEmail !== undefined) document.getElementById('triggerResubmitEmail').checked = t.resubmitEmail;
            if (t.resubmitSite !== undefined) document.getElementById('triggerResubmitSite').checked = t.resubmitSite;
        }
    }

    // Save Settings
    document.getElementById('saveSettingsBtn')?.addEventListener('click', async () => {
        const settings = {
            notificationSettings: {
                email: document.getElementById('emailChannel').checked,
                site: document.getElementById('siteChannel').checked,
                triggers: {
                    newProjectEmail: document.getElementById('triggerNewProjectEmail').checked,
                    newProjectSite: document.getElementById('triggerNewProjectSite').checked,
                    deadlineEmail: document.getElementById('triggerDeadlineEmail').checked,
                    deadlineSite: document.getElementById('triggerDeadlineSite').checked,
                    registerEmail: document.getElementById('triggerRegisterEmail').checked,
                    registerSite: document.getElementById('triggerRegisterSite').checked,
                    resubmitEmail: document.getElementById('triggerResubmitEmail').checked,
                    resubmitSite: document.getElementById('triggerResubmitSite').checked
                }
            }
        };

        try {
            const response = await window.api.updateProfile(settings);
            // Update local user data
            const updatedUser = { ...user, ...response.user };
            localStorage.setItem('user', JSON.stringify(updatedUser));

            showAlert('Settings saved successfully!');
        } catch (error) {
            showAlert('Failed to save settings: ' + error.message, 'error');
        }
    });

    // Send Test Notifications button
    window.sendTestNotifications = async function () {
        try {
            const res = await window.api.sendTestNotification();
            let msg = 'Test notification created on-site!';
            if (res.emailSent) msg += ' Also sent to your email.';
            else msg += ' (Email was skipped or failed)';

            showAlert(msg, 'success');
        } catch (error) {
            showAlert('Failed to send test: ' + error.message, 'error');
        }
    };

    setupLogout();
});

function updateSidebar(role) {
    const navMenu = document.querySelector('.nav-menu');
    if (!navMenu) return;

    let items = '';
    if (role === 'admin') {
        items = `
            <a href="settings.html" class="nav-item" data-section="general">
                <img src="photos/settingg.svg" alt="settings" width="25px">
                General
            </a>
            <a href="roles.html" class="nav-item" data-section="roles">
                <img src="photos/roles.png" alt="" width="25px">
                Roles
            </a>
            <a href="notifications.html" class="nav-item active" data-section="notifications">
                <img src="photos/notificationnn.png" alt="" width="25px">
                Notifications
            </a>
            <a href="logs.html" class="nav-item" data-section="logs">
                <img src="photos/logs.svg" alt="" width="25px">
                Logs
            </a>
        `;
    } else if (role === 'company') {
        items = `
            <a href="company_dashboard.html" class="nav-item">
                <svg width="25" height="25" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg> Dashboard
            </a>
            <a href="managesopport.html" class="nav-item">
                <img src="photos/logs.svg" width="25px"> Manage Jobs
            </a>
            <a href="notifications.html" class="nav-item active">
                <img src="photos/notificationnn.png" width="25px"> Notifications
            </a>
        `;
    } else {
        items = `
            <a href="posts.html" class="nav-item">
                <svg width="25" height="25" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h6v6H4V4zm10 0h6v6h-6V4zM4 14h6v6H4v-6zm10 3h6m-6 3h4"/></svg> Feed
            </a>
            <a href="profile.html" class="nav-item">
                <img src="photos/account.png" width="25px"> My Profile
            </a>
            <a href="notifications.html" class="nav-item active">
                <img src="photos/notificationnn.png" width="25px"> Notifications
            </a>
        `;
    }
    navMenu.innerHTML = items;
}

function setupLogout() {
    const logoutBtn = document.getElementById('logoutBtn');

    // Logout Logic
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            if (await showConfirm("Are you sure you want to log out?", "Confirm Logout")) {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                window.location.href = "login.html";
            }
        });
    }
}