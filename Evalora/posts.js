// Share Post Functionality
function sharePost(button) {
    const postCard = button.closest('.post-card');
    const postAuthor = postCard.querySelector('.user-info h3').textContent;
    const postContent = postCard.querySelector('.post-content p').textContent;
    const postUrl = window.location.href; // In a real app, this would be the specific post URL

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
    }
});

// ==================== CREATE POST FUNCTIONALITY ====================
document.addEventListener('DOMContentLoaded', async function () {
    initializeCurrentUser(); // Initialize current user info
    initializeAllButtons();

    // Fetch posts from backend
    try {
        const data = await window.api.getPosts();
        if (data && data.posts) {
            const container = document.querySelector('.create-post'); // Insert after this
            data.posts.forEach(post => {
                const postElement = createPostElementFromData(post);
                container.insertAdjacentElement('afterend', postElement);
                initializeNewPostButtons(postElement);
            });
        }
    } catch (error) {
        console.error('Failed to load posts:', error);
        // Fallback to static content if needed, or just show error
    }
});

function createPostElementFromData(post) {
    const postCard = document.createElement('div');
    postCard.className = 'post-card';
    postCard.dataset.id = post._id; // Store ID for interactions

    const isLiked = post.likes.includes(JSON.parse(localStorage.getItem('user') || '{}').id);

    postCard.innerHTML = `
        <div class="post-header">
            <img src="${post.user.avatar || 'photos/default-avatar.png'}" alt="${post.user.name}" class="avatar">
            <div class="user-info">
                <h3>${post.user.name}</h3>
                <p class="user-tags">
                    <span class="tag">User</span>
                </p>
            </div>
            <span class="post-time">${new Date(post.createdAt).toLocaleDateString()}</span>
        </div>
        <div class="post-content">
            <p>${post.text}</p>
            ${post.image ? `<img src="${post.image}" style="max-width:100%; margin-top:10px;">` : ''}
        </div>
        <div class="post-stats">
            <span class="stat">❤️ ${post.likes.length}</span>
            <span class="stat">💬 0</span>
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

    // Like Buttons on Posts
    const postLikeBtns = document.querySelectorAll('.post-interactions .interact-btn');
    postLikeBtns.forEach(btn => {
        const btnText = btn.textContent.trim();
        if (btnText === 'Like') {
            btn.addEventListener('click', function () {
                togglePostLike(this);
            });
        } else if (btnText === 'Comment') {
            btn.addEventListener('click', function () {
                toggleCommentSection(this);
            });
        }
    });

    // Like Buttons on Comments
    const commentLikeBtns = document.querySelectorAll('.comment-action');
    commentLikeBtns.forEach(btn => {
        const btnText = btn.textContent.trim();
        if (btnText === 'Like') {
            btn.addEventListener('click', function () {
                toggleCommentLike(this);
            });
        } else if (btnText === 'Reply') {
            btn.addEventListener('click', function () {
                replyToComment(this);
            });
        }
    });

    // View All Comments Link
    const viewCommentsLinks = document.querySelectorAll('.view-comments');
    viewCommentsLinks.forEach(link => {
        link.addEventListener('click', function (e) {
            e.preventDefault();
            viewAllComments(this);
        });
    });

    // More Button (...)
    const moreBtns = document.querySelectorAll('.more-btn');
    moreBtns.forEach(btn => {
        btn.addEventListener('click', function () {
            showMoreOptions(this);
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
                avatarImg.src = user.avatar || 'photos/default-avatar.png';
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
        const response = await window.api.createPost(content);

        // Create new post element from response
        const newPost = createPostElementFromData(response.post);
        const createPostSection = document.querySelector('.create-post');

        // Insert after create post section
        createPostSection.insertAdjacentElement('afterend', newPost);

        // Clear input
        postInput.value = '';

        showNotification('Post published successfully!', 'success');

        // Initialize buttons on new post
        initializeNewPostButtons(newPost);
    } catch (error) {
        showNotification('Failed to publish post: ' + error.message, 'error');
    }
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
}

// ==================== PHOTO UPLOAD ====================
function triggerPhotoUpload() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = function (e) {
        const file = e.target.files[0];
        if (file) {
            showNotification('Photo selected: ' + file.name, 'success');
            // In a real app, you would upload the file here
        }
    };
    input.click();
}

// ==================== ADD LINK ====================
async function addLinkToPost() {
    const link = await showPrompt('Enter the link URL:');
    if (link) {
        const postInput = document.querySelector('.post-input');
        postInput.value += '\n' + link;
        showNotification('Link added to post!', 'success');
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

function postComment(button) {
    const section = button.closest('.comment-input-section');
    const textarea = section.querySelector('textarea');
    const commentText = textarea.value.trim();

    if (commentText === '') {
        showNotification('Please write a comment!', 'warning');
        return;
    }

    const postCard = button.closest('.post-card');
    const newComment = createComment(commentText);

    // Insert before comment input section
    section.insertAdjacentElement('beforebegin', newComment);

    // Update comment count
    const commentStat = postCard.querySelectorAll('.post-stats .stat')[1];
    updateCommentCount(commentStat, 1);

    // Clear and remove input
    textarea.value = '';
    section.remove();

    showNotification('Comment posted!', 'success');

    // Initialize buttons on new comment
    initializeCommentButtons(newComment);
}

function createComment(text) {
    const comment = document.createElement('div');
    comment.className = 'comment';
    comment.innerHTML = `
        <img src="photos/default-avatar.png" alt="You" class="avatar-small">
        <div class="comment-content">
            <div class="comment-header">
                <h4>You</h4>
                <span class="comment-time">Just now</span>
                <button class="more-btn">&#8942;</button>
            </div>
            <p class="comment-tags">
                <span class="tag-small">The world islamic science & education university</span>
                <span class="tag-small">Computer Science</span>
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
    const likeBtn = comment.querySelector('.comment-action');
    const replyBtn = comment.querySelectorAll('.comment-action')[1];
    const moreBtn = comment.querySelector('.more-btn');

    if (likeBtn) {
        likeBtn.addEventListener('click', function () {
            toggleCommentLike(this);
        });
    }

    if (replyBtn) {
        replyBtn.addEventListener('click', function () {
            replyToComment(this);
        });
    }

    if (moreBtn) {
        moreBtn.addEventListener('click', function () {
            showMoreOptions(this);
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

    if (isLiked) {
        button.classList.remove('liked');
        button.style.color = '#9CA3AF';
        showNotification('Comment unliked', 'info');
    } else {
        button.classList.add('liked');
        button.style.color = '#DC2626';
        showNotification('Comment liked!', 'success');
    }
}

// ==================== REPLY TO COMMENT ====================
function replyToComment(button) {
    const comment = button.closest('.comment');
    const userName = comment.querySelector('.comment-header h4').textContent;

    showNotification('Reply feature coming soon! You would reply to ' + userName, 'info');
}

// ==================== VIEW ALL COMMENTS ====================
function viewAllComments(link) {
    const postCard = link.closest('.post-card');
    const comments = postCard.querySelectorAll('.comment');

    if (comments.length > 0) {
        comments.forEach(comment => {
            comment.style.display = 'flex';
        });
        showNotification('Showing all comments', 'info');
    } else {
        showNotification('No comments yet. Be the first to comment!', 'info');
    }
}

// ==================== MORE OPTIONS ====================
function showMoreOptions(button) {
    console.log("[v0] Opening comment menu");
    // Close any existing menus
    const existingMenu = document.querySelector('.comment-menu');
    if (existingMenu) {
        existingMenu.remove();
    }

    // Create menu
    const menu = document.createElement('div');
    menu.className = 'comment-menu';
    menu.dataset.triggerButton = 'true';
    menu.innerHTML = `
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
        </div>
        <div class="menu-option report-option">
            <svg width="14" height="14" fill="currentColor" viewBox="0 0 16 16">
                <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
                <path d="M7.002 11a1 1 0 1 1 2 0 1 1 0 0 1-2 0zM7.1 4.995a.905.905 0 1 1 1.8 0l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 4.995z"/>
            </svg>
            Report
        </div>
    `;

    const buttonRect = button.getBoundingClientRect();
    menu.style.position = 'absolute';
    menu.style.top = (buttonRect.bottom + window.scrollY) + 'px';
    menu.style.left = (buttonRect.left + window.scrollX - 100) + 'px';

    document.body.appendChild(menu);
    console.log("[v0] Menu appended to body");

    const editOption = menu.querySelector('.edit-option');
    const deleteOption = menu.querySelector('.delete-option');
    const reportOption = menu.querySelector('.report-option');

    editOption.addEventListener('click', () => {
        console.log("[v0] Edit option clicked");
        editComment(button);
    });
    deleteOption.addEventListener('click', () => {
        console.log("[v0] Delete option clicked");
        deleteComment(button);
    });
    reportOption.addEventListener('click', () => {
        console.log("[v0] Report option clicked");
        reportComment(button);
    });

    setTimeout(() => {
        document.addEventListener('click', closeMenu);
    }, 0);

    function closeMenu(e) {
        if (!menu.contains(e.target) && e.target !== button) {
            console.log("[v0] Closing menu");
            menu.remove();
            document.removeEventListener('click', closeMenu);
        }
    }
}

function editComment(moreBtn) {
    const menu = document.querySelector('.comment-menu');
    const comment = moreBtn.closest('.comment');

    if (!comment) {
        showNotification('Could not find comment to edit', 'error');
        if (menu) menu.remove();
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

    saveBtn.addEventListener('click', () => {
        const newText = textarea.value.trim();
        if (newText === '') {
            showNotification('Comment cannot be empty', 'warning');
            return;
        }

        const newCommentText = document.createElement('p');
        newCommentText.className = 'comment-text';
        newCommentText.textContent = newText;
        editSection.replaceWith(newCommentText);

        showNotification('Comment updated successfully!', 'success');
    });

    cancelBtn.addEventListener('click', () => {
        const cancelCommentText = document.createElement('p');
        cancelCommentText.className = 'comment-text';
        cancelCommentText.textContent = originalText;
        editSection.replaceWith(cancelCommentText);

        showNotification('Edit cancelled', 'info');
    });

    if (menu) menu.remove();
}

async function deleteComment(moreBtn) {
    const menu = document.querySelector('.comment-menu');
    const comment = moreBtn.closest('.comment');

    if (!comment) {
        showNotification('Could not find comment to delete', 'error');
        if (menu) menu.remove();
        return;
    }

    if (await showConfirm('Are you sure you want to delete this comment?')) {
        const postCard = comment.closest('.post-card');
        comment.remove();

        // Update comment count
        const commentStat = postCard.querySelectorAll('.post-stats .stat')[1];
        updateCommentCount(commentStat, -1);

        showNotification('Comment deleted', 'success');
    }

    if (menu) menu.remove();
}

async function reportComment(moreBtn) {
    const menu = document.querySelector('.comment-menu');

    const reportReasons = [
        'Spam or misleading',
        'Harassment or hate speech',
        'Inappropriate content',
        'False information',
        'Other'
    ];

    const reason = await showPrompt('Why are you reporting this comment?\n\n' +
        reportReasons.map((r, i) => `${i + 1}. ${r}`).join('\n') +
        '\n\nEnter the number (1-5):');

    if (reason) {
        const reasonNum = parseInt(reason);
        if (reasonNum >= 1 && reasonNum <= 5) {
            showNotification(`Comment reported for: ${reportReasons[reasonNum - 1]}`, 'success');
        } else {
            showNotification('Invalid reason selected', 'warning');
        }
    }

    if (menu) menu.remove();
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
