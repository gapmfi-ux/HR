const Dashboard = {
    init: async function() {
        await this.loadStats();
        await this.loadRecent();
        await this.loadLeave();
        this.renderActions();
    },
    
    loadStats: async function() {
        try {
            const employees = await API.getEmployeeList();
            document.getElementById('totalEmployees').textContent = employees.length;
            document.getElementById('activeEmployees').textContent = employees.filter(e => e.status === 'Active').length;
            document.getElementById('totalDepartments').textContent = [...new Set(employees.map(e => e.department))].length;
            try {
                const leaves = await API.getLeaveRequests();
                document.getElementById('pendingLeaves').textContent = leaves.filter(l => l.status === 'Pending').length;
            } catch(e) { document.getElementById('pendingLeaves').textContent = '--'; }
        } catch(e) { console.error(e); }
    },
    
    loadRecent: async function() {
        const container = document.getElementById('recentTable');
        try {
            const employees = await API.getEmployeeList();
            const recent = employees.slice(0, 5);
            if(!recent.length) { container.innerHTML = '<div class="empty-state">No employees</div>'; return; }
            container.innerHTML = `<table class="data-table"><thead><tr><th>#</th><th>Name</th><th>Dept</th></tr></thead><tbody>${recent.map(e => `<tr onclick="Router.navigate('employee-view',{id:'${e.employeeNumber}'})"><td><strong>${e.employeeNumber}</strong></td><td>${e.name}</td><td>${e.department || '-'}</td></tr>`).join('')}</tbody></table>`;
        } catch(e) { container.innerHTML = '<div class="empty-state">Error loading</div>'; }
    },
    
    loadLeave: async function() {
        const container = document.getElementById('upcomingLeave');
        try {
            const leaves = await API.getLeaveRequests();
            const pending = leaves.filter(l => l.status === 'Pending').slice(0, 5);
            if(!pending.length) { container.innerHTML = '<div class="empty-state">No pending requests</div>'; return; }
            container.innerHTML = pending.map(l => `<div class="leave-item"><div><div class="leave-employee">${l.employeeName || 'Employee'}</div><div class="leave-dates">${l.startDate} to ${l.endDate}</div></div><div class="leave-status pending">Pending</div></div>`).join('');
        } catch(e) { container.innerHTML = '<div class="empty-state">No leave data</div>'; }
    },
    
    renderActions: function() {
        const container = document.getElementById('quickActions');
        if(!container) return;
        const actions = [
            { icon: 'fa-user-plus', text: 'Add Employee', page: 'employee-add' },
            { icon: 'fa-calculator', text: 'Payroll', page: 'payroll-process' },
            { icon: 'fa-chart-line', text: 'Appraisal', page: 'appraisal-new' },
            { icon: 'fa-calendar-plus', text: 'Leave', page: 'leave-apply' },
            { icon: 'fa-exclamation-triangle', text: 'Grievance', page: 'grievance-new' }
        ];
        container.innerHTML = actions.map(a => `<button class="quick-action-btn" onclick="Router.navigate('${a.page}')"><i class="fas ${a.icon}"></i>${a.text}</button>`).join('');
    }
};
window.Dashboard = Dashboard;
