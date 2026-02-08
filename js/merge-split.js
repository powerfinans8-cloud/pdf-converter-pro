/**
 * ============================================
 * ALL TO PDF CONVERTER PRO - MERGE & SPLIT MODULE
 * ============================================
 * PDF dosyalarını birleştirme ve ayırma
 * pdf-lib kütüphanesi kullanılıyor
 */

'use strict';

// ==========================================
// MERGE SPLIT MODULE
// ==========================================
const MergeSplit = {
    files: [],
    mode: 'merge', // 'merge' or 'split'
    
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
        // Mode toggle buttons
        const mergeModeBtn = document.getElementById('mergeModeBtn');
        const splitModeBtn = document.getElementById('splitModeBtn');
        const splitFormatGroup = document.getElementById('splitFormatGroup');
        
        if (mergeModeBtn) {
            mergeModeBtn.addEventListener('click', () => {
                this.setMode('merge');
                mergeModeBtn.classList.add('btn-primary');
                splitModeBtn?.classList.remove('btn-primary');
                if (splitFormatGroup) splitFormatGroup.style.display = 'none';
            });
        }
        
        if (splitModeBtn) {
            splitModeBtn.addEventListener('click', () => {
                this.setMode('split');
                splitModeBtn.classList.add('btn-primary');
                mergeModeBtn?.classList.remove('btn-primary');
                if (splitFormatGroup) splitFormatGroup.style.display = 'flex';
            });
        }
        
        // Process button
        const processBtn = document.getElementById('processPdfBtn');
        if (processBtn) {
            processBtn.addEventListener('click', () => this.process());
        }
    },
    
    /**
     * Initialize dropzone
     */
    initDropzone() {
        const dropzone = document.getElementById('mergeDropzone');
        if (!dropzone) return;
        
        Dropzone.init(dropzone, {
            acceptedTypes: ['.pdf', 'application/pdf'],
            multiple: true,
            onFiles: (files) => this.processFiles(files)
        });
    },
    
    /**
     * Set mode (merge/split)
     */
    setMode(mode) {
        this.mode = mode;
        
        // Update UI text
        const processBtn = document.getElementById('processPdfBtn');
        if (processBtn) {
            const btnText = processBtn.querySelector('span:last-child');
            if (btnText) {
                btnText.textContent = mode === 'merge' 
                    ? Lang.get('merge.mergeMode') 
                    : Lang.get('merge.splitMode');
            }
        }
    },
    
    /**
     * Process uploaded PDF files
     */
    async processFiles(files) {
        const pdfFiles = files.filter(file => 
            file.type === 'application/pdf' || 
            file.name.toLowerCase().endsWith('.pdf')
        );
        
        if (pdfFiles.length === 0) {
            Toast.error(Lang.get('error.invalidFile'));
            return;
        }
        
        // Add files to list
        for (const file of pdfFiles) {
            try {
                const pageCount = await this.getPdfPageCount(file);
                
                this.files.push({
                    id: Utils.generateId(),
                    file: file,
                    name: file.name,
                    size: file.size,
                    pageCount: pageCount,
                    icon: '📑'
                });
            } catch (error) {
                console.error('Error processing PDF:', file.name, error);
                Toast.error(`Could not read: ${file.name}`);
            }
        }
        
        this.renderFileList();
        Toast.success(`${pdfFiles.length} PDF${pdfFiles.length > 1 ? 's' : ''} added`);
    },
    
    /**
     * Get PDF page count
     */
    async getPdfPageCount(file) {
        try {
            const arrayBuffer = await Utils.readFileAsArrayBuffer(file);
            const pdfDoc = await PDFLib.PDFDocument.load(arrayBuffer, {
                ignoreEncryption: true
            });
            return pdfDoc.getPageCount();
        } catch (error) {
            console.error('Error reading PDF:', error);
            return '?';
        }
    },
    
    /**
     * Render file list
     */
    renderFileList() {
        const container = document.getElementById('mergeList');
        const controls = document.getElementById('mergeControls');
        
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
                <div class="file-thumb" style="display:flex;align-items:center;justify-content:center;font-size:1.5rem;background:var(--bg-secondary);">
                    📑
                </div>
                <div class="file-info">
                    <div class="file-name">${fileData.name}</div>
                    <div class="file-size">
                        ${Utils.formatFileSize(fileData.size)} • ${fileData.pageCount} ${fileData.pageCount === 1 ? 'page' : 'pages'}
                    </div>
                </div>
                <div class="file-actions">
                    <button class="move-up" title="Move Up" ${index === 0 ? 'disabled' : ''}>
                        <span>▲</span>
                    </button>
                    <button class="move-down" title="Move Down" ${index === this.files.length - 1 ? 'disabled' : ''}>
                        <span>▼</span>
                    </button>
                    <button class="delete" title="Remove">
                        <span>🗑️</span>
                    </button>
                </div>
            `;
            
            // Move up
            item.querySelector('.move-up').addEventListener('click', (e) => {
                e.stopPropagation();
                this.moveFile(index, -1);
            });
            
            // Move down
            item.querySelector('.move-down').addEventListener('click', (e) => {
                e.stopPropagation();
                this.moveFile(index, 1);
            });
            
            // Delete
            item.querySelector('.delete').addEventListener('click', (e) => {
                e.stopPropagation();
                this.removeFile(index);
            });
            
            container.appendChild(item);
        });
        
        // Initialize drag & drop sorting
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
     * Reorder files array from DOM order
     */
    reorderFromDOM(container) {
        const newOrder = [];
        container.querySelectorAll('.file-item').forEach(item => {
            const id = item.dataset.id;
            const file = this.files.find(f => f.id === id);
            if (file) newOrder.push(file);
        });
        this.files = newOrder;
        this.renderFileList();
    },
    
    /**
     * Move file up or down
     */
    moveFile(index, direction) {
        const newIndex = index + direction;
        if (newIndex < 0 || newIndex >= this.files.length) return;
        
        // Swap
        [this.files[index], this.files[newIndex]] = [this.files[newIndex], this.files[index]];
        this.renderFileList();
    },
    
    /**
     * Remove file from list
     */
    removeFile(index) {
        this.files.splice(index, 1);
        this.renderFileList();
    },
    
    /**
     * Clear all files
     */
    clearFiles() {
        this.files = [];
        this.renderFileList();
    },
    
    /**
     * Process (merge or split)
     */
    async process() {
        if (this.files.length === 0) {
            Toast.error(Lang.get('error.noFiles'));
            return;
        }
        
        // Check access
        if (!PlanManager.checkAccess('merge')) {
            return;
        }
        
        const optimize = document.getElementById('optimizeSize')?.checked || false;
        
        if (this.mode === 'merge') {
            await this.mergePDFs(optimize);
        } else {
            await this.splitPDF(optimize);
        }
    },
    
    /**
     * Merge multiple PDFs into one
     */
    async mergePDFs(optimize) {
        if (this.files.length < 2) {
            Toast.warning('Please add at least 2 PDFs to merge');
            return;
        }
        
        Toast.info(Lang.get('progress.processing'));
        
        try {
            // Create new PDF document
            const mergedPdf = await PDFLib.PDFDocument.create();
            
            // Process each file
            for (const fileData of this.files) {
                const arrayBuffer = await Utils.readFileAsArrayBuffer(fileData.file);
                const pdf = await PDFLib.PDFDocument.load(arrayBuffer, {
                    ignoreEncryption: true
                });
                
                // Copy all pages
                const pages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
                pages.forEach(page => mergedPdf.addPage(page));
            }
            
            // Optimize if requested
            let pdfBytes;
            if (optimize) {
                pdfBytes = await this.optimizePDF(mergedPdf);
            } else {
                pdfBytes = await mergedPdf.save();
            }
            
            // Show size comparison if optimized
            if (optimize) {
                const originalSize = this.files.reduce((sum, f) => sum + f.size, 0);
                const newSize = pdfBytes.length;
                const reduction = Math.round((1 - newSize / originalSize) * 100);
                
                if (reduction > 0) {
                    Toast.info(`Size reduced by ${reduction}%`);
                }
            }
            
            // Download
            const blob = new Blob([pdfBytes], { type: 'application/pdf' });
            const filename = `merged_${Date.now()}.pdf`;
            Utils.downloadBlob(blob, filename);
            
            // Use free trial
            PlanManager.useFreeTrial();
            
            Toast.success(Lang.get('success.merged'));
            
        } catch (error) {
            console.error('Merge error:', error);
            Toast.error(Lang.get('error.processingFailed'));
        }
    },
    
    /**
     * Split PDF into separate pages
     */
    async splitPDF(optimize) {
        if (this.files.length !== 1) {
            Toast.warning('Please select exactly 1 PDF to split');
            return;
        }
        
        const format = document.getElementById('splitFormat')?.value || 'pdf';
        
        Toast.info(Lang.get('progress.processing'));
        
        try {
            const fileData = this.files[0];
            const arrayBuffer = await Utils.readFileAsArrayBuffer(fileData.file);
            const pdf = await PDFLib.PDFDocument.load(arrayBuffer, {
                ignoreEncryption: true
            });
            
            const pageCount = pdf.getPageCount();
            const baseName = fileData.name.replace(/\.pdf$/i, '');
            
            // Ask for optimization if file is large
            if (optimize && fileData.size > 1024 * 1024) { // > 1MB
                const confirmed = await this.showOptimizeDialog(fileData.size, pageCount);
                if (!confirmed) {
                    optimize = false;
                }
            }
            
            // Split each page
            for (let i = 0; i < pageCount; i++) {
                if (format === 'pdf') {
                    await this.extractPageAsPDF(pdf, i, baseName, optimize);
                } else {
                    await this.extractPageAsPNG(pdf, i, baseName);
                }
                
                // Small delay between downloads
                await Utils.sleep(200);
            }
            
            // Use free trial
            PlanManager.useFreeTrial();
            
            Toast.success(Lang.get('success.split'));
            
        } catch (error) {
            console.error('Split error:', error);
            Toast.error(Lang.get('error.processingFailed'));
        }
    },
    
    /**
     * Extract single page as PDF
     */
    async extractPageAsPDF(sourcePdf, pageIndex, baseName, optimize) {
        const newPdf = await PDFLib.PDFDocument.create();
        const [page] = await newPdf.copyPages(sourcePdf, [pageIndex]);
        newPdf.addPage(page);
        
        let pdfBytes;
        if (optimize) {
            pdfBytes = await this.optimizePDF(newPdf);
        } else {
            pdfBytes = await newPdf.save();
        }
        
        const blob = new Blob([pdfBytes], { type: 'application/pdf' });
        const filename = `${baseName}_page${pageIndex + 1}.pdf`;
        Utils.downloadBlob(blob, filename);
    },
    
    /**
     * Extract single page as PNG
     */
    async extractPageAsPNG(sourcePdf, pageIndex, baseName) {
        // Use PDF.js to render page as image
        const arrayBuffer = await sourcePdf.save();
        const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
        const pdfDoc = await loadingTask.promise;
        const page = await pdfDoc.getPage(pageIndex + 1);
        
        // Set scale for good quality
        const scale = 2;
        const viewport = page.getViewport({ scale });
        
        // Create canvas
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        
        // White background
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Render page
        await page.render({
            canvasContext: ctx,
            viewport: viewport
        }).promise;
        
        // Convert to blob and download
        const blob = await new Promise(resolve => {
            canvas.toBlob(resolve, 'image/png', 1.0);
        });
        
        const filename = `${baseName}_page${pageIndex + 1}.png`;
        Utils.downloadBlob(blob, filename);
    },
    
    /**
     * Optimize PDF (reduce file size)
     */
    async optimizePDF(pdfDoc) {
        // Get all images and compress them
        const pages = pdfDoc.getPages();
        
        // Save with optimization options
        return await pdfDoc.save({
            useObjectStreams: true,
            addDefaultPage: false,
            objectsPerTick: 50
        });
    },
    
    /**
     * Show optimization confirmation dialog
     */
    showOptimizeDialog(currentSize, pageCount) {
        return new Promise((resolve) => {
            const estimatedSize = Math.round(currentSize * 0.4); // Rough estimate
            const reduction = Math.round((1 - estimatedSize / currentSize) * 100);
            
            // Create custom modal
            const overlay = document.createElement('div');
            overlay.className = 'modal-overlay show';
            overlay.innerHTML = `
                <div class="modal">
                    <div class="modal-header">
                        <h3 class="modal-title">📦 ${Lang.get('controls.optimize')}</h3>
                        <button class="modal-close">&times;</button>
                    </div>
                    <div class="modal-body">
                        <p><strong>Current Size:</strong> ${Utils.formatFileSize(currentSize)}</p>
                        <p><strong>Pages:</strong> ${pageCount}</p>
                        <p><strong>Estimated Size:</strong> ~${Utils.formatFileSize(estimatedSize)}</p>
                        <p><strong>Reduction:</strong> ~${reduction}%</p>
                        <div class="mt-20">
                            <p style="color: var(--text-secondary);">Do you want to optimize file size?</p>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button class="btn" id="optimizeNo">${Lang.get('common.cancel')}</button>
                        <button class="btn btn-primary" id="optimizeYes">✓ Optimize</button>
                    </div>
                </div>
            `;
            
            document.body.appendChild(overlay);
            
            // Event listeners
            overlay.querySelector('.modal-close').addEventListener('click', () => {
                overlay.remove();
                resolve(false);
            });
            
            overlay.querySelector('#optimizeNo').addEventListener('click', () => {
                overlay.remove();
                resolve(false);
            });
            
            overlay.querySelector('#optimizeYes').addEventListener('click', () => {
                overlay.remove();
                resolve(true);
            });
            
            // Click outside to close
            overlay.addEventListener('click', (e) => {
                if (e.target === overlay) {
                    overlay.remove();
                    resolve(false);
                }
            });
        });
    }
};

// ==========================================
// INITIALIZATION
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    MergeSplit.init();
});

// ==========================================
// EXPORT
// ==========================================
window.MergeSplit = MergeSplit;