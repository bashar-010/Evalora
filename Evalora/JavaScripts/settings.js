document.addEventListener('DOMContentLoaded', () => {
    setupSettingsLogic();
    setupLogoutListener();
});

function setupLogoutListener() {
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.onclick = async (e) => {
            e.preventDefault();
            if (await showConfirm('Are you sure you want to log out?', 'Confirm Logout')) {
                localStorage.clear();
                window.location.href = 'login.html';
            }
        };
    }
}

function setupSettingsLogic() {
    // Logo edit functionality
    const logoModal = document.getElementById('logoModal');
    const editLogoBtn = document.getElementById('editLogoBtn');
    const cancelLogoBtn = document.getElementById('cancelLogoBtn');
    const saveLogoBtn = document.getElementById('saveLogoBtn');
    const logoUpload = document.getElementById('logoUpload');
    const logoImage = document.getElementById('logoImage');

    let selectedLogoFile = null;

    if (editLogoBtn) {
        editLogoBtn.onclick = () => logoModal.classList.add('active');
    }

    if (cancelLogoBtn) {
        cancelLogoBtn.onclick = () => {
            logoModal.classList.remove('active');
            logoUpload.value = '';
            selectedLogoFile = null;
        };
    }

    if (logoUpload) {
        logoUpload.onchange = (e) => {
            selectedLogoFile = e.target.files[0];
        };
    }

    if (saveLogoBtn) {
        saveLogoBtn.onclick = () => {
            if (selectedLogoFile) {
                const reader = new FileReader();
                reader.onload = async (e) => {
                    logoImage.src = e.target.result;
                    await showAlert('Logo updated successfully!', 'success');
                    logoModal.classList.remove('active');
                    logoUpload.value = '';
                };
                reader.readAsDataURL(selectedLogoFile);
            } else {
                showAlert('Please select a logo file', 'error');
            }
        };
    }

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

    if (editColorsBtn) {
        editColorsBtn.onclick = () => colorsModal.classList.add('active');
    }

    if (cancelColorsBtn) {
        cancelColorsBtn.onclick = () => {
            colorsModal.classList.remove('active');
            primaryColorPicker.value = primaryColorCode.textContent;
            accentColorPicker.value = accentColorCode.textContent;
        };
    }

    if (saveColorsBtn) {
        saveColorsBtn.onclick = async () => {
            const primaryColor = primaryColorPicker.value.toUpperCase();
            const accentColor = accentColorPicker.value.toUpperCase();

            primaryColorCircle.style.backgroundColor = primaryColor;
            accentColorCircle.style.backgroundColor = accentColor;
            primaryColorCode.textContent = primaryColor;
            accentColorCode.textContent = accentColor;

            await showAlert('Theme colors updated successfully!', 'success');
            colorsModal.classList.remove('active');
        };
    }

    // Form submission
    const settingsForm = document.getElementById('settingsForm');
    if (settingsForm) {
        settingsForm.onsubmit = async (e) => {
            e.preventDefault();

            const platformName = document.getElementById('platformName').value;
            const footerText = document.getElementById('footerText').value;
            const primaryColor = primaryColorCode.textContent;
            const accentColor = accentColorCode.textContent;

            const settings = {
                platformName,
                footerText,
                primaryColor,
                accentColor,
                logo: logoImage.src
            };

            console.log('Settings saved:', settings);
            await showAlert('Settings saved successfully!', 'success');
        };
    }

    // Generic outside click closer for modals
    window.onclick = (e) => {
        if (e.target.classList.contains('modal') || e.target.classList.contains('modal-overlay')) {
            e.target.classList.remove('active');
        }
    };
}
