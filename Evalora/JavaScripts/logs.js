let auditData = [];

async function fetchLogs() {
    try {
        const response = await window.api.getLogs();
        auditData = response || [];
        populateActionFilter(auditData);
        renderLogs(auditData);
    } catch (error) {
        console.error("Failed to fetch logs:", error);
    }
}

function populateActionFilter(logs) {
    const actionFilter = document.getElementById('actionFilter');
    if (!actionFilter) return;

    // Extract main action category (before colon or dash with details)
    const getMainAction = (action) => {
        if (!action) return null;
        // Remove details after colon (e.g., "Project created: myproject" -> "Project created")
        let main = action.split(':')[0].trim();
        // Also handle " - " for score details
        main = main.split(' - ')[0].trim();
        return main;
    };

    // Get unique main actions from logs
    const uniqueActions = [...new Set(logs.map(log => getMainAction(log.action)).filter(Boolean))];
    uniqueActions.sort();

    // Clear existing options and add "All Actions"
    actionFilter.innerHTML = '<option value="">All Actions</option>';

    uniqueActions.forEach(action => {
        const option = document.createElement('option');
        option.value = action;
        option.textContent = action;
        actionFilter.appendChild(option);
    });
}


function formatDate(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return date.toLocaleDateString('en-US', options);
}

function renderLogs(logs) {
    const tbody = document.getElementById('auditTableBody');
    if (!tbody) return;
    tbody.innerHTML = '';

    if (logs.length === 0) {
        document.querySelector('.empty-message').style.display = 'block';
    } else {
        document.querySelector('.empty-message').style.display = 'none';
    }

    logs.forEach(log => {
        const row = document.createElement('tr');
        // Robust check for user name
        const userName = (log.user && typeof log.user === 'object' && log.user.name)
            ? log.user.name
            : 'System/Guest';

        row.innerHTML = `
            <td>${userName}</td>
            <td>${log.action}</td>
            <td>${formatDate(log.createdAt)}</td>
            <td>${log.details || 'No details'}</td>
        `;
        tbody.appendChild(row);
    });
}

// Export CSV functionality
function exportCSV() {
    if (auditData.length === 0) {
        showAlert("No logs to export", "info");
        return;
    }
    const csvContent = convertToCSV(auditData);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', `audit_logs_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

function convertToCSV(data) {
    const headers = ['User', 'Action', 'Date', 'Details'];
    const rows = data.map(row => {
        const userName = (row.user && typeof row.user === 'object' && row.user.name)
            ? row.user.name
            : 'System/Guest';
        return [
            userName,
            row.action,
            formatDate(row.createdAt),
            row.details || ''
        ];
    });

    const csvRows = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ];

    return csvRows.join('\n');
}

// Search functionality
document.getElementById('searchInput').addEventListener('input', applyFilters);
document.getElementById('dateFilter').addEventListener('change', applyFilters);
document.getElementById('actionFilter').addEventListener('change', applyFilters);

function applyFilters() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const selectedDate = document.getElementById('dateFilter').value;
    const selectedAction = document.getElementById('actionFilter').value;

    const filtered = auditData.filter(log => {
        const userName = (log.user && typeof log.user === 'object' && log.user.name)
            ? log.user.name.toLowerCase()
            : 'system/guest';

        const action = (log.action || '').toLowerCase();
        const details = (log.details || '').toLowerCase();
        const createdAt = new Date(log.createdAt);

        // Search filter
        const matchesSearch = !searchTerm ||
            userName.includes(searchTerm) ||
            action.includes(searchTerm) ||
            details.includes(searchTerm);

        // Action filter - match by main category (startsWith)
        const matchesAction = !selectedAction || log.action.startsWith(selectedAction);

        // Date filter
        let matchesDate = true;
        const now = new Date();
        if (selectedDate === 'Today') {
            matchesDate = createdAt.toDateString() === now.toDateString();
        } else if (selectedDate === 'Last 7 Days') {
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(now.getDate() - 7);
            matchesDate = createdAt >= sevenDaysAgo;
        } else if (selectedDate === 'Last 30 Days') {
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(now.getDate() - 30);
            matchesDate = createdAt >= thirtyDaysAgo;
        }

        return matchesSearch && matchesAction && matchesDate;
    });

    renderLogs(filtered);
}

// Logout Modal logic
const logoutBtn = document.getElementById('logoutBtn');

if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
        if (await showConfirm('Are you sure you want to logout?', 'Confirm Logout')) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = 'login.html';
        }
    });
}

// Initial fetch
document.addEventListener('DOMContentLoaded', fetchLogs);
