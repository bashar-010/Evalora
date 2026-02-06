/* ---------------- FILTER PANEL ---------------- */
const filterBtn = document.getElementById("filterBtn");
const filterPanel = document.getElementById("filterPanel");
const filterOverlay = document.getElementById("filterOverlay");
const clearFiltersBtn = document.querySelector(".clear-filters");
const applyFiltersBtn = document.querySelector(".apply-filters");

/* ------ Open Filter Panel ------ */
filterBtn.addEventListener("click", () => {
    filterPanel.classList.add("active");
    filterOverlay.classList.add("active");
    document.body.style.overflow = "hidden";
});

/* ------ Close Panel ------ */
function closeFilterPanel() {
    filterPanel.classList.remove("active");
    filterOverlay.classList.remove("active");
    document.body.style.overflow = "auto";
}

filterOverlay.addEventListener("click", closeFilterPanel);

/* ------ Apply Filters ------ */
applyFiltersBtn.addEventListener("click", async () => {
    const filters = {};
    const activeOptions = document.querySelectorAll(".option-btn.active");

    activeOptions.forEach(btn => {
        const group = btn.dataset.group;
        const value = btn.textContent;
        filters[group] = value;
    });

    console.log("Applying filters:", filters);
    closeFilterPanel();

    try {
        const oppsData = await window.api.getOpportunities(filters);
        if (oppsData && oppsData.opportunities) {
            await renderOpportunities(oppsData.opportunities, globalRecommendations);
        }
    } catch (error) {
        console.error('Failed to filter opportunities:', error);
    }
});

/* ------ Clear Filters ------ */
clearFiltersBtn.addEventListener("click", async () => {
    document.querySelectorAll(".option-btn").forEach(btn => btn.classList.remove("active"));

    // Refresh with no filters
    try {
        const oppsData = await window.api.getOpportunities();
        if (oppsData && oppsData.opportunities) {
            await renderOpportunities(oppsData.opportunities, globalRecommendations);
        }
    } catch (error) {
        console.error('Failed to clear filters:', error);
    }
});

/* ---------------- DROPDOWNS ---------------- */
function setupDropdownListeners() {
    const dropdownTitles = document.querySelectorAll(".filter-title");
    const dropdownOptions = document.querySelectorAll(".filter-options");

    dropdownTitles.forEach((title, index) => {
        title.onclick = () => {
            // Close all others
            dropdownOptions.forEach((opt, i) => {
                if (i !== index) opt.style.display = "none";
            });

            // Toggle clicked one
            const current = dropdownOptions[index];
            current.style.display = current.style.display === "block" ? "none" : "block";
        };
    });
}

function renderFilterGroup(containerId, groupName, values) {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = values.map(val => `
        <button class="option-btn" data-group="${groupName}">${val}</button>
    `).join('');

    // Re-attach listeners to new buttons
    container.querySelectorAll('.option-btn').forEach(btn => {
        btn.onclick = () => {
            // Remove active from same group
            container.querySelectorAll('.option-btn').forEach(other => {
                other.classList.remove('active');
            });
            // Activate clicked
            btn.classList.add('active');
        };
    });
}

/* ---------------- CAROUSEL SCROLL WITH ARROWS ---------------- */

function scrollCarousel(id, direction) {
    const carousel = document.getElementById(id);

    // Scroll amount = width of one card + gap
    const amount = 320;

    carousel.scrollBy({
        left: amount * direction,
        behavior: "smooth"
    });
}

/* Enable dragging with mouse (optional but nice) */
document.querySelectorAll(".carousel").forEach(carousel => {
    let isDown = false;
    let startX;
    let scrollLeft;

    carousel.addEventListener("mousedown", (e) => {
        isDown = true;
        startX = e.pageX - carousel.offsetLeft;
        scrollLeft = carousel.scrollLeft;
    });

    carousel.addEventListener("mouseup", () => {
        isDown = false;
    });

    carousel.addEventListener("mouseleave", () => {
        isDown = false;
    });

    carousel.addEventListener("mousemove", (e) => {
        if (!isDown) return;
        e.preventDefault();
        const x = e.pageX - carousel.offsetLeft;
        const walk = (x - startX) * 1.5;
        carousel.scrollLeft = scrollLeft - walk;
    });
});

/* ---------------- OPPORTUNITY MODAL ---------------- */

const opportunityModal = document.getElementById("opportunityModal");
let currentOpportunityId = null;

// Dynamic Data Store
let opportunitiesData = {};
let globalRecommendations = [];

// Fetch Opportunities and Recommendations on Load
document.addEventListener('DOMContentLoaded', async () => {
    try {
        console.log("Fetching opportunities and recommendations...");

        // Fetch in parallel
        const [oppsData, recsData, filtersData] = await Promise.all([
            window.api.getOpportunities(),
            window.api.getRecommendations(),
            window.api.getOpportunityFilters()
        ]);

        console.log("Data received:", { oppsData, recsData, filtersData });

        // Render Filters Dynamically
        if (filtersData) {
            if (filtersData.types) renderFilterGroup('filterOptionsType', 'type', filtersData.types);
            if (filtersData.statuses) renderFilterGroup('filterOptionsStatus', 'status', filtersData.statuses);
            if (filtersData.locations) renderFilterGroup('filterOptionsLocation', 'location', filtersData.locations);
        }
        setupDropdownListeners();

        if (recsData && recsData.recommendations) {
            globalRecommendations = recsData.recommendations;
            renderRecommendations(globalRecommendations);
        }

        if (oppsData && oppsData.opportunities) {
            await renderOpportunities(oppsData.opportunities, globalRecommendations);
        }
    } catch (error) {
        console.error('Initialization error:', error);
    }
});

async function renderOpportunities(opportunities, recommendations = []) {
    const carousel = document.getElementById('carousel1');
    if (!carousel) return;

    const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
    carousel.innerHTML = ''; // Clear existing static content
    opportunitiesData = {}; // Reset data store

    opportunities.forEach(opp => {
        // Check if this opportunity is recommended
        const rec = recommendations.find(r => r._id === opp._id);
        const matchScore = rec ? rec.matchScore : 0;
        const matchReasons = rec ? rec.matchReasons : [];

        // Store for modal access
        opportunitiesData[opp._id] = { ...opp, matchScore, matchReasons };

        // Check user application status
        const myApp = opp.applications?.find(a => a.student === currentUser.id || a.student === currentUser._id || a.student?._id === currentUser.id || a.student?._id === currentUser._id);
        const status = myApp ? myApp.status : null;

        const card = document.createElement('div');
        card.className = 'card';
        card.onclick = () => openOpportunityModal(opp._id, false);

        let logoClass = 'orange';
        let logoContent = 'O';
        const companyName = opp.company ? opp.company.name : 'Company';

        if (companyName.toLowerCase().includes('microsoft')) {
            logoClass = 'microsoft';
            logoContent = `
                <div class="ms-square red"></div>
                <div class="ms-square green"></div>
                <div class="ms-square blue"></div>
                <div class="ms-square yellow"></div>
            `;
        } else if (companyName.toLowerCase().includes('google')) {
            logoClass = 'google';
            logoContent = 'G';
        } else if (companyName.toLowerCase().includes('python')) {
            logoClass = 'python';
            logoContent = '<div class="py-icon"></div>';
        } else if (companyName.toLowerCase().includes('orange')) {
            logoClass = 'orange';
            logoContent = 'orange';
        }

        let statusBadge = '<span class="badge">New Opportunity</span>';
        if (status === 'accepted') {
            statusBadge = '<span class="badge" style="color: #4caf50;">Accepted</span>';
        } else if (status === 'rejected') {
            statusBadge = '<span class="badge" style="color: #f44336;">Rejected</span>';
        } else if (status === 'pending') {
            statusBadge = '<span class="badge" style="color: #ff9800;">Applied (Pending)</span>';
        } else if (currentUser.role === 'student' && matchScore > 0) {
            // Only show match score to students
            statusBadge = `<span class="badge" style="color: #006D77;">${matchScore}% Match</span>`;
        }


        card.innerHTML = `
            <div class="card-logo ${logoClass}">${logoContent}</div>
            <h3>${opp.title}</h3>
            <p class="deadline">Apply before ${opp.deadline ? new Date(opp.deadline).toLocaleDateString() : 'Mar 15, 2025'}</p>
            <p class="description">${opp.description.substring(0, 100)}${opp.description.length > 100 ? '...' : ''}</p>
            ${statusBadge}
            <button class="btn-details">View Details →</button>
        `;

        carousel.appendChild(card);
    });
}

function renderRecommendations(recommendations) {
    const carousel2 = document.getElementById('carousel2');
    const recommendationsSection = document.querySelector('.recommendations');
    if (!carousel2 || !recommendationsSection) return;

    const currentUser = JSON.parse(localStorage.getItem('user') || '{}');

    // Hide recommendations for companies and admins
    if (currentUser.role === 'company' || currentUser.role === 'admin') {
        recommendationsSection.style.display = 'none';
        return;
    }

    recommendationsSection.style.display = 'block'; // Always show section if user is curious
    carousel2.innerHTML = '';

    if (recommendations.length === 0) {
        carousel2.innerHTML = `
            <div class="card" style="min-width: 300px; display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center; background: #f8f9fa; border: 2px dashed #ccc;">
                <div style="font-size: 40px; margin-bottom: 10px;">🤖</div>
                <h3>Personalize Your AI Matches</h3>
                <p style="font-size: 13px; color: #666; margin: 10px 0;">Add your skills and projects to your profile to see tailored recommendations.</p>
                <a href="profile.html" style="color: #006D77; font-weight: bold; text-decoration: none;">Go to Profile →</a>
            </div>
        `;
        return;
    }

    recommendations.forEach(opp => {
        // Ensure data is available for modal
        opportunitiesData[opp._id] = { ...opp };

        // Check user application status
        const myApp = opp.applications?.find(a => a.student === currentUser.id || a.student === currentUser._id || a.student?._id === currentUser.id || a.student?._id === currentUser._id);
        const status = myApp ? myApp.status : null;

        const card = document.createElement('div');
        card.className = 'card';
        card.onclick = () => openOpportunityModal(opp._id, true);

        let logoClass = 'orange';
        let logoContent = 'O';
        const companyName = opp.company ? opp.company.name : 'Company';

        if (companyName.toLowerCase().includes('microsoft')) {
            logoClass = 'microsoft';
            logoContent = `
                <div class="ms-square red"></div>
                <div class="ms-square green"></div>
                <div class="ms-square blue"></div>
                <div class="ms-square yellow"></div>
            `;
        } else if (companyName.toLowerCase().includes('google')) {
            logoClass = 'google';
            logoContent = 'G';
        } else if (companyName.toLowerCase().includes('python')) {
            logoClass = 'python';
            logoContent = '<div class="py-icon"></div>';
        } else if (companyName.toLowerCase().includes('orange')) {
            logoClass = 'orange';
            logoContent = 'orange';
        }

        const score = opp.matchScore || 0;
        const scoreColor = score >= 70 ? '#c9a236' : (score >= 40 ? '#006D77' : '#5a7c85');
        const matchBadge = `<span class="badge" style="color: ${scoreColor};">AI Match: ${score}%</span>`;

        let statusBadge = '';
        if (status === 'accepted') {
            statusBadge = `<span class="badge" style="color: #4caf50;">Accepted</span> <span style="font-size: 12px; color: #666; margin-left: 5px;">(${score}%)</span>`;
        } else if (status === 'rejected') {
            statusBadge = `<span class="badge" style="color: #f44336;">Rejected</span> <span style="font-size: 12px; color: #666; margin-left: 5px;">(${score}%)</span>`;
        } else if (status === 'pending') {
            statusBadge = `<span class="badge" style="color: #ff9800;">Applied (Pending)</span> <span style="font-size: 12px; color: #666; margin-left: 5px;">(${score}%)</span>`;
        } else {
            statusBadge = matchBadge;
        }


        card.innerHTML = `
            <div class="card-logo ${logoClass}">${logoContent}</div>
            <h3>${opp.title}</h3>
            <p class="deadline">Apply before ${opp.deadline ? new Date(opp.deadline).toLocaleDateString() : 'Mar 1, 2025'}</p>
            <p class="description">${opp.description.substring(0, 100)}...</p>
            ${statusBadge}
            <button class="btn-details">View Details →</button>
        `;
        carousel2.appendChild(card);
    });
}

function openOpportunityModal(id, fromAI = false) {
    const data = opportunitiesData[id];
    currentOpportunityId = id;

    if (!data) {
        console.log("Opportunity data not found for:", id);
        return;
    }

    // Populate modal with data
    document.getElementById("modalJobTitle").textContent = data.title;
    document.getElementById("modalDeadline").textContent = `Apply before ${data.deadline ? new Date(data.deadline).toLocaleDateString() : 'Not specified'}`;
    document.getElementById("modalLocation").textContent = data.location || "Amman (on-site)";
    document.getElementById("modalType").textContent = data.type || "Internship";
    document.getElementById("modalDuration").textContent = data.duration || "3 Months";
    document.getElementById("modalAbout").textContent = data.description;
    document.getElementById("modalSkills").textContent = (data.requirements && data.requirements.length > 0) ? data.requirements.join(", ") : "Not specified";
    document.getElementById("modalCompanyTitle").textContent = `About ${data.company ? data.company.name : 'Company'}`;
    document.getElementById("modalCompanyDesc").textContent = data.company?.description || "Leading company in the field.";

    // AI Match Score
    const matchEl = document.getElementById("modalMatchScore");
    const infoGrid = document.querySelector('.modal-info-grid');
    const matchContainer = matchEl?.closest('.info-item');

    const currentUser = JSON.parse(localStorage.getItem('user') || '{}');

    if (matchContainer) {
        if (fromAI && data.matchScore > 0 && currentUser.role === 'student') {
            matchContainer.style.display = 'block';
            if (infoGrid) infoGrid.style.gridTemplateColumns = 'repeat(4, 1fr)';
            matchEl.textContent = `${data.matchScore}%`;
            matchEl.style.color = data.matchScore >= 70 ? '#c9a236' : (data.matchScore >= 40 ? '#006D77' : '#5a7c85');
            matchEl.style.fontWeight = 'bold';
        } else {
            matchContainer.style.display = 'none';
            if (infoGrid) infoGrid.style.gridTemplateColumns = 'repeat(3, 1fr)';
        }
    }

    // Set Match Reasons
    const whySection = document.getElementById("whyMatchSection");
    const whyList = document.getElementById("modalMatchReasons");
    if (whySection && whyList) {
        if (data.matchScore > 0 && data.matchReasons && data.matchReasons.length > 0 && currentUser.role === 'student') {
            whySection.style.display = 'block';
            whyList.innerHTML = data.matchReasons.map(reason => `<li>${reason}</li>`).join("");
        } else {
            whySection.style.display = 'none';
        }
    }

    // Set logo
    const logoElement = document.getElementById("modalLogo");
    const companyName = data.company ? data.company.name : 'Company';
    let logoClass = 'orange';
    logoElement.textContent = companyName.substring(0, 2).toUpperCase();

    // Feedback logic
    const myApp = data.applications?.find(a => a.student === currentUser.id || a.student === currentUser._id || a.student?._id === currentUser.id || a.student?._id === currentUser._id);
    const feedbackSection = document.getElementById('companyFeedbackSection');
    const feedbackText = document.getElementById('modalFeedbackText');

    if (myApp && myApp.message) {
        feedbackSection.style.display = 'block';
        feedbackText.textContent = `"${myApp.message}"`;
    } else {
        feedbackSection.style.display = 'none';
    }

    if (companyName.toLowerCase().includes('microsoft')) {
        logoClass = 'microsoft';
        logoElement.innerHTML = '<div class="ms-square red"></div><div class="ms-square green"></div><div class="ms-square blue"></div><div class="ms-square yellow"></div>';
    } else if (companyName.toLowerCase().includes('google')) {
        logoClass = 'google';
        logoElement.textContent = 'G';
    } else if (companyName.toLowerCase().includes('python')) {
        logoClass = 'python';
        logoElement.innerHTML = '<div class="py-icon"></div>';
    } else if (companyName.toLowerCase().includes('orange')) {
        logoClass = 'orange';
        logoElement.textContent = 'orange';
    }

    logoElement.className = `modal-company-logo ${logoClass}`;

    // Set responsibilities
    const responsibilitiesList = document.getElementById("modalResponsibilities");
    responsibilitiesList.innerHTML = "";
    if (data.responsibilities && data.responsibilities.length > 0) {
        data.responsibilities.forEach(item => {
            const li = document.createElement("li");
            li.textContent = item;
            responsibilitiesList.appendChild(li);
        });
    } else {
        responsibilitiesList.innerHTML = "<li>See description for details</li>";
    }

    // Show modal
    opportunityModal.classList.add("active");
    document.body.style.overflow = "hidden";

    // Setup Apply Button
    const applyBtn = document.querySelector('.modal-apply-btn');
    const status = myApp ? myApp.status : null;

    if (status) {
        applyBtn.disabled = true;
        applyBtn.style.opacity = '0.7';
        applyBtn.style.cursor = 'not-allowed';

        if (status === 'accepted') {
            applyBtn.textContent = 'Application Accepted';
            applyBtn.style.background = '#4caf50';
        } else if (status === 'rejected') {
            applyBtn.textContent = 'Application Rejected';
            applyBtn.style.background = '#f44336';
        } else {
            applyBtn.textContent = 'Already Applied';
            applyBtn.style.background = '#ff9800';
        }
    } else {
        applyBtn.disabled = false;
        applyBtn.style.opacity = '1';
        applyBtn.style.cursor = 'pointer';
        applyBtn.textContent = 'Apply Now';
        applyBtn.style.background = ''; // Revert to CSS default
        applyBtn.onclick = applyToOpportunity;
    }
}

async function applyToOpportunity() {
    if (!currentOpportunityId) return;

    try {
        await window.api.applyToOpportunity(currentOpportunityId);
        alert('Applied successfully!');
        closeOpportunityModal();
    } catch (error) {
        alert('Failed to apply: ' + error.message);
    }
}

function closeOpportunityModal() {
    opportunityModal.classList.remove("active");
    document.body.style.overflow = "auto";
    currentOpportunityId = null;
}

// Close modal on Escape key
document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && opportunityModal.classList.contains("active")) {
        closeOpportunityModal();
    }
});
