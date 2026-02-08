/**
 * ============================================
 * ALL TO PDF CONVERTER PRO - IMAGE TO PDF MODULE
 * ============================================
 * Resim dosyalarını PDF'e dönüştürme
 * Desteklenen formatlar: JPG, PNG, WEBP, GIF, BMP
 */

'use strict';

// ==========================================
// IMAGE PDF MODULE
// ==========================================
const ImagePDF = {
    files: [],
    
    /**
     * Initialize module
     */
    init() {
        this.bindEvents();
        this.initDropzone();
    },
    
    /**
     * Bind event listeners
     */
    bindEvents() {
        // Convert button
        const convertBtn = document.getElementById('convertImagesBtn');
        if (convertBtn) {
            convertBtn.addEventListener('click', () => this.convert());
        }
        
        // Quality slider
        const qualitySlider = document.getElementById('imageQuality');
        const qualityValue = document.getElementById('qualityValue');
        if (qualitySlider && qualityValue) {
            qualitySlider.addEventListener('input', () => {
                qualityValue.textContent = `${qualitySlider.value}%`;
            });
        }
    },
    
    /**
     * Initialize dropzone
     */
    initDropzone() {
        const dropzone = document.getElementById('imagesDropzone');
        if (!dropzone) return;
        
        Dropzone.init(dropzone, {
            acceptedTypes: ['image/*'],
            multiple: true,
            onFiles: (files) => this.processFiles(files)
        });
    },
    
    /**
     * Process uploaded files
     */
    async processFiles(files) {
        const imageFiles = files.filter(file => file.type.startsWith('image/'));
        
        if (imageFiles.length === 0) {
            Toast.error(Lang.get('error.invalidFile'));
            return;
        }
        
        // Add files to list
        for (const file of imageFiles) {
            try {
                const thumbnail = await this.createThumbnail(file);
                
                this.files.push({
                    id: Utils.generateId(),
                    file: file,
                    name: file.name,
                    size: file.size,
                    type: file.type,
                    thumbnail: thumbnail,
                    rotation: 0,
                    icon: '🖼️'
                });
            } catch (error) {
                console.error('Error processing file:', file.name, error);
            }
        }
        
        this.renderFileList();
        Toast.success(`${imageFiles.length} ${imageFiles.length > 1 ? 'images' : 'image'} added`);
    },
    
    /**
     * Create thumbnail from image file
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
                    const maxSize = 100;
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
                    
                    resolve(canvas.toDataURL('image/jpeg', 0.7));
                };
                
                img.onerror = reject;
                img.src = e.target.result;
            };
            
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    },
    
    /**
     * Render file list
     */
    renderFileList() {
        const container = document.getElementById('imagesList');
        const controls = document.getElementById('imagesControls');
        
        if (!container) return;
        
        container.innerHTML = '';
        
        if (this.files.length === 0) {
            if (controls) controls.style.display = 'none';
            return;
        }
        
        if (controls) controls.style.display = 'flex';
        
        this.files.forEach((fileData, index) => {
            const item = document.createElement('div');
            item.className = 'file-item';
            item.draggable = true;
            item.dataset.index = index;
            item.dataset.id = fileData.id;
            
            item.innerHTML = `
                <img src="${fileData.thumbnail}" alt="" class="file-thumb" style="transform: rotate(${fileData.rotation}deg);">
                <div class="file-info">
                    <div class="file-name">${fileData.name}</div>
                    <div class="file-size">${Utils.formatFileSize(fileData.size)} • ${fileData.rotation}°</div>
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
            
            // Rotate left
            item.querySelector('.rotate-left').addEventListener('click', (e) => {
                e.stopPropagation();
                this.rotateImage(index, -90);
            });
            
            // Rotate right
            item.querySelector('.rotate-right').addEventListener('click', (e) => {
                e.stopPropagation();
                this.rotateImage(index, 90);
            });
            
            // Delete
            item.querySelector('.delete').addEventListener('click', (e) => {
                e.stopPropagation();
                this.removeFile(index);
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
        let draggedIndex = null;
        
        container.addEventListener('dragstart', (e) => {
            if (e.target.classList.contains('file-item')) {
                draggedItem = e.target;
                draggedIndex = parseInt(e.target.dataset.index);
                e.target.classList.add('dragging');
                e.dataTransfer.effectAllowed = 'move';
            }
        });
        
        container.addEventListener('dragend', (e) => {
            if (e.target.classList.contains('file-item')) {
                e.target.classList.remove('dragging');
                draggedItem = null;
                draggedIndex = null;
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
        
        container.addEventListener('drop', (e) => {
            e.preventDefault();
            
            // Reorder files array based on DOM order
            const newOrder = [];
            container.querySelectorAll('.file-item').forEach(item => {
                const id = item.dataset.id;
                const file = this.files.find(f => f.id === id);
                if (file) newOrder.push(file);
            });
            
            this.files = newOrder;
            this.renderFileList();
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
     * Rotate image
     */
    rotateImage(index, degrees) {
        if (this.files[index]) {
            this.files[index].rotation = (this.files[index].rotation + degrees + 360) % 360;
            this.renderFileList();
        }
    },
    
    /**
     * Remove file from list
     */
    removeFile(index) {
        this.files.splice(index, 1);
        this.renderFileList();
        
        if (this.files.length === 0) {
            Toast.info('All images removed');
        }
    },
    
    /**
     * Clear all files
     */
    clearFiles() {
        this.files = [];
        this.renderFileList();
    },
    
    /**
     * Convert images to PDF
     */
    async convert() {
        if (this.files.length === 0) {
            Toast.error(Lang.get('error.noFiles'));
            return;
        }
        
        // Check access
        if (!PlanManager.checkAccess('images')) {
            return;
        }
        
        // Get settings
        const quality = parseInt(document.getElementById('imageQuality')?.value || 80) / 100;
        const addPageNumbers = document.getElementById('addPageNumbers')?.checked || false;
        const pageSize = document.getElementById('pageSize')?.value || 'a4';
        
        // Show progress
        Progress.show('imagesProgress');
        Progress.update('imagesProgress', 0);
        
        try {
            const { jsPDF } = window.jspdf;
            
            // Page dimensions (in mm)
            const pageSizes = {
                a4: { width: 210, height: 297 },
                letter: { width: 215.9, height: 279.4 },
                original: null
            };
            
            let pdf = null;
            const totalFiles = this.files.length;
            
            for (let i = 0; i < totalFiles; i++) {
                const fileData = this.files[i];
                
                // Update progress
                Progress.update('imagesProgress', ((i + 0.5) / totalFiles) * 100);
                
                // Load and process image
                const imgData = await this.processImage(fileData, quality);
                
                // Get image dimensions
                const img = await Utils.loadImage(imgData);
                
                let pageWidth, pageHeight;
                
                if (pageSize === 'original') {
                    // Convert pixels to mm (assuming 96 DPI)
                    pageWidth = (img.width * 25.4) / 96;
                    pageHeight = (img.height * 25.4) / 96;
                } else {
                    pageWidth = pageSizes[pageSize].width;
                    pageHeight = pageSizes[pageSize].height;
                }
                
                // Handle rotation
                let rotation = fileData.rotation;
                let finalWidth = img.width;
                let finalHeight = img.height;
                
                if (rotation === 90 || rotation === 270) {
                    [finalWidth, finalHeight] = [finalHeight, finalWidth];
                }
                
                // Calculate image position to fit page
                const imgAspect = finalWidth / finalHeight;
                const pageAspect = pageWidth / pageHeight;
                
                let drawWidth, drawHeight, drawX, drawY;
                
                if (imgAspect > pageAspect) {
                    drawWidth = pageWidth - 20; // 10mm margin each side
                    drawHeight = drawWidth / imgAspect;
                } else {
                    drawHeight = pageHeight - 20;
                    drawWidth = drawHeight * imgAspect;
                }
                
                drawX = (pageWidth - drawWidth) / 2;
                drawY = (pageHeight - drawHeight) / 2;
                
                // Create or add page
                if (i === 0) {
                    pdf = new jsPDF({
                        orientation: pageWidth > pageHeight ? 'landscape' : 'portrait',
                        unit: 'mm',
                        format: pageSize === 'original' ? [pageWidth, pageHeight] : pageSize
                    });
                } else {
                    pdf.addPage(
                        pageSize === 'original' ? [pageWidth, pageHeight] : pageSize,
                        pageWidth > pageHeight ? 'landscape' : 'portrait'
                    );
                }
                
                // Add image with rotation
                if (rotation === 0) {
                    pdf.addImage(imgData, 'JPEG', drawX, drawY, drawWidth, drawHeight);
                } else {
                    // For rotated images, we need to transform
                    const centerX = pageWidth / 2;
                    const centerY = pageHeight / 2;
                    
                    pdf.saveGraphicsState();
                    
                    // Translate to center, rotate, translate back
                    const angle = rotation * Math.PI / 180;
                    
                    // Use canvas to rotate image
                    const rotatedImg = await this.rotateImageData(imgData, rotation);
                    pdf.addImage(rotatedImg, 'JPEG', drawX, drawY, drawWidth, drawHeight);
                    
                    pdf.restoreGraphicsState();
                }
                
                // Add page number
                if (addPageNumbers) {
                    pdf.setFontSize(10);
                    pdf.setTextColor(100);
                    pdf.text(
                        `${i + 1} / ${totalFiles}`,
                        pageWidth / 2,
                        pageHeight - 10,
                        { align: 'center' }
                    );
                }
                
                // Update progress
                Progress.update('imagesProgress', ((i + 1) / totalFiles) * 100);
            }
            
            // Save PDF
            const filename = `images_${Date.now()}.pdf`;
            pdf.save(filename);
            
            // Use free trial
            PlanManager.useFreeTrial();
            
            // Hide progress and show success
            Progress.hide('imagesProgress');
            Toast.success(Lang.get('success.converted'));
            
        } catch (error) {
            console.error('Conversion error:', error);
            Progress.hide('imagesProgress');
            Toast.error(Lang.get('error.processingFailed'));
        }
    },
    
    /**
     * Process image (compress and prepare for PDF)
     */
    processImage(fileData, quality) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = (e) => {
                const img = new Image();
                
                img.onload = () => {
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');
                    
                    // Calculate max dimensions based on quality
                    let maxWidth = 2000;
                    if (quality < 0.5) maxWidth = 1200;
                    else if (quality < 0.7) maxWidth = 1600;
                    
                    let width = img.width;
                    let height = img.height;
                    
                    // Resize if needed
                    if (width > maxWidth) {
                        height = (height * maxWidth) / width;
                        width = maxWidth;
                    }
                    
                    canvas.width = width;
                    canvas.height = height;
                    
                    // White background (for PNG transparency)
                    ctx.fillStyle = '#FFFFFF';
                    ctx.fillRect(0, 0, width, height);
                    
                    // Draw image
                    ctx.drawImage(img, 0, 0, width, height);
                    
                    resolve(canvas.toDataURL('image/jpeg', quality));
                };
                
                img.onerror = reject;
                img.src = e.target.result;
            };
            
            reader.onerror = reject;
            reader.readAsDataURL(fileData.file);
        });
    },
    
    /**
     * Rotate image data
     */
    rotateImageData(dataUrl, degrees) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                
                // Set canvas size based on rotation
                if (degrees === 90 || degrees === 270) {
                    canvas.width = img.height;
                    canvas.height = img.width;
                } else {
                    canvas.width = img.width;
                    canvas.height = img.height;
                }
                
                // White background
                ctx.fillStyle = '#FFFFFF';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                
                // Rotate
                ctx.translate(canvas.width / 2, canvas.height / 2);
                ctx.rotate((degrees * Math.PI) / 180);
                ctx.drawImage(img, -img.width / 2, -img.height / 2);
                
                resolve(canvas.toDataURL('image/jpeg', 0.9));
            };
            
            img.onerror = reject;
            img.src = dataUrl;
        });
    }
};

// ==========================================
// INITIALIZATION
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    ImagePDF.init();
});

// ==========================================
// EXPORT
// ==========================================
window.ImagePDF = ImagePDF;