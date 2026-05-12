// js/employee/employee-view.js
const EmployeeView = {
    employeeNumber: null,
    employeeData: null,
    currentTab: 'personal',
    
    init: async function(params = {}) {
        console.log('EmployeeView init:', params);
        
        if(!params.id) {
            Utils.showToast('No employee specified', 'error');
            Router.navigate('employee-list');
            return;
        }
        
        this.employeeNumber = params.id;
        
        // Show loading state
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
            // Load modal HTML
            const response = await fetch('pages/employee/view.html');
            if(!response.ok) throw new Error('Failed to load view.html');
            
            const html = await response.text();
            
            // Get or create modal container
            let modalContainer = document.getElementById('modalContainer');
            if(!modalContainer) {
                modalContainer = document.createElement('div');
                modalContainer.id = 'modalContainer';
                document.body.appendChild(modalContainer);
            }
            
            // Insert HTML
            modalContainer.innerHTML = html;
            
            // Populate modal with data
            this.populateModal();
            
            // Show modal
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
        
        // Calculate age and years of service using FRONTEND functions
        const age = this.calculateAge(emp.dob);
        const yearsOfService = this.calculateYearsOfService(emp.appointmentDate);
        
        // Header/Badge
        const statusBadge = document.getElementById('empStatusBadge');
        if(statusBadge) {
            const isActive = emp.status === 'Active';
            statusBadge.textContent = emp.status || 'Active';
            statusBadge.style.background = isActive ? '#dcfce7' : '#fee2e2';
            statusBadge.style.color = isActive ? '#166534' : '#991b1b';
        }
        
        // Profile Section
        this.setElementText('empName', emp.name);
        this.setElementText('empDesignation', emp.designation);
        this.setElementText('empDepartment', emp.department || '-');
        this.setElementText('empNum', emp.employeeNumber);
        this.setElementText('empAge', age);
        this.setElementText('empYearsOfService', yearsOfService);
        
        // Personal Tab
        this.setElementText('empNameFull', emp.name);
        this.setElementText('empSex', emp.sex);
        this.setElementText('empNationality', emp.nationality);
        this.setElementText('empIdType', emp.idType);
        this.setElementText('empIdNumber', emp.idNumber);
        this.setElementText('empDob', this.formatDate(emp.dob));
        this.setElementText('empAgeDetail', age);
        this.setElementText('empPlaceOfBirth', emp.placeOfBirth);
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
        
        // Employment Tab
        this.setElementText('empDesignationDetail', emp.designation);
        this.setElementText('empDepartmentDetail', emp.department);
        this.setElementText('empEmploymentType', emp.employmentType);
        this.setElementText('empDateOfAppointment', this.formatDate(emp.appointmentDate || emp.dateOfAppointment));
        this.setElementText('empDateOfAssumption', this.formatDate(emp.assumptionDate || emp.dateOfAssumption));
        this.setElementText('empYearsOfServiceDetail', yearsOfService);
        this.setElementText('empSsnitNumber', emp.ssnitNumber || emp.ssnit);
        this.setElementText('empTinNumber', emp.tinNumber);
        
        // Education Tab
        this.setElementText('secInstitution', emp.secondaryInstitution);
        this.setElementText('secMajor', emp.secondaryMajor);
        this.setElementText('secYear', emp.secondaryYear);
        this.setElementText('terInstitution', emp.tertiaryInstitution);
        this.setElementText('terMajor', emp.tertiaryMajor);
        this.setElementText('terYear', emp.tertiaryYear);
        this.setElementText('profInstitution', emp.professionalInstitution);
        this.setElementText('profMajor', emp.professionalMajor);
        this.setElementText('profYear', emp.professionalYear);
        
        // Family Tab
        this.setElementText('empMaritalStatusFamily', emp.maritalStatus);
        this.setElementText('empSpouseNameFamily', emp.spouseName);
        this.setElementText('empChildrenFamily', emp.childrenCount || '0');
        this.setElementText('empFatherNameFamily', emp.fatherName);
        this.setElementText('empMotherNameFamily', emp.motherName);
        this.setElementText('empNextOfKinFamily', emp.nextOfKin);
        this.setElementText('empKinContactFamily', emp.kinContact);
        this.setElementText('empKinResidenceFamily', emp.kinResidence);
        
        // Guarantor Tab
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
            element.textContent = value || '-';
        }
    },
    
    /**
     * Calculate age from date of birth (FRONTEND VERSION)
     */
    calculateAge: function(dob) {
        if(!dob) return 'N/A';
        
        try {
            const birthDate = new Date(dob);
            if(isNaN(birthDate.getTime())) return 'N/A';
            
            const today = new Date();
            let age = today.getFullYear() - birthDate.getFullYear();
            const m = today.getMonth() - birthDate.getMonth();
            
            if(m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
                age--;
            }
            
            return age < 0 ? 'N/A' : age + ' years';
        } catch(e) {
            console.error('Error calculating age:', e);
            return 'N/A';
        }
    },
    
    /**
     * Calculate years of service from appointment date (FRONTEND VERSION)
     */
    calculateYearsOfService: function(startDate) {
        if(!startDate) return 'N/A';
        
        try {
            const start = new Date(startDate);
            if(isNaN(start.getTime())) return 'N/A';
            
            const today = new Date();
            let years = today.getFullYear() - start.getFullYear();
            const m = today.getMonth() - start.getMonth();
            
            if(m < 0 || (m === 0 && today.getDate() < start.getDate())) {
                years--;
            }
            
            return years < 0 ? 'N/A' : years + ' year(s)';
        } catch(e) {
            console.error('Error calculating years of service:', e);
            return 'N/A';
        }
    },
    
    formatDate: function(dateString) {
        if(!dateString) return 'N/A';
        
        try {
            const date = new Date(dateString);
            if(isNaN(date.getTime())) return 'N/A';
            
            return date.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        } catch(e) {
            console.error('Error formatting date:', e);
            return 'N/A';
        }
    },
    
    setupEventListeners: function() {
        // Tab switching
        const tabButtons = document.querySelectorAll('.tab-btn');
        if(tabButtons) {
            tabButtons.forEach(btn => {
                btn.onclick = (e) => {
                    e.preventDefault();
                    const tabName = btn.dataset.tab;
                    this.switchTab(tabName);
                };
            });
        }
        
        // Edit button
        const editBtn = document.getElementById('editEmployeeFromModal');
        if(editBtn) {
            editBtn.onclick = () => {
                this.close();
                Router.navigate('employee-edit', { id: this.employeeNumber });
            };
        }
        
        // Close modal when clicking outside (on the dark overlay)
        const modal = document.getElementById('summaryModal');
        if(modal) {
            modal.onclick = (e) => {
                // Only close if clicking directly on the modal background
                if(e.target === modal) {
                    this.close();
                }
            };
        }
    },
    
    switchTab: function(tabName) {
        // Update active tab button
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tabName);
        });
        
        // Update active tab pane
        document.querySelectorAll('.tab-pane').forEach(pane => {
            pane.classList.toggle('active', pane.id === `tab-${tabName}`);
        });
        
        this.currentTab = tabName;
    },
    
    print: function() {
        const modalContent = document.querySelector('#summaryModal .modal-content');
        if(!modalContent) return;
        
        const printContent = modalContent.cloneNode(true);
        
        // Remove buttons and unnecessary elements
        printContent.querySelectorAll('.modal-footer, .modal-close, .btn').forEach(el => {
            if(el) el.remove();
        });
        
        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Employee Profile - ${this.employeeData?.employeeNumber || 'Employee'}</title>
                <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" rel="stylesheet">
                <style>
                    * { margin: 0; padding: 0; box-sizing: border-box; }
                    body { font-family: 'Inter', Arial, sans-serif; padding: 40px 20px; background: white; }
                    .modal-content { max-width: 900px; margin: 0 auto; }
                    .modal-header { padding: 20px; border-bottom: 2px solid #3b82f6; margin-bottom: 20px; }
                    .modal-title { font-size: 20px; font-weight: 700; margin: 0; }
                    .profile-section { padding: 20px; background: #f8fafc; margin-bottom: 20px; border-radius: 8px; }
                    .profile-name { font-size: 18px; font-weight: 600; }
                    .profile-designation { font-size: 14px; color: #64748b; }
                    .modal-tabs { display: none; }
                    .modal-body { padding: 0; }
                    .tab-pane { display: block !important; page-break-inside: avoid; }
                    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px; }
                    .info-card { padding: 15px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; }
                    .info-card h4 { font-size: 13px; font-weight: 600; margin: 0 0 10px 0; }
                    .info-item { margin-bottom: 8px; }
                    .info-item .label { font-size: 11px; color: #64748b; font-weight: 600; }
                    .info-item .value { font-size: 12px; color: #1e293b; }
                    .guarantor-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
                    .guarantor-card { padding: 15px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; }
                    .guarantor-card h4 { font-size: 13px; font-weight: 600; margin: 0 0 10px 0; }
                    @media print {
                        body { padding: 0; }
                        .info-grid, .guarantor-grid { grid-template-columns: 1fr; }
                        .tab-pane { page-break-inside: avoid; }
                    }
                </style>
            </head>
            <body>
                ${printContent.outerHTML}
            </body>
            </html>
        `);
        printWindow.document.close();
        setTimeout(() => printWindow.print(), 250);
    },
    
    close: function() {
        const modal = document.getElementById('summaryModal');
        if(modal) {
            modal.classList.remove('active');
        }
        // Return to employee list
        Router.navigate('employee-list');
    }
};

window.EmployeeView = EmployeeView;
