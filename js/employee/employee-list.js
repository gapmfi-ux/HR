const EmployeeList = {
    employees: [],
    filteredEmployees: [],
    allDesignations: new Set(),
    
    init: async function() {
        await this.load();
        this.populateDesignationFilter();
        this.setupEventListeners();
    }, 
    
    setupEventListeners: function() {
        const searchInput = document.getElementById('searchInput');
        const statusFilter = document.getElementById('statusFilter');
        const departmentFilter = document.getElementById('departmentFilter');
        const designationFilter = document.getElementById('designationFilter');
        
        if(searchInput) searchInput.addEventListener('keyup', () => this.filter());
        if(statusFilter) statusFilter.addEventListener('change', () => this.filter());
        if(departmentFilter) departmentFilter.addEventListener('change', () => this.filter());
        if(designationFilter) designationFilter.addEventListener('change', () => this.filter());
    },
    
    load: async function() {
        try {
            this.employees = await API.getEmployeeList();
            this.render(this.employees);
        } catch(e) {
            console.error('Error loading employees:', e);
            const container = document.getElementById('employeeTableContainer');
            if(container) {
                container.innerHTML = '<div class="empty-state"><i class="fas fa-exclamation-circle"></i><p>Error loading employees</p></div>';
            }
        }
    },
    
    populateDesignationFilter: function() {
        // Collect all unique designations
        this.employees.forEach(emp => {
            if(emp.designation) {
                this.allDesignations.add(emp.designation);
            }
        });
        
        // Sort and add to dropdown
        const designationFilter = document.getElementById('designationFilter');
        if(designationFilter) {
            const sortedDesignations = Array.from(this.allDesignations).sort();
            sortedDesignations.forEach(designation => {
                const option = document.createElement('option');
                option.value = designation;
                option.textContent = designation;
                designationFilter.appendChild(option);
            });
        }
    },
    
    filter: function() {
        const search = document.getElementById('searchInput')?.value.toLowerCase() || '';
        const status = document.getElementById('statusFilter')?.value || 'all';
        const department = document.getElementById('departmentFilter')?.value || 'all';
        const designation = document.getElementById('designationFilter')?.value || 'all';
        
        this.filteredEmployees = this.employees.filter(emp => {
            const matchSearch = !search || 
                emp.name?.toLowerCase().includes(search) || 
                emp.employeeNumber?.toLowerCase().includes(search);
            
            const matchStatus = status === 'all' || emp.status === status;
            
            const matchDepartment = department === 'all' || emp.department === department;
            
            const matchDesignation = designation === 'all' || emp.designation === designation;
            
            return matchSearch && matchStatus && matchDepartment && matchDesignation;
        });
        
        this.render(this.filteredEmployees);
    },
    
    render: function(data) {
        const container = document.getElementById('employeeTableContainer');
        if(!container) return;
        
        if(!data || data.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-inbox"></i>
                    <p>No employees found</p>
                </div>
            `;
            return;
        }
        
        const html = `
            <div class="table-container">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Staff No.</th>
                            <th>Name</th>
                            <th>Designation</th>
                            <th>Department</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${data.map(emp => `
                            <tr>
                                <td class="staff-no">${emp.employeeNumber || '-'}</td>
                                <td>${emp.name || '-'}</td>
                                <td class="designation-cell">${emp.designation || '-'}</td>
                                <td>${emp.department || '-'}</td>
                                <td>
                                    <span class="status-badge ${emp.status === 'Active' ? 'status-active' : 'status-inactive'}">
                                        ${emp.status || 'Active'}
                                    </span>
                                </td>
                                <td>
                                    <div class="action-buttons">
                                        <button class="btn-view" onclick="EmployeeList.viewEmployee('${emp.employeeNumber}')">
                                            View
                                        </button>
                                        <button class="btn-edit" onclick="EmployeeList.edit('${emp.employeeNumber}')" title="Edit">
                                            <i class="fas fa-edit"></i>
                                        </button>
                                        <button class="btn-delete" onclick="EmployeeList.del('${emp.employeeNumber}')" title="Delete">
                                            <i class="fas fa-trash"></i>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        `;
        
        container.innerHTML = html;
    },
    
    viewEmployee: async function(employeeNumber) {
        // Load the employee view page first
        await Router.navigate('employee-view', { id: employeeNumber });
    },
    
    edit: function(id) {
        Router.navigate('employee-edit', { id });
    },
    
    del: async function(id) {
        const confirmed = await Utils.confirm(
            'Are you sure you want to delete this employee?',
            'Delete Employee'
        );
        
        if(confirmed) {
            Utils.showLoading();
            try {
                const result = await API.deleteEmployee(id);
                Utils.hideLoading();
                
                if(result.success) {
                    Utils.showToast('Employee deleted successfully', 'success');
                    await this.load();
                } else {
                    Utils.showToast(result.error || 'Failed to delete employee', 'error');
                }
            } catch(e) {
                Utils.hideLoading();
                Utils.showToast('Error deleting employee', 'error');
                console.error(e);
            }
        }
    }
};

window.EmployeeList = EmployeeList;
