// js/employee/employee-view.js
const EmployeeView = {
    employeeNumber: null,
    employeeData: null,
    
    init: async function(params = {}) {
        console.log('EmployeeView init:', params);
        
        if(!params.id) {
            Utils.showToast('No employee specified', 'error');
            Router.navigate('employee-list');
            return;
        }
        
        this.employeeNumber = params.id;
        
        Utils.showLoading();
        
        try {
            await this.loadEmployeeData();
            Utils.hideLoading();
            await this.loadAndShowModal();
            this.setupEventListeners();
        } catch(e) {
            Utils.hideLoading();
            Utils.showToast('Failed to load employee details', 'error');
            console.error('Error loading employee:', e);
            Router.navigate('employee-list');
        }
    },
    
    loadEmployeeData: async function() {
        const result = await API.getEmployeeById(this.employeeNumber);
        
        if(result.error) {
            Utils.showToast(result.error, 'error');
            throw new Error(result.error);
        }
        
        this.employeeData = result;
        return result;
    },
    
    loadAndShowModal: async function() {
        try {
            const response = await fetch('pages/employee/view.html');
            if(!response.ok) throw new Error('Failed to load view.html');
            
            const html = await response.text();
            
            let modalContainer = document.getElementById('modalContainer');
            if(!modalContainer) {
                modalContainer = document.createElement('div');
                modalContainer.id = 'modalContainer';
                document.body.appendChild(modalContainer);
            }
            
            modalContainer.innerHTML = html;
            this.populateModal();
            
            const modal = document.getElementById('summaryModal');
            if(modal) {
                modal.classList.add('active');
            }
        } catch(e) {
            console.error('Error loading modal:', e);
            throw e;
        }
    },
    
    populateModal: function() {
        const emp = this.employeeData;
        if(!emp) return;
        
        const age = this.calculateAge(emp.dob);
        const yearsOfService = this.calculateYearsOfService(emp.appointmentDate);
        
        // Header - Name, Number, Status
        this.setElementText('empName', emp.name);
        this.setElementText('empNum', emp.employeeNumber);
        this.setElementText('empAge', age);
        this.setElementText('empYearsOfService', yearsOfService);
        this.setStatusBadge(emp.status);
        
        // Personal Details
        this.setElementText('empSex', emp.sex);
        this.setElementText('empDob', this.formatDate(emp.dob));
        this.setElementText('empPlaceOfBirth', emp.placeOfBirth);
        this.setElementText('empNationality', emp.nationality);
        this.setElementText('empIdType', emp.idType);
        this.setElementText('empIdNumber', emp.idNumber);
        this.setElementText('empContactTelephone', emp.contactTelephone || emp.contactNumber);
        this.setElementText('empEmail', emp.email || 'N/A');
        this.setElementText('empPlaceOfResidence', emp.residence);
        this.setElementText('empResidenceType', emp.residenceType);
        this.setElementText('empDigitalAddress', emp.digitalAddress);
        this.setElementText('empLandmark', emp.landmark);
        this.setElementText('empMaritalStatus', emp.maritalStatus);
        this.setElementText('empSpouseName', emp.spouseName);
        this.setElementText('empChildren', emp.childrenCount || '0');
        this.setElementText('empFatherName', emp.fatherName);
        this.setElementText('empMotherName', emp.motherName);
        this.setElementText('empNextOfKin', emp.nextOfKin);
        this.setElementText('empKinContact', emp.kinContact);
        this.setElementText('empKinResidence', emp.kinResidence);
        
        // Employment Details
        this.setElementText('empDesignation', emp.designation);
        this.setElementText('empDepartment', emp.department);
        this.setElementText('empEmploymentType', emp.employmentType);
        this.setElementText('empDateOfAppointment', this.formatDate(emp.appointmentDate || emp.dateOfAppointment));
        this.setElementText('empDateOfAssumption', this.formatDate(emp.assumptionDate || emp.dateOfAssumption));
        this.setElementText('empSsnitNumber', emp.ssnitNumber || emp.ssnit);
        this.setElementText('empTinNumber', emp.tinNumber);
        
        // Education
        this.setElementText('secInstitution', emp.secondaryInstitution);
        this.setElementText('secMajor', emp.secondaryMajor);
        this.setElementText('secYear', emp.secondaryYear);
        this.setElementText('terInstitution', emp.tertiaryInstitution);
        this.setElementText('terMajor', emp.tertiaryMajor);
        this.setElementText('terYear', emp.tertiaryYear);
        this.setElementText('profInstitution', emp.professionalInstitution);
        this.setElementText('profMajor', emp.professionalMajor);
        this.setElementText('profYear', emp.professionalYear);
        
        // Guarantors
        this.setElementText('guarantor1Name', emp.guarantor1Name);
        this.setElementText('guarantor1Contact', emp.guarantor1Contact);
        this.setElementText('guarantor1Address', emp.guarantor1Address);
        this.setElementText('guarantor1Email', emp.guarantor1Email);
        this.setElementText('guarantor2Name', emp.guarantor2Name);
        this.setElementText('guarantor2Contact', emp.guarantor2Contact);
        this.setElementText('guarantor2Address', emp.guarantor2Address);
        this.setElementText('guarantor2Email', emp.guarantor2Email);
    },
    
    setElementText: function(id, value) {
        const element = document.getElementById(id);
        if(element) {
            element.textContent = value || '—';
        }
    },
    
    setStatusBadge: function(status) {
        const element = document.getElementById('empStatus');
        if(element) {
            const isActive = status === 'Active';
            element.className = `status-badge ${isActive ? 'status-active' : 'status-inactive'}`;
            element.textContent = status || 'Active';
        }
    },
    
    calculateAge: function(dob) {
        if(!dob) return '—';
        try {
            const birthDate = new Date(dob);
            if(isNaN(birthDate.getTime())) return '—';
            const today = new Date();
            let age = today.getFullYear() - birthDate.getFullYear();
            const m = today.getMonth() - birthDate.getMonth();
            if(m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
            return age < 0 ? '—' : age;
        } catch(e) {
            return '—';
        }
    },
    
    calculateYearsOfService: function(startDate) {
        if(!startDate) return '—';
        try {
            const start = new Date(startDate);
            if(isNaN(start.getTime())) return '—';
            const today = new Date();
            let years = today.getFullYear() - start.getFullYear();
            const m = today.getMonth() - start.getMonth();
            if(m < 0 || (m === 0 && today.getDate() < start.getDate())) years--;
            return years < 0 ? '—' : years;
        } catch(e) {
            return '—';
        }
    },
    
    formatDate: function(dateString) {
        if(!dateString) return '—';
        try {
            const date = new Date(dateString);
            if(isNaN(date.getTime())) return '—';
            return date.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
        } catch(e) {
            return '—';
        }
    },
    
    setupEventListeners: function() {
        const editBtn = document.getElementById('editEmployeeFromModal');
        if(editBtn) {
            editBtn.onclick = () => {
                this.close();
                Router.navigate('employee-edit', { id: this.employeeNumber });
            };
        }
        
        const modal = document.getElementById('summaryModal');
        if(modal) {
            modal.onclick = (e) => {
                if(e.target === modal) this.close();
            };
        }
        
        const closeBtn = document.querySelector('.modal-close');
        if(closeBtn) closeBtn.onclick = () => this.close();
        
        this.escapeHandler = this.handleEscape.bind(this);
        document.addEventListener('keydown', this.escapeHandler);
    },
    
    handleEscape: function(e) {
        if(e.key === 'Escape') this.close();
    },
    
    print: function() {
        const modalContent = document.querySelector('#summaryModal .modal-content');
        if(!modalContent) return;
        
        const printContent = modalContent.cloneNode(true);
        printContent.querySelectorAll('.modal-footer, .modal-close, .btn').forEach(el => el?.remove());
        
        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Employee Profile</title>
                <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" rel="stylesheet">
                <style>
                    body { font-family: Arial, sans-serif; padding: 20px; }
                    .employee-header { background: #f5f5f5; padding: 10px; margin-bottom: 15px; }
                    .compact-section { border: 1px solid #ddd; margin-bottom: 10px; }
                    .section-title { background: #eee; padding: 6px 10px; }
                    .compact-grid { display: grid; grid-template-columns: repeat(2,1fr); gap: 6px; padding: 10px; }
                    .grid-item { font-size: 11px; }
                    .highlight-value { color: #2563eb; font-weight: 600; }
                    @media print { body { padding: 0; } }
                </style>
            </head>
            <body>${printContent.innerHTML}<script>window.onload=()=>window.print()<\/script></body>
            </html>
        `);
        printWindow.document.close();
    },
    
    close: function() {
        const modal = document.getElementById('summaryModal');
        if(modal) modal.classList.remove('active');
        document.removeEventListener('keydown', this.escapeHandler);
        Router.navigate('employee-list');
    }
};

window.EmployeeView = EmployeeView;
