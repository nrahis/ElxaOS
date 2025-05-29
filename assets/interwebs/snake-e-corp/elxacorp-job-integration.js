// =================================
// ELXACORP JOB APPLICATION INTEGRATION SYSTEM
// Handles job applications, user profiles, and email automation
// =================================

class ElxaCorpJobSystem {
    constructor() {
        this.applications = [];
        this.userProfiles = {};
        this.emailIntegration = null;
        
        // Initialize and try to connect to ElxaMail
        this.initializeEmailIntegration();
        this.loadApplicationData();
        
        console.log('🏢 ElxaCorp Job System initialized');
    }

    // ===== EMAIL INTEGRATION =====

    initializeEmailIntegration() {
        // Try to connect to ElxaMail system
        if (typeof elxaMailSystem !== 'undefined') {
            this.emailIntegration = elxaMailSystem;
            console.log('✅ Connected to ElxaMail system');
        } else {
            console.log('⚠️ ElxaMail system not available - emails will be queued');
            this.emailIntegration = null;
        }
    }

    // ===== APPLICATION PROCESSING =====

    async processJobApplication(applicationData) {
        console.log('📝 Processing job application for:', applicationData.name);
        
        // Generate unique application ID
        const applicationId = this.generateApplicationId();
        
        // Create complete application record
        const application = {
            id: applicationId,
            ...applicationData,
            submittedAt: new Date().toISOString(),
            status: 'submitted',
            applicationNumber: this.getNextApplicationNumber()
        };
        
        // Store application
        this.applications.push(application);
        this.saveApplicationData();
        
        // Create user profile
        const userProfile = this.createUserProfile(application);
        this.userProfiles[applicationId] = userProfile;
        this.saveUserProfiles();
        
        // Send confirmation email immediately
        await this.sendApplicationConfirmationEmail(application);
        
        // Schedule hiring email (2-10 seconds delay for realism)
        const hiringDelay = Math.random() * 8000 + 2000;
        setTimeout(() => {
            this.sendHiringEmail(application);
        }, hiringDelay);
        
        console.log(`✅ Application ${applicationId} processed successfully`);
        return application;
    }

    createUserProfile(application) {
        // Generate employee credentials
        const employeeId = this.generateEmployeeId(application.name);
        const username = this.generateUsername(application.name);
        const tempPassword = this.generateTempPassword();
        
        return {
            applicationId: application.id,
            employeeId: employeeId,
            personalInfo: {
                name: application.name,
                age: application.age,
                location: application.location
            },
            position: {
                title: this.getPositionTitle(application.position),
                department: this.getPositionDepartment(application.position),
                startDate: this.calculateStartDate(),
                salary: this.calculateSalary(application.position, application.salary)
            },
            credentials: {
                username: username,
                temporaryPassword: tempPassword,
                mustChangePassword: true
            },
            skills: {
                elxaosExperience: application.elxaos,
                denaliSkills: application.denali,
                susDetection: application.sus,
                additionalSkills: application.skills
            },
            preferences: {
                cookieType: application.cookie,
                favoriteGame: application.gaming,
                motivationStatement: application.why
            },
            status: 'hired',
            hiredAt: new Date().toISOString()
        };
    }

    // ===== EMAIL GENERATION AND SENDING =====

    async sendApplicationConfirmationEmail(application) {
        const email = this.generateConfirmationEmail(application);
        await this.sendEmailToSystem(email);
        console.log(`📧 Confirmation email sent for application ${application.id}`);
    }

    async sendHiringEmail(application) {
        const userProfile = this.userProfiles[application.id];
        const email = this.generateHiringEmail(application, userProfile);
        await this.sendEmailToSystem(email);
        console.log(`🎉 Hiring email sent for application ${application.id}`);
    }

    generateConfirmationEmail(application) {
        const positionTitle = this.getPositionTitle(application.position);
        const applicationNumber = application.applicationNumber;
        
        const subject = `Application Received - ${positionTitle} Position (#${applicationNumber})`;
        
        const body = `Dear ${application.name},

Thank you for your interest in joining the ElxaCorp family!

We have successfully received your application for the ${positionTitle} position. Here are the details we have on file:

APPLICATION DETAILS:
• Application #: ${applicationNumber}
• Position: ${positionTitle}
• Department: ${this.getPositionDepartment(application.position)}
• Submitted: ${new Date(application.submittedAt).toLocaleDateString()}

ABOUT YOUR APPLICATION:
• Location: ${this.getLocationDescription(application.location)}
• ElxaOS Experience: ${this.getExperienceDescription(application.elxaos)}
• Sus Detection Level: ${this.getSusDescription(application.sus)}
${application.cookie ? `• Cookie Preference: ${this.getCookieDescription(application.cookie)} (Mrs. Snake-E is delighted!)` : ''}

Our HR team is currently reviewing your application. Given your qualifications and enthusiasm, we expect to have a decision very soon!

${this.getPositionSpecificMessage(application.position)}

We appreciate your patience during the review process.

Best regards,

ElxaCorp Human Resources Department
Rita Martinez, HR Director
📧 hr@elxacorp.ex | 📞 (555) SNAKE-HR

---
ElxaCorp - "Innovation Through Excellence™"
1 Snake-E Boulevard, Snakesia City, Snakesia`;

        return {
            from: 'hr@elxacorp.ex',
            fromName: 'ElxaCorp HR Department',
            to: this.getUserEmailAddress(),
            subject: subject,
            body: body,
            date: new Date().toISOString(),
            read: false,
            isCorporate: true,
            department: 'elxacorp_hr',
            applicationId: application.id
        };
    }

    generateHiringEmail(application, userProfile) {
        const positionTitle = userProfile.position.title;
        const startDate = new Date(userProfile.position.startDate).toLocaleDateString();
        const salary = userProfile.position.salary;
        
        const subject = `🎉 Welcome to ElxaCorp! You're Hired - ${positionTitle}`;
        
        const body = `Dear ${application.name},

CONGRATULATIONS! 🎉

We are thrilled to offer you the position of ${positionTitle} at ElxaCorp! Your application impressed our entire team, and we believe you'll be a fantastic addition to our innovative family.

POSITION DETAILS:
• Title: ${positionTitle}
• Department: ${userProfile.position.department}
• Employee ID: ${userProfile.employeeId}
• Start Date: ${startDate}
• Salary: ${salary}
• Reports to: ${this.getManagerName(application.position)}

EMPLOYEE PORTAL ACCESS:
Your employee portal credentials are:
• Username: ${userProfile.credentials.username}
• Temporary Password: ${userProfile.credentials.temporaryPassword}
• Portal URL: Access through ElxaCorp website → Employee Portal

IMPORTANT: Please change your password on first login for security.

WHAT TO EXPECT ON YOUR FIRST DAY:
${this.getFirstDayInstructions(application.position)}

SPECIAL NOTES:
${this.getPersonalizedWelcomeMessage(application)}

NEXT STEPS:
1. Log into the Employee Portal using your credentials above
2. Complete your employee onboarding checklist
3. Review your benefits package
4. Report to ${this.getDepartmentLocation(application.position)} on ${startDate}

We're so excited to have you join our team! If you have any questions before your start date, please don't hesitate to reach out.

Welcome to the ElxaCorp family!

Best regards,

Mr. Snake-E
Chief Executive Officer
ElxaCorp

Rita Martinez
HR Director
📧 hr@elxacorp.ex | 📞 (555) SNAKE-HR

---
ElxaCorp - "Innovation Through Excellence™"
"Your journey to innovation starts here!"`;

        return {
            from: 'mr.snake.e@elxacorp.ex',
            fromName: 'Mr. Snake-E & ElxaCorp HR',
            to: this.getUserEmailAddress(),
            subject: subject,
            body: body,
            date: new Date().toISOString(),
            read: false,
            isCorporate: true,
            department: 'elxacorp_ceo',
            applicationId: application.id,
            isHiringEmail: true
        };
    }

    async sendEmailToSystem(emailData) {
        if (this.emailIntegration && this.emailIntegration.isLoggedIn) {
            // Send directly to ElxaMail inbox
            this.emailIntegration.emails.inbox.unshift(emailData);
            this.emailIntegration.saveCurrentUser();
            this.emailIntegration.updateEmailList();
            
            // Show notification if user is viewing inbox
            if (this.emailIntegration.currentFolder === 'inbox') {
                this.emailIntegration.showSuccess(`📧 New message from ${emailData.fromName}!`);
            }
        } else {
            // Queue email for when ElxaMail becomes available
            console.log('📥 Email queued (ElxaMail not available):', emailData.subject);
            this.queueEmail(emailData);
        }
    }

    queueEmail(emailData) {
        // Store queued emails in localStorage for later delivery
        const queuedEmails = JSON.parse(localStorage.getItem('elxacorp-queued-emails') || '[]');
        queuedEmails.push(emailData);
        localStorage.setItem('elxacorp-queued-emails', JSON.stringify(queuedEmails));
    }

    // ===== EMAIL ADDRESS DETECTION =====

    getUserEmailAddress() {
        // Try to get email from logged-in ElxaMail user
        if (this.emailIntegration && this.emailIntegration.isLoggedIn && this.emailIntegration.currentUser) {
            const userEmail = this.emailIntegration.currentUser.email;
            console.log(`📧 Using ElxaMail user email: ${userEmail}`);
            return userEmail;
        }
        
        // Try to get from stored application email if we added it to the form
        if (this.currentApplicationEmail) {
            console.log(`📧 Using application email: ${this.currentApplicationEmail}`);
            return this.currentApplicationEmail;
        }
        
        // Fallback to default ElxaMail address
        console.log('📧 Using default email address');
        return 'user@elxamail.ex';
    }

    setApplicationEmail(email) {
        this.currentApplicationEmail = email;
    }

    // ===== HELPER METHODS FOR EMAIL CONTENT =====

    getPositionTitle(position) {
        const titles = {
            'it': 'IT Specialist',
            'arcade': 'Retro Arcade Technician',
            'assistant-mrs': 'Executive Assistant to Mrs. Snake-E',
            'gaming': 'Gaming Division Specialist',
            'customer': 'Customer Relations Representative',
            'security': 'Sus Security Specialist',
            'denali': 'Denali Maintenance Technician',
            'cookie': 'Cookie Quality Assurance Tester',
            'other': 'Technology Specialist'
        };
        return titles[position] || 'Team Member';
    }

    getPositionDepartment(position) {
        const departments = {
            'it': 'Information Technology',
            'arcade': 'Retro Gaming Division',
            'assistant-mrs': 'Executive Operations',
            'gaming': 'Gaming & Entertainment',
            'customer': 'Customer Relations',
            'security': 'Security & Compliance',
            'denali': 'Fleet & Facilities',
            'cookie': 'Quality Assurance',
            'other': 'Technology Operations'
        };
        return departments[position] || 'General Operations';
    }

    getManagerName(position) {
        const managers = {
            'it': 'Mr. Snake-E (CEO)',
            'arcade': 'Remi Marway (Gaming Division Head)',
            'assistant-mrs': 'Mrs. Snake-E (CIO)',
            'gaming': 'Remi Marway (Gaming Division Head)',
            'customer': 'Rita Martinez (Customer Relations Director)',
            'security': 'Chief Security Officer',
            'denali': 'Facilities Manager',
            'cookie': 'Mrs. Snake-E (Chief Cookie Officer)',
            'other': 'Department Supervisor'
        };
        return managers[position] || 'Department Manager';
    }

    getLocationDescription(location) {
        const descriptions = {
            'snakesia': 'Snakesia (Local hire - excellent!)',
            'tennessee': 'Tennessee (Our friendly neighbor!)',
            'usa': 'United States',
            'international': 'International (visa assistance available)',
            'sus-lair': 'Pushing Cat\'s Sussy Lair (Very sus but we\'ll work with it!)'
        };
        return descriptions[location] || location;
    }

    getExperienceDescription(level) {
        const descriptions = {
            'expert': 'Expert Level (Impressive!)',
            'advanced': 'Advanced User',
            'intermediate': 'Intermediate',
            'beginner': 'Beginner (We love teaching!)',
            'none': 'New to ElxaOS (Perfect opportunity to learn!)'
        };
        return descriptions[level] || level;
    }

    getSusDescription(level) {
        const descriptions = {
            'expert': 'Expert Sus Detective (Pushing Cat approved!)',
            'good': 'Good Sus Awareness',
            'average': 'Average Detection Skills',
            'poor': 'Developing Sus Awareness (Training provided!)',
            'sus': 'Self-Identified Sus Individual (Concerning but honest!)'
        };
        return descriptions[level] || level;
    }

    getCookieDescription(type) {
        const descriptions = {
            'chocolate-chip': 'Chocolate Chip (A classic choice!)',
            'oatmeal': 'Oatmeal Raisin (Mrs. Snake-E\'s personal favorite!)',
            'snickerdoodle': 'Snickerdoodle (Fancy taste!)',
            'sugar': 'Sugar Cookie (Simple perfection!)',
            'all': 'All cookies (The correct answer!)',
            'none': 'Non-cookie person (We respect all dietary choices!)'
        };
        return descriptions[type] || type;
    }

    getPositionSpecificMessage(position) {
        const messages = {
            'it': 'Given the high demand for IT specialists, your position is likely to be approved very quickly!',
            'arcade': 'Remi is personally excited to review your arcade technician application!',
            'assistant-mrs': 'Mrs. Snake-E is looking forward to having garden conversations with you!',
            'gaming': 'The Gaming Division is always looking for passionate team members!',
            'customer': 'Rita speaks highly of candidates who show genuine interest in helping others!',
            'security': 'Our Sus Detection team is eager to meet you!',
            'denali': 'Mr. Snake-E appreciates anyone who understands quality vehicles!',
            'cookie': 'Mrs. Snake-E is already planning your cookie orientation program!'
        };
        return messages[position] || 'We look forward to discussing this opportunity with you!';
    }

    getFirstDayInstructions(position) {
        const instructions = {
            'it': '• Report to IT Department at 9:00 AM\n• Bring your favorite debugging snacks\n• Mr. Snake-E will personally welcome you\n• Your workstation is pre-configured with ElxaOS 11.0',
            'arcade': '• Meet Remi in the Gaming Division at 9:30 AM\n• Tour the arcade room and testing facilities\n• Learn about our retro game preservation mission\n• Get hands-on with classic arcade machines',
            'assistant-mrs': '• Garden tour with Mrs. Snake-E at 8:00 AM\n• Introduction to executive scheduling system\n• Cookie tasting orientation (mandatory!)\n• Meet the executive team',
            'gaming': '• Join Remi for morning Minecraft session\n• Tour the streaming studio\n• Learn about our YouTube content strategy\n• Get access to all gaming development tools',
            'customer': '• Morning coffee with Rita at 8:30 AM\n• Customer service training overview\n• Meet the support team\n• Practice with our helpdesk system',
            'security': '• Sus detection training begins at 9:00 AM\n• Tour security facilities\n• Meet the anti-sus team\n• Learn Pushing Cat containment protocols',
            'denali': '• Vehicle inspection with Mr. Snake-E at 9:00 AM\n• Fleet maintenance overview\n• Denali-specific training program\n• Access to automotive workshop',
            'cookie': '• Early morning baking session with Mrs. Snake-E at 7:00 AM\n• Cookie quality standards training\n• Taste-testing certification program\n• Kitchen safety orientation'
        };
        return instructions[position] || '• Standard new employee orientation at 9:00 AM\n• Department introduction and tour\n• Meet your team and supervisor\n• Complete onboarding checklist';
    }

    getPersonalizedWelcomeMessage(application) {
        const messages = [];
        
        if (application.sus === 'expert') {
            messages.push('• Mr. Snake-E is impressed by your sus detection expertise!');
        }
        
        if (application.cookie === 'all') {
            messages.push('• Mrs. Snake-E says anyone who loves all cookies is "a person of excellent taste!"');
        }
        
        if (application.denali === 'yes') {
            messages.push('• Mr. Snake-E is excited to discuss Denali maintenance techniques with you!');
        }
        
        if (application.gaming) {
            messages.push(`• Remi saw that you enjoy ${application.gaming} and wants to chat about retro gaming!`);
        }
        
        if (application.location === 'snakesia') {
            messages.push('• As a local Snakesian, you already understand our culture and values!');
        }
        
        if (messages.length === 0) {
            messages.push('• Your enthusiasm and qualifications made you stand out from other candidates!');
        }
        
        return messages.join('\n');
    }

    getDepartmentLocation(position) {
        const locations = {
            'it': 'IT Department (3rd Floor, East Wing)',
            'arcade': 'Gaming Division (Basement Level, Arcade Room)',
            'assistant-mrs': 'Executive Suite (5th Floor, Garden Wing)',
            'gaming': 'Gaming Division (2nd Floor, Streaming Studio)',
            'customer': 'Customer Relations (1st Floor, Front Desk)',
            'security': 'Security Office (Sub-basement, Secure Wing)',
            'denali': 'Fleet Garage (Ground Level, Vehicle Bay)',
            'cookie': 'Executive Kitchen (4th Floor, Mrs. Snake-E\'s Wing)'
        };
        return locations[position] || 'Main Reception (1st Floor, Lobby)';
    }

    // ===== USER PROFILE GENERATION =====

    generateApplicationId() {
        return 'APP-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4).toUpperCase();
    }

    generateEmployeeId(name) {
        const initials = name.split(' ').map(n => n[0]).join('').toUpperCase();
        const number = String(Math.floor(Math.random() * 9999) + 1).padStart(4, '0');
        return 'EMP-' + initials + number;
    }

    generateUsername(name) {
        const firstName = name.split(' ')[0].toLowerCase();
        const lastName = name.split(' ').slice(-1)[0].toLowerCase();
        const number = Math.floor(Math.random() * 999) + 1;
        return firstName + '.' + lastName + number;
    }

    generateTempPassword() {
        const words = ['Snake', 'Elxa', 'Corp', 'Tech', 'Code'];
        const word = words[Math.floor(Math.random() * words.length)];
        const number = Math.floor(Math.random() * 999) + 100;
        return word + number;
    }

    calculateStartDate() {
        // Start next Monday
        const today = new Date();
        const nextMonday = new Date(today);
        nextMonday.setDate(today.getDate() + (8 - today.getDay()) % 7);
        return nextMonday.toISOString();
    }

    calculateSalary(position, currency) {
        const baseSalaries = {
            'it': { usd: 75000, snakes: 150000 },
            'arcade': { usd: 55000, snakes: 110000 },
            'assistant-mrs': { usd: 65000, snakes: 130000 },
            'gaming': { usd: 70000, snakes: 140000 },
            'customer': { usd: 45000, snakes: 90000 },
            'security': { usd: 60000, snakes: 120000 },
            'denali': { usd: 50000, snakes: 100000 },
            'cookie': { usd: 40000, snakes: 80000 }
        };
        
        const salary = baseSalaries[position] || { usd: 50000, snakes: 100000 };
        
        if (currency === 'snakes') {
            return `${salary.snakes.toLocaleString()} 🐍 per year`;
        } else if (currency === 'mixed') {
            return `$${(salary.usd / 2).toLocaleString()} + ${salary.snakes / 2} 🐍 per year`;
        } else if (currency === 'cookies') {
            return `$${salary.usd.toLocaleString()} + unlimited 🍪 per year`;
        } else {
            return `$${salary.usd.toLocaleString()} per year`;
        }
    }

    getNextApplicationNumber() {
        return String(this.applications.length + 1).padStart(6, '0');
    }

    // ===== DATA PERSISTENCE =====

    saveApplicationData() {
        try {
            localStorage.setItem('elxacorp-applications', JSON.stringify(this.applications));
            console.log('💾 Applications saved to storage');
        } catch (error) {
            console.error('❌ Failed to save applications:', error);
        }
    }

    loadApplicationData() {
        try {
            const data = localStorage.getItem('elxacorp-applications');
            if (data) {
                this.applications = JSON.parse(data);
                console.log(`📁 Loaded ${this.applications.length} applications from storage`);
            }
        } catch (error) {
            console.error('❌ Failed to load applications:', error);
            this.applications = [];
        }
    }

    saveUserProfiles() {
        try {
            localStorage.setItem('elxacorp-user-profiles', JSON.stringify(this.userProfiles));
            console.log('💾 User profiles saved to storage');
        } catch (error) {
            console.error('❌ Failed to save user profiles:', error);
        }
    }

    loadUserProfiles() {
        try {
            const data = localStorage.getItem('elxacorp-user-profiles');
            if (data) {
                this.userProfiles = JSON.parse(data);
                console.log(`📁 Loaded ${Object.keys(this.userProfiles).length} user profiles from storage`);
            }
        } catch (error) {
            console.error('❌ Failed to load user profiles:', error);
            this.userProfiles = {};
        }
    }

    // ===== PUBLIC API =====

    async submitApplication(formData) {
        return await this.processJobApplication(formData);
    }

    getApplicationById(id) {
        return this.applications.find(app => app.id === id);
    }

    getUserProfileById(id) {
        return this.userProfiles[id];
    }

    getAllApplications() {
        return this.applications;
    }

    getAllUserProfiles() {
        return this.userProfiles;
    }

    // ===== EMAIL QUEUE PROCESSING =====

    processQueuedEmails() {
        if (!this.emailIntegration || !this.emailIntegration.isLoggedIn) return;
        
        try {
            const queuedEmails = JSON.parse(localStorage.getItem('elxacorp-queued-emails') || '[]');
            if (queuedEmails.length > 0) {
                console.log(`📮 Processing ${queuedEmails.length} queued emails`);
                
                queuedEmails.forEach(email => {
                    this.emailIntegration.emails.inbox.unshift(email);
                });
                
                this.emailIntegration.saveCurrentUser();
                this.emailIntegration.updateEmailList();
                
                // Clear queue
                localStorage.removeItem('elxacorp-queued-emails');
                
                this.emailIntegration.showSuccess(`📧 ${queuedEmails.length} queued email(s) delivered!`);
            }
        } catch (error) {
            console.error('❌ Failed to process queued emails:', error);
        }
    }
}

// Create global instance
window.elxaCorpJobSystem = new ElxaCorpJobSystem();

// Enhanced job application handler for the ElxaCorp website
window.handleJobApplication = async function(event) {
    event.preventDefault();
    
    // Collect form data
    const formData = {
        name: document.getElementById('app-name').value.trim(),
        age: parseInt(document.getElementById('app-age').value),
        location: document.getElementById('app-location').value,
        position: document.getElementById('app-position').value,
        salary: document.getElementById('app-salary').value,
        elxaos: document.getElementById('app-elxaos').value,
        denali: document.getElementById('app-denali').value,
        sus: document.getElementById('app-sus').value,
        skills: document.getElementById('app-skills').value.trim(),
        cookie: document.getElementById('app-cookie').value,
        gaming: document.getElementById('app-gaming').value.trim(),
        why: document.getElementById('app-why').value.trim()
    };
    
    try {
        // Process application through job system
        const application = await elxaCorpJobSystem.submitApplication(formData);
        
        // Show success message
        const status = document.getElementById('application-status');
        status.style.display = 'block';
        status.className = 'snakee-status-message snakee-status-success';
        status.innerHTML = `🎉 SUCCESS! Application submitted successfully!<br><br>
            <strong>Application ID:</strong> ${application.id}<br>
            <strong>Application Number:</strong> #${application.applicationNumber}<br><br>
            📧 Check your ElxaMail inbox - you should receive a confirmation email shortly, followed by our hiring decision!<br><br>
            Welcome to the ElxaCorp family, ${formData.name}! 🏢`;
        
        // Clear form
        document.getElementById('jobApplication').reset();
        
        // Auto-hide status after 15 seconds
        setTimeout(() => {
            status.style.display = 'none';
        }, 15000);
        
    } catch (error) {
        console.error('❌ Application submission failed:', error);
        
        const status = document.getElementById('application-status');
        status.style.display = 'block';
        status.className = 'snakee-status-message snakee-status-warning';
        status.innerHTML = `⚠️ There was an issue processing your application. Please try again or contact HR at hr@elxacorp.ex`;
        
        setTimeout(() => {
            status.style.display = 'none';
        }, 8000);
    }
};

// Auto-process queued emails when ElxaMail becomes available
setInterval(() => {
    if (elxaCorpJobSystem.emailIntegration && elxaCorpJobSystem.emailIntegration.isLoggedIn) {
        elxaCorpJobSystem.processQueuedEmails();
    }
}, 5000); // Check every 5 seconds

console.log('🏢 ElxaCorp Job Application Integration System loaded and ready!');

// Export for use in other systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ElxaCorpJobSystem;
}