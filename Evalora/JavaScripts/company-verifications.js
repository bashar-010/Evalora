// company-verifications.js - Company verifications dashboard logic

let pendingProjects = [];
let verifiedProjects = [];
let currentProject = null;
let currentTab = 'pending';

// Switch between tabs
function switchTab(tab) {
    currentTab = tab;

    // Update tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');

    // Update tab content
    document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
    if (tab === 'pending') {
        document.getElementById('pendingTab').classList.add('active');
    } else {
        document.getElementById('verifiedTab').classList.add('active');
    }
}

// Load pending projects
async function loadPendingProjects() {
    try {
        const response = await window.api.getCompanyPendingProjects();
        pendingProjects = response.projects || [];
        renderPendingProjects();
    } catch (error) {
        console.error('Error loading pending projects:', error);
        document.getElementById('pendingProjects').innerHTML = `
            <div class="empty-state">
                <p>Failed to load pending verifications</p>
            </div>
        `;
    }
}

// Load verified projects
async function loadVerifiedProjects() {
    try {
        const response = await window.api.getCompanyVerifiedProjects();
        verifiedProjects = response.projects || [];
        renderVerifiedProjects();
    } catch (error) {
        console.error('Error loading verified projects:', error);
        document.getElementById('verifiedProjects').innerHTML = `
            <div class="empty-state">
                <p>Failed to load verified projects</p>
            </div>
        `;
    }
}

// Render pending projects
function renderPendingProjects() {
    const container = document.getElementById('pendingProjects');

    if (pendingProjects.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                <h3>No Pending Verifications</h3>
                <p>All project verifications are up to date!</p>
            </div>
        `;
        return;
    }

    container.innerHTML = pendingProjects.map(project => `
        <div class="project-card">
            <h3>${project.title}</h3>
            
            <div class="project-meta">
                <div class="meta-row">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                    </svg>
                    <span>${project.user?.name || 'Unknown Student'}</span>
                </div>
                <div class="meta-row">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                        <line x1="16" y1="2" x2="16" y2="6"/>
                        <line x1="8" y1="2" x2="8" y2="6"/>
                        <line x1="3" y1="10" x2="21" y2="10"/>
                    </svg>
                    <span>${new Date(project.createdAt).toLocaleDateString()}</span>
                </div>
            </div>
            
            ${project.description ? `
                <p class="project-description">${project.description}</p>
            ` : ''}
            
            ${project.technologies && project.technologies.length > 0 ? `
                <div class="tech-tags">
                    ${project.technologies.slice(0, 5).map(tech => `
                        <span class="tech-tag">${tech}</span>
                    `).join('')}
                    ${project.technologies.length > 5 ? `<span class="tech-tag">+${project.technologies.length - 5}</span>` : ''}
                </div>
            ` : ''}
            
            <div class="project-actions">
                <button class="btn btn-view" onclick="viewProject('${project._id}', 'pending')">
                    View Details
                </button>
                <button class="btn btn-verify" onclick="quickVerify('${project._id}', true)">
                    ✓ Verify
                </button>
                <button class="btn btn-reject" onclick="quickVerify('${project._id}', false)">
                    ✗ Reject
                </button>
            </div>
        </div>
    `).join('');
}

// Render verified projects
function renderVerifiedProjects() {
    const container = document.getElementById('verifiedProjects');

    if (verifiedProjects.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                <h3>No Verified Projects Yet</h3>
                <p>Verified projects will appear here</p>
            </div>
        `;
        return;
    }

    container.innerHTML = verifiedProjects.map(project => `
        <div class="project-card">
            <h3>${project.title}</h3>
            
            <div class="project-meta">
                <div class="meta-row">
                    <span class="meta-label">Student:</span>
                    <span class="meta-value">${project.user?.name || 'N/A'}</span>
                </div>
                <div class="meta-row">
                    <span class="meta-label">Score:</span>
                    <span class="meta-value">${project.user?.score || 0}/100</span>
                </div>
                <div class="meta-row">
                    <span class="meta-label">Verified:</span>
                    <span class="meta-value">${new Date(project.updatedAt).toLocaleDateString()}</span>
                </div>
            </div>
            
            ${project.description ? `
                <p class="project-description">${project.description}</p>
            ` : ''}
            
            ${project.companyScore !== null ? `
                <div class="score-display">
                    <span class="score-label">Your Score:</span>
                    <span class="score-value">${project.companyScore}/100</span>
                </div>
            ` : ''}
            
            ${project.technologies && project.technologies.length > 0 ? `
                <div class="tech-tags">
                    ${project.technologies.slice(0, 5).map(tech => `
                        <span class="tech-tag">${tech}</span>
                    `).join('')}
                    ${project.technologies.length > 5 ? `<span class="tech-tag">+${project.technologies.length - 5}</span>` : ''}
                </div>
            ` : ''}
            
            <div class="project-actions">
                <button class="btn btn-view" onclick="viewProject('${project._id}', 'verified')">
                    View Details
                </button>
                <button class="btn btn-update" onclick="openScoreUpdate('${project._id}')">
                    Update Score
                </button>
            </div>
        </div>
    `).join('');
}

// View project details in modal
function viewProject(projectId, type) {
    const projects = type === 'pending' ? pendingProjects : verifiedProjects;
    currentProject = projects.find(p => p._id === projectId);

    if (!currentProject) return;

    const modalInfo = document.getElementById('modalProjectInfo');
    modalInfo.innerHTML = `
        <div class="info-row">
            <span class="info-label">Project Title:</span>
            <span class="info-value">${currentProject.title}</span>
        </div>
        <div class="info-row">
            <span class="info-label">Student:</span>
            <span class="info-value">${currentProject.user?.name || 'N/A'}</span>
        </div>
        <div class="info-row">
            <span class="info-label">Email:</span>
            <span class="info-value">${currentProject.user?.email || 'N/A'}</span>
        </div>
        <div class="info-row">
            <span class="info-label">Submitted:</span>
            <span class="info-value">${new Date(currentProject.createdAt).toLocaleDateString()}</span>
        </div>
        ${currentProject.repoUrl ? `
            <div class="info-row">
                <span class="info-label">Repository:</span>
                <span class="info-value">
                    <a href="${currentProject.repoUrl}" target="_blank" style="color: #83c8c8; text-decoration: none;">View Repo</a>
                </span>
            </div>
        ` : ''}
        ${currentProject.description ? `
            <div class="info-description">
                <strong>Description:</strong><br>
                ${currentProject.description}
            </div>
        ` : ''}
        ${currentProject.technologies && currentProject.technologies.length > 0 ? `
            <div class="info-description">
                <strong>Technologies:</strong><br>
                <div class="tech-tags" style="margin-top: 10px;">
                    ${currentProject.technologies.map(tech => `<span class="tech-tag">${tech}</span>`).join('')}
                </div>
            </div>
        ` : ''}
        ${currentProject.companyFeedback ? `
            <div class="info-description">
                <strong>Your Feedback:</strong><br>
                ${currentProject.companyFeedback}
            </div>
        ` : ''}
    `;

    // Show appropriate form
    if (type === 'pending') {
        document.getElementById('modalVerificationForm').style.display = 'block';
        document.getElementById('modalScoreForm').style.display = 'none';
    } else {
        document.getElementById('modalVerificationForm').style.display = 'none';
        document.getElementById('modalScoreForm').style.display = 'none';
    }

    document.getElementById('verificationModal').classList.add('active');
}

// Quick verify (without modal)
async function quickVerify(projectId, verified) {
    currentProject = pendingProjects.find(p => p._id === projectId);
    if (!currentProject) return;

    const confirm = await showAlert(
        `Are you sure you want to ${verified ? 'verify' : 'reject'} "${currentProject.title}"?`,
        verified ? 'info' : 'warning'
    );

    try {
        await window.api.verifyCompanyProject(projectId, verified, '', null, null);
        await showAlert(
            `Project ${verified ? 'verified' : 'rejected'} successfully!`,
            'success'
        );

        // Reload both lists
        await loadPendingProjects();
        await loadVerifiedProjects();
    } catch (error) {
        await showAlert(error.message || 'Failed to update verification status', 'error');
    }
}

// Submit verification from modal
async function submitVerification(verified) {
    if (!currentProject) return;

    const feedback = document.getElementById('modalFeedback').value.trim();
    const scoreInput = document.getElementById('modalScore').value;
    const score = scoreInput ? parseInt(scoreInput) : null;

    if (score !== null && (isNaN(score) || score < 0 || score > 100)) {
        await showAlert('Please enter a valid score between 0 and 100', 'error');
        return;
    }

    try {
        await window.api.verifyCompanyProject(currentProject._id, verified, feedback, score, null);
        await showAlert(
            `Project ${verified ? 'verified' : 'rejected'} successfully!`,
            'success'
        );

        closeModal();

        // Reload both lists
        await loadPendingProjects();
        await loadVerifiedProjects();
    } catch (error) {
        await showAlert(error.message || 'Failed to submit verification', 'error');
    }
}

// Open score update modal
function openScoreUpdate(projectId) {
    currentProject = verifiedProjects.find(p => p._id === projectId);
    if (!currentProject) return;

    // Populate modal with project info
    const modalInfo = document.getElementById('modalProjectInfo');
    modalInfo.innerHTML = `
        <div class="info-row">
            <span class="info-label">Project Title:</span>
            <span class="info-value">${currentProject.title}</span>
        </div>
        <div class="info-row">
            <span class="info-label">Student:</span>
            <span class="info-value">${currentProject.user?.name || 'N/A'}</span>
        </div>
        <div class="info-row">
            <span class="info-label">Current Score:</span>
            <span class="info-value">${currentProject.companyScore || 'Not scored'}/100</span>
        </div>
        ${currentProject.description ? `
            <div class="info-description">
                <strong>Description:</strong><br>
                ${currentProject.description}
            </div>
        ` : ''}
        ${currentProject.companyFeedback ? `
            <div class="info-description">
                <strong>Previous Feedback:</strong><br>
                ${currentProject.companyFeedback}
            </div>
        ` : ''}
    `;

    // Pre-fill score update form
    document.getElementById('updateScore').value = currentProject.companyScore || '';
    document.getElementById('updateFeedback').value = currentProject.companyFeedback || '';

    // Show score form, hide verification form
    document.getElementById('modalVerificationForm').style.display = 'none';
    document.getElementById('modalScoreForm').style.display = 'block';

    // Open modal
    document.getElementById('verificationModal').classList.add('active');
}

// Submit score update
async function submitScoreUpdate() {
    if (!currentProject) return;

    const scoreInput = document.getElementById('updateScore').value;
    const score = parseInt(scoreInput);
    const feedback = document.getElementById('updateFeedback').value.trim();

    if (isNaN(score) || score < 0 || score > 100) {
        await showAlert('Please enter a valid score between 0 and 100', 'error');
        return;
    }

    try {
        await window.api.updateCompanyProjectScore(currentProject._id, score, feedback);
        await showAlert('Score updated successfully!', 'success');

        closeModal();
        await loadVerifiedProjects();
    } catch (error) {
        await showAlert(error.message || 'Failed to update score', 'error');
    }
}

// Close modal
function closeModal() {
    document.getElementById('verificationModal').classList.remove('active');
    document.getElementById('modalFeedback').value = '';
    document.getElementById('modalScore').value = '';
    document.getElementById('updateScore').value = '';
    document.getElementById('updateFeedback').value = '';
    currentProject = null;
}

// Logout functionality
document.getElementById('logoutBtn')?.addEventListener('click', () => {
    document.getElementById('confirmPopup').style.display = 'flex';
});

document.getElementById('yesBtn')?.addEventListener('click', () => {
    localStorage.clear();
    window.location.href = 'login.html';
});

document.getElementById('noBtn')?.addEventListener('click', () => {
    document.getElementById('confirmPopup').style.display = 'none';
});

// Initialize on page load
document.addEventListener('DOMContentLoaded', async () => {
    await loadPendingProjects();
    await loadVerifiedProjects();
});
