// Share Post Functionality
function sharePost(button) {
    const postCard = button.closest('.post-card');
    const postId = postCard.dataset.id;
    const postAuthor = postCard.querySelector('.user-info h3').textContent;
    const postContent = postCard.querySelector('.post-content p').textContent;

    // Construct post-specific URL
    const url = new URL(window.location.href);
    url.searchParams.set('post', postId);
    const postUrl = url.toString();

    showShareModal(postUrl, postAuthor, postContent);
}

function showShareModal(url, author, content) {
    // Create modal if it doesn't exist
    let modal = document.getElementById('share-modal');
    if (!modal) {
        modal = createShareModal();
        document.body.appendChild(modal);
    }

    // Store current post data in modal
    modal.dataset.url = url;
    modal.dataset.author = author;
    modal.dataset.content = content;

    // Show modal
    modal.classList.add('active');
}

function createShareModal() {
    const modal = document.createElement('div');
    modal.id = 'share-modal';
    modal.className = 'share-modal';
    modal.innerHTML = `
        <div class="share-modal-content">
            <div class="share-modal-header">
                <h3>Share Post</h3>
                <button class="close-modal" onclick="closeShareModal()">&times;</button>
            </div>
            <div class="share-options">
                <div class="share-option" onclick="copyLink()">
                    <svg width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
                        <path d="M4.715 6.542 3.343 7.914a3 3 0 1 0 4.243 4.243l1.828-1.829A3 3 0 0 0 8.586 5.5L8 6.086a1.002 1.002 0 0 0-.154.199 2 2 0 0 1 .861 3.337L6.88 11.45a2 2 0 1 1-2.83-2.83l.793-.792a4.018 4.018 0 0 1-.128-1.287z"/>
                        <path d="M6.586 4.672A3 3 0 0 0 7.414 9.5l.775-.776a2 2 0 0 1-.896-3.346L9.12 3.55a2 2 0 1 1 2.83 2.83l-.793.792c.112.42.155.855.128 1.287l1.372-1.372a3 3 0 1 0-4.243-4.243L6.586 4.672z"/>
                    </svg>
                    <span>Copy Link</span>
                </div>
                <div class="share-option repost" onclick="shareToFeed()">
                    <svg width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
                         <path d="M11 5.466V4H5a4 4 0 0 0-3.584 5.777.5.5 0 1 1-.896.446A5 5 0 0 1 5 3h6V1.534a.25.25 0 0 1 .41-.192l2.36 1.966c.12.1.12.284 0 .384l-2.36 1.966a.25.25 0 0 1-.41-.192Zm-2.62 6.068a4.99 4.99 0 0 1-3.38-1.757.5.5 0 1 1 .76-.65 4 4 0 0 0 2.62 1.407V9h6a4 4 0 0 0 3.584-5.777.5.5 0 0 1 .896-.446A5 5 0 0 1 11 8H5v1.466a.25.25 0 0 0 .41.192l2.36-1.966c.12-.1.12-.284 0-.384l-2.36-1.966a.25.25 0 0 0-.41.192Z"/>
                    </svg>
                    <span>Share to Feed</span>
                </div>
                <div class="share-option whatsapp" onclick="shareToWhatsApp()">
                    <svg width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
                        <path d="M13.601 2.326A7.854 7.854 0 0 0 7.994 0C3.627 0 .068 3.558.064 7.926c0 1.399.366 2.76 1.06 3.973L0 16l4.204-1.102a7.834 7.834 0 0 0 3.79.965h.004c4.368 0 7.926-3.558 7.93-7.93A7.898 7.898 0 0 0 13.6 2.326zM7.994 14.521a6.573 6.573 0 0 1-3.356-.92l-.24-.144-2.494.654.666-2.433-.156-.251a6.56 6.56 0 0 1-1.007-3.505c0-3.626 2.957-6.584 6.591-6.584a6.56 6.56 0 0 1 4.66 1.931 6.557 6.557 0 0 1 1.928 4.66c-.004 3.639-2.961 6.592-6.592 6.592zm3.615-4.934c-.197-.099-1.17-.578-1.353-.646-.182-.065-.315-.099-.445.099-.133.197-.513.646-.627.775-.114.133-.232.148-.43.05-.197-.1-.836-.308-1.592-.985-.59-.525-.985-1.175-1.103-1.372-.114-.198-.011-.304.088-.403.087-.088.197-.232.296-.346.1-.114.133-.198.198-.33.065-.134.034-.248-.015-.347-.05-.099-.445-1.076-.612-1.47-.16-.389-.323-.335-.445-.34-.114-.007-.247-.007-.38-.007a.729.729 0 0 0-.529.247c-.182.198-.691.677-.691 1.654 0 .977.71 1.916.81 2.049.098.133 1.394 2.132 3.383 2.992.47.205.84.326 1.129.418.475.152.904.129 1.246.08.38-.058 1.171-.48 1.338-.943.164-.464.164-.86.114-.943-.049-.084-.182-.133-.38-.232z"/>
                    </svg>
                    <span>WhatsApp</span>
                </div>
            </div>
        </div>
    `;

    // Close modal when clicking outside
    modal.addEventListener('click', function (e) {
        if (e.target === modal) {
            closeShareModal();
        }
    });

    return modal;
}

function closeShareModal() {
    const modal = document.getElementById('share-modal');
    if (modal) {
        modal.classList.remove('active');
    }
}

function copyLink() {
    const modal = document.getElementById('share-modal');
    const url = modal.dataset.url;

    navigator.clipboard.writeText(url).then(() => {
        showCopyFeedback('Link copied to clipboard!');
        closeShareModal();
    }).catch(() => {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = url;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        showCopyFeedback('Link copied to clipboard!');
        closeShareModal();
    });
}

function shareToWhatsApp() {
    const modal = document.getElementById('share-modal');
    const url = modal.dataset.url;
    const author = modal.dataset.author;
    const content = modal.dataset.content;

    const text = `Check out this post by ${author} on Evalora:\n\n"${content}"\n\n${url}`;
    const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;

    window.open(whatsappUrl, '_blank');
    closeShareModal();
}

async function shareToFeed() {
    const modal = document.getElementById('share-modal');
    const author = modal.dataset.author;
    const content = modal.dataset.content;
    const url = modal.dataset.url;

    const repostText = `Shared ${author}'s post:\n\n"${content}"\n\n${url}`;

    try {
        await window.api.createPost(repostText);
        showNotification('Successfully shared to your feed!', 'success');
        closeShareModal();

        // Refresh feed to show the new repost
        if (typeof fetchPosts === 'function') {
            fetchPosts(true);
        }
    } catch (error) {
        showNotification('Failed to share to feed: ' + error.message, 'error');
    }
}

function showCopyFeedback(message) {
    let feedback = document.getElementById('copy-feedback');
    if (!feedback) {
        feedback = document.createElement('div');
        feedback.id = 'copy-feedback';
        feedback.className = 'copy-feedback';
        document.body.appendChild(feedback);
    }

    feedback.textContent = message;
    feedback.classList.add('show');

    setTimeout(() => {
        feedback.classList.remove('show');
    }, 2000);
}

// Keyboard shortcut - ESC to close modal
document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
        closeShareModal();
        closeImagePreview();
    }
});

// ==================== IMAGE PREVIEW FUNCTIONALITY ====================
function openImagePreview(src) {
    const modal = document.getElementById('imagePreviewModal');
    const fullImg = document.getElementById('fullImage');
    if (modal && fullImg) {
        fullImg.src = src;
        modal.classList.add('active');
        document.body.style.overflow = 'hidden'; // Prevent scrolling
    }
}

function closeImagePreview() {
    const modal = document.getElementById('imagePreviewModal');
    if (modal) {
        modal.classList.remove('active');
        document.body.style.overflow = ''; // Restore scrolling
    }
}


let selectedImageBase64 = null;

// ==================== CREATE POST FUNCTIONALITY ====================
document.addEventListener('DOMContentLoaded', async function () {
    initializeCurrentUser(); // Initialize current user info
    initializeAllButtons();

    // Initialize Hidden File Input for Photos
    const photoInput = document.getElementById('photoInput');
    const imagePreview = document.getElementById('imagePreview');
    const previewImg = imagePreview.querySelector('img');
    const removeImgBtn = imagePreview.querySelector('.remove-img');

    let postCropper = null;
    const postPhotoModal = document.getElementById('postPhotoModal');
    const postPhotoPreview = document.getElementById('postPhotoPreview');
    const confirmPhotoCrop = document.getElementById('confirmPhotoCrop');
    const cancelPhotoCrop = document.getElementById('cancelPhotoCrop');
    const closePhotoModal = document.getElementById('closePhotoModal');
    const reselectImageBtn = document.getElementById('reselectImageBtn');

    // Initialize Cropper for Posts
    const initPostCropper = (src) => {
        if (postCropper) postCropper.destroy();
        postPhotoPreview.src = src;
        postPhotoModal.style.display = 'flex';

        postCropper = new Cropper(postPhotoPreview, {
            aspectRatio: NaN, // Allow free cropping for posts
            viewMode: 1,
            dragMode: 'move',
            autoCropArea: 1, // Start with 100% visibility
            restore: false,
            guides: true,
            center: true,
            highlight: true,
            cropBoxMovable: true,
            cropBoxResizable: true,
            toggleDragModeOnDblclick: true,
        });
    };

    const closePostCropper = () => {
        postPhotoModal.style.display = 'none';
        if (postCropper) {
            postCropper.destroy();
            postCropper = null;
        }
    };

    if (photoInput) {
        photoInput.addEventListener('change', function (e) {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = function (event) {
                    initPostCropper(event.target.result);
                };
                reader.readAsDataURL(file);
            }
        });
    }

    if (confirmPhotoCrop) {
        confirmPhotoCrop.addEventListener('click', () => {
            if (postCropper) {
                const canvas = postCropper.getCroppedCanvas({
                    maxWidth: 1024,
                    maxHeight: 1024,
                    imageSmoothingEnabled: true,
                    imageSmoothingQuality: 'high',
                });
                selectedImageBase64 = canvas.toDataURL('image/jpeg', 0.8);
                previewImg.src = selectedImageBase64;
                imagePreview.style.display = 'block';
                closePostCropper();
            }
        });
    }

    if (cancelPhotoCrop) cancelPhotoCrop.addEventListener('click', closePostCropper);
    if (closePhotoModal) closePhotoModal.addEventListener('click', closePostCropper);
    if (reselectImageBtn) {
        reselectImageBtn.addEventListener('click', () => {
            photoInput.click();
        });
    }

    if (removeImgBtn) {
        removeImgBtn.addEventListener('click', () => {
            selectedImageBase64 = null;
            photoInput.value = '';
            imagePreview.style.display = 'none';
            previewImg.src = '';
        });
    }

    // Initialize Pagination
    let currentPage = 1;
    let currentLimit = 5;
    const mainContent = document.querySelector('.main-content');
    let isLoading = false;

    const postsLimitSelect = document.getElementById('postsLimit');

    // Load More Button
    const loadMoreBtn = document.createElement('button');
    loadMoreBtn.className = 'load-more-btn';
    loadMoreBtn.textContent = 'Load More';
    loadMoreBtn.style.display = 'none'; // Keep functional display control 
    loadMoreBtn.style.margin = '20px auto'; // Keep centering margin for now or move to css

    // Append button to main content (after post feed logic below)
    // Append button to post feed
    const postFeed = document.getElementById('postFeed');
    if (postFeed) postFeed.appendChild(loadMoreBtn);
    else if (mainContent) mainContent.appendChild(loadMoreBtn); // Fallback

    // Fetch Posts Function
    async function fetchPosts(reset = false) {
        if (isLoading) return;
        isLoading = true;

        if (reset) {
            currentPage = 1;
            // Clear post feed except for load more button
            if (postFeed) {
                const posts = postFeed.querySelectorAll('.post-card');
                posts.forEach(p => p.remove());
            }
            loadMoreBtn.style.display = 'none';
        }

        try {
            // Get limit from selector if exists
            if (postsLimitSelect) {
                currentLimit = parseInt(postsLimitSelect.value);
            }

            const data = await window.api.getPosts(currentPage, currentLimit);

            if (data && data.posts && data.posts.length > 0) {
                const container = document.querySelector('.create-post');

                // If appending, we need to insert before the "Load More" button, 
                // OR just append to main content but ensure order.
                // Since we used insertAdjacentElement('afterend') before, it reverses order if we loop.
                // Let's construct a fragment and append it properly at the end of the list.

                // Correct Logic: 
                // We want to append NEW posts to the BOTTOM of the feed.
                // The `create-post` is at the top. 
                // Any existing posts are below it.
                // We should find the LAST .post-card and insert after it, or append to main-content before button.

                data.posts.forEach(post => {
                    const postElement = createPostElementFromData(post);
                    // Insert into post feed before the load more button
                    if (postFeed) postFeed.insertBefore(postElement, loadMoreBtn);
                    else mainContent.insertBefore(postElement, loadMoreBtn); // Fallback

                    initializeNewPostButtons(postElement);
                });

                // Update "Load More" visibility
                if (data.hasMore) {
                    loadMoreBtn.style.display = 'block';
                    currentPage++;
                } else {
                    loadMoreBtn.style.display = 'none';
                }
            } else if (reset) {
                // No posts found on reset
                loadMoreBtn.style.display = 'none';
            }

        } catch (error) {
            console.error('Failed to load posts:', error);
        } finally {
            isLoading = false;
        }
    }

    // Event Listeners
    if (postsLimitSelect) {
        postsLimitSelect.addEventListener('change', () => {
            fetchPosts(true); // Reset and fetch
        });
    }

    loadMoreBtn.addEventListener('click', () => {
        fetchPosts(false); // Load next page
    });

    // Initial Load
    await fetchPosts(true);

    // Initialize Suggested Students
    await fetchSuggestedStudents();

    // Handle shared post link
    const urlParams = new URLSearchParams(window.location.search);
    const sharedPostId = urlParams.get('post');
    if (sharedPostId) {
        // First check if it's already in the feed (e.g. if it was recent)
        const existingPost = document.querySelector(`.post-card[data-id="${sharedPostId}"]`);
        if (existingPost) {
            scrollToAndHighlightPost(existingPost, true);
            return;
        }

        try {
            // Fetch the specific post
            const post = await window.api.getPost(sharedPostId);
            if (post) {
                // Prepend it to the feed
                const postElement = createPostElementFromData(post);
                const postFeed = document.getElementById('postFeed');
                const createPostSection = document.querySelector('.create-post');

                if (postFeed) {
                    postFeed.prepend(postElement);
                } else if (createPostSection) {
                    createPostSection.insertAdjacentElement('afterend', postElement);
                }

                initializeNewPostButtons(postElement);
                scrollToAndHighlightPost(postElement, true);
            }
        } catch (error) {
            console.error('Failed to load shared post:', error);
            showNotification('Shared post could not be found or has been deleted.', 'warning');
        }
    }
});

function scrollToAndHighlightPost(element, addBadge = false) {
    setTimeout(() => {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        element.classList.add('post-highlight');

        if (addBadge) {
            const header = element.querySelector('.post-header');
            if (header && !header.querySelector('.shared-post-badge')) {
                const badge = document.createElement('span');
                badge.className = 'shared-post-badge';
                badge.textContent = '📍 Directly Linked Post';
                badge.style.cssText = 'font-size: 10px; color: #006D77; background: #E0EEEE; padding: 2px 6px; border-radius: 4px; margin-left: 10px;';
                header.querySelector('.user-info').appendChild(badge);
            }
        }

        setTimeout(() => element.classList.remove('post-highlight'), 3000);
    }, 500);
}

// ==================== SUGGESTED STUDENTS ====================
async function fetchSuggestedStudents() {
    try {
        const response = await window.api.getSuggestedStudents();
        if (response && response.users) {
            const sidebarCard = document.querySelector('.sidebar-card');
            if (sidebarCard) {
                // Determine if we need to clear everything or just the list items
                // The HTML has a title <h3>Suggested Students</h3>. We should keep it.
                // Or we can just rebuild the list content.

                const title = sidebarCard.querySelector('.sidebar-title');
                sidebarCard.innerHTML = '';
                if (title) sidebarCard.appendChild(title);
                else sidebarCard.innerHTML = '<h3 class="sidebar-title">Suggested Students</h3>';

                response.users.forEach(user => {
                    const studentItem = document.createElement('div');
                    studentItem.className = 'student-item';
                    studentItem.innerHTML = `
                        <img src="${user.avatar}" alt="${user.name}" class="avatar-small">
                        <div class="student-info">
                            <h4>${user.name}</h4>
                            <p>${user.major || 'Student'}</p>
                        </div>
                        <button class="arrow-btn" onclick="window.location.href='profile.html?id=${user._id}'">›</button>
                    `;
                    sidebarCard.appendChild(studentItem);
                });
            }
        }
    } catch (error) {
        console.error('Failed to fetch suggested students:', error);
    }
}

function createPostElementFromData(post) {
    const postCard = document.createElement('div');
    postCard.className = 'post-card';
    postCard.dataset.id = post._id; // Store ID for interactions
    postCard.dataset.userId = post.user?._id || ''; // Store owner ID for edit/delete permissions

    const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
    const isLiked = post.likes.includes(currentUser.id);
    const commentCount = post.comments ? post.comments.length : 0;

    // Handle missing user (e.g. deleted account)
    if (!post.user) {
        console.warn('Post skipped due to missing user:', post._id);
        return document.createElement('div'); // Return empty div to avoid crash
    }

    // Map old avatar path
    let postAvatar = post.user.avatar || 'photos/default-avatar.png';
    if (postAvatar === 'photos/profilepic1.png') postAvatar = 'photos/default-avatar.png';

    // Render existing comments (hidden by default)
    let commentsHTML = '';
    if (post.comments && post.comments.length > 0) {
        commentsHTML = post.comments.map(comment => {
            const isCommentLiked = comment.likes && comment.likes.includes(currentUser.id);
            const commentUserId = comment.user?._id || comment.user || '';
            const commentUserName = comment.user?.name || 'User';
            let commentAvatar = comment.user?.avatar || 'photos/default-avatar.png';
            if (commentAvatar === 'photos/profilepic1.png') commentAvatar = 'photos/default-avatar.png';
            return `
        <div class="comment" data-id="${comment._id}" data-user-id="${commentUserId}" style="display:none;">
            <img src="${commentAvatar}" alt="${commentUserName}" class="avatar-small">
            <div class="comment-content">
                <div class="comment-header">
                    <h4>${commentUserName}</h4>
                    <span class="comment-time">${new Date(comment.createdAt).toLocaleDateString()}</span>
                    <button class="more-btn">
                        <svg width="18" height="18" fill="currentColor" viewBox="0 0 16 16">
                            <path d="M9.5 13a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0zm0-5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0zm0-5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0z"/>
                        </svg>
                    </button>
                </div>
                 <p class="comment-tags">
                     <span class="tag-small">Community Member</span>
                 </p>
                <p class="comment-text">${comment.text}</p>
                <div class="comment-actions">
                    <button class="comment-action ${isCommentLiked ? 'liked' : ''}" style="${isCommentLiked ? 'color: #DC2626;' : ''}">
                        <svg width="14" height="14" fill="currentColor" viewBox="0 0 16 16">
                            <path d="${isCommentLiked ? 'M8 1.314C12.438-3.248 23.534 4.735 8 15-7.534 4.736 3.562-3.248 8 1.314z' : 'm8 2.748-.717-.737C5.6.281 2.514.878 1.4 3.053c-.523 1.023-.641 2.5.314 4.385.92 1.815 2.834 3.989 6.286 6.357 3.452-2.368 5.365-4.542 6.286-6.357.955-1.886.838-3.362.314-4.385C13.486.878 10.4.28 8.717 2.01L8 2.748zM8 15C-7.333 4.868 3.279-3.04 7.824 1.143c.06.055.119.112.176.171a3.12 3.12 0 0 1 .176-.17C12.72-3.042 23.333 4.867 8 15z'}"/>
                        </svg>
                        Like
                    </button>
                    <button class="comment-action" onclick="replyToComment(this)">Reply</button>
                </div>
            </div>
        </div>`;
        }).join('');
    }

    postCard.innerHTML = `
        <div class="post-header">
            <img src="${postAvatar}" alt="${post.user ? post.user.name : 'User'}" class="avatar">
            <div class="user-info">
                <h3>${post.user ? post.user.name : 'User'}</h3>
                <p class="user-tags">
                    <span class="tag">User</span>
                </p>
            </div>
            <div class="header-right">
                <span class="post-time">${new Date(post.createdAt).toLocaleDateString()}</span>
                <button class="more-btn">
                    <svg width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
                        <path d="M9.5 13a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0zm0-5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0zm0-5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0z"/>
                    </svg>
                </button>
            </div>
        </div>
        <div class="post-content">
            <p>${linkify(post.text)}</p>
            ${post.image ? `<img src="${post.image}" alt="Post Image" class="post-image">` : ''}
        </div>
        <div class="post-stats">
            <span class="stat">❤️ ${post.likes.length}</span>
            <span class="stat">💬 ${commentCount}</span>
            <a href="#" class="view-comments">view all comments</a>
        </div>
        <div class="post-interactions">
            <button class="interact-btn ${isLiked ? 'liked' : ''}" style="${isLiked ? 'color: #DC2626;' : ''}">
                <svg width="18" height="18" fill="currentColor" viewBox="0 0 16 16">
                     <path d="${isLiked ? 'M8 1.314C12.438-3.248 23.534 4.735 8 15-7.534 4.736 3.562-3.248 8 1.314z' : 'm8 2.748-.717-.737C5.6.281 2.514.878 1.4 3.053c-.523 1.023-.641 2.5.314 4.385.92 1.815 2.834 3.989 6.286 6.357 3.452-2.368 5.365-4.542 6.286-6.357.955-1.886.838-3.362.314-4.385C13.486.878 10.4.28 8.717 2.01L8 2.748zM8 15C-7.333 4.868 3.279-3.04 7.824 1.143c.06.055.119.112.176.171a3.12 3.12 0 0 1 .176-.17C12.72-3.042 23.333 4.867 8 15z'}"/>
                </svg>
                Like
            </button>
            <button class="interact-btn">
                <svg width="18" height="18" fill="currentColor" viewBox="0 0 16 16">
                    <path d="M2.678 11.894a1 1 0 0 1 .287.801 10.97 10.97 0 0 1-.398 2c1.395-.323 2.247-.697 2.634-.893a1 1 0 0 1 .176-.074A8.06 8.06 0 0 0 8 14c3.996 0 7-2.807 7-6 0-3.192-3.004-6-7-6S1 4.808 1 8c0 1.468.617 2.83 1.678 3.894zm-.493 3.905a21.682 21.682 0 0 1-.713.129c-.2.032-.352-.176-.273-.362a9.68 9.68 0 0 0 .244-.637l.003-.01c.248-.72.45-1.548.524-2.319C.743 11.37 0 9.76 0 8c0-3.866 3.582-7 8-7s8 3.134 8 7-3.582 7-8 7a9.06 9.06 0 0 1-2.347-.306c-.52.263-1.639.742-3.468 1.105z"/>
                </svg>
                Comment
            </button>
            <button class="interact-btn share-btn">
                <svg width="18" height="18" fill="currentColor" viewBox="0 0 16 16">
                    <path d="M11 2.5a2.5 2.5 0 1 1 .603 1.628l-6.718 3.12a2.499 2.499 0 0 1 0 1.504l6.718 3.12a2.5 2.5 0 1 1-.488.876l-6.718-3.12a2.5 2.5 0 1 1 0-3.256l6.718-3.12A2.5 2.5 0 0 1 11 2.5z" />
                </svg>
                Share
            </button>
        </div>
        <div class="comments-list">
            ${commentsHTML}
        </div>
    `;
    return postCard;
}

function initializeAllButtons() {
    // Publish Post Button
    const publishBtn = document.querySelector('.btn-publish');
    if (publishBtn) {
        publishBtn.addEventListener('click', publishPost);
    }

    // Photo/Link Action Buttons
    const actionBtns = document.querySelectorAll('.create-post .action-btn');
    actionBtns.forEach(btn => {
        btn.addEventListener('click', function () {
            const btnText = this.textContent.trim();
            if (btnText === 'Photo') {
                triggerPhotoUpload();
            } else if (btnText === 'Link') {
                addLinkToPost();
            }
        });
    });

    // Post buttons in static HTML or newly loaded
    const posts = document.querySelectorAll('.post-card');
    posts.forEach(post => initializeNewPostButtons(post));

    // View All Comments Link
    const viewCommentsLinks = document.querySelectorAll('.view-comments');
    viewCommentsLinks.forEach(link => {
        link.addEventListener('click', function (e) {
            e.preventDefault();
            viewAllComments(this);
        });
    });
    // Arrow Buttons in Sidebar
    const arrowBtns = document.querySelectorAll('.arrow-btn');
    arrowBtns.forEach(btn => {
        btn.addEventListener('click', function () {
            handleArrowClick(this);
        });
    });

    // View Event Button
    const viewBtns = document.querySelectorAll('.btn-view');
    viewBtns.forEach(btn => {
        btn.addEventListener('click', function () {
            viewEvent(this);
        });
    });
}

function initializeCurrentUser() {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (user && user.name) {
        const createPostHeader = document.querySelector('.create-post .post-header');
        if (createPostHeader) {
            const avatarImg = createPostHeader.querySelector('.avatar');
            const userNameEl = createPostHeader.querySelector('.user-info h3');

            if (avatarImg) {
                let currentAvatar = user.avatar || 'photos/default-avatar.png';
                if (currentAvatar === 'photos/profilepic1.png') currentAvatar = 'photos/default-avatar.png';
                avatarImg.src = currentAvatar;
                avatarImg.alt = user.name;
            }

            if (userNameEl) {
                userNameEl.textContent = user.name;
            }
        }
    }
}

// ==================== PUBLISH POST ====================
async function publishPost() {
    const postInput = document.querySelector('.post-input');
    const content = postInput.value.trim();

    if (content === '') {
        showNotification('Please write something before publishing!', 'warning');
        return;
    }

    try {
        const response = await window.api.createPost(content, selectedImageBase64);

        // Create new post element from response
        const newPost = createPostElementFromData(response.post);
        // Insert at the top of post feed
        const postFeed = document.getElementById('postFeed');
        const createPostSection = document.querySelector('.create-post');
        if (postFeed) {
            postFeed.prepend(newPost);
        } else if (createPostSection) {
            createPostSection.insertAdjacentElement('afterend', newPost);
        }

        // Clear input
        postInput.value = '';

        // Reset image
        selectedImageBase64 = null;
        const photoInput = document.getElementById('photoInput');
        if (photoInput) photoInput.value = '';
        document.getElementById('imagePreview').style.display = 'none';

        showNotification('Post published successfully!', 'success');

        // Initialize buttons on new post
        initializeNewPostButtons(newPost);
    } catch (error) {
        showNotification('Failed to publish post: ' + error.message, 'error');
    }
}

function linkify(text) {
    if (!text) return '';
    const urlPattern = /(https?:\/\/[^\s]+)/g;
    return text.replace(urlPattern, '<a href="$1" target="_blank" class="link-text">$1</a>');
}

function createNewPost(content) {
    const postCard = document.createElement('div');
    postCard.className = 'post-card';
    postCard.innerHTML = `
        <div class="post-header">
            <img src="photos/default-avatar.png" alt="Reem Safadi" class="avatar">
            <div class="user-info">
                <h3>Reem Safadi</h3>
                <p class="user-tags">
                    <span class="tag">The world islamic science & education university</span>
                    <span class="tag-divider">Computer Science</span>
                </p>
            </div>
            <span class="post-time">Just now</span>
        </div>
        <div class="post-content">
            <p>${content}</p>
        </div>
        <div class="post-stats">
            <span class="stat">❤️ 0</span>
            <span class="stat">💬 0</span>
            <a href="#" class="view-comments">view all comments</a>
        </div>
        <div class="post-interactions">
            <button class="interact-btn">
                <svg width="18" height="18" fill="currentColor" viewBox="0 0 16 16">
                    <path d="m8 2.748-.717-.737C5.6.281 2.514.878 1.4 3.053c-.523 1.023-.641 2.5.314 4.385.92 1.815 2.834 3.989 6.286 6.357 3.452-2.368 5.365-4.542 6.286-6.357.955-1.886.838-3.362.314-4.385C13.486.878 10.4.28 8.717 2.01L8 2.748zM8 15C-7.333 4.868 3.279-3.04 7.824 1.143c.06.055.119.112.176.171a3.12 3.12 0 0 1 .176-.17C12.72-3.042 23.333 4.867 8 15z"/>
                </svg>
                Like
            </button>
            <button class="interact-btn">
                <svg width="18" height="18" fill="currentColor" viewBox="0 0 16 16">
                    <path d="M2.678 11.894a1 1 0 0 1 .287.801 10.97 10.97 0 0 1-.398 2c1.395-.323 2.247-.697 2.634-.893a1 1 0 0 1 .176-.074A8.06 8.06 0 0 0 8 14c3.996 0 7-2.807 7-6 0-3.192-3.004-6-7-6S1 4.808 1 8c0 1.468.617 2.83 1.678 3.894zm-.493 3.905a21.682 21.682 0 0 1-.713.129c-.2.032-.352-.176-.273-.362a9.68 9.68 0 0 0 .244-.637l.003-.01c.248-.72.45-1.548.524-2.319C.743 11.37 0 9.76 0 8c0-3.866 3.582-7 8-7s8 3.134 8 7-3.582 7-8 7a9.06 9.06 0 0 1-2.347-.306c-.52.263-1.639.742-3.468 1.105z"/>
                </svg>
                Comment
            </button>
            <button class="interact-btn share-btn" onclick="sharePost(this)">
                <svg width="18" height="18" fill="currentColor" viewBox="0 0 16 16">
                    <path d="M12.146.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1 0 .708l-10 10a.5.5 0 0 1-.168.11l-5 2a.5.5 0 0 1-.65-.65l2-5a.5.5 0 0 1 .11-.168l10-10zM11.207 2.5 13.5 4.793 14.793 3.5 12.5 1.207 11.207 2.5zm1.586 3L10.5 3.207 4 9.707V10h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.293l6.5-6.5zm-9.761 5.175-.106.106-1.528 3.821 3.821-1.528.106-.106A.5.5 0 0 1 5 12.5V12h-.5a.5.5 0 0 1-.5-.5V11h-.5a.5.5 0 0 1-.468-.325z"/>
            </svg>
                Share
            </button>
        </div>
    `;
    return postCard;
}

function initializeNewPostButtons(postCard) {
    const likeBtn = postCard.querySelector('.interact-btn');
    const commentBtn = postCard.querySelectorAll('.interact-btn')[1];
    const shareBtn = postCard.querySelector('.share-btn');
    const moreBtn = postCard.querySelector('.post-header .more-btn');
    const viewCommentsLink = postCard.querySelector('.view-comments');

    if (likeBtn) {
        likeBtn.addEventListener('click', function () {
            togglePostLike(this);
        });
    }

    if (commentBtn) {
        commentBtn.addEventListener('click', function () {
            toggleCommentSection(this);
        });
    }

    if (shareBtn) {
        shareBtn.addEventListener('click', function () {
            sharePost(this);
        });
    }

    if (moreBtn) {
        moreBtn.addEventListener('click', function () {
            showActionMenu(this, 'post');
        });
    }

    if (viewCommentsLink) {
        viewCommentsLink.addEventListener('click', function (e) {
            e.preventDefault();
            viewAllComments(this);
        });
    }

    // Initialize Image Preview for Post Images
    const postImage = postCard.querySelector('.post-image');
    if (postImage) {
        postImage.addEventListener('click', function () {
            openImagePreview(this.src);
        });
    }

    // Initialize buttons for existing comments
    const comments = postCard.querySelectorAll('.comment');
    comments.forEach(comment => {
        initializeCommentButtons(comment);
    });
}

// ==================== PHOTO UPLOAD ====================
function triggerPhotoUpload() {
    const photoInput = document.getElementById('photoInput');
    if (photoInput) {
        photoInput.click();
    }
}

// ==================== ADD LINK ====================
function addLinkToPost() {
    const modal = document.getElementById('popup-add-link');
    if (modal) {
        modal.style.display = 'flex';
        document.getElementById('link-url').focus();
    }
}

function closeLinkModal() {
    const modal = document.getElementById('popup-add-link');
    if (modal) {
        modal.style.display = 'none';
        document.getElementById('link-url').value = '';
    }
}

function submitLink() {
    const linkInput = document.getElementById('link-url');
    const link = linkInput.value.trim();

    if (link) {
        // Basic URL validation
        let formattedLink = link;
        if (!link.startsWith('http://') && !link.startsWith('https://')) {
            formattedLink = 'https://' + link;
        }

        const postInput = document.querySelector('.post-input');
        if (postInput) {
            const currentContent = postInput.value;
            const prefix = currentContent && !currentContent.endsWith('\n') ? '\n' : '';
            postInput.value = currentContent + prefix + formattedLink;

            showNotification('Link added to post!', 'success');
            closeLinkModal();
        }
    } else {
        showNotification('Please enter a URL', 'warning');
    }
}

// ==================== LIKE POST ====================
async function togglePostLike(button) {
    const postCard = button.closest('.post-card');
    const postId = postCard.dataset.id;
    const likeStat = postCard.querySelector('.post-stats .stat');
    const likeIcon = button.querySelector('svg path');

    if (!postId) {
        // Fallback for static posts without ID
        const isLiked = button.classList.contains('liked');
        if (isLiked) {
            button.classList.remove('liked');
            button.style.color = '#6B7280';
            likeIcon.setAttribute('d', 'm8 2.748-.717-.737C5.6.281 2.514.878 1.4 3.053c-.523 1.023-.641 2.5.314 4.385.92 1.815 2.834 3.989 6.286 6.357 3.452-2.368 5.365-4.542 6.286-6.357.955-1.886.838-3.362.314-4.385C13.486.878 10.4.28 8.717 2.01L8 2.748zM8 15C-7.333 4.868 3.279-3.04 7.824 1.143c.06.055.119.112.176.171a3.12 3.12 0 0 1 .176-.17C12.72-3.042 23.333 4.867 8 15z');
            updateLikeCount(likeStat, -1);
        } else {
            button.classList.add('liked');
            button.style.color = '#DC2626';
            likeIcon.setAttribute('d', 'M8 1.314C12.438-3.248 23.534 4.735 8 15-7.534 4.736 3.562-3.248 8 1.314z');
            updateLikeCount(likeStat, 1);
        }
        return;
    }

    try {
        const response = await window.api.likePost(postId);

        // Update UI based on response
        const isLiked = button.classList.contains('liked');

        if (isLiked) {
            // Was liked, now unliked
            button.classList.remove('liked');
            button.style.color = '#6B7280';
            likeIcon.setAttribute('d', 'm8 2.748-.717-.737C5.6.281 2.514.878 1.4 3.053c-.523 1.023-.641 2.5.314 4.385.92 1.815 2.834 3.989 6.286 6.357 3.452-2.368 5.365-4.542 6.286-6.357.955-1.886.838-3.362.314-4.385C13.486.878 10.4.28 8.717 2.01L8 2.748zM8 15C-7.333 4.868 3.279-3.04 7.824 1.143c.06.055.119.112.176.171a3.12 3.12 0 0 1 .176-.17C12.72-3.042 23.333 4.867 8 15z');
        } else {
            // Was unliked, now liked
            button.classList.add('liked');
            button.style.color = '#DC2626';
            likeIcon.setAttribute('d', 'M8 1.314C12.438-3.248 23.534 4.735 8 15-7.534 4.736 3.562-3.248 8 1.314z');
        }

        // Update count from server response if available, or manually
        if (response.likes !== undefined) {
            likeStat.textContent = '❤️ ' + response.likes;
        }

    } catch (error) {
        console.error('Like failed:', error);
        showNotification('Failed to update like', 'error');
    }
}

function updateLikeCount(statElement, change) {
    const text = statElement.textContent;
    const currentCount = parseInt(text.match(/\d+/)[0]);
    const newCount = Math.max(0, currentCount + change);
    statElement.textContent = '❤️ ' + newCount;
}

// ==================== COMMENT SECTION ====================
function toggleCommentSection(button) {
    const postCard = button.closest('.post-card');
    let commentInput = postCard.querySelector('.comment-input-section');

    if (!commentInput) {
        commentInput = createCommentInput();
        postCard.appendChild(commentInput);
        commentInput.querySelector('textarea').focus();
    } else {
        commentInput.remove();
    }
}

function createCommentInput() {
    const section = document.createElement('div');
    section.className = 'comment-input-section';
    section.innerHTML = `
        <div style="display: flex; gap: 12px; padding: 16px 0; border-top: 1px solid #E5E7EB;">
            <img src="photos/default-avatar.png" alt="You" class="avatar-small">
            <div style="flex: 1;">
                <textarea placeholder="Write a comment..." style="width: 100%; border: 1px solid #E5E7EB; border-radius: 8px; padding: 8px; font-size: 14px; resize: vertical; min-height: 60px; font-family: inherit;"></textarea>
                <button onclick="postComment(this)" style="margin-top: 8px; background-color: #006D77; color: white; border: none; padding: 6px 20px; border-radius: 6px; cursor: pointer; font-size: 13px;">Post Comment</button>
            </div>
        </div>
    `;
    return section;
}

async function postComment(button) {
    const section = button.closest('.comment-input-section');
    const textarea = section.querySelector('textarea');
    const commentText = textarea.value.trim();

    if (commentText === '') {
        showNotification('Please write a comment!', 'warning');
        return;
    }

    const postCard = button.closest('.post-card');
    const postId = postCard.dataset.id;

    // Disable button to prevent double submit
    button.disabled = true;
    button.textContent = 'Posting...';

    try {
        const response = await window.api.addComment(postId, commentText);

        // Although the backend returns the whole updated comments array or the new comment,
        // we can just create the UI element locally or use response data. 
        // For now, consistent UI update is enough.

        const newComment = createComment(commentText);

        // Find or create comments list container
        let commentsList = postCard.querySelector('.comments-list');
        if (!commentsList) {
            commentsList = document.createElement('div');
            commentsList.className = 'comments-list';
            section.insertAdjacentElement('beforebegin', commentsList);
        }

        // Append to list
        commentsList.appendChild(newComment);

        // Update comment count
        const commentStat = postCard.querySelectorAll('.post-stats .stat')[1];
        updateCommentCount(commentStat, 1);

        // Clear and remove input
        textarea.value = '';
        section.remove();

        showNotification('Comment posted!', 'success');

        // Initialize buttons on new comment
        initializeCommentButtons(newComment);

    } catch (error) {
        console.error("Failed to post comment:", error);
        showNotification('Failed to post comment.', 'error');
        button.disabled = false;
        button.textContent = 'Post Comment';
    }
}

function createComment(text) {
    const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
    const userName = currentUser.name || 'You';
    let userAvatar = currentUser.avatar || 'photos/default-avatar.png';
    if (userAvatar === 'photos/profilepic1.png') userAvatar = 'photos/default-avatar.png';
    const comment = document.createElement('div');
    comment.className = 'comment';
    comment.dataset.userId = currentUser.id || ''; // Store owner ID for edit/delete permissions
    comment.innerHTML = `
        <img src="${userAvatar}" alt="${userName}" class="avatar-small">
        <div class="comment-content">
            <div class="comment-header">
                <h4>${userName}</h4>
                <span class="comment-time">Just now</span>
                <button class="more-btn">
                     <svg width="18" height="18" fill="currentColor" viewBox="0 0 16 16">
                        <path d="M9.5 13a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0zm0-5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0zm0-5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0z"/>
                    </svg>
                </button>
            </div>
            <p class="comment-tags">
                <span class="tag-small">Community Member</span>
            </p>
            <p class="comment-text">${text}</p>
            <div class="comment-actions">
                <button class="comment-action">
                    <svg width="14" height="14" fill="currentColor" viewBox="0 0 16 16">
                        <path d="m8 2.748-.717-.737C5.6.281 2.514.878 1.4 3.053c-.523 1.023-.641 2.5.314 4.385.92 1.815 2.834 3.989 6.286 6.357 3.452-2.368 5.365-4.542 6.286-6.357.955-1.886.838-3.362.314-4.385C13.486.878 10.4.28 8.717 2.01L8 2.748zM8 15C-7.333 4.868 3.279-3.04 7.824 1.143c.06.055.119.112.176.171a3.12 3.12 0 0 1 .176-.17C12.72-3.042 23.333 4.867 8 15z"/>
                    </svg>
                    Like
                </button>
                <button class="comment-action">
                    <svg width="14" height="14" fill="currentColor" viewBox="0 0 16 16">
                        <path d="M5.5 5a.5.5 0 0 0-1 0v8a.5.5 0 0 0 1 0V5zm2.5 0a.5.5 0 0 0-1 0v8a.5.5 0 0 0 1 0V5zm2.5 0a.5.5 0 0 0-1 0v8a.5.5 0 0 0 1 0V5zm1.5 0a.5.5 0 0 1 1 0v8a.5.5 0 0 1-1 0V5z"/>
                    </svg>
                    Reply
                </button>
            </div>
        </div>
    `;
    return comment;
}

function initializeCommentButtons(comment) {
    // Buttons inside .comment-actions
    const likeBtn = comment.querySelector('.comment-action:first-child');
    const replyBtn = comment.querySelector('.comment-action:last-child');
    // More button in header
    const moreBtn = comment.querySelector('.more-btn');

    if (likeBtn) {
        // Remove existing listeners to avoid duplicates if re-initialized
        const newLikeBtn = likeBtn.cloneNode(true);
        likeBtn.parentNode.replaceChild(newLikeBtn, likeBtn);

        newLikeBtn.addEventListener('click', function () {
            toggleCommentLike(this);
        });
    }

    if (replyBtn) {
        const newReplyBtn = replyBtn.cloneNode(true);
        replyBtn.parentNode.replaceChild(newReplyBtn, replyBtn);

        newReplyBtn.addEventListener('click', function () {
            replyToComment(this);
        });
    }

    if (moreBtn) {
        const newMoreBtn = moreBtn.cloneNode(true);
        moreBtn.parentNode.replaceChild(newMoreBtn, moreBtn);

        newMoreBtn.addEventListener('click', function () {
            showActionMenu(this, 'comment');
        });
    }
}

function updateCommentCount(statElement, change) {
    const text = statElement.textContent;
    const currentCount = parseInt(text.match(/\d+/)[0]);
    const newCount = Math.max(0, currentCount + change);
    statElement.textContent = '💬 ' + newCount;
}

// ==================== LIKE COMMENT ====================
function toggleCommentLike(button) {
    const isLiked = button.classList.contains('liked');
    const likeIcon = button.querySelector('svg path');

    if (isLiked) {
        button.classList.remove('liked');
        button.style.color = '#9CA3AF';
        // Outline Heart
        likeIcon.setAttribute('d', 'm8 2.748-.717-.737C5.6.281 2.514.878 1.4 3.053c-.523 1.023-.641 2.5.314 4.385.92 1.815 2.834 3.989 6.286 6.357 3.452-2.368 5.365-4.542 6.286-6.357.955-1.886.838-3.362.314-4.385C13.486.878 10.4.28 8.717 2.01L8 2.748zM8 15C-7.333 4.868 3.279-3.04 7.824 1.143c.06.055.119.112.176.171a3.12 3.12 0 0 1 .176-.17C12.72-3.042 23.333 4.867 8 15z');
        showNotification('Comment unliked', 'info');
    } else {
        button.classList.add('liked');
        button.style.color = '#DC2626';
        // Filled Heart
        likeIcon.setAttribute('d', 'M8 1.314C12.438-3.248 23.534 4.735 8 15-7.534 4.736 3.562-3.248 8 1.314z');
        showNotification('Comment liked!', 'success');
    }
}

// ==================== REPLY TO COMMENT ====================
function replyToComment(button) {
    const comment = button.closest('.comment');
    const postCard = button.closest('.post-card');
    const userName = comment.querySelector('.comment-header h4').textContent;

    // Open comment section if not already open
    let commentInputSection = postCard.querySelector('.comment-input-section');
    if (!commentInputSection) {
        toggleCommentSection(postCard.querySelector('.interact-btn:nth-child(2)'));
        commentInputSection = postCard.querySelector('.comment-input-section');
    }

    const textarea = commentInputSection.querySelector('textarea');
    textarea.value = `@${userName} `;
    textarea.focus();

    showNotification('Replying to ' + userName, 'info');
}

// ==================== VIEW ALL COMMENTS ====================
function viewAllComments(link) {
    const postCard = link.closest('.post-card');
    const comments = postCard.querySelectorAll('.comment');

    if (comments.length > 0) {
        comments.forEach(comment => {
            comment.style.setProperty('display', 'flex', 'important');
        });
        showNotification('Showing all comments', 'info');

        // Scroll to the first comment to ensure visibility
        comments[0].scrollIntoView({ behavior: 'smooth', block: 'center' });
    } else {
        showNotification('No comments yet. Be the first to comment!', 'info');
    }
}

// ==================== UNIFIED ACTION MENU ====================
function showActionMenu(button, type) {
    console.log(`Opening action menu for ${type}`);
    // Close any existing menus
    const existingMenu = document.querySelector('.action-menu');
    if (existingMenu) {
        existingMenu.remove();
    }

    // Check ownership based on type (post or comment)
    const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
    let isOwner = false;

    if (type === 'post') {
        const postCard = button.closest('.post-card');
        const postOwnerId = postCard?.dataset.userId || '';
        isOwner = currentUser.id && postOwnerId && currentUser.id === postOwnerId;
    } else if (type === 'comment') {
        const comment = button.closest('.comment');
        const commentOwnerId = comment?.dataset.userId || '';
        isOwner = currentUser.id && commentOwnerId && currentUser.id === commentOwnerId;
    }

    // Create menu
    const menu = document.createElement('div');
    menu.className = 'action-menu';

    // Build menu HTML - only show Edit/Delete for owner
    let menuHTML = '';

    if (isOwner) {
        menuHTML += `
        <div class="menu-option edit-option">
            <svg width="14" height="14" fill="currentColor" viewBox="0 0 16 16">
                <path d="M12.146.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1 0 .708l-10 10a.5.5 0 0 1-.168.11l-5 2a.5.5 0 0 1-.65-.65l2-5a.5.5 0 0 1 .11-.168l10-10zM11.207 2.5 13.5 4.793 14.793 3.5 12.5 1.207 11.207 2.5zm1.586 3L10.5 3.207 4 9.707V10h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.293l6.5-6.5zm-9.761 5.175-.106.106-1.528 3.821 3.821-1.528.106-.106A.5.5 0 0 1 5 12.5V12h-.5a.5.5 0 0 1-.5-.5V11h-.5a.5.5 0 0 1-.468-.325z"/>
            </svg>
            Edit
        </div>
        <div class="menu-option delete-option">
            <svg width="14" height="14" fill="currentColor" viewBox="0 0 16 16">
                <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z"/>
                <path fill-rule="evenodd" d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z"/>
            </svg>
            Delete
        </div>`;
    }

    // Always show Report option for non-owners (and optionally for owners too)
    if (!isOwner) {
        menuHTML += `
        <div class="menu-option report-option">
            <svg width="14" height="14" fill="currentColor" viewBox="0 0 16 16">
                <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
                <path d="M7.002 11a1 1 0 1 1 2 0 1 1 0 0 1-2 0zM7.1 4.995a.905.905 0 1 1 1.8 0l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 4.995z"/>
            </svg>
            Report
        </div>`;
    }

    menu.innerHTML = menuHTML;

    const buttonRect = button.getBoundingClientRect();
    menu.style.position = 'absolute';
    menu.style.top = (buttonRect.bottom + window.scrollY + 5) + 'px';

    // Position menu to align its right edge with the button's right edge if possible
    let leftPos = buttonRect.left + window.scrollX - 120;
    if (leftPos < 10) leftPos = 10; // Avoid going off-screen left
    menu.style.left = leftPos + 'px';

    document.body.appendChild(menu);

    const editOption = menu.querySelector('.edit-option');
    const deleteOption = menu.querySelector('.delete-option');
    const reportOption = menu.querySelector('.report-option');

    if (editOption) {
        editOption.addEventListener('click', () => {
            if (type === 'post') editPost(button);
            else editComment(button);
            menu.remove();
        });
    }
    if (deleteOption) {
        deleteOption.addEventListener('click', () => {
            if (type === 'post') deletePost(button);
            else deleteComment(button);
            menu.remove();
        });
    }
    if (reportOption) {
        reportOption.addEventListener('click', () => {
            if (type === 'post') reportPost(button);
            else reportComment(button);
            menu.remove();
        });
    }

    setTimeout(() => {
        document.addEventListener('click', function closeMenu(e) {
            if (!menu.contains(e.target) && e.target !== button) {
                menu.remove();
                document.removeEventListener('click', closeMenu);
            }
        });
    }, 0);
}

function editPost(moreBtn) {
    const postCard = moreBtn.closest('.post-card');
    const postContent = postCard.querySelector('.post-content');
    const postText = postContent.querySelector('p');
    const originalText = postText.textContent;

    const editSection = document.createElement('div');
    editSection.className = 'edit-post-section';
    editSection.innerHTML = `
        <textarea class="edit-textarea">${originalText}</textarea>
        <div class="edit-buttons" style="margin-top: 10px; display: flex; gap: 10px;">
            <button class="btn-save-edit" style="background: #006D77; color: white; border: none; padding: 5px 15px; border-radius: 5px; cursor: pointer;">Save</button>
            <button class="btn-cancel-edit" style="background: #eee; color: #333; border: none; padding: 5px 15px; border-radius: 5px; cursor: pointer;">Cancel</button>
        </div>
    `;

    postText.style.display = 'none';
    postContent.insertBefore(editSection, postText);

    const textarea = editSection.querySelector('.edit-textarea');
    const saveBtn = editSection.querySelector('.btn-save-edit');
    const cancelBtn = editSection.querySelector('.btn-cancel-edit');

    textarea.focus();

    saveBtn.addEventListener('click', async () => {
        const newText = textarea.value.trim();
        if (!newText) return showNotification('Post cannot be empty', 'warning');

        try {
            await window.api.request(`/posts/${postCard.dataset.id}`, 'PUT', { text: newText });
            postText.textContent = newText;
            postText.style.display = 'block';
            editSection.remove();
            showNotification('Post updated!', 'success');
        } catch (error) {
            showNotification('Failed to update post', 'error');
        }
    });

    cancelBtn.addEventListener('click', () => {
        postText.style.display = 'block';
        editSection.remove();
    });
}

async function deletePost(moreBtn) {
    const postCard = moreBtn.closest('.post-card');

    if (await showConfirm('Are you sure you want to delete this post? This action cannot be undone.', 'Delete Post')) {
        try {
            await window.api.request(`/posts/${postCard.dataset.id}`, 'DELETE');
            postCard.remove();
            showAlert('Post deleted', 'success');
        } catch (error) {
            showAlert('Failed to delete post', 'error');
        }
    }
}

function reportPost(moreBtn) {
    const reportReasons = ['Spam', 'Harassment', 'Inappropriate', 'Fake News', 'Other'];

    showActionModal({
        title: 'Report Post',
        type: 'select',
        options: reportReasons,
        confirmText: 'Report',
        onConfirm: (reason) => {
            showNotification(`Post reported for: ${reason}. Thank you!`, 'success');
        }
    });
}

async function editComment(moreBtn) {
    const comment = moreBtn.closest('.comment');
    const postCard = moreBtn.closest('.post-card');
    const postId = postCard.dataset.id;
    const commentId = comment.dataset.id;

    if (!comment) {
        showNotification('Could not find comment to edit', 'error');
        return;
    }

    const commentTextElement = comment.querySelector('.comment-text');
    const originalText = commentTextElement.textContent;

    const editSection = document.createElement('div');
    editSection.className = 'edit-comment-section';
    editSection.innerHTML = `
        <textarea class="edit-textarea">${originalText}</textarea>
        <div class="edit-buttons">
            <button class="btn-save-edit">Save</button>
            <button class="btn-cancel-edit">Cancel</button>
        </div>
    `;

    commentTextElement.replaceWith(editSection);

    const textarea = editSection.querySelector('.edit-textarea');
    const saveBtn = editSection.querySelector('.btn-save-edit');
    const cancelBtn = editSection.querySelector('.btn-cancel-edit');

    textarea.focus();
    textarea.setSelectionRange(textarea.value.length, textarea.value.length);

    saveBtn.addEventListener('click', async () => {
        const newText = textarea.value.trim();
        if (newText === '') {
            showNotification('Comment cannot be empty', 'warning');
            return;
        }

        try {
            if (commentId) {
                await window.api.request(`/posts/${postId}/comment/${commentId}`, 'PUT', { text: newText });
            }

            const newCommentText = document.createElement('p');
            newCommentText.className = 'comment-text';
            newCommentText.textContent = newText;
            editSection.replaceWith(newCommentText);

            showNotification('Comment updated successfully!', 'success');
        } catch (error) {
            showNotification('Failed to update comment', 'error');
        }
    });

    cancelBtn.addEventListener('click', () => {
        const cancelCommentText = document.createElement('p');
        cancelCommentText.className = 'comment-text';
        cancelCommentText.textContent = originalText;
        editSection.replaceWith(cancelCommentText);
    });
}

async function deleteComment(moreBtn) {
    const comment = moreBtn.closest('.comment');
    const postCard = moreBtn.closest('.post-card');
    const postId = postCard.dataset.id;
    const commentId = comment.dataset.id;

    if (await showConfirm('Are you sure you want to delete this comment?', 'Delete Comment')) {
        if (!commentId) {
            comment.remove();
            showAlert('Comment removed', 'success');
            return;
        }

        try {
            await window.api.request(`/posts/${postId}/comment/${commentId}`, 'DELETE');
            comment.remove();
            const commentStat = postCard.querySelectorAll('.post-stats .stat')[1];
            updateCommentCount(commentStat, -1);
            showAlert('Comment deleted', 'success');
        } catch (error) {
            showAlert('Failed to delete comment', 'error');
        }
    }
}

function reportComment(moreBtn) {
    const reportReasons = ['Spam or misleading', 'Harassment or hate speech', 'Inappropriate content', 'False information', 'Other'];

    showActionModal({
        title: 'Report Comment',
        type: 'select',
        options: reportReasons,
        confirmText: 'Report',
        onConfirm: (reason) => {
            showNotification(`Comment reported for: ${reason}`, 'success');
        }
    });
}

// ==================== CUSTOM MODAL UI ====================
function showActionModal({ title, message, type = 'confirm', options = [], confirmText = 'Confirm', onConfirm }) {
    // Close any existing modal
    const existing = document.getElementById('action-modal-overlay');
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.id = 'action-modal-overlay';
    overlay.className = 'popup-overlay';
    overlay.style.display = 'flex';

    let contentHTML = '';
    if (type === 'confirm') {
        contentHTML = `<p style="margin-bottom: 20px; color: #4B5563;">${message}</p>`;
    } else if (type === 'select') {
        contentHTML = `
            <div class="form-group">
                <label>Select Reason:</label>
                <select class="popup-input" id="modal-select">
                    ${options.map(opt => `<option value="${opt}">${opt}</option>`).join('')}
                </select>
            </div>
        `;
    }

    overlay.innerHTML = `
        <div class="popup-box" style="transform: scale(1); opacity: 1;">
            <h3 class="popup-title">${title}</h3>
            ${contentHTML}
            <div class="popup-actions">
                <button class="popup-btn btn-secondary" onclick="document.getElementById('action-modal-overlay').remove()">Cancel</button>
                <button class="popup-btn btn-primary" id="modal-confirm-btn">${confirmText}</button>
            </div>
        </div>
    `;

    document.body.appendChild(overlay);

    overlay.querySelector('#modal-confirm-btn').addEventListener('click', () => {
        let result = true;
        if (type === 'select') {
            result = overlay.querySelector('#modal-select').value;
        }
        onConfirm(result);
        overlay.remove();
    });

    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) overlay.remove();
    });
}

// ==================== SIDEBAR INTERACTIONS ====================
function handleArrowClick(button) {
    const parent = button.closest('.student-item, .skill-item');

    if (parent.classList.contains('student-item')) {
        const studentName = parent.querySelector('h4').textContent;
        showNotification('Viewing ' + studentName + "'s profile...", 'info');
    } else if (parent.classList.contains('skill-item')) {
        const skillName = parent.querySelector('span').textContent;
        showNotification('Exploring ' + skillName + ' opportunities...', 'info');
    }
}

function viewEvent(button) {
    const eventItem = button.closest('.event-item');
    const eventName = eventItem.querySelector('h4').textContent;
    const eventDate = eventItem.querySelector('p').textContent;

    showNotification('Opening ' + eventName + ' on ' + eventDate + '...', 'info');
}

// ==================== NOTIFICATIONS ====================
function showNotification(message, type) {
    let notification = document.getElementById('notification');
    if (!notification) {
        notification = document.createElement('div');
        notification.id = 'notification';
        notification.className = 'notification';
        document.body.appendChild(notification);
    }

    notification.textContent = message;
    notification.className = 'notification ' + type;
    notification.classList.add('show');

    setTimeout(() => {
        notification.classList.remove('show');
    }, 3000);
}
