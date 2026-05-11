const Employee = {
    currentTab: 0,
    tabs: ['personal', 'employment', 'education', 'guarantor', 'documents'],
    employeeNumber: null,
    
    init: async function(params = {}) {
        this.setupTabs();
        await this.generateNumber();
        if(params.id) await this.loadData(params.id);
        this.setupUpload();
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
    
    nextTab: function() { if(this.currentTab < this.tabs.length - 1) this.switchTab(this.currentTab + 1); },
    prevTab: function() { if(this.currentTab > 0) this.switchTab(this.currentTab - 1); },
    
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
        const data = await API.getEmployeeById(empNum);
        if(!data.error) this.populateForm(data);
    },
    
    populateForm: function(data) {
        const fields = ['employeeNumber','employeeName','sex','nationality','idType','idNumber','dob','placeOfBirth','contactNumber','residence','digitalAddress','landmark','residenceType','maritalStatus','spouseName','childrenCount','fatherName','motherName','nextOfKin','kinContact','kinResidence','dateOfAppointment','assumptionDate','designation','ssnit','tinNumber','employmentType','department','secondaryInstitution','secondaryMajor','secondaryYear','tertiaryInstitution','tertiaryMajor','tertiaryYear','professionalInstitution','professionalMajor','professionalYear','guarantor1Name','guarantor1Contact','guarantor1Address','guarantor1Email','guarantor2Name','guarantor2Contact','guarantor2Address','guarantor2Email'];
        fields.forEach(f => { const el = document.getElementById(f); if(el && data[f]) el.value = data[f]; });
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
            if(result.success) Utils.showToast('Uploaded', 'success');
            else Utils.showToast('Failed', 'error');
        };
        reader.readAsDataURL(file);
    },
    
    submit: async function() {
        const data = {};
        const fields = ['employeeName','sex','nationality','idType','idNumber','dob','placeOfBirth','contactNumber','residence','digitalAddress','landmark','residenceType','maritalStatus','spouseName','childrenCount','fatherName','motherName','nextOfKin','kinContact','kinResidence','dateOfAppointment','assumptionDate','designation','ssnit','tinNumber','employmentType','department','secondaryInstitution','secondaryMajor','secondaryYear','tertiaryInstitution','tertiaryMajor','tertiaryYear','professionalInstitution','professionalMajor','professionalYear','guarantor1Name','guarantor1Contact','guarantor1Address','guarantor1Email','guarantor2Name','guarantor2Contact','guarantor2Address','guarantor2Email'];
        fields.forEach(f => { const el = document.getElementById(f); if(el) data[f] = el.value; });
        data.employeeNumber = this.employeeNumber;
        
        const result = await API.saveEmployee(data);
        if(result.success) {
            Utils.showToast('Saved!', 'success');
            setTimeout(() => Router.navigate('employee-list'), 1500);
        } else Utils.showToast(result.error || 'Failed', 'error');
    }
};
window.Employee = Employee;
