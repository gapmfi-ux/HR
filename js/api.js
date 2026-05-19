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
     * Upload document using iframe method (avoids CORS completely)
     */
    uploadDocumentToDrive: function(formData) {
        return new Promise((resolve, reject) => {
            console.log('Uploading document to Drive using iframe method...');
            
            const iframeId = `upload_iframe_${Date.now()}_${Math.random()}`;
            const iframe = document.createElement('iframe');
            iframe.id = iframeId;
            iframe.name = iframeId;
            iframe.style.display = 'none';
            document.body.appendChild(iframe);
            
            // Create form that targets the iframe
            const uploadForm = document.createElement('form');
            uploadForm.method = 'POST';
            uploadForm.action = this.baseUrl;
            uploadForm.target = iframeId;
            uploadForm.enctype = 'multipart/form-data';
            
            // Add action parameter
            const actionInput = document.createElement('input');
            actionInput.type = 'hidden';
            actionInput.name = 'action';
            actionInput.value = 'uploadDocument';
            uploadForm.appendChild(actionInput);
            
            // Add all form data entries
            for (let pair of formData.entries()) {
                const input = document.createElement('input');
                input.type = 'hidden';
                input.name = pair[0];
                input.value = pair[1];
                uploadForm.appendChild(input);
            }
            
            // Handle iframe load (response)
            iframe.onload = () => {
                try {
                    // Get response from iframe
                    const iframeDoc = iframe.contentDocument || iframe.contentWindow.document;
                    let responseText = '';
                    
                    // Try to get response text
                    if (iframeDoc.body) {
                        responseText = iframeDoc.body.innerText || iframeDoc.body.textContent || '';
                    }
                    
                    console.log('Response from server:', responseText);
                    
                    if (responseText) {
                        // Try to parse as JSON
                        const result = JSON.parse(responseText);
                        if (result.success) {
                            resolve(result);
                        } else {
                            reject(new Error(result.error || 'Upload failed'));
                        }
                    } else {
                        reject(new Error('Empty response from server'));
                    }
                } catch (error) {
                    console.error('Error parsing response:', error);
                    reject(new Error('Failed to parse server response: ' + error.message));
                } finally {
                    // Clean up iframe
                    setTimeout(() => {
                        if (document.body.contains(iframe)) {
                            document.body.removeChild(iframe);
                        }
                    }, 1000);
                }
            };
            
            iframe.onerror = () => {
                reject(new Error('Iframe failed to load'));
                if (document.body.contains(iframe)) {
                    document.body.removeChild(iframe);
                }
            };
            
            // Submit the form
            document.body.appendChild(uploadForm);
            uploadForm.submit();
            
            // Remove form after submission
            setTimeout(() => {
                if (uploadForm.parentNode) {
                    document.body.removeChild(uploadForm);
                }
            }, 100);
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
