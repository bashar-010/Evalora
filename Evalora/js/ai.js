document.addEventListener('DOMContentLoaded', () => {
    // Check if we are on a page that needs score
    const scoreElement = document.getElementById('user-score');

    if (scoreElement) {
        loadScore();
    }
});

async function loadScore() {
    try {
        // First try to get current user data which might have the score
        const user = JSON.parse(localStorage.getItem('user'));
        if (user && user.score) {
            updateScoreUI(user.score);
        }

        // Optionally fetch fresh data
        const data = await window.api.getMe();
        if (data && data.user) {
            // The original code had `freshScore` and `currentUser` defined here.
            // The patch seems to integrate profile loading logic.
            // Assuming `userId` and `renderProfile` would be defined elsewhere or are placeholders.
            // For now, I'll integrate the localStorage update logic from the patch.

            // This part of the patch seems to be for a `loadProfile` function,
            // but since it's given as part of the `loadScore` context,
            // I'll place the localStorage update logic here.
            // Note: `currentUser = data.user; renderProfile(currentUser);` are not in the original `loadScore`
            // and `userId` is not defined in this scope. I will only apply the localStorage update part
            // that makes sense within `loadScore`'s existing structure.

            const freshScore = data.user.score !== undefined ? data.user.score : 0;
            updateScoreUI(freshScore);

            // Update local storage with the fetched user data
            const loggedInUser = JSON.parse(localStorage.getItem('user') || '{}');
            // The patch had a condition `if (!userId || userId === loggedInUser.id || userId === loggedInUser._id)`
            // which implies a `userId` parameter for a profile loading function.
            // In the context of `loadScore` fetching 'me', we always update the current user.
            const updatedUser = { ...loggedInUser, ...data.user };
            localStorage.setItem('user', JSON.stringify(updatedUser));
        }
    } catch (error) {
        console.error('Failed to load score:', error);
    }
}

function updateScoreUI(score) {
    // Force to number or 0
    const displayScore = Number(score) || 0;

    const scoreElements = document.querySelectorAll('.user-score-display');
    scoreElements.forEach(el => {
        el.innerText = displayScore;
    });

    // Also update the specific profile score element if it exists
    const profileScore = document.getElementById('user-score');
    if (profileScore) {
        profileScore.innerText = displayScore;
    }

    // Trigger circle update if on profile page
    if (window.updateScoreCircle) {
        window.updateScoreCircle(displayScore);
    }
}

// Function to trigger AI scoring (can be called from other scripts)
window.calculateAIScore = async (profileData) => {
    try {
        const response = await window.api.calculateScore(profileData);
        if (response.success && response.scores) {
            // Updated to handle the exact HuggingFace response schema
            // which typically returns { overall_score, skills_score, ... }
            const newScore = response.scores.overall_score || response.scores.total || 0;

            updateScoreUI(newScore);
            alert(`Your profile has been analyzed! New Score: ${newScore}/100`);
        }
    } catch (error) {
        console.error('AI Scoring failed:', error);
        alert('Failed to calculate score: ' + error.message);
    }
};
