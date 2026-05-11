
const API = {
    // Store the base URL from config
    baseUrl: CONFIG.API_URL,
    
    /**
     * Make API request to Google Apps Script backend
     */
    async request(action, data = {}) {
        console.log(`API Request: ${action}`, data);
        
        // Show loading indicator for important requests
        const showLoading = !['getEmployeeList', 'health'].includes(action);
        if (showLoading && Utils) Utils.showLoading();
        
        try {
            const response = await fetch(this.baseUrl, {
                method: 'POST',
                mode: 'cors',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ action, data })
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const result = await response.json();
            console.log(`API Response (${action}):`, result);
            
            if (showLoading && Utils) Utils.hideLoading();
            
            return result;
            
        } catch (error) {
            console.error(`API Error (${action}):`, error);
            if (showLoading && Utils) Utils.hideLoading();
            
            // Show user-friendly error message
            if (Utils && action !== 'health') {
                Utils.showToast('Network error. Please check your connection and try again.', 'error');
            }
            
            return { 
                success: false, 
                error: error.message || 'Network error occurred' 
            };
        }
    },
    
    // ==================== EMPLOYEE API ====================
    
    async saveEmployee(employeeData) {
        return this.request('saveEmployee', employeeData);
    },
    
    async getEmployeeList() {
        const result = await this.request('getEmployeeList');
        return result.success ? result.data : [];
    },
    
    async getEmployeeById(employeeNumber) {
        const result = await this.request('getEmployeeById', { employeeNumber });
        return result.success ? result.data : { error: result.error };
    },
    
    async updateEmployee(employeeData) {
        return this.request('updateEmployee', employeeData);
    },
    
    async deleteEmployee(employeeNumber) {
        return this.request('deleteEmployee', { employeeNumber });
    },
    
    async getLastEmployeeNumber() {
        const result = await this.request('getLastEmployeeNumber');
        return result.success ? result.data : null;
    },
    
    // ==================== DOCUMENTS API ====================
    
    async uploadDocument(documentData) {
        return this.request('uploadDocument', documentData);
    },
    
    async getEmployeeDocuments(employeeNumber) {
        const result = await this.request('getEmployeeDocuments', { employeeNumber });
        return result.documents || [];
    },
    
    // ==================== GENERATE EMPLOYEE NUMBER ====================
    
    generateEmployeeNumber(lastNumber) {
        if (!lastNumber || lastNumber === 'null') {
            return 'GAP0001';
        }
        const numStr = lastNumber.toString();
        const num = parseInt(numStr.replace('GAP', '')) || 0;
        const nextNum = num + 1;
        return 'GAP' + String(nextNum).padStart(4, '0');
    },
    
    // ==================== HEALTH CHECK ====================
    
    async checkHealth() {
        try {
            const response = await fetch(this.baseUrl, {
                method: 'HEAD',
                mode: 'cors'
            });
            return response.ok;
        } catch {
            return false;
        }
    }
};
