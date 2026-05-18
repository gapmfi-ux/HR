const Employee = {
    currentTab: 0,
    tabs: ['personal', 'contact', 'family', 'employment', 'education', 'guarantor', 'documents'],
    employeeNumber: null,
    isEditMode: false,
    
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
            // Tab 1: Personal
            'employeeNumber': 'employeeNumber',
            'employeeName': 'name',
            'sex': 'sex',
            'dob': 'dob',
            'idType': 'idType',
            'idNumber': 'idNumber',
            'placeOfBirth': 'placeOfBirth',
            'nationality': 'nationality',
            // Tab 2: Contact & Residential
            'contactNumber': 'contactTelephone',
            'emailAddress': 'emailAddress',
            'postalAddress': 'postalAddress',
            'residence': 'residence',
            'digitalAddress': 'digitalAddress',
            'landmark': 'landmark',
            'residenceType': 'residenceType',
            // Tab 3: Family
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
            'nextOfKinContact': 'nextOfKinContact',
            'nextOfKinResidence': 'nextOfKinResidence',
            // Tab 4: Employment
            'dateOfAppointment': 'appointmentDate',
            'assumptionDate': 'assumptionDate',
            'designation': 'designation',
            'department': 'department',
            'employmentType': 'employmentType',
            'ssnit': 'ssnitNumber',
            'tinNumber': 'tinNumber',
            // Tab 5: Education
            'secondaryInstitution': 'secondaryInstitution',
            'secondaryMajor': 'secondaryMajor',
            'secondaryYear': 'secondaryYear',
            'tertiaryInstitution': 'tertiaryInstitution',
            'tertiaryMajor': 'tertiaryMajor',
            'tertiaryYear': 'tertiaryYear',
            'professionalInstitution': 'professionalInstitution',
            'professionalMajor': 'professionalMajor',
            'professionalYear': 'professionalYear',
            // Tab 6: Guarantors
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
        const area = document.getElementById('docUploadArea');
        const fileInput = document.getElementById('docFile');
        if(area) area.onclick = () => fileInput.click();
        document.getElementById('uploadBtn').onclick = () => this.uploadDoc();
    },
    
    uploadDoc: async function() {
        const file = document.getElementById('docFile').files[0];
        if(!file) return Utils.showToast('Select a file', 'error');
        
        const reader = new FileReader();
        reader.onload = async (e) => {
            const result = await API.uploadDocument({
                employeeNumber: this.employeeNumber,
                documentType: document.getElementById('docType').value,
                fileName: file.name,
                fileContent: e.target.result.split(',')[1],
                mimeType: file.type
            });
            if(result.success) Utils.showToast('Document uploaded successfully', 'success');
            else Utils.showToast('Document upload failed', 'error');
        };
        reader.readAsDataURL(file);
    },
    
    submit: async function() {
        // Collect form data
        const data = {};
        const fields = [
            // Tab 1: Personal
            'employeeName', 'sex', 'dob', 'idType', 'idNumber', 'placeOfBirth', 'nationality',
            // Tab 2: Contact & Residential
            'contactNumber', 'emailAddress', 'postalAddress', 'residence', 'digitalAddress', 'landmark', 'residenceType',
            // Tab 3: Family
            'maritalStatus', 'spouseName', 'spouseContact', 'childrenCount', 'fatherName', 'fatherContact', 'motherName', 'motherContact',
            'nextOfKinName', 'kinRelationship', 'nextOfKinContact', 'nextOfKinResidence',
            // Tab 4: Employment
            'dateOfAppointment', 'assumptionDate', 'designation', 'department', 'employmentType', 'ssnit', 'tinNumber',
            // Tab 5: Education
            'secondaryInstitution', 'secondaryMajor', 'secondaryYear', 'tertiaryInstitution', 'tertiaryMajor', 'tertiaryYear',
            'professionalInstitution', 'professionalMajor', 'professionalYear',
            // Tab 6: Guarantors
            'guarantor1Name', 'guarantor1Contact', 'guarantor1Email', 'guarantor1Address',
            'guarantor2Name', 'guarantor2Contact', 'guarantor2Email', 'guarantor2Address'
        ];
        
        fields.forEach(f => { 
            const el = document.getElementById(f); 
            if(el) data[f] = el.value; 
        });
        
        data.employeeNumber = this.employeeNumber;
        
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
