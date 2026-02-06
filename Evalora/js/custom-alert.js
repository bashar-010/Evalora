/**
 * Custom Alert System for Evalora
 */

window.showAlert = function (message, type = 'success', title = 'Evalora says') {
    return new Promise((resolve) => {
        let overlay = document.querySelector('.custom-alert-overlay');

        if (!overlay) {
            overlay = document.createElement('div');
            overlay.className = 'custom-alert-overlay';
            overlay.innerHTML = `
                <div class="custom-alert-box">
                    <div class="custom-alert-header">
                        <span class="alert-title"></span>
                        <span class="close-icon" style="cursor:pointer; font-size: 20px;">&times;</span>
                    </div>
                    <div class="custom-alert-body"></div>
                    <div class="custom-alert-input-container" style="display:none; padding: 0 20px 10px;">
                        <input type="text" class="custom-alert-input" style="width:100%; padding:10px; border:1px solid #ddd; border-radius:5px; background:rgba(255,255,255,0.05); color:white;">
                    </div>
                    <div class="custom-alert-footer">
                        <button class="custom-alert-btn custom-alert-btn-secondary" style="display:none;">Cancel</button>
                        <button class="custom-alert-btn custom-alert-btn-primary">OK</button>
                    </div>
                </div>
            `;
            document.body.appendChild(overlay);
        }

        const box = overlay.querySelector('.custom-alert-box');
        const body = overlay.querySelector('.custom-alert-body');
        const titleEl = overlay.querySelector('.alert-title');
        const inputContainer = overlay.querySelector('.custom-alert-input-container');
        const input = overlay.querySelector('.custom-alert-input');
        const okBtn = overlay.querySelector('.custom-alert-btn-primary');
        const cancelBtn = overlay.querySelector('.custom-alert-btn-secondary');
        const closeIcon = overlay.querySelector('.close-icon');

        // Reset and set type
        box.className = 'custom-alert-box ' + type;
        body.innerHTML = message; // Use innerHTML to support HTML content
        titleEl.textContent = title;
        inputContainer.style.display = 'none';
        input.value = '';

        // Default button states
        okBtn.textContent = 'OK';
        cancelBtn.style.display = 'none';

        // Show
        setTimeout(() => {
            overlay.classList.add('active');
        }, 10);

        function closeAlert(result) {
            overlay.classList.remove('active');
            setTimeout(() => {
                resolve(result);
            }, 300);
        }

        okBtn.onclick = () => {
            if (inputContainer.style.display === 'block') {
                closeAlert(input.value);
            } else {
                closeAlert(true);
            }
        };
        cancelBtn.onclick = () => closeAlert(false);
        closeIcon.onclick = () => closeAlert(false);

        // Also close on background click
        overlay.onclick = (e) => {
            if (e.target === overlay) closeAlert(false);
        };

        if (inputContainer.style.display === 'block') {
            input.focus();
        } else {
            okBtn.focus();
        }
    });
};

window.showConfirm = function (message, title = 'Confirmation') {
    return new Promise((resolve) => {
        window.showAlert(message, 'info', title).then(resolve);

        // Wait for overlay to be ready then adjust buttons
        setTimeout(() => {
            const overlay = document.querySelector('.custom-alert-overlay');
            if (overlay) {
                const cancelBtn = overlay.querySelector('.custom-alert-btn-secondary');
                cancelBtn.textContent = 'Cancel';
                cancelBtn.style.display = 'block';
            }
        }, 20);
    });
};

window.showPrompt = function (message, defaultValue = '', title = 'Prompt') {
    return new Promise((resolve) => {
        window.showAlert(message, 'info', title).then(resolve);

        setTimeout(() => {
            const overlay = document.querySelector('.custom-alert-overlay');
            if (overlay) {
                const inputContainer = overlay.querySelector('.custom-alert-input-container');
                const input = overlay.querySelector('.custom-alert-input');
                const cancelBtn = overlay.querySelector('.custom-alert-btn-secondary');

                inputContainer.style.display = 'block';
                input.value = defaultValue;
                input.focus();

                cancelBtn.textContent = 'Cancel';
                cancelBtn.style.display = 'block';
            }
        }, 20);
    });
};

// Replace global alert
window.alert = function (message) {
    window.showAlert(message, 'info');
};

// Replace global confirm
window.confirm = function (message) {
    console.warn("Native confirm() is deprecated. Use 'await showConfirm()'.");
    return window.showConfirm(message);
};

// Replace global prompt
window.prompt = function (message, fallback) {
    console.warn("Native prompt() is deprecated. Use 'await showPrompt()'.");
    return window.showPrompt(message, fallback);
};
