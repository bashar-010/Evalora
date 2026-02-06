let allCompanies = [];

async function fetchCompanies() {
    try {
        allCompanies = await window.api.getPendingCompanies(); // This endpoint returns all companies in adminRoutes.js
        renderCompanies(allCompanies);
    } catch (error) {
        console.error("Failed to fetch companies:", error);
        showAlert("Error fetching companies. Make sure you are logged in as admin.", "error");
    }
}

function renderCompanies(companies) {
    const tbody = document.getElementById('companiesTable');
    tbody.innerHTML = '';

    companies.forEach(company => {
        const row = document.createElement('tr');
        const statusClass = company.status === 'active' ? 'status-active' : 'status-pending';

        row.innerHTML = `
            <td>${company.name}</td>
            <td>${company.email}</td>
            <td>${company.website || 'N/A'}</td>
            <td>${company.contactPerson || 'N/A'}</td>
            <td><span class="status-badge ${statusClass}">${company.status}</span></td>
            <td>
                <div class="action-buttons">
                    ${company.status === 'pending' ?
                `<button class="btn-submit" onclick="activateCompany('${company._id}')">Activate</button>` :
                `<button class="btn-cancel" onclick="deactivateCompany('${company._id}')">Deactivate</button>`
            }
                    <button class="action-btn" onclick="deleteCompany('${company._id}')" title="Delete">
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

async function activateCompany(id) {
    if (await showConfirm("Are you sure you want to activate this company?")) {
        try {
            await window.api.activateCompany(id);
            await showAlert("Company activated successfully!");
            fetchCompanies();
        } catch (error) {
            await showAlert(error.message, "error");
        }
    }
}

async function deactivateCompany(id) {
    if (await showConfirm("Are you sure you want to deactivate this company?")) {
        try {
            await window.api.deactivateCompany(id);
            await showAlert("Company deactivated!");
            fetchCompanies();
        } catch (error) {
            await showAlert(error.message, "error");
        }
    }
}

async function deleteCompany(id) {
    if (await showConfirm("Are you sure you want to delete this company?")) {
        try {
            await window.api.deleteCompany(id);
            await showAlert("Company deleted!");
            fetchCompanies();
        } catch (error) {
            await showAlert(error.message, "error");
        }
    }
}

// Modal handling
function openModal() {
    document.getElementById('companyModal').style.display = 'block';
}

function closeModal() {
    document.getElementById('companyModal').style.display = 'none';
    document.getElementById('companyForm').reset();
}

// Form submission
document.getElementById('companyForm').addEventListener('submit', async function (e) {
    e.preventDefault();

    const data = {
        name: document.getElementById('compName').value,
        email: document.getElementById('compEmail').value,
        password: document.getElementById('compPassword').value,
        website: document.getElementById('compWebsite').value,
        contactPerson: document.getElementById('compContact').value
    };

    try {
        await window.api.createCompany(data);
        await showAlert("Company created successfully!");
        closeModal();
        fetchCompanies();
    } catch (error) {
        await showAlert(error.message, "error");
    }
});

function applySearch() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();

    const filtered = allCompanies.filter(company => {
        const matchesName = company.name && company.name.toLowerCase().includes(searchTerm);
        const matchesEmail = company.email && company.email.toLowerCase().includes(searchTerm);
        return matchesName || matchesEmail;
    });

    renderCompanies(filtered);
}

// Initial fetch
document.addEventListener('DOMContentLoaded', () => {
    fetchCompanies();

    // Logout logic
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            if (await showConfirm("Are you sure you want to log out?")) {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                window.location.href = "login.html";
            }
        });
    }
});
