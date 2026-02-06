// Tab switching functionality
const tabButtons = document.querySelectorAll('.tab-btn');
tabButtons.forEach(button => {
    button.addEventListener('click', () => {
        tabButtons.forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');
    });
});

// Like button functionality
const postLikes = document.querySelectorAll('.post-likes');
postLikes.forEach(like => {
    like.addEventListener('click', function () {
        const currentLikes = parseInt(this.textContent.match(/\d+/)[0]);
        const newLikes = this.classList.contains('liked') ? currentLikes - 1 : currentLikes + 1;
        this.textContent = `❤️ ${newLikes}`;
        this.classList.toggle('liked');
    });
});

// Create post button
const createPostBtn = document.querySelector('.create-post-btn');
createPostBtn.addEventListener('click', () => {
    alert('Create post functionality would open a modal here!');
});

// Add project button
const addProjectBtn = document.querySelector('.add-btn');
addProjectBtn.addEventListener('click', () => {
    alert('Add project functionality would open a form here!');
});

// Add skill button
const addSkillBtn = document.querySelector('.add-skill-btn');
addSkillBtn.addEventListener('click', () => {
    alert('Add skill functionality would open a modal here!');
});

// Add achievement button
const addAchievementBtn = document.querySelector('.add-achievement-btn');
addAchievementBtn.addEventListener('click', () => {
    alert('Add achievement functionality would open a form here!');
});

// View project buttons
const viewProjectBtns = document.querySelectorAll('.view-btn');
viewProjectBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        alert('View project functionality would navigate to project details!');
    });
});

// Edit profile button
const editProfileBtn = document.querySelector('.edit-profile-btn');
editProfileBtn.addEventListener('click', () => {
    alert('Edit profile functionality would open an edit form!');
});

// Smooth scroll for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth'
            });
        }
    });
});

// Score circle animation on page load
window.addEventListener('load', async () => {
    const scoreCircle = document.querySelector('.score-circle circle:last-child');
    if (scoreCircle) {
        scoreCircle.style.transition = 'stroke-dashoffset 2s ease-in-out';
    }

    // Fetch User Data
    try {
        const data = await window.api.getMe();
        if (data && data.user) {
            document.getElementById('profileName').textContent = data.user.name;
            // Update other fields if available in user object
            // document.getElementById('profileUniversity').textContent = data.user.university || 'University';
            // document.getElementById('profileMajor').textContent = data.user.major || 'Major';

            if (data.user.score) {
                document.getElementById('user-score').textContent = data.user.score;
            }
        }

        // Load User Projects
        await loadMyProjects();

    } catch (error) {
        console.error('Failed to load profile:', error);
    }
});

// OPEN & CLOSE POPUPS
function openPopup(id) {
    document.getElementById(id).style.display = "flex";
}

function closePopup(id) {
    document.getElementById(id).style.display = "none";
}

// Close popup when clicking outside
document.querySelectorAll('.popup-overlay').forEach(popup => {
    popup.addEventListener('click', (e) => {
        if (e.target === popup) popup.style.display = "none";
    });
});

// OPEN & CLOSE POPUPS
function openPopup(id) {
    document.getElementById(id).style.display = "flex";
}

function closePopup(id) {
    document.getElementById(id).style.display = "none";
}

// Close popup when clicking outside
document.querySelectorAll('.popup-overlay').forEach(popup => {
    popup.addEventListener('click', (e) => {
        if (e.target === popup) popup.style.display = "none";
    });
});

// ===============================
// ADD PROJECT TO PROFILE
// ===============================
async function submitProject() {
    const name = document.getElementById("projectName").value.trim();
    const desc = document.getElementById("projectDesc").value.trim();
    const link = document.getElementById("projectLink").value.trim();
    const techInput = document.getElementById("projectTech").value.trim();
    const file = document.getElementById("projectFile").value;

    if (!name) {
        alert("Please enter a project name.");
        return;
    }

    if (!file && !link) {
        alert("Upload a file OR provide a link.");
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

    try {
        await window.api.createProject(projectData);
        alert("Project submitted successfully! AI Evaluation started.");

        // Close popups
        closePopup("popup-upload");

        // Clear fields
        document.getElementById("projectName").value = "";
        document.getElementById("projectDesc").value = "";
        document.getElementById("projectLink").value = "";
        document.getElementById("projectTech").value = "";
        document.getElementById("projectFile").value = "";

        // Reload to show new project 
        // (and potentially updated score if backend is fast enough, though score update might take a moment)
        await loadMyProjects();

    } catch (error) {
        alert("Failed to submit project: " + (error.message || "Unknown error"));
    }
}

// ===============================
// LOAD USER PROJECTS
// ===============================
async function loadMyProjects() {
    try {
        const data = await window.api.getMyProjects();
        const projectsContainer = document.getElementById("projectsList");
        projectsContainer.innerHTML = ''; // Clear existing content

        if (data.projects && data.projects.length > 0) {
            // API returns sorted by createdAt desc (newest first)
            data.projects.forEach(project => {
                addProjectToProfile(project);
            });
        } else {
            projectsContainer.innerHTML = '<p style="text-align:center; padding:20px; color:#666;">No projects added yet.</p>';
        }
    } catch (error) {
        console.error("Error loading projects:", error);
    }
}

// ===============================
// FUNCTION: APPEND PROJECT TO PROFILE LIST
// ===============================
function addProjectToProfile(project) {
    const projectsContainer = document.getElementById("projectsList");

    const card = document.createElement("div");
    card.classList.add("project-card");

    // Technologies tags
    let techHtml = '';
    if (project.technologies && project.technologies.length > 0) {
        techHtml = project.technologies.map(t => `<span class="tag" style="background:#006D77;">${t}</span>`).join('');
    }

    // Progress / Score Display
    let progressText = 'Pending...';
    if (project.status === 'scored') {
        progressText = `${project.score}%`;
    }

    card.innerHTML = `
        <div class="project-header">
            <h3 class="project-title">${project.title}</h3>
            <span class="project-progress">${progressText}</span>
        </div>

        <p class="project-description">${project.description || ''}</p>

        <div class="project-tags">
            ${techHtml}
        </div>

        <button class="view-btn" onclick="if('${project.repoUrl}') window.open('${project.repoUrl}', '_blank')">View Project</button>
    `;

    // Append child since we are iterating the sorted list
    projectsContainer.appendChild(card);
}

// ===============================
// BUTTON: OPEN POPUP 1
// ===============================
document.querySelector('.add-btn').addEventListener('click', () => {
    openPopup('popup-upload');
});

