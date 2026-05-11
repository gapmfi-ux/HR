// js/dashboard.js
// ============================================
// DASHBOARD MODULE
// ============================================

const Dashboard = {
    // Cache DOM elements
    elements: {},
    
    // Timer for auto-refresh
    refreshTimer: null,
    
    // Refresh interval (5 minutes)
    REFRESH_INTERVAL: 5 * 60 * 1000,
    
    /**
     * Initialize dashboard
     */
    init: async function(params = {}) {
        console.log('Dashboard initializing...');
        
        // Cache elements
        this.cacheElements();
        
        // Load dashboard data
        await this.loadStats();
        await this.loadRecentEmployees();
        await this.loadUpcomingLeave();
        this.renderQuickActions();
        
        // Set up auto-refresh
        this.setupAutoRefresh();
        
        console.log('Dashboard initialized');
    },
    
    /**
     * Cache DOM elements
     */
    cacheElements: function() {
        this.elements = {
            totalEmployees: document.getElementById('totalEmployees'),
            activeEmployees: document.getElementById('activeEmployees'),
            totalDepartments: document.getElementById('totalDepartments'),
            pendingLeaves: document.getElementById('pendingLeaves'),
            recentEmployeesTable: document.getElementById('recentEmployeesTable'),
            upcomingLeaveList: document.getElementById('upcomingLeaveList')
        };
    },
    
    /**
     * Load dashboard statistics
     */
    loadStats: async function() {
        try {
            // Show loading state
            this.setLoadingState();
            
            // Fetch employees
            const employees = await API.getEmployeeList();
            
            // Calculate stats
            const total = employees.length;
            const active = employees.filter(e => e.status === 'Active' || e.status === 'active').length;
            const departments = [...new Set(employees.map(e => e.department).filter(d => d))].length;
            
            // Update UI
            this.updateStatNumber('totalEmployees', total);
            this.updateStatNumber('activeEmployees', active);
            this.updateStatNumber('totalDepartments', departments);
            
            // Try to load pending leaves (if leave module exists)
            try {
                const leaves = await API.getLeaveRequests();
                const pending = leaves.filter(l => l.status === 'Pending').length;
                this.updateStatNumber('pendingLeaves', pending);
            } catch (e) {
                this.updateStatNumber('pendingLeaves', '--');
                console.log('Leave module not available yet');
            }
            
        } catch (error) {
            console.error('Error loading dashboard stats:', error);
            this.showError('Failed to load statistics');
        }
    },
    
    /**
     * Update stat number with animation
     */
    updateStatNumber: function(elementId, newValue) {
        const element = this.elements[elementId];
        if (!element) return;
        
        const oldValue = parseInt(element.textContent);
        if (isNaN(oldValue)) {
            element.textContent = newValue;
            return;
        }
        
        // Animate number change
        this.animateNumber(element, oldValue, newValue);
    },
    
    /**
     * Animate number counting
     */
    animateNumber: function(element, start, end, duration = 500) {
        if (start === end) return;
        
        const range = end - start;
        const increment = range / (duration / 16);
        let current = start;
        
        const timer = setInterval(() => {
            current += increment;
            if ((increment > 0 && current >= end) || (increment < 0 && current <= end)) {
                element.textContent = end;
                clearInterval(timer);
            } else {
                element.textContent = Math.round(current);
            }
        }, 16);
    },
    
    /**
     * Load recent employees
     */
    loadRecentEmployees: async function() {
        const container = this.elements.recentEmployeesTable;
        if (!container) return;
        
        try {
            const employees = await API.getEmployeeList();
            const recent = employees.slice(0, 5);
            
            if (!recent || recent.length === 0) {
                container.innerHTML = `
                    <div class="empty-state-small">
                        <i class="fas fa-users-slash"></i>
                        <p>No employees found</p>
                    </div>
                `;
                return;
            }
            
            const html = `
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Employee #</th>
                            <th>Name</th>
                            <th>Department</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${recent.map(emp => `
                            <tr onclick="Router.navigate('employee-view', { id: '${Utils.escapeHtml(emp.employeeNumber)}' })">
                                <td><strong>${Utils.escapeHtml(emp.employeeNumber)}</strong></td>
                                <td>${Utils.escapeHtml(emp.name)}</td>
                                <td>${Utils.escapeHtml(emp.department || 'N/A')}</td>
                                <td><span class="status-badge ${emp.status === 'Active' ? 'status-active' : 'status-inactive'}">${emp.status || 'Active'}</span></td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            `;
            
            container.innerHTML = html;
            
        } catch (error) {
            console.error('Error loading recent employees:', error);
            container.innerHTML = `
                <div class="empty-state-small">
                    <i class="fas fa-exclamation-circle"></i>
                    <p>Failed to load employees</p>
                </div>
            `;
        }
    },
    
    /**
     * Load upcoming leave requests
     */
    loadUpcomingLeave: async function() {
        const container = this.elements.upcomingLeaveList;
        if (!container) return;
        
        try {
            // Try to fetch leave requests
            let leaves = [];
            try {
                leaves = await API.getLeaveRequests();
                // Filter for pending and upcoming
                leaves = leaves.filter(l => 
                    l.status === 'Pending' && 
                    new Date(l.startDate) > new Date()
                ).slice(0, 5);
            } catch (e) {
                console.log('Leave module not available');
            }
            
            if (!leaves || leaves.length === 0) {
                container.innerHTML = `
                    <div class="empty-state-small">
                        <i class="fas fa-calendar-check"></i>
                        <p>No pending leave requests</p>
                    </div>
                `;
                return;
            }
            
            const html = leaves.map(leave => `
                <div class="leave-item">
                    <div class="leave-info">
                        <div class="leave-employee">${Utils.escapeHtml(leave.employeeName || 'Employee')}</div>
                        <div class="leave-dates">
                            ${Utils.formatDisplayDate(leave.startDate)} - ${Utils.formatDisplayDate(leave.endDate)}
                        </div>
                        <div class="leave-days">${leave.days || 0} days</div>
                    </div>
                    <div class="leave-status ${leave.status?.toLowerCase()}">${leave.status || 'Pending'}</div>
                </div>
            `).join('');
            
            container.innerHTML = html;
            
        } catch (error) {
            console.error('Error loading upcoming leave:', error);
            container.innerHTML = `
                <div class="empty-state-small">
                    <i class="fas fa-calendar-times"></i>
                    <p>No leave data available</p>
                </div>
            `;
        }
    },
    
    /**
     * Render quick action buttons
     */
    renderQuickActions: function() {
        const container = document.getElementById('quickActions');
        if (!container) return;
        
        const actions = [
            { icon: 'fa-user-plus', text: 'Add Employee', page: 'employee-add', color: '#3b82f6' },
            { icon: 'fa-calculator', text: 'Process Payroll', page: 'payroll-process', color: '#10b981' },
            { icon: 'fa-chart-line', text: 'New Appraisal', page: 'appraisal-new', color: '#f59e0b' },
            { icon: 'fa-calendar-plus', text: 'Apply Leave', page: 'leave-apply', color: '#8b5cf6' },
            { icon: 'fa-exclamation-triangle', text: 'File Grievance', page: 'grievance-new', color: '#ef4444' },
            { icon: 'fa-folder-open', text: 'Documents', page: 'employee-documents', color: '#06b6d4' }
        ];
        
        container.innerHTML = actions.map(action => `
            <button class="quick-action-btn" onclick="Router.navigate('${action.page}')" style="border-left: 3px solid ${action.color}">
                <i class="fas ${action.icon}"></i>
                <span>${action.text}</span>
            </button>
        `).join('');
    },
    
    /**
     * Set loading state for stats
     */
    setLoadingState: function() {
        const statIds = ['totalEmployees', 'activeEmployees', 'totalDepartments', 'pendingLeaves'];
        statIds.forEach(id => {
            const el = this.elements[id];
            if (el) el.textContent = '...';
        });
    },
    
    /**
     * Show error message
     */
    showError: function(message) {
        console.error(message);
        if (Utils && Utils.showToast) {
            Utils.showToast(message, 'error');
        }
    },
    
    /**
     * Setup auto-refresh
     */
    setupAutoRefresh: function() {
        if (this.refreshTimer) {
            clearInterval(this.refreshTimer);
        }
        
        this.refreshTimer = setInterval(() => {
            // Only refresh if dashboard is visible
            const dashboardVisible = document.querySelector('.dashboard-container');
            if (dashboardVisible) {
                console.log('Auto-refreshing dashboard...');
                this.loadStats();
                this.loadRecentEmployees();
                this.loadUpcomingLeave();
            }
        }, this.REFRESH_INTERVAL);
    },
    
    /**
     * Clean up on page leave
     */
    destroy: function() {
        if (this.refreshTimer) {
            clearInterval(this.refreshTimer);
            this.refreshTimer = null;
        }
    }
};

// Make Dashboard available globally
window.Dashboard = Dashboard;
