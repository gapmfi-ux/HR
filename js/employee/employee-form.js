const Employee = {
    currentTab: 0,
    tabs: ['personal', 'contact', 'family', 'employment', 'education', 'guarantor', 'documents'],
    employeeNumber: null,
    isEditMode: false,
    uploadedDocuments: {}, // Track uploaded documents by type
    
    init: async function(params = {}) {
        this.setupTabs();
        
        // Check if we're in edit mode
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
        const last = await API.getLastEmployeeNumber();
        this.employeeNumber = API.generateEmployeeNumber(last);
        document.getElementById('employeeNumber').value = this.employeeNumber;
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
            // Personal Tab
            'employeeNumber': 'employeeNumber',
            'employeeName': 'name',
            'sex': 'sex',
            'dob': 'dob',
            'idType': 'idType',
            'idNumber': 'idNumber',
            'placeOfBirth': 'placeOfBirth',
            'nationality': 'nationality',
            
            // Contact & Residential Tab
            'contactNumber': 'contactTelephone',
            'emailAddress': 'emailAddress',
            'postalAddress': 'postalAddress',
            'residence': 'residence',
            'digitalAddress': 'digitalAddress',
            'landmark': 'landmark',
            'residenceType': 'residenceType',
            
            // Family Tab
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
            
            // Employment Tab
            'dateOfAppointment': 'appointmentDate',
            'assumptionDate': 'assumptionDate',
            'designation': 'designation',
            'department': 'department',
            'employmentType': 'employmentType',
            'ssnit': 'ssnitNumber',
            'tinNumber': 'tinNumber',
            
            // Education Tab
            'secondaryInstitution': 'secondaryInstitution',
            'secondaryMajor': 'secondaryMajor',
            'secondaryYear': 'secondaryYear',
            'tertiaryInstitution': 'tertiaryInstitution',
            'tertiaryMajor': 'tertiaryMajor',
            'tertiaryYear': 'tertiaryYear',
            'professionalInstitution': 'professionalInstitution',
            'professionalMajor': 'professionalMajor',
            'professionalYear': 'professionalYear',
            
            // Guarantor Tab
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
        
        if(fileInput.files[0]) {
            const file = fileInput.files[0];
            const size = (file.size / 1024).toFixed(2);
            display.textContent = `${file.name} (${size}KB)`;
            display.style.color = '#22c55e';
        }
    },
    
    uploadDoc: async function(docType) {
        const file = document.getElementById(`file-${docType}`).files[0];
        if(!file) return Utils.showToast('Select a file', 'error');
        
        const reader = new FileReader();
        reader.onload = async (e) => {
            const docTypeLabels = {
                'passportPhoto': 'Passport Photo',
                'nationalId': 'National ID',
                'certificates': 'Certificates',
                'degreeCerts': 'Degree Certificate',
                'professionalCerts': 'Professional Certificate',
                'cv': 'CV/Resume',
                'otherDocs': 'Other Documents'
            };
            
            const result = await API.uploadDocument({
                employeeNumber: this.employeeNumber,
                documentType: docTypeLabels[docType],
                fileName: file.name,
                fileContent: e.target.result.split(',')[1],
                mimeType: file.type
            });
            
            if(result.success) {
                this.uploadedDocuments[docType] = file.name;
                Utils.showToast(`${docTypeLabels[docType]} uploaded successfully`, 'success');
            } else {
                Utils.showToast(`${docTypeLabels[docType]} upload failed`, 'error');
            }
        };
        reader.readAsDataURL(file);
    },
    
    submit: async function() {
        // Collect form data
        const data = {};
        const fields = [
            // Personal
            'employeeName','sex','dob','idType','idNumber','placeOfBirth','nationality',
            // Contact
            'contactNumber','emailAddress','postalAddress','residence','digitalAddress','landmark','residenceType',
            // Family
            'maritalStatus','spouseName','spouseContact','childrenCount','fatherName','fatherContact',
            'motherName','motherContact','nextOfKinName','kinRelationship','kinContact','kinResidence',
            // Employment
            'dateOfAppointment','assumptionDate','designation','department','employmentType','ssnit','tinNumber',
            // Education
            'secondaryInstitution','secondaryMajor','secondaryYear','tertiaryInstitution','tertiaryMajor',
            'tertiaryYear','professionalInstitution','professionalMajor','professionalYear',
            // Guarantor
            'guarantor1Name','guarantor1Contact','guarantor1Email','guarantor1Address',
            'guarantor2Name','guarantor2Contact','guarantor2Email','guarantor2Address'
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
            
            if(result.success) {
                const message = this.isEditMode ? 'Employee updated successfully!' : 'Employee added successfully!';
                Utils.showToast(message, 'success');
                setTimeout(() => Router.navigate('employee-list'), 1500);
            } else {
                Utils.showToast(result.error || 'Failed to save employee', 'error');
            }
        } catch(e) {
            Utils.hideLoading();
            Utils.showToast('Error saving employee: ' + e.message, 'error');
            console.error(e);
        }
    }
};

window.Employee = Employee;
