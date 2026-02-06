// Global User Data
let currentUser = null;
let myProjects = [];
let editingSkillName = null; // New variable to track skill being edited
// Cache projects for modals/editing


// ==================== INITIALIZATION ====================
window.addEventListener('load', async () => {
    // Score circle animation
    const scoreCircle = document.querySelector('.score-circle circle:last-child');
    if (scoreCircle) {
        scoreCircle.style.transition = 'stroke-dashoffset 2s ease-in-out';
    }

    const urlParams = new URLSearchParams(window.location.search);
    const viewUserId = urlParams.get('id');
    const loggedInUser = JSON.parse(localStorage.getItem('user') || '{}');
    const isOwnProfile = !viewUserId || viewUserId === loggedInUser.id || viewUserId === loggedInUser._id;

    if (!isOwnProfile) {
        // Hide edit/add buttons if viewing someone else's profile
        const elementsToHide = [
            '.edit-name-icon',
            '.add-btn',
            '.add-skill-btn',
            '.add-achievement-btn',
            '.create-post-btn',
            '#recalculateScoreBtn',
            '.camera-overlay'
        ];
        elementsToHide.forEach(selector => {
            const el = document.querySelector(selector);
            if (el) el.style.display = 'none';
        });

        // Also disable pointer events on the image wrapper to prevent modal opening
        const profileImgWrapper = document.querySelector('.profile-img-wrapper');
        if (profileImgWrapper) {
            profileImgWrapper.style.pointerEvents = 'none';
            profileImgWrapper.style.cursor = 'default';
        }

        // Also disable view analysis if not admin? 
        // For now, let's just keep those hidden to keep it clean.
    }

    await loadProfile(viewUserId);
    await loadMyProjects(viewUserId);
    await loadActivity(viewUserId);
    await loadComments(viewUserId);
    initializeEventListeners();
});

function initializeEventListeners() {
    // Create Post Button
    const createPostBtn = document.querySelector('.create-post-btn');
    if (createPostBtn) {
        createPostBtn.addEventListener('click', () => {
            window.location.href = 'posts.html';
        });
    }
    const tabButtons = document.querySelectorAll('.tab-btn');
    const postsList = document.querySelector('.posts-list');
    const commentsList = document.querySelector('.comments-list');

    tabButtons.forEach((button, index) => {
        button.addEventListener('click', () => {
            tabButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');

            if (index === 0) { // Posts tab
                if (postsList) postsList.style.display = 'block';
                if (commentsList) commentsList.style.display = 'none';
            } else { // Comments tab
                if (postsList) postsList.style.display = 'none';
                if (commentsList) commentsList.style.display = 'block';
            }
        });
    });

    // Add Project Button
    const addProjectBtn = document.querySelector('.add-btn');
    if (addProjectBtn) {
        addProjectBtn.addEventListener('click', () => openProjectUploadPopup());
    }

    // Add Skill Button
    const addSkillBtn = document.querySelector('.add-skill-btn');
    if (addSkillBtn) {
        addSkillBtn.addEventListener('click', () => openPopup('popup-skill'));
    }

    // View Analysis Button
    const viewAnalysisBtn = document.getElementById('viewAnalysisBtn');
    if (viewAnalysisBtn) {
        viewAnalysisBtn.addEventListener('click', showAnalysisModal);
    }

    const recalculatedBtn = document.getElementById('recalculateScoreBtn');
    if (recalculatedBtn) {
        recalculatedBtn.addEventListener('click', recalculateScore);
    }

    // Profile Picture Upload
    const profileImgWrapper = document.querySelector('.profile-img-wrapper');
    const avatarInput = document.getElementById('avatarInput');
    const avatarModal = document.getElementById('avatarModal');
    const selectImageBtn = document.getElementById('selectImageBtn');
    const removeImageBtn = document.getElementById('removeImageBtn');
    const saveAvatarBtn = document.getElementById('saveAvatarBtn');
    const avatarPreview = document.getElementById('avatarPreview');
    const profileImg = document.getElementById('profileImg');

    console.log('Profile Picture Debug:', {
        wrapper: !!profileImgWrapper,
        input: !!avatarInput,
        modal: !!avatarModal,
        selectBtn: !!selectImageBtn,
        removeBtn: !!removeImageBtn,
        saveBtn: !!saveAvatarBtn,
        preview: !!avatarPreview
    });

    let cropper = null;
    let pendingFile = null;
    let isRemoving = false;

    if (profileImgWrapper && avatarInput && avatarModal) {
        // Open Modal
        profileImgWrapper.addEventListener('click', () => {
            avatarModal.style.display = 'flex';
            // Reset state
            avatarPreview.src = profileImg.src;
            pendingFile = null;
            isRemoving = false;

            // Re-initialize cropper with current image if it's not the default
            if (!profileImg.src.includes('default-avatar')) {
                initCropper(profileImg.src);
            }
        });

        // Close Modal Helper
        const closeModal = () => {
            avatarModal.style.display = 'none';
            if (cropper) {
                cropper.destroy();
                cropper = null;
            }
        };

        // Initialize Cropper Function
        const initCropper = (src) => {
            if (cropper) cropper.destroy();
            avatarPreview.src = src;
            cropper = new Cropper(avatarPreview, {
                aspectRatio: 1,
                viewMode: 1,
                dragMode: 'move',
                autoCropArea: 1,
                restore: false,
                guides: false,
                center: false,
                highlight: false,
                cropBoxMovable: false,
                cropBoxResizable: false,
                toggleDragModeOnDblclick: false,
                ready: function () {
                    // Optional: customize UI after ready
                }
            });
        };

        // Choose New Image
        selectImageBtn.addEventListener('click', () => {
            avatarInput.click();
        });

        // Handle File Selection (Preview)
        avatarInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                // Validate type/size
                const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
                if (!validTypes.includes(file.type)) {
                    showNotification('Invalid file type', 'error');
                    return;
                }

                const reader = new FileReader();
                reader.onload = (e) => {
                    initCropper(e.target.result);
                };
                reader.readAsDataURL(file);

                pendingFile = file;
                isRemoving = false;
            }
        });

        // Remove Photo (Preview Default)
        removeImageBtn.addEventListener('click', () => {
            if (cropper) {
                cropper.destroy();
                cropper = null;
            }
            avatarPreview.src = 'photos/default-avatar.png';
            pendingFile = null;
            isRemoving = true;
        });

        // Save Changes
        saveAvatarBtn.addEventListener('click', async () => {
            const originalText = saveAvatarBtn.innerText;
            saveAvatarBtn.innerText = 'Saving...';
            saveAvatarBtn.disabled = true;

            try {
                if (isRemoving) {
                    await deleteProfilePicture();
                    closeModal();
                } else if (cropper) {
                    // Get cropped canvas
                    const canvas = cropper.getCroppedCanvas({
                        width: 400,
                        height: 400,
                        imageSmoothingEnabled: true,
                        imageSmoothingQuality: 'high',
                    });

                    // Convert to blob and upload
                    canvas.toBlob(async (blob) => {
                        if (blob) {
                            const croppedFile = new File([blob], "avatar.png", { type: "image/png" });
                            await uploadProfilePicture(croppedFile);
                            closeModal();
                        }
                    }, 'image/png');
                } else {
                    closeModal(); // No changes
                }
            } catch (error) {
                console.error(error);
                showNotification('Failed to save avatar', 'error');
            } finally {
                saveAvatarBtn.innerText = originalText;
                saveAvatarBtn.disabled = false;
            }
        });

        // Close on clicking outside or cancel
        document.querySelectorAll('.btn-cancel, .close-modal').forEach(btn => {
            btn.addEventListener('click', closeModal);
        });
    }

    // Popups - Close on click outside
    document.querySelectorAll('.popup-overlay').forEach(popup => {
        popup.addEventListener('click', (e) => {
            if (e.target === popup) popup.style.display = "none";
        });
    });
}


// ==================== DATA LOADING ====================
async function loadProfile(userId = null) {
    try {
        const data = userId ? await window.api.getUser(userId) : await window.api.getMe();
        if (data && data.user) {
            currentUser = data.user;
            renderProfile(currentUser);

            // Persist to localStorage if it's the logged-in user
            const loggedInUser = JSON.parse(localStorage.getItem('user') || '{}');
            if (!userId || userId === (loggedInUser._id || loggedInUser.id)) {
                localStorage.setItem('user', JSON.stringify({ ...loggedInUser, ...data.user }));
            }
        }
    } catch (error) {
        console.error('Failed to load profile:', error);
        // showNotification('Failed to load profile data', 'error');
    }
}

function renderProfile(user) {
    // Header Info
    const nameEl = document.getElementById('profileName');
    const scoreEl = document.getElementById('user-score');

    if (nameEl) nameEl.textContent = user.name;
    if (scoreEl && user.score !== undefined) scoreEl.textContent = user.score;

    // University & Major
    const uniEl = document.getElementById('profileUniversity');
    const majorEl = document.getElementById('profileMajor');
    const emailEl = document.getElementById('profileEmail');
    const avatarEl = document.querySelector('.profile-img');

    if (uniEl) uniEl.textContent = user.university || 'University not set';
    if (majorEl) majorEl.textContent = user.major || 'Major not set';
    if (emailEl) emailEl.textContent = user.email || 'Email not set';

    // Map old avatar path to new one if needed
    let avatarSrc = user.avatar;
    if (avatarSrc === 'photos/profilepic1.png') avatarSrc = 'photos/default-avatar.png';
    if (avatarEl && avatarSrc) avatarEl.src = avatarSrc;

    // Skills
    renderSkills(user.skills || []);

    // Achievements
    renderAchievements(user.achievements || []);

    // Update Score Circle SVG
    updateScoreCircle(user.score || 0);
}

function updateScoreCircle(score) {
    const circle = document.querySelector('.score-circle circle:last-child');
    if (!circle) return;

    // The radius is 50, so circumference is 2 * PI * 50 = 314
    const circumference = 314;
    const offset = circumference - (score / 100) * circumference;
    circle.style.strokeDashoffset = offset;
}

function renderAchievements(achievements) {
    const container = document.querySelector('.achievements-list');
    if (!container) return;

    container.innerHTML = ''; // Clear hardcoded/old items

    if (achievements.length === 0) {
        container.innerHTML = '<p class="no-data" style="text-align:center; color:#666; font-size:14px; padding:10px;">No achievements yet.</p>';
        return;
    }

    achievements.forEach(ach => {
        const item = document.createElement('div');
        item.className = 'achievement-item';
        item.dataset.id = ach._id;

        const urlParams = new URLSearchParams(window.location.search);
        const viewUserId = urlParams.get('id');
        const loggedInUser = JSON.parse(localStorage.getItem('user') || '{}');
        const isOwnProfile = !viewUserId || viewUserId === loggedInUser.id || viewUserId === loggedInUser._id;

        item.innerHTML = `
            <div class="achievement-icon">🏆</div>
            <div class="achievement-content">
                <span class="achievement-text">${ach.title}</span>
                ${ach.description ? `<span class="achievement-desc">${ach.description}</span>` : ''}
                ${ach.certificateUrl ? `<a href="${ach.certificateUrl}" target="_blank" class="achievement-cert-link">View Certificate 🔗</a>` : ''}
            </div>
            ${isOwnProfile ? `
            <div class="achievement-actions">
                <button class="ach-action-btn" onclick="editAchievement('${ach._id}')" title="Edit Achievement">
                    <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7M18.5 2.5a2.121 2.121 0 113 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                </button>
                <button class="ach-action-btn delete" onclick="deleteAchievement('${ach._id}')" title="Delete Achievement">
                    <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
                </button>
            </div>
            ` : ''}
        `;
        container.appendChild(item);
    });
}

function renderSkills(skills) {
    const container = document.getElementById('skillsList');
    if (!container) return;

    container.innerHTML = ''; // Clear current

    if (skills.length === 0) {
        container.innerHTML = '<p class="no-data">No skills added yet.</p>';
        return;
    }

    skills.forEach(skill => {
        const urlParams = new URLSearchParams(window.location.search);
        const viewUserId = urlParams.get('id');
        const loggedInUser = JSON.parse(localStorage.getItem('user') || '{}');
        const isOwnProfile = !viewUserId || viewUserId === loggedInUser.id || viewUserId === loggedInUser._id;

        const capitalizedSkill = skill.charAt(0).toUpperCase() + skill.slice(1);
        const skillTag = document.createElement('div');
        skillTag.className = 'skill-tag-display';
        skillTag.innerHTML = `
            ${capitalizedSkill}
            ${isOwnProfile ? `
            <div class="skill-actions">
                <button class="edit-skill-btn" onclick="editSkill('${skill.replace(/'/g, "\\'")}')" title="Edit skill">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                    </svg>
                </button>
                <button class="delete-skill-btn" onclick="deleteSkill('${skill.replace(/'/g, "\\'")}')" title="Delete skill">&times;</button>
            </div>
            ` : ''}
    `;
        container.appendChild(skillTag);
    });
}

// ==================== SKILLS LOGIC ====================
async function submitSkill() {
    const input = document.getElementById('skillName');
    const skillName = input.value.trim();

    if (!skillName) {
        showNotification('Please enter a skill name', 'warning');
        return;
    }

    if (!currentUser) return;

    // Add to local array
    const currentSkills = currentUser.skills || [];
    try {
        let newSkills;
        if (editingSkillName) {
            // Replace old skill with new name
            newSkills = currentSkills.map(s => s === editingSkillName ? skillName : s);
        } else {
            // Check if already exists (only for new skills)
            if (currentSkills.includes(skillName)) {
                showNotification('You already added this skill!', 'warning');
                return;
            }
            newSkills = [...currentSkills, skillName];
        }

        // Save to backend
        const response = await window.api.updateProfile({ skills: newSkills });

        // Update local state and UI
        currentUser.skills = response.user.skills;
        renderSkills(currentUser.skills);

        // Cleanup
        input.value = '';
        editingSkillName = null; // Reset
        closePopup('popup-skill');

        // Restore popup title and button for next time
        const popup = document.getElementById('popup-skill');
        popup.querySelector('h2').textContent = 'Add New Skill';
        popup.querySelector('.popup-next').textContent = 'Add';

        // Trigger AI update if needed
        if (window.calculateAIScore) {
            await window.calculateAIScore({
                name: currentUser.name,
                skills: currentUser.skills
            });
            // Refresh profile to get the new analysis
            await loadProfile();
        }

    } catch (error) {
        console.error('Failed to save skill:', error);
        showNotification('Failed to save skill. Please try again.', 'error');
    }
}

function editSkill(skillName) {
    editingSkillName = skillName;
    const input = document.getElementById('skillName');
    input.value = skillName;

    const popup = document.getElementById('popup-skill');
    popup.querySelector('h2').textContent = 'Edit Skill';
    popup.querySelector('.popup-next').textContent = 'Save Changes';

    openPopup('popup-skill');
}



// ==================== PROJECT LOGIC ====================
// ==================== PROJECT LOGIC ====================

// Load companies for dropdown
async function loadCompaniesForDropdown() {
    try {
        const response = await window.api.getCompanies();
        const select = document.getElementById('projectCompany');

        console.log('Companies API response:', response); // Debug log

        // Access the companies array from the response object
        const companiesList = response.companies || response || [];

        if (select && companiesList && companiesList.length > 0) {
            // Clear existing options except the first "No Company"
            select.innerHTML = '<option value="">No Company</option>';

            // Backend already filters for active companies, just add them all
            companiesList.forEach(company => {
                const option = document.createElement('option');
                option.value = company._id || company.id;
                option.textContent = company.name;
                select.appendChild(option);
            });

            console.log(`Loaded ${companiesList.length} companies into dropdown`);
        } else {
            console.log('No companies found or select element missing');
        }
    } catch (error) {
        console.error('Failed to load companies:', error);
    }
}

// Call this when opening the project upload popup
function openProjectUploadPopup() {
    openPopup('popup-upload');
    loadCompaniesForDropdown();
}

async function submitProject() {
    const name = document.getElementById("projectName").value.trim();
    const desc = document.getElementById("projectDesc").value.trim();
    const link = document.getElementById("projectLink").value.trim();
    const techInput = document.getElementById("projectTech").value.trim();
    const file = document.getElementById("projectFile").value;
    const companyId = document.getElementById("projectCompany")?.value || "";

    if (!name) {
        showNotification("Please enter a project name.", "warning");
        return;
    }

    if (!file && !link) {
        showNotification("Upload a file OR provide a link.", "warning");
        return;
    }

    const technologies = techInput ? techInput.split(',').map(t => t.trim()) : [];

    // Prepare data directly for API
    const projectData = {
        title: name,
        description: desc,
        repoUrl: link,
        technologies
    };

    // Add company if selected
    if (companyId) {
        projectData.belongsToCompany = companyId;
    }

    try {
        await window.api.createProject(projectData);

        // Show different message based on whether company verification is needed
        if (companyId) {
            showNotification("Project submitted! Company verification required before AI scoring.", "success");
        } else {
            showNotification("Project submitted successfully! AI Evaluation started.", "success");
        }

        // Close popups
        closePopup("popup-upload");

        // Clear fields
        document.getElementById("projectName").value = "";
        document.getElementById("projectDesc").value = "";
        document.getElementById("projectLink").value = "";
        document.getElementById("projectTech").value = "";
        document.getElementById("projectFile").value = "";
        document.getElementById("projectCompany").value = "";

        // Reload to show new project 
        await loadMyProjects();

    } catch (error) {
        console.error("Submit project error:", error);
        showNotification("Failed to submit project: " + (error.message || "Unknown error"), "error");
    }
}

async function submitAchievement() {
    const title = document.getElementById("achTitle").value.trim();
    const description = document.getElementById("achDesc").value.trim();
    const certificateUrl = document.getElementById("achCert").value.trim();

    if (!title) {
        showNotification("Please enter a title.", "warning");
        return;
    }

    try {
        await window.api.addAchievement({ title, description, certificateUrl });
        showNotification("Achievement added!", "success");
        closePopup("popup-achievement");
        document.getElementById("achTitle").value = "";
        document.getElementById("achDesc").value = "";
        document.getElementById("achCert").value = "";

        // Reload profile to show new achievement
        await loadProfile();
    } catch (error) {
        console.error(error);
        showNotification("Failed to add achievement", "error");
    }
}

async function loadMyProjects(userId = null) {
    try {
        const data = userId ? await window.api.getUserProjects(userId) : await window.api.getMyProjects();
        myProjects = data.projects || []; // Cache them

        const projectsContainer = document.getElementById("projectsList");
        if (!projectsContainer) return;

        projectsContainer.innerHTML = ''; // Clear existing content

        if (myProjects.length > 0) {
            myProjects.forEach(project => {
                addProjectToProfile(project);
            });
        } else {
            projectsContainer.innerHTML = '<p style="text-align:center; padding:20px; color:#666;">No projects added yet.</p>';
        }

        // Trigger polling if any project is pending (only for own profile)
        if (!userId && myProjects.some(p => p.status === 'pending')) {
            pollForUpdates();
        }
    } catch (error) {
        console.error("Error loading projects:", error);
    }
}

// Polling mechanic for pending projects
let projectPollingInterval = null;

async function pollForUpdates() {
    if (projectPollingInterval) return; // Already polling

    let checks = 0;
    const maxChecks = 10; // 30 seconds max (10 * 3s)

    projectPollingInterval = setInterval(async () => {
        checks++;
        const projectsBefore = myProjects.map(p => p.status).join(',');

        await loadMyProjects(); // Correctly call without true to avoid breaking userId check
        // Check if status changed
        const hasPending = myProjects.some(p => p.status === 'pending');
        const projectsAfter = myProjects.map(p => p.status).join(',');

        // Also check if status changed or score updated
        if (projectsBefore !== projectsAfter) {
            await loadProfile(); // Refresh header and overall score
        }

        if (!hasPending || checks >= maxChecks) { // Stop if done
            clearInterval(projectPollingInterval);
            projectPollingInterval = null;
            await loadProfile(); // Final sync
        }

        if (checks >= maxChecks) {
            clearInterval(projectPollingInterval);
            projectPollingInterval = null;
        }

    }, 3000);
}

function addProjectToProfile(project) {
    const projectsContainer = document.getElementById("projectsList");
    if (!projectsContainer) return;

    const card = document.createElement("div");
    card.classList.add("project-card");
    card.dataset.id = project._id;
    card.style.position = 'relative'; // For positioning the more-btn

    const urlParams = new URLSearchParams(window.location.search);
    const viewUserId = urlParams.get('id');
    const loggedInUser = JSON.parse(localStorage.getItem('user') || '{}');
    const isOwnProfile = !viewUserId || viewUserId === loggedInUser.id || viewUserId === loggedInUser._id;

    // Technologies tags
    const maxVisibleTags = 6;
    let techHtml = '';
    let showMoreHtml = '';
    if (project.technologies && project.technologies.length > 0) {
        techHtml = project.technologies.map((t, index) => {
            const hiddenClass = index >= maxVisibleTags ? 'hidden-tag' : '';
            return `<span class="tag ${hiddenClass}">${t}</span>`;
        }).join('');

        if (project.technologies.length > maxVisibleTags) {
            showMoreHtml = `<button class="show-more-tags" onclick="toggleTags(this, ${project.technologies.length - maxVisibleTags})">Show More (+${project.technologies.length - maxVisibleTags})</button>`;
        }
    }

    // Progress / Score Display
    let progressText = 'Pending Evaluation';
    let progressColor = '#9CA3AF';

    if (project.status === 'scored') {
        progressText = `${project.score}%`;
        progressColor = '#006D77';
    } else if (project.status === 'Approved') {
        progressText = `Approved (${project.score}%)`;
        progressColor = '#2e7d32';
    } else if (project.status === 'Rejected') {
        progressText = 'Rejected';
        progressColor = '#d32f2f';
    } else if (project.status === 'Needs Change') {
        progressText = 'Needs Change';
        progressColor = '#f57c00';
    }

    // Verified / Rejected Badge
    let badgeHtml = '';
    const companyName = project.belongsToCompany?.name || 'Company';

    if (project.companyVerificationStatus === 'verified') {
        badgeHtml = `
            <span class="verified-badge" title="Verified by ${companyName}">
                <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M23,12L20.56,9.22L20.9,5.54L17.29,4.72L15.4,1.54L12,3L8.6,1.54L6.71,4.72L3.1,5.53L3.44,9.21L1,12L3.44,14.78L3.1,18.47L6.71,19.29L8.6,22.47L12,21L15.4,22.46L17.29,19.28L20.9,18.46L20.56,14.78L23,12M10,17L6,13L7.41,11.59L10,14.17L16.59,7.58L18,9L10,17Z" />
                </svg>
                ${companyName} Verified
            </span>
        `;
    }

    card.innerHTML = `
        <div class="project-header">
            <div style="display: flex; align-items: center; gap: 4px; flex-wrap: wrap;">
                <h3 class="project-title" style="color: #0c7489; font-weight: 600; margin: 0;">${project.title}</h3>
                ${badgeHtml}
            </div>
            <div style="display: flex; align-items: center; gap: 15px;">
                <span class="project-progress" style="color: ${progressColor};">${progressText}</span>
                ${isOwnProfile ? `<button class="more-btn" onclick="showProjectMenu(this, '${project._id}')">&#8942;</button>` : ''}
            </div>
        </div>

        <p class="project-description" style="color: #4B5563; margin-top: 10px;">
            ${(project.description || '').substring(0, 100)}${project.description && project.description.length > 100 ? '...' : ''}
        </p>

        <div class="project-tags" style="margin: 15px 0;">
            ${techHtml}
        </div>
        ${showMoreHtml}

        <button class="view-btn" onclick="showProjectDetails('${project._id}')">View Project</button>
`;

    projectsContainer.appendChild(card);
}

function showProjectDetails(projectId) {
    const project = myProjects.find(p => p._id === projectId);
    if (!project) return;

    const companyName = project.belongsToCompany?.name || 'Company';
    let badgeHtml = '';
    if (project.companyVerificationStatus === 'verified') {
        badgeHtml = `
            <span class="verified-badge" style="font-size: 14px; padding: 4px 10px;" title="Verified by ${companyName}">
                <svg viewBox="0 0 24 24" fill="currentColor" style="width: 16px; height: 16px;">
                    <path d="M23,12L20.56,9.22L20.9,5.54L17.29,4.72L15.4,1.54L12,3L8.6,1.54L6.71,4.72L3.1,5.53L3.44,9.21L1,12L3.44,14.78L3.1,18.47L6.71,19.29L8.6,22.47L12,21L15.4,22.46L17.29,19.28L20.9,18.46L20.56,14.78L23,12M10,17L6,13L7.41,11.59L10,14.17L16.59,7.58L18,9L10,17Z" />
                </svg>
                ${companyName} Verified
            </span>
        `;
    } else if (project.companyVerificationStatus === 'rejected') {
        badgeHtml = `<span style="color: #dc2626; font-size: 14px; font-weight: 500; margin-left: 10px;">(Rejected)</span>`;
    }

    document.getElementById('detailProjectTitle').innerHTML = `${project.title} ${badgeHtml}`;
    document.getElementById('detailProjectDesc').textContent = project.description || 'No description provided.';
    const statusText = project.status.charAt(0).toUpperCase() + project.status.slice(1);
    document.getElementById('detailProjectStatus').textContent = statusText;

    // Add company name if available
    if (project.belongsToCompany) {
        document.getElementById('detailProjectStatus').innerHTML += ` <br><small style="color:#666">Organization: ${companyName}</small>`;
    }

    const scoreEl = document.getElementById('detailProjectScore');
    const statusEl = document.getElementById('detailProjectStatus');

    if (project.companyVerificationStatus === 'verified' && project.companyScore !== null) {
        // Show breakdown
        const companyScore = project.companyScore;
        const finalScore = project.score;

        // Use stored aiScore if available, otherwise estimate (for legacy items)
        let aiEvaluation = (project.aiScore !== undefined && project.aiScore !== null) ? project.aiScore : null;

        if (aiEvaluation === null) {
            // Rough estimate for legacy
            aiEvaluation = Math.max(0, Math.min(100, (finalScore * 2) - companyScore));
        }

        scoreEl.innerHTML = `
            <div style="font-size: 1.1rem; font-weight: 700;">${finalScore}% <span style="font-size: 0.8rem; font-weight: 400; color: #666;">(Blended)</span></div>
            <div style="font-size: 0.75rem; color: #666; margin-top: 4px;">
                AI: ${aiEvaluation}% | Company: ${companyScore}%
            </div>
        `;
        const scoreLabel = scoreEl.previousElementSibling;
        if (scoreLabel) scoreLabel.textContent = 'Project Score';
    } else if (project.companyVerificationStatus === 'rejected') {
        const hasScore = project.score !== undefined && project.score !== null;
        scoreEl.innerHTML = `
            <div style="font-size: 1.1rem; font-weight: 700; color: #006D77;">${hasScore ? project.score + '%' : 'Pending'}</div>
            <div style="font-size: 0.75rem; color: #dc2626; margin-top: 4px;">Company Rejected</div>
        `;
    } else {
        const hasScore = project.score !== undefined && project.score !== null;
        scoreEl.textContent = hasScore ? `${project.score}%` : 'Pending';
    }
    const scoreLabel = scoreEl.previousElementSibling;
    if (scoreLabel) scoreLabel.textContent = 'AI Score';

    if (project.status === 'Approved') scoreEl.style.color = '#2e7d32';
    else if (project.status === 'scored') scoreEl.style.color = '#006D77';
    else if (project.status === 'Rejected') scoreEl.style.color = '#d32f2f';
    else if (project.status === 'Needs Change') scoreEl.style.color = '#f57c00';
    else scoreEl.style.color = '#9CA3AF';

    const techContainer = document.getElementById('detailProjectTech');
    techContainer.innerHTML = '';
    if (project.technologies && project.technologies.length > 0) {
        project.technologies.forEach(t => {
            const span = document.createElement('span');
            span.className = 'tag';
            span.style.background = '#006D77';
            span.textContent = t;
            techContainer.appendChild(span);
        });
    } else {
        techContainer.innerHTML = '<span style="color:#9CA3AF; font-size:13px;">No technologies listed</span>';
    }

    const notesContainer = document.getElementById('detailProjectNotes');
    if (notesContainer) {
        if (project.reviewerNotes) {
            notesContainer.parentElement.style.display = 'block';
            notesContainer.textContent = project.reviewerNotes;
        } else {
            notesContainer.parentElement.style.display = 'none';
        }
    }

    const linkBtn = document.getElementById('detailProjectLinkBtn');
    if (project.repoUrl) {
        linkBtn.style.display = 'block';
        linkBtn.onclick = () => window.open(project.repoUrl, '_blank');
    } else {
        linkBtn.style.display = 'none';
    }

    openPopup('popup-project-details');
}

function showProjectMenu(button, projectId) {
    // Close any other open menus
    const existing = document.querySelector('.project-menu');
    if (existing) existing.remove();

    const menu = document.createElement('div');
    menu.className = 'project-menu';

    menu.innerHTML = `
        <div class="menu-option" id="edit-opt">
            <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7M18.5 2.5a2.121 2.121 0 113 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
            Edit Project
        </div>
        <div class="menu-option delete-option" id="delete-opt">
            <svg width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
            Delete Project
        </div>
    `;

    document.body.appendChild(menu);

    const buttonRect = button.getBoundingClientRect();
    menu.style.top = (buttonRect.bottom + window.scrollY + 5) + 'px';
    menu.style.left = (buttonRect.right + window.scrollX - 140) + 'px';

    menu.querySelector('#edit-opt').onclick = () => {
        editProject(projectId);
        menu.remove();
    };

    menu.querySelector('#delete-opt').onclick = () => {
        deleteProject(projectId);
        menu.remove();
    };

    // Global click listener to close menu
    setTimeout(() => {
        document.addEventListener('click', function closeMenu(e) {
            if (!menu.contains(e.target) && e.target !== button) {
                menu.remove();
                document.removeEventListener('click', closeMenu);
            }
        }, { once: true });
    }, 10);
}

async function deleteProject(projectId) {
    if (await showConfirm('Are you sure you want to delete this project? This action cannot be undone.', 'Delete Project')) {
        try {
            await window.api.request(`/projects/${projectId}`, 'DELETE');
            showNotification('Project deleted successfully', 'success');
            await loadMyProjects(); // Refresh list
            // Also refresh profile to update overall score
            await loadProfile();
        } catch (error) {
            console.error('Delete error:', error);
            showNotification('Failed to delete project', 'error');
        }
    }
}

// showConfirmModal removed as it's replaced by global showConfirm


async function editProject(projectId) {
    const project = myProjects.find(p => p._id === projectId);
    if (!project) return;

    // Load companies first to ensure dropdown is ready
    await loadCompaniesForDropdown();

    // Prefill the existing upload popup
    document.getElementById("projectName").value = project.title;
    document.getElementById("projectDesc").value = project.description || '';
    document.getElementById("projectLink").value = project.repoUrl || '';
    document.getElementById("projectTech").value = (project.technologies || []).join(', ');

    // Set company dropdown
    const companySelect = document.getElementById("projectCompany");
    if (companySelect) {
        companySelect.value = project.belongsToCompany || (project.belongsToCompany?._id || "");
    }

    // Change submit button behavior for editing
    const submitBtn = document.querySelector("#popup-upload .popup-next");
    const originalText = "Add Project"; // Default text
    submitBtn.textContent = "Save Changes";

    const originalOnClick = "submitProject()";
    submitBtn.onclick = async () => {
        const updatedData = {
            title: document.getElementById("projectName").value.trim(),
            description: document.getElementById("projectDesc").value.trim(),
            repoUrl: document.getElementById("projectLink").value.trim(),
            technologies: document.getElementById("projectTech").value.split(',').map(t => t.trim()),
            belongsToCompany: document.getElementById("projectCompany")?.value || null
        };

        try {
            const response = await window.api.request(`/projects/${projectId}`, 'PUT', updatedData);

            if (response.project.status === 'awaiting_company_verification') {
                showNotification('Project updated and sent for company verification', 'success');
            } else {
                showNotification('Project updated successfully', 'success');
            }

            closePopup('popup-upload');
            await loadMyProjects();

            // Restore original behavior
            submitBtn.textContent = originalText;
            submitBtn.setAttribute('onclick', originalOnClick);
        } catch (error) {
            console.error('Update error:', error);
            showNotification('Failed to update project: ' + (error.message || "Unknown error"), 'error');
        }
    };

    openPopup('popup-upload');
}


// ==================== HELPER FUNCTIONS ====================
function openPopup(id) {
    const popup = document.getElementById(id);
    if (popup) popup.style.display = "flex";
}

function closePopup(id) {
    const popup = document.getElementById(id);
    if (popup) popup.style.display = "none";
}

// Expose functions to global scope for HTML onclick attributes
window.openPopup = openPopup;
window.closePopup = closePopup;
window.submitSkill = submitSkill;
window.submitAchievement = submitAchievement;

// ==================== ACTIVITY LOGIC ====================
async function loadActivity(userId = null) {
    try {
        const postsList = document.querySelector('.posts-list');
        if (!postsList) return;

        const response = userId ? await window.api.getUserPosts(userId) : await window.api.getMyPosts();

        if (!response || !response.posts) {
            throw new Error('Invalid response from server');
        }

        const posts = response.posts;
        postsList.innerHTML = ''; // Clear hardcoded posts

        if (posts.length === 0) {
            postsList.innerHTML = '<p style="text-align:center; padding:20px; color:#666;">No posts yet.</p>';
            return;
        }

        posts.forEach(post => {
            const postCard = createPostHTML(post, currentUser); // Use currentUser (loaded in loadProfile)
            postsList.insertAdjacentHTML('beforeend', postCard);
        });

    } catch (error) {
        console.error('Failed to load activity:', error);
        postsList.innerHTML = '<p style="text-align:center; padding:20px; color:#ff4d4d;">Failed to load activity. Please check your connection.</p>';
    }
}

function createPostHTML(post, user) {
    const timeAgo = new Date(post.createdAt).toLocaleDateString(); // Simple formatting
    // If you have a time-ago helper, use it. stick to simple for now.

    let userAvatar = user.avatar || 'photos/default-avatar.png';
    if (userAvatar === 'photos/profilepic1.png') userAvatar = 'photos/default-avatar.png';

    return `
        <div class="post-card">
            <div class="post-header">
                <img src="${userAvatar}" alt="${user.name}" class="post-avatar">
                <div>
                    <h4 class="post-author">${user.name}</h4>
                    <p class="post-time">${timeAgo}</p>
                </div>
            </div>
            <p class="post-content">
                ${post.text}
            </p>
            <div class="post-footer">
                <span class="post-likes">❤️ ${post.likes ? post.likes.length : 0}</span>
                <span class="post-comments">${post.comments ? post.comments.length : 0} Comments</span>
            </div>
        </div>
    `;
}

async function loadComments(userId = null) {
    try {
        const commentsList = document.querySelector('.comments-list');
        if (!commentsList) return;

        const response = userId ? await window.api.getUserComments(userId) : await window.api.getMyComments();
        const comments = response.comments || [];

        commentsList.innerHTML = '';

        if (comments.length === 0) {
            commentsList.innerHTML = '<p style="text-align:center; padding:20px; color:#666;">No comments yet.</p>';
            return;
        }

        comments.forEach(comment => {
            const commentCard = createCommentHTML(comment);
            commentsList.insertAdjacentHTML('beforeend', commentCard);
        });

    } catch (error) {
        console.error('Failed to load comments:', error);
    }
}

function createCommentHTML(comment) {
    const timeAgo = new Date(comment.createdAt).toLocaleDateString();

    return `
        <div class="post-card" style="border-left: 4px solid #006D77; padding-left: 15px;">
            <div class="post-header">
                <div>
                    <h4 class="post-author" style="font-size: 0.9rem; color: #666;">Commented on ${comment.post.author}'s post</h4>
                    <p class="post-time">${timeAgo}</p>
                </div>
            </div>
            
            <p style="font-style: italic; color: #555; margin-bottom: 10px; font-size: 0.9em;">
                "${comment.post.text.substring(0, 60)}${comment.post.text.length > 60 ? '...' : ''}"
            </p>

            <p class="post-content" style="font-weight: 500;">
                ${comment.text}
            </p>
        </div>
    `;
}

// ==================== EDIT PROFILE ====================
function openEditProfileModal() {
    const currentUserData = JSON.parse(localStorage.getItem('user') || '{}');

    // Prefill form
    document.getElementById('edit-name').value = document.getElementById('profileName').textContent.trim();
    document.getElementById('edit-email').value = currentUserData.email || '';

    const uniText = document.getElementById('profileUniversity').textContent.trim();
    document.getElementById('edit-university').value = uniText === 'University not set' ? '' : uniText;

    const majorText = document.getElementById('profileMajor').textContent.trim();
    document.getElementById('edit-major').value = majorText === 'Major not set' ? '' : majorText;

    // Reset password fields
    document.getElementById('edit-old-password').value = '';
    document.getElementById('edit-new-password').value = '';

    openPopup('popup-edit-profile');
}

// Handle Profile Update
const editProfileForm = document.getElementById('editProfileForm');
if (editProfileForm) {
    editProfileForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const name = document.getElementById('edit-name').value;
        const email = document.getElementById('edit-email').value;
        const university = document.getElementById('edit-university').value;
        const major = document.getElementById('edit-major').value;

        const oldPass = document.getElementById('edit-old-password').value;
        const newPass = document.getElementById('edit-new-password').value;

        try {
            // Update basic profile info
            const response = await window.api.updateProfile({
                name,
                email,
                university,
                major
            });

            // Handle password change if filled
            if (oldPass && newPass) {
                await window.api.changePassword(oldPass, newPass);
            }

            closePopup('popup-edit-profile');
            showNotification('Profile updated successfully!', 'success');

            // Update local UI immediately
            document.getElementById('profileName').textContent = response.user.name;
            document.getElementById('profileUniversity').textContent = response.user.university || 'University not set';
            document.getElementById('profileMajor').textContent = response.user.major || 'Major not set';
            if (document.getElementById('profileEmail')) {
                document.getElementById('profileEmail').textContent = response.user.email || email;
            }

            // Update LocalStorage
            const updatedUser = { ...JSON.parse(localStorage.getItem('user') || '{}'), ...response.user };
            localStorage.setItem('user', JSON.stringify(updatedUser));

            // Reload to ensure everything is fresh
            setTimeout(() => window.location.reload(), 1500);

        } catch (error) {
            console.error('Update Profile Error:', error);
            showNotification(error.message || 'Failed to update profile.', 'error');
        }
    });
}

// ==================== NOTIFICATIONS ====================
function showNotification(message, type) {
    let notification = document.getElementById('notification');
    if (!notification) {
        notification = document.createElement('div');
        notification.id = 'notification';
        notification.className = 'notification';
        document.body.appendChild(notification);
    }

    notification.textContent = message;
    notification.className = 'notification ' + type;
    notification.classList.add('show');

    setTimeout(() => {
        notification.classList.remove('show');
    }, 3000);
}
async function deleteSkill(skillName) {
    if (await showConfirm(`Remove "${skillName}" from your skills ? `, 'Delete Skill')) {
        try {
            const currentSkills = currentUser.skills || [];
            const updatedSkills = currentSkills.filter(s => s !== skillName);

            await window.api.request('/users/me', 'PUT', { skills: updatedSkills });
            currentUser.skills = updatedSkills;
            renderSkills(updatedSkills);
            showNotification('Skill removed', 'success');
        } catch (error) {
            console.error('Delete skill error:', error);
            showNotification('Failed to remove skill', 'error');
        }
    }
}

async function deleteAchievement(achievementId) {
    if (await showConfirm('Are you sure you want to delete this achievement?', 'Delete Achievement')) {
        try {
            await window.api.request(`/users/me/achievements/${achievementId}`, 'DELETE');
            currentUser.achievements = currentUser.achievements.filter(ach => ach._id !== achievementId);
            renderAchievements(currentUser.achievements);
            showNotification('Achievement deleted', 'success');
        } catch (error) {
            console.error('Delete achievement error:', error);
            showNotification('Failed to delete achievement', 'error');
        }
    }
}

function editAchievement(achievementId) {
    const ach = currentUser.achievements.find(a => a._id === achievementId);
    if (!ach) return;

    // Fill popup
    document.getElementById('achTitle').value = ach.title;
    document.getElementById('achDesc').value = ach.description || '';
    document.getElementById('achCert').value = ach.certificateUrl || '';

    const popup = document.getElementById('popup-achievement');
    const titleEl = popup.querySelector('h2');
    const submitBtn = popup.querySelector('.popup-next');

    titleEl.textContent = 'Edit Achievement';
    submitBtn.textContent = 'Save Changes';

    const originalOnClick = submitBtn.getAttribute('onclick');
    submitBtn.onclick = async () => {
        const updatedData = {
            title: document.getElementById('achTitle').value.trim(),
            description: document.getElementById('achDesc').value.trim(),
            certificateUrl: document.getElementById('achCert').value.trim()
        };

        if (!updatedData.title) {
            showNotification('Title is required', 'warning');
            return;
        }

        try {
            await window.api.request(`/users/me/achievements/${achievementId}`, 'PUT', updatedData);
            showNotification('Achievement updated', 'success');

            // Refresh data
            const response = await window.api.request('/users/me', 'GET');
            currentUser = response.user;
            renderAchievements(currentUser.achievements);

            closePopup('popup-achievement');

            // Restore popup for adding
            setTimeout(() => {
                titleEl.textContent = 'Add Achievement / Certificate';
                submitBtn.textContent = 'Add';
                submitBtn.setAttribute('onclick', originalOnClick);
            }, 300);
        } catch (error) {
            console.error('Update achievement error:', error);
            showNotification('Failed to update achievement', 'error');
        }
    };

    openPopup('popup-achievement');
}

async function recalculateScore() {
    const btn = document.getElementById('recalculateScoreBtn');
    if (!btn) return;
    const originalText = btn.innerHTML;

    try {
        btn.innerHTML = '🔄 Recalculating...';
        btn.disabled = true;
        btn.style.opacity = '0.6';

        // Get fresh data
        const resp = await window.api.getMe();
        const user = resp.user;

        const response = await window.api.calculateScore({
            skills: user.skills || [],
            projects: myProjects || [],
            activity: {
                loginsLast30Days: 5,
                submissionsCount: (myProjects || []).length,
                pagesViewed: 20
            }
        });

        if (response.success) {
            showNotification('AI Score updated!', 'success');
            await loadProfile();
        } else {
            throw new Error(response.message || 'Failed to update score');
        }
    } catch (error) {
        console.error('Recalculate error:', error);
        showNotification('Failed to recalculate score.', 'error');
    } finally {
        btn.innerHTML = originalText;
        btn.disabled = false;
        btn.style.opacity = '1';
    }
}

function showAnalysisModal() {
    if (!currentUser || !currentUser.scoreAnalysis) {
        showNotification('AI analysis not available yet. Try refreshing your score.', 'info');
        return;
    }

    const sa = currentUser.scoreAnalysis;

    // Set Summary
    const summaryEl = document.getElementById('analysisSummary');
    if (summaryEl) summaryEl.textContent = sa.summary || 'Your profile evaluation is complete.';

    // Populate Strengths
    const strengthsUl = document.getElementById('analysisStrengths');
    if (strengthsUl) {
        strengthsUl.innerHTML = (sa.strengths || []).length > 0
            ? sa.strengths.map(s => `<li>${s}</li>`).join('')
            : '<li>Keep building projects to reveal strengths.</li>';
    }

    // Populate Weaknesses
    const weaknessesUl = document.getElementById('analysisWeaknesses');
    if (weaknessesUl) {
        weaknessesUl.innerHTML = (sa.weaknesses || []).length > 0
            ? sa.weaknesses.map(w => `<li>${w}</li>`).join('')
            : '<li>No major weaknesses found yet.</li>';
    }

    // Populate Recommendations
    const recsUl = document.getElementById('analysisRecommendations');
    if (recsUl) {
        recsUl.innerHTML = (sa.recommendations || []).length > 0
            ? sa.recommendations.map(r => `<li>${r}</li>`).join('')
            : '<li>Continue learning and adding achievements!</li>';
    }

    openPopup('popup-analysis');
}

// ==================== PROFILE PICTURE UPLOAD ====================
async function uploadProfilePicture(file) {
    // Validate file type
    const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
        showNotification('Please select a valid image file (JPG, PNG, GIF, or WebP)', 'error');
        return;
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
        showNotification('Image size must be less than 5MB', 'error');
        return;
    }

    try {
        // Show loading state
        const profileImg = document.getElementById('profileImg');
        const originalSrc = profileImg.src;

        // Create FormData
        const formData = new FormData();
        formData.append('avatar', file);

        // Upload to server
        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:5000/api/users/upload-avatar', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: formData
        });

        const data = await response.json();

        if (response.ok) {
            // Update profile image immediately
            profileImg.src = data.avatarUrl + '?t=' + new Date().getTime(); // Cache bust

            // Update localStorage
            const user = JSON.parse(localStorage.getItem('user'));
            user.avatar = data.avatarUrl;
            localStorage.setItem('user', JSON.stringify(user));

            showNotification('Profile picture updated successfully!', 'success');
        } else {
            profileImg.src = originalSrc;
            showNotification(data.message || 'Failed to upload profile picture', 'error');
        }
    } catch (error) {
        console.error('Upload error:', error);
        showNotification('Failed to upload profile picture. Please try again.', 'error');
    }
}

// ==================== DELETE PROFILE PICTURE ====================
async function deleteProfilePicture() {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch('http://localhost:5000/api/users/delete-avatar', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const data = await response.json();

        if (response.ok) {
            // Update profile image immediately
            const profileImg = document.getElementById('profileImg');
            profileImg.src = 'photos/default-avatar.png';

            // Update localStorage
            const user = JSON.parse(localStorage.getItem('user'));
            user.avatar = 'photos/default-avatar.png';
            localStorage.setItem('user', JSON.stringify(user));

            showNotification('Profile picture removed successfully.', 'success');
        } else {
            showNotification(data.message || 'Failed to remove profile picture', 'error');
        }
    } catch (error) {
        console.error('Delete error:', error);
        showNotification('Failed to remove profile picture. Please try again.', 'error');
    }
}
// Toggle Tags Function
function toggleTags(btn, hiddenCount) {
    const container = btn.previousElementSibling;
    const isExpanded = container.classList.toggle('tag-container-expanded');
    btn.textContent = isExpanded ? 'Show Less' : `Show More (+${hiddenCount})`;
}
