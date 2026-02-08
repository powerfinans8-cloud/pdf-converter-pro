/**
 * ============================================
 * ALL TO PDF CONVERTER PRO - CORE MODULE
 * ============================================
 * Temel fonksiyonlar, utilities, event handlers
 */

'use strict';

// ==========================================
// GLOBAL STATE
// ==========================================
const App = {
    currentSection: 'dashboard',
    currentTool: null,
    freeTrialsLeft: 5,
    userPlan: 'free', // 'free', 'basic', 'pro'
    files: {
        images: [],
        word: null,
        pdfs: [],
        camera: []
    }
};

// ==========================================
// DOM UTILITIES
// ==========================================
const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => document.querySelectorAll(selector);

const DOM = {
    // Sections
    sections: {
        dashboard: $('#dashboardSection'),
        images: $('#imagesSection'),
        word: $('#wordSection'),
        merge: $('#mergeSection'),
        camera: $('#cameraSection'),
        editor: $('#editorSection')
    },
    
    // Modals
    modals: {
        upgrade: $('#upgradeModal'),
        save: $('#saveModal')
    },
    
    // Common elements
    toastContainer: $('#toastContainer'),
    langBtn: $('#langBtn'),
    langDropdown: $('#langDropdown'),
    currentLang: $('#currentLang')
};

// ==========================================
// UTILITY FUNCTIONS
// ==========================================
const Utils = {
    /**
     * Format bytes to human readable size
     */
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    },

    /**
     * Generate unique ID
     */
    generateId() {
        return 'id_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    },

    /**
     * Debounce function
     */
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    /**
     * Check if file type is valid
     */
    isValidFileType(file, acceptedTypes) {
        const fileType = file.type.toLowerCase();
        const fileName = file.name.toLowerCase();
        
        return acceptedTypes.some(type => {
            if (type.startsWith('.')) {
                return fileName.endsWith(type);
            }
            if (type.endsWith('/*')) {
                return fileType.startsWith(type.replace('/*', ''));
            }
            return fileType === type;
        });
    },

    /**
     * Read file as Data URL
     */
    readFileAsDataURL(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = (e) => reject(e);
            reader.readAsDataURL(file);
        });
    },

    /**
     * Read file as Array Buffer
     */
    readFileAsArrayBuffer(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = (e) => reject(e);
            reader.readAsArrayBuffer(file);
        });
    },

    /**
     * Download blob as file
     */
    downloadBlob(blob, filename) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    },

    /**
     * Compress image
     */
    compressImage(file, quality = 0.8, maxWidth = 1920) {
        return new Promise((resolve) => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const img = new Image();
            
            img.onload = () => {
                let width = img.width;
                let height = img.height;
                
                if (width > maxWidth) {
                    height = (height * maxWidth) / width;
                    width = maxWidth;
                }
                
                canvas.width = width;
                canvas.height = height;
                ctx.drawImage(img, 0, 0, width, height);
                
                canvas.toBlob(
                    (blob) => resolve(blob),
                    'image/jpeg',
                    quality
                );
            };
            
            img.src = URL.createObjectURL(file);
        });
    },

    /**
     * Load image and get dimensions
     */
    loadImage(src) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = reject;
            img.src = src;
        });
    },

    /**
     * Sleep/delay function
     */
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
};

// ==========================================
// TOAST NOTIFICATIONS
// ==========================================
const Toast = {
    show(message, type = 'info', duration = 3000) {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        
        const icons = {
            success: '✅',
            error: '❌',
            warning: '⚠️',
            info: 'ℹ️'
        };
        
        toast.innerHTML = `
            <span class="toast-icon">${icons[type]}</span>
            <span class="toast-message">${message}</span>
            <button class="toast-close">&times;</button>
        `;
        
        DOM.toastContainer.appendChild(toast);
        
        // Close button
        toast.querySelector('.toast-close').addEventListener('click', () => {
            this.hide(toast);
        });
        
        // Auto hide
        if (duration > 0) {
            setTimeout(() => this.hide(toast), duration);
        }
        
        return toast;
    },
    
    hide(toast) {
        toast.style.animation = 'slideIn 0.3s ease reverse';
        setTimeout(() => toast.remove(), 300);
    },
    
    success(message) { return this.show(message, 'success'); },
    error(message) { return this.show(message, 'error'); },
    warning(message) { return this.show(message, 'warning'); },
    info(message) { return this.show(message, 'info'); }
};

// ==========================================
// MODAL MANAGEMENT
// ==========================================
const Modal = {
    open(modalId) {
        const modal = DOM.modals[modalId] || $(`#${modalId}`);
        if (modal) {
            modal.classList.add('show');
            document.body.style.overflow = 'hidden';
        }
    },
    
    close(modalId) {
        const modal = DOM.modals[modalId] || $(`#${modalId}`);
        if (modal) {
            modal.classList.remove('show');
            document.body.style.overflow = '';
        }
    },
    
    closeAll() {
        $$('.modal-overlay.show').forEach(modal => {
            modal.classList.remove('show');
        });
        document.body.style.overflow = '';
    }
};

// ==========================================
// SECTION NAVIGATION
// ==========================================
const Navigation = {
    goTo(sectionName) {
        // Hide all sections
        Object.values(DOM.sections).forEach(section => {
            if (section) section.classList.remove('active');
        });
        
        // Show target section
        const targetSection = DOM.sections[sectionName];
        if (targetSection) {
            targetSection.classList.add('active');
            App.currentSection = sectionName;
            App.currentTool = sectionName !== 'dashboard' ? sectionName : null;
        }
        
        // Scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    
    goBack() {
        this.goTo('dashboard');
    }
};

// ==========================================
// DROPZONE HANDLER
// ==========================================
const Dropzone = {
    init(element, options = {}) {
        const {
            onFiles = () => {},
            acceptedTypes = ['*/*'],
            multiple = true
        } = options;
        
        const input = element.querySelector('input[type="file"]');
        
        // Click to browse
        element.addEventListener('click', (e) => {
            if (e.target !== input) {
                input.click();
            }
        });
        
        // File input change
        input.addEventListener('change', (e) => {
            const files = Array.from(e.target.files);
            if (files.length > 0) {
                onFiles(files);
            }
            input.value = ''; // Reset for same file selection
        });
        
        // Drag events
        element.addEventListener('dragover', (e) => {
            e.preventDefault();
            element.classList.add('dragover');
        });
        
        element.addEventListener('dragleave', (e) => {
            e.preventDefault();
            element.classList.remove('dragover');
        });
        
        element.addEventListener('drop', (e) => {
            e.preventDefault();
            element.classList.remove('dragover');
            
            const files = Array.from(e.dataTransfer.files);
            if (files.length > 0) {
                // Filter by accepted types if specified
                const validFiles = files.filter(file => 
                    Utils.isValidFileType(file, acceptedTypes)
                );
                
                if (validFiles.length > 0) {
                    onFiles(multiple ? validFiles : [validFiles[0]]);
                } else {
                    Toast.error(Lang.get('error.invalidFile'));
                }
            }
        });
    }
};

// ==========================================
// DRAG & DROP SORTABLE
// ==========================================
const Sortable = {
    init(container, onSort = () => {}) {
        let draggedItem = null;
        
        container.addEventListener('dragstart', (e) => {
            if (e.target.classList.contains('file-item')) {
                draggedItem = e.target;
                e.target.classList.add('dragging');
                e.dataTransfer.effectAllowed = 'move';
            }
        });
        
        container.addEventListener('dragend', (e) => {
            if (e.target.classList.contains('file-item')) {
                e.target.classList.remove('dragging');
                draggedItem = null;
                onSort();
            }
        });
        
        container.addEventListener('dragover', (e) => {
            e.preventDefault();
            const afterElement = this.getDragAfterElement(container, e.clientY);
            
            if (draggedItem) {
                if (afterElement == null) {
                    container.appendChild(draggedItem);
                } else {
                    container.insertBefore(draggedItem, afterElement);
                }
            }
        });
    },
    
    getDragAfterElement(container, y) {
        const draggableElements = [
            ...container.querySelectorAll('.file-item:not(.dragging)')
        ];
        
        return draggableElements.reduce((closest, child) => {
            const box = child.getBoundingClientRect();
            const offset = y - box.top - box.height / 2;
            
            if (offset < 0 && offset > closest.offset) {
                return { offset: offset, element: child };
            } else {
                return closest;
            }
        }, { offset: Number.NEGATIVE_INFINITY }).element;
    }
};

// ==========================================
// PROGRESS BAR
// ==========================================
const Progress = {
    show(containerId) {
        const container = $(`#${containerId}`);
        if (container) {
            container.classList.add('show');
        }
    },
    
    hide(containerId) {
        const container = $(`#${containerId}`);
        if (container) {
            container.classList.remove('show');
        }
    },
    
    update(containerId, percent) {
        const fill = $(`#${containerId}Fill`);
        const text = $(`#${containerId}Percent`);
        
        if (fill) fill.style.width = `${percent}%`;
        if (text) text.textContent = `${Math.round(percent)}%`;
    }
};

// ==========================================
// PLAN & TRIAL MANAGEMENT
// ==========================================
const PlanManager = {
    init() {
        // Load saved data from localStorage
        const savedPlan = localStorage.getItem('userPlan');
        const savedTrials = localStorage.getItem('freeTrialsLeft');
        
        if (savedPlan) App.userPlan = savedPlan;
        if (savedTrials !== null) App.freeTrialsLeft = parseInt(savedTrials);
    },
    
    checkAccess(feature) {
        // Pro features
        const proFeatures = ['editor'];
        
        // Check if Pro feature
        if (proFeatures.includes(feature) && App.userPlan !== 'pro') {
            Modal.open('upgrade');
            return false;
        }
        
        // Check free trials
        if (App.userPlan === 'free') {
            if (App.freeTrialsLeft <= 0) {
                Modal.open('upgrade');
                return false;
            }
        }
        
        return true;
    },
    
    useFreeTrial() {
        if (App.userPlan === 'free' && App.freeTrialsLeft > 0) {
            App.freeTrialsLeft--;
            localStorage.setItem('freeTrialsLeft', App.freeTrialsLeft);
            
            if (App.freeTrialsLeft <= 2 && App.freeTrialsLeft > 0) {
                Toast.warning(Lang.get('trial.remaining').replace('{n}', App.freeTrialsLeft));
            }
        }
    },
    
    setPlan(plan) {
        App.userPlan = plan;
        localStorage.setItem('userPlan', plan);
        Toast.success(Lang.get('upgrade.success'));
        Modal.close('upgrade');
    }
};

// ==========================================
// FILE LIST RENDERER
// ==========================================
const FileList = {
    render(containerId, files, options = {}) {
        const container = $(`#${containerId}`);
        if (!container) return;
        
        const {
            showThumb = true,
            showRotate = false,
            showDelete = true,
            onDelete = () => {},
            onRotate = () => {}
        } = options;
        
        container.innerHTML = '';
        
        files.forEach((file, index) => {
            const item = document.createElement('div');
            item.className = 'file-item';
            item.draggable = true;
            item.dataset.index = index;
            
            const thumbHtml = showThumb && file.thumbnail 
                ? `<img src="${file.thumbnail}" alt="" class="file-thumb">`
                : `<div class="file-thumb" style="display:flex;align-items:center;justify-content:center;font-size:1.5rem;">${file.icon || '📄'}</div>`;
            
            const rotateBtn = showRotate 
                ? `<button class="rotate" title="Rotate"><span>🔄</span></button>` 
                : '';
            
            const deleteBtn = showDelete 
                ? `<button class="delete" title="Delete"><span>🗑️</span></button>` 
                : '';
            
            item.innerHTML = `
                ${thumbHtml}
                <div class="file-info">
                    <div class="file-name">${file.name}</div>
                    <div class="file-size">${Utils.formatFileSize(file.size)}</div>
                </div>
                <div class="file-actions">
                    ${rotateBtn}
                    ${deleteBtn}
                </div>
            `;
            
            // Event listeners
            if (showRotate) {
                item.querySelector('.rotate')?.addEventListener('click', (e) => {
                    e.stopPropagation();
                    onRotate(index);
                });
            }
            
            if (showDelete) {
                item.querySelector('.delete')?.addEventListener('click', (e) => {
                    e.stopPropagation();
                    onDelete(index);
                });
            }
            
            container.appendChild(item);
        });
        
        // Show/hide controls
        const controls = $(`#${containerId.replace('List', 'Controls')}`);
        if (controls) {
            controls.style.display = files.length > 0 ? 'flex' : 'none';
        }
    }
};

// ==========================================
// EVENT LISTENERS
// ==========================================
function initEventListeners() {
    // Language dropdown toggle
    DOM.langBtn?.addEventListener('click', (e) => {
        e.stopPropagation();
        DOM.langDropdown.classList.toggle('show');
    });
    
    // Language selection
    $$('.lang-option').forEach(option => {
        option.addEventListener('click', () => {
            const lang = option.dataset.lang;
            Lang.set(lang);
            DOM.langDropdown.classList.remove('show');
        });
    });
    
    // Close dropdown on outside click
    document.addEventListener('click', () => {
        DOM.langDropdown?.classList.remove('show');
    });
    
    // Tool cards click
    $$('.tool-card').forEach(card => {
        card.addEventListener('click', () => {
            const tool = card.dataset.tool;
            
            // Check access for Pro features
            if (tool === 'editor' && !PlanManager.checkAccess('editor')) {
                return;
            }
            
            Navigation.goTo(tool);
        });
    });
    
    // Back buttons
    $$('[data-back]').forEach(btn => {
        btn.addEventListener('click', () => Navigation.goBack());
    });
    
    // Home link
    $('#homeLink')?.addEventListener('click', (e) => {
        e.preventDefault();
        Navigation.goBack();
    });
    
    // Modal close buttons
    $$('[data-close-modal]').forEach(btn => {
        btn.addEventListener('click', () => Modal.closeAll());
    });
    
    // Click outside modal to close
    $$('.modal-overlay').forEach(overlay => {
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                Modal.closeAll();
            }
        });
    });
    
    // Plan selection
    $$('[data-plan]').forEach(btn => {
        btn.addEventListener('click', () => {
            const plan = btn.dataset.plan;
            // This will trigger payment flow (handled in payment.js)
            if (typeof Payment !== 'undefined') {
                Payment.initCheckout(plan);
            } else {
                PlanManager.setPlan(plan);
            }
        });
    });
    
    // Main dropzone (dashboard)
    const mainDropzone = $('#mainDropzone');
    if (mainDropzone) {
        Dropzone.init(mainDropzone, {
            acceptedTypes: ['image/*', '.pdf', '.docx', '.doc'],
            onFiles: (files) => {
                const file = files[0];
                const type = file.type;
                const name = file.name.toLowerCase();
                
                // Determine which tool to use based on file type
                if (type.startsWith('image/')) {
                    App.files.images = files.map(f => ({
                        file: f,
                        name: f.name,
                        size: f.size,
                        rotation: 0
                    }));
                    Navigation.goTo('images');
                    // Trigger image module to process
                    if (typeof ImagePDF !== 'undefined') {
                        ImagePDF.processFiles(files);
                    }
                } else if (name.endsWith('.pdf')) {
                    App.files.pdfs = files.map(f => ({
                        file: f,
                        name: f.name,
                        size: f.size
                    }));
                    Navigation.goTo('merge');
                    if (typeof MergeSplit !== 'undefined') {
                        MergeSplit.processFiles(files);
                    }
                } else if (name.endsWith('.docx') || name.endsWith('.doc')) {
                    App.files.word = {
                        file: files[0],
                        name: files[0].name,
                        size: files[0].size
                    };
                    Navigation.goTo('word');
                    if (typeof WordPDF !== 'undefined') {
                        WordPDF.processFile(files[0]);
                    }
                }
            }
        });
    }
    
    // Keyboard shortcuts
    document.addEventListener('keydown', (e) => {
        // ESC to close modals
        if (e.key === 'Escape') {
            Modal.closeAll();
        }
    });
    
    // Quality slider value display
    const qualitySlider = $('#imageQuality');
    const qualityValue = $('#qualityValue');
    if (qualitySlider && qualityValue) {
        qualitySlider.addEventListener('input', () => {
            qualityValue.textContent = `${qualitySlider.value}%`;
        });
    }
    
    // Merge/Split mode toggle
    const mergeModeBtn = $('#mergeModeBtn');
    const splitModeBtn = $('#splitModeBtn');
    const splitFormatGroup = $('#splitFormatGroup');
    
    mergeModeBtn?.addEventListener('click', () => {
        mergeModeBtn.dataset.active = 'true';
        splitModeBtn.dataset.active = 'false';
        mergeModeBtn.classList.add('btn-primary');
        splitModeBtn.classList.remove('btn-primary');
        if (splitFormatGroup) splitFormatGroup.style.display = 'none';
    });
    
    splitModeBtn?.addEventListener('click', () => {
        splitModeBtn.dataset.active = 'true';
        mergeModeBtn.dataset.active = 'false';
        splitModeBtn.classList.add('btn-primary');
        mergeModeBtn.classList.remove('btn-primary');
        if (splitFormatGroup) splitFormatGroup.style.display = 'flex';
    });
}

// ==========================================
// INITIALIZATION
// ==========================================
function initApp() {
    console.log('🚀 All to PDF Converter Pro - Initializing...');
    
    // Initialize plan manager
    PlanManager.init();
    
    // Initialize event listeners
    initEventListeners();
    
    // Initialize language (will be called from language.js)
    if (typeof Lang !== 'undefined') {
        Lang.init();
    }
    
    console.log('✅ App initialized successfully');
}

// Run on DOM ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
}

// ==========================================
// EXPORTS (for other modules)
// ==========================================
window.App = App;
window.Utils = Utils;
window.Toast = Toast;
window.Modal = Modal;
window.Navigation = Navigation;
window.Dropzone = Dropzone;
window.Sortable = Sortable;
window.Progress = Progress;
window.PlanManager = PlanManager;
window.FileList = FileList;