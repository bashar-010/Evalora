document.addEventListener('DOMContentLoaded', () => {
    // Check if user is logged in
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const isLoggedIn = user && (user._id || user.id);
    const userRole = user.role;

    // Determine target page based on login status and role
    let targetPage;

    if (!isLoggedIn) {
        targetPage = 'index.html';
    } else if (userRole === 'admin') {
        targetPage = 'dashboard.html';
    } else if (userRole === 'company') {
        targetPage = 'company_dashboard.html';
    } else {
        // Default to posts page for students and other roles
        targetPage = 'posts.html';
    }

    // Get current path
    const path = window.location.pathname;

    // If we are already on the target page, do not override the back button
    // This allows the user to exit the app or navigate normally if they are already at the "home" of their state
    if (path.endsWith(targetPage) || (targetPage === 'index.html' && path.endsWith('/'))) {
        return;
    }

    // Push the current state to the history stack
    history.pushState(null, null, window.location.href);

    // Listen for the back button click (popstate event)
    window.onpopstate = function () {
        window.location.href = targetPage;
    };
});
