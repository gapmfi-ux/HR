// employee-documents.js
const EmployeeDocuments = {
    currentEmployee: null,
    currentEmployeeNumber: null,
    
    /**
     * Initialize employee documents page
     */
    async init(params = {}) {
        console.log('Initializing Employee Documents', params);
        this.setupEventListeners();
        
        if (params.id) {
            this.currentEmployeeNumber = params.id;
            await this.loadEmployeeInfo();
            await this.loadDocuments();
            this.showDocumentsSection();
        }
    },
    
    /**
     * Setup event listeners
     */
    setupEventListeners() {
        const searchBtn = document.getElementById('searchEmployeeBtn');
        if (searchBtn) {
            searchBtn.onclick = () => this.searchEmployee();
        }
        
        const searchInput = document.getElementById('searchEmployeeNumber');
        if (searchInput) {
            searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') this.searchEmployee();
            });
        }
        
        const uploadBtn = document.getElementById('uploadDocBtn');
        if (uploadBtn) {
            uploadBtn.onclick = () => this.uploadDocument();
        }
        
        const fileInput = document.getElementById('docFile');
        if (fileInput) {
            fileInput.onchange = () => this.validateFile();
        }
    },
    
    /**
     * Search for employee
     */
    async searchEmployee() {
        const empNumber = document.getElementById('searchEmployeeNumber').value.trim();
        if (!empNumber) {
            Utils.showToast('Please enter an employee number', 'error');
            return;
        }
        
        Utils.showLoading();
        const result = await API.getEmployeeById(empNumber);
        Utils.hideLoading();
        
        if (result.error) {
            Utils.showToast(result.error, 'error');
            return;
        }
        
        this.currentEmployee = result;
        this.currentEmployeeNumber = empNumber;
        
        this.displayEmployeeInfo();
        await this.loadDocuments();
        this.showDocumentsSection();
    },
    
    /**
     * Load employee info by number
     */
    async loadEmployeeInfo() {
        if (!this.currentEmployeeNumber) return;
        
        const result = await API.getEmployeeById(this.currentEmployeeNumber);
        if (!result.error) {
            this.currentEmployee = result;
            this.displayEmployeeInfo();
        }
    },
    
    /**
     * Display employee information
     */
    displayEmployeeInfo() {
        const section = document.getElementById('employeeInfoSection');
        if (!section) return;
        
        document.getElementById('empNameDisplay').textContent = this.currentEmployee?.name || 'N/A';
        document.getElementById('empDeptDisplay').textContent = this.currentEmployee?.department || 'N/A';
        document.getElementById('empNumberDisplay').textContent = this.currentEmployee?.employeeNumber || 'N/A';
        
        section.style.display = 'block';
    },
    
    /**
     * Show documents section
     */
    showDocumentsSection() {
        const gridContainer = document.getElementById('documentsGridContainer');
        if (gridContainer) {
            gridContainer.style.display = 'block';
        }
    },
    
    /**
     * Validate file before upload
     */
    validateFile() {
        const fileInput = document.getElementById('docFile');
        const file = fileInput.files[0];
        
        if (!file) return;
        
        const maxSize = 5 * 1024 * 1024; // 5MB
        if (file.size > maxSize) {
            Utils.showToast('File size must be less than 5MB', 'error');
            fileInput.value = '';
            return false;
        }
        
        const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
        if (!allowedTypes.includes(file.type)) {
            Utils.showToast('Invalid file type. Please upload PDF, JPG, PNG, or DOC files', 'error');
            fileInput.value = '';
            return false;
        }
        
        return true;
    },
    
    /**
     * Upload document
     */
    async uploadDocument() {
        if (!this.currentEmployeeNumber) {
            Utils.showToast('Please search for an employee first', 'error');
            return;
        }
        
        const fileInput = document.getElementById('docFile');
        const docType = document.getElementById('docType').value;
        
        if (!fileInput.files.length) {
            Utils.showToast('Please select a file to upload', 'error');
            return;
        }
        
        if (!this.validateFile()) return;
        
        const file = fileInput.files[0];
        
        Utils.showLoading();
        
        const reader = new FileReader();
        reader.onload = async (e) => {
            const result = await API.uploadDocument({
                employeeNumber: this.currentEmployeeNumber,
                documentType: docType,
                fileName: file.name,
                fileContent: e.target.result.split(',')[1],
                mimeType: file.type
            });
            
            Utils.hideLoading();
            
            if (result.success) {
                Utils.showToast('Document uploaded successfully!', 'success');
                fileInput.value = '';
                await this.loadDocuments();
            } else {
                Utils.showToast(result.error || 'Upload failed', 'error');
            }
        };
        
        reader.readAsDataURL(file);
    },
    
    /**
     * Load all documents for current employee
     */
    async loadDocuments() {
        if (!this.currentEmployeeNumber) return;
        
        const container = document.getElementById('documentsListContainer');
        if (!container) return;
        
        container.innerHTML = '<div class="loader-container"><div class="loader"></div><p>Loading documents...</p></div>';
        
        const result = await API.getEmployeeDocuments(this.currentEmployeeNumber);
        const documents = result.documents || result || [];
        
        if (documents.length === 0) {
            container.innerHTML = `
                <div class="empty-state-small">
                    <i class="fas fa-folder-open"></i>
                    <p>No documents found for this employee</p>
                </div>
            `;
            return;
        }
        
        // Group documents by type
        const grouped = {};
        documents.forEach(doc => {
            if (!grouped[doc.documentType]) {
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
                                    <div class="document-name">${Utils.escapeHtml(doc.fileName)}</div>
                                    <div class="document-meta">
                                        <span class="document-date">
                                            <i class="fas fa-calendar-alt"></i> ${Utils.formatDisplayDate(doc.uploadDate)}
                                        </span>
                                        <span class="document-size">${Utils.formatFileSize(doc.fileSize)}</span>
                                    </div>
                                </div>
                                <div class="document-actions">
                                    <button class="doc-action-btn view" onclick="EmployeeDocuments.downloadDocument('${doc.fileUrl}', '${doc.fileName}')">
                                        <i class="fas fa-download"></i> Download
                                    </button>
                                    <button class="doc-action-btn delete" onclick="EmployeeDocuments.deleteDocument('${doc.fileId}')">
                                        <i class="fas fa-trash"></i> Delete
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
    
    /**
     * Get display name for document type
     */
    getDocumentTypeName(type) {
        const names = {
            'ID': 'Identification Documents',
            'Certificate': 'Certificates',
            'Degree': 'Degrees & Diplomas',
            'Professional': 'Professional Certifications',
            'CV': 'CV / Resume',
            'Contract': 'Employment Contracts',
            'Other': 'Other Documents'
        };
        return names[type] || type;
    },
    
    /**
     * Download document
     */
    downloadDocument(url, filename) {
        window.open(url, '_blank');
    },
    
    /**
     * Delete document
     */
    async deleteDocument(fileId) {
        const confirmed = await Utils.confirm('Are you sure you want to delete this document?', 'Confirm Delete');
        if (confirmed) {
            Utils.showLoading();
            const result = await API.deleteDocument(fileId);
            Utils.hideLoading();
            
            if (result.success) {
                Utils.showToast('Document deleted successfully', 'success');
                await this.loadDocuments();
            } else {
                Utils.showToast(result.error || 'Delete failed', 'error');
            }
        }
    }
};

window.EmployeeDocuments = EmployeeDocuments;
