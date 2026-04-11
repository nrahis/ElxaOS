// =================================
// HELP PROGRAM
// =================================
class HelpProgram {
    constructor(windowManager, fileSystem, eventBus) {
        this.windowManager = windowManager;
        this.fileSystem = fileSystem;
        this.eventBus = eventBus;
        this.currentGuide = 'getting-started';

        // Listen for desktop ready to show first-launch popup
        this.eventBus.on('desktop.ready', () => this._checkFirstLaunch());
    }

    // =========================================================
    // First-Launch Welcome Popup
    // =========================================================
    _checkFirstLaunch() {
        const seen = localStorage.getItem('elxaOS-help-offered');
        if (seen) return;

        localStorage.setItem('elxaOS-help-offered', 'true');

        // Short delay so the desktop has time to settle
        setTimeout(() => this._showWelcomePopup(), 1200);
    }

    _showWelcomePopup() {
        ElxaUI.showConfirmDialog({
            title: 'Welcome to ElxaOS!',
            message: `It looks like this is your first time here! Would you like to open the Help guide? It has tips on setting up email, banking, getting a job, and more.\n\nYou can always find Help later in Start → Utilities.`,
            confirmText: 'Yes, show me!',
            cancelText: 'No thanks',
            onConfirm: () => this.launch(),
            onCancel: () => {}
        });
    }

    // =========================================================
    // Launch
    // =========================================================
    launch(args) {
        const windowId = `help-${Date.now()}`;
        const content = this._buildUI(windowId);
        this.windowManager.createWindow(windowId, 'Help', content, {
            width: 620,
            height: 460,
            icon: ElxaIcons.renderAction('help-circle')
        });

        // Select initial guide (or one passed via args)
        const startGuide = (typeof args === 'string') ? args : 'getting-started';
        setTimeout(() => this._selectGuide(windowId, startGuide), 50);
    }

    // =========================================================
    // UI
    // =========================================================
    _buildUI(windowId) {
        const sidebarItems = this._getGuides().map(g => {
            const icon = g.icon || 'mdi-help-circle';
            return `<div class="help-sidebar-item" data-guide="${g.id}">
                <span class="mdi ${icon} elxa-icon-ui"></span> ${g.title}
            </div>`;
        }).join('');

        return `
            <div class="help-container" data-window-id="${windowId}">
                <div class="help-sidebar">
                    <div class="help-sidebar-header">Guides</div>
                    ${sidebarItems}
                </div>
                <div class="help-content" id="helpContent-${windowId}">
                    <div class="help-placeholder">Select a guide from the sidebar.</div>
                </div>
            </div>
        `;
    }

    _selectGuide(windowId, guideId) {
        const container = document.querySelector(`.help-container[data-window-id="${windowId}"]`);
        if (!container) return;

        // Highlight sidebar
        container.querySelectorAll('.help-sidebar-item').forEach(el => {
            el.classList.toggle('active', el.dataset.guide === guideId);
        });

        // Render content
        const contentEl = container.querySelector('.help-content');
        const guide = this._getGuides().find(g => g.id === guideId);
        if (guide && contentEl) {
            contentEl.innerHTML = guide.render();
        }

        this.currentGuide = guideId;

        // Bind sidebar clicks (re-bind is fine since we replace content, not sidebar)
        container.querySelectorAll('.help-sidebar-item').forEach(el => {
            el.onclick = () => this._selectGuide(windowId, el.dataset.guide);
        });
    }

    // =========================================================
    // Guide Definitions
    // =========================================================
    _getGuides() {
        return [
            {
                id: 'getting-started',
                title: 'Getting Started',
                icon: 'mdi-rocket-launch',
                render: () => `
                    <h2>Welcome to ElxaOS!</h2>
                    <p>ElxaOS is your own personal computer in the land of <strong>Snakesia</strong>. You can browse the internet, chat with friends, play games, get a job, earn money, and buy things!</p>
                    <p>Here's a suggested order to get set up:</p>
                    <ol>
                        <li><strong>Set up your email</strong> — you'll need it for everything else</li>
                        <li><strong>Open a bank account</strong> — so you have somewhere to keep your money</li>
                        <li><strong>Get a job</strong> — to start earning Snakes (§)</li>
                        <li><strong>Go shopping!</strong> — buy games, clothes, cars, and more</li>
                    </ol>
                    <p>Use the guides in the sidebar to walk through each step. None of them take long, and you can do them in any order — but the order above is recommended since some things need others first.</p>
                    <div class="help-tip">
                        <span class="mdi mdi-lightbulb-outline elxa-icon-ui"></span>
                        <strong>Tip:</strong> You can always reopen Help from <strong>Start → Utilities → Help</strong>.
                    </div>
                `
            },
            {
                id: 'email',
                title: 'Setting Up Email',
                icon: 'mdi-email',
                render: () => `
                    <h2>Setting Up Email</h2>
                    <div class="help-prereq">
                        <span class="mdi mdi-check-circle elxa-icon-ui"></span> <strong>Requires:</strong> Nothing — you can do this right away!
                    </div>
                    <p>Email is the first thing you should set up. You'll need an email address to apply for jobs, and some characters will send you messages!</p>
                    <h3>How to do it:</h3>
                    <ol>
                        <li>Open <strong>Snoogle Browser</strong> (click it in the taskbar or Start menu)</li>
                        <li>Go to <strong>elxamail.ex</strong> (it's in your bookmarks, or type it in the address bar)</li>
                        <li>Click <strong>"Create Account"</strong> and pick a username</li>
                        <li>That's it! You now have an email address</li>
                    </ol>
                    <p>Once you have email, you'll start receiving messages from characters around Snakesia. You can also send emails to them!</p>
                    <div class="help-tip">
                        <span class="mdi mdi-lightbulb-outline elxa-icon-ui"></span>
                        <strong>Tip:</strong> You can access ElxaMail quickly from <strong>Start → ElxaMail</strong>.
                    </div>
                `
            },
            {
                id: 'bank',
                title: 'Opening a Bank Account',
                icon: 'mdi-bank',
                render: () => `
                    <h2>Opening a Bank Account</h2>
                    <div class="help-prereq">
                        <span class="mdi mdi-check-circle elxa-icon-ui"></span> <strong>Requires:</strong> Nothing — but email is recommended first
                    </div>
                    <p>The <strong>First Snakesian Bank (FSB)</strong> is where you manage your money. You'll need a bank account to receive paychecks and buy things.</p>
                    <h3>How to do it:</h3>
                    <ol>
                        <li>Open <strong>Snoogle Browser</strong></li>
                        <li>Go to <strong>fsb.ex</strong> (it's in your bookmarks)</li>
                        <li>Click <strong>"Open Account"</strong></li>
                        <li>You'll start with an empty account — time to get a job!</li>
                    </ol>
                    <p>Your bank account lets you check your balance, view transactions, and manage your money. You can also deposit or withdraw funds manually.</p>
                    <div class="help-tip">
                        <span class="mdi mdi-lightbulb-outline elxa-icon-ui"></span>
                        <strong>Tip:</strong> Access the bank anytime from <strong>Start → First Snakesian Bank</strong>.
                    </div>
                `
            },
            {
                id: 'job',
                title: 'Getting a Job',
                icon: 'mdi-badge-account',
                render: () => `
                    <h2>Getting a Job</h2>
                    <div class="help-prereq">
                        <span class="mdi mdi-alert-circle-outline elxa-icon-ui"></span> <strong>Requires:</strong> Email account + Bank account
                    </div>
                    <p>Want to earn some Snakes (§)? You'll need a job! Snake-E Corp is always hiring.</p>
                    <h3>How to do it:</h3>
                    <ol>
                        <li>Open <strong>Snoogle Browser</strong></li>
                        <li>Go to <strong>snake-e.corp.ex</strong> (or find it in your bookmarks)</li>
                        <li>Click <strong>"Careers"</strong> or <strong>"Apply Now"</strong></li>
                        <li>Fill out the application — you'll need your email address</li>
                        <li>Once hired, you'll receive paychecks automatically!</li>
                    </ol>
                    <p>Your paychecks will be deposited into your bank account. The more you work, the more you earn. You might even get promoted!</p>
                    <div class="help-tip">
                        <span class="mdi mdi-lightbulb-outline elxa-icon-ui"></span>
                        <strong>Tip:</strong> Check your <strong>Employee Portal</strong> from the Start menu to see your job status and pay.
                    </div>
                `
            },
            {
                id: 'shopping',
                title: 'Shopping & Buying Things',
                icon: 'mdi-cart',
                render: () => `
                    <h2>Shopping & Buying Things</h2>
                    <div class="help-prereq">
                        <span class="mdi mdi-alert-circle-outline elxa-icon-ui"></span> <strong>Requires:</strong> Bank account with money
                    </div>
                    <p>Once you have some Snakes (§) in your bank account, you can go shopping! There are several stores on the Snakesian internet:</p>
                    <ul>
                        <li><strong>ElxaTech</strong> (elxatech.ex) — phones, laptops, tablets, and gadgets</li>
                        <li><strong>FashionCo</strong> (fashionco.ex) — clothes and accessories</li>
                        <li><strong>Squiggly</strong> (squiggly.ex) — toys and novelties</li>
                        <li><strong>Pato & Sons Auto</strong> (pato-auto.ex) — cars and vehicles</li>
                        <li><strong>Mallard Realty</strong> (mallard.ex) — houses and properties</li>
                        <li><strong>Snakesian Card Exchange</strong> (snakesian-cards.ex) — collectible cards</li>
                    </ul>
                    <p>Just browse to any store, pick what you want, and buy it. The cost is deducted from your bank account.</p>
                    <div class="help-tip">
                        <span class="mdi mdi-lightbulb-outline elxa-icon-ui"></span>
                        <strong>Tip:</strong> You can check what you own in <strong>ElxaBooks Pro</strong> (Start → Programs).
                    </div>
                `
            },
            {
                id: 'games',
                title: 'Installing Games',
                icon: 'mdi-gamepad-variant',
                render: () => `
                    <h2>Installing Games</h2>
                    <div class="help-prereq">
                        <span class="mdi mdi-check-circle elxa-icon-ui"></span> <strong>Requires:</strong> Nothing — games are free to install!
                    </div>
                    <p>ElxaOS comes with a game store called <strong>Sssteam</strong> where you can download and install games.</p>
                    <h3>How to do it:</h3>
                    <ol>
                        <li>Open <strong>Snoogle Browser</strong></li>
                        <li>Go to <strong>sssteam.ex</strong></li>
                        <li>Browse the game library and click <strong>"Install"</strong> on any game you want</li>
                        <li>Once installed, find your games in <strong>Start → Games</strong></li>
                    </ol>
                    <p>Available games include Snake Deluxe, Sussy Cat Adventure, Mail Room Mayhem, Chess, Quacker Pond, and more!</p>
                    <div class="help-tip">
                        <span class="mdi mdi-lightbulb-outline elxa-icon-ui"></span>
                        <strong>Tip:</strong> You can also find game installers (.abby files) in the File Manager and double-click them to install.
                    </div>
                `
            },
            {
                id: 'other',
                title: 'Other Cool Stuff',
                icon: 'mdi-star',
                render: () => `
                    <h2>Other Cool Stuff</h2>
                    <p>There's a lot more to explore in ElxaOS! Here are some highlights:</p>
                    <h3><span class="mdi mdi-chat elxa-icon-ui"></span> Messenger</h3>
                    <p>Chat with Snakesian characters like Remi, Rita, Mr. &amp; Mrs. Snake-e, and Pushing Cat. Find it in <strong>Start → Messenger</strong>.</p>
                    <h3><span class="mdi mdi-virus elxa-icon-ui"></span> Virus Lab</h3>
                    <p>Create silly viruses and release them on your own system (don't worry, ElxaGuard Antivirus can clean them up). Find it in <strong>Start → Utilities → Virus Lab</strong>.</p>
                    <h3><span class="mdi mdi-web elxa-icon-ui"></span> The Snakesian Internet</h3>
                    <p>There are tons of websites to explore — a museum, an aquarium, personal Xeocities pages, Snakebook (social media), Dissscord, a weather site, Snoogle-Pedia, and more. Try typing random .ex addresses in the browser!</p>
                    <h3><span class="mdi mdi-chart-line elxa-icon-ui"></span> Stock Market</h3>
                    <p>Check out <strong>Scale Street</strong> (scalestreet.ex) to track and invest in Snakesian stocks.</p>
                    <h3><span class="mdi mdi-palette elxa-icon-ui"></span> Personalization</h3>
                    <p>Right-click the desktop or go to <strong>Start → Personalize</strong> to change your theme and wallpaper. There are lots of options!</p>
                `
            }
        ];
    }
}
