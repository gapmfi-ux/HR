const App = {
    init: function() {
        this.setupEventListeners();
        this.loadSidebarState();
        Router.init();
        this.checkAPI();
    },
    
    setupEventListeners: function() {
        const mobileToggle = document.getElementById('mobileMenuToggle');
        const sidebar = document.getElementById('sidebar');
        const sidebarClose = document.getElementById('sidebarClose');
        
        if(mobileToggle) mobileToggle.onclick = () => sidebar.classList.toggle('mobile-open');
        if(sidebarClose) sidebarClose.onclick = () => sidebar.classList.remove('mobile-open');
        
        document.querySelectorAll('.nav-section-title').forEach(title => {
            title.onclick = (e) => {
                e.stopPropagation();
                const section = title.closest('.nav-section');
                section.classList.toggle('collapsed');
                this.saveSidebarState();
            };
        });
        
        document.querySelectorAll('.nav-item').forEach(link => {
            link.onclick = () => window.innerWidth <= 768 && sidebar.classList.remove('mobile-open');
        });
    },
    
    loadSidebarState: function() {
        document.querySelectorAll('.nav-section').forEach(section => {
            const sectionName = section.dataset.section;
            const isCollapsed = localStorage.getItem(`sidebar_${sectionName}`);
            if(isCollapsed === 'true') section.classList.add('collapsed');
        });
    },
    
    saveSidebarState: function() {
        document.querySelectorAll('.nav-section').forEach(section => {
            const sectionName = section.dataset.section;
            if(sectionName) localStorage.setItem(`sidebar_${sectionName}`, section.classList.contains('collapsed'));
        });
    },
    
    checkAPI: async function() {
        const statusEl = document.getElementById('apiStatus');
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

document.addEventListener('DOMContentLoaded', () => App.init());


