// router.js
const Router = {
    currentPage: 'dashboard',
    currentParams: {},
    
    // Route definitions
    routes: {
        'dashboard': {
            title: 'Dashboard',
            html: 'pages/dashboard.html',
            css: ['css/dashboard.css'],
            js: ['js/dashboard.js']
        },
        // Employee routes
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
        },
        // Placeholder routes for other modules
        'payroll-process': { title: 'Process Payroll', html: 'pages/payroll/process.html' },
        'payroll-register': { title: 'Payroll Register', html: 'pages/payroll/register.html' },
        'payslip': { title: 'Generate Payslip', html: 'pages/payroll/payslip.html' },
        'appraisal-new': { title: 'New Appraisal', html: 'pages/appraisal/new.html' },
        'appraisal-history': { title: 'Appraisal History', html: 'pages/appraisal/history.html' },
        'leave-apply': { title: 'Apply for Leave', html: 'pages/leave/apply.html' },
        'leave-balance': { title: 'Leave Balance', html: 'pages/leave/balance.html' },
        'leave-history': { title: 'Leave History', html: 'pages/leave/history.html' },
        'grievance-new': { title: 'File Grievance', html: 'pages/grievance/new.html' },
        'grievance-view': { title: 'View Grievances', html: 'pages/grievance/view.html' }
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
        
        // Load initial page
        const initialPage = window.location.hash.replace('#', '') || 'dashboard';
        this.navigate(initialPage);
    },
    
    /**
     * Navigate to a page
     */
    navigate(page, params = {}) {
        if (this.routes[page]) {
            this.currentPage = page;
            this.currentParams = params;
            
            // Update URL
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
        
        // Show loader
        Utils.showLoading();
        
        try {
            // Load HTML
            const htmlResponse = await fetch(route.html);
            const html = await htmlResponse.text();
            contentArea.innerHTML = html;
            
            // Load CSS files
            if (route.css) {
                for (const cssFile of route.css) {
                    await this.loadCSS(cssFile);
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
            
            // If there's a module with init function, call it
            const moduleName = this.getModuleName(page);
            if (window[moduleName] && typeof window[moduleName].init === 'function') {
                window[moduleName].init(params);
            }
            
        } catch (error) {
            console.error('Error loading page:', error);
            contentArea.innerHTML = `
                <div class="alert alert-danger">
                    <i class="fas fa-exclamation-circle"></i>
                    <span>Failed to load page. Please try again.</span>
                </div>
            `;
        } finally {
            Utils.hideLoading();
        }
    },
    
    /**
     * Load CSS dynamically
     */
    loadCSS(href) {
        return new Promise((resolve) => {
            const link = document.querySelector(`link[href="${href}"]`);
            if (link) {
                resolve();
                return;
            }
            
            const newLink = document.createElement('link');
            newLink.rel = 'stylesheet';
            newLink.href = href;
            newLink.onload = () => resolve();
            newLink.onerror = () => resolve();
            document.head.appendChild(newLink);
        });
    },
    
    /**
     * Load JavaScript dynamically
     */
    loadScript(src) {
        return new Promise((resolve) => {
            const script = document.querySelector(`script[src="${src}"]`);
            if (script) {
                resolve();
                return;
            }
            
            const newScript = document.createElement('script');
            newScript.src = src;
            newScript.onload = () => resolve();
            newScript.onerror = () => resolve();
            document.body.appendChild(newScript);
        });
    },
    
    /**
     * Get module name from page
     */
    getModuleName(page) {
        const parts = page.split('-');
        if (parts[0] === 'employee') return 'Employee';
        if (parts[0] === 'payroll') return 'Payroll';
        if (parts[0] === 'appraisal') return 'Appraisal';
        if (parts[0] === 'leave') return 'Leave';
        if (parts[0] === 'grievance') return 'Grievance';
        return 'Dashboard';
    }
};
