// js/app.js
// ============================================
// MAIN APPLICATION
// ============================================

const App = {
    /**
     * Initialize the application
     */
    async init() {
        console.log('Initializing HR System...');
        
        // Setup event listeners
        this.setupEventListeners();
        
        // Initialize router
        Router.init();
        
        // Check API connection (using JSONP)
        await this.checkAPIConnection();
        
        // Setup sidebar collapsible sections
        this.setupSidebarSections();
        
        console.log('HR System initialized');
    },
    
    /**
     * Setup global event listeners
     */
    setupEventListeners() {
        // Mobile menu toggle
        const mobileToggle = document.getElementById('mobileMenuToggle');
        const sidebar = document.getElementById('sidebar');
        const sidebarClose = document.getElementById('sidebarClose');
        
        if (mobileToggle) {
            mobileToggle.addEventListener('click', () => {
                sidebar.classList.toggle('mobile-open');
            });
        }
        
        if (sidebarClose) {
            sidebarClose.addEventListener('click', () => {
                sidebar.classList.remove('mobile-open');
            });
        }
        
        // Close sidebar on link click (mobile)
        document.querySelectorAll('.nav-item').forEach(link => {
            link.addEventListener('click', () => {
                if (window.innerWidth <= 768) {
                    sidebar.classList.remove('mobile-open');
                }
            });
        });
        
        // Close modal on escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                const modals = document.querySelectorAll('.modal.active');
                modals.forEach(modal => {
                    modal.classList.remove('active');
                });
            }
        });
    },
    
    /**
     * Check API connection status using JSONP
     */
    async checkAPIConnection() {
        const statusEl = document.getElementById('apiStatus');
        if (!statusEl) return;
        
        const isOnline = await API.testConnection();
        
        if (isOnline) {
            statusEl.className = 'api-status online';
            statusEl.querySelector('span').textContent = 'Connected';
            statusEl.querySelector('i').style.color = '#22c55e';
        } else {
            statusEl.className = 'api-status offline';
            statusEl.querySelector('span').textContent = 'Offline - Check URL';
            statusEl.querySelector('i').style.color = '#ef4444';
            console.warn('API is offline. Please check your Apps Script deployment URL in config.js');
        }
        
        // Check periodically
        setInterval(async () => {
            const online = await API.testConnection();
            if (online) {
                statusEl.className = 'api-status online';
                statusEl.querySelector('span').textContent = 'Connected';
                statusEl.querySelector('i').style.color = '#22c55e';
            } else {
                statusEl.className = 'api-status offline';
                statusEl.querySelector('span').textContent = 'Offline';
                statusEl.querySelector('i').style.color = '#ef4444';
            }
        }, 60000);
    },
    
    /**
     * Setup sidebar collapsible sections
     */
    setupSidebarSections() {
        const sections = document.querySelectorAll('.nav-section');
        sections.forEach(section => {
            const title = section.querySelector('.nav-section-title');
            if (title) {
                title.addEventListener('click', () => {
                    section.classList.toggle('collapsed');
                    // Save state to localStorage
                    const sectionTitle = title.querySelector('span')?.textContent || '';
                    const isCollapsed = section.classList.contains('collapsed');
                    localStorage.setItem(`sidebar_${sectionTitle}`, isCollapsed);
                });
                
                // Restore saved state
                const sectionTitle = title.querySelector('span')?.textContent || '';
                const savedState = localStorage.getItem(`sidebar_${sectionTitle}`);
                if (savedState === 'true') {
                    section.classList.add('collapsed');
                }
            }
        });
    }
};

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    App.init();
});
