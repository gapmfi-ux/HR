// js/app.js
const App = {
    init: function() {
        this.setupEventListeners();
        this.initSidebarState();  // Initialize sidebar to collapsed
        Router.init();
        this.checkAPI();
    },
    
    setupEventListeners: function() {
        const mobileToggle = document.getElementById('mobileMenuToggle');
        const sidebar = document.getElementById('sidebar');
        const sidebarClose = document.getElementById('sidebarClose');
        
        if(mobileToggle) mobileToggle.onclick = () => sidebar.classList.toggle('mobile-open');
        if(sidebarClose) sidebarClose.onclick = () => sidebar.classList.remove('mobile-open');
        
        // Setup section toggle on arrow click only
        document.querySelectorAll('.nav-section-title').forEach(title => {
            title.onclick = (e) => {
                e.stopPropagation();
                const section = title.closest('.nav-section');
                // Toggle collapsed class
                section.classList.toggle('collapsed');
                // Save state to localStorage
                this.saveSectionState(section);
            };
        });
        
        // Close mobile sidebar on nav click
        document.querySelectorAll('.nav-item').forEach(link => {
            link.onclick = () => {
                if(window.innerWidth <= 768) sidebar.classList.remove('mobile-open');
            };
        });
    },
    
    // Initialize sidebar - ALL SECTIONS COLLAPSED by default
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
            } else {
                // User had it expanded
                section.classList.remove('collapsed');
            }
        });
    },
    
    // Save individual section state
    saveSectionState: function(section) {
        const sectionName = section.dataset.section;
        if(sectionName) {
            const isCollapsed = section.classList.contains('collapsed');
            localStorage.setItem(`sidebar_${sectionName}`, isCollapsed);
        }
    },
    
    checkAPI: async function() {
        const statusEl = document.getElementById('apiStatus');
        if(!statusEl) return;
        
        const online = await API.testConnection();
        statusEl.className = `api-status ${online ? 'online' : 'offline'}`;
        statusEl.querySelector('span').textContent = online ? 'Connected' : 'Offline';
        
        setInterval(async () => {
            const online = await API.testConnection();
            statusEl.className = `api-status ${online ? 'online' : 'offline'}`;
            statusEl.querySelector('span').textContent = online ? 'Connected' : 'Offline';
        }, 60000);
    }
};

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => App.init());
