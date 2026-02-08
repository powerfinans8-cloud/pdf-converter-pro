/**
 * ============================================
 * ALL TO PDF CONVERTER PRO - LANGUAGE MODULE
 * ============================================
 * Çoklu dil desteği (i18n)
 * Desteklenen diller: EN, TR, DE, FR
 */

'use strict';

// ==========================================
// TRANSLATIONS
// ==========================================
const Translations = {
    en: {
        // App
        'app.name': 'All to PDF Converter Pro',
        
        // Dashboard
        'dashboard.title': 'All-in-One PDF Tools',
        'dashboard.subtitle': 'Convert, merge, split and edit your PDFs with ease',
        
        // Dropzone
        'dropzone.title': 'Drag & Drop Files Here',
        'dropzone.subtitle': 'or click to browse',
        'dropzone.images': 'Drop images here',
        'dropzone.word': 'Drop Word document here',
        'dropzone.pdf': 'Drop PDF files here',
        'dropzone.editPdf': 'Drop PDF to edit',
        
        // Tools
        'tools.images.title': 'Images to PDF',
        'tools.images.desc': 'Convert JPG, PNG, WEBP to PDF',
        'tools.word.title': 'Word to PDF',
        'tools.word.desc': 'Convert DOCX documents to PDF',
        'tools.merge.title': 'Merge & Split PDF',
        'tools.merge.desc': 'Combine or separate PDF files',
        'tools.camera.title': 'Camera Scan',
        'tools.camera.desc': 'Scan documents with camera',
        'tools.editor.title': 'PDF Editor',
        'tools.editor.desc': 'Draw, sign, stamp and annotate',
        
        // Controls
        'controls.quality': 'Quality:',
        'controls.pageNumbers': 'Add page numbers',
        'controls.pageSize': 'Page Size:',
        'controls.format': 'Output Format:',
        'controls.splitFormat': 'Split Format:',
        'controls.optimize': 'Optimize file size',
        
        // Buttons
        'btn.convert': 'Convert',
        'btn.convertPdf': 'Convert to PDF',
        'btn.process': 'Process',
        'btn.save': 'Save',
        'btn.download': 'Download',
        'btn.cancel': 'Cancel',
        
        // Common
        'common.back': 'Back',
        'common.cancel': 'Cancel',
        'common.confirm': 'Confirm',
        'common.delete': 'Delete',
        'common.loading': 'Loading...',
        
        // Merge/Split
        'merge.mergeMode': 'Merge PDFs',
        'merge.splitMode': 'Split PDF',
        
        // Camera
        'camera.desc': 'Capture documents directly from your camera',
        'camera.capture': 'Capture Photo',
        
        // Progress
        'progress.converting': 'Converting...',
        'progress.processing': 'Processing...',
        'progress.saving': 'Saving...',
        
        // Save Modal
        'save.title': 'Save PDF',
        'save.filename': 'File Name:',
        
        // Upgrade Modal
        'upgrade.title': 'Upgrade Your Plan',
        'upgrade.desc': 'Unlock all features with our premium plans!',
        'upgrade.basic.1': 'Images to PDF',
        'upgrade.basic.2': 'Word to PDF',
        'upgrade.basic.3': 'Merge & Split PDF',
        'upgrade.basic.4': 'Camera Scan',
        'upgrade.pro.1': 'Everything in Basic',
        'upgrade.pro.2': 'PDF Editor',
        'upgrade.pro.3': 'Signature & Stamps',
        'upgrade.pro.4': 'Priority Support',
        'upgrade.selectBasic': 'Select Basic',
        'upgrade.selectPro': 'Select Pro',
        'upgrade.success': 'Plan upgraded successfully!',
        
        // Trial
        'trial.remaining': 'You have {n} free trials remaining',
        'trial.ended': 'Free trial ended. Please upgrade to continue.',
        
        // Errors
        'error.invalidFile': 'Invalid file type',
        'error.fileTooLarge': 'File is too large',
        'error.processingFailed': 'Processing failed. Please try again.',
        'error.noFiles': 'Please select at least one file',
        
        // Success
        'success.converted': 'Conversion completed successfully!',
        'success.merged': 'PDFs merged successfully!',
        'success.split': 'PDF split successfully!',
        'success.saved': 'File saved successfully!',
        
        // Footer
        'footer.rights': 'All rights reserved.'
    },
    
    tr: {
        // App
        'app.name': 'All to PDF Converter Pro',
        
        // Dashboard
        'dashboard.title': 'Hepsi Bir Arada PDF Araçları',
        'dashboard.subtitle': 'PDF dosyalarınızı kolayca dönüştürün, birleştirin, ayırın ve düzenleyin',
        
        // Dropzone
        'dropzone.title': 'Dosyaları Sürükle & Bırak',
        'dropzone.subtitle': 'veya tıklayarak seçin',
        'dropzone.images': 'Resimleri buraya bırakın',
        'dropzone.word': 'Word belgesini buraya bırakın',
        'dropzone.pdf': 'PDF dosyalarını buraya bırakın',
        'dropzone.editPdf': 'Düzenlemek için PDF bırakın',
        
        // Tools
        'tools.images.title': 'Resimden PDF',
        'tools.images.desc': 'JPG, PNG, WEBP dosyalarını PDF\'e dönüştür',
        'tools.word.title': 'Word\'den PDF',
        'tools.word.desc': 'DOCX belgelerini PDF\'e dönüştür',
        'tools.merge.title': 'PDF Birleştir & Ayır',
        'tools.merge.desc': 'PDF dosyalarını birleştir veya ayır',
        'tools.camera.title': 'Kamera Tarama',
        'tools.camera.desc': 'Kamera ile belge tara',
        'tools.editor.title': 'PDF Editör',
        'tools.editor.desc': 'Çiz, imzala, damgala ve not ekle',
        
        // Controls
        'controls.quality': 'Kalite:',
        'controls.pageNumbers': 'Sayfa numarası ekle',
        'controls.pageSize': 'Sayfa Boyutu:',
        'controls.format': 'Çıktı Formatı:',
        'controls.splitFormat': 'Ayırma Formatı:',
        'controls.optimize': 'Dosya boyutunu optimize et',
        
        // Buttons
        'btn.convert': 'Dönüştür',
        'btn.convertPdf': 'PDF\'e Dönüştür',
        'btn.process': 'İşle',
        'btn.save': 'Kaydet',
        'btn.download': 'İndir',
        'btn.cancel': 'İptal',
        
        // Common
        'common.back': 'Geri',
        'common.cancel': 'İptal',
        'common.confirm': 'Onayla',
        'common.delete': 'Sil',
        'common.loading': 'Yükleniyor...',
        
        // Merge/Split
        'merge.mergeMode': 'PDF Birleştir',
        'merge.splitMode': 'PDF Ayır',
        
        // Camera
        'camera.desc': 'Kameranızla doğrudan belge çekin',
        'camera.capture': 'Fotoğraf Çek',
        
        // Progress
        'progress.converting': 'Dönüştürülüyor...',
        'progress.processing': 'İşleniyor...',
        'progress.saving': 'Kaydediliyor...',
        
        // Save Modal
        'save.title': 'PDF Kaydet',
        'save.filename': 'Dosya Adı:',
        
        // Upgrade Modal
        'upgrade.title': 'Planınızı Yükseltin',
        'upgrade.desc': 'Premium planlarla tüm özelliklerin kilidini açın!',
        'upgrade.basic.1': 'Resimden PDF',
        'upgrade.basic.2': 'Word\'den PDF',
        'upgrade.basic.3': 'PDF Birleştir & Ayır',
        'upgrade.basic.4': 'Kamera Tarama',
        'upgrade.pro.1': 'Basic\'teki her şey',
        'upgrade.pro.2': 'PDF Editör',
        'upgrade.pro.3': 'İmza & Damga',
        'upgrade.pro.4': 'Öncelikli Destek',
        'upgrade.selectBasic': 'Basic Seç',
        'upgrade.selectPro': 'Pro Seç',
        'upgrade.success': 'Plan başarıyla yükseltildi!',
        
        // Trial
        'trial.remaining': '{n} ücretsiz deneme hakkınız kaldı',
        'trial.ended': 'Ücretsiz deneme sona erdi. Devam etmek için yükseltin.',
        
        // Errors
        'error.invalidFile': 'Geçersiz dosya türü',
        'error.fileTooLarge': 'Dosya çok büyük',
        'error.processingFailed': 'İşlem başarısız. Lütfen tekrar deneyin.',
        'error.noFiles': 'Lütfen en az bir dosya seçin',
        
        // Success
        'success.converted': 'Dönüştürme başarıyla tamamlandı!',
        'success.merged': 'PDF\'ler başarıyla birleştirildi!',
        'success.split': 'PDF başarıyla ayrıldı!',
        'success.saved': 'Dosya başarıyla kaydedildi!',
        
        // Footer
        'footer.rights': 'Tüm hakları saklıdır.'
    },
    
    de: {
        // App
        'app.name': 'All to PDF Converter Pro',
        
        // Dashboard
        'dashboard.title': 'All-in-One PDF-Werkzeuge',
        'dashboard.subtitle': 'Konvertieren, zusammenführen, teilen und bearbeiten Sie Ihre PDFs',
        
        // Dropzone
        'dropzone.title': 'Dateien hierher ziehen',
        'dropzone.subtitle': 'oder klicken zum Durchsuchen',
        'dropzone.images': 'Bilder hier ablegen',
        'dropzone.word': 'Word-Dokument hier ablegen',
        'dropzone.pdf': 'PDF-Dateien hier ablegen',
        'dropzone.editPdf': 'PDF zum Bearbeiten ablegen',
        
        // Tools
        'tools.images.title': 'Bilder zu PDF',
        'tools.images.desc': 'JPG, PNG, WEBP in PDF konvertieren',
        'tools.word.title': 'Word zu PDF',
        'tools.word.desc': 'DOCX-Dokumente in PDF konvertieren',
        'tools.merge.title': 'PDF Zusammenführen & Teilen',
        'tools.merge.desc': 'PDF-Dateien kombinieren oder trennen',
        'tools.camera.title': 'Kamera-Scan',
        'tools.camera.desc': 'Dokumente mit Kamera scannen',
        'tools.editor.title': 'PDF-Editor',
        'tools.editor.desc': 'Zeichnen, unterschreiben, stempeln und kommentieren',
        
        // Controls
        'controls.quality': 'Qualität:',
        'controls.pageNumbers': 'Seitenzahlen hinzufügen',
        'controls.pageSize': 'Seitengröße:',
        'controls.format': 'Ausgabeformat:',
        'controls.splitFormat': 'Teilungsformat:',
        'controls.optimize': 'Dateigröße optimieren',
        
        // Buttons
        'btn.convert': 'Konvertieren',
        'btn.convertPdf': 'In PDF konvertieren',
        'btn.process': 'Verarbeiten',
        'btn.save': 'Speichern',
        'btn.download': 'Herunterladen',
        'btn.cancel': 'Abbrechen',
        
        // Common
        'common.back': 'Zurück',
        'common.cancel': 'Abbrechen',
        'common.confirm': 'Bestätigen',
        'common.delete': 'Löschen',
        'common.loading': 'Laden...',
        
        // Merge/Split
        'merge.mergeMode': 'PDFs zusammenführen',
        'merge.splitMode': 'PDF teilen',
        
        // Camera
        'camera.desc': 'Dokumente direkt mit der Kamera erfassen',
        'camera.capture': 'Foto aufnehmen',
        
        // Progress
        'progress.converting': 'Konvertierung...',
        'progress.processing': 'Verarbeitung...',
        'progress.saving': 'Speichern...',
        
        // Save Modal
        'save.title': 'PDF speichern',
        'save.filename': 'Dateiname:',
        
        // Upgrade Modal
        'upgrade.title': 'Plan upgraden',
        'upgrade.desc': 'Schalten Sie alle Funktionen mit unseren Premium-Plänen frei!',
        'upgrade.basic.1': 'Bilder zu PDF',
        'upgrade.basic.2': 'Word zu PDF',
        'upgrade.basic.3': 'PDF Zusammenführen & Teilen',
        'upgrade.basic.4': 'Kamera-Scan',
        'upgrade.pro.1': 'Alles in Basic',
        'upgrade.pro.2': 'PDF-Editor',
        'upgrade.pro.3': 'Unterschrift & Stempel',
        'upgrade.pro.4': 'Prioritäts-Support',
        'upgrade.selectBasic': 'Basic wählen',
        'upgrade.selectPro': 'Pro wählen',
        'upgrade.success': 'Plan erfolgreich aktualisiert!',
        
        // Trial
        'trial.remaining': 'Sie haben noch {n} kostenlose Versuche',
        'trial.ended': 'Kostenlose Testversion beendet. Bitte upgraden Sie.',
        
        // Errors
        'error.invalidFile': 'Ungültiger Dateityp',
        'error.fileTooLarge': 'Datei ist zu groß',
        'error.processingFailed': 'Verarbeitung fehlgeschlagen. Bitte erneut versuchen.',
        'error.noFiles': 'Bitte wählen Sie mindestens eine Datei',
        
        // Success
        'success.converted': 'Konvertierung erfolgreich abgeschlossen!',
        'success.merged': 'PDFs erfolgreich zusammengeführt!',
        'success.split': 'PDF erfolgreich geteilt!',
        'success.saved': 'Datei erfolgreich gespeichert!',
        
        // Footer
        'footer.rights': 'Alle Rechte vorbehalten.'
    },
    
    fr: {
        // App
        'app.name': 'All to PDF Converter Pro',
        
        // Dashboard
        'dashboard.title': 'Outils PDF Tout-en-Un',
        'dashboard.subtitle': 'Convertissez, fusionnez, divisez et éditez vos PDF facilement',
        
        // Dropzone
        'dropzone.title': 'Glissez-déposez les fichiers ici',
        'dropzone.subtitle': 'ou cliquez pour parcourir',
        'dropzone.images': 'Déposez les images ici',
        'dropzone.word': 'Déposez le document Word ici',
        'dropzone.pdf': 'Déposez les fichiers PDF ici',
        'dropzone.editPdf': 'Déposez le PDF à éditer',
        
        // Tools
        'tools.images.title': 'Images en PDF',
        'tools.images.desc': 'Convertir JPG, PNG, WEBP en PDF',
        'tools.word.title': 'Word en PDF',
        'tools.word.desc': 'Convertir les documents DOCX en PDF',
        'tools.merge.title': 'Fusionner & Diviser PDF',
        'tools.merge.desc': 'Combiner ou séparer les fichiers PDF',
        'tools.camera.title': 'Scan Caméra',
        'tools.camera.desc': 'Scanner des documents avec la caméra',
        'tools.editor.title': 'Éditeur PDF',
        'tools.editor.desc': 'Dessiner, signer, tamponner et annoter',
        
        // Controls
        'controls.quality': 'Qualité:',
        'controls.pageNumbers': 'Ajouter numéros de page',
        'controls.pageSize': 'Taille de page:',
        'controls.format': 'Format de sortie:',
        'controls.splitFormat': 'Format de division:',
        'controls.optimize': 'Optimiser la taille du fichier',
        
        // Buttons
        'btn.convert': 'Convertir',
        'btn.convertPdf': 'Convertir en PDF',
        'btn.process': 'Traiter',
        'btn.save': 'Enregistrer',
        'btn.download': 'Télécharger',
        'btn.cancel': 'Annuler',
        
        // Common
        'common.back': 'Retour',
        'common.cancel': 'Annuler',
        'common.confirm': 'Confirmer',
        'common.delete': 'Supprimer',
        'common.loading': 'Chargement...',
        
        // Merge/Split
        'merge.mergeMode': 'Fusionner PDFs',
        'merge.splitMode': 'Diviser PDF',
        
        // Camera
        'camera.desc': 'Capturez des documents directement depuis votre caméra',
        'camera.capture': 'Prendre une photo',
        
        // Progress
        'progress.converting': 'Conversion...',
        'progress.processing': 'Traitement...',
        'progress.saving': 'Enregistrement...',
        
        // Save Modal
        'save.title': 'Enregistrer PDF',
        'save.filename': 'Nom du fichier:',
        
        // Upgrade Modal
        'upgrade.title': 'Améliorer votre plan',
        'upgrade.desc': 'Débloquez toutes les fonctionnalités avec nos plans premium!',
        'upgrade.basic.1': 'Images en PDF',
        'upgrade.basic.2': 'Word en PDF',
        'upgrade.basic.3': 'Fusionner & Diviser PDF',
        'upgrade.basic.4': 'Scan Caméra',
        'upgrade.pro.1': 'Tout dans Basic',
        'upgrade.pro.2': 'Éditeur PDF',
        'upgrade.pro.3': 'Signature & Tampons',
        'upgrade.pro.4': 'Support Prioritaire',
        'upgrade.selectBasic': 'Choisir Basic',
        'upgrade.selectPro': 'Choisir Pro',
        'upgrade.success': 'Plan mis à niveau avec succès!',
        
        // Trial
        'trial.remaining': 'Il vous reste {n} essais gratuits',
        'trial.ended': 'Essai gratuit terminé. Veuillez mettre à niveau.',
        
        // Errors
        'error.invalidFile': 'Type de fichier invalide',
        'error.fileTooLarge': 'Fichier trop volumineux',
        'error.processingFailed': 'Échec du traitement. Veuillez réessayer.',
        'error.noFiles': 'Veuillez sélectionner au moins un fichier',
        
        // Success
        'success.converted': 'Conversion terminée avec succès!',
        'success.merged': 'PDFs fusionnés avec succès!',
        'success.split': 'PDF divisé avec succès!',
        'success.saved': 'Fichier enregistré avec succès!',
        
        // Footer
        'footer.rights': 'Tous droits réservés.'
    }
};

// ==========================================
// LANGUAGE FLAGS
// ==========================================
const LangFlags = {
    en: '🇺🇸',
    tr: '🇹🇷',
    de: '🇩🇪',
    fr: '🇫🇷'
};

const LangNames = {
    en: 'EN',
    tr: 'TR',
    de: 'DE',
    fr: 'FR'
};

// ==========================================
// LANGUAGE MODULE
// ==========================================
const Lang = {
    current: 'en',
    
    /**
     * Initialize language system
     */
    init() {
        // Get saved language or browser default
        const saved = localStorage.getItem('language');
        const browserLang = navigator.language.split('-')[0];
        
        // Set language (priority: saved > browser > default)
        if (saved && Translations[saved]) {
            this.current = saved;
        } else if (Translations[browserLang]) {
            this.current = browserLang;
        }
        
        this.apply();
        this.updateUI();
    },
    
    /**
     * Get translation by key
     */
    get(key) {
        return Translations[this.current]?.[key] || Translations['en'][key] || key;
    },
    
    /**
     * Set language
     */
    set(lang) {
        if (Translations[lang]) {
            this.current = lang;
            localStorage.setItem('language', lang);
            this.apply();
            this.updateUI();
        }
    },
    
    /**
     * Apply translations to all elements
     */
    apply() {
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.dataset.i18n;
            const translation = this.get(key);
            
            if (el.tagName === 'INPUT' && el.type === 'text') {
                el.placeholder = translation;
            } else {
                el.textContent = translation;
            }
        });
        
        // Update HTML lang attribute
        document.documentElement.lang = this.current;
    },
    
    /**
     * Update language selector UI
     */
    updateUI() {
        const currentLangEl = document.getElementById('currentLang');
        if (currentLangEl) {
            currentLangEl.textContent = `${LangFlags[this.current]} ${LangNames[this.current]}`;
        }
        
        // Update active state in dropdown
        document.querySelectorAll('.lang-option').forEach(option => {
            option.classList.toggle('active', option.dataset.lang === this.current);
        });
    }
};

// ==========================================
// EXPORT
// ==========================================
window.Lang = Lang;
window.Translations = Translations;