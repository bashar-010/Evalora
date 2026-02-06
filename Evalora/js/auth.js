// Google Login Callback - Defined globally and immediately
window.handleGoogleLogin = async function (response) {
    try {
        console.log("Google response:", response);
        // Send token to backend
        const res = await fetch('http://localhost:5000/api/users/auth/google', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ token: response.credential })
        });

        const data = await res.json();

        if (!res.ok) {
            throw new Error(data.message || 'Google Login Failed');
        }

        // Save token and user info
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));

        await showAlert('Logged in with Google successfully!', 'success');

        // Redirect based on role
        if (data.user.role === 'admin') {
            window.location.href = 'dashboard.html';
        } else if (data.user.role === 'company') {
            window.location.href = 'company_dashboard.html';
        } else {
            window.location.href = 'posts.html';
        }

    } catch (error) {
        console.error('Google Login Error:', error);
        await showAlert(error.message, 'error');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    // Helper function for email validation
    function validateEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(String(email).toLowerCase());
    }

    function isLatinOnly(str) {
        // Range \u0000-\u007F covers basic Latin/ASCII (English characters, numbers, common symbols)
        // Range \u0600-\u06FF covers Arabic (which we want to block)
        return !/[\u0600-\u06FF]/.test(str);
    }

    // (handleGoogleLogin was here)


    // Login Logic
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        const loginBtn = document.getElementById('loginBtn');

        loginBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            const email = document.querySelector('input[type="email"]').value;
            const password = document.querySelector('input[type="password"]').value;

            if (!email || !password) {
                await showAlert('Please fill out this fields', 'error');
                return;
            }

            try {
                const response = await window.api.login(email, password);

                // Save token and user info
                localStorage.setItem('token', response.token);
                localStorage.setItem('user', JSON.stringify(response.user));

                // Redirect based on role (no success alert)
                if (response.user.role === 'admin') {
                    window.location.href = 'dashboard.html';
                } else if (response.user.role === 'company') {
                    window.location.href = 'company_dashboard.html';
                } else {
                    window.location.href = 'posts.html';
                }
            } catch (error) {
                // Check if error is due to unverified email
                if (error.requiresVerification) {
                    sessionStorage.setItem('verificationEmail', error.email || email);
                    await showAlert(error.message, 'warning');
                    setTimeout(() => {
                        window.location.href = 'verify-email.html';
                    }, 1500);
                } else {
                    await showAlert(error.message, 'error');
                }
            }
        });
    }

    // Register Logic
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        const registerBtn = document.getElementById('registerBtn');

        registerBtn.addEventListener('click', async (e) => {
            e.preventDefault();

            const inputs = document.querySelectorAll('input');
            const name = inputs[0].value;
            const email = inputs[1].value;
            const password = inputs[2].value;
            const confirmPassword = inputs[3].value;

            if (password !== confirmPassword) {
                await showAlert('Passwords do not match', 'error');
                return;
            }

            if (!validateEmail(email)) {
                await showAlert('Please enter a valid email address', 'error');
                return;
            }

            // Validate email domain
            // Validate email domain - REPLACED WITH GENERAL LOGIC
            // We now allow any domain. Non-standard domains will receive code in terminal.
            const emailDomain = email.split('@')[1]?.toLowerCase();
            if (!emailDomain) {
                await showAlert('Please enter a valid email address', 'error');
                return;
            }

            if (!isLatinOnly(name)) {
                await showAlert('Names must only contain English/Latin characters.', 'error');
                return;
            }

            if (!isLatinOnly(email)) {
                await showAlert('Emails must only contain English/Latin characters.', 'error');
                return;
            }

            if (!isLatinOnly(password)) {
                await showAlert('Passwords must only contain English/Latin characters.', 'error');
                return;
            }

            if (password.length < 8) {
                await showAlert('Password must be at least 8 characters long.', 'error');
                return;
            }

            try {
                const response = await window.api.register({ name, email, password });
                sessionStorage.setItem('verificationEmail', response.email || email);
                await showAlert(response.message || 'Registration Successful! Please verify your email.', 'success');
                window.location.href = 'verify-email.html';
            } catch (error) {
                await showAlert(error.message, 'error');
            }
        });
    }
});
