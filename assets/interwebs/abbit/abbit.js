console.log('🐍 Abbit: JavaScript loaded');

class AbbitApp {
    constructor() {
        console.log('🐍 Abbit: Constructor starting...');

        this.currentSubbabbit = 'all';
        this.currentSort = 'hot';
        this.posts = [];
        this.allPosts = [];
        this.postComments = {}; // Store comments per post
        this.maxComments = 50; // Limit comments per post
        this.llmService = null;
        this.currentPostId = null;

        console.log('🐍 Abbit: Basic properties set');

        // Initialize asynchronously
        this.initialize();
    }

    async initialize() {
        try {
            await this.initializeData();
            console.log('🐍 Abbit: Data initialized');

            this.setupEventListeners();
            console.log('🐍 Abbit: Event listeners set up');

            this.loadSubbabbits();
            console.log('🐍 Abbit: Subbabbits loaded');

            this.generateInitialPosts();
            console.log('🐍 Abbit: Posts generated');

            this.displayPosts();
            console.log('🐍 Abbit: Posts displayed');

        } catch (error) {
            console.error('❌ Abbit: Initialization error:', error);

            // Show error message to user
            const postsList = document.getElementById('postsList');
            if (postsList) {
                postsList.innerHTML = `
                    <div class="ab-loading" style="color: #ff4444;">
                        ❌ Failed to load Abbit data: ${error.message}
                        <br><br>
                        Please make sure the abbit-data.json file exists in the correct location.
                    </div>
                `;
            }
        }
    }

    async initializeData() {
        console.log('🐍 Loading data from abbit-data.json...');

        try {
            // Use fallback data if file not found
            const data = await this.loadDataFile();

            // Set properties from loaded data
            this.subbabbits = data.subbabbits;
            this.postTemplates = data.postTemplates;
            this.postVariables = data.postVariables;
            this.users = data.users;

            console.log('✅ Data loaded successfully');

        } catch (error) {
            console.error('❌ Failed to load data, using fallback:', error);
            this.initializeFallbackData();
        }
    }

    initializeFallbackData() {
        // Fallback data structure for testing
        this.subbabbits = {
            'snakesia': {
                name: 'r/Snakesia',
                icon: '🐍',
                color: '#FF4500',
                description: 'All about life in Snakesia',
                members: '15.2k'
            },
            'elxacorp': {
                name: 'r/ElxaCorp',
                icon: '🏢',
                color: '#0066CC',
                description: 'ElxaCorp news and updates',
                members: '8.3k'
            },
            'gaming': {
                name: 'r/Gaming',
                icon: '🎮',
                color: '#9146FF',
                description: 'Gaming discussions',
                members: '12.1k'
            }
        };

        this.users = {
            'You': { avatar: '👤', karma: 1, name: 'You' },
            'RemiMarway': { avatar: '😎', karma: 2847, name: 'Remi Marway' },
            'Snake_E_CEO': { avatar: '🐍', karma: 9999, name: 'Mr. Snake-e' },
            'Mrs_Snake_E': { avatar: '👵', karma: 1234, name: 'Mrs. Snake-e' },
            'PushingCat': { avatar: '🐱', karma: 666, name: 'Pushing Cat' }
        };

        this.postTemplates = {
            'snakesia': [{
                title: 'Just moved to Snakesia, any tips?',
                content: 'New resident here! What should I know about living in Snakesia?',
                author: 'RemiMarway',
                type: 'text',
                weight: 5,
                votes: { min: 15, max: 100 },
                comments: { min: 5, max: 25 }
            }],
            'elxacorp': [{
                title: 'ElxaOS update is amazing!',
                content: 'The new features in the latest ElxaOS update are incredible. Great work team!',
                author: 'Snake_E_CEO',
                type: 'text',
                weight: 5,
                votes: { min: 25, max: 150 },
                comments: { min: 8, max: 30 }
            }]
        };

        this.postVariables = {};
    }

    async loadDataFile() {
        const possiblePaths = [
            './assets/interwebs/abbit/abbit-data.json',
            'assets/interwebs/abbit/abbit-data.json'
        ];

        // Try file system API first
        if (window.fs && window.fs.readFile) {
            for (const path of possiblePaths) {
                try {
                    const fileData = await window.fs.readFile(path, { encoding: 'utf8' });
                    return JSON.parse(fileData);
                } catch (error) {
                    continue;
                }
            }
        }

        // Fallback to fetch API
        for (const path of possiblePaths) {
            try {
                const response = await fetch(path);
                if (response.ok) {
                    return await response.json();
                }
            } catch (error) {
                continue;
            }
        }

        throw new Error('Could not find abbit-data.json');
    }

    setupEventListeners() {
        console.log('🐍 Setting up event listeners...');

        // Sort selection
        document.getElementById('sortSelect').addEventListener('change', (e) => {
            this.currentSort = e.target.value;
            console.log('🐍 Sort changed to:', this.currentSort);
            this.displayPosts();
        });

        // Modal close
        document.getElementById('closeModal').addEventListener('click', () => {
            this.closeModal();
        });

        // Click outside modal to close
        document.getElementById('postModal').addEventListener('click', (e) => {
            if (e.target.id === 'postModal') {
                this.closeModal();
            }
        });

        // Search functionality
        document.querySelector('.ab-search-input').addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                const query = e.target.value.trim();
                if (query) {
                    this.searchPosts(query);
                }
            }
        });

        // Event delegation for modal content (fixes comment voting issue)
        document.getElementById('modalContent').addEventListener('click', (e) => {
            this.handleModalClick(e);
        });

        // Compose post
        document.getElementById('composePrompt').addEventListener('click', () => {
            this.openComposeModal();
        });
        document.getElementById('closeCompose').addEventListener('click', () => {
            this.closeComposeModal();
        });
        document.getElementById('composeCancel').addEventListener('click', () => {
            this.closeComposeModal();
        });
        document.getElementById('composeModal').addEventListener('click', (e) => {
            if (e.target.id === 'composeModal') this.closeComposeModal();
        });
        document.getElementById('composeSubmit').addEventListener('click', () => {
            this.submitUserPost();
        });
        // Enable/disable Post button based on title
        document.getElementById('composePostTitle').addEventListener('input', (e) => {
            const title = e.target.value.trim();
            document.getElementById('composeSubmit').disabled = title.length === 0;
            document.getElementById('composeTitleCount').textContent = e.target.value.length;
        });
        // Ctrl+Enter to submit from body textarea
        document.getElementById('composePostBody').addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                const title = document.getElementById('composePostTitle').value.trim();
                if (title) this.submitUserPost();
            }
        });

        console.log('✅ Event listeners setup complete');
    }

    // NEW: Handle all modal clicks with event delegation
    handleModalClick(e) {
        const target = e.target;

        // Comment voting
        if (target.classList.contains('ab-comment-vote')) {
            e.stopPropagation();
            e.preventDefault();
            const commentId = target.dataset.commentId;
            const isUpvote = target.classList.contains('ab-comment-upvote');
            console.log('🐍 Comment vote clicked:', commentId, isUpvote ? 'up' : 'down');
            this.voteComment(this.currentPostId, commentId, isUpvote ? 'up' : 'down');
        }

        // Reply buttons
        else if (target.classList.contains('ab-reply-button')) {
            const commentId = target.dataset.commentId;
            this.showReplyInput(commentId);
        }

        // Reply submit
        else if (target.classList.contains('ab-reply-submit')) {
            const commentId = target.dataset.commentId;
            this.submitReply(this.currentPostId, commentId);
        }

        // Reply cancel
        else if (target.classList.contains('ab-reply-cancel')) {
            const commentId = target.dataset.commentId;
            this.hideReplyInput(commentId);
        }

        // Comment submission
        else if (target.id === 'postComment') {
            this.submitComment(this.currentPostId);
        }
    }

    loadSubbabbits() {
        const subrabbitsList = document.getElementById('subrabbitsList');

        let html = `
            <div class="ab-subbabbit-item ${this.currentSubbabbit === 'all' ? 'active' : ''}" 
                 data-subbabbit="all">
                <span class="ab-subbabbit-icon">${ElxaIcons.renderAction('home')}</span>
                <span class="ab-subbabbit-name">All</span>
            </div>
        `;

        Object.entries(this.subbabbits).forEach(([id, subbabbit]) => {
            const isActive = this.currentSubbabbit === id ? 'active' : '';
            html += `
                <div class="ab-subbabbit-item ${isActive}" data-subbabbit="${id}">
                    <span class="ab-subbabbit-icon">${subbabbit.icon}</span>
                    <div class="ab-subbabbit-info">
                        <span class="ab-subbabbit-name">${subbabbit.name}</span>
                        <span class="ab-subbabbit-members">${subbabbit.members} members</span>
                    </div>
                </div>
            `;
        });

        subrabbitsList.innerHTML = html;

        // Add click listeners
        document.querySelectorAll('.ab-subbabbit-item').forEach(item => {
            item.addEventListener('click', (e) => {
                const subrabbittId = e.target.closest('.ab-subbabbit-item').dataset.subbabbit;
                this.loadSubbabbit(subrabbittId);
            });
        });
    }

    loadSubbabbit(subrabbittId) {
        console.log('🐍 Loading subbabbit:', subrabbittId);

        this.currentSubbabbit = subrabbittId;

        // Update active state
        document.querySelectorAll('.ab-subbabbit-item').forEach(item => {
            item.classList.remove('active');
        });
        document.querySelector(`[data-subbabbit="${subrabbittId}"]`).classList.add('active');

        // Update feed title
        const feedTitle = document.getElementById('feedTitle');
        if (subrabbittId === 'all') {
            feedTitle.textContent = 'Popular Posts';
        } else {
            feedTitle.textContent = this.subbabbits[subrabbittId].name;
        }

        this.displayPosts();
    }

    generateInitialPosts() {
        console.log('🐍 Generating initial posts...');

        this.allPosts = [];
        const totalPosts = 15;

        // Generate sample posts
        for (let i = 0; i < totalPosts; i++) {
            const subrabbits = Object.keys(this.subbabbits);
            const randomSub = subrabbits[Math.floor(Math.random() * subrabbits.length)];
            const post = this.createSamplePost(randomSub, i);
            if (post) {
                this.allPosts.push(post);
            }
        }

        // Sort by timestamp (newest first)
        this.allPosts.sort((a, b) => b.timestamp - a.timestamp);

        console.log(`✅ Generated ${this.allPosts.length} posts`);
    }

    createSamplePost(subrabbittId, index) {
        const subbabbit = this.subbabbits[subrabbittId];

        // Use actual templates from data file
        const templates = this.postTemplates[subrabbittId];
        if (templates && templates.length > 0) {
            const template = templates[Math.floor(Math.random() * templates.length)];
            const author = template.author;
            const user = this.users[author];
            if (!user) return null;

            const title = this.replacePostVariables(template.title);
            const content = this.replacePostVariables(template.content);
            const votes = Math.floor(Math.random() * (template.votes.max - template.votes.min)) + template.votes.min;
            const commentCount = Math.floor(Math.random() * (template.comments.max - template.comments.min)) + template.comments.min;

            const hoursAgo = Math.random() * 24;
            return {
                id: Date.now() + Math.random() + index,
                subbabbit: subrabbittId,
                title: title,
                content: content,
                author: author,
                user: user,
                type: template.type || 'text',
                votes: votes,
                commentCount: commentCount,
                timestamp: new Date(Date.now() - hoursAgo * 60 * 60 * 1000),
                upvoted: false,
                downvoted: false
            };
        }

        // Fallback if no templates for this subbabbit
        const userIds = Object.keys(this.users).filter(u => u !== 'You');
        const author = userIds[Math.floor(Math.random() * userIds.length)];
        const user = this.users[author];
        return {
            id: Date.now() + Math.random() + index,
            subbabbit: subrabbittId,
            title: `Discussion in ${subbabbit.name}`,
            content: 'What does everyone think about this?',
            author: author,
            user: user,
            type: 'text',
            votes: Math.floor(Math.random() * 50) + 5,
            commentCount: Math.floor(Math.random() * 10) + 2,
            timestamp: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000),
            upvoted: false,
            downvoted: false
        };
    }

    replacePostVariables(text) {
        return text.replace(/\{\{([^}]+)\}\}/g, (match, variableName) => {
            const values = this.postVariables[variableName];
            if (values && values.length > 0) {
                return values[Math.floor(Math.random() * values.length)];
            }
            return match;
        });
    }

    displayPosts() {
        let postsToShow = [...this.allPosts];

        // Filter by subbabbit
        if (this.currentSubbabbit !== 'all') {
            postsToShow = postsToShow.filter(post => post.subbabbit === this.currentSubbabbit);
        }

        // Sort posts
        switch (this.currentSort) {
            case 'new':
                postsToShow.sort((a, b) => b.timestamp - a.timestamp);
                break;
            case 'top':
                postsToShow.sort((a, b) => b.votes - a.votes);
                break;
            case 'hot':
            default:
                // Hot algorithm: combination of votes and recency
                postsToShow.sort((a, b) => {
                    const aScore = a.votes * Math.pow(0.8, (Date.now() - a.timestamp) / (1000 * 60 * 60));
                    const bScore = b.votes * Math.pow(0.8, (Date.now() - b.timestamp) / (1000 * 60 * 60));
                    return bScore - aScore;
                });
                break;
        }

        this.posts = postsToShow;
        this.renderPosts();
    }

    renderPosts() {
        const postsList = document.getElementById('postsList');

        if (this.posts.length === 0) {
            postsList.innerHTML = '<div class="ab-loading">No posts found</div>';
            return;
        }

        const html = this.posts.map(post => this.renderPostCard(post)).join('');
        postsList.innerHTML = html;

        // Add event listeners for posts
        this.posts.forEach(post => {
            const postElement = document.querySelector(`[data-post-id="${post.id}"]`);
            if (postElement) {
                const postContent = postElement.querySelector('.ab-post-content');
                if (postContent) {
                    postContent.addEventListener('click', (e) => {
                        this.openPostModal(post);
                    });
                    postContent.style.cursor = 'pointer';
                }
            }

            // Post vote buttons
            const postCard = document.querySelector(`[data-post-id="${post.id}"]`);
            if (postCard) {
                const upvoteBtn = postCard.querySelector('.ab-upvote');
                const downvoteBtn = postCard.querySelector('.ab-downvote');

                if (upvoteBtn) {
                    upvoteBtn.addEventListener('click', (e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        this.votePost(post.id, 'up');
                    });
                }

                if (downvoteBtn) {
                    downvoteBtn.addEventListener('click', (e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        this.votePost(post.id, 'down');
                    });
                }
            }
        });
    }

    renderPostCard(post) {
        const subbabbit = this.subbabbits[post.subbabbit];
        const timeAgo = this.formatTimeAgo(post.timestamp);

        return `
            <article class="ab-post-card" data-post-id="${post.id}">
                <div class="ab-post-votes">
                    <button class="ab-vote-button ab-upvote ${post.upvoted ? 'voted' : ''}">
                        ${ElxaIcons.renderAction('arrow-up-bold')}
                    </button>
                    <span class="ab-vote-count">${post.votes}</span>
                    <button class="ab-vote-button ab-downvote ${post.downvoted ? 'voted' : ''}">
                        ${ElxaIcons.renderAction('arrow-down-bold')}
                    </button>
                </div>
                <div class="ab-post-content">
                    <div class="ab-post-header">
                        <span class="ab-subbabbit-link" style="color: ${subbabbit.color}">
                            ${subbabbit.icon} ${subbabbit.name}
                        </span>
                        <span class="ab-post-meta">
                            • Posted by ${post.user.avatar} u/${post.author}${post.isUserPost ? ' <span class="ab-op-badge">OP</span>' : ''} • ${timeAgo}
                        </span>
                    </div>
                    <h3 class="ab-post-title">${post.title}</h3>
                    <div class="ab-post-body">${post.content}</div>
                    <div class="ab-post-footer">
                        <span class="ab-comment-count">${ElxaIcons.renderAction('comment')} ${post.commentCount} comments</span>
                        <span class="ab-share-button">${ElxaIcons.renderAction('share')} Share</span>
                    </div>
                </div>
            </article>
        `;
    }

    formatTimeAgo(timestamp) {
        const now = new Date();
        const diff = now - timestamp;

        if (diff < 60000) {
            return 'just now';
        } else if (diff < 3600000) {
            const minutes = Math.floor(diff / 60000);
            return `${minutes}m ago`;
        } else if (diff < 86400000) {
            const hours = Math.floor(diff / 3600000);
            return `${hours}h ago`;
        } else {
            const days = Math.floor(diff / 86400000);
            return `${days}d ago`;
        }
    }

    votePost(postId, direction) {
        const post = this.allPosts.find(p => p.id === postId);
        if (!post) return;

        console.log(`🐍 Voting ${direction} on post:`, post.title);

        if (direction === 'up') {
            if (post.upvoted) {
                post.upvoted = false;
                post.votes--;
            } else {
                if (post.downvoted) {
                    post.downvoted = false;
                    post.votes++;
                }
                post.upvoted = true;
                post.votes++;
            }
        } else if (direction === 'down') {
            if (post.downvoted) {
                post.downvoted = false;
                post.votes++;
            } else {
                if (post.upvoted) {
                    post.upvoted = false;
                    post.votes--;
                }
                post.downvoted = true;
                post.votes--;
            }
        }

        this.displayPosts();
    }

    openPostModal(post) {
        console.log('🐍 Opening post modal:', post.title);

        this.currentPostId = post.id;
        const modal = document.getElementById('postModal');
        const modalContent = document.getElementById('modalContent');

        // Generate post comments if they don't exist
        if (!this.postComments[post.id]) {
            this.generatePostComments(post);
        }

        const comments = this.postComments[post.id] || [];
        console.log('🐍 Rendering modal with', comments.length, 'top-level comments');

        // Debug: Log comment structure
        comments.forEach((comment, index) => {
            console.log(`Comment ${index}:`, comment.content, 'Replies:', comment.replies ? comment.replies.length : 0);
            if (comment.replies && comment.replies.length > 0) {
                comment.replies.forEach((reply, replyIndex) => {
                    console.log(`  Reply ${replyIndex}:`, reply.content, 'Author:', reply.author);
                });
            }
        });

        const subbabbit = this.subbabbits[post.subbabbit];

        modalContent.innerHTML = `
            <div class="ab-modal-post">
                <div class="ab-modal-post-header">
                    <span class="ab-subbabbit-link" style="color: ${subbabbit.color}">
                        ${subbabbit.icon} ${subbabbit.name}
                    </span>
                    <span class="ab-post-meta">
                        • Posted by ${post.user.avatar} u/${post.author}${post.isUserPost ? ' <span class="ab-op-badge">OP</span>' : ''} • ${this.formatTimeAgo(post.timestamp)}
                    </span>
                </div>
                <h2 class="ab-modal-post-title">${post.title}</h2>
                <div class="ab-modal-post-content">${post.content}</div>
                <div class="ab-modal-post-stats">
                    <span class="ab-vote-info">${ElxaIcons.renderAction('thumb-up')} ${post.votes} votes</span>
                    <span class="ab-comment-info">${ElxaIcons.renderAction('comment')} ${this.getTotalCommentCount(comments)} comments</span>
                </div>
            </div>

            <div class="ab-comment-section">
                <div class="ab-comment-input-section">
                    <textarea 
                        id="commentInput" 
                        class="ab-comment-input" 
                        placeholder="What are your thoughts?"
                        rows="3"
                    ></textarea>
                    <button id="postComment" class="ab-comment-submit">Comment</button>
                </div>

                <div class="ab-comments-list">
                    ${comments.map(comment => this.renderComment(comment)).join('')}
                </div>
            </div>
        `;

        modal.style.display = 'flex';

        // Add enter key support for comment input
        document.getElementById('commentInput').addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                this.submitComment(post.id);
            }
        });
    }

    generatePostComments(post) {
        console.log('🐍 Generating comments for post:', post.title);

        const commentCount = Math.floor(Math.random() * 6) + 2; // 2-7 comments
        const comments = [];

        const allUsers = Object.keys(this.users).filter(user => user !== 'You');
        const availableUsers = [...allUsers];

        // Character-appropriate comment styles
        const commentStyles = {
            'RemiMarway': ["yo this is so cool!", "dude epic post", "anyone wanna collab on this?", "this is fire 🔥", "lol nice"],
            'Snake_E_CEO': ["Excellent initiative.", "This aligns with ElxaCorp's vision.", "Well presented!", "The board will be pleased.", "Innovation at its finest."],
            'Mrs_Snake_E': ["What a lovely post, dear!", "This warms my heart!", "Reminds me of my garden 🌻", "So wonderful!", "Bless you for sharing!"],
            'PushingCat': ["*suspicious upvote*", "very interesting... for my plans 😼", "*knocks upvote button off table*", "heh", "this is relevant to my schemes"],
            'Rita': ["This is so sweet!", "Love this! ❤️", "Aw, how nice!", "You guys are the best", "haha this made my day"],
            'MinecraftPro': ["great tutorial potential here", "this needs more upvotes", "solid content, well done", "adding this to my bookmarks", "the community needs more of this"],
            'GameDevSnake': ["ooh game idea incoming", "*furiously takes notes*", "this could be a game mechanic", "love the creativity!", "shipping this concept"],
            'ElxaCorp_Dev': ["great feedback, noted!", "already working on something like this", "this is the way", "PR incoming", "filed an issue for this 👀"],
            'ElxaCorp_HR': ["Wonderful contribution to the community!", "Team spirit! ⭐", "This is what makes us great!", "Love the engagement!", "A+ participation!"],
            'SnakesiaResident1': ["love my town!", "classic Snakesia", "this is why we're the best", "so true!", "couldn't agree more"],
            'LocalMerchant': ["good for business!", "stop by my shop!", "the market approves!", "this will bring customers!", "wise words!"],
            'TownMayor': ["The council supports this.", "A fine contribution, citizen.", "Noted for the public record.", "Snakesia thanks you.", "Well said."],
            'SnakesiaChef': ["chef's kiss! 👨‍🍳", "this is as good as my stew", "perfectly seasoned post", "*sprinkles approval*", "a recipe for success!"],
            'LocalArtist': ["beautifully expressed ✨", "this is art", "you've inspired me", "the aesthetic is immaculate", "creative brilliance"],
            'SussyHelper1': ["boss says this is good", "approved by the lair", "very useful intel", "*takes suspicious notes*", "yes yes, excellent"],
            'MarketingManager': ["great brand alignment!", "this could trend!", "love the messaging", "engagement metrics approved", "sharing this with the team"]
        };

        const genericComments = ["interesting!", "nice post", "thanks for sharing", "love this", "agreed!"];

        for (let i = 0; i < Math.min(commentCount, availableUsers.length); i++) {
            const randomIndex = Math.floor(Math.random() * availableUsers.length);
            const randomUser = availableUsers[randomIndex];
            const user = this.users[randomUser];

            availableUsers.splice(randomIndex, 1);

            const pool = commentStyles[randomUser] || genericComments;
            const commentText = pool[Math.floor(Math.random() * pool.length)];

            const comment = {
                id: Date.now() + Math.random() + i,
                author: randomUser,
                user: user,
                content: commentText,
                votes: Math.floor(Math.random() * 20) + 1,
                timestamp: new Date(post.timestamp.getTime() + Math.random() * 3600000),
                type: 'generated',
                parentId: null,
                replies: []
            };

            comments.push(comment);
        }

        comments.sort((a, b) => a.timestamp - b.timestamp);
        this.postComments[post.id] = comments;
        console.log(`✅ Generated ${comments.length} comments for post`);
    }

    renderComment(comment, depth = 0) {
        const marginLeft = depth * 24;
        const repliesHtml = comment.replies && comment.replies.length > 0 
            ? comment.replies.map(reply => this.renderComment(reply, depth + 1)).join('')
            : '';

        return `
            <div class="ab-comment-thread" style="margin-left: ${marginLeft}px;">
                <div class="ab-comment" data-comment-id="${comment.id}">
                    <div class="ab-comment-votes">
                        <button class="ab-comment-vote ab-comment-upvote" data-comment-id="${comment.id}">${ElxaIcons.renderAction('arrow-up-bold')}</button>
                        <span class="ab-comment-vote-count">${comment.votes}</span>
                        <button class="ab-comment-vote ab-comment-downvote" data-comment-id="${comment.id}">${ElxaIcons.renderAction('arrow-down-bold')}</button>
                    </div>
                    <div class="ab-comment-content">
                        <div class="ab-comment-header">
                            ${comment.user.avatar} <strong>u/${comment.author}</strong>
                            <span class="ab-comment-time">${this.formatTimeAgo(comment.timestamp)}</span>
                            ${comment.type === 'user' ? '<span class="ab-user-badge">YOU</span>' : ''}
                            ${comment.type === 'llm' ? '<span class="ab-llm-badge"><span class="mdi mdi-robot elxa-icon-ui"></span></span>' : ''}
                        </div>
                        <div class="ab-comment-body">${comment.content}</div>
                        <div class="ab-comment-actions">
                            <button class="ab-reply-button" data-comment-id="${comment.id}">${ElxaIcons.renderAction('reply')} Reply</button>
                        </div>
                        <div class="ab-reply-input" id="replyInput-${comment.id}" style="display: none;">
                            <textarea class="ab-reply-textarea" placeholder="Write a reply..." rows="2"></textarea>
                            <div class="ab-reply-buttons">
                                <button class="ab-reply-submit" data-comment-id="${comment.id}">Reply</button>
                                <button class="ab-reply-cancel" data-comment-id="${comment.id}">Cancel</button>
                            </div>
                        </div>
                    </div>
                </div>
                ${repliesHtml}
            </div>
        `;
    }

    async submitComment(postId) {
        const commentInput = document.getElementById('commentInput');
        const content = commentInput.value.trim();

        if (!content) return;

        console.log('🐍 Submitting comment:', content);

        const userComment = {
            id: Date.now() + Math.random(),
            author: 'You',
            user: { avatar: '👤', karma: 1, name: 'You' },
            content: content,
            votes: 1,
            timestamp: new Date(),
            type: 'user',
            parentId: null,
            replies: []
        };

        if (!this.postComments[postId]) {
            this.postComments[postId] = [];
        }
        this.postComments[postId].push(userComment);

        const post = this.allPosts.find(p => p.id === postId);
        if (post) {
            post.commentCount++;
        }

        commentInput.value = '';
        this.openPostModal(post);

        // FIXED: Generate LLM response as reply to user's comment
        setTimeout(() => {
            this.generateLLMCommentReply(postId, userComment.id, content);
        }, 1000 + Math.random() * 3000);

        this.cleanupComments();
    }

    getTotalCommentCount(comments) {
        let count = comments.length;
        comments.forEach(comment => {
            if (comment.replies && comment.replies.length > 0) {
                count += this.getTotalCommentCount(comment.replies);
            }
        });
        return count;
    }

    showReplyInput(commentId) {
        const replyInput = document.getElementById(`replyInput-${commentId}`);
        if (replyInput) {
            replyInput.style.display = 'block';
            const textarea = replyInput.querySelector('.ab-reply-textarea');
            if (textarea) {
                textarea.focus();
            }
        }
    }

    hideReplyInput(commentId) {
        const replyInput = document.getElementById(`replyInput-${commentId}`);
        if (replyInput) {
            replyInput.style.display = 'none';
            const textarea = replyInput.querySelector('.ab-reply-textarea');
            if (textarea) {
                textarea.value = '';
            }
        }
    }

    async submitReply(postId, parentCommentId) {
        const replyInput = document.getElementById(`replyInput-${parentCommentId}`);
        const textarea = replyInput.querySelector('.ab-reply-textarea');
        const content = textarea.value.trim();

        if (!content) return;

        console.log('🐍 Submitting reply:', content, 'to parent:', parentCommentId);

        const userReply = {
            id: Date.now() + Math.random(),
            author: 'You',
            user: { avatar: '👤', karma: 1, name: 'You' },
            content: content,
            votes: 1,
            timestamp: new Date(),
            type: 'user',
            parentId: parentCommentId,
            replies: []
        };

        console.log('🐍 Created user reply object:', userReply);

        this.addReplyToComment(postId, parentCommentId, userReply);

        const post = this.allPosts.find(p => p.id === postId);
        if (post) {
            post.commentCount++;
        }

        this.hideReplyInput(parentCommentId);

        console.log('🐍 About to refresh modal with updated comments');
        this.openPostModal(post);

        setTimeout(() => {
            this.generateLLMCommentReply(postId, userReply.id, content);
        }, 1000 + Math.random() * 3000);
    }

    addReplyToComment(postId, parentCommentId, reply) {
        const comments = this.postComments[postId];
        console.log('🐍 Adding reply to comment. PostId:', postId, 'ParentId:', parentCommentId, 'Reply:', reply.content);

        function findAndAddReply(commentList) {
            for (let comment of commentList) {
                console.log('🔍 Checking comment ID:', comment.id, 'vs ParentID:', parentCommentId, 'Match:', comment.id == parentCommentId);
                if (comment.id == parentCommentId) { // Use == instead of === to handle string/number comparison
                    if (!comment.replies) comment.replies = [];
                    comment.replies.push(reply);
                    console.log('✅ Reply added successfully! Comment now has', comment.replies.length, 'replies');
                    return true;
                }
                if (comment.replies && comment.replies.length > 0) {
                    if (findAndAddReply(comment.replies)) {
                        return true;
                    }
                }
            }
            return false;
        }

        const success = findAndAddReply(comments);
        if (!success) {
            console.error('❌ Failed to find parent comment with ID:', parentCommentId);
            console.log('Available comment IDs:', comments.map(c => c.id));
        }
    }

    // FIXED: Generate LLM response as a reply to user's comment
    async generateLLMCommentReply(postId, parentCommentId, userContent) {
        console.log('🐍 Generating LLM reply to comment:', userContent);

        try {
            const post = this.allPosts.find(p => p.id === postId);
            if (!post) return;

            // Find who should respond
            const originalComment = this.findCommentById(postId, parentCommentId);
            if (!originalComment) return;

            let responder = null;
            if (originalComment.author !== 'You') {
                // Replying to an NPC — they respond back
                responder = originalComment.author;
            } else {
                // User posted a top-level comment — pick a random NPC from the thread
                const comments = this.postComments[postId] || [];
                const npcCommenters = comments
                    .filter(c => c.author !== 'You' && c.type !== 'system')
                    .map(c => c.author);
                // Deduplicate
                const unique = [...new Set(npcCommenters)];
                if (unique.length > 0) {
                    responder = unique[Math.floor(Math.random() * unique.length)];
                } else {
                    // No NPC commenters — pick the post author
                    responder = post.author !== 'You' ? post.author : null;
                }
            }

            if (!responder) return;
            console.log('🐍 Responder:', responder, 'will reply to user');

            const response = await this.callLLMService(userContent, post, responder, originalComment);

            if (response) {
                console.log('✅ LLM response received:', response);
                this.addLLMCommentReply(postId, parentCommentId, responder, response);
            } else {
                console.log('⚠️ No LLM response, using template fallback');
                this.addTemplateLLMReply(postId, parentCommentId, responder);
            }
        } catch (error) {
            console.error('❌ LLM response failed:', error);
            // Best-effort fallback
            const post = this.allPosts.find(p => p.id === postId);
            if (post && post.author !== 'You') {
                this.addTemplateLLMReply(postId, parentCommentId, post.author);
            }
        }
    }

    // FIXED: Add LLM reply to specific comment instead of top-level
    addLLMCommentReply(postId, parentCommentId, responder, content) {
        const user = this.users[responder];
        if (!user) return;

        const reply = {
            id: Date.now() + Math.random(),
            author: responder,
            user: user,
            content: content,
            votes: Math.floor(Math.random() * 10) + 1,
            timestamp: new Date(),
            type: 'llm',
            parentId: parentCommentId,
            replies: []
        };

        this.addReplyToComment(postId, parentCommentId, reply);

        const post = this.allPosts.find(p => p.id === postId);
        if (post) {
            post.commentCount++;
        }

        if (this.currentPostId === postId) {
            this.openPostModal(post);
        }

        console.log('✅ LLM reply added:', responder, '→', content);
    }

    addTemplateLLMReply(postId, parentCommentId, responder) {
        const responses = {
            'RemiMarway': ["yo that's sick!", "dude nice point!", "haha epic", "so true lol", "W take 🔥"],
            'Snake_E_CEO': ["Excellent observation.", "Well articulated!", "This aligns with our vision.", "Noted — great insight.", "Precisely right."],
            'Mrs_Snake_E': ["What a lovely thought, dear!", "So sweet of you!", "Bless your heart!", "That's wonderful!", "You're so right, sweetie!"],
            'PushingCat': ["*suspicious agreement*", "very true... very sus...", "meow (yes)", "*nods while plotting*", "heh 😼"],
            'Rita': ["Aw that's really nice!", "I love that perspective!", "So true! ❤️", "You're the best!", "haha so sweet"],
            'MinecraftPro': ["facts! great strategy", "this is the way", "100% agree, solid approach", "we need more posts like this", "pro move right there"],
            'GameDevSnake': ["ooh that gives me game design ideas", "interesting mechanic concept!", "noted for my next build", "the game dev in me loves this", "shipping this in the next update lol"],
            'ElxaCorp_Dev': ["pushing this to prod", "great feature request!", "already in the backlog 👀", "nice one, filing an issue", "this is the way"],
            'ElxaCorp_HR': ["Love the positive energy!", "Great teamwork!", "This is what community is about!", "Wonderful contribution!", "Gold star for you! ⭐"],
            'SnakesiaResident1': ["love this community!", "so true!", "classic Snakesia moment", "couldn't agree more", "this is why I live here"],
            'LocalMerchant': ["this is great for business!", "agreed, stop by my shop to celebrate!", "wise words!", "the market agrees!", "best take I've seen today"],
            'TownMayor': ["On behalf of Snakesia, well said.", "The council appreciates this input.", "Duly noted for our records.", "A fine point, citizen!", "This serves the community well."],
            'SnakesiaChef': ["chef's kiss to this comment 👨‍🍳", "perfectly seasoned take!", "this is as good as my famous stew", "recipe for a great discussion!", "well done — no pun intended"],
            'LocalArtist': ["this is art", "beautifully put ✨", "you've inspired my next piece", "the composition of this thought... *chef's kiss*", "creativity at its finest"],
            'SussyHelper1': ["boss would approve 😼", "noted for the operation", "very good intel", "adding to the sus files", "yes yes, excellent"]
        };

        const pool = responses[responder] || ["nice!", "agreed!", "interesting point", "haha true", "this ^"];
        const content = pool[Math.floor(Math.random() * pool.length)];
        this.addLLMCommentReply(postId, parentCommentId, responder, content);
    }

    findCommentById(postId, commentId) {
        const comments = this.postComments[postId];

        function searchComments(commentList) {
            for (let comment of commentList) {
                if (comment.id == commentId) {
                    return comment;
                }
                if (comment.replies && comment.replies.length > 0) {
                    const found = searchComments(comment.replies);
                    if (found) return found;
                }
            }
            return null;
        }

        return searchComments(comments);
    }

    async callLLMService(userComment, post, responder) {
        console.log('🐍 Calling LLM service for:', responder);

        // Use shared LLM service
        const llm = window.elxaLLM;
        if (!llm || !llm.isAvailable()) {
            console.log('⚠️ LLM service not available');
            return null;
        }

        try {
            const prompt = this.buildLLMPrompt(userComment, post, responder);
            const response = await llm.generateContent(prompt, {
                maxTokens: 200,
                temperature: 0.8
            });

            if (response) {
                return llm.truncateResponse(response, 300);
            }
            return null;
        } catch (error) {
            console.error('❌ LLM generation failed:', error);
            return null;
        }
    }

    buildLLMPrompt(userComment, post, responder) {
        const characterInfo = this.getCharacterInfo(responder);
        const subbabbit = this.subbabbits[post.subbabbit];
        const snakesiaTime = this.getSnakesiaTime();

        return `You are ${responder} commenting on a post in Abbit (like Reddit) for Snakesia. ${characterInfo.description}

CONTEXT:
- Current time in Snakesia: ${snakesiaTime}
- Subbabbit: ${subbabbit.name} - ${subbabbit.description}
- Original Post: "${post.title}"
- Post Content: "${post.content}"
- Post Author: ${post.author}

A user just commented: "${userComment}"

RESPONSE RULES:
- Respond as ${responder} in a Reddit-style comment
- Keep it SHORT: 1-2 sentences maximum  
- Be conversational and natural
- Stay in character
- React naturally to the user's comment
- Don't be overly helpful or formal
- Use casual Reddit-style language

Response as ${responder}:`;
    }

    getCharacterInfo(responder) {
        // Try world context first (shared with messenger/email)
        const wcm = window.conversationHistoryManager;
        if (wcm && wcm.worldContext && wcm.worldContext.keyCharacters) {
            const usernameToId = {
                'RemiMarway': 'remi',
                'Snake_E_CEO': 'mr_snake_e',
                'Mrs_Snake_E': 'mrs_snake_e',
                'Rita': 'rita',
                'PushingCat': 'pushing_cat'
            };
            const charId = usernameToId[responder];
            if (charId) {
                const char = wcm.worldContext.keyCharacters[charId];
                if (char) {
                    return {
                        description: `You are ${char.fullName || char.name}. ${char.details || char.description || ''} ${char.personality || ''}`
                    };
                }
            }
        }

        // Fallback descriptions for all characters
        const fallbackMap = {
            'RemiMarway': 'You are Remi, a cool 12-year-old YouTuber and Minecraft player. You talk casually like "yo", "dude", "nice".',
            'Snake_E_CEO': 'You are Mr. Snake-e, the 60-year-old CEO of ElxaCorp. Intelligent, business-minded, and friendly.',
            'Mrs_Snake_E': 'You are Mrs. Snake-e, an 80-year-old sweet grandmother who loves gardening and cooking. Calls people "dear".',
            'PushingCat': 'You are Pushing Cat, a mischievous black cat who is very "sus" and playful.',
            'Rita': 'You are Rita, a kind and patient older sister. Very sweet, protective, and caring.',
            'MinecraftPro': 'You are a skilled Minecraft player who shares tutorials and tips. Enthusiastic and helpful.',
            'GameDevSnake': 'You are an indie game developer in Snakesia. Passionate about making games for ElxaOS.',
            'ElxaCorp_Dev': 'You are a developer at ElxaCorp. Technical, enthusiastic about new features and updates.',
            'ElxaCorp_HR': 'You are HR at ElxaCorp. Professional, friendly, focused on company culture.',
            'SnakesiaResident1': 'You are a friendly Snakesia resident who loves community events.',
            'LocalMerchant': 'You are a local merchant in Snakesia. Friendly shopkeeper who knows everyone.',
            'TownMayor': 'You are the Mayor of Snakesia. Official, caring about the community, speaks formally.',
            'SnakesiaChef': 'You are a chef in Snakesia. Passionate about local cuisine and sharing recipes.',
            'LocalArtist': 'You are a local artist in Snakesia. Creative, expressive, always working on new pieces.',
            'SussyHelper1': 'You are Pushing Cat\'s loyal minion. You assist in suspicious schemes.'
        };

        return { description: fallbackMap[responder] || 'You are a friendly member of the Snakesia community.' };
    }

    getSnakesiaTime() {
        return window.elxaLLM ? window.elxaLLM.getSnakesiaTime() : new Date().toLocaleString();
    }

    processLLMResponse(rawResponse) {
        return window.elxaLLM ? window.elxaLLM.truncateResponse(rawResponse, 300) : rawResponse.trim().substring(0, 300);
    }

    // FIXED: Comment voting with proper state management
    voteComment(postId, commentId, direction) {
        console.log('🐍 Voting on comment:', commentId, direction);
        const comments = this.postComments[postId];

        function findAndVoteComment(commentList) {
            for (let comment of commentList) {
                if (comment.id == commentId) { // Use == instead of === for string/number comparison
                    console.log('✅ Found comment to vote on:', comment.content);

                    // Initialize vote state if not present
                    if (!comment.hasOwnProperty('userUpvoted')) {
                        comment.userUpvoted = false;
                        comment.userDownvoted = false;
                    }

                    if (direction === 'up') {
                        if (comment.userUpvoted) {
                            // Remove upvote
                            comment.userUpvoted = false;
                            comment.votes--;
                        } else {
                            // Add upvote
                            if (comment.userDownvoted) {
                                comment.userDownvoted = false;
                                comment.votes++; // Remove downvote first
                            }
                            comment.userUpvoted = true;
                            comment.votes++;
                        }
                    } else if (direction === 'down') {
                        if (comment.userDownvoted) {
                            // Remove downvote
                            comment.userDownvoted = false;
                            comment.votes++;
                        } else {
                            // Add downvote
                            if (comment.userUpvoted) {
                                comment.userUpvoted = false;
                                comment.votes--; // Remove upvote first
                            }
                            comment.userDownvoted = true;
                            comment.votes--;
                        }
                    }

                    console.log('✅ Comment vote updated. New score:', comment.votes);
                    return true;
                }
                if (comment.replies && comment.replies.length > 0) {
                    if (findAndVoteComment(comment.replies)) {
                        return true;
                    }
                }
            }
            return false;
        }

        if (findAndVoteComment(comments)) {
            // Re-render the modal to update the vote display
            const post = this.allPosts.find(p => p.id === postId);
            if (post && this.currentPostId === postId) {
                this.openPostModal(post);
            }
        } else {
            console.error('❌ Comment not found for voting:', commentId);
        }
    }

    cleanupComments() {
        const postIds = Object.keys(this.postComments);
        console.log(`🧹 Cleaning up ${postIds.length} post comment caches`);

        postIds.forEach(postId => {
            if (this.postComments[postId].length > this.maxComments) {
                this.postComments[postId] = this.postComments[postId].slice(-this.maxComments);
                console.log(`🧹 Trimmed ${postId} to ${this.maxComments} comments`);
            }
        });

        if (postIds.length > 20) {
            const sortedIds = postIds.sort();
            const idsToRemove = sortedIds.slice(0, postIds.length - 20);
            idsToRemove.forEach(id => {
                delete this.postComments[id];
                console.log(`🧹 Removed old post comment cache: ${id}`);
            });
        }
    }

    closeModal() {
        document.getElementById('postModal').style.display = 'none';
        this.currentPostId = null;
    }

    // =========================================================
    // User post composition
    // =========================================================

    openComposeModal() {
        const modal = document.getElementById('composeModal');
        const select = document.getElementById('composeSubbabbit');

        // Populate subbabbit dropdown
        select.innerHTML = '';
        Object.entries(this.subbabbits).forEach(([id, sub]) => {
            const opt = document.createElement('option');
            opt.value = id;
            opt.textContent = `${sub.icon} ${sub.name}`;
            // Pre-select current subbabbit if viewing one
            if (this.currentSubbabbit !== 'all' && this.currentSubbabbit === id) {
                opt.selected = true;
            }
            select.appendChild(opt);
        });

        // Reset form
        document.getElementById('composePostTitle').value = '';
        document.getElementById('composePostBody').value = '';
        document.getElementById('composeTitleCount').textContent = '0';
        document.getElementById('composeSubmit').disabled = true;

        modal.style.display = 'flex';
        // Auto-focus title input
        setTimeout(() => document.getElementById('composePostTitle').focus(), 100);
    }

    closeComposeModal() {
        document.getElementById('composeModal').style.display = 'none';
    }

    submitUserPost() {
        const subbabbitId = document.getElementById('composeSubbabbit').value;
        const title = document.getElementById('composePostTitle').value.trim();
        const body = document.getElementById('composePostBody').value.trim();

        if (!title) return;

        console.log('🐍 User creating post:', title, 'in', subbabbitId);

        const subbabbit = this.subbabbits[subbabbitId];
        const user = this.users['You'] || { avatar: '👤', karma: 1, name: 'You' };

        const newPost = {
            id: Date.now() + Math.random(),
            subbabbit: subbabbitId,
            title: title,
            content: body || '',
            author: 'You',
            user: user,
            type: 'text',
            votes: 1,
            commentCount: 0,
            timestamp: new Date(),
            upvoted: true, // auto-upvote your own post
            downvoted: false,
            isUserPost: true
        };

        // Add to top of posts
        this.allPosts.unshift(newPost);

        // Close modal, switch to the subbabbit (or stay on all), sort by new
        this.closeComposeModal();
        this.currentSort = 'new';
        document.getElementById('sortSelect').value = 'new';

        // If on a different subbabbit, switch to the one we posted in
        if (this.currentSubbabbit !== 'all' && this.currentSubbabbit !== subbabbitId) {
            this.loadSubbabbit(subbabbitId);
        } else {
            this.displayPosts();
        }

        console.log('✅ User post created:', newPost.id);

        // Trigger NPC reactions after a delay
        this.generateNPCReactionsToPost(newPost.id);
    }

    generateNPCReactionsToPost(postId) {
        const post = this.allPosts.find(p => p.id === postId);
        if (!post) return;

        console.log('🐍 Generating NPC reactions to user post:', post.title);

        // Initialize empty comments array
        this.postComments[postId] = [];

        const allNPCs = Object.keys(this.users).filter(u => u !== 'You');
        const shuffled = [...allNPCs].sort(() => Math.random() - 0.5);
        // 2-5 NPCs will react
        const reactorCount = Math.min(Math.floor(Math.random() * 4) + 2, shuffled.length);
        const reactors = shuffled.slice(0, reactorCount);

        // Stagger their reactions over time
        reactors.forEach((npcName, index) => {
            const delay = (2000 + Math.random() * 3000) * (index + 1); // 2-5s per wave

            setTimeout(() => {
                // Bump vote count with some randomness
                post.votes += Math.floor(Math.random() * 3) + 1;

                this.addNPCCommentToPost(postId, npcName, post);

                // Refresh display if user is looking at the feed
                if (this.currentPostId === postId) {
                    this.openPostModal(post);
                } else {
                    this.displayPosts();
                }
            }, delay);
        });
    }

    async addNPCCommentToPost(postId, npcName, post) {
        const user = this.users[npcName];
        if (!user) return;

        // Try LLM first
        let commentText = null;
        const llm = window.elxaLLM;
        if (llm && llm.isAvailable()) {
            try {
                const characterInfo = this.getCharacterInfo(npcName);
                const subbabbit = this.subbabbits[post.subbabbit];
                const prompt = `You are ${npcName} on Abbit (Reddit-like site) in Snakesia. ${characterInfo.description}

Someone just posted in ${subbabbit.name}:
Title: "${post.title}"
${post.content ? `Body: "${post.content}"` : '(no body text)'}

Write a short Reddit-style comment reacting to this post. Stay in character. 1-2 sentences max. Be natural and conversational.`;

                const response = await llm.generateContent(prompt, {
                    maxTokens: 150,
                    temperature: 0.9
                });
                if (response) {
                    commentText = llm.truncateResponse(response, 250);
                }
            } catch (e) {
                console.log('⚠️ LLM failed for NPC comment, using template');
            }
        }

        // Fallback to template comments
        if (!commentText) {
            const templateMap = {
                'RemiMarway': ["yooo nice post!", "this is fire 🔥", "dude love this", "epic W", "based post fr"],
                'Snake_E_CEO': ["Excellent contribution.", "The board approves.", "Well articulated.", "This shows great initiative.", "Impressive work."],
                'Mrs_Snake_E': ["What a lovely post, dear!", "This made my day!", "So wonderful!", "Bless you for sharing!", "How delightful!"],
                'PushingCat': ["interesting... very interesting 😼", "*upvotes suspiciously*", "hmm this could be useful", "heh", "*takes notes for plans*"],
                'Rita': ["Aw this is great!", "Love this! ❤️", "So cool!", "You're the best!", "haha nice!"],
                'MinecraftPro': ["solid content!", "this is the way", "great post, well done", "bookmarked!", "needs more upvotes"],
                'GameDevSnake': ["game dev approved!", "*takes notes*", "love the creativity!", "this gives me ideas", "shipping this concept"],
                'ElxaCorp_Dev': ["nice! filing this 👀", "great stuff!", "pushing to prod", "already on it", "PR incoming"],
                'ElxaCorp_HR': ["Love the participation!", "Great teamwork!", "Gold star! ⭐", "This is what makes us great!", "Wonderful!"],
                'SnakesiaResident1': ["love this!", "so true!", "classic!", "this is why I love Snakesia", "couldn't agree more"],
                'LocalMerchant': ["great for business!", "the market approves!", "wise words!", "stop by my shop to celebrate!", "best post today"],
                'TownMayor': ["The council notes this.", "Well said, citizen.", "A fine contribution.", "Snakesia thanks you.", "Duly noted."],
                'SnakesiaChef': ["chef's kiss! 👨‍🍳", "perfectly seasoned post", "recipe for success!", "delicious content", "*sprinkles approval*"],
                'LocalArtist': ["beautifully expressed ✨", "this is art", "inspired!", "the aesthetic!", "creative brilliance"],
                'SussyHelper1': ["boss approves 😼", "noted for the files", "very useful", "excellent intel", "*suspicious thumbs up*"]
            };
            const pool = templateMap[npcName] || ["nice post!", "interesting!", "agreed!", "thanks for sharing", "love this"];
            commentText = pool[Math.floor(Math.random() * pool.length)];
        }

        const comment = {
            id: Date.now() + Math.random(),
            author: npcName,
            user: user,
            content: commentText,
            votes: Math.floor(Math.random() * 15) + 1,
            timestamp: new Date(),
            type: 'generated',
            parentId: null,
            replies: []
        };

        if (!this.postComments[postId]) {
            this.postComments[postId] = [];
        }
        this.postComments[postId].push(comment);
        post.commentCount++;

        console.log(`✅ NPC ${npcName} commented on user post:`, commentText);
    }

    searchPosts(query) {
        console.log('🐍 Searching for:', query);
        const searchResults = this.allPosts.filter(post =>
            post.title.toLowerCase().includes(query.toLowerCase()) ||
            post.content.toLowerCase().includes(query.toLowerCase())
        );

        this.posts = searchResults;
        this.renderPosts();

        document.getElementById('feedTitle').textContent = `Search results for "${query}"`;
    }
}

// Initialize the app
function initAbbit() {
    console.log('🐍 Abbit: Starting initialization...');
    try {
        window.abbitApp = new AbbitApp();
        console.log('✅ Abbit: App initialized successfully');
    } catch (error) {
        console.error('❌ Abbit: Failed to initialize:', error);
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAbbit);
} else {
    initAbbit();
}

setTimeout(() => {
    if (!window.abbitApp) {
        console.log('🐍 Abbit: Fallback initialization...');
        initAbbit();
    }
}, 500);