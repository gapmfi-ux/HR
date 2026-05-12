// js/app.js
const App = {
    init: function() {
        this.setupEventListeners();
        this.initSidebarState();
        Router.init();
        this.checkAPI();
    },
    
    setupEventListeners: function() {
        const mobileToggle = document.getElementById('mobileMenuToggle');
        const sidebar = document.getElementById('sidebar');
        const sidebarClose = document.getElementById('sidebarClose');
        
        // Mobile menu toggle
        if(mobileToggle) {
            mobileToggle.onclick = () => sidebar.classList.toggle('mobile-open');
        }
        
        if(sidebarClose) {
            sidebarClose.onclick = () => sidebar.classList.remove('mobile-open');
        }
        
        // Setup section toggle on title click only
        document.querySelectorAll('.nav-section-title').forEach(title => {
            title.onclick = (e) => {
                e.stopPropagation(); // Prevent event bubbling
                const section = title.closest('.nav-section');
                if(!section) return;
                
                // Toggle collapsed class
                section.classList.toggle('collapsed');
                
                // Save state to localStorage
                this.saveSectionState(section);
            };
        });
        
        // Close mobile sidebar when nav item is clicked
        document.querySelectorAll('.nav-item').forEach(link => {
            link.onclick = () => {
                if(window.innerWidth <= 768) {
                    sidebar.classList.remove('mobile-open');
                }
            };
        });
    },
    
    /**
     * Initialize sidebar state - ALL SECTIONS COLLAPSED by default
     */
    initSidebarState: function() {
        const sections = document.querySelectorAll('.nav-section');
        
        sections.forEach(section => {
            const sectionName = section.dataset.section;
            if(!sectionName) return;
            
            // Check if user has a saved preference
            const savedState = localStorage.getItem(`sidebar_${sectionName}`);
            
            if(savedState === null) {
                // No saved preference - default to COLLAPSED
                section.classList.add('collapsed');
            } else if(savedState === 'true') {
                // User had it collapsed
                section.classList.add('collapsed');
            } else if(savedState === 'false') {
                // User had it expanded
                section.classList.remove('collapsed');
            }
        });
    },
    
    /**
     * Save individual section state to localStorage
     */
    saveSectionState: function(section) {
        const sectionName = section.dataset.section;
        if(!sectionName) return;
        
        const isCollapsed = section.classList.contains('collapsed');
        // Save as string 'true' or 'false'
        localStorage.setItem(`sidebar_${sectionName}`, String(isCollapsed));
    },
    
    /**
     * Check API connection status
     */
    checkAPI: async function() {
        const statusEl = document.getElementById('apiStatus');
        if(!statusEl) return;
        
        const updateStatus = async () => {
            const online = await API.testConnection();
            statusEl.className = `api-status ${online ? 'online' : 'offline'}`;
            statusEl.querySelector('span').textContent = online ? 'Connected' : 'Offline';
        };
        
        // Initial check
        await updateStatus();
        
        // Check every 60 seconds
        setInterval(updateStatus, 60000);
    }
};

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => App.init());
