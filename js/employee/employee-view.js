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
            
            // Insert modal HTML
            modalContainer.innerHTML = html;
            
            // Populate modal data
            this.populateModal();
            
            // Show modal
            const modal = document.getElementById('summaryModal');
            if(modal) {
                modal.classList.add('active');
            }
        } catch(e) {
            console.error('Error loading modal HTML:', e);
            throw e;
        }
    },
    
    populateModal: function() {
        const emp = this.employeeData;
        if(!emp) return;
        
        // Calculate age and years of service
        const age = this.calculateAge(emp.dob);
        const yearsOfService = this.calculateYearsOfService(emp.appointmentDate);
        
        // Employee Information
        this.setElementText('empNum', emp.employeeNumber);
        this.setElementText('empStatus', emp.status || 'Active');
        this.setStatusBadge(emp.status);
        
        // Personal Details
        this.setElementText('empName', emp.name);
        this.setElementText('empSex', emp.sex);
        this.setElementText('empDob', this.formatDate(emp.dob));
        this.setElementText('empAge', age);
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
        this.setElementText('empDateOfAppointment', this.formatDate(emp.appointmentDate || emp.dateOfAppointment));
        this.setElementText('empYearsOfService', yearsOfService);
        this.setElementText('empDateOfAssumption', this.formatDate(emp.assumptionDate || emp.dateOfAssumption));
        this.setElementText('empDesignation', emp.designation);
        this.setElementText('empDepartment', emp.department);
        this.setElementText('empSsnitNumber', emp.ssnitNumber || emp.ssnit);
        this.setElementText('empTinNumber', emp.tinNumber);
        this.setElementText('empEmploymentType', emp.employmentType);
        
        // Education - Secondary
        this.setElementText('secInstitution', emp.secondaryInstitution);
        this.setElementText('secMajor', emp.secondaryMajor);
        this.setElementText('secYear', emp.secondaryYear);
        
        // Education - Tertiary
        this.setElementText('terInstitution', emp.tertiaryInstitution);
        this.setElementText('terMajor', emp.tertiaryMajor);
        this.setElementText('terYear', emp.tertiaryYear);
        
        // Education - Professional
        this.setElementText('profInstitution', emp.professionalInstitution);
        this.setElementText('profMajor', emp.professionalMajor);
        this.setElementText('profYear', emp.professionalYear);
        
        // Guarantor 1
        this.setElementText('guarantor1Name', emp.guarantor1Name);
        this.setElementText('guarantor1Contact', emp.guarantor1Contact);
        this.setElementText('guarantor1Address', emp.guarantor1Address);
        this.setElementText('guarantor1Email', emp.guarantor1Email);
        
        // Guarantor 2
        this.setElementText('guarantor2Name', emp.guarantor2Name);
        this.setElementText('guarantor2Contact', emp.guarantor2Contact);
        this.setElementText('guarantor2Address', emp.guarantor2Address);
        this.setElementText('guarantor2Email', emp.guarantor2Email);
    },
    
    setElementText: function(id, value) {
        const element = document.getElementById(id);
        if(element) {
            element.textContent = value || 'N/A';
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
        if(!dob) return 'N/A';
        const birthDate = new Date(dob);
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        if(m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
        return age + ' years';
    },
    
    calculateYearsOfService: function(startDate) {
        if(!startDate) return 'N/A';
        const start = new Date(startDate);
        const today = new Date();
        let years = today.getFullYear() - start.getFullYear();
        const m = today.getMonth() - start.getMonth();
        if(m < 0 || (m === 0 && today.getDate() < start.getDate())) years--;
        return years + ' year(s)';
    },
    
    formatDate: function(dateString) {
        if(!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    },
    
    setupEventListeners: function() {
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
                // Only close if clicking directly on the modal background, not on modal-content
                if(e.target === modal) {
                    this.close();
                }
            };
        }
        
        // Close button
        const closeBtn = document.querySelector('.modal-close');
        if(closeBtn) {
            closeBtn.onclick = () => this.close();
        }
    },
    
    print: function() {
        const modalContent = document.querySelector('#summaryModal .modal-content');
        if(!modalContent) return;
        
        const printContent = modalContent.cloneNode(true);
        
        // Remove buttons from print
        printContent.querySelectorAll('.modal-footer, .close, .btn').forEach(el => {
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
                    body { font-family: 'Inter', Arial, sans-serif; padding: 40px; background: white; }
                    .modal-content { max-width: 900px; margin: 0 auto; }
                    .section { border: 1px solid #ddd; border-radius: 8px; margin-bottom: 20px; }
                    .section-header { background: #f5f5f5; padding: 10px 16px; border-bottom: 1px solid #ddd; }
                    .section-body { padding: 16px; }
                    .info-row { display: flex; flex-wrap: wrap; gap: 16px; margin-bottom: 10px; }
                    .info-row p { flex: 1; min-width: 200px; }
                    .info-row strong { display: inline-block; width: 130px; }
                    .guarantor-container { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
                    .guarantor { background: #f9f9f9; padding: 12px; border-radius: 8px; }
                    .status-active { color: green; }
                    .status-inactive { color: red; }
                    @media print {
                        body { padding: 20px; }
                        .section { break-inside: avoid; }
                    }
                </style>
            </head>
            <body>
                ${printContent.outerHTML}
                <script>window.onload = () => window.print();<\\/script>
            </body>
            </html>
        `);
        printWindow.document.close();
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
