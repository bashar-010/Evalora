// Get elements
        const logoutBtn = document.getElementById('logoutBtn');
        const logoutModal = document.getElementById('logoutModal');
        const cancelBtn = document.getElementById('cancelBtn');
        const confirmBtn = document.getElementById('confirmBtn');

        // Show modal when logout is clicked
        logoutBtn.addEventListener('click', function() {
            logoutModal.classList.add('active');
        });

        // Hide modal when cancel is clicked
        cancelBtn.addEventListener('click', function() {
            logoutModal.classList.remove('active');
        });

        // Handle logout confirmation
        confirmBtn.addEventListener('click', function() {
            // Add your logout logic here
            alert('Logging out...');
            logoutModal.classList.remove('active');
            // Example: window.location.href = '/login';
        });

        // Close modal when clicking outside
        logoutModal.addEventListener('click', function(e) {
            if (e.target === logoutModal) {
                logoutModal.classList.remove('active');
            }
        });

// Logo edit functionality
const logoModal = document.getElementById('logoModal');
const editLogoBtn = document.getElementById('editLogoBtn');
const cancelLogoBtn = document.getElementById('cancelLogoBtn');
const saveLogoBtn = document.getElementById('saveLogoBtn');
const logoUpload = document.getElementById('logoUpload');
const logoImage = document.getElementById('logoImage');

let selectedLogoFile = null;

editLogoBtn.addEventListener('click', function() {
    logoModal.classList.add('active');
});

cancelLogoBtn.addEventListener('click', function() {
    logoModal.classList.remove('active');
    logoUpload.value = '';
    selectedLogoFile = null;
});

logoUpload.addEventListener('change', function(e) {
    selectedLogoFile = e.target.files[0];
});

saveLogoBtn.addEventListener('click', function() {
    if (selectedLogoFile) {
        const reader = new FileReader();
        reader.onload = function(e) {
            logoImage.src = e.target.result;
            alert('Logo updated successfully!');
            logoModal.classList.remove('active');
            logoUpload.value = '';
        };
        reader.readAsDataURL(selectedLogoFile);
    } else {
        alert('Please select a logo file');
    }
});

// Theme colors edit functionality
const colorsModal = document.getElementById('colorsModal');
const editColorsBtn = document.getElementById('editColorsBtn');
const cancelColorsBtn = document.getElementById('cancelColorsBtn');
const saveColorsBtn = document.getElementById('saveColorsBtn');
const primaryColorPicker = document.getElementById('primaryColorPicker');
const accentColorPicker = document.getElementById('accentColorPicker');
const primaryColorCircle = document.getElementById('primaryColorCircle');
const accentColorCircle = document.getElementById('accentColorCircle');
const primaryColorCode = document.getElementById('primaryColorCode');
const accentColorCode = document.getElementById('accentColorCode');

editColorsBtn.addEventListener('click', function() {
    colorsModal.classList.add('active');
});

cancelColorsBtn.addEventListener('click', function() {
    colorsModal.classList.remove('active');
    // Reset to current values
    primaryColorPicker.value = primaryColorCode.textContent;
    accentColorPicker.value = accentColorCode.textContent;
});

saveColorsBtn.addEventListener('click', function() {
    const primaryColor = primaryColorPicker.value.toUpperCase();
    const accentColor = accentColorPicker.value.toUpperCase();
    
    // Update the display
    primaryColorCircle.style.backgroundColor = primaryColor;
    accentColorCircle.style.backgroundColor = accentColor;
    primaryColorCode.textContent = primaryColor;
    accentColorCode.textContent = accentColor;
    
    alert('Theme colors updated successfully!');
    colorsModal.classList.remove('active');
});

// Close modals when clicking outside
window.addEventListener('click', function(e) {
    if (e.target === logoModal) {
        logoModal.classList.remove('active');
    }
    if (e.target === colorsModal) {
        colorsModal.classList.remove('active');
    }
});

// Form submission
const settingsForm = document.getElementById('settingsForm');

settingsForm.addEventListener('submit', function(e) {
    e.preventDefault();
    
    const platformName = document.getElementById('platformName').value;
    const footerText = document.getElementById('footerText').value;
    const primaryColor = primaryColorCode.textContent;
    const accentColor = accentColorCode.textContent;
    
    // Collect all settings
    const settings = {
        platformName,
        footerText,
        primaryColor,
        accentColor,
        logo: logoImage.src
    };
    
    console.log('Settings saved:', settings);
    alert('Settings saved successfully!');
    
    // In a real application, you would send this data to a server
});