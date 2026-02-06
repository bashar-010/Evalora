// Global store for notifications
let allNotifications = [];

document.addEventListener('DOMContentLoaded', () => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const role = user.role;
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';

    renderTopNav(user, role, currentPage);
    injectLogoutModal();
    setupLogoutListeners();
});

function renderTopNav(user, role, currentPage) {
    const navbarCenter = document.getElementById('navbarCenter');
    if (!navbarCenter) return;

    let navItems = [
        { name: 'Feed', url: 'posts.html' },
        { name: 'Profile', url: 'profile.html' },
        { name: 'Opportunities', url: 'opport.html' }
    ];

    // Hide Profile tab for company users
    if (role === 'company') {
        navItems = navItems.filter(item => item.name !== 'Profile');
    }

    // Role-based logic for the 4th tab
    if (role === 'admin') {
        navItems.push({ name: 'Dashboard', url: 'dashboard.html' });
    } else if (role === 'company') {
        navItems.push({ name: 'Dashboard', url: 'company_dashboard.html' });
    }

    navbarCenter.innerHTML = navItems.map(item => {
        const isActive = currentPage === item.url ? 'class="active"' : '';
        return `<a href="${item.url}" ${isActive}>${item.name}</a>`;
    }).join('');

    // Inject Notification Center into navbar-right if logged in
    if (user && (user._id || user.id)) {
        injectNotificationCenter(role);
    }
}

function injectNotificationCenter(role) {
    const navbarRight = document.querySelector('.navbar-right');
    if (!navbarRight) return;

    // Create container
    const notifContainer = document.createElement('div');
    notifContainer.className = 'notification-container';
    notifContainer.innerHTML = `
        <button class="notif-bell" id="notifBell">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
            </svg>
            <span class="notif-badge" id="notifBadge">0</span>
        </button>
        <div class="notif-dropdown" id="notifDropdown">
            <div class="notif-header">
                <h3>Notifications</h3>
                <button class="mark-read-btn" id="markAllRead">Mark all as read</button>
            </div>
            <ul class="notif-list" id="notifList">
                <li class="notif-empty">Loading notifications...</li>
            </ul>
        </div>
    `;

    // Inject Detail Modal
    const detailModal = document.createElement('div');
    detailModal.className = 'notif-detail-overlay';
    detailModal.id = 'notifDetailModal';
    detailModal.innerHTML = `
        <div class="notif-detail-modal">
            <button class="notif-detail-close" onclick="closeNotifDetail()">&times;</button>
            <div class="notif-detail-icon" id="detailIcon">🔔</div>
            <h2 class="notif-detail-title" id="detailTitle">Notification</h2>
            <p class="notif-detail-message" id="detailMessage"></p>
            <div class="notif-detail-footer">
                <button class="notif-btn notif-btn-secondary" onclick="closeNotifDetail()">Close</button>
            </div>
        </div>
    `;

    navbarRight.insertBefore(notifContainer, navbarRight.firstChild);
    document.body.appendChild(detailModal);

    // Toggle Dropdown
    const bell = document.getElementById('notifBell');
    const dropdown = document.getElementById('notifDropdown');

    bell.addEventListener('click', (e) => {
        e.stopPropagation();
        dropdown.style.display = dropdown.style.display === 'flex' ? 'none' : 'flex';
        if (dropdown.style.display === 'flex') {
            fetchNotifications();
        }
    });

    document.addEventListener('click', () => {
        dropdown.style.display = 'none';
    });

    const markAllBtn = document.getElementById('markAllRead');
    markAllBtn.addEventListener('click', async (e) => {
        e.stopPropagation();
        try {
            await window.api.request('/notifications/read-all', 'PUT');
            fetchNotifications();
        } catch (error) {
            console.error('Failed to mark all as read:', error);
        }
    });

    // Initial Fetch
    fetchNotifications();

    // Make functions global
    window.handleNotifClick = handleNotifClick;
    window.closeNotifDetail = () => {
        document.getElementById('notifDetailModal').style.display = 'none';
    };
}

async function fetchNotifications() {
    const badge = document.getElementById('notifBadge');
    const list = document.getElementById('notifList');
    if (!badge || !list) return;

    try {
        const data = await window.api.request('/notifications', 'GET');
        allNotifications = data.notifications; // Store globally
        const unreadCount = allNotifications.filter(n => !n.isRead).length;

        if (unreadCount > 0) {
            badge.textContent = unreadCount;
            badge.style.display = 'flex';
        } else {
            badge.style.display = 'none';
        }

        if (allNotifications.length === 0) {
            list.innerHTML = '<li class="notif-empty">No notifications yet</li>';
            return;
        }

        list.innerHTML = allNotifications.map(n => `
            <li class="notif-item ${n.isRead ? '' : 'unread'}" onclick="handleNotifClick('${n._id}')">
                <div class="notif-icon ${n.type || 'system'}">
                    ${getNotifIcon(n.type)}
                </div>
                <div class="notif-content">
                    <div class="notif-title">${n.title} ${!n.isRead ? '<span style="color:#006D77; font-size:16px">•</span>' : ''}</div>
                    <div class="notif-message">${n.message}</div>
                    <div class="notif-time">${formatTime(n.createdAt)}</div>
                </div>
            </li>
        `).join('');

    } catch (error) {
        console.error('Failed to fetch notifications:', error);
        list.innerHTML = '<li class="notif-empty">Error loading notifications</li>';
    }
}

function getNotifIcon(type) {
    switch (type) {
        case 'opportunity': return '💼';
        case 'social': return '❤️';
        case 'ai': return '🤖';
        case 'project': return '🚀';
        default: return '🔔';
    }
}

function formatTime(dateStr) {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now - date;
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(mins / 60);
    const days = Math.floor(hours / 24);

    if (mins < 60) return `${mins}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
}

async function handleNotifClick(id) {
    const notification = allNotifications.find(n => n._id === id);
    if (!notification) return;

    // Show Detail Modal
    const modal = document.getElementById('notifDetailModal');
    const titleCol = document.getElementById('detailTitle');
    const messageCol = document.getElementById('detailMessage');
    const iconCol = document.getElementById('detailIcon');

    titleCol.textContent = notification.title;
    messageCol.textContent = notification.message;
    iconCol.textContent = getNotifIcon(notification.type);
    iconCol.className = `notif-detail-icon ${notification.type || 'system'}`;

    modal.style.display = 'flex';

    // Mark as read in background
    if (!notification.isRead) {
        try {
            await window.api.request(`/notifications/${id}/read`, 'PUT');
            fetchNotifications(); // Refresh to update unread status
        } catch (error) {
            console.error('Failed to mark as read:', error);
        }
    }
}

function injectLogoutModal() {
    if (document.getElementById('logoutModalOverlay')) return;

    const modalOverlay = document.createElement('div');
    modalOverlay.id = 'logoutModalOverlay';
    modalOverlay.className = 'logout-modal-overlay';
    modalOverlay.innerHTML = `
        <div class="logout-modal">
            <div class="logout-modal-icon">👋</div>
            <h2 class="logout-modal-title">Confirm Logout</h2>
            <p class="logout-modal-message">Are you sure you want to log out? You'll need to sign in again to access your account.</p>
            <div class="logout-modal-actions">
                <button class="logout-btn-action logout-btn-cancel" id="cancelLogout">Cancel</button>
                <button class="logout-btn-action logout-btn-confirm" id="confirmLogout">Yes, Logout</button>
            </div>
        </div>
    `;

    document.body.appendChild(modalOverlay);

    // Event Listeners
    modalOverlay.querySelector('#cancelLogout').addEventListener('click', () => {
        modalOverlay.classList.remove('active');
    });

    modalOverlay.querySelector('#confirmLogout').addEventListener('click', () => {
        localStorage.clear();
        window.location.href = 'login.html';
    });

    modalOverlay.addEventListener('click', (e) => {
        if (e.target === modalOverlay) modalOverlay.classList.remove('active');
    });
}

function setupLogoutListeners() {
    // Intercept clicks on any element with .nav-Logout class or #logoutBtn id
    document.addEventListener('click', (e) => {
        const logoutTarget = e.target.closest('.nav-Logout') || e.target.closest('#logoutBtn');
        if (logoutTarget) {
            e.preventDefault();
            const modal = document.getElementById('logoutModalOverlay');
            if (modal) {
                modal.classList.add('active');
            } else {
                // Fallback if modal was somehow not injected
                (async () => {
                    if (await showConfirm('Are you sure you want to logout?')) {
                        localStorage.clear();
                        window.location.href = 'login.html';
                    }
                })();
            }
        }
    });
}

