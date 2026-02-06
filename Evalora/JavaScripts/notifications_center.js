document.addEventListener('DOMContentLoaded', () => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    updateSidebar(user.role);
    fetchNotifications();
    setupLogout();
});

function updateSidebar(role) {
    const navMenu = document.getElementById('navMenu');
    if (!navMenu) return;

    let items = '';
    if (role === 'admin') {
        items = `
            <div class="nav-icon" data-tooltip="Dashboard"><a href="dashboard.html"><svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg></a></div>
            <div class="nav-icon" data-tooltip="General"><a href="settings.html"><img src="photos/settingg.svg" width="30px"></a></div>
            <div class="nav-icon" data-tooltip="Roles"><a href="roles.html"><img src="photos/roles.png" width="30px"></a></div>
            <div class="nav-icon active" data-tooltip="Notifications"><a href="notifications_center.html"><img src="photos/notificationnn.png" width="30px"></a></div>
            <div class="nav-icon" data-tooltip="Logs"><a href="logs.html"><img src="photos/logs.svg" width="30px"></a></div>
        `;
    } else if (role === 'company') {
        items = `
            <div class="nav-icon" data-tooltip="Dashboard"><a href="company_dashboard.html"><svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg></a></div>
            <div class="nav-icon" data-tooltip="Manage Jobs"><a href="managesopport.html"><img src="photos/logs.svg" width="30px"></a></div>
            <div class="nav-icon active" data-tooltip="Notifications"><a href="notifications_center.html"><img src="photos/notificationnn.png" width="30px"></a></div>
        `;
    } else {
        items = `
            <div class="nav-icon" data-tooltip="Feed"><a href="posts.html"><svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h6v6H4V4zm10 0h6v6h-6V4zM4 14h6v6H4v-6zm10 3h6m-6 3h4"/></svg></a></div>
            <div class="nav-icon" data-tooltip="My Profile"><a href="profile.html"><img src="photos/account.png" width="30px"></a></div>
            <div class="nav-icon active" data-tooltip="Notifications"><a href="notifications_center.html"><img src="photos/notificationnn.png" width="30px"></a></div>
        `;
    }
    navMenu.innerHTML = items;
}

async function fetchNotifications() {
    const list = document.getElementById('notificationsList');
    try {
        const response = await window.api.getMyNotifications();
        const notifs = response.notifications || [];

        if (notifs.length === 0) {
            list.innerHTML = '<div style="text-align: center; color: #94a3b8; padding: 60px;"><p>No notifications yet.</p></div>';
            return;
        }

        list.innerHTML = notifs.map(n => `
            <div class="notification-card ${n.isRead ? '' : 'unread'}" onclick="handleNotifAction('${n._id}', '${n.link || ''}')">
                <div class="notif-icon">${getIconForType(n.type)}</div>
                <div class="notif-content">
                    <div class="notif-title">${n.title}</div>
                    <div class="notif-message">${n.message}</div>
                    <div class="notif-time">${formatDate(n.createdAt)}</div>
                </div>
                <div class="delete-notif" onclick="event.stopPropagation(); deleteNotif('${n._id}')" title="Delete">
                    &times;
                </div>
            </div>
        `).join('');
    } catch (error) {
        list.innerHTML = `<div style="text-align: center; color: #ef4444; padding: 60px;"><p>Error: ${error.message}</p></div>`;
    }
}

function getIconForType(type) {
    switch (type) {
        case 'opportunity': return '🏢';
        case 'project': return '📁';
        case 'admin': return '🛡️';
        default: return '🔔';
    }
}

function formatDate(dateString) {
    const d = new Date(dateString);
    return d.toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

async function handleNotifAction(id, link) {
    try {
        await window.api.markNotificationRead(id);
        if (link) {
            window.location.href = link;
        } else {
            fetchNotifications(); // Just refresh if no link
        }
    } catch (e) { console.error(e); }
}

async function deleteNotif(id) {
    try {
        await window.api.deleteNotification(id);
        fetchNotifications();
    } catch (e) { console.error(e); }
}


function setupLogout() {
    const logoutBtn = document.getElementById('logoutBtn');
    const modal = document.getElementById('logoutModal');
    const cancel = document.getElementById('cancelBtn');
    const confirm = document.getElementById('confirmBtn');

    if (logoutBtn && modal) {
        // Force replace onclick with listener
        logoutBtn.onclick = null;
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            modal.classList.add('active');
            modal.style.display = 'flex'; // Fail-safe
        });
    }

    if (cancel && modal) {
        cancel.onclick = null;
        cancel.addEventListener('click', () => {
            modal.classList.remove('active');
            modal.style.display = '';
        });
    }

    if (confirm) {
        confirm.onclick = null;
        confirm.addEventListener('click', () => {
            localStorage.clear();
            window.location.href = 'index.html';
        });
    }

    // Close on overlay click
    if (modal) {
        modal.onclick = (e) => {
            if (e.target === modal) {
                modal.classList.remove('active');
                modal.style.display = '';
            }
        };
    }
}

