const API_BASE_URL = 'http://localhost:5000/api';

const api = {
    // Helper to get headers with token
    getHeaders: () => {
        const token = localStorage.getItem('token');
        console.log('API Request headers token present:', !!token);
        return {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        };
    },

    // Generic fetch wrapper
    request: async (endpoint, method = 'GET', body = null) => {
        try {
            const options = {
                method,
                headers: api.getHeaders(),
                ...(body ? { body: JSON.stringify(body) } : {})
            };

            const response = await fetch(`${API_BASE_URL}${endpoint}`, options);
            const data = await response.json();

            if (!response.ok) {
                const error = new Error(data.message || 'Server error');
                // Preserve additional error data (like requiresVerification, email)
                Object.assign(error, data);
                throw error;
            }

            return data;
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    },

    // Auth endpoints
    login: (email, password) => api.request('/users/login', 'POST', { email, password }),
    register: (userData) => api.request('/users/register', 'POST', userData),
    getMe: () => api.request('/users/me'),
    getSuggestedStudents: () => api.request('/users/suggested'),
    getUser: (id) => api.request(`/users/${id}`),
    updateProfile: (data) => api.request('/users/me', 'PUT', data),
    changePassword: (oldPassword, newPassword) => api.request('/users/change-password', 'PUT', { oldPassword, newPassword }),

    // Post endpoints
    getPosts: (page = 1, limit = 5) => api.request(`/posts?page=${page}&limit=${limit}`),
    getPost: (id) => api.request(`/posts/${id}`),
    createPost: (text, image) => api.request('/posts', 'POST', { text, image }),
    getUserPosts: (userId) => api.request(`/posts/user/${userId}`),
    getUserComments: (userId) => api.request(`/posts/user/${userId}/comments`),

    likePost: (id) => api.request(`/posts/${id}/like`, 'POST'),
    addComment: (id, text) => api.request(`/posts/${id}/comment`, 'POST', { text }),

    // AI/Score endpoints
    calculateScore: (profileData) => api.request('/score-student', 'POST', profileData),

    // Opportunity endpoints
    getOpportunityFilters: () => api.request('/opportunities/filters'),
    getOpportunities: (filters = {}) => {
        const params = new URLSearchParams(filters).toString();
        const url = `/opportunities${params ? '?' + params : ''}`;

        return api.request(url);
    },
    deleteOpportunity: (id) => api.request(`/opportunities/${id}`, 'DELETE'),
    applyToOpportunity: (id) => api.request(`/opportunities/${id}/apply`, 'POST'),
    getCompanyStats: () => api.request('/opportunities/stats'),
    getMyOpportunities: () => api.request('/opportunities/mine'),
    getRecommendations: () => api.request('/recommendations'),
    createOpportunity: (data) => api.request('/opportunities', 'POST', data),
    updateApplicationStatus: (oppId, appId, status, message = null) => api.request(`/opportunities/${oppId}/applications/${appId}/status`, 'PUT', { status, message }),
    getAllOpportunities: (filters = {}) => {
        const params = new URLSearchParams(filters).toString();
        const url = `/opportunities${params ? '?' + params : ''}`;
        return api.request(url);
    },

    // Project endpoints
    createProject: (data) => api.request('/projects', 'POST', data),
    getMyProjects: () => api.request('/projects/my'),
    getUserProjects: (userId) => api.request(`/projects/user/${userId}`),

    // Achievements
    addAchievement: (data) => api.request('/users/me/achievements', 'POST', data),

    // Posts
    getMyPosts: () => api.request('/posts/my'),
    getMyComments: () => api.request('/posts/my-comments'),

    // Admin endpoints
    getPendingCompanies: () => api.request('/admin/companies'),
    createCompany: (data) => api.request('/admin/companies', 'POST', data),
    activateCompany: (id) => api.request(`/admin/company/activate/${id}`, 'PUT'),
    deactivateCompany: (id) => api.request(`/admin/company/deactivate/${id}`, 'PUT'),
    deleteCompany: (id) => api.request(`/admin/company/${id}`, 'DELETE'),
    getDashboardStats: () => api.request('/admin/stats'),
    getStudents: () => api.request('/admin/users'),

    // Opportunities management
    getAllOpportunities: (filters = {}) => {
        const params = new URLSearchParams(filters).toString();
        const url = `/opportunities${params ? '?' + params : ''}`;
        return api.request(url);
    },
    getMyNotifications: () => api.request('/notifications'),
    sendTestNotification: () => api.request('/notifications/test', 'POST'),
    markNotificationRead: (id) => api.request(`/notifications/${id}/read`, 'PUT'),
    deleteNotification: (id) => api.request(`/notifications/${id}`, 'DELETE'),
    createOpportunity: (data) => api.request('/opportunities', 'POST', data),
    deleteOpportunity: (id) => api.request(`/opportunities/${id}`, 'DELETE'), // Need to add to backend

    // Projects management
    getAllProjects: () => api.request('/admin/projects'),
    updateProjectStatus: (id, status, notes, score) => api.request(`/admin/project/${id}/status`, 'PUT', { status, notes, score }), // Need to add to backend
    updateProjectScore: (id, score) => api.request(`/admin/projects/${id}/score`, 'PUT', { score }),
    deleteProject: (id) => api.request(`/projects/${id}`, 'DELETE'),

    // Admin Management
    getAdmins: () => api.request('/admin/admins'),
    createAdmin: (data) => api.request('/admin/admins', 'POST', data),
    updateAdmin: (id, data) => api.request(`/admin/admins/${id}`, 'PUT', data),
    deleteAdmin: (id) => api.request(`/admin/admins/${id}`, 'DELETE'),
    getLogs: () => api.request('/admin/logs'),

    // Company Project Verification
    getProjectByToken: (token, projectId) => api.request(`/projects/verify-by-token?token=${token}&projectId=${projectId}`),
    verifyCompanyProject: (projectId, verified, feedback, score, token) => api.request(`/projects/${projectId}/company-verify`, 'POST', { verified, feedback, score, token }),
    getCompanyPendingProjects: () => api.request('/projects/company/pending'),
    getCompanyVerifiedProjects: () => api.request('/projects/company/verified'),
    updateCompanyProjectScore: (projectId, score, feedback) => api.request(`/projects/${projectId}/company-score`, 'PUT', { score, feedback }),
    adminOverrideCompanyVerification: (projectId, verificationStatus, feedback, score) => api.request(`/admin/project/${projectId}/company-override`, 'PUT', { verificationStatus, feedback, score }),

    // Get Companies (for students)
    getCompanies: () => api.request('/users/companies/list'),

    // Admin-only companies endpoint
    getAdminCompanies: () => api.request('/admin/companies')
};

// Export for use in other files (if using modules) or attach to window
window.api = api;
