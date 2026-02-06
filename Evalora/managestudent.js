let students = [
    {
        id: 1,
        name: 'Reem Safadi',
        email: 'Safadireem01@gmail.com',
        university: 'University of Jordan',
        major: 'Computer Science',
        joined: '2025-02-02',
        score: 63
    },
    {
        id: 2,
        name: 'Ahmad Hassan',
        email: 'ahmad.hassan@gmail.com',
        university: 'Jordan University of Science and Technology',
        major: 'Software Engineering',
        joined: '2025-01-15',
        score: 85
    },
    {
        id: 3,
        name: 'Sarah Al-Najjar',
        email: 'sarah.najjar@gmail.com',
        university: 'Princess Sumaya University',
        major: 'Cybersecurity',
        joined: '2025-02-20',
        score: 92
    },
    {
        id: 4,
        name: 'Omar Khalil',
        email: 'omar.khalil@gmail.com',
        university: 'German Jordanian University',
        major: 'Data Science',
        joined: '2025-01-10',
        score: 78
    },
    {
        id: 5,
        name: 'Lina Mansour',
        email: 'lina.mansour@gmail.com',
        university: 'Hashemite University',
        major: 'Information Technology',
        joined: '2025-02-05',
        score: 88
    },
    {
        id: 6,
        name: 'Yousef Barakat',
        email: 'yousef.barakat@gmail.com',
        university: 'Al-Balqa Applied University',
        major: 'Artificial Intelligence',
        joined: '2025-01-25',
        score: 95
    },

    {
        id: 7,
        name: 'Maryam Hyari',
        email: 'Maryam.Hyari@gmail.com',
        university: 'THe wolrd islamic sciences and education university',
        major: 'Computer Science',
        joined: '2025-02-16',
        score: 77

    }
];

let nextId = 8;
let editingId = null;

function formatDate(dateString) {
    const date = new Date(dateString);
    const day = date.getDate();
    const month = date.getMonth() + 1;
    const year = date.getFullYear();
    return `${day}.${month}.${year}`;
}

function renderStudents(data = students) {
    const tbody = document.getElementById('studentsTable');
    tbody.innerHTML = '';

    data.forEach(student => {
        const row = document.createElement('tr');
        row.innerHTML = `
                    <td>${student.name}</td>
                    <td>${student.email}</td>
                    <td>${student.university}</td>
                    <td>${student.major}</td>
                    <td>${formatDate(student.joined)}</td>
                    <td>${student.score}%</td>
                    <td>
                        <div class="action-buttons">
                            <button class="action-btn" onclick="viewProfile(${student.id})" title="View Profile">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                            </button>
                            <button class="action-btn" onclick="editStudent(${student.id})" title="Edit">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                            </button>
                            <button class="action-btn" onclick="deleteStudent(${student.id})" title="Delete">
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

function openModal(isEdit = false) {
    const modal = document.getElementById('studentModal');
    const modalTitle = document.getElementById('modalTitle');

    if (isEdit) {
        modalTitle.textContent = 'Edit Student';
    } else {
        modalTitle.textContent = 'Add Student';
        document.getElementById('studentForm').reset();
        document.getElementById('studentId').value = '';
        editingId = null;
    }

    modal.classList.add('active');
}

function closeModal() {
    const modal = document.getElementById('studentModal');
    modal.classList.remove('active');
    document.getElementById('studentForm').reset();
    editingId = null;
}

function viewProfile(id) {
    const student = students.find(s => s.id === id);
    if (!student) return;

    const profileContent = document.getElementById('profileContent');
    profileContent.innerHTML = `
                <div class="profile-item">
                    <div class="profile-label">Name:</div>
                    <div class="profile-value">${student.name}</div>
                </div>
                <div class="profile-item">
                    <div class="profile-label">Email:</div>
                    <div class="profile-value">${student.email}</div>
                </div>
                <div class="profile-item">
                    <div class="profile-label">University:</div>
                    <div class="profile-value">${student.university}</div>
                </div>
                <div class="profile-item">
                    <div class="profile-label">Major:</div>
                    <div class="profile-value">${student.major}</div>
                </div>
                <div class="profile-item">
                    <div class="profile-label">Joined Date:</div>
                    <div class="profile-value">${formatDate(student.joined)}</div>
                </div>
                <div class="profile-item">
                    <div class="profile-label">Score:</div>
                    <div class="profile-value">${student.score}%</div>
                </div>
            `;

    document.getElementById('profileModal').classList.add('active');
}

function closeProfileModal() {
    document.getElementById('profileModal').classList.remove('active');
}

function editStudent(id) {
    const student = students.find(s => s.id === id);
    if (!student) return;

    editingId = id;
    document.getElementById('studentId').value = id;
    document.getElementById('name').value = student.name;
    document.getElementById('email').value = student.email;
    document.getElementById('university').value = student.university;
    document.getElementById('major').value = student.major;
    document.getElementById('joined').value = student.joined;
    document.getElementById('score').value = student.score;

    openModal(true);
}

async function deleteStudent(id) {
    if (await showConfirm('Are you sure you want to delete this student?')) {
        students = students.filter(s => s.id !== id);
        renderStudents();
    }
}

function applyFilters() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const universityFilter = document.getElementById('filterUniversity').value;
    const majorFilter = document.getElementById('filterMajor').value;

    let filtered = students;

    if (searchTerm) {
        filtered = filtered.filter(student =>
            student.name.toLowerCase().includes(searchTerm) ||
            student.email.toLowerCase().includes(searchTerm)
        );
    }
    if (universityFilter) {
        filtered = filtered.filter(student => student.university === universityFilter);
    }
    if (majorFilter) {
        filtered = filtered.filter(student => student.major === majorFilter);
    }

    renderStudents(filtered);
}

document.getElementById('searchInput').addEventListener('input', applyFilters);

document.getElementById('studentForm').addEventListener('submit', function (e) {
    e.preventDefault();

    const formData = {
        name: document.getElementById('name').value,
        email: document.getElementById('email').value,
        university: document.getElementById('university').value,
        major: document.getElementById('major').value,
        joined: document.getElementById('joined').value,
        score: parseInt(document.getElementById('score').value)
    };

    if (editingId) {
        const index = students.findIndex(s => s.id === editingId);
        if (index !== -1) {
            students[index] = { ...students[index], ...formData };
        }
    } else {
        students.push({
            id: nextId++,
            ...formData
        });
    }

    renderStudents();
    closeModal();
});

document.getElementById('studentModal').addEventListener('click', function (e) {
    if (e.target === this) {
        closeModal();
    }
});

document.getElementById('profileModal').addEventListener('click', function (e) {
    if (e.target === this) {
        closeProfileModal();
    }
});

renderStudents();