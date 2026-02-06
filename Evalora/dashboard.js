// Line Chart
const lineCtx = document.getElementById('lineChart').getContext('2d');
const lineCanvas = document.getElementById('lineChart');

// Set canvas size
lineCanvas.width = lineCanvas.parentElement.clientWidth - 60;
lineCanvas.height = 250;

// Chart data
const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Jun'];
const values = [20, 35, 50, 55, 85];

// Calculate points
const padding = 40;
const chartWidth = lineCanvas.width - padding * 2;
const chartHeight = lineCanvas.height - padding * 2;
const pointSpacing = chartWidth / (months.length - 1);

// Draw grid lines
lineCtx.strokeStyle = '#e0e0e0';
lineCtx.lineWidth = 1;
for (let i = 0; i < 5; i++) {
    const y = padding + (chartHeight / 4) * i;
    lineCtx.beginPath();
    lineCtx.moveTo(padding, y);
    lineCtx.lineTo(lineCanvas.width - padding, y);
    lineCtx.stroke();
}

// Draw line
lineCtx.strokeStyle = '#0d5f5f';
lineCtx.lineWidth = 3;
lineCtx.beginPath();

values.forEach((value, index) => {
    const x = padding + index * pointSpacing;
    const y = padding + chartHeight - (value / 100) * chartHeight;
    
    if (index === 0) {
        lineCtx.moveTo(x, y);
    } else {
        lineCtx.lineTo(x, y);
    }
});

lineCtx.stroke();

// Draw month labels
lineCtx.fillStyle = '#666';
lineCtx.font = '14px sans-serif';
lineCtx.textAlign = 'center';
months.forEach((month, index) => {
    const x = padding + index * pointSpacing;
    lineCtx.fillText(month, x, lineCanvas.height - 10);
});

// Pie Chart
const pieCtx = document.getElementById('pieChart').getContext('2d');
const pieCanvas = document.getElementById('pieChart');

pieCanvas.width = 200;
pieCanvas.height = 200;

const centerX = pieCanvas.width / 2;
const centerY = pieCanvas.height / 2;
const radius = 80;
const innerRadius = 50;

// Pie data (percentages)
const pieData = [
    { value: 25, color: '#83c8c8ff', label: 'AI' },
    { value: 65, color: '#0d4f5c', label: 'CS' },
    { value: 85, color: '#3d9d9d', label: 'SE' }
];

// Normalize data to 100%
const total = pieData.reduce((sum, item) => sum + item.value, 0);
let currentAngle = -Math.PI / 2;

pieData.forEach(item => {
    const sliceAngle = (item.value / total) * 2 * Math.PI;
    
    // Draw outer arc
    pieCtx.beginPath();
    pieCtx.arc(centerX, centerY, radius, currentAngle, currentAngle + sliceAngle);
    pieCtx.arc(centerX, centerY, innerRadius, currentAngle + sliceAngle, currentAngle, true);
    pieCtx.closePath();
    pieCtx.fillStyle = item.color;
    pieCtx.fill();
    
    // Draw percentage label
    const labelAngle = currentAngle + sliceAngle / 2;
    const labelRadius = (radius + innerRadius) / 2;
    const labelX = centerX + Math.cos(labelAngle) * labelRadius;
    const labelY = centerY + Math.sin(labelAngle) * labelRadius;
    
    pieCtx.fillStyle = '#fff';
    pieCtx.font = 'bold 16px sans-serif';
    pieCtx.textAlign = 'center';
    pieCtx.textBaseline = 'middle';
    pieCtx.fillText(Math.round((item.value / total) * 100) + '%', labelX, labelY);
    
    currentAngle += sliceAngle;
});

// Responsive resize
window.addEventListener('resize', () => {
    const newWidth = lineCanvas.parentElement.clientWidth - 60;
    if (newWidth !== lineCanvas.width) {
        location.reload(); // Simple reload for resize
    }
});

// Open popup
document.getElementById("logoutBtn").onclick = function () {
    document.getElementById("confirmPopup").style.display = "flex";
};

// Close popup
document.getElementById("noBtn").onclick = function () {
    document.getElementById("confirmPopup").style.display = "none";
};

// Confirm logout
document.getElementById("yesBtn").onclick = function () {
    window.location.href = "login.html"; // your logout redirect
};