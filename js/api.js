// api.js - updated
const API = {
    // Store the base URL from config
    baseUrl: CONFIG.API_URL,

    // Callback counter for JSONP
    callbackCounter: 0,

    // Pending callbacks
    callbacks: {},

    /**
     * Make JSONP request for small data (GET requests)
     * action: string (backend action)
     * data: object (serialized as JSON and passed as 'data' query param)
     * timeout: milliseconds
     */
    jsonpRequest: function(action, data = {}, timeout = 30000) {
        return new Promise((resolve, reject) => {
            // Build a unique callback name
            const callbackName = `jsonp_callback_${++this.callbackCounter}_${Date.now()}`;

            // Timeout handler
            const timeoutId = setTimeout(() => {
                // cleanup
                if (window[callbackName]) delete window[callbackName];
                if (this.callbacks[callbackName]) delete this.callbacks[callbackName];
                reject(new Error(`Request timeout for action: ${action}`));
            }, timeout);

            // Store resolver so the window callback can call it
            this.callbacks[callbackName] = (result) => {
                clearTimeout(timeoutId);
                try {
                    if (window[callbackName]) delete window[callbackName];
                    if (this.callbacks[callbackName]) delete this.callbacks[callbackName];
                } catch (e) {
                    // ignore cleanup errors
                }

                // Normalize error shapes
                if (result && result.success === false) {
                    reject(new Error(result.error || 'Request failed'));
                } else if (result && result.error) {
                    // backend returned { error: '...' }
                    resolve(result);
                } else {
                    resolve(result);
                }
            };

            // Create the global callback expected by the JSONP response
            window[callbackName] = (response) => {
                // Defensive: ensure callback exists in registry
                if (this.callbacks[callbackName]) {
                    try {
                        this.callbacks[callbackName](response);
                    } catch (err) {
                        clearTimeout(timeoutId);
                        delete window[callbackName];
                        delete this.callbacks[callbackName];
                        reject(err);
                    }
                }
            };

            // Build URL
            let url = `${this.baseUrl}?callback=${callbackName}&action=${encodeURIComponent(action)}`;

            if (data && Object.keys(data).length > 0) {
                url += `&data=${encodeURIComponent(JSON.stringify(data))}`;
            }

            // Create script tag
            const script = document.createElement('script');
            script.src = url;
            script.async = true;

            // Error handler for network/script load errors
            script.onerror = () => {
                clearTimeout(timeoutId);
                if (window[callbackName]) delete window[callbackName];
                if (this.callbacks[callbackName]) delete this.callbacks[callbackName];
                // Remove script tag
                if (script.parentNode) script.parentNode.removeChild(script);
                reject(new Error(`Network error for action: ${action}`));
            };

            // Clean up script after load (successful or not) to avoid memory leaks
            script.onload = () => {
                // remove script element after a small delay to allow callback execution
                setTimeout(() => {
                    if (script.parentNode) script.parentNode.removeChild(script);
                }, 50);
            };

            document.head.appendChild(script);
        });
    },

    /**
     * Upload document using POST with FormData
     * - Used by employee-form.js when uploading files directly
     * - formData must include file, employeeNumber, documentType, fileName, etc.
     */
    uploadDocumentToDrive: async function(formData) {
        console.log('Uploading document via POST...');

        // Get file info for logging (if provided)
        try {
            const file = formData.get('file');
            const employeeNumber = formData.get('employeeNumber');
            const documentType = formData.get('documentType');
            const fileName = formData.get('fileName');

            console.log('Upload details:', {
                employeeNumber,
                documentType,
                fileName,
                fileSize: file && file.size,
                fileType: file && file.type
            });
        } catch (e) {
            // ignore logging errors
        }

        // Add action to formData expected by the server doPost handler
        formData.append('action', 'uploadDocument');

        // Send as POST request with proper CORS (do not set Content-Type; browser will set multipart boundary)
        const response = await fetch(this.baseUrl, {
            method: 'POST',
            body: formData
        });

        if (!response.ok) {
            // Try to parse error body if JSON
            let text;
            try {
                text = await response.text();
            } catch (e) {
                text = `HTTP error status: ${response.status}`;
            }
            throw new Error(`HTTP error while uploading document: ${response.status} - ${text}`);
        }

        // Parse JSON response
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
        // backend returns { data: [...] }
        return (result && result.data) ? result.data : (Array.isArray(result) ? result : []);
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
     * Returns an array of documents (normalized).
     * Backend may return { documents: [...] } or { data: [...] } or directly an array.
     */
    async getEmployeeDocuments(employeeNumber) {
        const result = await this.jsonpRequest('getEmployeeDocuments', { employeeNumber });

        // Normalize possible shapes
        if (!result) return [];
        if (Array.isArray(result)) return result;
        if (result.documents && Array.isArray(result.documents)) return result.documents;
        if (result.data && Array.isArray(result.data)) return result.data;

        // Some backends wrap documents under different keys
        for (const key of ['documentsList', 'items', 'files']) {
            if (result[key] && Array.isArray(result[key])) return result[key];
        }

        // If result contains document-like properties directly, return empty array
        return [];
    },

    /**
     * Delete a document by fileId (or any id parameter backend expects).
     * Returns backend response object.
     */
    async deleteDocument(fileId) {
        // Many endpoints expect a parameter name like documentId or fileId - backend's doGet/doPost used 'documentId' in some places
        return this.jsonpRequest('deleteDocument', { documentId: fileId, fileId });
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
        return result.grievances || result.data || [];
    },

    async updateGrievanceStatus(grievanceId, status, resolution) {
        return this.jsonpRequest('updateGrievanceStatus', { grievanceId, status, resolution });
    },

    // ==================== SYSTEM API ====================

    async healthCheck() {
        try {
            const result = await this.jsonpRequest('health', {}, 5000);
            return result && result.status === 'healthy';
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
        if (!lastNumber || lastNumber === 'null' || lastNumber === null) {
            return 'GAP0001';
        }
        const numStr = lastNumber.toString();
        const num = parseInt(numStr.replace('GAP', '')) || 0;
        const nextNum = num + 1;
        return 'GAP' + String(nextNum).padStart(4, '0');
    }
};

window.API = API;
