// config.js
const CONFIG = {
    // IMPORTANT: Replace with your deployed Apps Script Web App URL
    API_URL: 'https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec',
    
    // Google Sheet ID (reference only)
    SHEET_ID: '153Q9II0uSsbkpWQVrZceRftKnCl2Fj2629jk_HnFKGA',
    
    // Sheet names
    SHEETS: {
        EMPLOYEE_DATA: 'Employee Data',
        PAYROLL: 'payroll',
        APPRAISAL: 'Appraisal',
        GRIEVANCE: 'Grievances',
        EMPLOYEE_DOCS: 'EmployeeDocs'
    },
    
    // App settings
    APP_NAME: 'HR Management System',
    VERSION: '2.0.0',
    
    // Employee number prefix
    EMPLOYEE_PREFIX: 'GAP',
    
    // Pagination
    ITEMS_PER_PAGE: 25,
    
    // Date format
    DATE_FORMAT: 'YYYY-MM-DD'
};
