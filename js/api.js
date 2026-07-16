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
            // Generate a unique callback name
            const callbackName = `jsonp_callback_${++this.callbackCounter}_${Date.now()}`;
            const scriptId = `script_${callbackName}`;
            
            // Setup timeout
            const timeoutId = setTimeout(() => {
                // Cleanup
                if (this.callbacks[callbackName]) {
                    delete this.callbacks[callbackName];
                }
                if (window[callbackName]) {
                    try { delete window[callbackName]; } catch(e) {}
                }
                const existingScript = document.getElementById(scriptId);
                if (existingScript) existingScript.remove();
                reject(new Error(`Request timeout for action: ${action}`));
            }, timeout);
            
            // Register callback handler
            this.callbacks[callbackName] = (result) => {
                clearTimeout(timeoutId);
                // Cleanup references
                delete this.callbacks[callbackName];
                try { delete window[callbackName]; } catch(e) {}
                const scriptEl = document.getElementById(scriptId);
                if (scriptEl) scriptEl.remove();
                
                if (result && result.success === false) {
                    reject(new Error(result.error || 'Request failed'));
                } else {
                    resolve(result);
                }
            };
            
            // Expose the global callback that the JSONP endpoint will call
            window[callbackName] = (response) => {
                if (this.callbacks[callbackName]) {
                    this.callbacks[callbackName](response);
                }
            };
            
            // Build URL
            let url = `${this.baseUrl}?callback=${callbackName}&action=${encodeURIComponent(action)}`;
            if (data && Object.keys(data).length > 0) {
                url += `&data=${encodeURIComponent(JSON.stringify(data))}`;
            }
            
            // Insert script tag to perform JSONP
            const script = document.createElement('script');
            script.src = url;
            script.id = scriptId;
            script.async = true;
            script.onerror = () => {
                clearTimeout(timeoutId);
                if (this.callbacks[callbackName]) delete this.callbacks[callbackName];
                try { delete window[callbackName]; } catch(e) {}
                const existingScript = document.getElementById(scriptId);
                if (existingScript) existingScript.remove();
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
        
        // Get file info for logging (may be undefined if FormData is empty)
        const file = formData.get('file');
        const employeeNumber = formData.get('employeeNumber');
        const documentType = formData.get('documentType');
        const fileName = formData.get('fileName');
        
        console.log('Upload details:', {
            employeeNumber,
            documentType,
            fileName,
            fileSize: file ? file.size : undefined,
            fileType: file ? file.type : undefined
        });
        
        // Add action to formData so the backend picks it up
        formData.append('action', 'uploadDocument');
        
        try {
            const response = await fetch(this.baseUrl, {
                method: 'POST',
                body: formData,
                // Do NOT set Content-Type; browser will set multipart/form-data boundary automatically
                credentials: 'omit' // adjust if you need cookies; Apps Script web apps typically don't use cookies
            });
            
            // Network-level failures will throw before here; check HTTP status
            if (!response.ok) {
                // Try to parse any body for debugging
                let text = '';
                try { text = await response.text(); } catch(e) {}
                throw new Error(`HTTP error! status: ${response.status} ${response.statusText} ${text ? '- ' + text : ''}`);
            }
            
            // Try parse JSON
            const result = await response.json();
            console.log('Upload result:', result);
            return result;
        } catch (err) {
            console.error('uploadDocumentToDrive error:', err);
            // Normalize error object so callers can handle it uniformly
            return { success: false, error: err.message || String(err) };
        }
    },
    
    // ==================== EMPLOYEE API ====================
    
    async saveEmployee(employeeData) {
        return this.jsonpRequest('saveEmployee', employeeData);
    },
    
    async getEmployeeList() {
        const result = await this.jsonpRequest('getEmployeeList');
        return (result && result.data) ? result.data : [];
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
        return result && result.data;
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
        if (!result) return [];
        if (Array.isArray(result)) return result;
        if (Array.isArray(result.data)) return result.data;
        if (Array.isArray(result.documents)) return result.documents;
        if (Array.isArray(result.documentsList)) return result.documentsList;
        // fallback: maybe backend returned wrapper with documents property or single document
        return result.documents || result.data || [];
    },

    /**
     * Delete a document by id. Backend expects parameter `documentId`.
     * Returns backend response object.
     */
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
            return result && result.success === true;
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
