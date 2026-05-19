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
            // Do NOT prevent body scroll - modal scrolls with page naturally
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
            
            // Load and display documents
            await this.loadDocuments();
            
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
        
        // Calculate age and years of service
        const age = this.calculateAge(emp.dob);
        const yearsOfService = this.calculateYearsOfService(emp.appointmentDate || emp.dateOfAppointment);
        
        // Employee Information - Header
        this.setElementText('empName', emp.employeeName || emp.name || 'N/A');
        this.setElementText('empNum', emp.employeeNumber || 'N/A');
        this.setStatusBadge(emp.status || 'Active');
        
        // Personal Details
        this.setElementText('empSex', emp.sex || 'N/A');
        this.setElementText('empNationality', emp.nationality || 'N/A');
        this.setElementText('empIdType', emp.idType || 'N/A');
        this.setElementText('empIdNumber', emp.idNumber || 'N/A');
        this.setElementText('empDob', this.formatDate(emp.dob));
        this.setElementText('empAge', age);
        this.setElementText('empPlaceOfBirth', emp.placeOfBirth || 'N/A');
        
        // Contact & Residential
        this.setElementText('empContactTelephone', emp.contactNumber || emp.contactTelephone || 'N/A');
        this.setElementText('empEmail', emp.emailAddress || emp.email || 'N/A');
        this.setElementText('empPostalAddress', emp.postalAddress || 'N/A');
        this.setElementText('empPlaceOfResidence', emp.residence || 'N/A');
        this.setElementText('empResidenceType', emp.residenceType || 'N/A');
        this.setElementText('empDigitalAddress', emp.digitalAddress || 'N/A');
        this.setElementText('empLandmark', emp.landmark || 'N/A');
        
        // Family Information
        this.setElementText('empMaritalStatus', emp.maritalStatus || 'N/A');
        this.setElementText('empSpouseName', emp.spouseName || 'N/A');
        this.setElementText('empSpouseContact', emp.spouseContact || 'N/A');
        this.setElementText('empChildren', emp.childrenCount || '0');
        this.setElementText('empFatherName', emp.fatherName || 'N/A');
        this.setElementText('empFatherContact', emp.fatherContact || 'N/A');
        this.setElementText('empMotherName', emp.motherName || 'N/A');
        this.setElementText('empMotherContact', emp.motherContact || 'N/A');
        this.setElementText('empNextOfKin', emp.nextOfKinName || emp.nextOfKin || 'N/A');
        this.setElementText('empKinRelationship', emp.kinRelationship || 'N/A');
        this.setElementText('empKinContact', emp.kinContact || 'N/A');
        this.setElementText('empKinResidence', emp.kinResidence || 'N/A');
        
        // Employment Details
        this.setElementText('empDateOfAppointment', this.formatDate(emp.appointmentDate || emp.dateOfAppointment));
        this.setElementText('empYearsOfService', yearsOfService);
        this.setElementText('empDateOfAssumption', this.formatDate(emp.assumptionDate));
        this.setElementText('empDesignation', emp.designation || 'N/A');
        this.setElementText('empDepartment', emp.department || 'N/A');
        this.setElementText('empSsnitNumber', emp.ssnit || emp.ssnitNumber || 'N/A');
        this.setElementText('empTinNumber', emp.tinNumber || 'N/A');
        this.setElementText('empEmploymentType', emp.employmentType || 'N/A');
        
        // Education - Secondary
        this.setElementText('secInstitution', emp.secondaryInstitution || 'N/A');
        this.setElementText('secMajor', emp.secondaryMajor || 'N/A');
        this.setElementText('secYear', emp.secondaryYear || 'N/A');
        
        // Education - Tertiary
        this.setElementText('terInstitution', emp.tertiaryInstitution || 'N/A');
        this.setElementText('terMajor', emp.tertiaryMajor || 'N/A');
        this.setElementText('terYear', emp.tertiaryYear || 'N/A');
        
        // Education - Professional
        this.setElementText('profInstitution', emp.professionalInstitution || 'N/A');
        this.setElementText('profMajor', emp.professionalMajor || 'N/A');
        this.setElementText('profYear', emp.professionalYear || 'N/A');
        
        // Guarantor 1
        this.setElementText('guarantor1Name', emp.guarantor1Name || 'N/A');
        this.setElementText('guarantor1Contact', emp.guarantor1Contact || 'N/A');
        this.setElementText('guarantor1Address', emp.guarantor1Address || 'N/A');
        this.setElementText('guarantor1Email', emp.guarantor1Email || 'N/A');
        
        // Guarantor 2
        this.setElementText('guarantor2Name', emp.guarantor2Name || 'N/A');
        this.setElementText('guarantor2Contact', emp.guarantor2Contact || 'N/A');
        this.setElementText('guarantor2Address', emp.guarantor2Address || 'N/A');
        this.setElementText('guarantor2Email', emp.guarantor2Email || 'N/A');
    },
    
    loadDocuments: async function() {
        try {
            const documents = await API.getEmployeeDocuments(this.employeeNumber);
            this.displayDocuments(documents || []);
        } catch(error) {
            console.error('Error loading documents:', error);
            this.displayDocuments([]);
        }
    },
    
    displayDocuments: function(documents) {
        const container = document.getElementById('documentsContainer');
        if(!container) return;
        
        if(!documents || documents.length === 0) {
            container.innerHTML = `
                <div class="empty-state-small">
                    <i class="fas fa-inbox"></i>
                    <p>No documents uploaded</p>
                </div>
            `;
            return;
        }
        
        // Group documents by type
        const grouped = {};
        documents.forEach(doc => {
            if(!grouped[doc.documentType]) {
                grouped[doc.documentType] = [];
            }
            grouped[doc.documentType].push(doc);
        });
        
        let html = '';
        for (const [type, docs] of Object.entries(grouped)) {
            html += `
                <div class="document-group">
                    <h4 class="group-title">
                        <i class="fas fa-tag"></i> ${this.getDocumentTypeName(type)}
                        <span class="group-count">(${docs.length})</span>
                    </h4>
                    <div class="document-group-list">
                        ${docs.map(doc => `
                            <div class="document-item">
                                <div class="document-icon">
                                    <i class="fas ${Utils.getFileIcon(doc.mimeType)}"></i>
                                </div>
                                <div class="document-info">
                                    <div class="document-name">${Utils.escapeHtml(doc.originalFileName || doc.savedFileName)}</div>
                                    <div class="document-meta">
                                        <span class="document-date">
                                            <i class="fas fa-calendar-alt"></i> ${Utils.formatDisplayDate(doc.uploadDate)}
                                        </span>
                                        <span class="document-size">${Utils.formatFileSize(doc.fileSize)}</span>
                                    </div>
                                </div>
                                <div class="document-actions">
                                    <button class="doc-action-btn view" onclick="EmployeeView.downloadDocument('${doc.fileUrl}', '${Utils.escapeHtml(doc.originalFileName || doc.savedFileName)}')">
                                        <i class="fas fa-download"></i> Download
                                    </button>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        }
        
        container.innerHTML = html;
    },
    
    getDocumentTypeName(type) {
        const names = {
            'Passport Photo': 'Passport Photos',
            'National ID': 'Identification Documents',
            'Certificates': 'Certificates',
            'Degree Certificates': 'Degrees & Diplomas',
            'Professional Certificates': 'Professional Certifications',
            'CV / Resume': 'CV / Resume',
            'Employment Contracts': 'Employment Contracts',
            'Other': 'Other Documents',
            'Other Documents': 'Other Documents'
        };
        return names[type] || type;
    },
    
    downloadDocument: function(url, filename) {
        const link = document.createElement('a');
        link.href = url;
        link.download = filename || 'document';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    },
    
    setElementText: function(id, value) {
        const element = document.getElementById(id);
        if(element) {
            const displayValue = value || 'N/A';
            element.textContent = displayValue;
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
        try {
            const birthDate = new Date(dob);
            if(isNaN(birthDate.getTime())) return 'N/A';
            const today = new Date();
            let age = today.getFullYear() - birthDate.getFullYear();
            const m = today.getMonth() - birthDate.getMonth();
            if(m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
            return age < 0 ? 'N/A' : age + ' years';
        } catch(e) {
            return 'N/A';
        }
    },
    
    calculateYearsOfService: function(startDate) {
        if(!startDate) return 'N/A';
        try {
            const start = new Date(startDate);
            if(isNaN(start.getTime())) return 'N/A';
            const today = new Date();
            let years = today.getFullYear() - start.getFullYear();
            const m = today.getMonth() - start.getMonth();
            if(m < 0 || (m === 0 && today.getDate() < start.getDate())) years--;
            return years < 0 ? 'N/A' : years + ' year(s)';
        } catch(e) {
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
            return 'N/A';
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
        
        // Close modal when clicking outside (on the dark overlay)
        const modal = document.getElementById('summaryModal');
        if(modal) {
            modal.onclick = (e) => {
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
        
        // Close on Escape key
        this.escapeHandler = this.handleEscape.bind(this);
        document.addEventListener('keydown', this.escapeHandler);
    },
    
    handleEscape: function(e) {
        if(e.key === 'Escape') {
            this.close();
        }
    },
    
    print: function() {
        const modalContent = document.querySelector('#summaryModal .modal-content');
        if(!modalContent) return;
        
        const printContent = modalContent.cloneNode(true);
        printContent.querySelectorAll('.modal-footer, .modal-close, .btn, .close, .document-actions').forEach(el => {
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
                    .section { border: 1px solid #ddd; border-radius: 8px; margin-bottom: 20px; page-break-inside: avoid; }
                    .section-header { background: #f5f5f5; padding: 10px 16px; border-bottom: 1px solid #ddd; }
                    .section-body { padding: 16px; }
                    .info-row { display: flex; flex-wrap: wrap; gap: 16px; margin-bottom: 10px; }
                    .info-row p { flex: 1; min-width: 200px; }
                    .info-row strong { display: inline-block; width: 130px; }
                    .highlight-value { color: #3b82f6; font-weight: 700; }
                    .guarantor-container { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
                    .guarantor { background: #f9f9f9; padding: 12px; border-radius: 8px; }
                    .status-active { color: green; font-weight: 600; }
                    .status-inactive { color: red; font-weight: 600; }
                    @media print {
                        body { padding: 20px; }
                        .section { break-inside: avoid; }
                    }
                </style>
            </head>
            <body>
                ${printContent.outerHTML}
                <script>window.onload = () => window.print(); window.onafterprint = () => window.close();<\/script>
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
        // Remove escape listener
        document.removeEventListener('keydown', this.escapeHandler);
        // Return to employee list
        Router.navigate('employee-list');
    }
};

window.EmployeeView = EmployeeView;
