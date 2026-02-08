/**
 * ============================================
 * ALL TO PDF CONVERTER PRO - WORD TO PDF MODULE
 * ============================================
 * Word (.docx) dosyalarını PDF'e dönüştürme
 * mammoth.js kullanılarak DOCX → HTML → PDF
 */

'use strict';

// ==========================================
// WORD PDF MODULE
// ==========================================
const WordPDF = {
    file: null,
    htmlContent: '',
    
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
        const convertBtn = document.getElementById('convertWordBtn');
        if (convertBtn) {
            convertBtn.addEventListener('click', () => this.convert());
        }
    },
    
    /**
     * Initialize dropzone
     */
    initDropzone() {
        const dropzone = document.getElementById('wordDropzone');
        if (!dropzone) return;
        
        Dropzone.init(dropzone, {
            acceptedTypes: ['.docx', '.doc', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
            multiple: false,
            onFiles: (files) => this.processFile(files[0])
        });
    },
    
    /**
     * Process uploaded Word file
     */
    async processFile(file) {
        if (!file) return;
        
        // Validate file type
        const validTypes = [
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'application/msword'
        ];
        
        const isValid = validTypes.includes(file.type) || 
                        file.name.toLowerCase().endsWith('.docx') ||
                        file.name.toLowerCase().endsWith('.doc');
        
        if (!isValid) {
            Toast.error(Lang.get('error.invalidFile') + ' (Only .docx supported)');
            return;
        }
        
        // Check for .doc (not supported by mammoth)
        if (file.name.toLowerCase().endsWith('.doc') && !file.name.toLowerCase().endsWith('.docx')) {
            Toast.warning('Old .doc format detected. Please convert to .docx first.');
            return;
        }
        
        this.file = {
            file: file,
            name: file.name,
            size: file.size,
            icon: '📄'
        };
        
        this.renderFileList();
        Toast.success(`${file.name} loaded`);
        
        // Preview conversion
        await this.previewDocument();
    },
    
    /**
     * Preview document (convert to HTML)
     */
    async previewDocument() {
        if (!this.file) return;
        
        try {
            const arrayBuffer = await Utils.readFileAsArrayBuffer(this.file.file);
            
            // Convert DOCX to HTML using mammoth
            const result = await mammoth.convertToHtml(
                { arrayBuffer: arrayBuffer },
                {
                    styleMap: [
                        "p[style-name='Heading 1'] => h1:fresh",
                        "p[style-name='Heading 2'] => h2:fresh",
                        "p[style-name='Heading 3'] => h3:fresh",
                        "b => strong",
                        "i => em",
                        "u => u"
                    ]
                }
            );
            
            this.htmlContent = result.value;
            
            // Show warnings if any
            if (result.messages.length > 0) {
                console.warn('Mammoth warnings:', result.messages);
            }
            
        } catch (error) {
            console.error('Preview error:', error);
            Toast.error('Could not preview document');
        }
    },
    
    /**
     * Render file list
     */
    renderFileList() {
        const container = document.getElementById('wordList');
        const controls = document.getElementById('wordControls');
        
        if (!container) return;
        
        container.innerHTML = '';
        
        if (!this.file) {
            if (controls) controls.style.display = 'none';
            return;
        }
        
        if (controls) controls.style.display = 'flex';
        
        const item = document.createElement('div');
        item.className = 'file-item';
        
        item.innerHTML = `
            <div class="file-thumb" style="display:flex;align-items:center;justify-content:center;font-size:1.5rem;background:var(--bg-secondary);">
                📄
            </div>
            <div class="file-info">
                <div class="file-name">${this.file.name}</div>
                <div class="file-size">${Utils.formatFileSize(this.file.size)}</div>
            </div>
            <div class="file-actions">
                <button class="delete" title="Remove">
                    <span>🗑️</span>
                </button>
            </div>
        `;
        
        // Delete button
        item.querySelector('.delete').addEventListener('click', () => {
            this.clearFile();
        });
        
        container.appendChild(item);
    },
    
    /**
     * Clear file
     */
    clearFile() {
        this.file = null;
        this.htmlContent = '';
        this.renderFileList();
    },
    
    /**
     * Convert Word to PDF/PNG/JPG
     */
    async convert() {
        if (!this.file) {
            Toast.error(Lang.get('error.noFiles'));
            return;
        }
        
        // Check access
        if (!PlanManager.checkAccess('word')) {
            return;
        }
        
        // Get settings
        const format = document.getElementById('wordFormat')?.value || 'pdf';
        const addPageNumbers = document.getElementById('wordPageNumbers')?.checked || false;
        
        Toast.info(Lang.get('progress.converting'));
        
        try {
            // Convert DOCX to HTML if not already done
            if (!this.htmlContent) {
                await this.previewDocument();
            }
            
            if (!this.htmlContent) {
                throw new Error('Could not convert document');
            }
            
            // Create styled HTML container
            const container = this.createStyledContainer();
            document.body.appendChild(container);
            
            // Wait for rendering
            await Utils.sleep(100);
            
            if (format === 'pdf') {
                await this.convertToPDF(container, addPageNumbers);
            } else {
                await this.convertToImages(container, format, addPageNumbers);
            }
            
            // Cleanup
            document.body.removeChild(container);
            
            // Use free trial
            PlanManager.useFreeTrial();
            
            Toast.success(Lang.get('success.converted'));
            
        } catch (error) {
            console.error('Conversion error:', error);
            Toast.error(Lang.get('error.processingFailed'));
        }
    },
    
    /**
     * Create styled container for HTML content
     */
    createStyledContainer() {
        const container = document.createElement('div');
        container.id = 'word-render-container';
        container.style.cssText = `
            position: absolute;
            left: -9999px;
            top: 0;
            width: 210mm;
            min-height: 297mm;
            padding: 20mm;
            background: white;
            color: black;
            font-family: 'Times New Roman', serif;
            font-size: 12pt;
            line-height: 1.5;
            box-sizing: border-box;
        `;
        
        // Add styled HTML content
        container.innerHTML = `
            <style>
                #word-render-container h1 { font-size: 24pt; margin: 0 0 12pt 0; color: black; }
                #word-render-container h2 { font-size: 18pt; margin: 12pt 0 8pt 0; color: black; }
                #word-render-container h3 { font-size: 14pt; margin: 10pt 0 6pt 0; color: black; }
                #word-render-container p { margin: 0 0 8pt 0; text-align: justify; }
                #word-render-container ul, #word-render-container ol { margin: 0 0 8pt 20pt; padding: 0; }
                #word-render-container li { margin: 0 0 4pt 0; }
                #word-render-container table { border-collapse: collapse; width: 100%; margin: 8pt 0; }
                #word-render-container td, #word-render-container th { border: 1px solid #000; padding: 4pt 8pt; }
                #word-render-container img { max-width: 100%; height: auto; }
                #word-render-container strong, #word-render-container b { font-weight: bold; }
                #word-render-container em, #word-render-container i { font-style: italic; }
                #word-render-container u { text-decoration: underline; }
            </style>
            <div class="content">${this.htmlContent}</div>
        `;
        
        return container;
    },
    
    /**
     * Convert to PDF
     */
    async convertToPDF(container, addPageNumbers) {
        const { jsPDF } = window.jspdf;
        
        // A4 dimensions in mm
        const pageWidth = 210;
        const pageHeight = 297;
        const margin = 20;
        const contentWidth = pageWidth - (margin * 2);
        const contentHeight = pageHeight - (margin * 2);
        
        // Capture HTML as canvas
        const canvas = await html2canvas(container, {
            scale: 2,
            useCORS: true,
            logging: false,
            backgroundColor: '#ffffff'
        });
        
        // Calculate pages
        const imgWidth = contentWidth;
        const imgHeight = (canvas.height * contentWidth) / canvas.width;
        const pageCount = Math.ceil(imgHeight / contentHeight);
        
        // Create PDF
        const pdf = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4'
        });
        
        // Split into pages
        for (let i = 0; i < pageCount; i++) {
            if (i > 0) {
                pdf.addPage();
            }
            
            // Calculate source rectangle from canvas
            const sourceY = (i * contentHeight * canvas.width) / contentWidth;
            const sourceHeight = (contentHeight * canvas.width) / contentWidth;
            
            // Create page canvas
            const pageCanvas = document.createElement('canvas');
            pageCanvas.width = canvas.width;
            pageCanvas.height = Math.min(sourceHeight, canvas.height - sourceY);
            
            const ctx = pageCanvas.getContext('2d');
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, pageCanvas.width, pageCanvas.height);
            ctx.drawImage(
                canvas,
                0, sourceY,
                canvas.width, pageCanvas.height,
                0, 0,
                pageCanvas.width, pageCanvas.height
            );
            
            // Add to PDF
            const pageImgData = pageCanvas.toDataURL('image/jpeg', 0.95);
            const drawHeight = (pageCanvas.height * contentWidth) / canvas.width;
            
            pdf.addImage(
                pageImgData,
                'JPEG',
                margin,
                margin,
                contentWidth,
                Math.min(drawHeight, contentHeight)
            );
            
            // Add page number
            if (addPageNumbers) {
                pdf.setFontSize(10);
                pdf.setTextColor(100);
                pdf.text(
                    `${i + 1} / ${pageCount}`,
                    pageWidth / 2,
                    pageHeight - 10,
                    { align: 'center' }
                );
            }
        }
        
        // Optimize and save
        const filename = this.file.name.replace(/\.(docx|doc)$/i, '.pdf');
        pdf.save(filename);
    },
    
    /**
     * Convert to Images (PNG/JPG)
     */
    async convertToImages(container, format, addPageNumbers) {
        // A4 dimensions in pixels at 150 DPI
        const dpi = 150;
        const pageWidthPx = Math.round((210 / 25.4) * dpi);
        const pageHeightPx = Math.round((297 / 25.4) * dpi);
        
        // Capture HTML as canvas
        const canvas = await html2canvas(container, {
            scale: 2,
            useCORS: true,
            logging: false,
            backgroundColor: '#ffffff'
        });
        
        // Calculate number of pages
        const scaledHeight = (canvas.height * pageWidthPx) / canvas.width;
        const pageCount = Math.ceil(scaledHeight / pageHeightPx);
        
        const mimeType = format === 'png' ? 'image/png' : 'image/jpeg';
        const extension = format === 'png' ? '.png' : '.jpg';
        const baseName = this.file.name.replace(/\.(docx|doc)$/i, '');
        
        // Generate each page as image
        for (let i = 0; i < pageCount; i++) {
            const pageCanvas = document.createElement('canvas');
            pageCanvas.width = pageWidthPx;
            pageCanvas.height = pageHeightPx;
            
            const ctx = pageCanvas.getContext('2d');
            
            // White background
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0, 0, pageWidthPx, pageHeightPx);
            
            // Calculate source area
            const sourceY = (i * pageHeightPx * canvas.width) / pageWidthPx;
            const sourceHeight = (pageHeightPx * canvas.width) / pageWidthPx;
            
            // Draw portion of original canvas
            ctx.drawImage(
                canvas,
                0, sourceY,
                canvas.width, Math.min(sourceHeight, canvas.height - sourceY),
                0, 0,
                pageWidthPx, Math.min(pageHeightPx, (canvas.height - sourceY) * pageWidthPx / canvas.width)
            );
            
            // Add page number
            if (addPageNumbers) {
                ctx.fillStyle = '#666666';
                ctx.font = '14px Arial';
                ctx.textAlign = 'center';
                ctx.fillText(
                    `${i + 1} / ${pageCount}`,
                    pageWidthPx / 2,
                    pageHeightPx - 20
                );
            }
            
            // Download image
            const blob = await new Promise(resolve => {
                pageCanvas.toBlob(resolve, mimeType, 0.9);
            });
            
            const filename = pageCount > 1 
                ? `${baseName}_page${i + 1}${extension}`
                : `${baseName}${extension}`;
            
            Utils.downloadBlob(blob, filename);
            
            // Small delay between downloads
            if (i < pageCount - 1) {
                await Utils.sleep(300);
            }
        }
    }
};

// ==========================================
// INITIALIZATION
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    WordPDF.init();
});

// ==========================================
// EXPORT
// ==========================================
window.WordPDF = WordPDF;