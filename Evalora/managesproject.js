const projects = [
            {
                id: 1,
                title: "Portfolio Website",
                student: "Reem Safadi",
                date: "Mar 15, 2025",
                skills: ["HTML", "CSS", "JavaScript"],
                status: "Approved",
                description: "A clean portfolio highlighting my skills and projects in web development and design.",
                github: "GitHub",
                liveDemo: "Live Demo",
                zipFile: "ZIP File",
                reviewerNotes: ""
            },
            {
                id: 2,
                title: "Portfolio Website",
                student: "Reem Safadi",
                date: "Mar 15, 2025",
                skills: ["HTML", "CSS", "JavaScript"],
                status: "Needs Change",
                description: "A clean portfolio highlighting my skills and projects in web development and design.",
                github: "GitHub",
                liveDemo: "Live Demo",
                zipFile: "ZIP File",
                reviewerNotes: "Please update the navigation menu and fix responsive design issues."
            },
            {
                id: 3,
                title: "Portfolio Website",
                student: "Reem Safadi",
                date: "Mar 15, 2025",
                skills: ["HTML", "CSS", "JavaScript"],
                status: "Pending",
                description: "A clean portfolio highlighting my skills and projects in web development and design.",
                github: "GitHub",
                liveDemo: "Live Demo",
                zipFile: "ZIP File",
                reviewerNotes: ""
            },
            {
                id: 4,
                title: "Portfolio Website",
                student: "Reem Safadi",
                date: "Mar 15, 2025",
                skills: ["HTML", "CSS", "JavaScript"],
                status: "Approved",
                description: "A clean portfolio highlighting my skills and projects in web development and design.",
                github: "GitHub",
                liveDemo: "Live Demo",
                zipFile: "ZIP File",
                reviewerNotes: ""
            },
            {
                id: 5,
                title: "Portfolio Website",
                student: "Reem Safadi",
                date: "Mar 15, 2025",
                skills: ["HTML", "CSS", "JavaScript"],
                status: "Approved",
                description: "A clean portfolio highlighting my skills and projects in web development and design.",
                github: "GitHub",
                liveDemo: "Live Demo",
                zipFile: "ZIP File",
                reviewerNotes: ""
            },
            {
                id: 6,
                title: "Portfolio Website",
                student: "Reem Safadi",
                date: "Mar 15, 2025",
                skills: ["HTML", "CSS", "JavaScript"],
                status: "Needs Change",
                description: "A clean portfolio highlighting my skills and projects in web development and design.",
                github: "GitHub",
                liveDemo: "Live Demo",
                zipFile: "ZIP File",
                reviewerNotes: "Add more project examples and improve the about section."
            },
            {
                id: 7,
                title: "E-commerce Platform",
                student: "Ahmad Hassan",
                date: "Mar 18, 2025",
                skills: ["React", "Node.js", "CSS"],
                status: "Pending",
                description: "A full-stack e-commerce platform with payment integration.",
                github: "GitHub",
                liveDemo: "Live Demo",
                zipFile: "ZIP File",
                reviewerNotes: ""
            },
            {
                id: 8,
                title: "Weather App",
                student: "Sara Ali",
                date: "Mar 20, 2025",
                skills: ["JavaScript", "HTML", "CSS"],
                status: "Approved",
                description: "A weather application using OpenWeather API.",
                github: "GitHub",
                liveDemo: "Live Demo",
                zipFile: "ZIP File",
                reviewerNotes: ""
            }
        ];

        let selectedProjectId = null;
        let filteredProjects = [...projects];

        function renderProjects(projectsToRender) {
            const tbody = document.getElementById('projectsTable');
            tbody.innerHTML = '';

            projectsToRender.forEach(project => {
                const row = document.createElement('tr');
                row.onclick = () => selectProject(project.id);
                if (project.id === selectedProjectId) {
                    row.classList.add('selected');
                }

                let statusClass = '';
                if (project.status === 'Approved') statusClass = 'status-approved';
                else if (project.status === 'Pending') statusClass = 'status-pending';
                else if (project.status === 'Needs Change') statusClass = 'status-needs-change';

                row.innerHTML = `
                    <td>${project.title}</td>
                    <td>${project.student}</td>
                    <td>${project.date}</td>
                    <td>
                        <div class="skills-cell">
                            ${project.skills.map(skill => `<span class="skill-tag">${skill}</span>`).join('')}
                        </div>
                    </td>
                    <td><span class="status-badge ${statusClass}">${project.status}</span></td>
                `;

                tbody.appendChild(row);
            });
        }

        function selectProject(id) {
            selectedProjectId = id;
            const project = projects.find(p => p.id === id);
            renderProjects(filteredProjects);
            showProjectDetails(project);
        }

        function showProjectDetails(project) {
            const detailsPanel = document.getElementById('detailsPanel');

            detailsPanel.innerHTML = `
                <h2>${project.title}</h2>
                <p>${project.description}</p>
                
                <div class="details-links">
                    <div>${project.github}</div>
                    <div>${project.liveDemo}</div>
                    <div>${project.zipFile}</div>
                </div>

                <div class="details-section">
                    <h3>Tags</h3>
                    <div class="tags-container">
                        ${project.skills.map(skill => `<span class="tag">${skill}</span>`).join('')}
                    </div>
                </div>

                <div class="details-section">
                    <h3>Reviewer Notes</h3>
                    <textarea class="reviewer-notes" id="reviewerNotes">${project.reviewerNotes}</textarea>
                </div>

                <div class="action-buttons">
                    <button class="action-btn btn-approve" onclick="updateStatus(${project.id}, 'Approved')">
                        <svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                        </svg>
                        Approve
                    </button>
                    <button class="action-btn btn-reject" onclick="updateStatus(${project.id}, 'Rejected')">
                        <svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                        </svg>
                        Reject
                    </button>
                    <button class="action-btn btn-needs-change" onclick="updateStatus(${project.id}, 'Needs Change')">
                        <svg class="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
                        </svg>
                        Needs Change
                    </button>
                </div>
            `;
        }

        function updateStatus(projectId, newStatus) {
            const project = projects.find(p => p.id === projectId);
            const reviewerNotes = document.getElementById('reviewerNotes').value;
            
            if (project) {
                project.status = newStatus;
                project.reviewerNotes = reviewerNotes;
                filterProjects();
                selectProject(projectId);
                alert(`Project status updated to: ${newStatus}`);
            }
        }

        function filterProjects() {
            const studentSearch = document.getElementById('studentSearch').value.toLowerCase();
            const skillsFilter = document.getElementById('skillsFilter').value;
            const statusFilter = document.getElementById('statusFilter').value;

            filteredProjects = projects.filter(project => {
                const matchesStudent = project.student.toLowerCase().includes(studentSearch);
                const matchesSkills = !skillsFilter || project.skills.includes(skillsFilter);
                const matchesStatus = !statusFilter || project.status === statusFilter;

                return matchesStudent && matchesSkills && matchesStatus;
            });

            renderProjects(filteredProjects);

            if (selectedProjectId && !filteredProjects.find(p => p.id === selectedProjectId)) {
                selectedProjectId = null;
                document.getElementById('detailsPanel').innerHTML = '<div class="no-selection">Select a project to view details</div>';
            }
        }

        // Initial render
        renderProjects(filteredProjects);

        // Add real-time search
        document.getElementById('studentSearch').addEventListener('input', filterProjects);
        document.getElementById('skillsFilter').addEventListener('change', filterProjects);
        document.getElementById('statusFilter').addEventListener('change', filterProjects);