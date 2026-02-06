

        // Send Test Notifications button
        function sendTestNotifications() {
            alert('Test notifications sent!');
            console.log('Sending test notifications...');
        }

        // Optional: Add change listeners to checkboxes and toggles
        document.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
            checkbox.addEventListener('change', function() {
                console.log('Setting changed:', this.parentElement.parentElement.textContent.trim(), 'is now', this.checked);
            });
        });

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