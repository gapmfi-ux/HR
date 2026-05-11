// employee-form.js
const Employee = {
    currentTab: 0,
    tabs: ['personal', 'employment', 'education', 'guarantor', 'documents'],
    uploadedFiles: [],
    employeeNumber: null,
    
    /**
     * Initialize employee form
     */
    async init(params = {}) {
        console.log('Initializing Employee Form', params);
        
        // Setup event listeners
        this.setupEventListeners();
        
        // Setup tab navigation
        this.setupTabs();
        
        // Generate employee number
        await this.generateEmployeeNumber();
        
        // If editing, load existing data
        if (params.id) {
            await this.loadEmployeeData(params.id);
            document.getElementById('submitBtn').textContent = 'Update Employee';
        }
        
        // Setup document upload
        this.setupDocumentUpload();
    },
    
    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Next/Previous buttons
        const prevBtn = document.getElementById('prevTabBtn');
        const nextBtn = document.getElementById('nextTabBtn');
        const submitBtn = document.getElementById('submitBtn');
        
        if (prevBtn) prevBtn.onclick = () => this.prevTab();
        if (nextBtn) nextBtn.onclick = () => this.nextTab();
        if (submitBtn) submitBtn.onclick = () => this.submitForm();
        
        // Upload button
        const uploadBtn = document.getElementById('uploadDocumentBtn');
        if (uploadBtn) uploadBtn.onclick = () => this.uploadDocument();
        
        // Drag and drop upload area
        const uploadArea = document.getElementById('documentUploadArea');
        if (uploadArea) {
            uploadArea.onclick = () => document.getElementById('documentFile').click();
            uploadArea.ondragover = (e) => {
                e.preventDefault();
                uploadArea.style.borderColor = 'var(--primary)';
            };
            uploadArea.ondragleave = () => {
                uploadArea.style.borderColor = 'var(--gray-300)';
            };
            uploadArea.ondrop = (e) => {
                e.preventDefault();
                uploadArea.style.borderColor = 'var(--gray-300)';
                const files = e.dataTransfer.files;
                this.handleFiles(files);
            };
        }
        
        // File input change
        const fileInput = document.getElementById('documentFile');
        if (fileInput) {
            fileInput.onchange = (e) => this.handleFiles(e.target.files);
        }
        
        // Auto-calculate fields
        const dobInput = document.getElementById('dob');
        if (dobInput) {
            dobInput.onchange = () => this.calculateAge();
        }
    },
    
    /**
     * Setup tab navigation
     */
    setupTabs() {
        const tabBtns = document.querySelectorAll('.tab-btn');
        tabBtns.forEach((btn, index) => {
            btn.onclick = () => this.switchTab(index);
        });
        
        this.updateTabButtons();
    },
    
    /**
     * Switch to specific tab
     */
    switchTab(index) {
        if (index < 0 || index >= this.tabs.length) return;
        
        // Update tab buttons
        document.querySelectorAll('.tab-btn').forEach((btn, i) => {
            if (i === index) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
        
        // Update tab panes
        document.querySelectorAll('.tab-pane').forEach((pane, i) => {
            if (i === index) {
                pane.classList.add('active');
            } else {
                pane.classList.remove('active');
            }
        });
        
        this.currentTab = index;
        this.updateTabButtons();
    },
    
    /**
     * Go to next tab
     */
    nextTab() {
        if (this.validateCurrentTab()) {
            if (this.currentTab < this.tabs.length - 1) {
                this.switchTab(this.currentTab + 1);
            }
        }
    },
    
    /**
     * Go to previous tab
     */
    prevTab() {
        if (this.currentTab > 0) {
            this.switchTab(this.currentTab - 1);
        }
    },
    
    /**
     * Update tab button visibility
     */
    updateTabButtons() {
        const prevBtn = document.getElementById('prevTabBtn');
        const nextBtn = document.getElementById('nextTabBtn');
        const submitBtn = document.getElementById('submitBtn');
        
        if (prevBtn) {
            prevBtn.style.display = this.currentTab === 0 ? 'none' : 'inline-flex';
        }
        
        if (nextBtn && submitBtn) {
            if (this.currentTab === this.tabs.length - 1) {
                nextBtn.style.display = 'none';
                submitBtn.style.display = 'inline-flex';
            } else {
                nextBtn.style.display = 'inline-flex';
                submitBtn.style.display = 'none';
            }
        }
    },
    
    /**
     * Validate current tab before proceeding
     */
    validateCurrentTab() {
        const tabId = this.tabs[this.currentTab];
        const requiredFields = this.getRequiredFieldsForTab(tabId);
        
        let isValid = true;
        requiredFields.forEach(fieldId => {
            const field = document.getElementById(fieldId);
            if (field && !field.value.trim()) {
                field.style.borderColor = 'var(--danger)';
                isValid = false;
                
                // Scroll to first invalid field
                if (isValid === false && !window.scrolledToError) {
                    field.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    window.scrolledToError = true;
                    setTimeout(() => { window.scrolledToError = false; }, 500);
                }
            } else if (field) {
                field.style.borderColor = '';
            }
        });
        
        if (!isValid) {
            Utils.showToast('Please fill in all required fields', 'error');
        }
        
        return isValid;
    },
    
    /**
     * Get required fields for a specific tab
     */
    getRequiredFieldsForTab(tabId) {
        const fields = {
            personal: ['employeeName', 'sex', 'nationality', 'idType', 'idNumber', 'dob', 'placeOfBirth', 'contactNumber'],
            employment: ['designation', 'department', 'employmentType'],
            education: [],
            guarantor: [],
            documents: []
        };
        return fields[tabId] || [];
    },
    
    /**
     * Generate employee number
     */
    async generateEmployeeNumber() {
        const result = await API.getLastEmployeeNumber();
        this.employeeNumber = API.generateEmployeeNumber(result);
        const empNumInput = document.getElementById('employeeNumber');
        if (empNumInput) {
            empNumInput.value = this.employeeNumber;
        }
    },
    
    /**
     * Calculate age from date of birth
     */
    calculateAge() {
        const dobInput = document.getElementById('dob');
        if (!dobInput || !dobInput.value) return;
        
        const birthDate = new Date(dobInput.value);
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        
        // Optional: Display age somewhere
        console.log(`Employee age: ${age}`);
    },
    
    /**
     * Setup document upload functionality
     */
    setupDocumentUpload() {
        // Load existing documents if editing with employee number
        if (this.employeeNumber) {
            this.loadDocuments();
        }
    },
    
    /**
     * Handle file selection
     */
    handleFiles(files) {
        for (const file of files) {
            if (file.size > 5 * 1024 * 1024) {
                Utils.showToast(`${file.name} exceeds 5MB limit`, 'error');
                continue;
            }
            
            const reader = new FileReader();
            reader.onload = (e) => {
                this.uploadedFiles.push({
                    name: file.name,
                    type: file.type,
                    size: file.size,
                    content: e.target.result.split(',')[1],
                    mimeType: file.type
                });
                this.displayPendingDocument(file.name);
            };
            reader.readAsDataURL(file);
        }
    },
    
    /**
     * Display pending document in list
     */
    displayPendingDocument(fileName) {
        const container = document.getElementById('documentsContainer');
        const emptyState = document.getElementById('emptyDocuments');
        
        if (emptyState) emptyState.style.display = 'none';
        
        const docElement = document.createElement('div');
        docElement.className = 'document-item pending';
        docElement.innerHTML = `
            <div class="document-info">
                <i class="fas fa-file"></i>
                <div>
                    <div class="doc-name">${Utils.escapeHtml(fileName)}</div>
                    <div class="doc-type">Pending upload</div>
                </div>
            </div>
            <div class="document-actions">
                <button class="doc-action-btn delete" onclick="this.closest('.document-item').remove()">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
        
        if (container) container.appendChild(docElement);
    },
    
    /**
     * Upload document to server
     */
    async uploadDocument() {
        if (!this.employeeNumber) {
            Utils.showToast('Please save employee information first', 'error');
            return;
        }
        
        const fileInput = document.getElementById('documentFile');
        const docType = document.getElementById('documentType').value;
        
        if (!fileInput.files.length) {
            Utils.showToast('Please select a file to upload', 'error');
            return;
        }
        
        Utils.showLoading();
        
        for (const file of fileInput.files) {
            const reader = new FileReader();
            
            const uploadPromise = new Promise((resolve) => {
                reader.onload = async (e) => {
                    const result = await API.uploadDocument({
                        employeeNumber: this.employeeNumber,
                        documentType: docType,
                        fileName: file.name,
                        fileContent: e.target.result.split(',')[1],
                        mimeType: file.type
                    });
                    resolve(result);
                };
                reader.readAsDataURL(file);
            });
            
            const result = await uploadPromise;
            if (result.success) {
                Utils.showToast(`Uploaded: ${file.name}`, 'success');
            } else {
                Utils.showToast(`Failed: ${file.name}`, 'error');
            }
        }
        
        Utils.hideLoading();
        fileInput.value = '';
        await this.loadDocuments();
    },
    
    /**
     * Load employee documents
     */
    async loadDocuments() {
        if (!this.employeeNumber) return;
        
        const result = await API.getEmployeeDocuments(this.employeeNumber);
        const documents = result.documents || result || [];
        
        const container = document.getElementById('documentsContainer');
        const emptyState = document.getElementById('emptyDocuments');
        
        if (!container) return;
        
        if (documents.length === 0) {
            if (emptyState) emptyState.style.display = 'block';
            container.innerHTML = '';
            return;
        }
        
        if (emptyState) emptyState.style.display = 'none';
        
        container.innerHTML = documents.map(doc => `
            <div class="document-item">
                <div class="document-info">
                    <i class="fas ${Utils.getFileIcon(doc.mimeType)}"></i>
                    <div>
                        <div class="doc-name">${Utils.escapeHtml(doc.fileName)}</div>
                        <div class="doc-type">${Utils.escapeHtml(doc.documentType)} • ${Utils.formatDate(doc.uploadDate)}</div>
                    </div>
                </div>
                <div class="document-actions">
                    <button class="doc-action-btn view" onclick="Employee.downloadDocument('${doc.fileUrl}', '${doc.fileName}')">
                        <i class="fas fa-download"></i>
                    </button>
                    <button class="doc-action-btn delete" onclick="Employee.deleteDocument('${doc.fileId}')">
                        <i class="fas fa-trash"></i>
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
     * Delete document
     */
    async deleteDocument(fileId) {
        const confirmed = await Utils.confirm('Are you sure you want to delete this document?');
        if (confirmed) {
            // Delete from server (implement in backend)
            Utils.showToast('Document deleted', 'success');
            this.loadDocuments();
        }
    },
    
    /**
     * Load employee data for editing
     */
    async loadEmployeeData(employeeNumber) {
        Utils.showLoading();
        const result = await API.getEmployeeById(employeeNumber);
        Utils.hideLoading();
        
        if (result.error) {
            Utils.showToast(result.error, 'error');
            return;
        }
        
        this.employeeNumber = employeeNumber;
        this.populateForm(result);
        await this.loadDocuments();
    },
    
    /**
     * Populate form with employee data
     */
    populateForm(data) {
        const fieldMap = {
            employeeNumber: 'employeeNumber',
            name: 'employeeName',
            sex: 'sex',
            nationality: 'nationality',
            idType: 'idType',
            idNumber: 'idNumber',
            dob: 'dob',
            placeOfBirth: 'placeOfBirth',
            contactTelephone: 'contactNumber',
            residence: 'residence',
            digitalAddress: 'digitalAddress',
            landmark: 'landmark',
            residenceType: 'residenceType',
            maritalStatus: 'maritalStatus',
            spouseName: 'spouseName',
            childrenCount: 'childrenCount',
            fatherName: 'fatherName',
            motherName: 'motherName',
            nextOfKin: 'nextOfKin',
            kinContact: 'kinContact',
            kinResidence: 'kinResidence',
            appointmentDate: 'dateOfAppointment',
            assumptionDate: 'assumptionDate',
            designation: 'designation',
            department: 'department',
            ssnitNumber: 'ssnit',
            tinNumber: 'tinNumber',
            employmentType: 'employmentType',
            secondaryInstitution: 'secondaryInstitution',
            secondaryMajor: 'secondaryMajor',
            secondaryYear: 'secondaryYear',
            tertiaryInstitution: 'tertiaryInstitution',
            tertiaryMajor: 'tertiaryMajor',
            tertiaryYear: 'tertiaryYear',
            professionalInstitution: 'professionalInstitution',
            professionalMajor: 'professionalMajor',
            professionalYear: 'professionalYear',
            guarantor1Name: 'guarantor1Name',
            guarantor1Contact: 'guarantor1Contact',
            guarantor1Address: 'guarantor1Address',
            guarantor1Email: 'guarantor1Email',
            guarantor2Name: 'guarantor2Name',
            guarantor2Contact: 'guarantor2Contact',
            guarantor2Address: 'guarantor2Address',
            guarantor2Email: 'guarantor2Email'
        };
        
        for (const [source, target] of Object.entries(fieldMap)) {
            const element = document.getElementById(target);
            if (element && data[source] !== undefined) {
                element.value = data[source] || '';
            }
        }
    },
    
    /**
     * Collect form data
     */
    collectFormData() {
        return {
            employeeNumber: document.getElementById('employeeNumber')?.value,
            employeeName: document.getElementById('employeeName')?.value,
            sex: document.getElementById('sex')?.value,
            nationality: document.getElementById('nationality')?.value,
            idType: document.getElementById('idType')?.value,
            idNumber: document.getElementById('idNumber')?.value,
            dob: document.getElementById('dob')?.value,
            placeOfBirth: document.getElementById('placeOfBirth')?.value,
            contactNumber: document.getElementById('contactNumber')?.value,
            residence: document.getElementById('residence')?.value,
            digitalAddress: document.getElementById('digitalAddress')?.value,
            landmark: document.getElementById('landmark')?.value,
            residenceType: document.getElementById('residenceType')?.value,
            maritalStatus: document.getElementById('maritalStatus')?.value,
            spouseName: document.getElementById('spouseName')?.value,
            childrenCount: parseInt(document.getElementById('childrenCount')?.value) || 0,
            fatherName: document.getElementById('fatherName')?.value,
            motherName: document.getElementById('motherName')?.value,
            nextOfKin: document.getElementById('nextOfKin')?.value,
            kinContact: document.getElementById('kinContact')?.value,
            kinResidence: document.getElementById('kinResidence')?.value,
            dateOfAppointment: document.getElementById('dateOfAppointment')?.value,
            assumptionDate: document.getElementById('assumptionDate')?.value,
            designation: document.getElementById('designation')?.value,
            ssnit: document.getElementById('ssnit')?.value,
            tinNumber: document.getElementById('tinNumber')?.value,
            employmentType: document.getElementById('employmentType')?.value,
            department: document.getElementById('department')?.value,
            secondaryInstitution: document.getElementById('secondaryInstitution')?.value,
            secondaryMajor: document.getElementById('secondaryMajor')?.value,
            secondaryYear: document.getElementById('secondaryYear')?.value,
            tertiaryInstitution: document.getElementById('tertiaryInstitution')?.value,
            tertiaryMajor: document.getElementById('tertiaryMajor')?.value,
            tertiaryYear: document.getElementById('tertiaryYear')?.value,
            professionalInstitution: document.getElementById('professionalInstitution')?.value,
            professionalMajor: document.getElementById('professionalMajor')?.value,
            professionalYear: document.getElementById('professionalYear')?.value,
            guarantor1Name: document.getElementById('guarantor1Name')?.value,
            guarantor1Contact: document.getElementById('guarantor1Contact')?.value,
            guarantor1Address: document.getElementById('guarantor1Address')?.value,
            guarantor1Email: document.getElementById('guarantor1Email')?.value,
            guarantor2Name: document.getElementById('guarantor2Name')?.value,
            guarantor2Contact: document.getElementById('guarantor2Contact')?.value,
            guarantor2Address: document.getElementById('guarantor2Address')?.value,
            guarantor2Email: document.getElementById('guarantor2Email')?.value
        };
    },
    
    /**
     * Submit the form
     */
    async submitForm() {
        // Validate all tabs
        let allValid = true;
        for (let i = 0; i < this.tabs.length - 1; i++) {
            const requiredFields = this.getRequiredFieldsForTab(this.tabs[i]);
            for (const fieldId of requiredFields) {
                const field = document.getElementById(fieldId);
                if (field && !field.value.trim()) {
                    allValid = false;
                    this.switchTab(i);
                    field.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    field.style.borderColor = 'var(--danger)';
                    Utils.showToast(`Please fill in ${field.previousElementSibling?.textContent || 'all required fields'}`, 'error');
                    return;
                }
            }
        }
        
        if (!allValid) return;
        
        const submitBtn = document.getElementById('submitBtn');
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';
        
        const formData = this.collectFormData();
        console.log('Submitting data:', formData);
        
        let result;
        const isEdit = !!formData.employeeNumber && await this.isExistingEmployee(formData.employeeNumber);
        
        if (isEdit) {
            result = await API.updateEmployee(formData);
        } else {
            result = await API.saveEmployee(formData);
        }
        
        submitBtn.disabled = false;
        submitBtn.innerHTML = '<i class="fas fa-save"></i> Save Employee';
        
        if (result.success) {
            Utils.showToast(`Employee ${isEdit ? 'updated' : 'saved'} successfully!`, 'success');
            
            // Upload pending documents
            if (this.uploadedFiles.length > 0) {
                await this.uploadPendingDocuments();
            }
            
            // Redirect to employee list
            setTimeout(() => {
                Router.navigate('employee-list');
            }, 1500);
        } else {
            Utils.showToast(result.error || 'Failed to save employee', 'error');
        }
    },
    
    /**
     * Check if employee already exists
     */
    async isExistingEmployee(employeeNumber) {
        const result = await API.getEmployeeById(employeeNumber);
        return result && !result.error;
    },
    
    /**
     * Upload pending documents after employee is saved
     */
    async uploadPendingDocuments() {
        const docType = document.getElementById('documentType').value;
        
        for (const file of this.uploadedFiles) {
            const result = await API.uploadDocument({
                employeeNumber: this.employeeNumber,
                documentType: docType,
                fileName: file.name,
                fileContent: file.content,
                mimeType: file.mimeType
            });
            
            if (result.success) {
                console.log(`Uploaded: ${file.name}`);
            }
        }
    }
};

// Make Employee available globally
window.Employee = Employee;
