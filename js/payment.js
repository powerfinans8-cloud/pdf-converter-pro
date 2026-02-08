/**
 * ============================================
 * ALL TO PDF CONVERTER PRO - PAYMENT MODULE
 * ============================================
 * Ödeme sistemi ve plan yönetimi
 * Stripe & PayPal entegrasyonu (Demo)
 * 
 * PLANLAR:
 * - Free: 5 ücretsiz deneme
 * - Basic ($4.99): Temel özellikler
 * - Pro ($9.99): Tüm özellikler + Editor
 */

'use strict';

// ==========================================
// PAYMENT MODULE
// ==========================================
const Payment = {
    // Plan definitions
    plans: {
        free: {
            name: 'Free Trial',
            price: 0,
            features: ['5 free conversions', 'Basic tools only'],
            limits: {
                maxUses: 5,
                hasEditor: false
            }
        },
        basic: {
            name: 'Basic Plan',
            price: 4.99,
            priceId: 'price_basic_499', // Stripe price ID
            features: [
                'Unlimited conversions',
                'Images to PDF',
                'Word to PDF', 
                'Merge & Split PDF',
                'Camera Scan',
                'Priority processing'
            ],
            limits: {
                maxUses: Infinity,
                hasEditor: false
            }
        },
        pro: {
            name: 'Pro Plan',
            price: 9.99,
            priceId: 'price_pro_999', // Stripe price ID
            features: [
                'Everything in Basic',
                'PDF Editor',
                'Signature & Stamps',
                'Advanced annotations',
                'Priority support',
                'No watermarks'
            ],
            limits: {
                maxUses: Infinity,
                hasEditor: true
            }
        }
    },
    
    // Current user state
    userState: {
        plan: 'free',
        usesRemaining: 5,
        licenseKey: null,
        purchaseDate: null,
        expiryDate: null
    },
    
    /**
     * Initialize payment module
     */
    init() {
        this.loadUserState();
        this.bindEvents();
        this.updateUI();
        this.checkTrialStatus();
    },
    
    /**
     * Load user state from localStorage
     */
    loadUserState() {
        try {
            const saved = localStorage.getItem('pdfConverterUserState');
            if (saved) {
                const parsed = JSON.parse(saved);
                this.userState = { ...this.userState, ...parsed };
                
                // Sync with App state
                App.userPlan = this.userState.plan;
                App.freeTrialsLeft = this.userState.usesRemaining;
            }
        } catch (error) {
            console.error('Error loading user state:', error);
        }
    },
    
    /**
     * Save user state to localStorage
     */
    saveUserState() {
        try {
            localStorage.setItem('pdfConverterUserState', JSON.stringify(this.userState));
            
            // Sync with App state
            App.userPlan = this.userState.plan;
            App.freeTrialsLeft = this.userState.usesRemaining;
        } catch (error) {
            console.error('Error saving user state:', error);
        }
    },
    
    /**
     * Bind event listeners
     */
    bindEvents() {
        // Plan selection buttons in upgrade modal
        document.querySelectorAll('[data-plan]').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                const plan = btn.dataset.plan;
                this.initCheckout(plan);
            });
        });
    },
    
    /**
     * Update UI based on current plan
     */
    updateUI() {
        // Update any plan indicators in UI
        const planBadges = document.querySelectorAll('.plan-badge');
        planBadges.forEach(badge => {
            badge.textContent = this.plans[this.userState.plan]?.name || 'Free';
        });
        
        // Update trial counter if visible
        const trialCounter = document.getElementById('trialCounter');
        if (trialCounter && this.userState.plan === 'free') {
            trialCounter.textContent = `${this.userState.usesRemaining} uses left`;
            trialCounter.style.display = 'block';
        } else if (trialCounter) {
            trialCounter.style.display = 'none';
        }
        
        // Show/hide Pro badges on tools
        this.updateProBadges();
    },
    
    /**
     * Update Pro badges visibility
     */
    updateProBadges() {
        const proBadges = document.querySelectorAll('.tool-badge.pro');
        proBadges.forEach(badge => {
            if (this.userState.plan === 'pro') {
                badge.style.display = 'none';
            } else {
                badge.style.display = 'block';
            }
        });
    },
    
    /**
     * Check trial status and show prompts
     */
    checkTrialStatus() {
        if (this.userState.plan !== 'free') return;
        
        // Show warning when low on trials
        if (this.userState.usesRemaining <= 2 && this.userState.usesRemaining > 0) {
            setTimeout(() => {
                Toast.warning(
                    Lang.get('trial.remaining').replace('{n}', this.userState.usesRemaining)
                );
            }, 1000);
        }
        
        // Show upgrade modal when trials exhausted
        if (this.userState.usesRemaining <= 0) {
            setTimeout(() => {
                this.showUpgradePrompt('trial_ended');
            }, 500);
        }
    },
    
    /**
     * Use one free trial
     */
    useFreeTrial() {
        if (this.userState.plan !== 'free') return;
        
        if (this.userState.usesRemaining > 0) {
            this.userState.usesRemaining--;
            this.saveUserState();
            this.updateUI();
            
            // Show warning at certain thresholds
            if (this.userState.usesRemaining === 2) {
                Toast.warning(Lang.get('trial.remaining').replace('{n}', 2));
            } else if (this.userState.usesRemaining === 0) {
                setTimeout(() => {
                    this.showUpgradePrompt('trial_ended');
                }, 1500);
            }
        }
    },
    
    /**
     * Check if user can access a feature
     */
    canAccess(feature) {
        const plan = this.userState.plan;
        
        // Pro-only features
        const proFeatures = ['editor', 'signature', 'stamp', 'annotations'];
        
        if (proFeatures.includes(feature)) {
            return plan === 'pro';
        }
        
        // Basic features (available to basic and pro)
        const basicFeatures = ['images', 'word', 'merge', 'camera'];
        
        if (basicFeatures.includes(feature)) {
            if (plan === 'basic' || plan === 'pro') {
                return true;
            }
            
            // Free users can use if they have remaining trials
            return this.userState.usesRemaining > 0;
        }
        
        return false;
    },
    
    /**
     * Request access to a feature
     */
    requestAccess(feature) {
        if (this.canAccess(feature)) {
            return true;
        }
        
        // Determine which prompt to show
        const proFeatures = ['editor', 'signature', 'stamp', 'annotations'];
        
        if (proFeatures.includes(feature)) {
            this.showUpgradePrompt('pro_required');
        } else if (this.userState.usesRemaining <= 0) {
            this.showUpgradePrompt('trial_ended');
        }
        
        return false;
    },
    
    /**
     * Show upgrade prompt modal
     */
    showUpgradePrompt(reason) {
        const modal = document.getElementById('upgradeModal');
        if (!modal) return;
        
        // Update modal content based on reason
        const modalBody = modal.querySelector('.modal-body');
        
        let headerText = '';
        switch (reason) {
            case 'trial_ended':
                headerText = `
                    <div style="text-align:center; padding:15px; background:var(--bg-secondary); border-radius:2px; margin-bottom:20px;">
                        <div style="font-size:2rem; margin-bottom:10px;">⏰</div>
                        <h4 style="margin-bottom:5px;">${Lang.get('trial.ended')}</h4>
                        <p style="color:var(--text-muted); font-size:0.9rem;">Upgrade to continue using all features</p>
                    </div>
                `;
                break;
            case 'pro_required':
                headerText = `
                    <div style="text-align:center; padding:15px; background:linear-gradient(135deg, #1e3a5f 0%, #0d1525 100%); border-radius:2px; margin-bottom:20px;">
                        <div style="font-size:2rem; margin-bottom:10px;">⭐</div>
                        <h4 style="margin-bottom:5px;">Pro Feature</h4>
                        <p style="color:var(--text-muted); font-size:0.9rem;">PDF Editor requires Pro plan</p>
                    </div>
                `;
                break;
            default:
                headerText = `<p>${Lang.get('upgrade.desc')}</p>`;
        }
        
        // Insert header if not already modified
        const existingHeader = modal.querySelector('.upgrade-reason-header');
        if (existingHeader) {
            existingHeader.innerHTML = headerText;
        } else {
            const headerDiv = document.createElement('div');
            headerDiv.className = 'upgrade-reason-header';
            headerDiv.innerHTML = headerText;
            modalBody.insertBefore(headerDiv, modalBody.firstChild);
        }
        
        Modal.open('upgrade');
    },
    
    /**
     * Initialize checkout process
     */
    initCheckout(planId) {
        const plan = this.plans[planId];
        if (!plan || plan.price === 0) return;
        
        // Close upgrade modal
        Modal.close('upgrade');
        
        // Show payment modal
        this.showPaymentModal(planId, plan);
    },
    
    /**
     * Show payment modal
     */
    showPaymentModal(planId, plan) {
        // Remove existing payment modal
        const existingModal = document.getElementById('paymentModal');
        if (existingModal) existingModal.remove();
        
        const modalOverlay = document.createElement('div');
        modalOverlay.className = 'modal-overlay show';
        modalOverlay.id = 'paymentModal';
        
        modalOverlay.innerHTML = `
            <div class="modal" style="max-width:450px;">
                <div class="modal-header">
                    <h3 class="modal-title">💳 Secure Checkout</h3>
                    <button class="modal-close" id="closePaymentModal">&times;</button>
                </div>
                <div class="modal-body">
                    <!-- Order Summary -->
                    <div class="order-summary" style="background:var(--bg-secondary); padding:15px; border-radius:2px; margin-bottom:20px;">
                        <div style="display:flex; justify-content:space-between; align-items:center;">
                            <div>
                                <h4 style="margin-bottom:5px;">${plan.name}</h4>
                                <p style="color:var(--text-muted); font-size:0.85rem;">One-time payment</p>
                            </div>
                            <div style="text-align:right;">
                                <div style="font-size:1.5rem; font-weight:bold; color:var(--accent);">$${plan.price.toFixed(2)}</div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Payment Methods -->
                    <div class="payment-methods">
                        <label style="display:block; margin-bottom:10px; color:var(--text-secondary); font-size:0.9rem;">
                            Select Payment Method:
                        </label>
                        
                        <!-- Stripe Button -->
                        <button class="payment-method-btn" id="payWithStripe" style="
                            width:100%;
                            padding:15px;
                            margin-bottom:10px;
                            background:linear-gradient(135deg, #635bff 0%, #4f46e5 100%);
                            border:none;
                            border-radius:2px;
                            color:white;
                            font-size:1rem;
                            font-weight:600;
                            cursor:pointer;
                            display:flex;
                            align-items:center;
                            justify-content:center;
                            gap:10px;
                            transition:all 0.2s ease;
                        ">
                            <span style="font-size:1.2rem;">💳</span>
                            Pay with Card (Stripe)
                        </button>
                        
                        <!-- PayPal Button -->
                        <button class="payment-method-btn" id="payWithPayPal" style="
                            width:100%;
                            padding:15px;
                            margin-bottom:10px;
                            background:linear-gradient(135deg, #ffc439 0%, #f0b90b 100%);
                            border:none;
                            border-radius:2px;
                            color:#003087;
                            font-size:1rem;
                            font-weight:600;
                            cursor:pointer;
                            display:flex;
                            align-items:center;
                            justify-content:center;
                            gap:10px;
                            transition:all 0.2s ease;
                        ">
                            <span style="font-size:1.2rem;">🅿️</span>
                            Pay with PayPal
                        </button>
                    </div>
                    
                    <!-- Demo Notice -->
                    <div class="demo-notice" style="
                        margin-top:20px;
                        padding:12px;
                        background:rgba(59, 130, 246, 0.1);
                        border:1px solid var(--accent);
                        border-radius:2px;
                        font-size:0.85rem;
                        color:var(--text-secondary);
                    ">
                        <strong style="color:var(--accent);">🔒 Demo Mode:</strong>
                        This is a demo. In production, this would connect to real Stripe/PayPal.
                        Click any button to simulate a successful purchase.
                    </div>
                    
                    <!-- Security Badges -->
                    <div class="security-badges" style="
                        display:flex;
                        justify-content:center;
                        gap:20px;
                        margin-top:20px;
                        padding-top:15px;
                        border-top:1px solid var(--border-default);
                    ">
                        <span style="font-size:0.8rem; color:var(--text-muted);">🔒 SSL Secured</span>
                        <span style="font-size:0.8rem; color:var(--text-muted);">💳 PCI Compliant</span>
                        <span style="font-size:0.8rem; color:var(--text-muted);">✓ Money Back</span>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modalOverlay);
        
        // Add hover effects
        const buttons = modalOverlay.querySelectorAll('.payment-method-btn');
        buttons.forEach(btn => {
            btn.addEventListener('mouseenter', () => {
                btn.style.transform = 'translateY(-2px)';
                btn.style.boxShadow = '0 4px 15px rgba(0,0,0,0.2)';
            });
            btn.addEventListener('mouseleave', () => {
                btn.style.transform = 'translateY(0)';
                btn.style.boxShadow = 'none';
            });
        });
        
        // Close modal
        const closeModal = () => {
            modalOverlay.classList.remove('show');
            setTimeout(() => modalOverlay.remove(), 300);
        };
        
        document.getElementById('closePaymentModal').addEventListener('click', closeModal);
        modalOverlay.addEventListener('click', (e) => {
            if (e.target === modalOverlay) closeModal();
        });
        
        // Payment button handlers
        document.getElementById('payWithStripe').addEventListener('click', () => {
            this.processPayment(planId, 'stripe');
            closeModal();
        });
        
        document.getElementById('payWithPayPal').addEventListener('click', () => {
            this.processPayment(planId, 'paypal');
            closeModal();
        });
    },
    
    /**
     * Process payment (Demo)
     */
    processPayment(planId, method) {
        // Show processing
        Toast.info('Processing payment...');
        
        // Simulate payment processing
        setTimeout(() => {
            this.activatePlan(planId, method);
        }, 1500);
    },
    
    /**
     * Activate purchased plan
     */
    activatePlan(planId, paymentMethod) {
        const plan = this.plans[planId];
        if (!plan) return;
        
        // Generate license key (demo)
        const licenseKey = this.generateLicenseKey(planId);
        
        // Update user state
        this.userState = {
            plan: planId,
            usesRemaining: Infinity,
            licenseKey: licenseKey,
            purchaseDate: new Date().toISOString(),
            expiryDate: null, // Lifetime for one-time payment
            paymentMethod: paymentMethod
        };
        
        this.saveUserState();
        this.updateUI();
        
        // Show success message
        this.showPurchaseSuccess(planId, licenseKey);
        
        Toast.success(Lang.get('upgrade.success'));
    },
    
    /**
     * Generate license key (Demo)
     */
    generateLicenseKey(planId) {
        const prefix = planId.toUpperCase().substring(0, 3);
        const timestamp = Date.now().toString(36).toUpperCase();
        const random = Math.random().toString(36).substring(2, 8).toUpperCase();
        return `${prefix}-${timestamp}-${random}`;
    },
    
    /**
     * Show purchase success modal
     */
    showPurchaseSuccess(planId, licenseKey) {
        const plan = this.plans[planId];
        
        // Remove existing
        const existingModal = document.getElementById('successModal');
        if (existingModal) existingModal.remove();
        
        const modalOverlay = document.createElement('div');
        modalOverlay.className = 'modal-overlay show';
        modalOverlay.id = 'successModal';
        
        modalOverlay.innerHTML = `
            <div class="modal" style="max-width:400px; text-align:center;">
                <div class="modal-body" style="padding:30px;">
                    <div style="font-size:4rem; margin-bottom:20px;">🎉</div>
                    <h2 style="margin-bottom:10px; color:var(--success);">Payment Successful!</h2>
                    <p style="color:var(--text-secondary); margin-bottom:20px;">
                        You now have access to <strong>${plan.name}</strong>
                    </p>
                    
                    <div style="
                        background:var(--bg-secondary);
                        padding:15px;
                        border-radius:2px;
                        margin-bottom:20px;
                        text-align:left;
                    ">
                        <div style="font-size:0.85rem; color:var(--text-muted); margin-bottom:5px;">
                            Your License Key:
                        </div>
                        <div style="
                            font-family:monospace;
                            font-size:1rem;
                            color:var(--accent);
                            word-break:break-all;
                        ">
                            ${licenseKey}
                        </div>
                    </div>
                    
                    <p style="font-size:0.85rem; color:var(--text-muted); margin-bottom:20px;">
                        Please save this license key for your records.
                    </p>
                    
                    <button class="btn btn-primary btn-block" id="closeSuccessModal">
                        Start Using ${plan.name}
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modalOverlay);
        
        document.getElementById('closeSuccessModal').addEventListener('click', () => {
            modalOverlay.classList.remove('show');
            setTimeout(() => modalOverlay.remove(), 300);
        });
    },
    
    /**
     * Validate license key
     */
    validateLicense(licenseKey) {
        if (!licenseKey) return false;
        
        // Basic format validation
        const pattern = /^[A-Z]{3}-[A-Z0-9]+-[A-Z0-9]+$/;
        return pattern.test(licenseKey);
    },
    
    /**
     * Restore purchase (for returning users)
     */
    restorePurchase() {
        const licenseKey = prompt('Enter your license key:');
        
        if (!licenseKey) return;
        
        if (this.validateLicense(licenseKey)) {
            // Determine plan from license key prefix
            const prefix = licenseKey.split('-')[0];
            let planId = 'basic';
            
            if (prefix === 'PRO') {
                planId = 'pro';
            } else if (prefix === 'BAS') {
                planId = 'basic';
            }
            
            this.userState = {
                plan: planId,
                usesRemaining: Infinity,
                licenseKey: licenseKey,
                purchaseDate: null,
                expiryDate: null
            };
            
            this.saveUserState();
            this.updateUI();
            
            Toast.success('License restored successfully!');
        } else {
            Toast.error('Invalid license key');
        }
    },
    
    /**
     * Reset to free plan (for testing)
     */
    resetToFree() {
        this.userState = {
            plan: 'free',
            usesRemaining: 5,
            licenseKey: null,
            purchaseDate: null,
            expiryDate: null
        };
        
        this.saveUserState();
        this.updateUI();
        
        Toast.info('Reset to free plan');
    },
    
    /**
     * Get current plan info
     */
    getCurrentPlan() {
        return {
            ...this.plans[this.userState.plan],
            ...this.userState
        };
    }
};

// ==========================================
// OVERRIDE PLAN MANAGER
// ==========================================
// Replace PlanManager functions with Payment module

const OriginalPlanManager = { ...PlanManager };

PlanManager.init = function() {
    Payment.init();
};

PlanManager.checkAccess = function(feature) {
    return Payment.requestAccess(feature);
};

PlanManager.useFreeTrial = function() {
    Payment.useFreeTrial();
};

PlanManager.setPlan = function(plan) {
    Payment.activatePlan(plan, 'direct');
};

// ==========================================
// ADD RESTORE PURCHASE LINK
// ==========================================
const addRestoreLink = () => {
    const footer = document.querySelector('.footer .container');
    if (footer && !document.getElementById('restorePurchaseLink')) {
        const restoreLink = document.createElement('p');
        restoreLink.style.marginTop = '10px';
        restoreLink.innerHTML = `
            <a href="#" id="restorePurchaseLink" style="font-size:0.8rem; color:var(--text-muted);">
                Already purchased? Restore your license
            </a>
        `;
        footer.appendChild(restoreLink);
        
        document.getElementById('restorePurchaseLink').addEventListener('click', (e) => {
            e.preventDefault();
            Payment.restorePurchase();
        });
    }
};

// ==========================================
// ADD PAYMENT STYLES
// ==========================================
const addPaymentStyles = () => {
    if (document.getElementById('paymentStyles')) return;
    
    const styles = document.createElement('style');
    styles.id = 'paymentStyles';
    styles.textContent = `
        /* Upgrade Modal Enhancements */
        #upgradeModal .modal {
            max-width: 550px;
        }
        
        #upgradeModal .card {
            transition: all 0.2s ease;
        }
        
        #upgradeModal .card:hover {
            transform: translateY(-3px);
        }
        
        /* Plan Comparison */
        .plan-features {
            list-style: none;
            padding: 0;
            margin: 15px 0;
        }
        
        .plan-features li {
            padding: 8px 0;
            padding-left: 25px;
            position: relative;
            color: var(--text-secondary);
            font-size: 0.9rem;
        }
        
        .plan-features li::before {
            content: '✓';
            position: absolute;
            left: 0;
            color: var(--success);
        }
        
        /* Trial Counter Badge */
        .trial-counter {
            position: fixed;
            bottom: 20px;
            left: 20px;
            background: var(--bg-card);
            border: 1px solid var(--border-default);
            border-radius: 2px;
            padding: 10px 15px;
            font-size: 0.85rem;
            color: var(--text-secondary);
            z-index: 100;
            display: flex;
            align-items: center;
            gap: 8px;
        }
        
        .trial-counter.low {
            border-color: var(--warning);
            color: var(--warning);
        }
        
        .trial-counter.expired {
            border-color: var(--danger);
            color: var(--danger);
        }
        
        /* Payment Button Animations */
        .payment-method-btn:active {
            transform: scale(0.98) !important;
        }
        
        /* Pro Badge Pulse */
        .tool-badge.pro {
            animation: proPulse 2s infinite;
        }
        
        @keyframes proPulse {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.7; }
        }
    `;
    
    document.head.appendChild(styles);
};

// ==========================================
// INITIALIZATION
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    Payment.init();
    addRestoreLink();
    addPaymentStyles();
});

// ==========================================
// EXPORT
// ==========================================
window.Payment = Payment;