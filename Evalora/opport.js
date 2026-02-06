/* ---------------- FILTER PANEL ---------------- */

const filterBtn = document.getElementById("filterBtn");
const filterPanel = document.getElementById("filterPanel");
const filterOverlay = document.getElementById("filterOverlay");
const dropdownTitles = document.querySelectorAll(".filter-title");
const dropdownOptions = document.querySelectorAll(".filter-options");
const optionButtons = document.querySelectorAll(".option-btn");
const clearFiltersBtn = document.querySelector(".clear-filters");
const applyFiltersBtn = document.querySelector(".apply-filters");

/* ------ Open Filter Panel ------ */
if (filterBtn) {
    filterBtn.addEventListener("click", () => {
        filterPanel.classList.add("active");
        filterOverlay.classList.add("active");
        document.body.style.overflow = "hidden";
    });
}

/* ------ Close Panel ------ */
function closeFilterPanel() {
    filterPanel.classList.remove("active");
    filterOverlay.classList.remove("active");
    document.body.style.overflow = "auto";
}

if (filterOverlay) {
    filterOverlay.addEventListener("click", closeFilterPanel);
}

/* ------ Apply Filters ------ */
if (applyFiltersBtn) {
    applyFiltersBtn.addEventListener("click", () => {
        closeFilterPanel();
    });
}

/* ------ Clear Filters ------ */
if (clearFiltersBtn) {
    clearFiltersBtn.addEventListener("click", () => {
        optionButtons.forEach(btn => btn.classList.remove("active"));
    });
}

/* ---------------- DROPDOWNS (Type – Fields – Experience) ---------------- */
dropdownTitles.forEach((title, index) => {
    title.addEventListener("click", () => {

        // Close all others
        dropdownOptions.forEach((opt, i) => {
            if (i !== index) opt.style.display = "none";
        });

        // Toggle clicked one
        const current = dropdownOptions[index];
        current.style.display = current.style.display === "block" ? "none" : "block";
    });
});

/* ---------------- SELECT OPTIONS RADIO STYLE ---------------- */
optionButtons.forEach(btn => {
    btn.addEventListener("click", () => {
        const group = btn.dataset.group;

        // Remove active from same group
        optionButtons.forEach(other => {
            if (other.dataset.group === group) {
                other.classList.remove("active");
            }
        });

        // Activate clicked
        btn.classList.add("active");
    });
});

/* ---------------- CAROUSEL SCROLL WITH ARROWS ---------------- */

function scrollCarousel(id, direction) {
    const carousel = document.getElementById(id);
    if (!carousel) return;

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

// Fetch Opportunities on Load
document.addEventListener('DOMContentLoaded', async () => {
    try {
        const data = await window.api.getOpportunities();
        if (data && data.opportunities) {
            renderOpportunities(data.opportunities);
        }
    } catch (error) {
        console.error('Failed to load opportunities:', error);
    }
});

function renderOpportunities(opportunities) {
    const carousel = document.getElementById('carousel1');
    if (!carousel) return;

    carousel.innerHTML = ''; // Clear existing static content
    opportunitiesData = {}; // Reset data store

    opportunities.forEach(opp => {
        // Store for modal access
        opportunitiesData[opp._id] = opp;

        const card = document.createElement('div');
        card.className = 'card';
        card.onclick = () => openOpportunityModal(opp._id);

        // Determine logo style based on company name (simple heuristic)
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

        card.innerHTML = `
            <div class="card-logo ${logoClass}">${logoContent}</div>
            <h3>${opp.title}</h3>
            <p class="deadline">Apply before ${new Date(opp.createdAt).toLocaleDateString()}</p>
            <p class="description">${opp.description.substring(0, 100)}...</p>
            <span class="badge">New Opportunity</span>
            <button class="btn-details">View Details →</button>
        `;

        carousel.appendChild(card);
    });
}

function openOpportunityModal(id) {
    const data = opportunitiesData[id];
    currentOpportunityId = id;

    if (!data) {
        console.log("Opportunity data not found for:", id);
        return;
    }

    // Populate modal with data
    document.getElementById("modalJobTitle").textContent = data.title;
    // document.getElementById("modalDeadline").textContent = data.deadline; // Backend might not have deadline yet
    document.getElementById("modalLocation").textContent = "Amman (on-site)"; // Default or from data
    document.getElementById("modalType").textContent = "Internship"; // Default or from data
    document.getElementById("modalDuration").textContent = "3 Months"; // Default or from data
    document.getElementById("modalLevel").textContent = "Beginner"; // Default or from data
    document.getElementById("modalAbout").textContent = data.description;
    document.getElementById("modalSkills").textContent = data.requirements || "Not specified";
    document.getElementById("modalCompanyTitle").textContent = `About ${data.company ? data.company.name : 'Company'}`;
    document.getElementById("modalCompanyDesc").textContent = "Leading company in the field."; // Placeholder

    // Set logo (simplified for now)
    const logoElement = document.getElementById("modalLogo");
    logoElement.className = `modal-company-logo orange`;
    logoElement.textContent = data.company ? data.company.name.substring(0, 2).toUpperCase() : 'CO';

    // Set responsibilities (if available, otherwise hide or show placeholder)
    const responsibilitiesList = document.getElementById("modalResponsibilities");
    responsibilitiesList.innerHTML = "";
    if (data.responsibilities) {
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
    applyBtn.onclick = applyToOpportunity;
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
