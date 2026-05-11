// js/utils.js
// ==================== UTILITY FUNCTIONS ====================

const Utils = {
    /**
     * Format date to YYYY-MM-DD
     */
    formatDate: function(date) {
        if (!date) return '';
        const d = new Date(date);
        return d.toISOString().split('T')[0];
    },
    
    /**
     * Format date for display
     */
    formatDisplayDate: function(date) {
        if (!date) return 'N/A';
        const d = new Date(date);
        return d.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    },
    
    /**
     * Format currency
     */
    formatCurrency: function(amount) {
        if (!amount && amount !== 0) return '₵0.00';
        return new Intl.NumberFormat('en-GH', {
            style: 'currency',
            currency: 'GHS',
            minimumFractionDigits: 2
        }).format(amount);
    },
    
    /**
     * Format number
     */
    formatNumber: function(num) {
        if (!num && num !== 0) return '0';
        return num.toLocaleString();
    },
    
    /**
     * Show toast message
     */
    showToast: function(message, type = 'success') {
        // Remove existing toast
        const existingToast = document.querySelector('.toast');
        if (existingToast) existingToast.remove();
        
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
            <span>${this.escapeHtml(message)}</span>
        `;
        
        // Add styles if not present
        if (!document.querySelector('#toast-styles')) {
            const style = document.createElement('style');
            style.id = 'toast-styles';
            style.textContent = `
                .toast {
                    position: fixed;
                    bottom: 20px;
                    right: 20px;
                    background: white;
                    padding: 12px 20px;
                    border-radius: 8px;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    z-index: 9999;
                    animation: slideIn 0.3s ease;
                    font-size: 14px;
                }
                .toast-success { border-left: 4px solid #22c55e; color: #166534; }
                .toast-error { border-left: 4px solid #ef4444; color: #991b1b; }
                .toast-info { border-left: 4px solid #3b82f6; color: #1e40af; }
                @keyframes slideIn {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
            `;
            document.head.appendChild(style);
        }
        
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    },
    
    /**
     * Show confirmation dialog
     */
    confirm: function(message, title = 'Confirm') {
        return new Promise((resolve) => {
            // Remove existing modal
            const existingModal = document.querySelector('.confirm-modal');
            if (existingModal) existingModal.remove();
            
            const modal = document.createElement('div');
            modal.className = 'confirm-modal modal';
            modal.innerHTML = `
                <div class="modal-content" style="max-width: 400px;">
                    <div class="modal-header">
                        <h3>${this.escapeHtml(title)}</h3>
                        <button class="modal-close">&times;</button>
                    </div>
                    <div class="modal-body">
                        <p>${this.escapeHtml(message)}</p>
                    </div>
                    <div class="modal-footer">
                        <button class="btn btn-secondary" id="confirmNo">Cancel</button>
                        <button class="btn btn-primary" id="confirmYes">Confirm</button>
                    </div>
                </div>
            `;
            
            document.body.appendChild(modal);
            modal.classList.add('active');
            
            const close = () => {
                modal.classList.remove('active');
                setTimeout(() => modal.remove(), 300);
            };
            
            modal.querySelector('.modal-close').onclick = () => {
                close();
                resolve(false);
            };
            modal.querySelector('#confirmNo').onclick = () => {
                close();
                resolve(false);
            };
            modal.querySelector('#confirmYes').onclick = () => {
                close();
                resolve(true);
            };
        });
    },
    
    /**
     * Show loading overlay
     */
    showLoading: function() {
        let loader = document.getElementById('globalLoader');
        if (!loader) {
            loader = document.createElement('div');
            loader.id = 'globalLoader';
            loader.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0,0,0,0.5);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 10000;
            `;
            loader.innerHTML = `
                <div style="background: white; padding: 20px; border-radius: 12px; display: flex; flex-direction: column; align-items: center; gap: 12px;">
                    <div class="loader"></div>
                    <p>Loading...</p>
                </div>
            `;
            document.body.appendChild(loader);
        }
        loader.style.display = 'flex';
    },
    
    /**
     * Hide loading overlay
     */
    hideLoading: function() {
        const loader = document.getElementById('globalLoader');
        if (loader) {
            loader.style.display = 'none';
        }
    },
    
    /**
     * Validate email
     */
    isValidEmail: function(email) {
        if (!email) return true;
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    },
    
    /**
     * Validate phone number (Ghana format)
     */
    isValidPhone: function(phone) {
        if (!phone) return true;
        const re = /^(0[2-9]\d{8}|[+][2][3][3][2-9]\d{8})$/;
        return re.test(phone);
    },
    
    /**
     * Escape HTML to prevent XSS
     */
    escapeHtml: function(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    },
    
    /**
     * Get file icon based on mime type
     */
    getFileIcon: function(mimeType) {
        if (!mimeType) return 'fa-file';
        if (mimeType.includes('pdf')) return 'fa-file-pdf';
        if (mimeType.includes('image')) return 'fa-file-image';
        if (mimeType.includes('word')) return 'fa-file-word';
        if (mimeType.includes('excel')) return 'fa-file-excel';
        return 'fa-file';
    },
    
    /**
     * Format file size
     */
    formatFileSize: function(bytes) {
        if (!bytes) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    },
    
    /**
     * Debounce function
     */
    debounce: function(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
};

// Make Utils global
window.Utils = Utils;
