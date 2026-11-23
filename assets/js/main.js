/**
 * GMG Global - Main JavaScript Implementation
 * Production-ready frontend with real API integration
 */

// API Configuration
// Change this to your API server URL
const API_BASE = window.location.hostname === 'localhost' 
    ? 'http://localhost:3000/api' 
    : '/api';
let authToken = localStorage.getItem('gmg_auth_token');
let currentUser = null;
let currentBalance = 0;

// Global state
const appState = {
    isLoading: false,
    currentPage: 'splash-page',
    user: null,
    balance: 0,
    transactions: [],
    notifications: []
};

// Initialize app
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
});

async function initializeApp() {
    try {
        // Show splash screen
        showPage('splash-page');
        
        // Check if user is logged in
        if (authToken) {
            const isValid = await validateToken();
            if (isValid) {
                await loadUserData();
                showPage('mobile-app-page');
            } else {
                localStorage.removeItem('gmg_auth_token');
                showPage('login-page');
            }
        } else {
            // Auto-transition from splash to login
            setTimeout(() => {
                showPage('login-page');
            }, 2000);
        }
        
        // Initialize Google Sign-In
        initializeGoogleSignIn();
        
        // Load country list
        renderCountryList(africanCountries);
        
    } catch (error) {
        console.error('App initialization error:', error);
        showPage('login-page');
    }
}

// Page Navigation
function showPage(pageId) {
    // Hide all pages
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });
    
    // Show target page
    const targetPage = document.getElementById(pageId);
    if (targetPage) {
        targetPage.classList.add('active');
        appState.currentPage = pageId;
        
        // Update navigation state
        updateNavigation(pageId);
        
        // Load page-specific data
        loadPageData(pageId);
    }
}

function updateNavigation(pageId) {
    // Update bottom navigation active state
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('text-purple-600');
        item.classList.add('text-gray-500');
        const fontWeight = item.querySelector('.text-xs');
        if (fontWeight) fontWeight.classList.remove('font-medium');
    });
    
    // Set active nav item based on page
    let activeNavSelector = null;
    switch(pageId) {
        case 'mobile-app-page':
            activeNavSelector = 'button[onclick="showPage(\'mobile-app-page\')"]';
            break;
        case 'history-page':
            activeNavSelector = 'button[onclick="showPage(\'history-page\')"]';
            break;
        case 'more-page':
            activeNavSelector = 'button[onclick="showPage(\'more-page\')"]';
            break;
    }
    
    if (activeNavSelector) {
        const activeNav = document.querySelector(activeNavSelector);
        if (activeNav) {
            activeNav.classList.remove('text-gray-500');
            activeNav.classList.add('text-purple-600');
            const fontWeight = activeNav.querySelector('.text-xs');
            if (fontWeight) fontWeight.classList.add('font-medium');
        }
    }
}

async function loadPageData(pageId) {
    switch(pageId) {
        case 'mobile-app-page':
            await loadDashboardData();
            break;
        case 'history-page':
            await loadTransactionHistory();
            break;
        case 'notifications-page':
            await loadNotifications();
            break;
        case 'profile-page':
            await loadProfileData();
            break;
    }
}

// Apple Sign-In Handler
function handleAppleSignIn() {
    // Show info alert for web - Apple Sign-In requires native SDK
    alert('Apple Sign-In\n\nIf you created your account with Apple Sign In on iPhone, you can access it using the same phone number you verified.\n\nPlease use your phone number to sign in.');
}

// Authentication Functions
async function sendOTP() {
    const phoneInput = document.getElementById('phone-number');
    const phone = phoneInput.value.trim();
    
    if (!phone) {
        showAlert('Please enter your phone number', 'error');
        return;
    }
    
    // Get selected country code
    const dialCode = document.getElementById('selected-dial-code').textContent;
    const fullPhone = dialCode + phone;
    
    try {
        showLoadingOverlay('Sending OTP...');
        
        const response = await fetch(`${API_BASE}/auth/send-otp`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                phone: fullPhone,
                channel: 'sms'
            })
        });
        
        const result = await response.json();
        hideLoadingOverlay();
        
        if (result.success) {
            // Show OTP step
            document.getElementById('phone-step').classList.add('hidden');
            document.getElementById('otp-step').classList.remove('hidden');
            document.getElementById('display-phone').textContent = fullPhone;
            
            // Focus OTP input
            document.getElementById('otp-code').focus();
            
            showAlert('OTP sent to your phone', 'success');
        } else {
            showAlert(result.message || 'Failed to send OTP', 'error');
        }
        
    } catch (error) {
        hideLoadingOverlay();
        console.error('Send OTP error:', error);
        showAlert('Network error. Please try again.', 'error');
    }
}

async function verifyOTP() {
    const otpInput = document.getElementById('otp-code');
    const otp = otpInput.value.trim();
    
    if (!otp || otp.length !== 6) {
        showAlert('Please enter the 6-digit OTP', 'error');
        return;
    }
    
    const dialCode = document.getElementById('selected-dial-code').textContent;
    const phone = dialCode + document.getElementById('phone-number').value.trim();
    
    try {
        showLoadingOverlay('Verifying OTP...');
        
        const response = await fetch(`${API_BASE}/auth/verify-otp`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                phone: phone,
                otp: otp
            })
        });
        
        const result = await response.json();
        hideLoadingOverlay();
        
        if (result.success) {
            // Store auth token
            authToken = result.data.accessToken;
            localStorage.setItem('gmg_auth_token', authToken);
            
            // Store user data
            currentUser = result.data.user;
            localStorage.setItem('gmg_user', JSON.stringify(currentUser));
            
            // Navigate to main app
            showPage('mobile-app-page');
            await loadUserData();
            
            showAlert('Login successful!', 'success');
        } else {
            showAlert(result.message || 'Invalid OTP', 'error');
            
            // Show remaining attempts if available
            if (result.attemptsRemaining !== undefined) {
                showAlert(`${result.attemptsRemaining} attempts remaining`, 'warning');
            }
        }
        
    } catch (error) {
        hideLoadingOverlay();
        console.error('Verify OTP error:', error);
        showAlert('Network error. Please try again.', 'error');
    }
}

function backToPhone() {
    document.getElementById('otp-step').classList.add('hidden');
    document.getElementById('phone-step').classList.remove('hidden');
    document.getElementById('otp-code').value = '';
}

async function validateToken() {
    if (!authToken) return false;
    
    try {
        const response = await fetch(`${API_BASE}/auth/validate`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            }
        });
        
        const result = await response.json();
        return result.success && result.valid;
        
    } catch (error) {
        console.error('Token validation error:', error);
        return false;
    }
}

// Google Sign-In
function initializeGoogleSignIn() {
    if (typeof google !== 'undefined' && google.accounts) {
        google.accounts.id.initialize({
            client_id: 'YOUR_GOOGLE_CLIENT_ID', // Replace with actual client ID
            callback: handleGoogleSignIn,
            auto_select: false
        });
        
        google.accounts.id.renderButton(
            document.getElementById('google-signin-btn'),
            {
                theme: 'outline',
                size: 'large',
                width: '100%',
                text: 'signin_with'
            }
        );
    }
}

async function handleGoogleSignIn(response) {
    try {
        showLoadingOverlay('Signing in with Google...');
        
        const result = await fetch(`${API_BASE}/auth/google`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                credential: response.credential
            })
        });
        
        const data = await result.json();
        hideLoadingOverlay();
        
        if (data.success) {
            authToken = data.data.accessToken;
            localStorage.setItem('gmg_auth_token', authToken);
            
            currentUser = data.data.user;
            localStorage.setItem('gmg_user', JSON.stringify(currentUser));
            
            showPage('mobile-app-page');
            await loadUserData();
            
            showAlert(data.message, 'success');
        } else {
            showAlert(data.message || 'Google sign-in failed', 'error');
        }
        
    } catch (error) {
        hideLoadingOverlay();
        console.error('Google sign-in error:', error);
        showAlert('Google sign-in failed', 'error');
    }
}

// User Data Functions
async function loadUserData() {
    try {
        // Load user profile
        const userResponse = await apiCall('/auth/validate', 'POST');
        if (userResponse.success) {
            currentUser = userResponse.data.user;
            updateUserDisplay();
        }
        
        // Load wallet balance
        const balanceResponse = await apiCall('/wallet/balance', 'GET');
        if (balanceResponse.success) {
            const wallet = balanceResponse.data.wallets ? balanceResponse.data.wallets[0] : balanceResponse.data;
            currentBalance = wallet.balance;
            updateBalanceDisplay();
        }
        
    } catch (error) {
        console.error('Load user data error:', error);
    }
}

function updateUserDisplay() {
    if (!currentUser) return;
    
    // Update phone display
    const phoneDisplay = document.getElementById('user-phone-display');
    if (phoneDisplay) {
        phoneDisplay.textContent = currentUser.phone || '';
    }
    
    // Update profile page
    const profileName = document.getElementById('profile-name');
    const profilePhone = document.getElementById('profile-phone');
    
    if (profileName) {
        profileName.textContent = `${currentUser.firstName || ''} ${currentUser.lastName || ''}`.trim() || 'GMG User';
    }
    
    if (profilePhone) {
        profilePhone.textContent = currentUser.phone || '';
    }
    
    // Update KYC tier
    const kycTier = document.getElementById('kyc-tier');
    const profileKycTier = document.getElementById('profile-kyc-tier');
    
    if (kycTier) {
        kycTier.textContent = `${currentUser.kycTier || 'TIER_0'} - ${getKycTierName(currentUser.kycTier)}`;
        kycTier.className = `kyc-tier ${getKycTierClass(currentUser.kycTier)}`;
    }
    
    if (profileKycTier) {
        profileKycTier.textContent = currentUser.kycTier || 'TIER_0';
        profileKycTier.className = `kyc-tier ${getKycTierClass(currentUser.kycTier)}`;
    }
}

function updateBalanceDisplay() {
    const balanceElement = document.getElementById('total-balance');
    if (balanceElement) {
        balanceElement.textContent = `UGX ${formatMoney(currentBalance)}`;
    }
}

function getKycTierName(tier) {
    const names = {
        'TIER_0': 'Basic',
        'TIER_1': 'Verified',
        'TIER_2': 'Premium',
        'TIER_3': 'VIP'
    };
    return names[tier] || 'Basic';
}

function getKycTierClass(tier) {
    const classes = {
        'TIER_0': 'tier-0',
        'TIER_1': 'tier-1',
        'TIER_2': 'tier-2',
        'TIER_3': 'tier-3'
    };
    return classes[tier] || 'tier-0';
}

// Dashboard Functions
async function loadDashboardData() {
    try {
        // Load recent transactions
        const txnResponse = await apiCall('/transactions?limit=5', 'GET');
        if (txnResponse.success) {
            updateRecentTransactions(txnResponse.data.transactions || []);
        }
        
        // Load notifications count
        const notifResponse = await apiCall('/notifications?unread=true', 'GET');
        if (notifResponse.success) {
            updateNotificationBadge(notifResponse.data.unreadCount || 0);
        }
        
    } catch (error) {
        console.error('Load dashboard error:', error);
    }
}

function updateRecentTransactions(transactions) {
    const container = document.getElementById('transactions-list');
    if (!container) return;
    
    if (transactions.length === 0) {
        container.innerHTML = `
            <div class="text-center text-gray-400 py-8">
                <div class="text-4xl mb-2">📋</div>
                <p>No transactions yet</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = transactions.map(txn => `
        <div class="bg-white p-4 rounded-xl shadow-sm flex justify-between items-center">
            <div class="flex items-center gap-3">
                <div class="w-10 h-10 ${getTransactionIcon(txn.transaction_type)} rounded-full flex items-center justify-center text-xl">
                    ${getTransactionEmoji(txn.transaction_type)}
                </div>
                <div>
                    <p class="font-semibold text-gray-800">${getTransactionTitle(txn)}</p>
                    <p class="text-sm text-gray-500">${formatDate(txn.created_at)}</p>
                </div>
            </div>
            <div class="text-right">
                <p class="font-bold ${getAmountColor(txn.transaction_type)}">
                    ${getAmountPrefix(txn.transaction_type)}UGX ${formatMoney(txn.amount)}
                </p>
                <p class="text-xs ${getStatusColor(txn.status)}">${txn.status}</p>
            </div>
        </div>
    `).join('');
}

// Transaction Helper Functions
function getTransactionIcon(type) {
    const icons = {
        'DEPOSIT': 'bg-green-100',
        'WITHDRAWAL': 'bg-red-100',
        'TRANSFER': 'bg-blue-100',
        'AIRTIME': 'bg-purple-100',
        'DATA': 'bg-indigo-100',
        'BILL': 'bg-yellow-100'
    };
    return icons[type] || 'bg-gray-100';
}

function getTransactionEmoji(type) {
    const emojis = {
        'DEPOSIT': '💵',
        'WITHDRAWAL': '💸',
        'TRANSFER': '📤',
        'AIRTIME': '📱',
        'DATA': '📶',
        'BILL': '💡'
    };
    return emojis[type] || '💳';
}

function getTransactionTitle(txn) {
    if (txn.transaction_type === 'TRANSFER') {
        return txn.counterparty_name || txn.counterparty_phone || 'Money Transfer';
    }
    return txn.description || txn.transaction_type;
}

function getAmountColor(type) {
    return ['DEPOSIT'].includes(type) ? 'text-green-600' : 'text-red-600';
}

function getAmountPrefix(type) {
    return ['DEPOSIT'].includes(type) ? '+' : '-';
}

function getStatusColor(status) {
    const colors = {
        'COMPLETED': 'text-green-600',
        'PENDING': 'text-yellow-600',
        'FAILED': 'text-red-600'
    };
    return colors[status] || 'text-gray-600';
}

// Modal Functions
function openModal(modalType) {
    const modalId = modalType + '-modal';
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('active');
        
        // Pre-fill user phone for certain modals
        if (['deposit', 'airtime', 'data'].includes(modalType)) {
            const phoneInput = document.getElementById(`${modalType}-phone`);
            if (phoneInput && currentUser?.phone) {
                const phone = currentUser.phone.replace('+256', '');
                phoneInput.value = phone;
            }
        }
    }
}

function closeModal() {
    document.querySelectorAll('.modal').forEach(modal => {
        modal.classList.remove('active');
    });
    
    // Clear form inputs
    document.querySelectorAll('.modal input').forEach(input => {
        if (input.type !== 'radio' && input.type !== 'checkbox') {
            input.value = '';
        }
    });
}

// Transaction Processing Functions
async function processSendMoney() {
    const recipient = document.getElementById('send-recipient').value.trim();
    const amount = parseFloat(document.getElementById('send-amount').value);
    const description = document.getElementById('send-description').value.trim();
    const pin = document.getElementById('send-pin').value.trim();
    
    if (!recipient || !amount || !pin) {
        showAlert('Please fill in all required fields', 'error');
        return;
    }
    
    if (amount < 1000) {
        showAlert('Minimum amount is UGX 1,000', 'error');
        return;
    }
    
    if (pin.length !== 6) {
        showAlert('PIN must be 6 digits', 'error');
        return;
    }
    
    try {
        showLoadingOverlay('Processing transfer...');
        
        const response = await apiCall('/transactions/send', 'POST', {
            recipient_phone: '+256' + recipient,
            amount: amount,
            description: description,
            pin: pin
        });
        
        hideLoadingOverlay();
        
        if (response.success) {
            closeModal();
            showAlert('Money sent successfully!', 'success');
            
            // Update balance and transactions
            await loadUserData();
            await loadDashboardData();
        } else {
            showAlert(response.message || 'Transfer failed', 'error');
        }
        
    } catch (error) {
        hideLoadingOverlay();
        console.error('Send money error:', error);
        showAlert('Transfer failed. Please try again.', 'error');
    }
}

async function processDeposit() {
    const method = document.getElementById('deposit-method').value;
    const amount = parseFloat(document.getElementById('deposit-amount').value);
    const phone = document.getElementById('deposit-phone').value.trim();
    
    if (!method || !amount || !phone) {
        showAlert('Please fill in all fields', 'error');
        return;
    }
    
    if (amount < 1000) {
        showAlert('Minimum deposit is UGX 1,000', 'error');
        return;
    }
    
    try {
        showLoadingOverlay('Initiating deposit...');
        
        const response = await apiCall('/transactions/deposit', 'POST', {
            method: method,
            amount: amount,
            phone: '+256' + phone
        });
        
        hideLoadingOverlay();
        
        if (response.success) {
            closeModal();
            showAlert(response.data.paymentInstructions || 'Deposit request sent to your phone', 'success');
            
            // Refresh data
            await loadUserData();
        } else {
            showAlert(response.message || 'Deposit failed', 'error');
        }
        
    } catch (error) {
        hideLoadingOverlay();
        console.error('Deposit error:', error);
        showAlert('Deposit failed. Please try again.', 'error');
    }
}

// Utility Functions
async function apiCall(endpoint, method = 'GET', data = null) {
    const config = {
        method: method,
        headers: {
            'Content-Type': 'application/json'
        }
    };
    
    if (authToken) {
        config.headers['Authorization'] = `Bearer ${authToken}`;
    }
    
    if (data && method !== 'GET') {
        config.body = JSON.stringify(data);
    }
    
    const response = await fetch(`${API_BASE}${endpoint}`, config);
    
    if (response.status === 401) {
        // Token expired, redirect to login
        localStorage.removeItem('gmg_auth_token');
        localStorage.removeItem('gmg_user');
        showPage('login-page');
        throw new Error('Authentication required');
    }
    
    return await response.json();
}

function showLoadingOverlay(message = 'Loading...') {
    let overlay = document.getElementById('loading-overlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'loading-overlay';
        overlay.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
        overlay.innerHTML = `
            <div class="bg-white rounded-2xl p-6 text-center">
                <div class="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p class="text-gray-700 font-medium">${message}</p>
            </div>
        `;
        document.body.appendChild(overlay);
    } else {
        overlay.querySelector('p').textContent = message;
        overlay.classList.remove('hidden');
    }
}

function hideLoadingOverlay() {
    const overlay = document.getElementById('loading-overlay');
    if (overlay) {
        overlay.classList.add('hidden');
    }
}

function showAlert(message, type = 'info') {
    const alertDiv = document.createElement('div');
    alertDiv.className = `fixed top-4 left-4 right-4 max-w-md mx-auto z-50 p-4 rounded-xl shadow-lg ${getAlertClass(type)} fade-in`;
    alertDiv.innerHTML = `
        <div class="flex items-center gap-3">
            <span class="text-xl">${getAlertIcon(type)}</span>
            <p class="font-medium">${message}</p>
        </div>
    `;
    
    document.body.appendChild(alertDiv);
    
    // Auto remove after 4 seconds
    setTimeout(() => {
        alertDiv.remove();
    }, 4000);
}

function getAlertClass(type) {
    const classes = {
        'success': 'bg-green-100 text-green-800 border border-green-200',
        'error': 'bg-red-100 text-red-800 border border-red-200',
        'warning': 'bg-yellow-100 text-yellow-800 border border-yellow-200',
        'info': 'bg-blue-100 text-blue-800 border border-blue-200'
    };
    return classes[type] || classes.info;
}

function getAlertIcon(type) {
    const icons = {
        'success': '✅',
        'error': '❌',
        'warning': '⚠️',
        'info': 'ℹ️'
    };
    return icons[type] || icons.info;
}

function formatMoney(amount) {
    return new Intl.NumberFormat('en-UG').format(amount || 0);
}

function formatDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) {
        return 'Today';
    } else if (diffDays === 2) {
        return 'Yesterday';
    } else if (diffDays <= 7) {
        return `${diffDays - 1} days ago`;
    } else {
        return date.toLocaleDateString('en-UG');
    }
}

function toggleBalanceVisibility() {
    const balanceElement = document.getElementById('total-balance');
    if (balanceElement) {
        if (balanceElement.textContent.includes('*')) {
            balanceElement.textContent = `UGX ${formatMoney(currentBalance)}`;
        } else {
            balanceElement.textContent = 'UGX ****';
        }
    }
}

function logout() {
    if (confirm('Are you sure you want to logout?')) {
        localStorage.removeItem('gmg_auth_token');
        localStorage.removeItem('gmg_user');
        authToken = null;
        currentUser = null;
        showPage('login-page');
        showAlert('Logged out successfully', 'success');
    }
}

// Additional helper functions for missing functionality
function searchRecipient() {
    // Implement recipient search/validation
    const phone = document.getElementById('send-recipient').value;
    const infoDiv = document.getElementById('recipient-info');
    
    if (phone.length >= 9) {
        infoDiv.innerHTML = '<p class="text-sm text-green-600">✓ Valid phone number</p>';
    } else {
        infoDiv.innerHTML = '';
    }
}

function setAirtimeAmount(amount) {
    document.getElementById('airtime-amount').value = amount;
}

function showCardsPage() {
    // Redirect to crypto wallet for now
    window.location.href = 'crypto-wallet.html';
}

// Export functions for global access
window.showPage = showPage;
window.openModal = openModal;
window.closeModal = closeModal;
window.sendOTP = sendOTP;
window.verifyOTP = verifyOTP;
window.backToPhone = backToPhone;
window.handleAppleSignIn = handleAppleSignIn;
window.processSendMoney = processSendMoney;
window.processDeposit = processDeposit;
window.searchRecipient = searchRecipient;
window.setAirtimeAmount = setAirtimeAmount;
window.toggleBalanceVisibility = toggleBalanceVisibility;
window.logout = logout;
window.showCardsPage = showCardsPage;