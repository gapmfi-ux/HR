// app.js
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
        
        // Check API connection
        this.checkAPIConnection();
        
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
        
        // Handle clicks outside modal
        window.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal')) {
                e.target.classList.remove('active');
            }
        });
    },
    
    /**
     * Check API connection status
     */
    async checkAPIConnection() {
        const statusEl = document.getElementById('apiStatus');
        if (!statusEl) return;
        
        const isOnline = await API.checkHealth();
        statusEl.className = `api-status ${isOnline ? 'online' : 'offline'}`;
        statusEl.querySelector('span').textContent = isOnline ? 'Connected' : 'Offline';
        
        if (!isOnline) {
            console.warn('API is offline. Please check your connection and Apps Script deployment.');
            Utils.showToast('Cannot connect to server. Please check your network.', 'error');
        }
        
        // Check periodically
        setInterval(async () => {
            const online = await API.checkHealth();
            statusEl.className = `api-status ${online ? 'online' : 'offline'}`;
            statusEl.querySelector('span').textContent = online ? 'Connected' : 'Offline';
        }, 30000);
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
    },
    
    /**
     * Show modal
     */
    showModal(content, title = 'Modal') {
        const modalContainer = document.getElementById('modalContainer');
        if (!modalContainer) return;
        
        modalContainer.innerHTML = `
            <div class="modal active">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3>${Utils.escapeHtml(title)}</h3>
                        <button class="modal-close">&times;</button>
                    </div>
                    <div class="modal-body">
                        ${content}
                    </div>
                </div>
            </div>
        `;
        
        const modal = modalContainer.querySelector('.modal');
        const closeBtn = modal.querySelector('.modal-close');
        
        closeBtn.onclick = () => {
            modal.classList.remove('active');
            setTimeout(() => modal.remove(), 300);
        };
    },
    
    /**
     * Close all modals
     */
    closeModals() {
        const modals = document.querySelectorAll('.modal.active');
        modals.forEach(modal => {
            modal.classList.remove('active');
        });
    }
};

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    App.init();
});
