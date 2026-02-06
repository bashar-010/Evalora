// Sample data for the audit logs
let auditData = [
    {
        admin: 'Reem',
        action: 'AI Chatbot',
        date: 'Mar 15, 2025',
        details: 'Deadline changed 12/20 → 12/25'
    },
    {
        admin: 'Sara',
        action: 'Python Bootcamp',
        date: 'Mar 15, 2025',
        details: 'Status: Pending → Approved'
    }
];

// Export CSV functionality
function exportCSV() {
    const csvContent = convertToCSV(auditData);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', 'audit_logs.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

function convertToCSV(data) {
    const headers = ['Admin', 'Action', 'Date', 'Details'];
    const rows = data.map(row => [
        row.admin,
        row.action,
        row.date,
        row.details
    ]);
    
    const csvRows = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ];
    
    return csvRows.join('\n');
}

// Search functionality
const searchInput = document.getElementById('searchInput');
searchInput.addEventListener('input', filterTable);

// Filter functionality
const dateFilter = document.getElementById('dateFilter');
const actionFilter = document.getElementById('actionFilter');

dateFilter.addEventListener('change', filterTable);
actionFilter.addEventListener('change', filterTable);

function filterTable() {
    const searchTerm = searchInput.value.toLowerCase();
    const selectedDate = dateFilter.value;
    const selectedAction = actionFilter.value;
    
    const tableBody = document.getElementById('auditTableBody');
    const rows = tableBody.getElementsByTagName('tr');
    
    let visibleCount = 0;
    
    for (let row of rows) {
        const admin = row.cells[0].textContent.toLowerCase();
        const action = row.cells[1].textContent;
        const date = row.cells[2].textContent;
        const details = row.cells[3].textContent.toLowerCase();
        
        let showRow = true;
        
        // Search filter
        if (searchTerm && !admin.includes(searchTerm) && !details.includes(searchTerm)) {
            showRow = false;
        }
        
        // Action filter
        if (selectedAction !== 'All Actions' && action !== selectedAction) {
            showRow = false;
        }
        
        // Date filter (simplified - would need more complex logic for real implementation)
        if (selectedDate !== 'All Dates') {
            // Add date filtering logic here
        }
        
        row.style.display = showRow ? '' : 'none';
        if (showRow) visibleCount++;
    }
}

// Get elements
        const logoutBtn = document.getElementById('logoutBtn');
        const logoutModal = document.getElementById('logoutModal');
        const cancelBtn = document.getElementById('cancelBtn');
        const confirmBtn = document.getElementById('confirmBtn');

        // Show modal when logout is clicked
        logoutBtn.addEventListener('click', function() {
            logoutModal.classList.add('active');
        });

        // Hide modal when cancel is clicked
        cancelBtn.addEventListener('click', function() {
            logoutModal.classList.remove('active');
        });

        // Handle logout confirmation
        confirmBtn.addEventListener('click', function() {
            // Add your logout logic here
            alert('Logging out...');
            logoutModal.classList.remove('active');
            // Example: window.location.href = '/login';
        });

        // Close modal when clicking outside
        logoutModal.addEventListener('click', function(e) {
            if (e.target === logoutModal) {
                logoutModal.classList.remove('active');
            }
        });

