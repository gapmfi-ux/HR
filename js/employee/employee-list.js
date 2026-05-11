const EmployeeList = {
    employees: [],
    
    init: async function() {
        await this.load();
        document.getElementById('searchInput')?.addEventListener('keyup', () => this.filter());
        document.getElementById('statusFilter')?.addEventListener('change', () => this.filter());
    },
    
    load: async function() {
        this.employees = await API.getEmployeeList();
        this.render(this.employees);
    },
    
    render: function(data) {
        const container = document.getElementById('employeeTableContainer');
        if(!data.length) { container.innerHTML = '<div class="empty-state">No employees found</div>'; return; }
        container.innerHTML = `<table class="data-table"><thead><tr><th>#</th><th>Name</th><th>Dept</th><th>Status</th><th></th></tr></thead><tbody>${data.map(e => `
            <tr><td><strong>${e.employeeNumber}</strong></td><td>${e.name}</td><td>${e.department||'-'}</td><td><span class="status-badge ${e.status==='Active'?'status-active':'status-inactive'}">${e.status||'Active'}</span></td>
            <td><button class="action-btn" onclick="EmployeeList.view('${e.employeeNumber}')"><i class="fas fa-eye"></i></button>
            <button class="action-btn" onclick="EmployeeList.edit('${e.employeeNumber}')"><i class="fas fa-edit"></i></button>
            <button class="action-btn" onclick="EmployeeList.del('${e.employeeNumber}')"><i class="fas fa-trash"></i></button></td></tr>`).join('')}</tbody></table>`;
    },
    
    filter: function() {
        const search = document.getElementById('searchInput')?.value.toLowerCase() || '';
        const status = document.getElementById('statusFilter')?.value || 'all';
        const filtered = this.employees.filter(e => 
            (!search || e.name?.toLowerCase().includes(search) || e.employeeNumber?.toLowerCase().includes(search)) &&
            (status === 'all' || e.status === status)
        );
        this.render(filtered);
    },
    
    view: (id) => Router.navigate('employee-view', { id }),
    edit: (id) => Router.navigate('employee-edit', { id }),
    del: async (id) => { if(await Utils.confirm('Delete?')) await API.deleteEmployee(id); location.reload(); }
};
window.EmployeeList = EmployeeList;
