const API = {
    // Store the base URL from config
    baseUrl: CONFIG.API_URL,
    
    // Callback counter for JSONP
    callbackCounter: 0,
    
    // Pending callbacks
    callbacks: {},
    
    /**
     * Make JSONP request (bypasses CORS completely)
     */
    jsonpRequest: function(action, data = {}, timeout = 30000) {
        return new Promise((resolve, reject) => {
            const callbackName = `jsonp_callback_${++this.callbackCounter}_${Date.now()}`;
            const timeoutId = setTimeout(() => {
                delete this.callbacks[callbackName];
                delete window[callbackName];
                reject(new Error(`Request timeout for action: ${action}`));
            }, timeout);
            
            this.callbacks[callbackName] = (result) => {
                clearTimeout(timeoutId);
                delete this.callbacks[callbackName];
                delete window[callbackName];
                
                if (result && result.success === false) {
                    reject(new Error(result.error || 'Request failed'));
                } else {
                    resolve(result);
                }
            };
            
            window[callbackName] = (response) => {
                if (this.callbacks[callbackName]) {
                    this.callbacks[callbackName](response);
                }
            };
            
            let url = `${this.baseUrl}?callback=${callbackName}&action=${action}`;
            
            if (data && Object.keys(data).length > 0) {
                url += `&data=${encodeURIComponent(JSON.stringify(data))}`;
            }
            
            const script = document.createElement('script');
            script.src = url;
            script.onerror = () => {
                clearTimeout(timeoutId);
                delete this.callbacks[callbackName];
                delete window[callbackName];
                reject(new Error(`Network error for action: ${action}`));
            };
            document.head.appendChild(script);
        });
    },
    
    /**
     * Upload document using base64 and JSONP (NO iframes, NO CORS issues)
     */
    uploadDocumentToDrive: async function(formData) {
        // Extract data from FormData
        const file = formData.get('file');
        const employeeNumber = formData.get('employeeNumber');
        const documentType = formData.get('documentType');
        const fileName = formData.get('fileName');
        const mimeType = formData.get('mimeType');
        
        console.log('Preparing to upload via JSONP:', {
            employeeNumber,
            documentType,
            fileName,
            fileSize: file.size,
            mimeType
        });
        
        // Validate file size (max 5MB for JSONP)
        if (file.size > 5 * 1024 * 1024) {
            throw new Error('File size exceeds 5MB limit for upload');
        }
        
        // Convert file to base64
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = async (e) => {
                try {
                    // Get base64 content (remove the data:xxx;base64, prefix)
                    let base64Content = e.target.result;
                    const commaIndex = base64Content.indexOf(',');
                    if (commaIndex !== -1) {
                        base64Content = base64Content.substring(commaIndex + 1);
                    }
                    
                    console.log('File converted to base64, length:', base64Content.length);
                    
                    // Upload via JSONP
                    const result = await this.jsonpRequest('uploadDocument', {
                        employeeNumber: employeeNumber,
                        documentType: documentType,
                        fileName: fileName,
                        mimeType: mimeType,
                        fileContent: base64Content
                    }, 60000); // 60 second timeout
                    
                    console.log('Upload result:', result);
                    resolve(result);
                    
                } catch (error) {
                    console.error('Upload error:', error);
                    reject(error);
                }
            };
            
            reader.onerror = () => {
                reject(new Error('Failed to read file'));
            };
            
            reader.readAsDataURL(file);
        });
    },
    
    // ==================== EMPLOYEE API ====================
    
    async saveEmployee(employeeData) {
        return this.jsonpRequest('saveEmployee', employeeData);
    },
    
    async getEmployeeList() {
        const result = await this.jsonpRequest('getEmployeeList');
        return result.data || [];
    },
    
    async getEmployeeById(employeeNumber) {
        const result = await this.jsonpRequest('getEmployeeById', { employeeNumber });
        return result;
    },
    
    async updateEmployee(employeeData) {
        return this.jsonpRequest('updateEmployee', employeeData);
    },
    
    async deleteEmployee(employeeNumber) {
        return this.jsonpRequest('deleteEmployee', { employeeNumber });
    },
    
    async getLastEmployeeNumber() {
        const result = await this.jsonpRequest('getLastEmployeeNumber');
        return result.data;
    },
    
    // ==================== DOCUMENTS API ====================
    
    async ensureEmployeeFolder(employeeNumber) {
        return this.jsonpRequest('ensureEmployeeFolder', { employeeNumber });
    },
    
    async getEmployeeDocuments(employeeNumber) {
        const result = await this.jsonpRequest('getEmployeeDocuments', { employeeNumber });
        return result.documents || [];
    },
    
    async deleteDocument(documentId) {
        return this.jsonpRequest('deleteDocument', { documentId });
    },
    
    // ==================== PAYROLL API ====================
    
    async savePayroll(payrollData) {
        return this.jsonpRequest('savePayroll', payrollData);
    },
    
    async getPayrollList(month, year) {
        const result = await this.jsonpRequest('getPayrollList', { month, year });
        return result.data || [];
    },
    
    async calculatePayroll(basicSalary, allowance, taxRelief) {
        return this.jsonpRequest('calculatePayroll', { basicSalary, allowance, taxRelief });
    },
    
    // ==================== APPRAISAL API ====================
    
    async saveKPI(kpiData) {
        return this.jsonpRequest('saveKPI', kpiData);
    },
    
    async getKpiData(employeeNumber) {
        const result = await this.jsonpRequest('getKpiData', { employeeNumber });
        return result.data || { Financial: [], NonFinancial: [], NonMeasurable: [] };
    },
    
    // ==================== LEAVE API ====================
    
    async saveLeaveRequest(leaveData) {
        return this.jsonpRequest('saveLeaveRequest', leaveData);
    },
    
    async getLeaveRequests(employeeNumber) {
        const result = await this.jsonpRequest('getLeaveRequests', { employeeNumber });
        return result.data || [];
    },
    
    async getLeaveBalance(employeeNumber) {
        const result = await this.jsonpRequest('getLeaveBalance', { employeeNumber });
        return result.data || {};
    },
    
    async updateLeaveStatus(requestId, status, reviewerNotes) {
        return this.jsonpRequest('updateLeaveStatus', { requestId, status, reviewerNotes });
    },
    
    // ==================== GRIEVANCE API ====================
    
    async saveGrievance(grievanceData) {
        return this.jsonpRequest('saveGrievance', grievanceData);
    },
    
    async getGrievances(employeeNumber) {
        const result = await this.jsonpRequest('getGrievances', { employeeNumber });
        return result.grievances || [];
    },
    
    async updateGrievanceStatus(grievanceId, status, resolution) {
        return this.jsonpRequest('updateGrievanceStatus', { grievanceId, status, resolution });
    },
    
    // ==================== SYSTEM API ====================
    
    async healthCheck() {
        try {
            const result = await this.jsonpRequest('health', {}, 5000);
            return result.status === 'healthy';
        } catch {
            return false;
        }
    },
    
    async testConnection() {
        try {
            const result = await this.jsonpRequest('test', {}, 5000);
            return result.success === true;
        } catch {
            return false;
        }
    },
    
    // ==================== HELPER ====================
    
    generateEmployeeNumber(lastNumber) {
        if (!lastNumber || lastNumber === 'null') {
            return 'GAP0001';
        }
        const numStr = lastNumber.toString();
        const num = parseInt(numStr.replace('GAP', '')) || 0;
        const nextNum = num + 1;
        return 'GAP' + String(nextNum).padStart(4, '0');
    }
};

window.API = API;
