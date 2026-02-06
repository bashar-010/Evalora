async function fetchCompanyDashboard() {
    try {
        const stats = await window.api.getCompanyStats();

        // Update stats cards
        document.getElementById('totalJobs').textContent = stats.totalJobs || 0;
        document.getElementById('totalApps').textContent = stats.totalApplications || 0;
        document.getElementById('pendingApps').textContent = stats.pendingApplications || 0;
        document.getElementById('activeWeek').textContent = stats.activeThisWeek || 0;

        // Fetch pending verifications count
        try {
            const pendingResponse = await window.api.getCompanyPendingProjects();
            document.getElementById('pendingVerifications').textContent = (pendingResponse.projects || []).length;
        } catch (err) {
            console.error("Failed to load pending verifications:", err);
            document.getElementById('pendingVerifications').textContent = '0';
        }

        // Render recent applications
        renderRecentApps(stats.recentApps || []);
    } catch (error) {
        console.error("Failed to load company stats:", error);
    }
}

let currentApps = []; // Store apps globally for modal access

function renderRecentApps(apps) {
    currentApps = apps;
    const list = document.getElementById('applicationsList');
    if (!list) return;

    if (apps.length === 0) {
        list.innerHTML = '<p style="padding: 20px; color: #666;">No recent applications found.</p>';
        return;
    }

    list.innerHTML = apps.map((app, index) => `
        <div class="app-item">
            <div style="flex: 1;">
                <strong style="cursor: pointer; color: #83c8c8ff;" onclick="showStudentProfile(${index})">${app.student?.name || 'Anonymous Student'}</strong>
                <div style="font-size: 0.8em; color: #888;">Applied for: ${app.opportunityTitle}</div>
                <div class="app-status ${app.status}">${app.status.toUpperCase()}</div>
            </div>
            <div style="text-align: right; display: flex; flex-direction: column; align-items: flex-end; gap: 5px;">
                <div class="student-score">Score: ${app.student?.score || 0}%</div>
                <div style="font-size: 0.7em; color: #666;">${new Date(app.createdAt).toLocaleDateString()}</div>
                ${app.status === 'pending' ? `
                    <div class="action-btns" style="margin-top: 5px;">
                        <button class="accept-btn" onclick="updateStatus('${app.opportunityId}', '${app._id}', 'accepted')">Accept</button>
                        <button class="reject-btn" onclick="updateStatus('${app.opportunityId}', '${app._id}', 'rejected')">Reject</button>
                    </div>
                ` : ''}
            </div>
        </div>
    `).join('');
}

function showStudentProfile(index) {
    const student = currentApps[index]?.student;
    if (!student) return;

    const modal = document.getElementById('profileModal');
    const details = document.getElementById('profileDetails');

    details.innerHTML = `
        <div class="profile-header">
            <img src="${student.avatar || 'photos/default-avatar.png'}" class="profile-avatar" alt="Avatar">
            <div class="profile-info">
                <h3>${student.name}</h3>
                <p>${student.university || 'No University'} | ${student.major || 'No Major'}</p>
                <p>${student.email}</p>
            </div>
        </div>

        <div class="section-title">Skills</div>
        <div class="tags-container">
            ${(student.skills || []).map(s => `<span class="skill-tag">${s}</span>`).join('') || '<p style="font-size:0.8rem; color:#666">No skills listed</p>'}
        </div>

        <div class="section-title">AI Score Analysis</div>
        <p style="font-size: 0.9rem; margin-bottom: 20px;">
            Overall Score: <strong>${student.score}%</strong><br>
            ${student.scoreAnalysis?.summary || 'No analysis available.'}
        </p>

        <div class="section-title">Projects (${(student.projects || []).length})</div>
        ${(student.projects || []).map(p => `
            <div class="project-card">
                <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                    <div>
                        <h4 style="margin-bottom: 2px;">${p.title}</h4>
                        <span style="font-size: 0.7rem; color: #666;">Submitted: ${new Date(p.createdAt).toLocaleDateString()}</span>
                    </div>
                    ${p.repoUrl ? `<a href="${p.repoUrl}" target="_blank" style="color: #83c8c8ff; font-size: 0.8rem; text-decoration: none;">View Repo ↗</a>` : ''}
                </div>
                
                <p style="margin-top: 10px;">${p.description || 'No description'}</p>
                
                <div class="tags-container" style="margin-top:8px">
                    ${(p.technologies || []).map(t => `<span class="skill-tag" style="font-size:0.7rem">${t}</span>`).join('')}
                </div>

                <div class="project-score">AI Project Score: ${p.score}%</div>

                ${p.aiDetails ? `
                    <div style="margin-top: 15px; background: rgba(255,255,255,0.02); padding: 12px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.05);">
                        <div style="font-size: 0.8rem; color: #83c8c8ff; margin-bottom: 5px;">AI Technical Review:</div>
                        <p style="font-size: 0.8rem; color: #ddd; margin-bottom: 10px; font-style: italic;">"${p.aiDetails.summary || 'N/A'}"</p>
                        
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                            <div>
                                <div style="font-size: 0.7rem; color: #4caf50; margin-bottom: 3px;">Strengths:</div>
                                <ul style="margin: 0; padding-left: 15px; font-size: 0.7rem; color: #bbb;">
                                    ${(p.aiDetails.strengths || []).slice(0, 3).map(s => `<li>${s}</li>`).join('') || 'None identified.'}
                                </ul>
                            </div>
                            <div>
                                <div style="font-size: 0.7rem; color: #f44336; margin-bottom: 3px;">Gaps:</div>
                                <ul style="margin: 0; padding-left: 15px; font-size: 0.7rem; color: #bbb;">
                                    ${(p.aiDetails.weaknesses || []).slice(0, 3).map(w => `<li>${w}</li>`).join('') || 'None identified.'}
                                </ul>
                            </div>
                        </div>

                        <div style="margin-top: 10px;">
                            <div style="font-size: 0.7rem; color: #ffd700; margin-bottom: 3px;">Improvement Plan:</div>
                            <ul style="margin: 0; padding-left: 15px; font-size: 0.7rem; color: #bbb;">
                                ${(p.aiDetails.recommendations || []).slice(0, 3).map(rec => `<li>${rec}</li>`).join('') || 'N/A'}
                            </ul>
                        </div>
                    </div>
                ` : ''}
            </div>
        `).join('') || '<p style="font-size:0.8rem; color:#666">No projects submitted</p>'}

        ${student.achievements?.length ? `
            <div class="section-title">Achievements</div>
            <div class="tags-container">
                ${student.achievements.map(a => `
                    <div class="project-card" style="width: 100%;">
                        <div style="font-weight: bold; color: #83c8c8ff;">${a.title}</div>
                        <div style="font-size: 0.8rem; color: #bbb;">${a.description}</div>
                        <div style="font-size: 0.7rem; color: #666; margin-top: 5px;">${new Date(a.date).toLocaleDateString()}</div>
                    </div>
                `).join('')}
            </div>
        ` : ''}
    `;

    modal.classList.add('active');
}

function closeProfileModal() {
    document.getElementById('profileModal').classList.remove('active');
}

async function updateStatus(oppId, appId, status) {
    let message = null;
    if (status === 'accepted') {
        message = await showPrompt("Enter a personalized message for the student (optional):", "Congratulations! We are pleased to accept your application. We will contact you soon for the next steps.");
        if (message === false || message === null) return; // User cancelled or closed
    } else {
        if (!await showConfirm(`Are you sure you want to ${status} this application ? `)) return;
    }


    try {
        await window.api.updateApplicationStatus(oppId, appId, status, message);
        await showAlert(`Application ${status} successfully!`);
        fetchCompanyDashboard(); // Refresh
    } catch (error) {
        await showAlert('Failed to update status: ' + error.message, 'error');
    }
}

// Logout Modal logic (Standard)
const logoutBtn = document.getElementById('logoutBtn');
const confirmPopup = document.getElementById('confirmPopup');
const yesBtn = document.getElementById('yesBtn');
const noBtn = document.getElementById('noBtn');

if (logoutBtn) {
    logoutBtn.onclick = () => confirmPopup.style.display = 'flex';
}
if (noBtn) {
    noBtn.onclick = () => confirmPopup.style.display = 'none';
}
if (yesBtn) {
    yesBtn.onclick = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = 'login.html';
    };
}

// Initial Load
document.addEventListener('DOMContentLoaded', fetchCompanyDashboard);
