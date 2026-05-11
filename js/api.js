// api.js
const API = {
    /**
     * Make API request to Google Apps Script backend
     */
    async request(action, data = {}) {
        console.log(`API Request: ${action}`, data);
        
        try {
            const response = await fetch(CONFIG.API_URL, {
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
            return result;
            
        } catch (error) {
            console.error(`API Error (${action}):`, error);
            return { 
                success: false, 
                error: error.message || 'Network error occurred' 
            };
        }
    },
    
    // ==================== EMPLOYEE API ====================
    
    /**
     * Save new employee data
     */
    async saveEmployee(employeeData) {
        return this.request('saveEmployee', employeeData);
    },
    
    /**
     * Get all employees list
     */
    async getEmployeeList() {
        const result = await this.request('getEmployeeList');
        return result.data || result;
    },
    
    /**
     * Get employee by ID/number
     */
    async getEmployeeById(employeeNumber) {
        const result = await this.request('getEmployeeById', { employeeNumber });
        return result.data || result;
    },
    
    /**
     * Update existing employee
     */
    async updateEmployee(employeeData) {
        return this.request('updateEmployee', employeeData);
    },
    
    /**
     * Get last employee number for auto-generation
     */
    async getLastEmployeeNumber() {
        const result = await this.request('getLastEmployeeNumber');
        return result.data || result;
    },
    
    /**
     * Delete employee (set status to inactive)
     */
    async deleteEmployee(employeeNumber) {
        return this.request('deleteEmployee', { employeeNumber });
    },
    
    // ==================== DOCUMENTS API ====================
    
    /**
     * Upload document for employee
     */
    async uploadDocument(documentData) {
        return this.request('uploadDocument', documentData);
    },
    
    /**
     * Get all documents for an employee
     */
    async getEmployeeDocuments(employeeNumber) {
        const result = await this.request('getEmployeeDocuments', { employeeNumber });
        return result.data || result;
    },
    
    /**
     * Delete document
     */
    async deleteDocument(documentId) {
        return this.request('deleteDocument', { documentId });
    },
    
    // ==================== GENERATE EMPLOYEE NUMBER ====================
    
    /**
     * Generate next employee number
     */
    generateEmployeeNumber(lastNumber) {
        if (!lastNumber || lastNumber === 'null' || lastNumber.error) {
            return 'GAP0001';
        }
        const numStr = lastNumber.toString();
        const num = parseInt(numStr.replace('GAP', '')) || 0;
        const nextNum = num + 1;
        return 'GAP' + String(nextNum).padStart(4, '0');
    },
    
    // ==================== HEALTH CHECK ====================
    
    /**
     * Check API connection health
     */
    async checkHealth() {
        try {
            const response = await fetch(CONFIG.API_URL, {
                method: 'HEAD',
                mode: 'cors'
            });
            return response.ok;
        } catch {
            return false;
        }
    }
};
