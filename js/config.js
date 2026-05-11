const CONFIG = {
    // IMPORTANT: Replace with your deployed Apps Script Web App URL
    // The URL should end with /exec
    API_URL: 'https://script.google.com/macros/s/AKfycbxk_k354RlIbl5bLNdSRQxPdkUOlWUqIL6vzVYWkZGwL_T5GmEd2N_jCJCP9f_MjsoQ2A/exec',
    
    // Employee number settings
    EMPLOYEE_PREFIX: 'GAP',
    
    // App settings
    APP_NAME: 'HR Management System',
    VERSION: '2.0.0',
    
    // Pagination
    ITEMS_PER_PAGE: 25,
    
    // File upload limits
    MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
    ALLOWED_FILE_TYPES: [
        'application/pdf',
        'image/jpeg',
        'image/png',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ],
    
    // Request timeout (milliseconds)
    REQUEST_TIMEOUT: 30000
};
