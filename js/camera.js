// ============================================
// PDF CONVERTER PRO - CAMERA.JS
// Kamera ve Görüntü Yakalama Modülü
// ============================================

const CameraModule = {
    stream: null,
    videoElement: null,
    canvasElement: null,
    ctx: null,
    capturedImages: [],
    currentCamera: 'environment', // 'user' veya 'environment'
    isActive: false,
    flashMode: false,

    // ============================================
    // INITIALIZATION
    // ============================================
    init() {
        this.createCameraUI();
        this.bindEvents();
        console.log('✅ Camera Module initialized');
    },

    createCameraUI() {
        const cameraHTML = `
        <div id="camera-overlay" class="camera-overlay hidden">
            <div class="camera-container">
                <!-- Header -->
                <div class="camera-header">
                    <h3>📷 Kamera ile PDF Oluştur</h3>
                    <button id="closeCameraBtn" class="camera-close-btn">✕</button>
                </div>

                <!-- Main Content -->
                <div class="camera-content">
                    <!-- Left: Camera View -->
                    <div class="camera-view-section">
                        <div class="camera-preview-wrapper">
                            <video id="cameraVideo" autoplay playsinline></video>
                            <canvas id="cameraCanvas" style="display:none;"></canvas>
                            
                            <!-- Camera overlay guides -->
                            <div class="camera-guides">
                                <div class="guide-corner top-left"></div>
                                <div class="guide-corner top-right"></div>
                                <div class="guide-corner bottom-left"></div>
                                <div class="guide-corner bottom-right"></div>
                            </div>

                            <!-- Flash overlay -->
                            <div id="flashOverlay" class="flash-overlay"></div>
                        </div>

                        <!-- Camera Controls -->
                        <div class="camera-controls">
                            <button id="switchCameraBtn" class="cam-ctrl-btn" title="Kamera Değiştir">
                                🔄
                            </button>
                            <button id="captureBtn" class="cam-capture-btn" title="Fotoğraf Çek">
                                📸
                            </button>
                            <button id="flashBtn" class="cam-ctrl-btn" title="Flaş">
                                ⚡
                            </button>
                        </div>

                        <!-- Alternative: File Upload -->
                        <div class="file-upload-section">
                            <p>veya</p>
                            <label class="file-upload-btn">
                                📁 Dosyadan Resim Seç
                                <input type="file" id="imageFileInput" accept="image/*" multiple hidden>
                            </label>
                        </div>
                    </div>

                    <!-- Right: Captured Images -->
                    <div class="captured-images-section">
                        <div class="section-header">
                            <h4>📄 Yakalanan Görüntüler</h4>
                            <span id="imageCount" class="image-count">0 sayfa</span>
                        </div>

                        <div id="capturedImagesList" class="captured-images-list">
                            <div class="empty-state">
                                <span>📷</span>
                                <p>Henüz görüntü yok</p>
                                <p class="hint">Fotoğraf çekin veya dosya yükleyin</p>
                            </div>
                        </div>

                        <!-- Image Actions -->
                        <div class="image-actions">
                            <button id="clearAllImagesBtn" class="action-btn danger" disabled>
                                🗑️ Tümünü Temizle
                            </button>
                            <button id="createPdfFromImagesBtn" class="action-btn success" disabled>
                                📄 PDF Oluştur
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Image Preview Modal -->
                <div id="imagePreviewModal" class="image-preview-modal hidden">
                    <div class="preview-content">
                        <div class="preview-header">
                            <span id="previewTitle">Görüntü Önizleme</span>
                            <button id="closePreviewBtn" class="preview-close">✕</button>
                        </div>
                        <div class="preview-body">
                            <img id="previewImage" src="" alt="Preview">
                        </div>
                        <div class="preview-actions">
                            <button id="rotateLeftBtn" class="preview-btn">↺ Sola Döndür</button>
                            <button id="rotateRightBtn" class="preview-btn">↻ Sağa Döndür</button>
                            <button id="deleteImageBtn" class="preview-btn danger">🗑️ Sil</button>
                            <button id="confirmImageBtn" class="preview-btn success">✓ Tamam</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>`;

        document.body.insertAdjacentHTML('beforeend', cameraHTML);
        this.addCameraStyles();
    },

    addCameraStyles() {
        const styles = `
        <style id="camera-styles">
        /* Camera Overlay */
        .camera-overlay {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: #0a0a0f;
            z-index: 9999;
            display: flex;
            flex-direction: column;
        }
        .camera-overlay.hidden { display: none; }

        .camera-container {
            display: flex;
            flex-direction: column;
            height: 100%;
            width: 100%;
            max-width: 1400px;
            margin: 0 auto;
        }

        /* Header */
        .camera-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 15px 20px;
            background: #0d1525;
            border-bottom: 1px solid #1e3a5f;
        }
        .camera-header h3 {
            color: #e0e0e0;
            margin: 0;
            font-size: 18px;
        }
        .camera-close-btn {
            background: #151f30;
            border: 1px solid #1e3a5f;
            color: #e0e0e0;
            width: 40px;
            height: 40px;
            border-radius: 2px;
            font-size: 20px;
            cursor: pointer;
            transition: all 0.2s;
        }
        .camera-close-btn:hover {
            background: #7f1d1d;
            border-color: #dc2626;
        }

        /* Main Content */
        .camera-content {
            display: flex;
            flex: 1;
            overflow: hidden;
            gap: 20px;
            padding: 20px;
        }

        /* Camera View Section */
        .camera-view-section {
            flex: 1;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 20px;
        }

        .camera-preview-wrapper {
            position: relative;
            width: 100%;
            max-width: 640px;
            background: #000;
            border-radius: 2px;
            overflow: hidden;
            border: 2px solid #1e3a5f;
        }

        #cameraVideo {
            width: 100%;
            height: auto;
            display: block;
            /* FIX: Negatif görüntü sorununu düzelt */
            transform: none;
            filter: none;
            -webkit-filter: none;
        }

        /* Camera Guides */
        .camera-guides {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            pointer-events: none;
        }
        .guide-corner {
            position: absolute;
            width: 30px;
            height: 30px;
            border: 3px solid rgba(59, 130, 246, 0.7);
        }
        .guide-corner.top-left {
            top: 20px; left: 20px;
            border-right: none; border-bottom: none;
        }
        .guide-corner.top-right {
            top: 20px; right: 20px;
            border-left: none; border-bottom: none;
        }
        .guide-corner.bottom-left {
            bottom: 20px; left: 20px;
            border-right: none; border-top: none;
        }
        .guide-corner.bottom-right {
            bottom: 20px; right: 20px;
            border-left: none; border-top: none;
        }

        /* Flash Overlay */
        .flash-overlay {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: white;
            opacity: 0;
            pointer-events: none;
            transition: opacity 0.1s;
        }
        .flash-overlay.flash {
            opacity: 1;
        }

        /* Camera Controls */
        .camera-controls {
            display: flex;
            align-items: center;
            gap: 20px;
        }

        .cam-ctrl-btn {
            width: 50px;
            height: 50px;
            border-radius: 50%;
            background: #151f30;
            border: 2px solid #1e3a5f;
            color: #e0e0e0;
            font-size: 20px;
            cursor: pointer;
            transition: all 0.2s;
        }
        .cam-ctrl-btn:hover {
            background: #1e3a5f;
            box-shadow: 0 0 15px rgba(59, 130, 246, 0.5);
        }
        .cam-ctrl-btn.active {
            background: #2563eb;
            border-color: #3b82f6;
        }

        .cam-capture-btn {
            width: 70px;
            height: 70px;
            border-radius: 50%;
            background: linear-gradient(145deg, #dc2626, #b91c1c);
            border: 4px solid #fff;
            color: white;
            font-size: 28px;
            cursor: pointer;
            transition: all 0.2s;
            box-shadow: 0 4px 15px rgba(220, 38, 38, 0.4);
        }
        .cam-capture-btn:hover {
            transform: scale(1.1);
            box-shadow: 0 6px 25px rgba(220, 38, 38, 0.6);
        }
        .cam-capture-btn:active {
            transform: scale(0.95);
        }

        /* File Upload Section */
        .file-upload-section {
            text-align: center;
            padding: 15px;
            border-top: 1px solid #1e3a5f;
            width: 100%;
            max-width: 640px;
        }
        .file-upload-section p {
            color: #8892a0;
            margin-bottom: 10px;
        }
        .file-upload-btn {
            display: inline-block;
            background: #151f30;
            border: 1px solid #1e3a5f;
            color: #e0e0e0;
            padding: 12px 25px;
            border-radius: 2px;
            cursor: pointer;
            transition: all 0.2s;
        }
        .file-upload-btn:hover {
            background: #1e3a5f;
            box-shadow: 0 0 10px rgba(59, 130, 246, 0.5);
        }

        /* Captured Images Section */
        .captured-images-section {
            width: 350px;
            background: #0d1525;
            border: 1px solid #1e3a5f;
            border-radius: 2px;
            display: flex;
            flex-direction: column;
        }

        .section-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 15px;
            border-bottom: 1px solid #1e3a5f;
        }
        .section-header h4 {
            color: #e0e0e0;
            margin: 0;
            font-size: 14px;
        }
        .image-count {
            background: #2563eb;
            color: white;
            padding: 3px 10px;
            border-radius: 2px;
            font-size: 12px;
        }

        .captured-images-list {
            flex: 1;
            overflow-y: auto;
            padding: 10px;
            display: flex;
            flex-direction: column;
            gap: 10px;
        }

        .empty-state {
            text-align: center;
            padding: 40px 20px;
            color: #8892a0;
        }
        .empty-state span {
            font-size: 48px;
            display: block;
            margin-bottom: 15px;
            opacity: 0.5;
        }
        .empty-state .hint {
            font-size: 12px;
            opacity: 0.7;
        }

        /* Captured Image Item */
        .captured-image-item {
            display: flex;
            align-items: center;
            gap: 10px;
            background: #151f30;
            border: 1px solid #1e3a5f;
            border-radius: 2px;
            padding: 8px;
            cursor: pointer;
            transition: all 0.2s;
        }
        .captured-image-item:hover {
            border-color: #3b82f6;
            box-shadow: 0 0 10px rgba(59, 130, 246, 0.3);
        }
        .captured-image-item.dragging {
            opacity: 0.5;
            border-style: dashed;
        }

        .captured-image-thumb {
            width: 60px;
            height: 80px;
            object-fit: cover;
            border-radius: 2px;
            background: #0a0a0f;
        }

        .captured-image-info {
            flex: 1;
        }
        .captured-image-info .page-num {
            color: #e0e0e0;
            font-weight: 500;
            font-size: 14px;
        }
        .captured-image-info .page-size {
            color: #8892a0;
            font-size: 11px;
        }

        .captured-image-actions {
            display: flex;
            flex-direction: column;
            gap: 5px;
        }
        .img-action-btn {
            width: 30px;
            height: 30px;
            background: #0d1525;
            border: 1px solid #1e3a5f;
            border-radius: 2px;
            color: #8892a0;
            cursor: pointer;
            transition: all 0.2s;
            font-size: 14px;
        }
        .img-action-btn:hover {
            background: #1e3a5f;
            color: #e0e0e0;
        }
        .img-action-btn.delete:hover {
            background: #7f1d1d;
            border-color: #dc2626;
            color: #fca5a5;
        }

        /* Image Actions Footer */
        .image-actions {
            display: flex;
            gap: 10px;
            padding: 15px;
            border-top: 1px solid #1e3a5f;
        }
        .action-btn {
            flex: 1;
            padding: 12px;
            border: 1px solid #1e3a5f;
            border-radius: 2px;
            cursor: pointer;
            font-size: 13px;
            transition: all 0.2s;
        }
        .action-btn:disabled {
            opacity: 0.5;
            cursor: not-allowed;
        }
        .action-btn.danger {
            background: #151f30;
            color: #f87171;
        }
        .action-btn.danger:hover:not(:disabled) {
            background: #7f1d1d;
            border-color: #dc2626;
        }
        .action-btn.success {
            background: #065f46;
            border-color: #10b981;
            color: white;
        }
        .action-btn.success:hover:not(:disabled) {
            background: #047857;
            box-shadow: 0 0 10px rgba(16, 185, 129, 0.5);
        }

        /* Image Preview Modal */
        .image-preview-modal {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.9);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10001;
        }
        .image-preview-modal.hidden { display: none; }

        .preview-content {
            background: #0d1525;
            border: 1px solid #1e3a5f;
            border-radius: 2px;
            max-width: 90%;
            max-height: 90%;
            display: flex;
            flex-direction: column;
        }

        .preview-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 15px;
            border-bottom: 1px solid #1e3a5f;
            color: #e0e0e0;
        }
        .preview-close {
            background: none;
            border: none;
            color: #8892a0;
            font-size: 24px;
            cursor: pointer;
        }
        .preview-close:hover { color: #dc2626; }

        .preview-body {
            padding: 20px;
            overflow: auto;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        #previewImage {
            max-width: 100%;
            max-height: 60vh;
            border-radius: 2px;
        }

        .preview-actions {
            display: flex;
            gap: 10px;
            padding: 15px;
            border-top: 1px solid #1e3a5f;
            justify-content: center;
        }
        .preview-btn {
            padding: 10px 20px;
            background: #151f30;
            border: 1px solid #1e3a5f;
            border-radius: 2px;
            color: #e0e0e0;
            cursor: pointer;
            transition: all 0.2s;
        }
        .preview-btn:hover {
            background: #1e3a5f;
        }
        .preview-btn.danger:hover {
            background: #7f1d1d;
            border-color: #dc2626;
        }
        .preview-btn.success {
            background: #065f46;
            border-color: #10b981;
        }
        .preview-btn.success:hover {
            background: #047857;
        }

        /* Responsive */
        @media (max-width: 900px) {
            .camera-content {
                flex-direction: column;
            }
            .captured-images-section {
                width: 100%;
                max-height: 250px;
            }
            .captured-images-list {
                flex-direction: row;
                flex-wrap: wrap;
            }
            .captured-image-item {
                width: calc(50% - 5px);
            }
        }

        @media (max-width: 500px) {
            .camera-controls {
                gap: 15px;
            }
            .cam-capture-btn {
                width: 60px;
                height: 60px;
                font-size: 24px;
            }
            .cam-ctrl-btn {
                width: 44px;
                height: 44px;
            }
        }
        </style>`;
        document.head.insertAdjacentHTML('beforeend', styles);
    },

    // ============================================
    // EVENT BINDINGS
    // ============================================
    bindEvents() {
        // Close camera
        document.getElementById('closeCameraBtn')?.addEventListener('click', () => this.close());

        // Camera controls
        document.getElementById('captureBtn')?.addEventListener('click', () => this.captureImage());
        document.getElementById('switchCameraBtn')?.addEventListener('click', () => this.switchCamera());
        document.getElementById('flashBtn')?.addEventListener('click', () => this.toggleFlash());

        // File input
        document.getElementById('imageFileInput')?.addEventListener('change', (e) => this.handleFileSelect(e));

        // Image actions
        document.getElementById('clearAllImagesBtn')?.addEventListener('click', () => this.clearAllImages());
        document.getElementById('createPdfFromImagesBtn')?.addEventListener('click', () => this.createPDF());

        // Preview modal
        document.getElementById('closePreviewBtn')?.addEventListener('click', () => this.closePreview());
        document.getElementById('rotateLeftBtn')?.addEventListener('click', () => this.rotateImage(-90));
        document.getElementById('rotateRightBtn')?.addEventListener('click', () => this.rotateImage(90));
        document.getElementById('deleteImageBtn')?.addEventListener('click', () => this.deleteCurrentImage());
        document.getElementById('confirmImageBtn')?.addEventListener('click', () => this.closePreview());
    },

    // ============================================
    // CAMERA OPERATIONS
    // ============================================
    async startCamera() {
        try {
            // Stop existing stream
            this.stopCamera();

            const constraints = {
                video: {
                    facingMode: this.currentCamera,
                    width: { ideal: 1920 },
                    height: { ideal: 1080 }
                },
                audio: false
            };

            this.stream = await navigator.mediaDevices.getUserMedia(constraints);
            
            this.videoElement = document.getElementById('cameraVideo');
            this.canvasElement = document.getElementById('cameraCanvas');
            this.ctx = this.canvasElement.getContext('2d');

            // FIX: Negatif görüntü sorununu düzelt
            // willReadFrequently: true ile context oluştur
            this.ctx = this.canvasElement.getContext('2d', { willReadFrequently: true });

            this.videoElement.srcObject = this.stream;
            
            // Video metadata yüklendiğinde canvas boyutunu ayarla
            this.videoElement.onloadedmetadata = () => {
                this.canvasElement.width = this.videoElement.videoWidth;
                this.canvasElement.height = this.videoElement.videoHeight;
            };

            this.isActive = true;
            console.log('✅ Kamera başlatıldı');

        } catch (error) {
            console.error('Kamera hatası:', error);
            this.handleCameraError(error);
        }
    },

    stopCamera() {
        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
            this.stream = null;
        }
        if (this.videoElement) {
            this.videoElement.srcObject = null;
        }
        this.isActive = false;
    },

    switchCamera() {
        this.currentCamera = this.currentCamera === 'environment' ? 'user' : 'environment';
        this.startCamera();
    },

    toggleFlash() {
        const flashBtn = document.getElementById('flashBtn');
        this.flashMode = !this.flashMode;
        flashBtn.classList.toggle('active', this.flashMode);

        // Torch modu (destekleniyorsa)
        if (this.stream) {
            const track = this.stream.getVideoTracks()[0];
            const capabilities = track.getCapabilities();
            
            if (capabilities.torch) {
                track.applyConstraints({
                    advanced: [{ torch: this.flashMode }]
                });
            }
        }
    },

    handleCameraError(error) {
        let message = 'Kamera açılamadı. ';
        
        switch (error.name) {
            case 'NotAllowedError':
                message += 'Lütfen kamera iznini verin.';
                break;
            case 'NotFoundError':
                message += 'Kamera bulunamadı.';
                break;
            case 'NotReadableError':
                message += 'Kamera başka bir uygulama tarafından kullanılıyor.';
                break;
            default:
                message += error.message;
        }
        
        alert(message);
    },

    // ============================================
    // IMAGE CAPTURE
    // ============================================
    captureImage() {
        if (!this.videoElement || !this.ctx) return;

        // Flash efekti
        const flashOverlay = document.getElementById('flashOverlay');
        flashOverlay.classList.add('flash');
        setTimeout(() => flashOverlay.classList.remove('flash'), 150);

        // Canvas'a video frame çiz
        this.canvasElement.width = this.videoElement.videoWidth;
        this.canvasElement.height = this.videoElement.videoHeight;
        
        // FIX: Normal çizim - negatif olmadan
        this.ctx.drawImage(this.videoElement, 0, 0);

        // FIX: Görüntü verisini doğru şekilde al
        const imageData = this.canvasElement.toDataURL('image/jpeg', 0.92);
        
        // Görüntüyü listeye ekle
        this.addCapturedImage(imageData);

        // Vibration feedback (mobil)
        if (navigator.vibrate) {
            navigator.vibrate(50);
        }
    },

    // ============================================
    // FILE HANDLING
    // ============================================
    handleFileSelect(event) {
        const files = event.target.files;
        if (!files.length) return;

        Array.from(files).forEach(file => {
            if (!file.type.startsWith('image/')) return;

            const reader = new FileReader();
            reader.onload = (e) => {
                // FIX: Görüntüyü doğru şekilde yükle - negatif olmadan
                const img = new Image();
                img.onload = () => {
                    // Canvas oluştur ve görüntüyü çiz
                    const canvas = document.createElement('canvas');
                    canvas.width = img.width;
                    canvas.height = img.height;
                    
                    const ctx = canvas.getContext('2d');
                    
                    // Normal çizim - filtre yok
                    ctx.drawImage(img, 0, 0);
                    
                    // JPEG olarak kaydet
                    const imageData = canvas.toDataURL('image/jpeg', 0.92);
                    this.addCapturedImage(imageData, file.name);
                };
                img.src = e.target.result;
            };
            reader.readAsDataURL(file);
        });

        // Input'u temizle (aynı dosyayı tekrar seçebilmek için)
        event.target.value = '';
    },

    // ============================================
    // IMAGE MANAGEMENT
    // ============================================
    addCapturedImage(imageData, fileName = null) {
        const id = Date.now() + Math.random().toString(36).substr(2, 9);
        
        const imageObj = {
            id: id,
            data: imageData,
            rotation: 0,
            name: fileName || `Sayfa ${this.capturedImages.length + 1}`
        };

        this.capturedImages.push(imageObj);
        this.renderImagesList();
        this.updateButtonStates();
    },

    renderImagesList() {
        const listContainer = document.getElementById('capturedImagesList');
        const imageCount = document.getElementById('imageCount');

        if (this.capturedImages.length === 0) {
            listContainer.innerHTML = `
                <div class="empty-state">
                    <span>📷</span>
                    <p>Henüz görüntü yok</p>
                    <p class="hint">Fotoğraf çekin veya dosya yükleyin</p>
                </div>`;
            imageCount.textContent = '0 sayfa';
            return;
        }

        imageCount.textContent = `${this.capturedImages.length} sayfa`;

        listContainer.innerHTML = this.capturedImages.map((img, index) => `
            <div class="captured-image-item" 
                 data-id="${img.id}" 
                 draggable="true">
                <img src="${img.data}" 
                     alt="Sayfa ${index + 1}" 
                     class="captured-image-thumb"
                     style="transform: rotate(${img.rotation}deg)">
                <div class="captured-image-info">
                    <div class="page-num">Sayfa ${index + 1}</div>
                    <div class="page-size">${img.name}</div>
                </div>
                <div class="captured-image-actions">
                    <button class="img-action-btn preview" data-id="${img.id}" title="Önizle">👁️</button>
                    <button class="img-action-btn delete" data-id="${img.id}" title="Sil">🗑️</button>
                </div>
            </div>
        `).join('');

        // Event listeners ekle
        this.bindImageItemEvents();
    },

    bindImageItemEvents() {
        // Preview buttons
        document.querySelectorAll('.img-action-btn.preview').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.openPreview(btn.dataset.id);
            });
        });

        // Delete buttons
        document.querySelectorAll('.img-action-btn.delete').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.deleteImage(btn.dataset.id);
            });
        });

        // Drag & drop sıralama
        const items = document.querySelectorAll('.captured-image-item');
        items.forEach(item => {
            item.addEventListener('dragstart', (e) => this.handleDragStart(e));
            item.addEventListener('dragover', (e) => this.handleDragOver(e));
            item.addEventListener('drop', (e) => this.handleDrop(e));
            item.addEventListener('dragend', (e) => this.handleDragEnd(e));
        });
    },

    // Drag & Drop
    handleDragStart(e) {
        e.target.classList.add('dragging');
        e.dataTransfer.setData('text/plain', e.target.dataset.id);
    },

    handleDragOver(e) {
        e.preventDefault();
    },

    handleDrop(e) {
        e.preventDefault();
        const draggedId = e.dataTransfer.getData('text/plain');
        const targetId = e.target.closest('.captured-image-item')?.dataset.id;

        if (draggedId && targetId && draggedId !== targetId) {
            const draggedIndex = this.capturedImages.findIndex(img => img.id === draggedId);
            const targetIndex = this.capturedImages.findIndex(img => img.id === targetId);

            // Swap
            const temp = this.capturedImages[draggedIndex];
            this.capturedImages.splice(draggedIndex, 1);
            this.capturedImages.splice(targetIndex, 0, temp);

            this.renderImagesList();
        }
    },

    handleDragEnd(e) {
        e.target.classList.remove('dragging');
    },

    // ============================================
    // PREVIEW
    // ============================================
    openPreview(imageId) {
        const image = this.capturedImages.find(img => img.id === imageId);
        if (!image) return;

        this.currentPreviewId = imageId;
        
        const modal = document.getElementById('imagePreviewModal');
        const previewImg = document.getElementById('previewImage');
        
        previewImg.src = image.data;
        previewImg.style.transform = `rotate(${image.rotation}deg)`;
        
        modal.classList.remove('hidden');
    },

    closePreview() {
        document.getElementById('imagePreviewModal').classList.add('hidden');
        this.currentPreviewId = null;
    },

    rotateImage(degrees) {
        if (!this.currentPreviewId) return;

        const image = this.capturedImages.find(img => img.id === this.currentPreviewId);
        if (!image) return;

        image.rotation = (image.rotation + degrees) % 360;
        
        const previewImg = document.getElementById('previewImage');
        previewImg.style.transform = `rotate(${image.rotation}deg)`;

        // Listeyi güncelle
        this.renderImagesList();
    },

    deleteImage(imageId) {
        const index = this.capturedImages.findIndex(img => img.id === imageId);
        if (index === -1) return;

        this.capturedImages.splice(index, 1);
        this.renderImagesList();
        this.updateButtonStates();
    },

    deleteCurrentImage() {
        if (this.currentPreviewId) {
            this.deleteImage(this.currentPreviewId);
            this.closePreview();
        }
    },

    clearAllImages() {
        if (!confirm('Tüm görüntüler silinecek. Emin misiniz?')) return;
        
        this.capturedImages = [];
        this.renderImagesList();
        this.updateButtonStates();
    },

    updateButtonStates() {
        const hasImages = this.capturedImages.length > 0;
        document.getElementById('clearAllImagesBtn').disabled = !hasImages;
        document.getElementById('createPdfFromImagesBtn').disabled = !hasImages;
    },

    // ============================================
    // PDF CREATION
    // ============================================
    async createPDF() {
        if (this.capturedImages.length === 0) {
            alert('PDF oluşturmak için en az bir görüntü ekleyin!');
            return;
        }

        try {
            const { jsPDF } = window.jspdf;
            let pdf = null;

            for (let i = 0; i < this.capturedImages.length; i++) {
                const imgObj = this.capturedImages[i];
                
                // Görüntüyü yükle
                const img = await this.loadImage(imgObj.data);
                
                // Rotasyon uygula
                const { canvas, width, height } = this.applyRotation(img, imgObj.rotation);
                
                // İlk sayfa için PDF oluştur
                if (i === 0) {
                    const orientation = width > height ? 'landscape' : 'portrait';
                    pdf = new jsPDF({
                        orientation: orientation,
                        unit: 'px',
                        format: [width, height]
                    });
                } else {
                    // Yeni sayfa ekle
                    const orientation = width > height ? 'landscape' : 'portrait';
                    pdf.addPage([width, height], orientation);
                }

                // Görüntüyü ekle
                const imgData = canvas.toDataURL('image/jpeg', 0.92);
                pdf.addImage(imgData, 'JPEG', 0, 0, width, height);
            }

            // İndir
            const fileName = `scan_${new Date().toISOString().slice(0,10)}.pdf`;
            pdf.save(fileName);

            alert('PDF başarıyla oluşturuldu!');

        } catch (error) {
            console.error('PDF oluşturma hatası:', error);
            alert('PDF oluşturulurken hata oluştu!');
        }
    },

    loadImage(src) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = reject;
            img.src = src;
        });
    },

    applyRotation(img, rotation) {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        // Rotasyona göre boyut ayarla
        const isRotated = Math.abs(rotation) === 90 || Math.abs(rotation) === 270;
        canvas.width = isRotated ? img.height : img.width;
        canvas.height = isRotated ? img.width : img.height;

        // Merkeze taşı, döndür, çiz
        ctx.translate(canvas.width / 2, canvas.height / 2);
        ctx.rotate((rotation * Math.PI) / 180);
        ctx.drawImage(img, -img.width / 2, -img.height / 2);

        return {
            canvas: canvas,
            width: canvas.width,
            height: canvas.height
        };
    },

    // ============================================
    // OPEN / CLOSE
    // ============================================
    open() {
        document.getElementById('camera-overlay')?.classList.remove('hidden');
        this.startCamera();
    },

    close() {
        this.stopCamera();
        document.getElementById('camera-overlay')?.classList.add('hidden');
    }
};

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    CameraModule.init();
});

// Export for global access
window.CameraModule = CameraModule;
