// ============================================
// PDF CONVERTER PRO - CAMERA MODULE
// ============================================
// Version: 2.0 (Mobile Optimized)
// Fotoğraf çekme ve PDF oluşturma
// ============================================

(function() {
    'use strict';

    // ============================================
    // GLOBAL VARIABLES
    // ============================================
    let videoStream = null;
    let currentCamera = 'environment'; // 'environment' = arka, 'user' = ön
    let capturedImages = [];
    let isFlashOn = false;

    // DOM Elements
    let videoElement = null;
    let canvasElement = null;
    let canvasContext = null;

    // ============================================
    // INITIALIZATION
    // ============================================
    document.addEventListener('DOMContentLoaded', function() {
        console.log('📷 Camera module initializing...');

        videoElement = document.getElementById('cameraVideo');
        canvasElement = document.getElementById('cameraCanvas');

        if (canvasElement) {
            canvasContext = canvasElement.getContext('2d', {
                willReadFrequently: true
            });
        }

        initCameraButtons();
        console.log('✅ Camera module initialized');
    });

    // ============================================
    // BUTTON HANDLERS
    // ============================================
    function initCameraButtons() {
        // Start camera button
        const startBtn = document.getElementById('startCameraBtn');
        if (startBtn) {
            startBtn.addEventListener('click', startCamera);
        }

        // Capture button
        const captureBtn = document.getElementById('captureBtn');
        if (captureBtn) {
            captureBtn.addEventListener('click', capturePhoto);
        }

        // Switch camera button
        const switchBtn = document.getElementById('switchCameraBtn');
        if (switchBtn) {
            switchBtn.addEventListener('click', switchCamera);
        }

        // Create PDF button
        const createPdfBtn = document.getElementById('createScanPdfBtn');
        if (createPdfBtn) {
            createPdfBtn.addEventListener('click', createPdfFromCaptures);
        }
    }

    // ============================================
    // START CAMERA
    // ============================================
    async function startCamera() {
        try {
            // Stop any existing stream
            stopCamera();

            showToast('Kamera başlatılıyor...', 'info');

            // Camera constraints
            const constraints = {
                video: {
                    facingMode: currentCamera,
                    width: { ideal: 1920 },
                    height: { ideal: 1080 }
                },
                audio: false
            };

            // Request camera access
            videoStream = await navigator.mediaDevices.getUserMedia(constraints);

            // Set video source
            if (videoElement) {
                videoElement.srcObject = videoStream;
                videoElement.setAttribute('playsinline', true);
                videoElement.setAttribute('autoplay', true);
                videoElement.muted = true;

                // Wait for video to be ready
                videoElement.onloadedmetadata = function() {
                    videoElement.play();
                    updateButtonStates(true);
                    showToast('Kamera hazır!', 'success');
                };
            }

        } catch (error) {
            console.error('Camera error:', error);
            
            if (error.name === 'NotAllowedError') {
                showToast('Kamera izni verilmedi', 'error');
            } else if (error.name === 'NotFoundError') {
                showToast('Kamera bulunamadı', 'error');
            } else if (error.name === 'NotSupportedError') {
                showToast('Kamera desteklenmiyor', 'error');
            } else {
                showToast('Kamera başlatılamadı: ' + error.message, 'error');
            }

            updateButtonStates(false);
        }
    }

    // ============================================
    // STOP CAMERA
    // ============================================
    function stopCamera() {
        if (videoStream) {
            videoStream.getTracks().forEach(track => {
                track.stop();
            });
            videoStream = null;
        }

        if (videoElement) {
            videoElement.srcObject = null;
        }

        updateButtonStates(false);
    }

    // ============================================
    // SWITCH CAMERA (Front/Back)
    // ============================================
    async function switchCamera() {
        currentCamera = currentCamera === 'environment' ? 'user' : 'environment';
        
        showToast(currentCamera === 'user' ? 'Ön kamera' : 'Arka kamera', 'info');
        
        await startCamera();
    }

    // ============================================
    // CAPTURE PHOTO
    // ============================================
    function capturePhoto() {
        if (!videoElement || !videoElement.videoWidth) {
            showToast('Kamera hazır değil', 'warning');
            return;
        }

        try {
            // Set canvas size to video size
            const videoWidth = videoElement.videoWidth;
            const videoHeight = videoElement.videoHeight;

            canvasElement.width = videoWidth;
            canvasElement.height = videoHeight;

            // Clear canvas
            canvasContext.clearRect(0, 0, videoWidth, videoHeight);

            // Draw video frame to canvas (NO FILTERS - CLEAN CAPTURE)
            canvasContext.drawImage(videoElement, 0, 0, videoWidth, videoHeight);

            // Get image data as JPEG (better quality, no color issues)
            const imageDataURL = canvasElement.toDataURL('image/jpeg', 0.92);

            // Add to captured images
            const imageData = {
                id: Date.now(),
                dataURL: imageDataURL,
                width: videoWidth,
                height: videoHeight,
                timestamp: new Date().toLocaleTimeString('tr-TR')
            };

            capturedImages.push(imageData);

            // Update UI
            updateCapturedList();
            updateCreatePdfButton();

            // Visual feedback
            flashEffect();
            showToast(`Fotoğraf çekildi (${capturedImages.length})`, 'success');

            console.log('📸 Photo captured:', videoWidth + 'x' + videoHeight);

        } catch (error) {
            console.error('Capture error:', error);
            showToast('Fotoğraf çekilemedi', 'error');
        }
    }

    // ============================================
    // FLASH EFFECT (Visual Feedback)
    // ============================================
    function flashEffect() {
        const container = document.getElementById('cameraContainer');
        if (!container) return;

        // Create flash overlay
        const flash = document.createElement('div');
        flash.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: white;
            opacity: 0.8;
            z-index: 100;
            pointer-events: none;
            transition: opacity 0.3s ease;
        `;
        container.appendChild(flash);

        // Fade out and remove
        setTimeout(() => {
            flash.style.opacity = '0';
            setTimeout(() => flash.remove(), 300);
        }, 50);
    }

    // ============================================
    // UPDATE CAPTURED LIST
    // ============================================
    function updateCapturedList() {
        const listContainer = document.getElementById('capturedList');
        if (!listContainer) return;

        listContainer.innerHTML = '';

        if (capturedImages.length === 0) {
            listContainer.innerHTML = '<p style="color: var(--text-secondary); text-align: center; padding: 20px;">Henüz fotoğraf çekilmedi</p>';
            return;
        }

        capturedImages.forEach((img, index) => {
            const item = document.createElement('div');
            item.className = 'file-item';
            item.style.cssText = 'display: flex; align-items: center; gap: 12px; padding: 10px; margin-bottom: 8px;';
            
            item.innerHTML = `
                <img src="${img.dataURL}" alt="Captured ${index + 1}" 
                     style="width: 60px; height: 45px; object-fit: cover; border-radius: 4px; border: 1px solid var(--border-color);">
                <div class="file-info" style="flex: 1;">
                    <div class="file-name">Fotoğraf ${index + 1}</div>
                    <div class="file-size">${img.width}x${img.height} • ${img.timestamp}</div>
                </div>
                <button class="btn btn-secondary" onclick="previewCapturedImage(${index})" style="padding: 6px 10px; font-size: 0.8rem;">
                    👁️
                </button>
                <button class="btn btn-secondary" onclick="downloadCapturedImage(${index})" style="padding: 6px 10px; font-size: 0.8rem;">
                    💾
                </button>
                <button class="file-remove" onclick="removeCapturedImage(${index})" style="padding: 6px 10px;">
                    ✕
                </button>
            `;

            listContainer.appendChild(item);
        });

        // Add clear all button if multiple images
        if (capturedImages.length > 1) {
            const clearAllBtn = document.createElement('button');
            clearAllBtn.className = 'btn btn-danger';
            clearAllBtn.style.cssText = 'width: 100%; margin-top: 10px;';
            clearAllBtn.innerHTML = '🗑️ Tümünü Temizle';
            clearAllBtn.onclick = clearAllCaptures;
            listContainer.appendChild(clearAllBtn);
        }
    }

    // ============================================
    // REMOVE CAPTURED IMAGE
    // ============================================
    window.removeCapturedImage = function(index) {
        capturedImages.splice(index, 1);
        updateCapturedList();
        updateCreatePdfButton();
        showToast('Fotoğraf silindi', 'info');
    };

    // ============================================
    // CLEAR ALL CAPTURES
    // ============================================
    window.clearAllCaptures = function() {
        if (confirm('Tüm fotoğrafları silmek istediğinize emin misiniz?')) {
            capturedImages = [];
            updateCapturedList();
            updateCreatePdfButton();
            showToast('Tüm fotoğraflar silindi', 'success');
        }
    };

    // ============================================
    // PREVIEW CAPTURED IMAGE
    // ============================================
    window.previewCapturedImage = function(index) {
        const img = capturedImages[index];
        if (!img) return;

        // Create preview modal
        const modal = document.createElement('div');
        modal.className = 'modal-overlay active';
        modal.id = 'imagePreviewModal';
        modal.style.zIndex = '3000';
        modal.innerHTML = `
            <div class="modal" style="max-width: 90vw; max-height: 90vh; background: #000;">
                <div class="modal-header">
                    <span class="modal-title">📷 Fotoğraf ${index + 1}</span>
                    <button class="modal-close" onclick="document.getElementById('imagePreviewModal').remove()">×</button>
                </div>
                <div class="modal-body" style="padding: 0; display: flex; align-items: center; justify-content: center; background: #1a1a1a;">
                    <img src="${img.dataURL}" alt="Preview" style="max-width: 100%; max-height: 70vh; object-fit: contain;">
                </div>
                <div class="modal-footer" style="justify-content: center;">
                    <button class="btn btn-primary" onclick="downloadCapturedImage(${index}); document.getElementById('imagePreviewModal').remove();">
                        💾 İndir
                    </button>
                    <button class="btn btn-secondary" onclick="document.getElementById('imagePreviewModal').remove()">
                        Kapat
                    </button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Close on backdrop click
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                modal.remove();
            }
        });
    };

    // ============================================
    // DOWNLOAD CAPTURED IMAGE
    // ============================================
    window.downloadCapturedImage = function(index) {
        const img = capturedImages[index];
        if (!img) return;

        const link = document.createElement('a');
        link.href = img.dataURL;
        link.download = `scan_${index + 1}_${Date.now()}.jpg`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        showToast('Fotoğraf indirildi', 'success');
    };

    // ============================================
    // CREATE PDF FROM CAPTURES
    // ============================================
    async function createPdfFromCaptures() {
        if (capturedImages.length === 0) {
            showToast('Önce fotoğraf çekin', 'warning');
            return;
        }

        try {
            showToast('PDF oluşturuluyor...', 'info');

            const { jsPDF } = window.jspdf;

            // Determine orientation from first image
            const firstImg = capturedImages[0];
            const isLandscape = firstImg.width > firstImg.height;

            const pdf = new jsPDF({
                orientation: isLandscape ? 'landscape' : 'portrait',
                unit: 'mm'
            });

            for (let i = 0; i < capturedImages.length; i++) {
                const img = capturedImages[i];

                if (i > 0) {
                    // Add new page for subsequent images
                    const imgLandscape = img.width > img.height;
                    pdf.addPage(imgLandscape ? 'landscape' : 'portrait');
                }

                // Get page dimensions
                const pageWidth = pdf.internal.pageSize.getWidth();
                const pageHeight = pdf.internal.pageSize.getHeight();

                // Calculate image dimensions to fit page
                const imgRatio = img.width / img.height;
                const pageRatio = pageWidth / pageHeight;

                let drawWidth, drawHeight, offsetX, offsetY;

                if (imgRatio > pageRatio) {
                    // Image is wider - fit to width
                    drawWidth = pageWidth - 10; // 5mm margin each side
                    drawHeight = drawWidth / imgRatio;
                    offsetX = 5;
                    offsetY = (pageHeight - drawHeight) / 2;
                } else {
                    // Image is taller - fit to height
                    drawHeight = pageHeight - 10; // 5mm margin each side
                    drawWidth = drawHeight * imgRatio;
                    offsetX = (pageWidth - drawWidth) / 2;
                    offsetY = 5;
                }

                // Add image to PDF
                pdf.addImage(
                    img.dataURL,
                    'JPEG',
                    offsetX,
                    offsetY,
                    drawWidth,
                    drawHeight,
                    undefined,
                    'FAST'
                );
            }

            // Generate filename
            const timestamp = new Date().toISOString().slice(0, 10);
            const filename = `scanned_document_${timestamp}.pdf`;

            // Save PDF
            pdf.save(filename);

            showToast(`PDF oluşturuldu (${capturedImages.length} sayfa)`, 'success');

        } catch (error) {
            console.error('PDF creation error:', error);
            showToast('PDF oluşturulamadı: ' + error.message, 'error');
        }
    }

    // ============================================
    // UPDATE BUTTON STATES
    // ============================================
    function updateButtonStates(cameraActive) {
        const startBtn = document.getElementById('startCameraBtn');
        const captureBtn = document.getElementById('captureBtn');
        const switchBtn = document.getElementById('switchCameraBtn');

        if (startBtn) {
            startBtn.innerHTML = cameraActive 
                ? '<span>⏹️</span> Kamerayı Durdur'
                : '<span>📷</span> Kamerayı Başlat';
            
            // Change click handler
            startBtn.onclick = cameraActive ? stopCamera : startCamera;
        }

        if (captureBtn) {
            captureBtn.disabled = !cameraActive;
        }

        if (switchBtn) {
            switchBtn.disabled = !cameraActive;
        }
    }

    function updateCreatePdfButton() {
        const createPdfBtn = document.getElementById('createScanPdfBtn');
        if (createPdfBtn) {
            createPdfBtn.disabled = capturedImages.length === 0;
        }
    }

    // ============================================
    // IMAGE ENHANCEMENT (Optional)
    // ============================================
    function enhanceImage(imageData) {
        // Simple auto-contrast enhancement
        const data = imageData.data;
        let min = 255, max = 0;

        // Find min/max values
        for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            const brightness = (r + g + b) / 3;
            
            if (brightness < min) min = brightness;
            if (brightness > max) max = brightness;
        }

        // Apply contrast stretch
        const range = max - min;
        if (range > 0) {
            const scale = 255 / range;
            
            for (let i = 0; i < data.length; i += 4) {
                data[i] = Math.min(255, Math.max(0, (data[i] - min) * scale));
                data[i + 1] = Math.min(255, Math.max(0, (data[i + 1] - min) * scale));
                data[i + 2] = Math.min(255, Math.max(0, (data[i + 2] - min) * scale));
            }
        }

        return imageData;
    }

    // ============================================
    // APPLY DOCUMENT FILTER (Optional)
    // ============================================
    window.applyDocumentFilter = function() {
        if (capturedImages.length === 0) {
            showToast('Önce fotoğraf çekin', 'warning');
            return;
        }

        showToast('Belge filtresi uygulanıyor...', 'info');

        capturedImages = capturedImages.map((img, index) => {
            try {
                // Create temp canvas
                const tempCanvas = document.createElement('canvas');
                const tempCtx = tempCanvas.getContext('2d');
                
                // Create image element
                const imgEl = new Image();
                imgEl.src = img.dataURL;

                // Wait for load
                return new Promise((resolve) => {
                    imgEl.onload = function() {
                        tempCanvas.width = imgEl.width;
                        tempCanvas.height = imgEl.height;

                        // Draw original
                        tempCtx.drawImage(imgEl, 0, 0);

                        // Get image data
                        let imageData = tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);

                        // Apply enhancement
                        imageData = enhanceImage(imageData);

                        // Apply grayscale for document look
                        const data = imageData.data;
                        for (let i = 0; i < data.length; i += 4) {
                            const gray = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
                            
                            // Increase contrast for document
                            const adjusted = gray < 128 ? gray * 0.8 : gray * 1.2;
                            const final = Math.min(255, Math.max(0, adjusted));
                            
                            data[i] = final;
                            data[i + 1] = final;
                            data[i + 2] = final;
                        }

                        // Put back
                        tempCtx.putImageData(imageData, 0, 0);

                        resolve({
                            ...img,
                            dataURL: tempCanvas.toDataURL('image/jpeg', 0.92)
                        });
                    };
                });
            } catch (error) {
                console.error('Filter error:', error);
                return img;
            }
        });

        // Wait for all and update
        Promise.all(capturedImages).then(filtered => {
            capturedImages = filtered;
            updateCapturedList();
            showToast('Belge filtresi uygulandı', 'success');
        });
    };

    // ============================================
    // ROTATE CAPTURED IMAGE
    // ============================================
    window.rotateCapturedImage = function(index, degrees = 90) {
        const img = capturedImages[index];
        if (!img) return;

        try {
            const tempCanvas = document.createElement('canvas');
            const tempCtx = tempCanvas.getContext('2d');
            
            const imgEl = new Image();
            imgEl.onload = function() {
                // Swap dimensions for 90/270 degree rotation
                if (degrees === 90 || degrees === 270) {
                    tempCanvas.width = imgEl.height;
                    tempCanvas.height = imgEl.width;
                } else {
                    tempCanvas.width = imgEl.width;
                    tempCanvas.height = imgEl.height;
                }

                // Rotate
                tempCtx.translate(tempCanvas.width / 2, tempCanvas.height / 2);
                tempCtx.rotate((degrees * Math.PI) / 180);
                tempCtx.drawImage(imgEl, -imgEl.width / 2, -imgEl.height / 2);

                // Update image data
                capturedImages[index] = {
                    ...img,
                    dataURL: tempCanvas.toDataURL('image/jpeg', 0.92),
                    width: tempCanvas.width,
                    height: tempCanvas.height
                };

                updateCapturedList();
                showToast('Fotoğraf döndürüldü', 'success');
            };
            imgEl.src = img.dataURL;

        } catch (error) {
            console.error('Rotate error:', error);
            showToast('Döndürme başarısız', 'error');
        }
    };

    // ============================================
    // REORDER CAPTURES (Drag & Drop)
    // ============================================
    window.moveCaptureUp = function(index) {
        if (index > 0) {
            const temp = capturedImages[index];
            capturedImages[index] = capturedImages[index - 1];
            capturedImages[index - 1] = temp;
            updateCapturedList();
        }
    };

    window.moveCaptureDown = function(index) {
        if (index < capturedImages.length - 1) {
            const temp = capturedImages[index];
            capturedImages[index] = capturedImages[index + 1];
            capturedImages[index + 1] = temp;
            updateCapturedList();
        }
    };

    // ============================================
    // CLEANUP ON PAGE UNLOAD
    // ============================================
    window.addEventListener('beforeunload', function() {
        stopCamera();
    });

    // ============================================
    // VISIBILITY CHANGE (Stop camera when hidden)
    // ============================================
    document.addEventListener('visibilitychange', function() {
        if (document.hidden && videoStream) {
            // Optionally pause when tab is hidden
            // stopCamera();
        }
    });

    // ============================================
    // EXPOSE PUBLIC API
    // ============================================
    window.CameraModule = {
        start: startCamera,
        stop: stopCamera,
        capture: capturePhoto,
        switch: switchCamera,
        createPdf: createPdfFromCaptures,
        getCapturedImages: () => capturedImages,
        clearAll: clearAllCaptures
    };

    // ============================================
    // INITIALIZATION COMPLETE
    // ============================================
    console.log('✅ Camera module v2.0 loaded');
    console.log('📷 Negative issue fixed - Clean JPEG capture');

// End of IIFE
})();
