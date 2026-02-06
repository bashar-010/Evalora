
let opportunities = [];
let nextId = 7;
let editingId = null;

function formatDate(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return date.toLocaleDateString('en-US', options).replace(',', '');
}

async function fetchOpportunities() {
    try {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        let response;

        // Try both endpoints or just default to mine if company.
        // Assuming user.role check was valuable or we use api.getMyOpportunities() for consistency
        if (user.role === 'company') {
            response = await window.api.getMyOpportunities();
            const addBtn = document.getElementById('addOppBtn');
            if (addBtn) addBtn.style.display = 'block';
        } else {
            // Admin fallback or similar
            response = await window.api.getAllOpportunities();
        }

        opportunities = response.opportunities || [];
        populateFilters(opportunities);
        renderOpportunities(opportunities);
    } catch (error) {
        console.error("Failed to fetch opportunities:", error);
        // Using existing showCustomAlert check if available, else fallback
        if (typeof showCustomAlert === 'function') {
            showCustomAlert('Failed to load opportunities.', 'error');
        } else if (typeof showAlert === 'function') {
            showAlert('Failed to load opportunities.', 'error');
        } else {
            console.error(error);
        }
    }
}

function populateFilters(data) {
    const types = [...new Set(data.map(o => o.type).filter(Boolean))];
    const providers = [...new Set(data.map(o => o.company?.name || 'My Company').filter(Boolean))];
    const locations = [...new Set(data.map(o => o.location).filter(Boolean))];
    const statuses = [...new Set(data.map(o => o.status).filter(Boolean))];

    const filterType = document.getElementById('filterType');
    const filterProvider = document.getElementById('filterProvider');
    const filterLocation = document.getElementById('filterLocation');
    const filterStatus = document.getElementById('filterStatus');

    // Helper to populate select
    const populate = (selectElement, values, defaultText) => {
        if (!selectElement) return;
        const currentValue = selectElement.value;
        selectElement.innerHTML = `<option value="">${defaultText}</option>`;
        values.forEach(val => {
            const option = document.createElement('option');
            option.value = val;
            option.textContent = val;
            selectElement.appendChild(option);
        });
        if (values.includes(currentValue)) {
            selectElement.value = currentValue;
        }
    };

    populate(filterType, types, 'All Types');
    populate(filterProvider, providers, 'All Providers');
    populate(filterLocation, locations, 'All Locations');
    populate(filterStatus, statuses, 'All Statuses');
}

function renderOpportunities(data = opportunities) {
    const tbody = document.getElementById('opportunitiesTable');
    if (!tbody) return;
    tbody.innerHTML = '';

    if (!data || data.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;">No opportunities found.</td></tr>';
        return;
    }

    data.forEach(opp => {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        const providerName = opp.company?.name || (user.role === 'company' ? user.name : 'Admin');

        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${opp.title}</td>
            <td>${providerName}</td>
            <td>${opp.type || 'N/A'}</td>
            <td>${opp.location || 'N/A'}</td>
            <td>${formatDate(opp.deadline)}</td>
            <td><span class="status-badge ${opp.status === 'ON-SITE' ? 'status-active' : 'status-pending'}">${opp.status}</span></td>
            <td>
                <div class="action-buttons">
                    <button class="action-btn" onclick="duplicateOpportunity('${opp._id}')" title="Duplicate">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                    </button>
                    <button class="action-btn" onclick="deleteOpportunity('${opp._id}')" title="Delete">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                    </button>
                </div>
            </td>
        `;
        tbody.appendChild(row);
    });
}

function openModal() {
    const modal = document.getElementById('opportunityModal');
    const modalTitle = document.getElementById('modalTitle');

    modalTitle.textContent = 'Add Opportunity';
    document.getElementById('opportunityForm').reset();
    if (document.getElementById('opportunityId')) document.getElementById('opportunityId').value = '';
    editingId = null;

    // Auto-fill provider name
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    document.getElementById('provider').value = user.name || (user.role === 'admin' ? 'Admin' : '');

    modal.classList.add('active');
}

function closeModal() {
    const modal = document.getElementById('opportunityModal');
    modal.classList.remove('active');
    document.getElementById('opportunityForm').reset();
    editingId = null;
}


function duplicateOpportunity(id) {
    const opp = opportunities.find(o => o._id === id);
    if (!opp) return;

    editingId = null;
    document.getElementById('opportunityId').value = '';

    document.getElementById('title').value = opp.title + ' (Copy)';
    document.getElementById('provider').value = document.getElementById('provider').value || 'Me';
    document.getElementById('type').value = opp.type;
    document.getElementById('location').value = opp.location;
    document.getElementById('deadline').value = opp.deadline ? opp.deadline.split('T')[0] : '';
    document.getElementById('status').value = opp.status;
    document.getElementById('description').value = opp.description || '';
    if (document.getElementById('duration')) document.getElementById('duration').value = opp.duration || '';
    if (document.getElementById('requirements')) document.getElementById('requirements').value = opp.requirements ? opp.requirements.join(', ') : '';
    if (document.getElementById('responsibilities')) document.getElementById('responsibilities').value = opp.responsibilities ? opp.responsibilities.join(', ') : '';

    const modal = document.getElementById('opportunityModal');
    const modalTitle = document.getElementById('modalTitle');
    modalTitle.textContent = 'Add Opportunity';
    modal.classList.add('active');
}

async function deleteOpportunity(id) {
    // Assuming showAlert / showConfirm exist in environment or api.js adds them?
    // Using simple confirm if custom not found to be safe?
    // The existing code used showConfirm. I'll stick to it.
    if (typeof showConfirm !== 'function') {
        if (!confirm('Are you sure you want to delete?')) return;
    } else {
        if (!await showConfirm('Are you sure you want to delete this opportunity?')) return;
    }

    try {
        await window.api.deleteOpportunity(id);
        if (typeof showAlert === 'function') await showAlert('Opportunity deleted successfully');
        else alert('Deleted');
        fetchOpportunities();
    } catch (error) {
        console.error(error);
        if (typeof showAlert === 'function') await showAlert(error.message, 'error');
    }
}

function applyFilters() {
    const filterType = document.getElementById('filterType');
    const filterProvider = document.getElementById('filterProvider');
    const filterLocation = document.getElementById('filterLocation');
    const filterStatus = document.getElementById('filterStatus');

    const typeVal = filterType ? filterType.value : '';
    const provVal = filterProvider ? filterProvider.value : '';
    const locVal = filterLocation ? filterLocation.value : '';
    const statVal = filterStatus ? filterStatus.value : '';

    let filtered = opportunities;

    if (typeVal) filtered = filtered.filter(opp => opp.type === typeVal);
    if (provVal) filtered = filtered.filter(opp => (opp.company?.name || 'My Company') === provVal);
    if (locVal) filtered = filtered.filter(opp => opp.location === locVal);
    if (statVal) filtered = filtered.filter(opp => opp.status === statVal);

    renderOpportunities(filtered);
}

document.getElementById('opportunityForm').addEventListener('submit', async function (e) {
    e.preventDefault();

    const formData = {
        title: document.getElementById('title').value,
        type: document.getElementById('type').value,
        location: document.getElementById('location').value,
        deadline: document.getElementById('deadline').value,
        status: document.getElementById('status').value,
        description: document.getElementById('description').value,
        duration: document.getElementById('duration')?.value || '3 Months'
    };

    const reqs = document.getElementById('requirements')?.value;
    if (reqs) formData.requirements = reqs.split(',').map(s => s.trim()).filter(Boolean);

    const resps = document.getElementById('responsibilities')?.value;
    if (resps) formData.responsibilities = resps.split(',').map(s => s.trim()).filter(Boolean);

    try {
        await window.api.createOpportunity(formData);
        if (typeof showAlert === 'function') await showAlert('Opportunity created successfully!');

        fetchOpportunities();
        closeModal();
    } catch (error) {
        if (typeof showAlert === 'function') await showAlert(error.message, 'error');
        else console.error(error);
    }
});

// Close modal when clicking outside
document.getElementById('opportunityModal').addEventListener('click', function (e) {
    if (e.target === this) {
        closeModal();
    }
});

// Initial fetch
document.addEventListener('DOMContentLoaded', () => {
    fetchOpportunities();

    // Logout logic
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            if (await showConfirm("Are you sure you want to logout?")) {
                localStorage.clear();
                window.location.href = 'login.html';
            }
        });
    }
}); 
