// Check if user is admin
const user = JSON.parse(localStorage.getItem('user'));
if (!user || user.role !== 'admin') {
    window.location.href = 'login.html';
}

let lineChart, pieChart;

async function fetchStats() {
    try {
        const stats = await window.api.getDashboardStats();

        // Update stats cards
        const statValues = document.querySelectorAll('.stat-value');
        if (statValues[0]) statValues[0].textContent = stats.totalStudents.toLocaleString() + "+";
        if (statValues[1]) statValues[1].textContent = stats.activeThisWeek.toLocaleString();
        if (statValues[2]) statValues[2].textContent = stats.totalProjects.toLocaleString();
        if (statValues[3]) statValues[3].textContent = stats.totalOpportunities.toLocaleString();

        renderLineChart(stats.lineChartData);
        renderPieChart(stats.pieChartData);
    } catch (error) {
        console.error("Failed to fetch dashboard stats:", error);
    }
}

function renderLineChart(data) {
    const ctx = document.getElementById('lineChart').getContext('2d');
    if (lineChart) lineChart.destroy();

    lineChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: data ? data.labels : ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
            datasets: [{
                label: 'Student Growth',
                data: data ? data.values : [20, 35, 50, 55, 70, 85],
                borderColor: '#0d5f5f',
                backgroundColor: 'rgba(13, 95, 95, 0.1)',
                borderWidth: 3,
                tension: 0.4,
                fill: true,
                pointRadius: 4,
                pointBackgroundColor: '#0d5f5f'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: { color: '#f0f0f0' },
                    ticks: { color: '#666' }
                },
                x: {
                    grid: { display: false },
                    ticks: { color: '#666' }
                }
            }
        }
    });
}

function renderPieChart(data) {
    const ctx = document.getElementById('pieChart').getContext('2d');
    if (pieChart) pieChart.destroy();

    let chartData = data || [
        { label: 'AI', value: 70 },
        { label: 'CS', value: 26 },
        { label: 'SE', value: 4 }
    ];

    // If all values are 0, add a dummy placeholder
    if (chartData.length === 0 || chartData.every(d => d.value === 0)) {
        chartData = [{ label: 'No Data Yet', value: 1, color: '#e0e0e0' }];
    }

    pieChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: chartData.map(d => d.label),
            datasets: [{
                data: chartData.map(d => d.value),
                backgroundColor: chartData.map((d, i) => d.color || ['#83c8c8ff', '#0d4f5c', '#3d9d9d'][i % 3]),
                borderWidth: 0,
                hoverOffset: 10
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '65%',
            plugins: {
                legend: { display: false }
            }
        }
    });

    // Update legend dynamically
    const legendContainer = document.querySelector('.legend');
    if (legendContainer) {
        const colors = ['#83c8c8ff', '#0d4f5c', '#3d9d9d'];
        legendContainer.innerHTML = chartData.map((d, i) => `
            <div class="legend-item">
                <span class="legend-color" style="background: ${d.color || colors[i % colors.length]};"></span>
                <span>${d.label}</span>
            </div>
        `).join('');
    }
}

// Logout Logic
document.addEventListener('DOMContentLoaded', () => {
    fetchStats();

    // Logout Logic
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            if (await showConfirm("Are you sure you want to log out?")) {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                window.location.href = "login.html";
            }
        });
    }

    /* 
    // Removed old custom popup logic 
    */

    window.addEventListener('resize', () => {
        renderLineChart();
    });
});