// verify-project.js - Company project verification page logic

let projectData = null;
let verificationToken = null;
let projectId = null;

// Parse URL parameters
function getUrlParams() {
    const params = new URLSearchParams(window.location.search);
    return {
        token: params.get('token'),
        projectId: params.get('projectId')
    };
}

// Load project details
async function loadProjectDetails() {
    const { token, projectId: pid } = getUrlParams();

    if (!token || !pid) {
        showError('Invalid verification link. Missing token or project ID.');
        return;
    }

    verificationToken = token;
    projectId = pid;

    try {
        const response = await window.api.getProjectByToken(token, pid);
        projectData = response.project;
        displayProjectDetails(projectData);

        // Hide loading, show form
        document.getElementById('loadingState').style.display = 'none';
        document.getElementById('verificationForm').style.display = 'block';
    } catch (error) {
        console.error('Error loading project:', error);
        showError(error.message || 'Failed to load project details. The link may be invalid or expired.');
    }
}

// Display project details in the form
function displayProjectDetails(project) {
    document.getElementById('projectTitle').textContent = project.title || 'N/A';
    document.getElementById('studentName').textContent = project.student?.name || 'N/A';
    document.getElementById('studentEmail').textContent = project.student?.email || 'N/A';
    document.getElementById('companyName').textContent = project.company?.name || 'N/A';
    document.getElementById('submissionDate').textContent = new Date(project.createdAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    // Description
    if (project.description) {
        document.getElementById('projectDescription').textContent = project.description;
    }

    // Repository link
    if (project.repoUrl) {
        document.getElementById('repoSection').style.display = 'block';
        const repoLink = document.getElementById('repoLink');
        repoLink.href = project.repoUrl;
        repoLink.textContent = project.repoUrl;
    }

    // Technologies
    if (project.technologies && project.technologies.length > 0) {
        document.getElementById('techSection').style.display = 'block';
        const techContainer = document.getElementById('techTags');
        techContainer.innerHTML = project.technologies
            .map(tech => `<span class="tech-tag">${tech}</span>`)
            .join('');
    }
}

// Show error state
function showError(message) {
    document.getElementById('loadingState').style.display = 'none';
    document.getElementById('verificationForm').style.display = 'none';
    document.getElementById('errorState').style.display = 'block';
    document.getElementById('errorMessage').textContent = message;
}

// Show success state
function showSuccess(verified) {
    document.getElementById('verificationForm').style.display = 'none';
    document.getElementById('successState').style.display = 'block';

    if (verified) {
        document.getElementById('successTitle').textContent = '✅ Project Verified';
        document.getElementById('successMessage').textContent =
            'Thank you for verifying this project. The student will be notified and AI evaluation will begin shortly.';
    } else {
        document.getElementById('successTitle').textContent = '❌ Project Rejected';
        document.getElementById('successMessage').textContent =
            'You have rejected this project association. The student will be notified of your decision.';
    }
}

// Handle verification (verify or reject)
async function handleVerification(verified) {
    const feedback = document.getElementById('feedback').value.trim();
    const scoreInput = document.getElementById('score').value;
    const score = scoreInput ? parseInt(scoreInput) : null;

    // Validate score if provided
    if (score !== null && (isNaN(score) || score < 0 || score > 100)) {
        await showAlert('Please enter a valid score between 0 and 100', 'error');
        return;
    }

    // Disable buttons during submission
    const verifyBtn = document.getElementById('verifyBtn');
    const rejectBtn = document.getElementById('rejectBtn');
    verifyBtn.disabled = true;
    rejectBtn.disabled = true;
    verifyBtn.textContent = 'Processing...';
    rejectBtn.textContent = 'Processing...';

    try {
        await window.api.verifyCompanyProject(
            projectId,
            verified,
            feedback || '',
            score,
            verificationToken
        );

        showSuccess(verified);
    } catch (error) {
        console.error('Verification error:', error);
        await showAlert(error.message || 'Failed to submit verification. Please try again.', 'error');

        // Re-enable buttons
        verifyBtn.disabled = false;
        rejectBtn.disabled = false;
        verifyBtn.innerHTML = `
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M20 6L9 17l-5-5"/>
            </svg>
            Verify Project
        `;
        rejectBtn.innerHTML = `
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
            Reject Project
        `;
    }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    loadProjectDetails();
});
