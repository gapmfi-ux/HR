// api.js
const API = {
    // Store the base URL from config
    baseUrl: CONFIG.API_URL,
    
    // Callback counter for JSONP
    callbackCounter: 0,
    
    // Pending callbacks
    callbacks: {},
    
    /**
     * Make JSONP request for small data (GET requests)
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
     * Upload document using POST with FormData
     * Simple and direct - no iframes, no no-cors
     */
    uploadDocumentToDrive: async function(formData) {
        console.log('Uploading document via POST...');
        
        // Get file info for logging
        const file = formData.get('file');
        const employeeNumber = formData.get('employeeNumber');
        const documentType = formData.get('documentType');
        const fileName = formData.get('fileName');
        
        console.log('Upload details:', {
            employeeNumber,
            documentType,
            fileName,
            fileSize: file.size,
            fileType: file.type
        });
        
        // Add action to formData
        formData.append('action', 'uploadDocument');
        
        // Send as POST request with proper CORS
        const response = await fetch(this.baseUrl, {
            method: 'POST',
            body: formData
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        console.log('Upload result:', result);
        return result;
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

    /**
     * JSONP upload (base64) - used by employee-documents.js (FileReader -> base64)
     * Expects: { employeeNumber, documentType, fileName, fileContent, mimeType }
     * Returns the backend response object (with success flag, error, fileUrl, etc.)
     */
    async uploadDocument(data) {
        return this.jsonpRequest('uploadDocument', data);
    },

    /**
     * Get documents for an employee.
     * Returns an array of documents (for convenience it returns an array).
     * Backend may return { data: [...] } or { documents: [...] } or directly an array.
     */
    async getEmployeeDocuments(employeeNumber) {
        const result = await this.jsonpRequest('getEmployeeDocuments', { employeeNumber });
        // Normalize possible shapes
        if (Array.isArray(result)) return result;
        if (result === null || result === undefined) return [];
        // If the backend returned wrapper objects
        return result.data || result.documents || result.documentsList || result || [];
    },

    /**
     * Delete a document by fileId (or any id parameter backend expects).
     * Returns backend response object.
     */
    async deleteDocument(fileId) {
        return this.jsonpRequest('deleteDocument', { fileId });
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
