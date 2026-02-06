let projects = [];
let selectedProjectId = null;
let allCompanies = []; // Store companies for dropdown

async function fetchProjects() {
    try {
        const response = await window.api.getAllProjects();
        projects = response.projects || [];

        // Populate the projects with company information
        projects.forEach(project => {
            if (project.belongsToCompany) {
                // The backend should already populate this via mongoose populate
                project.companyName = project.belongsToCompany?.name || 'Unknown Company';
            }
        });

        renderProjects(projects);
    } catch (error) {
        console.error("Failed to fetch projects:", error);
    }
}

async function fetchCompanies() {
    try {
        const companies = await window.api.getAdminCompanies();
        allCompanies = companies || [];
    } catch (error) {
        console.error("Failed to fetch companies:", error);
    }
}

function renderProjects(projectsToRender) {
    const tbody = document.getElementById('projectsTable');
    if (!tbody) return;
    tbody.innerHTML = '';

    projectsToRender.forEach(project => {
        const row = document.createElement('tr');
        row.onclick = () => selectProject(project._id);
        if (project._id === selectedProjectId) {
            row.classList.add('selected');
        }

        let statusClass = '';
        if (project.status === 'Approved' || project.status === 'scored') statusClass = 'status-approved';
        else if (project.status === 'pending') statusClass = 'status-pending';
        else if (project.status === 'Needs Change') statusClass = 'status-needs-change';
        else if (project.status === 'awaiting_company_verification') statusClass = 'status-pending';

        // Determine company verification badge
        let companyBadge = '-';
        if (project.belongsToCompany) {
            const verStatus = project.companyVerificationStatus || 'not_applicable';
            if (verStatus === 'pending_verification') {
                companyBadge = '<span class="status-badge status-waiting">Pending</span>';
            } else if (verStatus === 'verified') {
                companyBadge = '<span class="status-badge status-approved">Verified</span>';
            } else if (verStatus === 'rejected') {
                companyBadge = '<span class="status-badge status-rejected">Rejected</span>';
            }
        }

        row.innerHTML = `
            <td>${project.title}</td>
            <td>${project.user?.name || 'N/A'}</td>
            <td>${new Date(project.createdAt).toLocaleDateString()}</td>
            <td>
                <div class="skills-cell">
                    ${(project.technologies || []).map(skill => `<span class="skill-tag">${skill}</span>`).join('')}
                </div>
            </td>
            <td><span class="status-badge ${statusClass}">${project.status}</span></td>
            <td>${companyBadge}</td>
        `;

        tbody.appendChild(row);
    });
}

function selectProject(id) {
    selectedProjectId = id;
    const project = projects.find(p => p._id === id);
    renderProjects(projects);
    showProjectDetails(project);
}

function showProjectDetails(project) {
    const detailsPanel = document.getElementById('detailsPanel');
    if (!detailsPanel) return;

    // Check if this is a company project
    const isCompanyProject = project.belongsToCompany ? true : false;
    const companyVerificationStatus = project.companyVerificationStatus || 'not_applicable';
    const isPendingVerification = companyVerificationStatus === 'pending_verification';

    let companySection = '';
    if (isCompanyProject) {
        companySection = `
            <div class="details-section">
                <h3>Company Verification</h3>
                <div class="company-info">
                    <p><strong>Company:</strong> ${project.belongsToCompany?.name || 'Unknown'}</p>
                    <p><strong>Verification Status:</strong> 
                        ${companyVerificationStatus === 'pending_verification' ? '<span class="status-badge status-waiting">Pending Verification</span>' :
                companyVerificationStatus === 'verified' ? '<span class="status-badge status-approved">Verified</span>' :
                    companyVerificationStatus === 'rejected' ? '<span class="status-badge status-rejected">Rejected</span>' :
                        'Not Applicable'}
                    </p>
                    ${project.companyScore !== null && project.companyScore !== undefined ? `<p><strong>Company Score:</strong> ${project.companyScore}/100</p>` : ''}
                    ${project.companyFeedback ? `<p><strong>Company Feedback:</strong> ${project.companyFeedback}</p>` : ''}
                </div>
                ${isPendingVerification ? `
                    <div class="admin-override-section">
                        <h4>Admin Override</h4>
                        <p style="font-size: 0.9rem; color: #888;">Company hasn't responded yet. You can manually verify or reject this association:</p>
                        <textarea id="overrideFeedback" class="reviewer-notes" placeholder="Enter feedback for this override action..."></textarea>
                        <div class="score-input-container">
                            <label for="overrideScore">Company Score (Optional, 0-100):</label>
                            <input type="number" id="overrideScore" min="0" max="100" class="score-input" placeholder="Optional">
                        </div>
                        <div class="action-buttons">
                            <button class="action-btn btn-approve" onclick="handleCompanyOverride('${project._id}', 'verified')">
                                ✓ Verify (As Admin)
                            </button>
                            <button class="action-btn btn-reject" onclick="handleCompanyOverride('${project._id}', 'rejected')">
                                ✗ Reject (As Admin)
                            </button>
                        </div>
                    </div>
                ` : ''}
            </div>
        `;
    }

    // Build AI Details section
    let aiDetailsSection = '';
    if (project.aiDetails) {
        const ai = project.aiDetails;
        aiDetailsSection = `
            <div class="details-section ai-details-section">
                <h3>AI Analysis</h3>
                <div class="ai-score-display">
                    <span class="ai-score-label">AI Score:</span>
                    <span class="ai-score-value">${project.aiScore || project.score || 0}%</span>
                </div>
                ${ai.feedback ? `<p><strong>Feedback:</strong> ${ai.feedback}</p>` : ''}
                ${ai.strengths && ai.strengths.length ? `
                    <div class="ai-list">
                        <strong>Strengths:</strong>
                        <ul>${ai.strengths.map(s => `<li>${s}</li>`).join('')}</ul>
                    </div>
                ` : ''}
                ${ai.improvements && ai.improvements.length ? `
                    <div class="ai-list">
                        <strong>Areas for Improvement:</strong>
                        <ul>${ai.improvements.map(s => `<li>${s}</li>`).join('')}</ul>
                    </div>
                ` : ''}
            </div>
        `;
    }

    detailsPanel.innerHTML = `
        <h2>${project.title}</h2>
        <p>${project.description || 'No description'}</p>
        
        <div class="details-links">
            <div><a href="#" onclick="showProjectAIDetails('${project._id}'); return false;">View Details</a></div>
            <div class="score-input-container">
                <label for="projectScore">AI Score (%):</label>
                <input type="number" id="projectScore" value="${project.score || 0}" min="0" max="100" class="score-input">
            </div>
        </div>

        ${aiDetailsSection}

        <div class="details-section">
            <h3>Technologies</h3>
            <div class="tags-container">
                ${(project.technologies || []).map(skill => `<span class="tag">${skill}</span>`).join('')}
            </div>
        </div>

        ${companySection}

        <div class="details-section">
            <h3>Reviewer Notes</h3>
            <textarea class="reviewer-notes" id="reviewerNotes">${project.reviewerNotes || ''}</textarea>
        </div>

        <div class="action-buttons">
            <button class="action-btn btn-approve" onclick="handleProjectAction('${project._id}', 'Approved')">
                <svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                </svg>
                Approve
            </button>
            <button class="action-btn btn-reject" onclick="handleProjectAction('${project._id}', 'Rejected')">
                <svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
                Reject
            </button>
            <button class="action-btn btn-needs-change" onclick="handleProjectAction('${project._id}', 'Needs Change')">
                <svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
                </svg>
                Needs Change
            </button>
        </div>
    `;
}

async function handleProjectAction(projectId, status) {
    const reviewerNotes = document.getElementById('reviewerNotes').value;
    const score = parseInt(document.getElementById('projectScore').value);

    if (isNaN(score) || score < 0 || score > 100) {
        await showAlert('Please enter a valid score (0-100)', 'error');
        return;
    }

    try {
        // Update both status, notes and score in one call
        await window.api.updateProjectStatus(projectId, status, reviewerNotes, score);

        await showAlert(`Project ${status} successfully`, 'success');
        fetchProjects();
    } catch (error) {
        await showAlert(error.message, 'error');
    }
}

async function handleCompanyOverride(projectId, verificationStatus) {
    const feedback = document.getElementById('overrideFeedback')?.value || '';
    const scoreInput = document.getElementById('overrideScore')?.value;
    const score = scoreInput ? parseInt(scoreInput) : null;

    if (score !== null && (isNaN(score) || score < 0 || score > 100)) {
        await showAlert('Please enter a valid score between 0 and 100', 'error');
        return;
    }

    try {
        await window.api.adminOverrideCompanyVerification(projectId, verificationStatus, feedback, score);
        await showAlert(`Company verification ${verificationStatus} successfully!`, 'success');
        fetchProjects();
    } catch (error) {
        await showAlert(error.message || 'Failed to override verification', 'error');
    }
}

function filterProjects() {
    const searchTerm = document.getElementById('studentSearch').value.toLowerCase();
    const skillFilter = document.getElementById('skillsFilter').value;
    const statusFilter = document.getElementById('statusFilter').value;
    const companyVerificationFilter = document.getElementById('companyVerificationFilter')?.value;

    const filtered = projects.filter(project => {
        // Search filter
        const matchesSearch = !searchTerm ||
            (project.user?.name?.toLowerCase().includes(searchTerm) || false);

        // Skills filter - check if the selected skill exists in the project's technologies array
        const matchesSkill = !skillFilter ||
            (project.technologies && Array.isArray(project.technologies) &&
                project.technologies.some(tech => tech.toLowerCase() === skillFilter.toLowerCase()));

        // Status filter - now checking for Scored, Approved, Needs Change, Rejected, awaiting_company_verification
        const matchesStatus = !statusFilter ||
            (project.status && project.status.toLowerCase() === statusFilter.toLowerCase());

        // Company verification filter
        const matchesCompanyVerification = !companyVerificationFilter ||
            (project.companyVerificationStatus === companyVerificationFilter);

        return matchesSearch && matchesSkill && matchesStatus && matchesCompanyVerification;
    });

    renderProjects(filtered);
}

// Show project AI details in an alert/modal
async function showProjectAIDetails(projectId) {
    const project = projects.find(p => p._id === projectId);
    if (!project) return;

    let detailsMessage = `<strong>Title:</strong> ${project.title}<br>`;
    detailsMessage += `<strong>Description:</strong> ${project.description || 'No description'}<br><br>`;
    detailsMessage += `<strong>AI Score:</strong> ${project.aiScore || project.score || 0}%<br>`;

    if (project.aiDetails) {
        const ai = project.aiDetails;
        if (ai.feedback) {
            detailsMessage += `<br><strong>AI Feedback:</strong><br>${ai.feedback}<br>`;
        }
        if (ai.strengths && ai.strengths.length) {
            detailsMessage += `<br><strong>Strengths:</strong><br>• ${ai.strengths.join('<br>• ')}<br>`;
        }
        if (ai.improvements && ai.improvements.length) {
            detailsMessage += `<br><strong>Areas for Improvement:</strong><br>• ${ai.improvements.join('<br>• ')}<br>`;
        }
    } else {
        detailsMessage += `<br><em>No AI analysis available for this project.</em>`;
    }

    await showAlert(detailsMessage, 'info', 'Project Details');
}

// Make function globally accessible
window.showProjectAIDetails = showProjectAIDetails;

document.addEventListener('DOMContentLoaded', () => {
    fetchProjects();
    fetchCompanies();
    document.getElementById('studentSearch')?.addEventListener('input', filterProjects);
    document.getElementById('skillsFilter')?.addEventListener('change', filterProjects);
    document.getElementById('statusFilter')?.addEventListener('change', filterProjects);
    document.getElementById('companyVerificationFilter')?.addEventListener('change', filterProjects);

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
