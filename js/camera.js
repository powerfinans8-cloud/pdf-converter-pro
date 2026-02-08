/**
 * ============================================
 * ALL TO PDF CONVERTER PRO - CAMERA MODULE
 * ============================================
 * Kamera ile belge tarama ve PDF oluşturma
 * Native file input kullanılıyor (güvenlik kısıtlaması yok)
 */

'use strict';

// ==========================================
// CAMERA MODULE
// ==========================================
const Camera = {
    captures: [],
    captureCounter: 0,
    
    /**
     * Initialize module
     */
    init() {
        this.bindEvents();
    },
    
    /**
     * Bind event listeners
     */
    bindEvents() {
        // Camera input
        const cameraInput = document.getElementById('cameraInput');
        if (cameraInput) {
            cameraInput.addEventListener('change', (e) => {
                const files = Array.from(e.target.files);
                if (files.length > 0) {
                    this.processCaptures(files);
                }
                // Reset input for same file selection
                e.target.value = '';
            });
        }
        
        // Convert to PDF button
        const convertBtn = document.getElementById('cameraToPdfBtn');
        if (convertBtn) {
            convertBtn.addEventListener('click', () => this.convertToPDF());
        }
    },
    
    /**
     * Process captured images
     */
    async processCaptures(files) {
        for (const file of files) {
            if (!file.type.startsWith('image/')) continue;
            
            try {
                this.captureCounter++;
                
                const thumbnail = await this.createThumbnail(file);
                const dimensions = await this.getImageDimensions(file);
                
                this.captures.push({
                    id: Utils.generateId(),
                    file: file,
                    name: `Scan_${this.captureCounter}`,
                    originalName: file.name,
                    size: file.size,
                    thumbnail: thumbnail,
                    number: this.captureCounter,
                    rotation: 0,
                    width: dimensions.width,
                    height: dimensions.height,
                    timestamp: Date.now()
                });
                
            } catch (error) {
                console.error('Error processing capture:', error);
            }
        }
        
        this.renderCaptureList();
        Toast.success(`${files.length} photo${files.length > 1 ? 's' : ''} captured`);
    },
    
    /**
     * Create thumbnail from image
     */
    createThumbnail(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = (e) => {
                const img = new Image();
                
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');
                    
                    // Thumbnail size
                    const maxSize = 120;
                    let width = img.width;
                    let height = img.height;
                    
                    if (width > height) {
                        if (width > maxSize) {
                            height = (height * maxSize) / width;
                            width = maxSize;
                        }
                    } else {
                        if (height > maxSize) {
                            width = (width * maxSize) / height;
                            height = maxSize;
                        }
                    }
                    
                    canvas.width = width;
                    canvas.height = height;
                    ctx.drawImage(img, 0, 0, width, height);
                    
                    resolve(canvas.toDataURL('image/jpeg', 0.8));
                };
                
                img.onerror = reject;
                img.src = e.target.result;
            };
            
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    },
    
    /**
     * Get image dimensions
     */
    getImageDimensions(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = (e) => {
                const img = new Image();
                
                img.onload = () => {
                    resolve({ width: img.width, height: img.height });
                };
                
                img.onerror = reject;
                img.src = e.target.result;
            };
            
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    },
    
    /**
     * Render capture list
     */
    renderCaptureList() {
        const container = document.getElementById('cameraList');
        const controls = document.getElementById('cameraControls');
        
        if (!container) return;
        
        container.innerHTML = '';
        
        if (this.captures.length === 0) {
            if (controls) controls.style.display = 'none';
            return;
        }
        
        if (controls) controls.style.display = 'flex';
        
        // Update numbers based on current order
        this.captures.forEach((capture, index) => {
            capture.number = index + 1;
        });
        
        this.captures.forEach((capture, index) => {
            const item = document.createElement('div');
            item.className = 'file-item';
            item.draggable = true;
            item.dataset.index = index;
            item.dataset.id = capture.id;
            
            item.innerHTML = `
                <div class="capture-number">${capture.number}</div>
                <img src="${capture.thumbnail}" alt="" class="file-thumb" style="transform: rotate(${capture.rotation}deg);">
                <div class="file-info">
                    <div class="file-name">${capture.name}</div>
                    <div class="file-size">
                        ${Utils.formatFileSize(capture.size)} • ${capture.width}x${capture.height}
                    </div>
                </div>
                <div class="file-actions">
                    <button class="rotate-left" title="Rotate Left">
                        <span>↺</span>
                    </button>
                    <button class="rotate-right" title="Rotate Right">
                        <span>↻</span>
                    </button>
                    <button class="delete" title="Delete">
                        <span>🗑️</span>
                    </button>
                </div>
            `;
            
            // Add capture number style
            const numberEl = item.querySelector('.capture-number');
            if (numberEl) {
                numberEl.style.cssText = `
                    position: absolute;
                    top: 5px;
                    left: 5px;
                    background: var(--accent);
                    color: white;
                    width: 24px;
                    height: 24px;
                    border-radius: 2px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-size: 12px;
                    font-weight: bold;
                    z-index: 1;
                `;
            }
            
            // Make file-item relative for number positioning
            item.style.position = 'relative';
            
            // Rotate left
            item.querySelector('.rotate-left').addEventListener('click', (e) => {
                e.stopPropagation();
                this.rotateCapture(index, -90);
            });
            
            // Rotate right
            item.querySelector('.rotate-right').addEventListener('click', (e) => {
                e.stopPropagation();
                this.rotateCapture(index, 90);
            });
            
            // Delete
            item.querySelector('.delete').addEventListener('click', (e) => {
                e.stopPropagation();
                this.removeCapture(index);
            });
            
            container.appendChild(item);
        });
        
        // Initialize sortable
        this.initSortable(container);
    },
    
    /**
     * Initialize drag & drop sorting
     */
    initSortable(container) {
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
                this.reorderFromDOM(container);
                draggedItem = null;
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
    
    /**
     * Get element after drag position
     */
    getDragAfterElement(container, y) {
        const elements = [...container.querySelectorAll('.file-item:not(.dragging)')];
        
        return elements.reduce((closest, child) => {
            const box = child.getBoundingClientRect();
            const offset = y - box.top - box.height / 2;
            
            if (offset < 0 && offset > closest.offset) {
                return { offset: offset, element: child };
            } else {
                return closest;
            }
        }, { offset: Number.NEGATIVE_INFINITY }).element;
    },
    
    /**
     * Reorder captures from DOM order
     */
    reorderFromDOM(container) {
        const newOrder = [];
        container.querySelectorAll('.file-item').forEach(item => {
            const id = item.dataset.id;
            const capture = this.captures.find(c => c.id === id);
            if (capture) newOrder.push(capture);
        });
        this.captures = newOrder;
        this.renderCaptureList();
    },
    
    /**
     * Rotate capture
     */
    rotateCapture(index, degrees) {
        if (this.captures[index]) {
            this.captures[index].rotation = (this.captures[index].rotation + degrees + 360) % 360;
            this.renderCaptureList();
        }
    },
    
    /**
     * Remove capture
     */
    removeCapture(index) {
        this.captures.splice(index, 1);
        this.renderCaptureList();
        
        if (this.captures.length === 0) {
            this.captureCounter = 0;
            Toast.info('All captures removed');
        }
    },
    
    /**
     * Clear all captures
     */
    clearCaptures() {
        this.captures = [];
        this.captureCounter = 0;
        this.renderCaptureList();
    },
    
    /**
     * Convert captures to PDF
     */
    async convertToPDF() {
        if (this.captures.length === 0) {
            Toast.error(Lang.get('error.noFiles'));
            return;
        }
        
        // Check access
        if (!PlanManager.checkAccess('camera')) {
            return;
        }
        
        const addPageNumbers = document.getElementById('cameraPageNumbers')?.checked || false;
        
        Toast.info(Lang.get('progress.converting'));
        
        try {
            const { jsPDF } = window.jspdf;
            
            // A4 dimensions in mm
            const pageWidth = 210;
            const pageHeight = 297;
            const margin = 10;
            
            let pdf = null;
            const totalCaptures = this.captures.length;
            
            for (let i = 0; i < totalCaptures; i++) {
                const capture = this.captures[i];
                
                // Load and process image
                const imgData = await this.processImage(capture);
                
                // Get processed image dimensions
                const img = await Utils.loadImage(imgData);
                
                // Handle rotation for dimension calculation
                let imgWidth = img.width;
                let imgHeight = img.height;
                
                if (capture.rotation === 90 || capture.rotation === 270) {
                    [imgWidth, imgHeight] = [imgHeight, imgWidth];
                }
                
                // Calculate fit dimensions
                const availableWidth = pageWidth - (margin * 2);
                const availableHeight = pageHeight - (margin * 2) - (addPageNumbers ? 10 : 0);
                
                const imgAspect = imgWidth / imgHeight;
                const pageAspect = availableWidth / availableHeight;
                
                let drawWidth, drawHeight;
                
                if (imgAspect > pageAspect) {
                    drawWidth = availableWidth;
                    drawHeight = drawWidth / imgAspect;
                } else {
                    drawHeight = availableHeight;
                    drawWidth = drawHeight * imgAspect;
                }
                
                const drawX = margin + (availableWidth - drawWidth) / 2;
                const drawY = margin + (availableHeight - drawHeight) / 2;
                
                // Create or add page
                if (i === 0) {
                    pdf = new jsPDF({
                        orientation: 'portrait',
                        unit: 'mm',
                        format: 'a4'
                    });
                } else {
                    pdf.addPage('a4', 'portrait');
                }
                
                // Add image (already rotated)
                pdf.addImage(imgData, 'JPEG', drawX, drawY, drawWidth, drawHeight);
                
                // Add page number
                if (addPageNumbers) {
                    pdf.setFontSize(10);
                    pdf.setTextColor(100);
                    pdf.text(
                        `${i + 1} / ${totalCaptures}`,
                        pageWidth / 2,
                        pageHeight - 8,
                        { align: 'center' }
                    );
                }
            }
            
            // Save PDF
            const filename = `scan_${Date.now()}.pdf`;
            pdf.save(filename);
            
            // Use free trial
            PlanManager.useFreeTrial();
            
            Toast.success(Lang.get('success.converted'));
            
        } catch (error) {
            console.error('Conversion error:', error);
            Toast.error(Lang.get('error.processingFailed'));
        }
    },
    
    /**
     * Process image (apply rotation and optimize)
     */
    processImage(capture) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = (e) => {
                const img = new Image();
                
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');
                    
                    // Calculate dimensions with rotation
                    const rotation = capture.rotation;
                    let width = img.width;
                    let height = img.height;
                    
                    // Limit max size for optimization
                    const maxSize = 2000;
                    if (width > maxSize || height > maxSize) {
                        if (width > height) {
                            height = (height * maxSize) / width;
                            width = maxSize;
                        } else {
                            width = (width * maxSize) / height;
                            height = maxSize;
                        }
                    }
                    
                    // Set canvas size based on rotation
                    if (rotation === 90 || rotation === 270) {
                        canvas.width = height;
                        canvas.height = width;
                    } else {
                        canvas.width = width;
                        canvas.height = height;
                    }
                    
                    // White background
                    ctx.fillStyle = '#FFFFFF';
                    ctx.fillRect(0, 0, canvas.width, canvas.height);
                    
                    // Apply rotation
                    ctx.translate(canvas.width / 2, canvas.height / 2);
                    ctx.rotate((rotation * Math.PI) / 180);
                    
                    // Draw image centered
                    if (rotation === 90 || rotation === 270) {
                        ctx.drawImage(img, -canvas.height / 2, -canvas.width / 2, canvas.height, canvas.width);
                    } else {
                        ctx.drawImage(img, -canvas.width / 2, -canvas.height / 2, canvas.width, canvas.height);
                    }
                    
                    // Apply basic document enhancement
                    this.enhanceDocument(ctx, canvas.width, canvas.height);
                    
                    resolve(canvas.toDataURL('image/jpeg', 0.85));
                };
                
                img.onerror = reject;
                img.src = e.target.result;
            };
            
            reader.onerror = reject;
            reader.readAsDataURL(capture.file);
        });
    },
    
    /**
     * Basic document enhancement (contrast boost)
     */
    enhanceDocument(ctx, width, height) {
        try {
            const imageData = ctx.getImageData(0, 0, width, height);
            const data = imageData.data;
            
            // Simple contrast enhancement
            const contrast = 1.1; // Slight contrast boost
            const factor = (259 * (contrast * 255 + 255)) / (255 * (259 - contrast * 255));
            
            for (let i = 0; i < data.length; i += 4) {
                data[i] = Math.min(255, Math.max(0, factor * (data[i] - 128) + 128));     // R
                data[i + 1] = Math.min(255, Math.max(0, factor * (data[i + 1] - 128) + 128)); // G
                data[i + 2] = Math.min(255, Math.max(0, factor * (data[i + 2] - 128) + 128)); // B
            }
            
            ctx.putImageData(imageData, 0, 0);
        } catch (error) {
            // If enhancement fails, continue with original
            console.warn('Document enhancement skipped:', error);
        }
    },
    
    /**
     * Capture new photo (trigger camera input)
     */
    captureNew() {
        const cameraInput = document.getElementById('cameraInput');
        if (cameraInput) {
            cameraInput.click();
        }
    }
};

// ==========================================
// ADDITIONAL STYLES
// ==========================================
const cameraStyles = document.createElement('style');
cameraStyles.textContent = `
    /* Camera capture button enhancement */
    #cameraSection .btn-lg {
        padding: 20px 40px;
        font-size: 1.1rem;
    }
    
    #cameraSection .btn-lg:hover {
        transform: scale(1.02);
    }
    
    /* Capture grid styling */
    #cameraList .file-item {
        position: relative;
    }
    
    #cameraList .file-thumb {
        width: 80px;
        height: 80px;
        object-fit: cover;
    }
    
    /* Add more photos button */
    .add-more-btn {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        width: 100%;
        padding: 15px;
        margin-top: 15px;
        background: var(--bg-secondary);
        border: 1px dashed var(--border-default);
        border-radius: 2px;
        color: var(--text-secondary);
        cursor: pointer;
        transition: var(--transition);
    }
    
    .add-more-btn:hover {
        border-color: var(--border-hover);
        color: var(--accent);
    }
`;
document.head.appendChild(cameraStyles);

// ==========================================
// INITIALIZATION
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    Camera.init();
    
    // Add "Add More Photos" button to camera section
    const cameraList = document.getElementById('cameraList');
    if (cameraList) {
        const addMoreBtn = document.createElement('label');
        addMoreBtn.className = 'add-more-btn';
        addMoreBtn.setAttribute('for', 'cameraInput');
        addMoreBtn.innerHTML = `
            <span>📷</span>
            <span data-i18n="camera.addMore">Add More Photos</span>
        `;
        cameraList.parentNode.insertBefore(addMoreBtn, cameraList.nextSibling);
        
        // Hide initially, show when there are captures
        addMoreBtn.style.display = 'none';
        
        // Override renderCaptureList to show/hide add more button
        const originalRender = Camera.renderCaptureList.bind(Camera);
        Camera.renderCaptureList = function() {
            originalRender();
            addMoreBtn.style.display = this.captures.length > 0 ? 'flex' : 'none';
        };
    }
});

// ==========================================
// EXPORT
// ==========================================
window.Camera = Camera;