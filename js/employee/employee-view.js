// employee-view.js
const EmployeeView = {
    employeeNumber: null,
    employeeData: null,
    
    /**
     * Initialize employee view
     */
    async init(params = {}) {
        console.log('Initializing Employee View', params);
        
        if (!params.id) {
            Utils.showToast('No employee specified', 'error');
            Router.navigate('employee-list');
            return;
        }
        
        this.employeeNumber = params.id;
        await this.loadEmployeeData();
        this.setupEventListeners();
    },
    
    /**
     * Setup event listeners
     */
    setupEventListeners() {
        const editBtn = document.getElementById('editEmployeeBtn');
        if (editBtn) {
            editBtn.onclick = () => Router.navigate('employee-edit', { id: this.employeeNumber });
        }
        
        const printBtn = document.getElementById('printProfileBtn');
        if (printBtn) {
            printBtn.onclick = () => this.printProfile();
        }
        
        // Tab switching
        const tabBtns = document.querySelectorAll('.profile-tabs .tab-btn');
        tabBtns.forEach(btn => {
            btn.onclick = () => this.switchTab(btn.dataset.tab);
        });
    },
    
    /**
     * Load employee data from API
     */
    async loadEmployeeData() {
        Utils.showLoading();
        const result = await API.getEmployeeById(this.employeeNumber);
        Utils.hideLoading();
        
        if (result.error) {
            Utils.showToast(result.error, 'error');
            Router.navigate('employee-list');
            return;
        }
        
        this.employeeData = result;
        this.renderProfile();
    },
    
    /**
     * Render employee profile
     */
    renderProfile() {
        const container = document.getElementById('employeeProfileContainer');
        const template = document.getElementById('profileTemplate');
        
        if (!container || !template) return;
        
        const data = this.employeeData;
        const age = this.calculateAge(data.dob);
        const yearsOfService = this.calculateYearsOfService(data.appointmentDate);
        
        // Create a copy of the template content
        const content = template.content.cloneNode(true);
        let html = content.firstElementChild.outerHTML;
        
        // Replace all placeholders
        const replacements = {
            '{employeeNumber}': data.employeeNumber || 'N/A',
            '{name}': data.name || 'N/A',
            '{sex}': data.sex || 'N/A',
            '{nationality}': data.nationality || 'N/A',
            '{idType}': data.idType || 'N/A',
            '{idNumber}': data.idNumber || 'N/A',
            '{dob}': Utils.formatDisplayDate(data.dob),
            '{placeOfBirth}': data.placeOfBirth || 'N/A',
            '{age}': age,
            '{contactTelephone}': data.contactTelephone || 'N/A',
            '{email}': data.email || 'N/A',
            '{residence}': data.residence || 'N/A',
            '{digitalAddress}': data.digitalAddress || 'N/A',
            '{landmark}': data.landmark || 'N/A',
            '{residenceType}': data.residenceType || 'N/A',
            '{maritalStatus}': data.maritalStatus || 'N/A',
            '{spouseName}': data.spouseName || 'N/A',
            '{childrenCount}': data.childrenCount || '0',
            '{fatherName}': data.fatherName || 'N/A',
            '{motherName}': data.motherName || 'N/A',
            '{nextOfKin}': data.nextOfKin || 'N/A',
            '{kinContact}': data.kinContact || 'N/A',
            '{kinResidence}': data.kinResidence || 'N/A',
            '{appointmentDate}': Utils.formatDisplayDate(data.appointmentDate),
            '{assumptionDate}': Utils.formatDisplayDate(data.assumptionDate),
            '{yearsOfService}': yearsOfService,
            '{designation}': data.designation || 'N/A',
            '{department}': data.department || 'N/A',
            '{employmentType}': data.employmentType || 'N/A',
            '{ssnitNumber}': data.ssnitNumber || 'N/A',
            '{tinNumber}': data.tinNumber || 'N/A',
            '{secondaryInstitution}': data.secondaryInstitution || 'N/A',
            '{secondaryMajor}': data.secondaryMajor || 'N/A',
            '{secondaryYear}': data.secondaryYear || 'N/A',
            '{tertiaryInstitution}': data.tertiaryInstitution || 'N/A',
            '{tertiaryMajor}': data.tertiaryMajor || 'N/A',
            '{tertiaryYear}': data.tertiaryYear || 'N/A',
            '{professionalInstitution}': data.professionalInstitution || 'N/A',
            '{professionalMajor}': data.professionalMajor || 'N/A',
            '{professionalYear}': data.professionalYear || 'N/A',
            '{guarantor1Name}': data.guarantor1Name || 'N/A',
            '{guarantor1Contact}': data.guarantor1Contact || 'N/A',
            '{guarantor1Address}': data.guarantor1Address || 'N/A',
            '{guarantor1Email}': data.guarantor1Email || 'N/A',
            '{guarantor2Name}': data.guarantor2Name || 'N/A',
            '{guarantor2Contact}': data.guarantor2Contact || 'N/A',
            '{guarantor2Address}': data.guarantor2Address || 'N/A',
            '{guarantor2Email}': data.guarantor2Email || 'N/A',
            '{status}': data.status || 'Active',
            '{statusClass}': (data.status || 'Active').toLowerCase()
        };
        
        for (const [placeholder, value] of Object.entries(replacements)) {
            const regex = new RegExp(placeholder, 'g');
            html = html.replace(regex, Utils.escapeHtml(String(value)));
        }
        
        container.innerHTML = html;
        
        // Load documents after profile is rendered
        this.loadDocuments();
        
        // Set active tab
        this.switchTab('personal');
    },
    
    /**
     * Calculate age from date of birth
     */
    calculateAge(dob) {
        if (!dob) return 'N/A';
        const birthDate = new Date(dob);
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        return age;
    },
    
    /**
     * Calculate years of service
     */
    calculateYearsOfService(appointmentDate) {
        if (!appointmentDate) return 'N/A';
        const startDate = new Date(appointmentDate);
        const today = new Date();
        let years = today.getFullYear() - startDate.getFullYear();
        const m = today.getMonth() - startDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < startDate.getDate())) {
            years--;
        }
        return `${years} year(s)`;
    },
    
    /**
     * Switch between profile tabs
     */
    switchTab(tabId) {
        // Update tab buttons
        document.querySelectorAll('.profile-tabs .tab-btn').forEach(btn => {
            if (btn.dataset.tab === tabId) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
        
        // Update tab panes
        document.querySelectorAll('.profile-tabs ~ .tab-pane').forEach(pane => {
            pane.classList.remove('active');
        });
        
        const activePane = document.getElementById(`profile-${tabId}`);
        if (activePane) {
            activePane.classList.add('active');
        }
    },
    
    /**
     * Load employee documents
     */
    async loadDocuments() {
        const result = await API.getEmployeeDocuments(this.employeeNumber);
        const documents = result.documents || result || [];
        
        const container = document.getElementById('profileDocumentsContainer');
        if (!container) return;
        
        if (documents.length === 0) {
            container.innerHTML = `
                <div class="empty-state-small">
                    <i class="fas fa-folder-open"></i>
                    <p>No documents found for this employee</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = documents.map(doc => `
            <div class="document-card">
                <div class="document-icon">
                    <i class="fas ${Utils.getFileIcon(doc.mimeType)}"></i>
                </div>
                <div class="document-details">
                    <div class="document-name">${Utils.escapeHtml(doc.fileName)}</div>
                    <div class="document-meta">
                        <span class="document-type">${Utils.escapeHtml(doc.documentType)}</span>
                        <span class="document-date">${Utils.formatDisplayDate(doc.uploadDate)}</span>
                    </div>
                </div>
                <div class="document-actions">
                    <button class="doc-action-btn" onclick="EmployeeView.downloadDocument('${doc.fileUrl}', '${doc.fileName}')">
                        <i class="fas fa-download"></i>
                    </button>
                </div>
            </div>
        `).join('');
    },
    
    /**
     * Download document
     */
    downloadDocument(url, filename) {
        window.open(url, '_blank');
    },
    
    /**
     * Print employee profile
     */
    printProfile() {
        const printContent = document.querySelector('.employee-profile').cloneNode(true);
        
        // Remove action buttons for print
        printContent.querySelectorAll('.document-actions, .btn, .action-btn, #editEmployeeBtn, #printProfileBtn').forEach(el => {
            if (el) el.remove();
        });
        
        const printWindow = window.open('', '_blank');
        printWindow.document.write(`
            <!DOCTYPE html>
            <html>
            <head>
                <title>Employee Profile - ${this.employeeData.employeeNumber}</title>
                <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
                <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
                <style>
                    * { margin: 0; padding: 0; box-sizing: border-box; }
                    body { font-family: 'Inter', sans-serif; padding: 40px; background: white; }
                    .employee-profile { max-width: 1200px; margin: 0 auto; }
                    .profile-header { display: flex; gap: 24px; margin-bottom: 32px; padding-bottom: 24px; border-bottom: 2px solid #3b82f6; }
                    .profile-avatar i { font-size: 80px; color: #3b82f6; }
                    .employee-name { font-size: 28px; margin-bottom: 8px; }
                    .info-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(350px, 1fr)); gap: 24px; margin-bottom: 24px; }
                    .info-card { border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; }
                    .info-card h3 { margin-bottom: 16px; color: #3b82f6; }
                    .info-row { display: flex; padding: 8px 0; border-bottom: 1px solid #f1f5f9; }
                    .info-label { width: 140px; font-weight: 600; color: #64748b; }
                    .info-value { flex: 1; color: #1e293b; }
                    @media print {
                        body { padding: 20px; }
                        .info-card { break-inside: avoid; }
                    }
                </style>
            </head>
            <body>
                ${printContent.outerHTML}
                <script>window.onload = () => window.print();<\/script>
            </body>
            </html>
        `);
        printWindow.document.close();
    }
};

window.EmployeeView = EmployeeView;
