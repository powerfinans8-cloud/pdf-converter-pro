/**
 * ============================================
 * ALL TO PDF CONVERTER PRO - PDF EDITOR MODULE
 * ============================================
 * PART A: Temel yapı + Düzeltmeler
 * 
 * FIX: Keyboard shortcuts (Text/Note yazarken çalışmaz)
 * FIX: Arrow/Line event listener temizleme
 * FIX: Shape ikiz sorunu
 * FIX: Event listener temizleme
 */

'use strict';

// ==========================================
// EDITOR MODULE
// ==========================================
const Editor = {
    canvas: null,
    pdfDoc: null,
    currentPage: 1,
    totalPages: 0,
    scale: 1.5,
    currentTool: 'select',
    isDrawing: false,
    isTyping: false, // YENİ: Yazı yazılıyor mu?
    
    // Tool settings
    settings: {
        strokeColor: '#3b82f6',
        fillColor: 'transparent',
        strokeWidth: 2,
        opacity: 1,
        fontSize: 16,
        fontFamily: 'Arial'
    },
    
    // History for undo/redo
    history: [],
    historyIndex: -1,
    maxHistory: 50,
    
    // PDF pages cache
    pageImages: [],
    pageObjects: [],
    
    // Active shape while drawing
    activeShape: null,
    startX: 0,
    startY: 0,
    
    // Event handlers (for cleanup)
    eventHandlers: {
        mouseDown: null,
        mouseMove: null,
        mouseUp: null,
        mouseDblClick: null
    },
    
    /**
     * Initialize editor
     */
    init() {
        this.bindEvents();
        this.initDropzone();
    },
    
    /**
     * Bind event listeners
     */
    bindEvents() {
        // Keyboard events with typing check
        document.addEventListener('keydown', (e) => this.handleKeyboard(e));
    },
    
    /**
     * Initialize dropzone
     */
    initDropzone() {
        const dropzone = document.getElementById('editorDropzone');
        if (!dropzone) return;
        
        Dropzone.init(dropzone, {
            acceptedTypes: ['.pdf', 'application/pdf'],
            multiple: false,
            onFiles: (files) => this.loadPDF(files[0])
        });
    },
    
    /**
     * Load PDF file
     */
    async loadPDF(file) {
        if (!file) return;
        
        if (!PlanManager.checkAccess('editor')) {
            return;
        }
        
        Toast.info(Lang.get('common.loading'));
        
        try {
            const arrayBuffer = await Utils.readFileAsArrayBuffer(file);
            
            this.pdfDoc = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
            this.totalPages = this.pdfDoc.numPages;
            this.currentPage = 1;
            this.pageImages = [];
            this.pageObjects = new Array(this.totalPages).fill(null).map(() => []);
            
            document.getElementById('editorDropzone').style.display = 'none';
            document.getElementById('editorContainer').style.display = 'block';
            
            this.createEditorUI();
            await this.renderPage(1);
            this.initCanvas();
            this.saveState();
            
            Toast.success('PDF loaded successfully');
            
        } catch (error) {
            console.error('Error loading PDF:', error);
            Toast.error(Lang.get('error.processingFailed'));
        }
    },
    
    /**
     * Create editor UI
     */
    createEditorUI() {
        const container = document.getElementById('editorContainer');
        
        container.innerHTML = `
            <!-- Toolbar -->
            <div class="editor-toolbar" id="editorToolbar">
                <!-- Drawing Tools -->
                <div class="toolbar-group">
                    <div class="toolbar-label">Draw</div>
                    <div class="toolbar-buttons">
                        <button class="tool-btn active" data-tool="select" title="Select (V)">
                            <span>👆</span>
                        </button>
                        <button class="tool-btn" data-tool="pen" title="Pen (P)">
                            <span>✏️</span>
                        </button>
                        <button class="tool-btn" data-tool="eraser" title="Eraser">
                            <span>🧹</span>
                        </button>
                        <button class="tool-btn" data-tool="highlight" title="Highlight">
                            <span>🖍️</span>
                        </button>
                    </div>
                </div>
                
                <!-- Line Tools -->
                <div class="toolbar-group">
                    <div class="toolbar-label">Lines</div>
                    <div class="toolbar-buttons">
                        <button class="tool-btn" data-tool="line" title="Line">
                            <span>╱</span>
                        </button>
                        <button class="tool-btn" data-tool="arrow" title="Arrow">
                            <span>➤</span>
                        </button>
                        <button class="tool-btn" data-tool="polyline" title="Polyline">
                            <span>📐</span>
                        </button>
                    </div>
                </div>
                
                <!-- Shape Tools -->
                <div class="toolbar-group">
                    <div class="toolbar-label">Shapes</div>
                    <div class="toolbar-buttons">
                        <button class="tool-btn" data-tool="rect" title="Rectangle">
                            <span>▢</span>
                        </button>
                        <button class="tool-btn" data-tool="roundedRect" title="Rounded Rectangle">
                            <span>▢</span>
                        </button>
                        <button class="tool-btn" data-tool="circle" title="Circle">
                            <span>○</span>
                        </button>
                        <button class="tool-btn" data-tool="triangle" title="Triangle">
                            <span>△</span>
                        </button>
                        <button class="tool-btn" data-tool="star" title="Star">
                            <span>★</span>
                        </button>
                        <button class="tool-btn" data-tool="hexagon" title="Hexagon">
                            <span>⬡</span>
                        </button>
                        <button class="tool-btn" data-tool="speechBubble" title="Speech Bubble">
                            <span>💬</span>
                        </button>
                    </div>
                </div>
                
                <!-- Insert Tools -->
                <div class="toolbar-group">
                    <div class="toolbar-label">Insert</div>
                    <div class="toolbar-buttons">
                        <button class="tool-btn" data-tool="text" title="Text">
                            <span>T</span>
                        </button>
                        <button class="tool-btn" data-tool="note" title="Note">
                            <span>📝</span>
                        </button>
                        <button class="tool-btn" data-tool="image" title="Image">
                            <span>🖼️</span>
                        </button>
                        <button class="tool-btn" data-tool="signature" title="Signature">
                            <span>✍️</span>
                        </button>
                        <button class="tool-btn" data-tool="stamp" title="Stamp">
                            <span>🔖</span>
                        </button>
                    </div>
                </div>
                
                <!-- Color & Size -->
                <div class="toolbar-group">
                    <div class="toolbar-label">Style</div>
                    <div class="toolbar-buttons style-controls">
                        <div class="color-picker-wrapper">
                            <label title="Stroke Color">🎨</label>
                            <input type="color" id="strokeColor" value="#3b82f6">
                        </div>
                        <div class="color-picker-wrapper">
                            <label title="Fill Color">🪣</label>
                            <input type="color" id="fillColor" value="#ffffff">
                            <button class="no-fill-btn" id="noFillBtn" title="No Fill">∅</button>
                        </div>
                        <div class="size-control">
                            <label>📏</label>
                            <input type="range" id="strokeWidth" min="1" max="50" value="2">
                            <span id="strokeWidthValue">2</span>
                        </div>
                        <div class="opacity-control">
                            <label>🔅</label>
                            <input type="range" id="opacitySlider" min="0" max="100" value="100">
                            <span id="opacityValue">100%</span>
                        </div>
                    </div>
                </div>
                
                <!-- Actions -->
                <div class="toolbar-group">
                    <div class="toolbar-label">Actions</div>
                    <div class="toolbar-buttons">
                        <button class="tool-btn" id="undoBtn" title="Undo (Ctrl+Z)">
                            <span>↶</span>
                        </button>
                        <button class="tool-btn" id="redoBtn" title="Redo (Ctrl+Y)">
                            <span>↷</span>
                        </button>
                        <button class="tool-btn" id="clearBtn" title="Clear All">
                            <span>🗑️</span>
                        </button>
                    </div>
                </div>
                
                <!-- Zoom & Page -->
                <div class="toolbar-group">
                    <div class="toolbar-label">View</div>
                    <div class="toolbar-buttons">
                        <button class="tool-btn" id="zoomOutBtn" title="Zoom Out">
                            <span>−</span>
                        </button>
                        <input type="range" id="zoomSlider" min="50" max="300" value="150" style="width:80px;">
                        <span class="zoom-level" id="zoomLevel">150%</span>
                        <button class="tool-btn" id="zoomInBtn" title="Zoom In">
                            <span>+</span>
                        </button>
                        <button class="tool-btn" id="fitBtn" title="Fit to Screen">
                            <span>⊡</span>
                        </button>
                    </div>
                </div>
                
                <!-- Page Navigation -->
                <div class="toolbar-group">
                    <div class="toolbar-label">Page</div>
                    <div class="toolbar-buttons page-nav">
                        <button class="tool-btn" id="prevPageBtn" title="Previous Page">
                            <span>◀</span>
                        </button>
                        <span class="page-info">
                            <input type="number" id="pageInput" min="1" value="1"> / <span id="totalPages">1</span>
                        </span>
                        <button class="tool-btn" id="nextPageBtn" title="Next Page">
                            <span>▶</span>
                        </button>
                    </div>
                </div>
                
                <!-- Save -->
                <div class="toolbar-group save-group">
                    <button class="btn btn-success" id="savePdfBtn">
                        <span>💾</span>
                        <span>Save PDF</span>
                    </button>
                    <button class="tool-btn" id="removePdfBtn" title="Remove PDF">
                        <span>✕</span>
                    </button>
                </div>
            </div>
            
            <!-- Canvas Container with Scroll -->
            <div class="editor-canvas-container" id="canvasContainer">
                <div class="canvas-scroll-wrapper" id="canvasScrollWrapper">
                    <div class="canvas-wrapper" id="canvasWrapper">
                        <canvas id="editorCanvas"></canvas>
                    </div>
                </div>
            </div>
            
            <!-- Hidden file input -->
            <input type="file" id="imageInsertInput" accept="image/*" style="display:none;">
        `;
        
        this.addEditorStyles();
        this.bindToolbarEvents();
    },
    
    /**
     * Add editor styles
     */
    addEditorStyles() {
        if (document.getElementById('editorStyles')) return;
        
        const styles = document.createElement('style');
        styles.id = 'editorStyles';
        styles.textContent = `
            #editorContainer {
                display: flex;
                flex-direction: column;
                height: calc(100vh - 200px);
                min-height: 500px;
                background: var(--bg-primary);
                border: 1px solid var(--border-default);
                border-radius: 2px;
                overflow: hidden;
            }
            
            .editor-toolbar {
                display: flex;
                flex-wrap: wrap;
                gap: 15px;
                padding: 12px 15px;
                background: var(--bg-secondary);
                border-bottom: 1px solid var(--border-default);
                align-items: flex-start;
            }
            
            .toolbar-group {
                display: flex;
                flex-direction: column;
                gap: 5px;
            }
            
            .toolbar-label {
                font-size: 10px;
                color: var(--text-muted);
                text-transform: uppercase;
                letter-spacing: 0.5px;
            }
            
            .toolbar-buttons {
                display: flex;
                gap: 4px;
                align-items: center;
                flex-wrap: wrap;
            }
            
            .tool-btn {
                width: 36px;
                height: 36px;
                display: flex;
                align-items: center;
                justify-content: center;
                background: transparent;
                border: 1px solid var(--border-default);
                border-radius: 2px;
                color: var(--text-primary);
                cursor: pointer;
                transition: all 0.2s ease;
                font-size: 16px;
            }
            
            .tool-btn:hover {
                border-color: var(--border-hover);
                box-shadow: 0 0 8px var(--shadow-color);
            }
            
            .tool-btn.active {
                background: var(--accent);
                border-color: var(--accent);
            }
            
            .tool-btn:disabled {
                opacity: 0.4;
                cursor: not-allowed;
            }
            
            .style-controls {
                flex-wrap: wrap;
                gap: 10px;
            }
            
            .color-picker-wrapper {
                display: flex;
                align-items: center;
                gap: 4px;
            }
            
            .color-picker-wrapper input[type="color"] {
                width: 30px;
                height: 30px;
                padding: 0;
                border: 1px solid var(--border-default);
                border-radius: 2px;
                cursor: pointer;
                background: transparent;
            }
            
            .color-picker-wrapper input[type="color"]::-webkit-color-swatch-wrapper {
                padding: 2px;
            }
            
            .color-picker-wrapper input[type="color"]::-webkit-color-swatch {
                border-radius: 1px;
                border: none;
            }
            
            .no-fill-btn {
                width: 24px;
                height: 24px;
                font-size: 12px;
                padding: 0;
                background: transparent;
                border: 1px solid var(--border-default);
                border-radius: 2px;
                color: var(--text-secondary);
                cursor: pointer;
            }
            
            .no-fill-btn.active {
                border-color: var(--accent);
                color: var(--accent);
            }
            
            .size-control,
            .opacity-control {
                display: flex;
                align-items: center;
                gap: 6px;
            }
            
            .size-control input,
            .opacity-control input {
                width: 60px;
            }
            
            .size-control span,
            .opacity-control span {
                font-size: 12px;
                color: var(--text-secondary);
                min-width: 35px;
            }
            
            .zoom-level {
                font-size: 12px;
                color: var(--text-secondary);
                min-width: 45px;
                text-align: center;
            }
            
            .page-nav {
                gap: 8px;
            }
            
            .page-info {
                display: flex;
                align-items: center;
                gap: 5px;
                font-size: 13px;
                color: var(--text-secondary);
            }
            
            .page-info input {
                width: 40px;
                padding: 4px;
                text-align: center;
                background: var(--bg-card);
                border: 1px solid var(--border-default);
                border-radius: 2px;
                color: var(--text-primary);
            }
            
            .save-group {
                margin-left: auto;
                flex-direction: row;
                align-items: center;
                gap: 10px;
            }
            
            .save-group .btn {
                padding: 8px 16px;
            }
            
            /* Canvas Container - FIX: Scroll support */
            .editor-canvas-container {
                flex: 1;
                overflow: hidden;
                background: #2a2a2a;
                position: relative;
            }
            
            .canvas-scroll-wrapper {
                width: 100%;
                height: 100%;
                overflow: auto;
                display: flex;
                align-items: flex-start;
                justify-content: center;
                padding: 20px;
            }
            
            .canvas-wrapper {
                box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
                background: white;
                flex-shrink: 0;
            }
            
            #editorCanvas {
                display: block;
            }
            
            /* Responsive */
            @media (max-width: 1200px) {
                .editor-toolbar {
                    gap: 10px;
                }
                
                .save-group {
                    margin-left: 0;
                    width: 100%;
                    justify-content: flex-end;
                }
            }
            
            @media (max-width: 768px) {
                .editor-toolbar {
                    padding: 10px;
                }
                
                .tool-btn {
                    width: 32px;
                    height: 32px;
                    font-size: 14px;
                }
            }
        `;
        
        document.head.appendChild(styles);
    },
    
    /**
     * Initialize Fabric canvas
     */
    initCanvas() {
        const canvasEl = document.getElementById('editorCanvas');
        
        if (this.pageImages[0]) {
            canvasEl.width = this.pageImages[0].width;
            canvasEl.height = this.pageImages[0].height;
        }
        
        this.canvas = new fabric.Canvas('editorCanvas', {
            isDrawingMode: false,
            selection: true,
            preserveObjectStacking: true
        });
        
        if (this.pageImages[0]) {
            this.setCanvasBackground(this.pageImages[0].dataUrl);
        }
        
        // Canvas object events
        this.canvas.on('object:added', () => this.onCanvasModified());
        this.canvas.on('object:modified', () => this.onCanvasModified());
        this.canvas.on('object:removed', () => this.onCanvasModified());
        
        // Double-click to edit text
        this.canvas.on('mouse:dblclick', (e) => {
            if (e.target && e.target.type === 'i-text') {
                e.target.enterEditing();
                e.target.selectAll();
                this.isTyping = true;
            }
        });
        
        // Track when text editing ends
        this.canvas.on('text:editing:exited', () => {
            this.isTyping = false;
        });
        
        this.updateZoomDisplay();
        this.setTool('select');
    },
    
    /**
     * Set canvas background image
     */
    setCanvasBackground(dataUrl) {
        fabric.Image.fromURL(dataUrl, (img) => {
            this.canvas.setBackgroundImage(img, this.canvas.renderAll.bind(this.canvas), {
                scaleX: 1,
                scaleY: 1
            });
        });
    },
    
    /**
     * Render PDF page
     */
    async renderPage(pageNum) {
        if (!this.pdfDoc) return;
        
        if (this.pageImages[pageNum - 1]) {
            return this.pageImages[pageNum - 1];
        }
        
        const page = await this.pdfDoc.getPage(pageNum);
        const viewport = page.getViewport({ scale: this.scale });
        
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        
        await page.render({
            canvasContext: ctx,
            viewport: viewport
        }).promise;
        
        const pageImage = {
            dataUrl: canvas.toDataURL('image/png'),
            width: viewport.width,
            height: viewport.height
        };
        
        this.pageImages[pageNum - 1] = pageImage;
        return pageImage;
    },
    
    /**
     * Bind toolbar events
     */
    bindToolbarEvents() {
        // Tool buttons - FIX: Remove all old listeners first
        document.querySelectorAll('.tool-btn[data-tool]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                const tool = btn.dataset.tool;
                this.setTool(tool);
            });
        });
        
        // Color pickers
        document.getElementById('strokeColor')?.addEventListener('input', (e) => {
            this.settings.strokeColor = e.target.value;
            this.updateBrush();
        });
        
        document.getElementById('fillColor')?.addEventListener('input', (e) => {
            this.settings.fillColor = e.target.value;
            document.getElementById('noFillBtn')?.classList.remove('active');
        });
        
        document.getElementById('noFillBtn')?.addEventListener('click', () => {
            const btn = document.getElementById('noFillBtn');
            btn.classList.toggle('active');
            this.settings.fillColor = btn.classList.contains('active') ? 'transparent' : document.getElementById('fillColor').value;
        });
        
        // Stroke width
        document.getElementById('strokeWidth')?.addEventListener('input', (e) => {
            this.settings.strokeWidth = parseInt(e.target.value);
            document.getElementById('strokeWidthValue').textContent = e.target.value;
            this.updateBrush();
        });
        
        // Opacity
        document.getElementById('opacitySlider')?.addEventListener('input', (e) => {
            this.settings.opacity = parseInt(e.target.value) / 100;
            document.getElementById('opacityValue').textContent = `${e.target.value}%`;
            this.updateBrush();
        });
        
        // Undo/Redo/Clear
        document.getElementById('undoBtn')?.addEventListener('click', () => this.undo());
        document.getElementById('redoBtn')?.addEventListener('click', () => this.redo());
        document.getElementById('clearBtn')?.addEventListener('click', () => this.clearAll());
        
        // Zoom controls
        document.getElementById('zoomInBtn')?.addEventListener('click', () => this.zoomBy(25));
        document.getElementById('zoomOutBtn')?.addEventListener('click', () => this.zoomBy(-25));
        document.getElementById('fitBtn')?.addEventListener('click', () => this.fitToScreen());
        
        // Zoom slider
        document.getElementById('zoomSlider')?.addEventListener('input', (e) => {
            this.setZoom(parseInt(e.target.value));
        });
        
        // Page navigation
        document.getElementById('prevPageBtn')?.addEventListener('click', () => this.changePage(-1));
        document.getElementById('nextPageBtn')?.addEventListener('click', () => this.changePage(1));
        document.getElementById('pageInput')?.addEventListener('change', (e) => {
            this.goToPage(parseInt(e.target.value));
        });
        
        // Set total pages
        const totalPagesEl = document.getElementById('totalPages');
        if (totalPagesEl) totalPagesEl.textContent = this.totalPages;
        
        // Save/Remove
        document.getElementById('savePdfBtn')?.addEventListener('click', () => this.savePDF());
        document.getElementById('removePdfBtn')?.addEventListener('click', () => this.removePDF());
        
        // Image insert
        document.getElementById('imageInsertInput')?.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) this.insertImage(file);
            e.target.value = '';
        });
    },
    
    /**
     * Clear all canvas event handlers
     * FIX: Prevents duplicate/stacking events
     */
    clearCanvasEvents() {
        if (!this.canvas) return;
        
        this.canvas.off('mouse:down');
        this.canvas.off('mouse:move');
        this.canvas.off('mouse:up');
        
        // Re-add essential events
        this.canvas.on('mouse:dblclick', (e) => {
            if (e.target && e.target.type === 'i-text') {
                e.target.enterEditing();
                e.target.selectAll();
                this.isTyping = true;
            }
        });
    },
    
    /**
     * Set active tool
     * FIX: Clean up events before setting new tool
     */
    setTool(tool) {
        // Don't change tool if typing
        if (this.isTyping && tool !== 'select') {
            return;
        }
        
        this.currentTool = tool;
        this.activeShape = null;
        
        // Update button states - FIX: Only one active at a time
        document.querySelectorAll('.tool-btn[data-tool]').forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.tool === tool) {
                btn.classList.add('active');
            }
        });
        
        if (!this.canvas) return;
        
        // Clear all custom events first - FIX
        this.clearCanvasEvents();
        
        // Reset canvas state
        this.canvas.isDrawingMode = false;
        this.canvas.selection = true;
        this.canvas.defaultCursor = 'default';
        this.canvas.hoverCursor = 'move';
        
        // Configure based on tool
        switch (tool) {
            case 'select':
                this.canvas.selection = true;
                break;
                
            case 'pen':
                this.canvas.isDrawingMode = true;
                this.canvas.freeDrawingBrush = new fabric.PencilBrush(this.canvas);
                this.updateBrush();
                break;
                
            case 'eraser':
                this.canvas.defaultCursor = 'crosshair';
                this.enableEraser();
                break;
                
            case 'highlight':
                this.canvas.isDrawingMode = true;
                this.canvas.freeDrawingBrush = new fabric.PencilBrush(this.canvas);
                this.canvas.freeDrawingBrush.color = 'rgba(255, 255, 0, 0.4)';
                this.canvas.freeDrawingBrush.width = 20;
                break;
                
            case 'line':
            case 'arrow':
                this.canvas.defaultCursor = 'crosshair';
                this.canvas.selection = false;
                this.enableLineTool(tool);
                break;
                
            case 'polyline':
                this.canvas.defaultCursor = 'crosshair';
                this.canvas.selection = false;
                this.enablePolylineTool();
                break;
                
            case 'rect':
            case 'roundedRect':
            case 'circle':
            case 'triangle':
            case 'star':
            case 'hexagon':
            case 'speechBubble':
                this.canvas.defaultCursor = 'crosshair';
                this.canvas.selection = false;
                this.enableShapeTool(tool);
                break;
                
            case 'text':
                this.canvas.defaultCursor = 'text';
                this.enableTextTool();
                break;
                
            case 'note':
                this.canvas.defaultCursor = 'crosshair';
                this.enableNoteTool();
                break;
                
            case 'image':
                document.getElementById('imageInsertInput')?.click();
                this.setTool('select');
                break;
                
            case 'signature':
                this.openSignaturePanel();
                break;
                
            case 'stamp':
                this.openStampPanel();
                break;
        }
    },
    
    /**
     * Update brush settings
     */
    updateBrush() {
        if (!this.canvas || !this.canvas.freeDrawingBrush) return;
        
        const brush = this.canvas.freeDrawingBrush;
        
        if (this.currentTool === 'highlight') {
            brush.color = 'rgba(255, 255, 0, 0.4)';
            brush.width = 20;
        } else {
            brush.color = this.settings.strokeColor;
            brush.width = this.settings.strokeWidth;
            
            if (this.settings.opacity < 1) {
                const rgb = this.hexToRgb(this.settings.strokeColor);
                brush.color = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${this.settings.opacity})`;
            }
        }
    },
    
    /**
     * Enable eraser tool
     */
    enableEraser() {
        this.canvas.on('mouse:down', (e) => {
            if (this.currentTool !== 'eraser') return;
            
            const target = e.target;
            if (target && target !== this.canvas.backgroundImage) {
                this.canvas.remove(target);
                this.saveState();
            }
        });
    },
    
    /**
     * Enable line/arrow tool
     * FIX: Proper event handling, no duplicate shapes
     */
    enableLineTool(type) {
        let line = null;
        let isDrawing = false;
        
        this.canvas.on('mouse:down', (e) => {
            if (this.currentTool !== type) return;
            
            isDrawing = true;
            const pointer = this.canvas.getPointer(e.e);
            this.startX = pointer.x;
            this.startY = pointer.y;
            
            line = new fabric.Line([pointer.x, pointer.y, pointer.x, pointer.y], {
                stroke: this.settings.strokeColor,
                strokeWidth: this.settings.strokeWidth,
                opacity: this.settings.opacity,
                selectable: true,
                evented: true
            });
            
            this.canvas.add(line);
        });
        
        this.canvas.on('mouse:move', (e) => {
            if (!isDrawing || !line || this.currentTool !== type) return;
            
            const pointer = this.canvas.getPointer(e.e);
            line.set({ x2: pointer.x, y2: pointer.y });
            this.canvas.renderAll();
        });
        
        this.canvas.on('mouse:up', (e) => {
            if (!isDrawing || this.currentTool !== type) return;
            
            isDrawing = false;
            
            if (type === 'arrow' && line) {
                this.addArrowHead(line);
            }
            
            this.saveState();
            line = null;
        });
    },
    
    /**
     * Add arrow head to line
     */
    addArrowHead(line) {
        const x1 = line.x1;
        const y1 = line.y1;
        const x2 = line.x2;
        const y2 = line.y2;
        
        const angle = Math.atan2(y2 - y1, x2 - x1);
        const headLength = 15;
        
        const arrowHead = new fabric.Triangle({
            left: x2,
            top: y2,
            width: headLength,
            height: headLength,
            fill: this.settings.strokeColor,
            angle: (angle * 180 / Math.PI) + 90,
            originX: 'center',
            originY: 'center',
            opacity: this.settings.opacity
        });
        
        const group = new fabric.Group([line, arrowHead], {
            selectable: true
        });
        
        this.canvas.remove(line);
        this.canvas.add(group);
    },
    
    /**
     * Enable polyline tool
     * NEW: Click points to create connected lines
     */
    enablePolylineTool() {
        let points = [];
        let lines = [];
        let tempLine = null;
        
        this.canvas.on('mouse:down', (e) => {
            if (this.currentTool !== 'polyline') return;
            
            const pointer = this.canvas.getPointer(e.e);
            points.push({ x: pointer.x, y: pointer.y });
            
            // Remove temp line
            if (tempLine) {
                this.canvas.remove(tempLine);
                tempLine = null;
            }
            
            // Draw line from previous point
            if (points.length > 1) {
                const prevPoint = points[points.length - 2];
                const currentPoint = points[points.length - 1];
                
                const line = new fabric.Line([prevPoint.x, prevPoint.y, currentPoint.x, currentPoint.y], {
                    stroke: this.settings.strokeColor,
                    strokeWidth: this.settings.strokeWidth,
                    opacity: this.settings.opacity,
                    selectable: false,
                    evented: false
                });
                
                lines.push(line);
                this.canvas.add(line);
            }
            
            // Draw point marker
            const marker = new fabric.Circle({
                left: pointer.x - 4,
                top: pointer.y - 4,
                radius: 4,
                fill: this.settings.strokeColor,
                selectable: false,
                evented: false,
                _isPolylineMarker: true
            });
            this.canvas.add(marker);
            
            this.canvas.renderAll();
        });
        
        this.canvas.on('mouse:move', (e) => {
            if (this.currentTool !== 'polyline' || points.length === 0) return;
            
            const pointer = this.canvas.getPointer(e.e);
            const lastPoint = points[points.length - 1];
            
            if (tempLine) {
                this.canvas.remove(tempLine);
            }
            
            tempLine = new fabric.Line([lastPoint.x, lastPoint.y, pointer.x, pointer.y], {
                stroke: this.settings.strokeColor,
                strokeWidth: this.settings.strokeWidth,
                opacity: 0.5,
                selectable: false,
                evented: false,
                strokeDashArray: [5, 5]
            });
            
            this.canvas.add(tempLine);
            this.canvas.renderAll();
        });
        
        this.canvas.on('mouse:dblclick', (e) => {
            if (this.currentTool !== 'polyline' || points.length < 2) return;
            
            // Remove temp line and markers
            if (tempLine) {
                this.canvas.remove(tempLine);
                tempLine = null;
            }
            
            this.canvas.getObjects().forEach(obj => {
                if (obj._isPolylineMarker) {
                    this.canvas.remove(obj);
                }
            });
            
            // Remove individual lines
            lines.forEach(line => this.canvas.remove(line));
            
            // Create final polyline
            const polyline = new fabric.Polyline(points, {
                fill: 'transparent',
                stroke: this.settings.strokeColor,
                strokeWidth: this.settings.strokeWidth,
                opacity: this.settings.opacity,
                selectable: true
            });
            
            this.canvas.add(polyline);
            this.saveState();
            
            // Reset
            points = [];
            lines = [];
        });
    },
    
    /**
     * Enable shape tool
     * FIX: Proper drag handling, no duplicate shapes
     */
    enableShapeTool(type) {
        let shape = null;
        let isDrawing = false;
        
        this.canvas.on('mouse:down', (e) => {
            if (this.currentTool !== type) return;
            if (e.target) return; // Don't draw on existing objects
            
            isDrawing = true;
            const pointer = this.canvas.getPointer(e.e);
            this.startX = pointer.x;
            this.startY = pointer.y;
            
            const options = {
                left: pointer.x,
                top: pointer.y,
                fill: this.settings.fillColor,
                stroke: this.settings.strokeColor,
                strokeWidth: this.settings.strokeWidth,
                opacity: this.settings.opacity,
                selectable: true,
                originX: 'left',
                originY: 'top'
            };
            
            switch (type) {
                case 'rect':
                    shape = new fabric.Rect({ ...options, width: 1, height: 1 });
                    break;
                    
                case 'roundedRect':
                    shape = new fabric.Rect({ ...options, width: 1, height: 1, rx: 10, ry: 10 });
                    break;
                    
                case 'circle':
                    shape = new fabric.Ellipse({ ...options, rx: 1, ry: 1, originX: 'center', originY: 'center' });
                    break;
                    
                case 'triangle':
                    shape = new fabric.Triangle({ ...options, width: 1, height: 1 });
                    break;
                    
                case 'star':
                    shape = this.createStar(pointer.x, pointer.y, 5, 1, 0.5, options);
                    break;
                    
                case 'hexagon':
                    shape = this.createPolygon(pointer.x, pointer.y, 6, 1, options);
                    break;
                    
                case 'speechBubble':
                    shape = this.createSpeechBubble(pointer.x, pointer.y, 1, 1, options);
                    break;
            }
            
            if (shape) {
                this.canvas.add(shape);
                this.activeShape = shape;
            }
        });
        
        this.canvas.on('mouse:move', (e) => {
            if (!isDrawing || !this.activeShape || this.currentTool !== type) return;
            
            const pointer = this.canvas.getPointer(e.e);
            const width = Math.abs(pointer.x - this.startX);
            const height = Math.abs(pointer.y - this.startY);
            const left = Math.min(this.startX, pointer.x);
            const top = Math.min(this.startY, pointer.y);
            
            switch (type) {
                case 'rect':
                case 'roundedRect':
                    this.activeShape.set({ left, top, width, height });
                    break;
                    
                case 'circle':
                    this.activeShape.set({
                        left: this.startX,
                        top: this.startY,
                        rx: width / 2,
                        ry: height / 2
                    });
                    break;
                    
                case 'triangle':
                    this.activeShape.set({ left, top, width, height });
                    break;
                    
                case 'star':
                    this.canvas.remove(this.activeShape);
                    const outerRadius = Math.max(width, height) / 2;
                    this.activeShape = this.createStar(
                        this.startX, this.startY, 5, 
                        outerRadius, outerRadius * 0.4,
                        {
                            fill: this.settings.fillColor,
                            stroke: this.settings.strokeColor,
                            strokeWidth: this.settings.strokeWidth,
                            opacity: this.settings.opacity
                        }
                    );
                    this.canvas.add(this.activeShape);
                    break;
                    
                case 'hexagon':
                    this.canvas.remove(this.activeShape);
                    const radius = Math.max(width, height) / 2;
                    this.activeShape = this.createPolygon(
                        this.startX, this.startY, 6, radius,
                        {
                            fill: this.settings.fillColor,
                            stroke: this.settings.strokeColor,
                            strokeWidth: this.settings.strokeWidth,
                            opacity: this.settings.opacity
                        }
                    );
                    this.canvas.add(this.activeShape);
                    break;
                    
                case 'speechBubble':
                    this.canvas.remove(this.activeShape);
                    this.activeShape = this.createSpeechBubble(
                        left, top, width, height,
                        {
                            fill: this.settings.fillColor,
                            stroke: this.settings.strokeColor,
                            strokeWidth: this.settings.strokeWidth,
                            opacity: this.settings.opacity
                        }
                    );
                    this.canvas.add(this.activeShape);
                    break;
            }
            
            this.canvas.renderAll();
        });
        
        this.canvas.on('mouse:up', (e) => {
            if (!isDrawing || this.currentTool !== type) return;
            
            isDrawing = false;
            this.saveState();
            this.activeShape = null;
        });
    },
    
    /**
     * Create star shape
     */
    createStar(cx, cy, points, outerRadius, innerRadius, options) {
        const starPoints = [];
        const step = Math.PI / points;
        
        for (let i = 0; i < 2 * points; i++) {
            const radius = i % 2 === 0 ? outerRadius : innerRadius;
            const angle = i * step - Math.PI / 2;
            starPoints.push({
                x: cx + radius * Math.cos(angle),
                y: cy + radius * Math.sin(angle)
            });
        }
        
        return new fabric.Polygon(starPoints, {
            ...options,
            selectable: true
        });
    },
    
    /**
     * Create regular polygon
     */
    createPolygon(cx, cy, sides, radius, options) {
        const points = [];
        const step = (2 * Math.PI) / sides;
        
        for (let i = 0; i < sides; i++) {
            const angle = i * step - Math.PI / 2;
            points.push({
                x: cx + radius * Math.cos(angle),
                y: cy + radius * Math.sin(angle)
            });
        }
        
        return new fabric.Polygon(points, {
            ...options,
            selectable: true
        });
    },
    
    /**
     * Create speech bubble
     */
    createSpeechBubble(x, y, width, height, options) {
        width = Math.max(width, 50);
        height = Math.max(height, 40);
        
        const tailHeight = height * 0.3;
        const tailWidth = width * 0.15;
        const cornerRadius = Math.min(10, width * 0.1, height * 0.1);
        
        const pathData = `
            M ${x + cornerRadius} ${y}
            L ${x + width - cornerRadius} ${y}
            Q ${x + width} ${y} ${x + width} ${y + cornerRadius}
            L ${x + width} ${y + height - cornerRadius}
            Q ${x + width} ${y + height} ${x + width - cornerRadius} ${y + height}
            L ${x + width * 0.4} ${y + height}
            L ${x + width * 0.3} ${y + height + tailHeight}
            L ${x + width * 0.25} ${y + height}
            L ${x + cornerRadius} ${y + height}
            Q ${x} ${y + height} ${x} ${y + height - cornerRadius}
            L ${x} ${y + cornerRadius}
            Q ${x} ${y} ${x + cornerRadius} ${y}
            Z
        `;
        
        return new fabric.Path(pathData, {
            ...options,
            selectable: true
        });
    },
    
    /**
     * Enable text tool
     * FIX: Prevent keyboard shortcuts while typing
     */
    enableTextTool() {
        this.canvas.on('mouse:down', (e) => {
            if (this.currentTool !== 'text') return;
            if (e.target) return;
            
            const pointer = this.canvas.getPointer(e.e);
            
            const text = new fabric.IText('Type here...', {
                left: pointer.x,
                top: pointer.y,
                fontFamily: this.settings.fontFamily,
                fontSize: this.settings.fontSize,
                fill: this.settings.strokeColor,
                opacity: this.settings.opacity
            });
            
            this.canvas.add(text);
            this.canvas.setActiveObject(text);
            text.enterEditing();
            text.selectAll();
            
            this.isTyping = true;
            
            // Listen for editing exit
            text.on('editing:exited', () => {
                this.isTyping = false;
                if (text.text === '' || text.text === 'Type here...') {
                    this.canvas.remove(text);
                }
                this.saveState();
            });
        });
    },
    
    /**
     * Enable note tool
     * FIX: Same keyboard issue as text
     */
    enableNoteTool() {
        this.canvas.on('mouse:down', (e) => {
            if (this.currentTool !== 'note') return;
            if (e.target) return;
            
            const pointer = this.canvas.getPointer(e.e);
            this.createNote(pointer.x, pointer.y);
        });
    },
    
    /**
     * Create note
     */
    createNote(x, y) {
        const noteWidth = 150;
        const noteHeight = 100;
        const bgColor = '#fef08a';
        
        // Background
        const bg = new fabric.Rect({
            width: noteWidth,
            height: noteHeight,
            fill: bgColor,
            stroke: '#00000022',
            strokeWidth: 1,
            rx: 2,
            ry: 2,
            shadow: new fabric.Shadow({
                color: 'rgba(0,0,0,0.2)',
                blur: 5,
                offsetX: 2,
                offsetY: 2
            })
        });
        
        // Header
        const header = new fabric.Rect({
            width: noteWidth,
            height: 20,
            fill: '#fde047'
        });
        
        // Text
        const text = new fabric.IText('Note...', {
            width: noteWidth - 16,
            fontSize: 12,
            fontFamily: 'Arial',
            fill: '#1f2937',
            left: 8,
            top: 28
        });
        
        // Group
        const noteGroup = new fabric.Group([bg, header, text], {
            left: x,
            top: y,
            selectable: true,
            subTargetCheck: true
        });
        
        // Store data
        noteGroup._isNote = true;
        noteGroup._noteColor = bgColor;
        
        this.canvas.add(noteGroup);
        this.saveState();
        
        // Double-click to edit
        noteGroup.on('mousedblclick', () => {
            this.editNoteInPlace(noteGroup);
        });
    },
    
    /**
     * Edit note in place
     */
    editNoteInPlace(noteGroup) {
        const items = noteGroup.getObjects();
        const textItem = items.find(item => item.type === 'i-text' || item.type === 'text');
        
        if (textItem) {
            // Ungroup temporarily
            const groupPos = noteGroup.getCenterPoint();
            
            // Create editable text at same position
            const editText = new fabric.IText(textItem.text, {
                left: noteGroup.left + 8,
                top: noteGroup.top + 28,
                fontSize: 12,
                fontFamily: 'Arial',
                fill: '#1f2937',
                width: 134
            });
            
            this.canvas.add(editText);
            this.canvas.setActiveObject(editText);
            editText.enterEditing();
            this.isTyping = true;
            
            editText.on('editing:exited', () => {
                this.isTyping = false;
                
                // Update note group
                textItem.set({ text: editText.text });
                this.canvas.remove(editText);
                this.canvas.renderAll();
                this.saveState();
            });
        }
    },
    
    /**
     * Insert image
     */
    insertImage(file) {
        if (!file || !file.type.startsWith('image/')) {
            Toast.error('Invalid image file');
            return;
        }
        
        const reader = new FileReader();
        
        reader.onload = (e) => {
            fabric.Image.fromURL(e.target.result, (img) => {
                const maxSize = 300;
                const scale = Math.min(maxSize / img.width, maxSize / img.height, 1);
                
                img.set({
                    left: this.canvas.width / 2 - (img.width * scale) / 2,
                    top: this.canvas.height / 2 - (img.height * scale) / 2,
                    scaleX: scale,
                    scaleY: scale,
                    selectable: true
                });
                
                this.canvas.add(img);
                this.canvas.setActiveObject(img);
                this.saveState();
                
                Toast.success('Image added');
            });
        };
        
        reader.readAsDataURL(file);
    },
    
    /**
     * Handle keyboard shortcuts
     * FIX: Don't trigger while typing
     */
    handleKeyboard(e) {
        // Skip if typing in input/textarea
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
            return;
        }
        
        // Skip if canvas text editing
        if (this.isTyping) {
            return;
        }
        
        // Skip if no canvas
        if (!this.canvas) return;
        
        // Ctrl shortcuts
        if (e.ctrlKey || e.metaKey) {
            switch (e.key.toLowerCase()) {
                case 'z':
                    e.preventDefault();
                    this.undo();
                    break;
                case 'y':
                    e.preventDefault();
                    this.redo();
                    break;
                case 's':
                    e.preventDefault();
                    this.savePDF();
                    break;
            }
            return;
        }
        
        // Tool shortcuts (only single keys, not while typing)
        switch (e.key.toLowerCase()) {
            case 'v':
                e.preventDefault();
                this.setTool('select');
                break;
            case 'p':
                e.preventDefault();
                this.setTool('pen');
                break;
            case 'delete':
            case 'backspace':
                if (!this.isTyping) {
                    e.preventDefault();
                    this.deleteSelected();
                }
                break;
            case 'escape':
                e.preventDefault();
                this.setTool('select');
                this.closeAllPanels();
                break;
        }
    },
    
    /**
     * Delete selected objects
     */
    deleteSelected() {
        if (!this.canvas) return;
        
        const activeObjects = this.canvas.getActiveObjects();
        if (activeObjects.length === 0) return;
        
        activeObjects.forEach(obj => this.canvas.remove(obj));
        this.canvas.discardActiveObject();
        this.canvas.renderAll();
        this.saveState();
    },
    
    /**
     * Canvas modified handler
     */
    onCanvasModified() {
        clearTimeout(this._saveTimeout);
        this._saveTimeout = setTimeout(() => {
            // Auto-save state handled by individual tools
        }, 300);
    },
    
    /**
     * Save state for undo/redo
     */
    saveState() {
        if (!this.canvas) return;
        
        // Remove future states
        this.history = this.history.slice(0, this.historyIndex + 1);
        
        // Add current state
        const state = JSON.stringify(this.canvas.toJSON());
        this.history.push(state);
        
        // Limit history
        if (this.history.length > this.maxHistory) {
            this.history.shift();
        }
        
        this.historyIndex = this.history.length - 1;
        this.updateHistoryButtons();
    },
    
    /**
     * Undo
     */
    undo() {
        if (this.historyIndex <= 0) return;
        
        this.historyIndex--;
        this.loadState(this.history[this.historyIndex]);
    },
    
    /**
     * Redo
     */
    redo() {
        if (this.historyIndex >= this.history.length - 1) return;
        
        this.historyIndex++;
        this.loadState(this.history[this.historyIndex]);
    },
    
    /**
     * Load canvas state
     */
    loadState(state) {
        if (!this.canvas) return;
        
        const bgImage = this.canvas.backgroundImage;
        
        this.canvas.loadFromJSON(state, () => {
            // Restore background
            if (bgImage) {
                this.canvas.setBackgroundImage(bgImage, this.canvas.renderAll.bind(this.canvas));
            }
            this.canvas.renderAll();
            this.updateHistoryButtons();
        });
    },
    
    /**
     * Update undo/redo button states
     */
    updateHistoryButtons() {
        const undoBtn = document.getElementById('undoBtn');
        const redoBtn = document.getElementById('redoBtn');
        
        if (undoBtn) undoBtn.disabled = this.historyIndex <= 0;
        if (redoBtn) redoBtn.disabled = this.historyIndex >= this.history.length - 1;
    },
    
    /**
     * Clear all objects
     */
    clearAll() {
        if (!this.canvas) return;
        
        const objects = this.canvas.getObjects().slice();
        objects.forEach(obj => {
            if (obj !== this.canvas.backgroundImage) {
                this.canvas.remove(obj);
            }
        });
        
        this.canvas.renderAll();
        this.saveState();
        Toast.info('Canvas cleared');
    },
    
    /**
     * Zoom by amount
     */
    zoomBy(amount) {
        const slider = document.getElementById('zoomSlider');
        if (slider) {
            const newValue = parseInt(slider.value) + amount;
            slider.value = Math.max(50, Math.min(300, newValue));
            this.setZoom(parseInt(slider.value));
        }
    },
    
    /**
     * Set zoom level
     */
    setZoom(percent) {
        this.scale = percent / 100;
        this.updateZoomDisplay();
        this.reloadCurrentPage();
    },
    
    /**
     * Fit to screen
     */
    fitToScreen() {
        const container = document.getElementById('canvasScrollWrapper');
        if (!container || !this.pageImages[this.currentPage - 1]) return;
        
        const pageImage = this.pageImages[this.currentPage - 1];
        const containerWidth = container.clientWidth - 40;
        const containerHeight = container.clientHeight - 40;
        
        const scaleX = containerWidth / pageImage.width;
        const scaleY = containerHeight / pageImage.height;
        
        this.scale = Math.min(scaleX, scaleY);
        
        const slider = document.getElementById('zoomSlider');
        if (slider) slider.value = Math.round(this.scale * 100);
        
        this.updateZoomDisplay();
        this.reloadCurrentPage();
    },
    
    /**
     * Update zoom display
     */
    updateZoomDisplay() {
        const zoomLevel = document.getElementById('zoomLevel');
        if (zoomLevel) {
            zoomLevel.textContent = `${Math.round(this.scale * 100)}%`;
        }
    },
    
    /**
     * Reload current page
     */
    async reloadCurrentPage() {
        // Clear page cache
        this.pageImages[this.currentPage - 1] = null;
        
        const pageImage = await this.renderPage(this.currentPage);
        
        if (this.canvas) {
            this.canvas.setWidth(pageImage.width);
            this.canvas.setHeight(pageImage.height);
            this.setCanvasBackground(pageImage.dataUrl);
        }
    },
    
    /**
     * Change page
     */
    async changePage(delta) {
        const newPage = this.currentPage + delta;
        await this.goToPage(newPage);
    },
    
    /**
     * Go to specific page
     */
    async goToPage(pageNum) {
        if (pageNum < 1 || pageNum > this.totalPages) return;
        
        // Save current page objects
        if (this.canvas) {
            this.pageObjects[this.currentPage - 1] = this.canvas.toJSON().objects;
        }
        
        this.currentPage = pageNum;
        
        const pageInput = document.getElementById('pageInput');
        if (pageInput) pageInput.value = pageNum;
        
        const pageImage = await this.renderPage(pageNum);
        
        if (this.canvas) {
            this.canvas.clear();
            this.canvas.setWidth(pageImage.width);
            this.canvas.setHeight(pageImage.height);
            this.setCanvasBackground(pageImage.dataUrl);
            
            // Restore objects
            if (this.pageObjects[pageNum - 1] && this.pageObjects[pageNum - 1].length > 0) {
                fabric.util.enlivenObjects(this.pageObjects[pageNum - 1], (objects) => {
                    objects.forEach(obj => this.canvas.add(obj));
                    this.canvas.renderAll();
                });
            }
        }
        
        // Update navigation buttons
        document.getElementById('prevPageBtn').disabled = pageNum <= 1;
        document.getElementById('nextPageBtn').disabled = pageNum >= this.totalPages;
    },
    
    /**
     * Remove PDF
     */
    removePDF() {
        this.closeAllPanels();
        
        this.pdfDoc = null;
        this.currentPage = 1;
        this.totalPages = 0;
        this.pageImages = [];
        this.pageObjects = [];
        this.history = [];
        this.historyIndex = -1;
        this.isTyping = false;
        
        if (this.canvas) {
            this.canvas.dispose();
            this.canvas = null;
        }
        
        document.getElementById('editorDropzone').style.display = 'block';
        document.getElementById('editorContainer').style.display = 'none';
        
        Toast.info('PDF removed');
    },
    
    /**
     * Close all panels
     */
    closeAllPanels() {
        document.querySelectorAll('.panel-overlay').forEach(el => el.remove());
        document.querySelectorAll('.editor-panel').forEach(el => el.remove());
    },
    
    /**
     * Helper: hex to RGB
     */
    hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : { r: 0, g: 0, b: 0 };
    },
    
    // Placeholder functions - will be added in PART B & C
    openSignaturePanel() {
        Toast.info('Signature panel - Loading in PART C...');
    },
    
    openStampPanel() {
        Toast.info('Stamp panel - Loading in PART C...');
    },
    
    savePDF() {
        Toast.info('Save PDF - Loading in PART C...');
    }
};

// ==========================================
// INITIALIZATION
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    Editor.init();
});

// ==========================================
// EXPORT
// ==========================================
// ==========================================
// PART B & C: SIGNATURE, STAMP, SAVE PDF
// ==========================================

/**
 * Add panel styles
 */
Editor.addPanelStyles = function() {
    if (document.getElementById('editorPanelStyles')) return;
    
    const styles = document.createElement('style');
    styles.id = 'editorPanelStyles';
    styles.textContent = `
        /* Panel Overlay */
        .panel-overlay {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.7);
            z-index: 2999;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        
        /* Editor Panel */
        .editor-panel {
            background: var(--bg-card);
            border: 1px solid var(--border-default);
            border-radius: 2px;
            min-width: 350px;
            max-width: 450px;
            max-height: 90vh;
            overflow-y: auto;
            box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
            z-index: 3000;
        }
        
        .panel-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 15px 20px;
            background: var(--bg-secondary);
            border-bottom: 1px solid var(--border-default);
            font-weight: 600;
            font-size: 16px;
        }
        
        .panel-close {
            background: none;
            border: none;
            color: var(--text-secondary);
            font-size: 24px;
            cursor: pointer;
            line-height: 1;
            padding: 0;
            width: 30px;
            height: 30px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 2px;
            transition: all 0.2s;
        }
        
        .panel-close:hover {
            background: var(--danger);
            color: white;
        }
        
        .panel-body {
            padding: 20px;
        }
        
        .panel-row {
            margin-bottom: 15px;
        }
        
        .panel-row:last-child {
            margin-bottom: 0;
        }
        
        .panel-row label {
            display: block;
            font-size: 13px;
            color: var(--text-secondary);
            margin-bottom: 6px;
        }
        
        .panel-row input[type="text"],
        .panel-row input[type="number"],
        .panel-row select,
        .panel-row textarea {
            width: 100%;
            padding: 10px 12px;
            background: var(--bg-secondary);
            border: 1px solid var(--border-default);
            border-radius: 2px;
            color: var(--text-primary);
            font-size: 14px;
            transition: border-color 0.2s;
        }
        
        .panel-row input:focus,
        .panel-row select:focus,
        .panel-row textarea:focus {
            outline: none;
            border-color: var(--accent);
        }
        
        .panel-row textarea {
            resize: vertical;
            min-height: 80px;
            font-family: inherit;
        }
        
        .panel-footer {
            display: flex;
            justify-content: flex-end;
            gap: 10px;
            padding: 15px 20px;
            background: var(--bg-secondary);
            border-top: 1px solid var(--border-default);
        }
        
        /* Signature Panel */
        .signature-tabs {
            display: flex;
            gap: 5px;
            margin-bottom: 20px;
        }
        
        .signature-tab {
            flex: 1;
            padding: 12px 10px;
            background: var(--bg-secondary);
            border: 1px solid var(--border-default);
            border-radius: 2px;
            color: var(--text-secondary);
            cursor: pointer;
            text-align: center;
            font-size: 13px;
            font-weight: 500;
            transition: all 0.2s;
        }
        
        .signature-tab:hover {
            border-color: var(--border-hover);
        }
        
        .signature-tab.active {
            background: var(--accent);
            border-color: var(--accent);
            color: white;
        }
        
        .signature-canvas-wrapper {
            border: 1px solid var(--border-default);
            border-radius: 2px;
            background: white;
            margin-bottom: 15px;
            overflow: hidden;
        }
        
        #signatureDrawCanvas {
            display: block;
            width: 100%;
            height: 150px;
            cursor: crosshair;
            touch-action: none;
        }
        
        .signature-type-preview {
            padding: 30px 20px;
            background: white;
            border: 1px solid var(--border-default);
            border-radius: 2px;
            text-align: center;
            min-height: 80px;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        
        .signature-upload-area {
            padding: 40px 20px;
            text-align: center;
            border: 2px dashed var(--border-default);
            border-radius: 2px;
            cursor: pointer;
            transition: all 0.2s;
        }
        
        .signature-upload-area:hover {
            border-color: var(--accent);
            background: rgba(59, 130, 246, 0.05);
        }
        
        .signature-upload-area.dragover {
            border-color: var(--accent);
            background: rgba(59, 130, 246, 0.1);
        }
        
        .signature-controls {
            display: flex;
            gap: 15px;
            flex-wrap: wrap;
            align-items: center;
            padding: 10px 0;
        }
        
        .signature-control-group {
            display: flex;
            align-items: center;
            gap: 8px;
        }
        
        .signature-control-group label {
            margin: 0;
            font-size: 12px;
            white-space: nowrap;
        }
        
        /* Stamp Panel */
        .stamp-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 10px;
            margin-bottom: 20px;
        }
        
        .stamp-item {
            aspect-ratio: 1.2;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            background: var(--bg-secondary);
            border: 2px solid var(--border-default);
            border-radius: 2px;
            cursor: pointer;
            transition: all 0.2s;
            padding: 10px;
            text-align: center;
        }
        
        .stamp-item:hover {
            border-color: var(--border-hover);
            transform: translateY(-2px);
        }
        
        .stamp-item.selected {
            border-color: var(--accent);
            background: rgba(59, 130, 246, 0.1);
        }
        
        .stamp-preview {
            font-size: 11px;
            font-weight: bold;
            padding: 6px 10px;
            border: 2px solid currentColor;
            border-radius: 2px;
            transform: rotate(-10deg);
        }
        
        .stamp-approved { color: #22c55e; }
        .stamp-rejected { color: #ef4444; }
        .stamp-draft { color: #f59e0b; }
        .stamp-confidential { color: #8b5cf6; }
        .stamp-date { color: #3b82f6; }
        .stamp-custom { color: var(--text-muted); border-style: dashed; }
        
        /* Custom Stamp Section */
        .custom-stamp-section {
            margin-top: 15px;
            padding-top: 15px;
            border-top: 1px solid var(--border-default);
        }
        
        .custom-stamp-preview {
            padding: 30px;
            background: white;
            border: 1px solid var(--border-default);
            border-radius: 2px;
            text-align: center;
            margin: 15px 0;
        }
        
        .custom-stamp-text {
            display: inline-block;
            font-weight: bold;
            padding: 10px 20px;
            border: 3px solid currentColor;
            border-radius: 2px;
        }
        
        .stamp-shape-options {
            display: flex;
            gap: 10px;
            margin-top: 10px;
        }
        
        .stamp-shape-btn {
            flex: 1;
            padding: 10px;
            background: var(--bg-secondary);
            border: 1px solid var(--border-default);
            border-radius: 2px;
            color: var(--text-secondary);
            cursor: pointer;
            font-size: 12px;
            transition: all 0.2s;
        }
        
        .stamp-shape-btn:hover {
            border-color: var(--border-hover);
        }
        
        .stamp-shape-btn.active {
            border-color: var(--accent);
            color: var(--accent);
        }
        
        /* Opacity/Size Row */
        .style-row {
            display: flex;
            gap: 20px;
            flex-wrap: wrap;
            padding: 15px 0;
            border-top: 1px solid var(--border-default);
            margin-top: 15px;
        }
        
        .style-row .style-item {
            display: flex;
            align-items: center;
            gap: 8px;
        }
        
        .style-row label {
            margin: 0;
            font-size: 12px;
            color: var(--text-secondary);
        }
        
        .style-row input[type="range"] {
            width: 80px;
        }
        
        .style-row input[type="color"] {
            width: 32px;
            height: 32px;
            padding: 0;
            border: 1px solid var(--border-default);
            border-radius: 2px;
            cursor: pointer;
        }
    `;
    
    document.head.appendChild(styles);
};

// ==========================================
// SIGNATURE PANEL
// ==========================================

/**
 * Open signature panel
 * FIX: Works on first click
 */
Editor.openSignaturePanel = function() {
    // Reset tool first
    this.currentTool = 'select';
    this.clearCanvasEvents();
    
    this.closeAllPanels();
    this.addPanelStyles();
    
    const overlay = document.createElement('div');
    overlay.className = 'panel-overlay';
    overlay.id = 'signatureOverlay';
    
    const panel = document.createElement('div');
    panel.className = 'editor-panel';
    panel.id = 'signaturePanel';
    
    panel.innerHTML = `
        <div class="panel-header">
            <span>✍️ Signature</span>
            <button class="panel-close" id="closeSignaturePanel">&times;</button>
        </div>
        <div class="panel-body">
            <!-- Tabs -->
            <div class="signature-tabs">
                <button class="signature-tab active" data-tab="draw">✏️ Draw</button>
                <button class="signature-tab" data-tab="type">T Type</button>
                <button class="signature-tab" data-tab="upload">📁 Upload</button>
            </div>
            
            <!-- Draw Tab -->
            <div class="signature-tab-content" id="sigTabDraw">
                <div class="signature-canvas-wrapper">
                    <canvas id="signatureDrawCanvas"></canvas>
                </div>
                <div class="signature-controls">
                    <button class="btn btn-sm" id="clearSignatureBtn">🗑️ Clear</button>
                    <div class="signature-control-group">
                        <label>Color:</label>
                        <input type="color" id="signatureDrawColor" value="#000000">
                    </div>
                    <div class="signature-control-group">
                        <label>Size:</label>
                        <input type="range" id="signatureDrawSize" min="1" max="8" value="3" style="width:60px;">
                    </div>
                </div>
            </div>
            
            <!-- Type Tab -->
            <div class="signature-tab-content" id="sigTabType" style="display:none;">
                <div class="panel-row">
                    <label>Your Name:</label>
                    <input type="text" id="signatureTypeText" placeholder="Type your name...">
                </div>
                <div class="panel-row">
                    <label>Font Style:</label>
                    <select id="signatureTypeFont">
                        <option value="'Brush Script MT', cursive">Brush Script</option>
                        <option value="'Lucida Handwriting', cursive">Lucida Handwriting</option>
                        <option value="'Segoe Script', cursive">Segoe Script</option>
                        <option value="'Comic Sans MS', cursive">Comic Sans</option>
                        <option value="'Pacifico', cursive">Pacifico Style</option>
                        <option value="'Dancing Script', cursive">Dancing Script</option>
                    </select>
                </div>
                <div class="panel-row">
                    <label>Preview:</label>
                    <div class="signature-type-preview" id="signatureTypePreview">
                        <span style="font-family:'Brush Script MT', cursive; font-size:36px; color:#000;">Your Name</span>
                    </div>
                </div>
                <div class="signature-controls">
                    <div class="signature-control-group">
                        <label>Color:</label>
                        <input type="color" id="signatureTypeColor" value="#000000">
                    </div>
                    <div class="signature-control-group">
                        <label>Size:</label>
                        <input type="range" id="signatureTypeSize" min="24" max="72" value="36" style="width:60px;">
                        <span id="signatureTypeSizeValue">36px</span>
                    </div>
                </div>
            </div>
            
            <!-- Upload Tab -->
            <div class="signature-tab-content" id="sigTabUpload" style="display:none;">
                <div class="signature-upload-area" id="signatureUploadArea">
                    <div style="font-size:2.5rem; margin-bottom:10px;">📁</div>
                    <div style="color:var(--text-secondary);">Click or drag PNG image here</div>
                    <div style="font-size:12px; color:var(--text-muted); margin-top:5px;">Recommended: Transparent PNG</div>
                    <input type="file" id="signatureFileInput" accept="image/png,image/jpeg,image/*" style="display:none;">
                </div>
                <div id="signatureUploadPreview" style="display:none; margin-top:15px;">
                    <label>Preview:</label>
                    <div style="padding:20px; background:white; border:1px solid var(--border-default); border-radius:2px; text-align:center;">
                        <img id="signatureUploadImg" src="" alt="Signature" style="max-width:100%; max-height:100px;">
                    </div>
                </div>
            </div>
            
            <!-- Opacity -->
            <div class="style-row">
                <div class="style-item">
                    <label>Opacity:</label>
                    <input type="range" id="signatureOpacity" min="20" max="100" value="100">
                    <span id="signatureOpacityValue">100%</span>
                </div>
            </div>
        </div>
        <div class="panel-footer">
            <button class="btn btn-sm" id="cancelSignature">Cancel</button>
            <button class="btn btn-sm btn-primary" id="applySignature">✓ Add Signature</button>
        </div>
    `;
    
    overlay.appendChild(panel);
    document.body.appendChild(overlay);
    
    // Initialize drawing canvas
    this.initSignatureDrawCanvas();
    
    // Tab switching
    panel.querySelectorAll('.signature-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            panel.querySelectorAll('.signature-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            
            document.getElementById('sigTabDraw').style.display = tab.dataset.tab === 'draw' ? 'block' : 'none';
            document.getElementById('sigTabType').style.display = tab.dataset.tab === 'type' ? 'block' : 'none';
            document.getElementById('sigTabUpload').style.display = tab.dataset.tab === 'upload' ? 'block' : 'none';
        });
    });
    
    // Type tab live preview
    const typeText = document.getElementById('signatureTypeText');
    const typeFont = document.getElementById('signatureTypeFont');
    const typeColor = document.getElementById('signatureTypeColor');
    const typeSize = document.getElementById('signatureTypeSize');
    const typeSizeValue = document.getElementById('signatureTypeSizeValue');
    const typePreview = document.getElementById('signatureTypePreview');
    
    const updateTypePreview = () => {
        const text = typeText.value || 'Your Name';
        const font = typeFont.value;
        const color = typeColor.value;
        const size = typeSize.value;
        typeSizeValue.textContent = `${size}px`;
        typePreview.innerHTML = `<span style="font-family:${font}; font-size:${size}px; color:${color};">${text}</span>`;
    };
    
    typeText.addEventListener('input', updateTypePreview);
    typeFont.addEventListener('change', updateTypePreview);
    typeColor.addEventListener('input', updateTypePreview);
    typeSize.addEventListener('input', updateTypePreview);
    
    // Upload tab
    const uploadArea = document.getElementById('signatureUploadArea');
    const fileInput = document.getElementById('signatureFileInput');
    
    uploadArea.addEventListener('click', () => fileInput.click());
    
    uploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadArea.classList.add('dragover');
    });
    
    uploadArea.addEventListener('dragleave', () => {
        uploadArea.classList.remove('dragover');
    });
    
    uploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadArea.classList.remove('dragover');
        const file = e.dataTransfer.files[0];
        if (file) this.handleSignatureUpload(file);
    });
    
    fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) this.handleSignatureUpload(file);
    });
    
    // Opacity slider
    const opacitySlider = document.getElementById('signatureOpacity');
    const opacityValue = document.getElementById('signatureOpacityValue');
    opacitySlider.addEventListener('input', () => {
        opacityValue.textContent = `${opacitySlider.value}%`;
    });
    
    // Clear button
    document.getElementById('clearSignatureBtn').addEventListener('click', () => {
        this.clearSignatureDrawCanvas();
    });
    
    // Close
    const closePanel = () => {
        overlay.remove();
        this._signatureUploadData = null;
        this.setTool('select');
    };
    
    document.getElementById('closeSignaturePanel').addEventListener('click', closePanel);
    document.getElementById('cancelSignature').addEventListener('click', closePanel);
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) closePanel();
    });
    
    // Apply
    document.getElementById('applySignature').addEventListener('click', () => {
        const activeTab = panel.querySelector('.signature-tab.active').dataset.tab;
        const opacity = parseInt(opacitySlider.value) / 100;
        
        let success = false;
        
        switch (activeTab) {
            case 'draw':
                success = this.applyDrawnSignature(opacity);
                break;
            case 'type':
                success = this.applyTypedSignature(opacity);
                break;
            case 'upload':
                success = this.applyUploadedSignature(opacity);
                break;
        }
        
        if (success) {
            closePanel();
        }
    });
};

/**
 * Initialize signature drawing canvas
 */
Editor.initSignatureDrawCanvas = function() {
    const canvas = document.getElementById('signatureDrawCanvas');
    if (!canvas) return;
    
    // Set size
    const wrapper = canvas.parentElement;
    canvas.width = wrapper.clientWidth;
    canvas.height = 150;
    
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    let isDrawing = false;
    let lastX = 0;
    let lastY = 0;
    
    const getPos = (e) => {
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        
        if (e.touches) {
            return {
                x: (e.touches[0].clientX - rect.left) * scaleX,
                y: (e.touches[0].clientY - rect.top) * scaleY
            };
        }
        return {
            x: (e.clientX - rect.left) * scaleX,
            y: (e.clientY - rect.top) * scaleY
        };
    };
    
    const startDraw = (e) => {
        e.preventDefault();
        isDrawing = true;
        const pos = getPos(e);
        lastX = pos.x;
        lastY = pos.y;
    };
    
    const draw = (e) => {
        if (!isDrawing) return;
        e.preventDefault();
        
        const pos = getPos(e);
        const color = document.getElementById('signatureDrawColor').value;
        const size = parseInt(document.getElementById('signatureDrawSize').value);
        
        ctx.beginPath();
        ctx.strokeStyle = color;
        ctx.lineWidth = size;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.moveTo(lastX, lastY);
        ctx.lineTo(pos.x, pos.y);
        ctx.stroke();
        
        lastX = pos.x;
        lastY = pos.y;
    };
    
    const stopDraw = () => {
        isDrawing = false;
    };
    
    // Mouse events
    canvas.addEventListener('mousedown', startDraw);
    canvas.addEventListener('mousemove', draw);
    canvas.addEventListener('mouseup', stopDraw);
    canvas.addEventListener('mouseout', stopDraw);
    
    // Touch events
    canvas.addEventListener('touchstart', startDraw, { passive: false });
    canvas.addEventListener('touchmove', draw, { passive: false });
    canvas.addEventListener('touchend', stopDraw);
    
    this._signatureDrawCanvas = canvas;
};

/**
 * Clear signature drawing canvas
 */
Editor.clearSignatureDrawCanvas = function() {
    const canvas = this._signatureDrawCanvas;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
};

/**
 * Handle signature file upload
 */
Editor.handleSignatureUpload = function(file) {
    if (!file.type.startsWith('image/')) {
        Toast.error('Please upload an image file');
        return;
    }
    
    const reader = new FileReader();
    reader.onload = (e) => {
        document.getElementById('signatureUploadImg').src = e.target.result;
        document.getElementById('signatureUploadPreview').style.display = 'block';
        this._signatureUploadData = e.target.result;
    };
    reader.readAsDataURL(file);
};

/**
 * Apply drawn signature
 */
Editor.applyDrawnSignature = function(opacity) {
    const canvas = this._signatureDrawCanvas;
    if (!canvas) return false;
    
    // Check if canvas has drawing
    const ctx = canvas.getContext('2d');
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const pixels = imageData.data;
    
    let hasDrawing = false;
    for (let i = 0; i < pixels.length; i += 4) {
        if (pixels[i] < 250 || pixels[i + 1] < 250 || pixels[i + 2] < 250) {
            hasDrawing = true;
            break;
        }
    }
    
    if (!hasDrawing) {
        Toast.warning('Please draw your signature first');
        return false;
    }
    
    // Export as PNG
    const dataUrl = canvas.toDataURL('image/png');
    this.addSignatureToCanvas(dataUrl, opacity);
    return true;
};

/**
 * Apply typed signature
 */
Editor.applyTypedSignature = function(opacity) {
    const text = document.getElementById('signatureTypeText').value.trim();
    if (!text) {
        Toast.warning('Please type your name');
        return false;
    }
    
    const font = document.getElementById('signatureTypeFont').value;
    const color = document.getElementById('signatureTypeColor').value;
    const size = parseInt(document.getElementById('signatureTypeSize').value);
    
    // Create canvas for signature
    const tempCanvas = document.createElement('canvas');
    const ctx = tempCanvas.getContext('2d');
    
    ctx.font = `${size}px ${font}`;
    const metrics = ctx.measureText(text);
    
    tempCanvas.width = metrics.width + 40;
    tempCanvas.height = size + 30;
    
    ctx.font = `${size}px ${font}`;
    ctx.fillStyle = color;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, tempCanvas.width / 2, tempCanvas.height / 2);
    
    const dataUrl = tempCanvas.toDataURL('image/png');
    this.addSignatureToCanvas(dataUrl, opacity);
    return true;
};

/**
 * Apply uploaded signature
 */
Editor.applyUploadedSignature = function(opacity) {
    if (!this._signatureUploadData) {
        Toast.warning('Please upload a signature image');
        return false;
    }
    
    this.addSignatureToCanvas(this._signatureUploadData, opacity);
    return true;
};

/**
 * Add signature image to main canvas
 */
Editor.addSignatureToCanvas = function(dataUrl, opacity) {
    if (!this.canvas) return;
    
    fabric.Image.fromURL(dataUrl, (img) => {
        const maxWidth = 200;
        const scale = Math.min(maxWidth / img.width, 1);
        
        img.set({
            left: this.canvas.width / 2 - (img.width * scale) / 2,
            top: this.canvas.height / 2 - (img.height * scale) / 2,
            scaleX: scale,
            scaleY: scale,
            opacity: opacity,
            selectable: true,
            hasControls: true
        });
        
        this.canvas.add(img);
        this.canvas.setActiveObject(img);
        this.saveState();
        
        Toast.success('Signature added');
    });
};

// ==========================================
// STAMP PANEL
// ==========================================

/**
 * Open stamp panel
 * FIX: Works on first click
 */
Editor.openStampPanel = function() {
    // Reset tool first
    this.currentTool = 'select';
    this.clearCanvasEvents();
    
    this.closeAllPanels();
    this.addPanelStyles();
    
    const overlay = document.createElement('div');
    overlay.className = 'panel-overlay';
    overlay.id = 'stampOverlay';
    
    const panel = document.createElement('div');
    panel.className = 'editor-panel';
    panel.id = 'stampPanel';
    
    // Get current date
    const today = new Date();
    const dateStr = today.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
    });
    
    panel.innerHTML = `
        <div class="panel-header">
            <span>🔖 Stamp</span>
            <button class="panel-close" id="closeStampPanel">&times;</button>
        </div>
        <div class="panel-body">
            <!-- Preset Stamps -->
            <div class="panel-row">
                <label>Select Stamp:</label>
                <div class="stamp-grid">
                    <div class="stamp-item" data-stamp="approved">
                        <div class="stamp-preview stamp-approved">✓ APPROVED</div>
                    </div>
                    <div class="stamp-item" data-stamp="rejected">
                        <div class="stamp-preview stamp-rejected">✗ REJECTED</div>
                    </div>
                    <div class="stamp-item" data-stamp="draft">
                        <div class="stamp-preview stamp-draft">DRAFT</div>
                    </div>
                    <div class="stamp-item" data-stamp="confidential">
                        <div class="stamp-preview stamp-confidential">🔒 SECRET</div>
                    </div>
                    <div class="stamp-item" data-stamp="date">
                        <div class="stamp-preview stamp-date">📅 ${dateStr}</div>
                    </div>
                    <div class="stamp-item" data-stamp="custom">
                        <div class="stamp-preview stamp-custom">+ CUSTOM</div>
                    </div>
                </div>
            </div>
            
            <!-- Custom Stamp Section -->
            <div class="custom-stamp-section" id="customStampSection" style="display:none;">
                <div class="panel-row">
                    <label>Stamp Text:</label>
                    <input type="text" id="customStampText" placeholder="Enter text..." maxlength="25">
                </div>
                
                <div class="panel-row">
                    <label>Add Date:</label>
                    <div style="display:flex; gap:10px; align-items:center;">
                        <input type="checkbox" id="customStampAddDate" style="width:auto;">
                        <span style="font-size:13px; color:var(--text-secondary);">${dateStr}</span>
                    </div>
                </div>
                
                <div class="panel-row">
                    <label>Shape:</label>
                    <div class="stamp-shape-options">
                        <button class="stamp-shape-btn active" data-shape="rect">▢ Rectangle</button>
                        <button class="stamp-shape-btn" data-shape="rounded">▢ Rounded</button>
                        <button class="stamp-shape-btn" data-shape="circle">○ Oval</button>
                    </div>
                </div>
                
                <div class="panel-row">
                    <label>Style:</label>
                    <div style="display:flex; gap:15px; flex-wrap:wrap; align-items:center;">
                        <div class="signature-control-group">
                            <label>Color:</label>
                            <input type="color" id="customStampColor" value="#ef4444">
                        </div>
                        <div class="signature-control-group">
                            <label>Rotation:</label>
                            <input type="range" id="customStampRotation" min="-30" max="30" value="-15" style="width:80px;">
                            <span id="customStampRotationValue">-15°</span>
                        </div>
                    </div>
                </div>
                
                <div class="panel-row">
                    <label>Preview:</label>
                    <div class="custom-stamp-preview" id="customStampPreview">
                        <span class="custom-stamp-text" id="customStampPreviewText" style="color:#ef4444; transform:rotate(-15deg);">YOUR TEXT</span>
                    </div>
                </div>
            </div>
            
            <!-- Opacity -->
            <div class="style-row">
                <div class="style-item">
                    <label>Opacity:</label>
                    <input type="range" id="stampOpacity" min="30" max="100" value="85">
                    <span id="stampOpacityValue">85%</span>
                </div>
            </div>
        </div>
        <div class="panel-footer">
            <button class="btn btn-sm" id="cancelStamp">Cancel</button>
            <button class="btn btn-sm btn-primary" id="applyStamp">✓ Add Stamp</button>
        </div>
    `;
    
    overlay.appendChild(panel);
    document.body.appendChild(overlay);
    
    let selectedStamp = null;
    let selectedShape = 'rect';
    
    // Stamp selection
    panel.querySelectorAll('.stamp-item').forEach(item => {
        item.addEventListener('click', () => {
            panel.querySelectorAll('.stamp-item').forEach(i => i.classList.remove('selected'));
            item.classList.add('selected');
            selectedStamp = item.dataset.stamp;
            
            // Show/hide custom section
            document.getElementById('customStampSection').style.display = 
                selectedStamp === 'custom' ? 'block' : 'none';
        });
    });
    
    // Shape selection
    panel.querySelectorAll('.stamp-shape-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            panel.querySelectorAll('.stamp-shape-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            selectedShape = btn.dataset.shape;
            updateCustomPreview();
        });
    });
    
    // Custom stamp preview
    const customText = document.getElementById('customStampText');
    const customColor = document.getElementById('customStampColor');
    const customRotation = document.getElementById('customStampRotation');
    const rotationValue = document.getElementById('customStampRotationValue');
    const addDate = document.getElementById('customStampAddDate');
    const previewText = document.getElementById('customStampPreviewText');
    
    const updateCustomPreview = () => {
        let text = customText.value.toUpperCase() || 'YOUR TEXT';
        if (addDate.checked) {
            text += `\n${dateStr}`;
        }
        
        const color = customColor.value;
        const rotation = customRotation.value;
        
        previewText.textContent = text;
        previewText.style.color = color;
        previewText.style.borderColor = color;
        previewText.style.transform = `rotate(${rotation}deg)`;
        previewText.style.whiteSpace = 'pre-line';
        
        // Shape styling
        if (selectedShape === 'rounded') {
            previewText.style.borderRadius = '10px';
        } else if (selectedShape === 'circle') {
            previewText.style.borderRadius = '50%';
            previewText.style.padding = '15px 25px';
        } else {
            previewText.style.borderRadius = '2px';
        }
        
        rotationValue.textContent = `${rotation}°`;
    };
    
    customText.addEventListener('input', updateCustomPreview);
    customColor.addEventListener('input', updateCustomPreview);
    customRotation.addEventListener('input', updateCustomPreview);
    addDate.addEventListener('change', updateCustomPreview);
    
    // Opacity
    const opacitySlider = document.getElementById('stampOpacity');
    const opacityValue = document.getElementById('stampOpacityValue');
    opacitySlider.addEventListener('input', () => {
        opacityValue.textContent = `${opacitySlider.value}%`;
    });
    
    // Close
    const closePanel = () => {
        overlay.remove();
        this.setTool('select');
    };
    
    document.getElementById('closeStampPanel').addEventListener('click', closePanel);
    document.getElementById('cancelStamp').addEventListener('click', closePanel);
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) closePanel();
    });
    
    // Apply
    document.getElementById('applyStamp').addEventListener('click', () => {
        if (!selectedStamp) {
            Toast.warning('Please select a stamp');
            return;
        }
        
        const opacity = parseInt(opacitySlider.value) / 100;
        
        if (selectedStamp === 'custom') {
            const text = customText.value.trim();
            if (!text) {
                Toast.warning('Please enter stamp text');
                return;
            }
            
            let displayText = text.toUpperCase();
            if (addDate.checked) {
                displayText += `\n${dateStr}`;
            }
            
            this.createStampOnCanvas(
                displayText,
                customColor.value,
                parseInt(customRotation.value),
                opacity,
                selectedShape
            );
        } else {
            this.createPresetStamp(selectedStamp, opacity, dateStr);
        }
        
        closePanel();
    });
};

/**
 * Create preset stamp
 */
Editor.createPresetStamp = function(type, opacity, dateStr) {
    const stamps = {
        approved: { text: '✓ APPROVED', color: '#22c55e' },
        rejected: { text: '✗ REJECTED', color: '#ef4444' },
        draft: { text: 'DRAFT', color: '#f59e0b' },
        confidential: { text: '🔒 CONFIDENTIAL', color: '#8b5cf6' },
        date: { text: `📅 ${dateStr}`, color: '#3b82f6' }
    };
    
    const stamp = stamps[type];
    if (!stamp) return;
    
    this.createStampOnCanvas(stamp.text, stamp.color, -12, opacity, 'rounded');
};

/**
 * Create stamp on canvas
 * FIX: Text properly centered
 */
Editor.createStampOnCanvas = function(text, color, rotation, opacity, shape = 'rect') {
    if (!this.canvas) return;
    
    // Create text
    const stampText = new fabric.Text(text, {
        fontFamily: 'Arial',
        fontSize: 18,
        fontWeight: 'bold',
        fill: color,
        textAlign: 'center',
        originX: 'center',
        originY: 'center'
    });
    
    // Calculate dimensions
    const padding = 15;
    const borderWidth = 3;
    const width = stampText.width + padding * 2;
    const height = stampText.height + padding * 2;
    
    // Create border based on shape
    let border;
    
    if (shape === 'circle') {
        const radius = Math.max(width, height) / 2 + 5;
        border = new fabric.Ellipse({
            rx: radius,
            ry: radius * 0.7,
            fill: 'transparent',
            stroke: color,
            strokeWidth: borderWidth,
            originX: 'center',
            originY: 'center'
        });
    } else if (shape === 'rounded') {
        border = new fabric.Rect({
            width: width,
            height: height,
            fill: 'transparent',
            stroke: color,
            strokeWidth: borderWidth,
            rx: 10,
            ry: 10,
            originX: 'center',
            originY: 'center'
        });
    } else {
        border = new fabric.Rect({
            width: width,
            height: height,
            fill: 'transparent',
            stroke: color,
            strokeWidth: borderWidth,
            originX: 'center',
            originY: 'center'
        });
    }
    
    // Center text in border - FIX
    stampText.set({
        left: 0,
        top: 0
    });
    
    border.set({
        left: 0,
        top: 0
    });
    
    // Group elements
    const stampGroup = new fabric.Group([border, stampText], {
        left: this.canvas.width / 2,
        top: this.canvas.height / 2,
        originX: 'center',
        originY: 'center',
        angle: rotation,
        opacity: opacity,
        selectable: true,
        hasControls: true
    });
    
    this.canvas.add(stampGroup);
    this.canvas.setActiveObject(stampGroup);
    this.saveState();
    
    Toast.success('Stamp added');
    this.setTool('select');
};

// ==========================================
// SAVE PDF
// ==========================================

/**
 * Save PDF with annotations
 */
Editor.savePDF = async function() {
    if (!this.canvas || !this.pdfDoc) {
        Toast.error('No PDF loaded');
        return;
    }
    
    // Close panels first
    this.closeAllPanels();
    
    // Exit text editing
    this.isTyping = false;
    if (this.canvas.getActiveObject()) {
        const obj = this.canvas.getActiveObject();
        if (obj.type === 'i-text' && obj.isEditing) {
            obj.exitEditing();
        }
    }
    this.canvas.discardActiveObject();
    this.canvas.renderAll();
    
    // Open save modal
    this.openSaveModal();
};

/**
 * Open save modal
 */
Editor.openSaveModal = function() {
    this.addPanelStyles();
    
    const overlay = document.createElement('div');
    overlay.className = 'panel-overlay';
    overlay.id = 'saveOverlay';
    
    const panel = document.createElement('div');
    panel.className = 'editor-panel';
    panel.id = 'savePanel';
    panel.style.minWidth = '320px';
    
    panel.innerHTML = `
        <div class="panel-header">
            <span>💾 Save PDF</span>
            <button class="panel-close" id="closeSavePanel">&times;</button>
        </div>
        <div class="panel-body">
            <div class="panel-row">
                <label>File Name:</label>
                <input type="text" id="saveFilename" value="edited_document.pdf" placeholder="filename.pdf">
            </div>
            <div class="panel-row">
                <label style="display:flex; align-items:center; gap:8px; cursor:pointer;">
                    <input type="checkbox" id="saveAddPageNumbers" style="width:auto;">
                    <span>Add page numbers</span>
                </label>
            </div>
            <div class="panel-row" style="background:var(--bg-secondary); padding:12px; border-radius:2px;">
                <div style="font-size:13px; color:var(--text-secondary);">
                    <div>📄 Pages: <strong>${this.totalPages}</strong></div>
                </div>
            </div>
        </div>
        <div class="panel-footer">
            <button class="btn btn-sm" id="cancelSave">Cancel</button>
            <button class="btn btn-sm btn-success" id="confirmSave">💾 Save PDF</button>
        </div>
    `;
    
    overlay.appendChild(panel);
    document.body.appendChild(overlay);
    
    // Focus filename input
    setTimeout(() => {
        const input = document.getElementById('saveFilename');
        input.focus();
        input.select();
    }, 100);
    
    // Close
    const closeModal = () => {
        overlay.remove();
    };
    
    document.getElementById('closeSavePanel').addEventListener('click', closeModal);
    document.getElementById('cancelSave').addEventListener('click', closeModal);
    overlay.addEventListener('click', (e) => {
        if (e.target === overlay) closeModal();
    });
    
    // Save
    document.getElementById('confirmSave').addEventListener('click', async () => {
        const filename = document.getElementById('saveFilename').value.trim() || 'edited.pdf';
        const addPageNumbers = document.getElementById('saveAddPageNumbers').checked;
        
        closeModal();
        
        Toast.info(Lang.get('progress.saving'));
        
        try {
            await this.generateFinalPDF(filename, addPageNumbers);
            Toast.success(Lang.get('success.saved'));
            PlanManager.useFreeTrial();
        } catch (error) {
            console.error('Save error:', error);
            Toast.error(Lang.get('error.processingFailed'));
        }
    });
};

/**
 * Generate final PDF
 */
Editor.generateFinalPDF = async function(filename, addPageNumbers) {
    const { PDFDocument, rgb } = PDFLib;
    
    // Save current page
    this.pageObjects[this.currentPage - 1] = this.canvas.toJSON().objects;
    
    // Create new PDF
    const newPdf = await PDFDocument.create();
    
    for (let i = 0; i < this.totalPages; i++) {
        const pageNum = i + 1;
        
        // Render page
        await this.goToPage(pageNum);
        await Utils.sleep(150);
        
        // Deselect all
        this.canvas.discardActiveObject();
        this.canvas.renderAll();
        
        // Export canvas
        const dataUrl = this.canvas.toDataURL({
            format: 'png',
            quality: 1.0,
            multiplier: 1
        });
        
        // Convert to bytes
        const base64 = dataUrl.split(',')[1];
        const imageBytes = Uint8Array.from(atob(base64), c => c.charCodeAt(0));
        
        // Embed image
        const image = await newPdf.embedPng(imageBytes);
        
        // Calculate page size
        const pageWidth = image.width / this.scale;
        const pageHeight = image.height / this.scale;
        
        // Add page
        const page = newPdf.addPage([pageWidth, pageHeight]);
        
        // Draw image
        page.drawImage(image, {
            x: 0,
            y: 0,
            width: pageWidth,
            height: pageHeight
        });
        
        // Add page number
        if (addPageNumbers) {
            page.drawText(`${pageNum} / ${this.totalPages}`, {
                x: pageWidth / 2 - 20,
                y: 15,
                size: 10,
                color: rgb(0.4, 0.4, 0.4)
            });
        }
    }
    
    // Save
    const pdfBytes = await newPdf.save();
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    
    // Add .pdf extension if missing
    if (!filename.toLowerCase().endsWith('.pdf')) {
        filename += '.pdf';
    }
    
    Utils.downloadBlob(blob, filename);
};

// ==========================================
// CLOSE ALL PANELS (OVERRIDE)
// ==========================================
Editor.closeAllPanels = function() {
    document.querySelectorAll('.panel-overlay').forEach(el => el.remove());
    document.querySelectorAll('.editor-panel').forEach(el => el.remove());
    this._signatureUploadData = null;
    this._signatureDrawCanvas = null;
};
window.Editor = Editor;
