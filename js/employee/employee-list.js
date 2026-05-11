
// employee-list.js
const EmployeeList = {
    employees: [],
    filteredEmployees: [],
    currentPage: 1,
    itemsPerPage: CONFIG.ITEMS_PER_PAGE,
    
    /**
     * Initialize employee list
     */
    async init(params = {}) {
        console.log('Initializing Employee List');
        await this.loadEmployees();
        this.setupEventListeners();
    },
    
    /**
     * Setup event listeners for search and filter
     */
    setupEventListeners() {
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.addEventListener('keyup', Utils.debounce(() => this.filterEmployees(), 300));
        }
        
        const statusFilter = document.getElementById('statusFilter');
        if (statusFilter) {
            statusFilter.addEventListener('change', () => this.filterEmployees());
        }
        
        const exportBtn = document.getElementById('exportBtn');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => this.exportToCSV());
        }
    },
    
    /**
     * Load employees from API
     */
    async loadEmployees() {
        Utils.showLoading();
        const result = await API.getEmployeeList();
        Utils.hideLoading();
        
        if (result.error) {
            Utils.showToast(result.error, 'error');
            this.employees = [];
        } else {
            this.employees = Array.isArray(result) ? result : (result.data || []);
        }
        
        this.filteredEmployees = [...this.employees];
        this.renderTable();
    },
    
    /**
     * Filter employees based on search and status
     */
    filterEmployees() {
        const searchTerm = document.getElementById('searchInput')?.value.toLowerCase() || '';
        const statusFilter = document.getElementById('statusFilter')?.value || 'all';
        
        this.filteredEmployees = this.employees.filter(emp => {
            const matchesSearch = !searchTerm || 
                emp.employeeNumber?.toLowerCase().includes(searchTerm) ||
                emp.name?.toLowerCase().includes(searchTerm) ||
                emp.department?.toLowerCase().includes(searchTerm);
            
            const matchesStatus = statusFilter === 'all' || emp.status === statusFilter;
            
            return matchesSearch && matchesStatus;
        });
        
        this.currentPage = 1;
        this.renderTable();
    },
    
    /**
     * Render employee table
     */
    renderTable() {
        const container = document.getElementById('employeeTableContainer');
        if (!container) return;
        
        const start = (this.currentPage - 1) * this.itemsPerPage;
        const end = start + this.itemsPerPage;
        const pageEmployees = this.filteredEmployees.slice(start, end);
        
        if (pageEmployees.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-users-slash"></i>
                    <h3>No Employees Found</h3>
                    <p>Try adjusting your search or filter criteria</p>
                    <button class="btn btn-primary" onclick="Router.navigate('employee-add')">
                        <i class="fas fa-user-plus"></i> Add Employee
                    </button>
                </div>
            `;
            return;
        }
        
        container.innerHTML = `
            <div class="table-container">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Employee #</th>
                            <th>Name</th>
                            <th>Department</th>
                            <th>Designation</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${pageEmployees.map(emp => `
                            <tr>
                                <td><strong>${Utils.escapeHtml(emp.employeeNumber)}</strong></td>
                                <td>${Utils.escapeHtml(emp.name)}</td>
                                <td>${Utils.escapeHtml(emp.department)}</td>
                                <td>${Utils.escapeHtml(emp.designation)}</td>
                                <td><span class="status-badge status-${emp.status?.toLowerCase() === 'active' ? 'active' : 'inactive'}">${emp.status || 'Active'}</span></td>
                                <td class="action-buttons">
                                    <button class="action-btn action-btn-view" onclick="EmployeeList.viewEmployee('${emp.employeeNumber}')" title="View">
                                        <i class="fas fa-eye"></i>
                                    </button>
                                    <button class="action-btn action-btn-edit" onclick="EmployeeList.editEmployee('${emp.employeeNumber}')" title="Edit">
                                        <i class="fas fa-edit"></i>
                                    </button>
                                    <button class="action-btn action-btn-delete" onclick="EmployeeList.deleteEmployee('${emp.employeeNumber}')" title="Delete">
                                        <i class="fas fa-trash"></i>
                                    </button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
            ${this.renderPagination()}
        `;
    },
    
    /**
     * Render pagination controls
     */
    renderPagination() {
        const totalPages = Math.ceil(this.filteredEmployees.length / this.itemsPerPage);
        if (totalPages <= 1) return '';
        
        let pages = '';
        for (let i = 1; i <= totalPages; i++) {
            pages += `<button class="page-btn ${i === this.currentPage ? 'active' : ''}" onclick="EmployeeList.goToPage(${i})">${i}</button>`;
        }
        
        return `
            <div class="pagination">
                <button class="page-btn" onclick="EmployeeList.prevPage()" ${this.currentPage === 1 ? 'disabled' : ''}>
                    <i class="fas fa-chevron-left"></i>
                </button>
                ${pages}
                <button class="page-btn" onclick="EmployeeList.nextPage()" ${this.currentPage === totalPages ? 'disabled' : ''}>
                    <i class="fas fa-chevron-right"></i>
                </button>
            </div>
        `;
    },
    
    /**
     * Go to specific page
     */
    goToPage(page) {
        this.currentPage = page;
        this.renderTable();
    },
    
    /**
     * Go to previous page
     */
    prevPage() {
        if (this.currentPage > 1) {
            this.currentPage--;
            this.renderTable();
        }
    },
    
    /**
     * Go to next page
     */
    nextPage() {
        const totalPages = Math.ceil(this.filteredEmployees.length / this.itemsPerPage);
        if (this.currentPage < totalPages) {
            this.currentPage++;
            this.renderTable();
        }
    },
    
    /**
     * View employee details
     */
    viewEmployee(employeeNumber) {
        Router.navigate('employee-view', { id: employeeNumber });
    },
    
    /**
     * Edit employee
     */
    editEmployee(employeeNumber) {
        Router.navigate('employee-edit', { id: employeeNumber });
    },
    
    /**
     * Delete employee
     */
    async deleteEmployee(employeeNumber) {
        const confirmed = await Utils.confirm(
            `Are you sure you want to delete employee ${employeeNumber}?`,
            'Confirm Delete'
        );
        
        if (confirmed) {
            Utils.showLoading();
            const result = await API.deleteEmployee(employeeNumber);
            Utils.hideLoading();
            
            if (result.success) {
                Utils.showToast('Employee deleted successfully', 'success');
                await this.loadEmployees();
            } else {
                Utils.showToast(result.error || 'Failed to delete employee', 'error');
            }
        }
    },
    
    /**
     * Export to CSV
     */
    exportToCSV() {
        const headers = ['Employee Number', 'Name', 'Department', 'Designation', 'Status'];
        const rows = this.filteredEmployees.map(emp => [
            emp.employeeNumber,
            emp.name,
            emp.department,
            emp.designation,
            emp.status
        ]);
        
        const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `employees_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);
        
        Utils.showToast('Export completed', 'success');
    }
};

window.EmployeeList = EmployeeList;
