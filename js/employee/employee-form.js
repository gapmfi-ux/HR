const Employee = {
    currentTab: 0,
    tabs: ['personal', 'contact', 'family', 'employment', 'education', 'guarantor', 'documents'],
    employeeNumber: null,
    isEditMode: false,
    uploadedDocuments: {},
    
    init: async function(params = {}) {
        this.setupTabs();
        
        if(params.id) {
            this.isEditMode = true;
            this.employeeNumber = params.id;
            await this.loadData(params.id);
            this.updateFormTitle();
        } else {
            this.isEditMode = false;
            await this.generateNumber();
        }
        
        this.setupUpload();
        this.setupFolderCreationOnTab();
    },
    
    setupFolderCreationOnTab: function() {
        // When Documents tab is clicked
        const documentsTabBtn = document.querySelector('.tab-btn:last-child');
        if (documentsTabBtn) {
            documentsTabBtn.addEventListener('click', async () => {
                setTimeout(async () => {
                    await this.ensureEmployeeFolder();
                }, 100);
            });
        }
        
        // When clicking Next to reach Documents tab
        const nextBtn = document.getElementById('nextBtn');
        if (nextBtn) {
            const originalNextHandler = nextBtn.onclick;
            nextBtn.onclick = async () => {
                if (this.currentTab === this.tabs.length - 2) {
                    await this.ensureEmployeeFolder();
                }
                if (originalNextHandler) originalNextHandler();
            };
        }
    },
    
    ensureEmployeeFolder: async function() {
        if (!this.employeeNumber) {
            console.warn('No employee number available');
            return false;
        }
        
        try {
            Utils.showLoading();
            const result = await API.ensureEmployeeFolder(this.employeeNumber);
            Utils.hideLoading();
            
            if (result.success) {
                if (result.created) {
                    Utils.showToast(`Created folder for ${this.employeeNumber}`, 'success');
                }
                return true;
            } else {
                Utils.showToast('Error creating folder: ' + (result.error || 'Unknown error'), 'error');
                return false;
            }
        } catch (error) {
            Utils.hideLoading();
            console.error('Error ensuring folder:', error);
            return false;
        }
    },
    
    updateFormTitle: function() {
        const submitBtn = document.getElementById('submitBtn');
        if(submitBtn) {
            submitBtn.textContent = '✓ Update';
        }
    },
    
    setupTabs: function() {
        document.querySelectorAll('.tab-btn').forEach((btn, i) => btn.onclick = () => this.switchTab(i));
        document.getElementById('nextBtn').onclick = () => this.nextTab();
        document.getElementById('prevBtn').onclick = () => this.prevTab();
        document.getElementById('submitBtn').onclick = () => this.submit();
        this.updateButtons();
    },
    
    switchTab: function(index) {
        document.querySelectorAll('.tab-btn').forEach((btn, i) => btn.classList.toggle('active', i === index));
        document.querySelectorAll('.tab-pane').forEach((pane, i) => pane.classList.toggle('active', i === index));
        this.currentTab = index;
        this.updateButtons();
    },
    
    nextTab: function() { 
        if(this.currentTab < this.tabs.length - 1) this.switchTab(this.currentTab + 1); 
    },
    
    prevTab: function() { 
        if(this.currentTab > 0) this.switchTab(this.currentTab - 1); 
    },
    
    updateButtons: function() {
        const isLast = this.currentTab === this.tabs.length - 1;
        document.getElementById('nextBtn').style.display = isLast ? 'none' : 'inline-flex';
        document.getElementById('submitBtn').style.display = isLast ? 'inline-flex' : 'none';
        document.getElementById('prevBtn').style.display = this.currentTab === 0 ? 'none' : 'inline-flex';
    },
    
    generateNumber: async function() {
        try {
            const last = await API.getLastEmployeeNumber();
            this.employeeNumber = API.generateEmployeeNumber(last);
            const empNumInput = document.getElementById('employeeNumber');
            if(empNumInput) {
                empNumInput.value = this.employeeNumber;
            }
        } catch(e) {
            console.error('Error generating employee number:', e);
            this.employeeNumber = 'GAP0001';
        }
    },
    
    loadData: async function(empNum) {
        Utils.showLoading();
        try {
            const data = await API.getEmployeeById(empNum);
            Utils.hideLoading();
            
            if(!data.error) {
                this.populateForm(data);
            } else {
                Utils.showToast('Error loading employee data: ' + data.error, 'error');
            }
        } catch(e) {
            Utils.hideLoading();
            Utils.showToast('Error loading employee data', 'error');
            console.error(e);
        }
    },
    
    populateForm: function(data) {
        const fieldMappings = {
            'employeeNumber': 'employeeNumber',
            'employeeName': 'employeeName',
            'sex': 'sex',
            'dob': 'dob',
            'idType': 'idType',
            'idNumber': 'idNumber',
            'placeOfBirth': 'placeOfBirth',
            'nationality': 'nationality',
            'contactNumber': 'contactNumber',
            'emailAddress': 'emailAddress',
            'postalAddress': 'postalAddress',
            'residence': 'residence',
            'digitalAddress': 'digitalAddress',
            'landmark': 'landmark',
            'residenceType': 'residenceType',
            'maritalStatus': 'maritalStatus',
            'spouseName': 'spouseName',
            'spouseContact': 'spouseContact',
            'childrenCount': 'childrenCount',
            'fatherName': 'fatherName',
            'fatherContact': 'fatherContact',
            'motherName': 'motherName',
            'motherContact': 'motherContact',
            'nextOfKinName': 'nextOfKinName',
            'kinRelationship': 'kinRelationship',
            'kinContact': 'kinContact',
            'kinResidence': 'kinResidence',
            'dateOfAppointment': 'dateOfAppointment',
            'assumptionDate': 'assumptionDate',
            'designation': 'designation',
            'department': 'department',
            'employmentType': 'employmentType',
            'ssnit': 'ssnit',
            'tinNumber': 'tinNumber',
            'secondaryInstitution': 'secondaryInstitution',
            'secondaryMajor': 'secondaryMajor',
            'secondaryYear': 'secondaryYear',
            'tertiaryInstitution': 'tertiaryInstitution',
            'tertiaryMajor': 'tertiaryMajor',
            'tertiaryYear': 'tertiaryYear',
            'professionalInstitution': 'professionalInstitution',
            'professionalMajor': 'professionalMajor',
            'professionalYear': 'professionalYear',
            'guarantor1Name': 'guarantor1Name',
            'guarantor1Contact': 'guarantor1Contact',
            'guarantor1Email': 'guarantor1Email',
            'guarantor1Address': 'guarantor1Address',
            'guarantor2Name': 'guarantor2Name',
            'guarantor2Contact': 'guarantor2Contact',
            'guarantor2Email': 'guarantor2Email',
            'guarantor2Address': 'guarantor2Address'
        };
        
        Object.entries(fieldMappings).forEach(([fieldId, dataKey]) => {
            const el = document.getElementById(fieldId);
            if(el && data[dataKey]) {
                el.value = data[dataKey];
            }
        });
    },
    
    setupUpload: function() {
        const docTypes = ['passportPhoto', 'nationalId', 'certificates', 'degreeCerts', 'professionalCerts', 'cv', 'otherDocs'];
        
        docTypes.forEach(docType => {
            const fileInput = document.getElementById(`file-${docType}`);
            const uploadBtn = document.getElementById(`upload-${docType}`);
            const clickArea = document.getElementById(`upload-area-${docType}`);
            
            if(clickArea) clickArea.onclick = () => fileInput.click();
            if(uploadBtn) uploadBtn.onclick = () => this.uploadDoc(docType);
            
            if(fileInput) {
                fileInput.onchange = () => this.updateFileDisplay(docType);
            }
        });
    },
    
    updateFileDisplay: function(docType) {
        const fileInput = document.getElementById(`file-${docType}`);
        const display = document.getElementById(`file-name-${docType}`);
        
        if(fileInput.files && fileInput.files[0]) {
            const file = fileInput.files[0];
            const size = (file.size / 1024).toFixed(2);
            display.textContent = `${file.name} (${size}KB)`;
            display.className = 'doc-file-name uploaded';
        }
    },
    
    uploadDoc: async function(docType) {
        const fileInput = document.getElementById(`file-${docType}`);
        if(!fileInput.files || !fileInput.files[0]) {
            Utils.showToast('Please select a file', 'error');
            return;
        }
        
        const file = fileInput.files[0];
        
        if(file.size > CONFIG.MAX_FILE_SIZE) {
            Utils.showToast('File size exceeds 5MB limit', 'error');
            return;
        }
        
        if(!CONFIG.ALLOWED_FILE_TYPES.includes(file.type)) {
            Utils.showToast('File type not allowed. Use: PDF, JPG, PNG, DOC, DOCX', 'error');
            return;
        }
        
        Utils.showLoading();
        
        try {
            await this.ensureEmployeeFolder();
            
            const docTypeMap = {
                'passportPhoto': 'Passport Photo',
                'nationalId': 'National ID',
                'certificates': 'Certificates',
                'degreeCerts': 'Degree Certificates',
                'professionalCerts': 'Professional Certificates',
                'cv': 'CV / Resume',
                'otherDocs': 'Other Documents'
            };
            
            const formData = new FormData();
            formData.append('file', file);
            formData.append('employeeNumber', this.employeeNumber);
            formData.append('documentType', docTypeMap[docType]);
            formData.append('fileName', file.name);
            formData.append('mimeType', file.type);
            
            console.log('Uploading document:', {
                fileName: file.name,
                employeeNumber: this.employeeNumber,
                documentType: docTypeMap[docType],
                fileSize: file.size
            });
            
            const result = await API.uploadDocumentToDrive(formData);
            
            Utils.hideLoading();
            
            if(result && result.success) {
                Utils.showToast('Document uploaded successfully', 'success');
                
                if(!this.uploadedDocuments[docType]) {
                    this.uploadedDocuments[docType] = [];
                }
                this.uploadedDocuments[docType].push({
                    fileName: file.name,
                    documentId: result.data?.documentId,
                    fileUrl: result.data?.fileUrl,
                    documentType: docTypeMap[docType]
                });
                
                fileInput.value = '';
                const display = document.getElementById(`file-name-${docType}`);
                if(display) {
                    display.className = 'doc-file-name empty';
                    display.textContent = 'No file chosen';
                }
            } else {
                Utils.showToast('Document upload failed: ' + ((result && result.error) || 'Unknown error'), 'error');
            }
        } catch(error) {
            Utils.hideLoading();
            Utils.showToast('Error uploading document: ' + error.message, 'error');
            console.error('Upload error:', error);
        }
    },
    
    submit: async function() {
        const data = {};
        const fields = [
            'employeeNumber', 'employeeName', 'sex', 'dob', 'idType', 'idNumber', 'placeOfBirth', 'nationality',
            'contactNumber', 'emailAddress', 'postalAddress', 'residence', 'digitalAddress', 'landmark', 'residenceType',
            'maritalStatus', 'spouseName', 'spouseContact', 'childrenCount', 'fatherName', 'fatherContact',
            'motherName', 'motherContact', 'nextOfKinName', 'kinRelationship', 'kinContact', 'kinResidence',
            'dateOfAppointment', 'assumptionDate', 'designation', 'department', 'employmentType', 'ssnit', 'tinNumber',
            'secondaryInstitution', 'secondaryMajor', 'secondaryYear', 'tertiaryInstitution', 'tertiaryMajor',
            'tertiaryYear', 'professionalInstitution', 'professionalMajor', 'professionalYear',
            'guarantor1Name', 'guarantor1Contact', 'guarantor1Email', 'guarantor1Address',
            'guarantor2Name', 'guarantor2Contact', 'guarantor2Email', 'guarantor2Address'
        ];
        
        fields.forEach(f => { 
            const el = document.getElementById(f); 
            if(el) data[f] = el.value; 
        });
        
        data.employeeNumber = this.employeeNumber;
        data.uploadedDocuments = this.uploadedDocuments;
        
        Utils.showLoading();
        
        try {
            let result;
            if(this.isEditMode) {
                result = await API.updateEmployee(data);
            } else {
                result = await API.saveEmployee(data);
            }
            
            Utils.hideLoading();
            
            if(result && result.success) {
                const message = this.isEditMode ? 'Employee updated successfully!' : 'Employee added successfully!';
                Utils.showToast(message, 'success');
                setTimeout(() => {
                    if (typeof Router !== 'undefined' && Router.navigate) {
                        Router.navigate('employee-list');
                    } else {
                        window.location.href = 'employee-list.html';
                    }
                }, 1500);
            } else {
                Utils.showToast((result && result.error) || 'Failed to save employee', 'error');
            }
        } catch(e) {
            Utils.hideLoading();
            Utils.showToast('Error saving employee: ' + e.message, 'error');
            console.error(e);
        }
    }
};

window.Employee = Employee;
