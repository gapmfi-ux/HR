// js/employee/employee-view.js
const EmployeeView = {
    employeeNumber: null,
    employeeData: null,
    modal: null,
    currentTab: 'personal',
    
    init: async function(params = {}) {
        console.log('EmployeeView init:', params);
        
        if(!params.id) {
            Utils.showToast('No employee specified', 'error');
            return;
        }
        
        this.employeeNumber = params.id;
        await this.loadEmployeeData();
        this.showModal();
        this.setupEventListeners();
    },
    
    loadEmployeeData: async function() {
        const result = await API.getEmployeeById(this.employeeNumber);
        
        if(result.error) {
            Utils.showToast(result.error, 'error');
            return null;
        }
        
        this.employeeData = result;
        return result;
    },
    
    showModal: function() {
        // Check if modal already exists
        let modal = document.getElementById('employeeViewModal');
        
        if(!modal) {
            // Load modal HTML
            this.loadModalHTML();
        } else {
            this.renderContent();
            modal.classList.add('active');
        }
    },
    
    loadModalHTML: async function() {
        const response = await fetch('pages/employee/view.html');
        const html = await response.text();
        
        // Insert modal into page
        const modalContainer = document.getElementById('modalContainer');
        if(modalContainer) {
            modalContainer.innerHTML = html;
        } else {
            // Create modal container if not exists
            const container = document.createElement('div');
            container.id = 'modalContainer';
            document.body.appendChild(container);
            container.innerHTML = html;
        }
        
        this.modal = document.getElementById('employeeViewModal');
        this.renderContent();
        this.modal.classList.add('active');
    },
    
    renderContent: function() {
        const body = document.getElementById('employeeViewBody');
        if(!body || !this.employeeData) return;
        
        const emp = this.employeeData;
        const age = this.calculateAge(emp.dob);
        
        body.innerHTML = `
            <div class="profile-header">
                <div class="profile-avatar"><i class="fas fa-user-circle"></i></div>
                <div class="profile-info">
                    <h2>${Utils.escapeHtml(emp.name)}</h2>
                    <div class="designation">${Utils.escapeHtml(emp.designation || 'N/A')}</div>
                    <div class="profile-meta">
                        <span class="badge"><i class="fas fa-id-card"></i> ${Utils.escapeHtml(emp.employeeNumber)}</span>
                        <span class="badge status-${emp.status?.toLowerCase() === 'active' ? 'active' : 'inactive'}">${emp.status || 'Active'}</span>
                    </div>
                </div>
            </div>
            
            <div class="profile-tabs">
                <button class="tab-btn active" data-tab="personal"><i class="fas fa-user"></i> Personal</button>
                <button class="tab-btn" data-tab="employment"><i class="fas fa-briefcase"></i> Employment</button>
                <button class="tab-btn" data-tab="education"><i class="fas fa-graduation-cap"></i> Education</button>
                <button class="tab-btn" data-tab="guarantor"><i class="fas fa-handshake"></i> Guarantors</button>
                <button class="tab-btn" data-tab="documents"><i class="fas fa-folder"></i> Documents</button>
            </div>
            
            <div id="tab-personal" class="tab-pane active">
                <div class="info-section">
                    <div class="info-section-header"><i class="fas fa-id-card"></i><h4>Basic Information</h4></div>
                    <div class="info-section-body">
                        <div class="info-grid">
                            <div class="info-row"><span class="info-label">Full Name:</span><span class="info-value">${Utils.escapeHtml(emp.name)}</span></div>
                            <div class="info-row"><span class="info-label">Sex:</span><span class="info-value">${Utils.escapeHtml(emp.sex || 'N/A')}</span></div>
                            <div class="info-row"><span class="info-label">Nationality:</span><span class="info-value">${Utils.escapeHtml(emp.nationality || 'N/A')}</span></div>
                            <div class="info-row"><span class="info-label">Date of Birth:</span><span class="info-value">${Utils.formatDisplayDate(emp.dob)} (${age} yrs)</span></div>
                            <div class="info-row"><span class="info-label">Place of Birth:</span><span class="info-value">${Utils.escapeHtml(emp.placeOfBirth || 'N/A')}</span></div>
                            <div class="info-row"><span class="info-label">ID Type:</span><span class="info-value">${Utils.escapeHtml(emp.idType || 'N/A')}</span></div>
                            <div class="info-row"><span class="info-label">ID Number:</span><span class="info-value">${Utils.escapeHtml(emp.idNumber || 'N/A')}</span></div>
                        </div>
                    </div>
                </div>
                
                <div class="info-section">
                    <div class="info-section-header"><i class="fas fa-phone"></i><h4>Contact Information</h4></div>
                    <div class="info-section-body">
                        <div class="info-grid">
                            <div class="info-row"><span class="info-label">Phone:</span><span class="info-value">${Utils.escapeHtml(emp.contactTelephone || 'N/A')}</span></div>
                            <div class="info-row"><span class="info-label">Residence:</span><span class="info-value">${Utils.escapeHtml(emp.residence || 'N/A')}</span></div>
                            <div class="info-row"><span class="info-label">Digital Address:</span><span class="info-value">${Utils.escapeHtml(emp.digitalAddress || 'N/A')}</span></div>
                            <div class="info-row"><span class="info-label">Landmark:</span><span class="info-value">${Utils.escapeHtml(emp.landmark || 'N/A')}</span></div>
                            <div class="info-row"><span class="info-label">Residence Type:</span><span class="info-value">${Utils.escapeHtml(emp.residenceType || 'N/A')}</span></div>
                        </div>
                    </div>
                </div>
                
                <div class="info-section">
                    <div class="info-section-header"><i class="fas fa-heart"></i><h4>Family Information</h4></div>
                    <div class="info-section-body">
                        <div class="info-grid">
                            <div class="info-row"><span class="info-label">Marital Status:</span><span class="info-value">${Utils.escapeHtml(emp.maritalStatus || 'N/A')}</span></div>
                            <div class="info-row"><span class="info-label">Spouse:</span><span class="info-value">${Utils.escapeHtml(emp.spouseName || 'N/A')}</span></div>
                            <div class="info-row"><span class="info-label">Children:</span><span class="info-value">${emp.childrenCount || 0}</span></div>
                            <div class="info-row"><span class="info-label">Father:</span><span class="info-value">${Utils.escapeHtml(emp.fatherName || 'N/A')}</span></div>
                            <div class="info-row"><span class="info-label">Mother:</span><span class="info-value">${Utils.escapeHtml(emp.motherName || 'N/A')}</span></div>
                            <div class="info-row"><span class="info-label">Next of Kin:</span><span class="info-value">${Utils.escapeHtml(emp.nextOfKin || 'N/A')}</span></div>
                            <div class="info-row"><span class="info-label">Kin Contact:</span><span class="info-value">${Utils.escapeHtml(emp.kinContact || 'N/A')}</span></div>
                            <div class="info-row"><span class="info-label">Kin Residence:</span><span class="info-value">${Utils.escapeHtml(emp.kinResidence || 'N/A')}</span></div>
                        </div>
                    </div>
                </div>
            </div>
            
            <div id="tab-employment" class="tab-pane">
                <div class="info-section">
                    <div class="info-section-header"><i class="fas fa-calendar"></i><h4>Appointment Details</h4></div>
                    <div class="info-section-body">
                        <div class="info-grid">
                            <div class="info-row"><span class="info-label">Date of Appointment:</span><span class="info-value">${Utils.formatDisplayDate(emp.appointmentDate)}</span></div>
                            <div class="info-row"><span class="info-label">Assumption Date:</span><span class="info-value">${Utils.formatDisplayDate(emp.assumptionDate)}</span></div>
                            <div class="info-row"><span class="info-label">Designation:</span><span class="info-value">${Utils.escapeHtml(emp.designation || 'N/A')}</span></div>
                            <div class="info-row"><span class="info-label">Department:</span><span class="info-value">${Utils.escapeHtml(emp.department || 'N/A')}</span></div>
                            <div class="info-row"><span class="info-label">Employment Type:</span><span class="info-value">${Utils.escapeHtml(emp.employmentType || 'N/A')}</span></div>
                        </div>
                    </div>
                </div>
                
                <div class="info-section">
                    <div class="info-section-header"><i class="fas fa-credit-card"></i><h4>Identification Numbers</h4></div>
                    <div class="info-section-body">
                        <div class="info-grid">
                            <div class="info-row"><span class="info-label">SSNIT Number:</span><span class="info-value">${Utils.escapeHtml(emp.ssnitNumber || 'N/A')}</span></div>
                            <div class="info-row"><span class="info-label">TIN Number:</span><span class="info-value">${Utils.escapeHtml(emp.tinNumber || 'N/A')}</span></div>
                        </div>
                    </div>
                </div>
            </div>
            
            <div id="tab-education" class="tab-pane">
                <div class="info-section">
                    <div class="info-section-header"><i class="fas fa-school"></i><h4>Secondary Education</h4></div>
                    <div class="info-section-body">
                        <div class="info-grid">
                            <div class="info-row"><span class="info-label">Institution:</span><span class="info-value">${Utils.escapeHtml(emp.secondaryInstitution || 'N/A')}</span></div>
                            <div class="info-row"><span class="info-label">Major:</span><span class="info-value">${Utils.escapeHtml(emp.secondaryMajor || 'N/A')}</span></div>
                            <div class="info-row"><span class="info-label">Year:</span><span class="info-value">${Utils.escapeHtml(emp.secondaryYear || 'N/A')}</span></div>
                        </div>
                    </div>
                </div>
                
                <div class="info-section">
                    <div class="info-section-header"><i class="fas fa-university"></i><h4>Tertiary Education</h4></div>
                    <div class="info-section-body">
                        <div class="info-grid">
                            <div class="info-row"><span class="info-label">Institution:</span><span class="info-value">${Utils.escapeHtml(emp.tertiaryInstitution || 'N/A')}</span></div>
                            <div class="info-row"><span class="info-label">Major:</span><span class="info-value">${Utils.escapeHtml(emp.tertiaryMajor || 'N/A')}</span></div>
                            <div class="info-row"><span class="info-label">Year:</span><span class="info-value">${Utils.escapeHtml(emp.tertiaryYear || 'N/A')}</span></div>
                        </div>
                    </div>
                </div>
                
                <div class="info-section">
                    <div class="info-section-header"><i class="fas fa-certificate"></i><h4>Professional Education</h4></div>
                    <div class="info-section-body">
                        <div class="info-grid">
                            <div class="info-row"><span class="info-label">Institution:</span><span class="info-value">${Utils.escapeHtml(emp.professionalInstitution || 'N/A')}</span></div>
                            <div class="info-row"><span class="info-label">Major:</span><span class="info-value">${Utils.escapeHtml(emp.professionalMajor || 'N/A')}</span></div>
                            <div class="info-row"><span class="info-label">Year:</span><span class="info-value">${Utils.escapeHtml(emp.professionalYear || 'N/A')}</span></div>
                        </div>
                    </div>
                </div>
            </div>
            
            <div id="tab-guarantor" class="tab-pane">
                <div class="guarantors-row">
                    <div class="guarantor-card">
                        <h5><i class="fas fa-user-check"></i> Guarantor 1</h5>
                        <div class="info-row"><span class="info-label">Name:</span><span class="info-value">${Utils.escapeHtml(emp.guarantor1Name || 'N/A')}</span></div>
                        <div class="info-row"><span class="info-label">Contact:</span><span class="info-value">${Utils.escapeHtml(emp.guarantor1Contact || 'N/A')}</span></div>
                        <div class="info-row"><span class="info-label">Address:</span><span class="info-value">${Utils.escapeHtml(emp.guarantor1Address || 'N/A')}</span></div>
                        <div class="info-row"><span class="info-label">Email:</span><span class="info-value">${Utils.escapeHtml(emp.guarantor1Email || 'N/A')}</span></div>
                    </div>
                    <div class="guarantor-card">
                        <h5><i class="fas fa-user-check"></i> Guarantor 2</h5>
                        <div class="info-row"><span class="info-label">Name:</span><span class="info-value">${Utils.escapeHtml(emp.guarantor2Name || 'N/A')}</span></div>
                        <div class="info-row"><span class="info-label">Contact:</span><span class="info-value">${Utils.escapeHtml(emp.guarantor2Contact || 'N/A')}</span></div>
                        <div class="info-row"><span class="info-label">Address:</span><span class="info-value">${Utils.escapeHtml(emp.guarantor2Address || 'N/A')}</span></div>
                        <div class="info-row"><span class="info-label">Email:</span><span class="info-value">${Utils.escapeHtml(emp.guarantor2Email || 'N/A')}</span></div>
                    </div>
                </div>
            </div>
            
            <div id="tab-documents" class="tab-pane">
                <div class="documents-list" id="empDocumentsList">
                    <div class="loader-small">Loading documents...</div>
                </div>
            </div>
        `;
        
        // Setup tabs
        this.setupTabs();
        
        // Load documents
        this.loadDocuments();
    },
    
    setupTabs: function() {
        const tabs = document.querySelectorAll('.tab-btn');
        tabs.forEach(btn => {
            btn.onclick = () => {
                const tabName = btn.dataset.tab;
                this.currentTab = tabName;
                
                // Update active tab
                tabs.forEach(t => t.classList.remove('active'));
                btn.classList.add('active');
                
                // Update panes
                document.querySelectorAll('.tab-pane').forEach(pane => {
                    pane.classList.remove('active');
                });
                const activePane = document.getElementById(`tab-${tabName}`);
                if(activePane) activePane.classList.add('active');
            };
        });
    },
    
    loadDocuments: async function() {
        const container = document.getElementById('empDocumentsList');
        if(!container) return;
        
        const docs = await API.getEmployeeDocuments(this.employeeNumber);
        
        if(!docs || docs.length === 0) {
            container.innerHTML = '<div class="empty-state"><i class="fas fa-folder-open"></i><p>No documents found</p></div>';
            return;
        }
        
        container.innerHTML = docs.map(doc => `
            <div class="doc-item">
                <div class="doc-info">
                    <i class="fas ${Utils.getFileIcon(doc.mimeType)}"></i>
                    <div>
                        <div class="doc-name">${Utils.escapeHtml(doc.fileName)}</div>
                        <div class="doc-date">${Utils.formatDisplayDate(doc.uploadDate)}</div>
                    </div>
                </div>
                <button class="doc-action" onclick="EmployeeView.downloadDoc('${doc.fileUrl}', '${doc.fileName}')">
                    <i class="fas fa-download"></i>
                </button>
            </div>
        `).join('');
    },
    
    setupEventListeners: function() {
        // Edit button
        const editBtn = document.getElementById('viewEditBtn');
        if(editBtn) {
            editBtn.onclick = () => {
                this.close();
                Router.navigate('employee-edit', { id: this.employeeNumber });
            };
        }
        
        // Print button
        const printBtn = document.getElementById('viewPrintBtn');
        if(printBtn) {
            printBtn.onclick = () => this.printProfile();
        }
    },
    
    calculateAge: function(dob) {
        if(!dob) return 'N/A';
        const birthDate = new Date(dob);
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        if(m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
        return age;
    },
    
    downloadDoc: function(url, filename) {
        window.open(url, '_blank');
    },
    
    printProfile: function() {
        const printContent = document.querySelector('#employeeViewBody').cloneNode(true);
        const win = window.open('', '_blank');
        win.document.write(`
            <!DOCTYPE html>
            <html>
            <head><title>Employee Profile</title>
            <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" rel="stylesheet">
            <style>
                body{font-family:Arial,sans-serif;padding:20px}
                .profile-header{background:#1e293b;padding:20px;color:white;border-radius:10px}
                .info-section{margin-bottom:20px;border:1px solid #ddd;border-radius:8px}
                .info-section-header{background:#f5f5f5;padding:10px;border-bottom:1px solid #ddd}
                .info-section-body{padding:15px}
                .info-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:10px}
                .info-row{display:flex;padding:5px 0}
                .info-label{width:130px;font-weight:bold}
                @media print{.profile-tabs,.modal-footer,.doc-action{display:none}}
            </style>
            </head>
            <body>${printContent.innerHTML}</body>
            </html>
        `);
        win.document.close();
        win.print();
    },
    
    close: function() {
        const modal = document.getElementById('employeeViewModal');
        if(modal) {
            modal.classList.remove('active');
        }
    }
};

window.EmployeeView = EmployeeView;
