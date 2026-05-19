const API = {
    // Store the base URL from config
    baseUrl: CONFIG.API_URL,
    
    // Callback counter for JSONP
    callbackCounter: 0,
    
    // Pending callbacks
    callbacks: {},
    
    /**
     * Make JSONP request (bypasses CORS completely)
     * This is the primary method for all API calls
     */
    jsonpRequest: function(action, data = {}, timeout = 30000) {
        return new Promise((resolve, reject) => {
            const callbackName = `jsonp_callback_${++this.callbackCounter}_${Date.now()}`;
            const timeoutId = setTimeout(() => {
                // Clean up on timeout
                delete this.callbacks[callbackName];
                delete window[callbackName];
                reject(new Error(`Request timeout for action: ${action}`));
            }, timeout);
            
            // Store callback
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
            
            // Create global callback function
            window[callbackName] = (response) => {
                if (this.callbacks[callbackName]) {
                    this.callbacks[callbackName](response);
                }
            };
            
            // Build URL with parameters
            let url = `${this.baseUrl}?callback=${callbackName}&action=${action}`;
            
            // Add data as JSON string parameter
            if (data && Object.keys(data).length > 0) {
                url += `&data=${encodeURIComponent(JSON.stringify(data))}`;
            }
            
            // Create and inject script tag
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
     * Make POST request for JSON data
     */
    async postRequest(action, data = {}) {
        try {
            const response = await fetch(this.baseUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    action: action,
                    data: data
                })
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const result = await response.json();
            return result;
            
        } catch (error) {
            console.error(`POST Error (${action}):`, error);
            throw error;
        }
    },
    
    /**
     * Upload document to Google Drive
     */
    async uploadDocumentToDrive(formData) {
        try {
            console.log('Uploading document to Drive...');
            
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
            
        } catch (error) {
            console.error('Document upload error:', error);
            throw error;
        }
    },
    
    // ==================== EMPLOYEE API ====================
    
    async saveEmployee(employeeData) {
        return this.postRequest('saveEmployee', employeeData);
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
        return this.postRequest('updateEmployee', employeeData);
    },
    
    async deleteEmployee(employeeNumber) {
        return this.jsonpRequest('deleteEmployee', { employeeNumber });
    },
    
    async getLastEmployeeNumber() {
        const result = await this.jsonpRequest('getLastEmployeeNumber');
        return result.data;
    },
    
    // ==================== DOCUMENTS API ====================
    
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
