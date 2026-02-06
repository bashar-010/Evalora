let students = [];

async function fetchStudents() {
    try {
        students = await window.api.getStudents();
        renderStudents(students);
    } catch (error) {
        console.error("Failed to fetch students:", error);
    }
}

function formatDate(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    const day = date.getDate();
    const month = date.getMonth() + 1;
    const year = date.getFullYear();
    return `${day}.${month}.${year}`;
}

function renderStudents(data = students) {
    const tbody = document.getElementById('studentsTable');
    if (!tbody) return;
    tbody.innerHTML = '';

    data.forEach(student => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${student.name}</td>
            <td>${student.email}</td>
            <td>${student.university || 'N/A'}</td>
            <td>${student.major || 'N/A'}</td>
            <td>${formatDate(student.createdAt)}</td>
            <td>${student.score || 0}%</td>
            <td>
                <div class="action-buttons">
                    <button class="action-btn" onclick="viewProfile('${student._id}')" title="View Profile">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                    </button>
                    <button class="action-btn" onclick="deleteStudent('${student._id}')" title="Delete">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                    </button>
                </div>
            </td>
        `;
        tbody.appendChild(row);
    });
}

async function deleteStudent(id) {
    if (await showConfirm('Are you sure you want to delete this student?')) {
        try {
            await api.request(`/admin/users/${id}`, 'DELETE');
            await showAlert('Student deleted successfully');
            fetchStudents();
        } catch (error) {
            await showAlert(error.message, 'error');
        }
    }
}

function viewProfile(id) {
    window.location.href = `profile.html?id=${id}`;
}

function applyFilters() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const universityFilter = document.getElementById('filterUniversity').value;
    const majorFilter = document.getElementById('filterMajor').value;

    let filtered = students;

    if (searchTerm) {
        filtered = filtered.filter(student =>
            (student.name && student.name.toLowerCase().includes(searchTerm)) ||
            (student.email && student.email.toLowerCase().includes(searchTerm))
        );
    }
    if (universityFilter) {
        filtered = filtered.filter(student =>
            student.university && student.university.toLowerCase() === universityFilter.toLowerCase()
        );
    }
    if (majorFilter) {
        filtered = filtered.filter(student =>
            student.major && student.major.toLowerCase() === majorFilter.toLowerCase()
        );
    }

    renderStudents(filtered);
}

document.addEventListener('DOMContentLoaded', () => {
    fetchStudents();

    document.getElementById('searchInput')?.addEventListener('input', applyFilters);
    document.getElementById('filterUniversity')?.addEventListener('change', applyFilters);
    document.getElementById('filterMajor')?.addEventListener('change', applyFilters);

    // Logout logic
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            if (await showConfirm("Are you sure you want to logout?")) {
                localStorage.clear();
                window.location.href = 'login.html';
            }
        });
    }
});