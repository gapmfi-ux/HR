// js/router.js
const Router = {
    currentPage: 'dashboard',
    currentParams: {},
    loadedScripts: new Set(),
    loadedStyles: new Set(),
    
    routes: {
        'dashboard': {
            title: 'Dashboard',
            html: 'pages/dashboard.html',
            css: ['css/dashboard.css'],
            js: ['js/dashboard.js']
        },
        'employee-list': {
            title: 'Employee List',
            html: 'pages/employee/list.html',
            css: ['css/employee/employee-list.css'],
            js: ['js/employee/employee-list.js']
        },
        'employee-add': {
            title: 'Add Employee',
            html: 'pages/employee/add.html',
            css: ['css/employee/employee-form.css'],
            js: ['js/employee/employee-form.js']
        },
        'employee-edit': {
            title: 'Edit Employee',
            html: 'pages/employee/edit.html',
            css: ['css/employee/employee-form.css'],
            js: ['js/employee/employee-form.js']
        },
        'employee-view': {
            title: 'Employee Details',
            html: 'pages/employee/view.html',
            css: ['css/employee/employee-view.css'],
            js: ['js/employee/employee-view.js']
        },
        'employee-documents': {
            title: 'Employee Documents',
            html: 'pages/employee/documents.html',
            css: ['css/employee/employee-documents.css'],
            js: ['js/employee/employee-documents.js']
        }
    },
    
    /**
     * Initialize router
     */
    init() {
        // Handle navigation clicks
        document.querySelectorAll('[data-page]').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const page = link.dataset.page;
                if (page) {
                    this.navigate(page);
                }
            });
        });
        
        // Handle browser back/forward
        window.addEventListener('popstate', (e) => {
            const page = e.state?.page || 'dashboard';
            this.loadPage(page, e.state?.params || {});
        });
        
        // Load initial page from hash or default
        let initialPage = window.location.hash.replace('#', '');
        if (!initialPage || !this.routes[initialPage]) {
            initialPage = 'dashboard';
        }
        this.navigate(initialPage);
    },
    
    /**
     * Navigate to a page
     */
    navigate(page, params = {}) {
        if (this.routes[page]) {
            this.currentPage = page;
            this.currentParams = params;
            
            // Update URL without causing reload
            window.history.pushState({ page, params }, '', `#${page}`);
            
            // Update page title
            const titleEl = document.getElementById('pageTitle');
            if (titleEl) {
                titleEl.textContent = this.routes[page].title;
            }
            
            // Update active nav item
            document.querySelectorAll('.nav-item').forEach(item => {
                if (item.dataset.page === page) {
                    item.classList.add('active');
                } else {
                    item.classList.remove('active');
                }
            });
            
            // Load the page
            this.loadPage(page, params);
        } else {
            console.error(`Route not found: ${page}`);
            this.navigate('dashboard');
        }
    },
    
    /**
     * Load page HTML and assets
     */
    async loadPage(page, params = {}) {
        const route = this.routes[page];
        if (!route) return;
        
        const contentArea = document.getElementById('pageContent');
        if (!contentArea) return;
        
        try {
            // Show loader
            const loader = document.getElementById('loader');
            if (loader) loader.style.display = 'flex';
            
            // Load HTML
            const htmlResponse = await fetch(route.html);
            if (!htmlResponse.ok) {
                throw new Error(`Failed to load ${route.html}: ${htmlResponse.status} ${htmlResponse.statusText}`);
            }
            const html = await htmlResponse.text();
            contentArea.innerHTML = html;
            
            // Load CSS files (don't await, they load async)
            if (route.css) {
                for (const cssFile of route.css) {
                    this.loadCSS(cssFile);
                }
            }
            
            // Load JS files
            if (route.js) {
                for (const jsFile of route.js) {
                    await this.loadScript(jsFile);
                }
            }
            
            // Dispatch page loaded event
            const event = new CustomEvent('pageLoaded', { 
                detail: { page, params } 
            });
            document.dispatchEvent(event);
            
            // Initialize module if available
            const moduleName = this.getModuleName(page);
            if (window[moduleName] && typeof window[moduleName].init === 'function') {
                window[moduleName].init(params);
            }
            
        } catch (error) {
            console.error('Error loading page:', error);
            contentArea.innerHTML = `
                <div class="alert alert-danger">
                    <i class="fas fa-exclamation-circle"></i>
                    <span>Failed to load page: ${error.message}. Please refresh and try again.</span>
                </div>
            `;
            if (Utils) Utils.showToast('Failed to load page: ' + error.message, 'error');
        } finally {
            const loader = document.getElementById('loader');
            if (loader) loader.style.display = 'none';
        }
    },
    
    /**
     * Load CSS dynamically
     */
    loadCSS(href) {
        if (this.loadedStyles.has(href)) return;
        
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = href;
        link.onload = () => {
            this.loadedStyles.add(href);
            console.log(`CSS loaded: ${href}`);
        };
        link.onerror = () => {
            console.warn(`Failed to load CSS: ${href}`);
        };
        document.head.appendChild(link);
    },
    
    /**
     * Load JavaScript dynamically
     */
    loadScript(src) {
        return new Promise((resolve, reject) => {
            if (this.loadedScripts.has(src)) {
                resolve();
                return;
            }
            
            const script = document.createElement('script');
            script.src = src;
            script.onload = () => {
                this.loadedScripts.add(src);
                console.log(`Script loaded: ${src}`);
                resolve();
            };
            script.onerror = () => {
                console.warn(`Failed to load script: ${src}`);
                reject(new Error(`Failed to load ${src}`));
            };
            document.body.appendChild(script);
        });
    },
    
    /**
     * Get module name from page
     */
    getModuleName(page) {
        const parts = page.split('-');
        if (parts[0] === 'employee') {
            if (parts[1] === 'list') return 'EmployeeList';
            if (parts[1] === 'add') return 'Employee';
            if (parts[1] === 'edit') return 'Employee';
            if (parts[1] === 'view') return 'EmployeeView';
            if (parts[1] === 'documents') return 'EmployeeDocuments';
        }
        return null;
    }
};
