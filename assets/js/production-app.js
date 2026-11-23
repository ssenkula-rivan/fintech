/**
 * GMG Uganda - Production Frontend Application
 * Complete production-ready implementation
 * Zero tolerance for errors
 */

// ═══════════════════════════════════════════════════════════════════════
// APPLICATION STATE
// ═══════════════════════════════════════════════════════════════════════

const AppState = {
  currentPage: 'splash-page',
  isBalanceVisible: true,
  currentModal: null,
  userData: null,
  transactions: [],
  beneficiaries: []
};

// ═══════════════════════════════════════════════════════════════════════
// INITIALIZATION
// ═══════════════════════════════════════════════════════════════════════

document.addEventListener('DOMContentLoaded', async () => {
  console.log('[APP] Initializing GMG Uganda...');

  // Test backend connection
  const isConnected = await gmgAPI.testConnection();
  if (!isConnected) {
    console.warn('[APP] Backend connection failed - check API URL');
  }

  // Show splash for 2 seconds
  setTimeout(() => {
    if (gmgAPI.isAuthenticated()) {
      console.log('[APP] User authenticated, loading dashboard...');
      showPage('mobile-app-page');
      loadDashboardData();
    } else {
      console.log('[APP] No authentication, showing login...');
      showPage('login-page');
    }
  }, 2000);

  // Setup event listeners
  setupEventListeners();
});

// ═══════════════════════════════════════════════════════════════════════
// EVENT LISTENERS
// ═══════════════════════════════════════════════════════════════════════

function setupEventListeners() {
  // Login - Send OTP
  const sendOTPBtn = document.getElementById('send-otp-btn');
  if (sendOTPBtn) {
    sendOTPBtn.addEventListener('click', sendOTP);
  }

  // Login - Phone input (Enter key)
  const phoneInput = document.getElementById('phone-number');
  if (phoneInput) {
    phoneInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') sendOTP();
    });
    // Auto-format phone number (only digits)
    phoneInput.addEventListener('input', (e) => {
      e.target.value = e.target.value.replace(/\D/g, '').substring(0, 9);
    });
  }

  // Login - OTP input (Enter key + auto-verify)
  const otpInput = document.getElementById('otp-code');
  if (otpInput) {
    otpInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') verifyOTP();
    });
    // Only allow digits
    otpInput.addEventListener('input', (e) => {
      e.target.value = e.target.value.replace(/\D/g, '').substring(0, 6);
      // Auto-verify when 6 digits entered
      if (e.target.value.length === 6) {
        setTimeout(() => verifyOTP(), 300);
      }
    });
  }

  // Close modals on background click
  document.querySelectorAll('.modal').forEach(modal => {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeModal();
    });
  });

  // Prevent form submission
  document.querySelectorAll('form').forEach(form => {
    form.addEventListener('submit', (e) => e.preventDefault());
  });
}

// ═══════════════════════════════════════════════════════════════════════
// PAGE NAVIGATION
// ═══════════════════════════════════════════════════════════════════════

function showPage(pageId) {
  console.log(`[APP] Navigating to: ${pageId}`);

  // Hide all pages
  document.querySelectorAll('.page').forEach(page => {
    page.classList.remove('active');
  });

  // Show requested page
  const targetPage = document.getElementById(pageId);
  if (targetPage) {
    targetPage.classList.add('active');
    AppState.currentPage = pageId;

    // Page-specific initialization
    if (pageId === 'mobile-app-page') {
      loadDashboardData();
    } else if (pageId === 'history-page') {
      loadTransactionHistory();
    } else if (pageId === 'profile-page') {
      loadProfileData();
    } else if (pageId === 'qr-page') {
      generateQRCode();
    } else if (pageId === 'beneficiaries-page') {
      loadBeneficiaries();
    }
  } else {
    console.error(`[APP] Page not found: ${pageId}`);
  }
}

function showCardsPage() {
  alert('Virtual cards feature coming soon!');
}

// ═══════════════════════════════════════════════════════════════════════
// MODAL MANAGEMENT
// ═══════════════════════════════════════════════════════════════════════

function openModal(modalType) {
  const modalId = `${modalType}-modal`;
  const modal = document.getElementById(modalId);

  if (modal) {
    modal.classList.add('active');
    AppState.currentModal = modalId;
    console.log(`[APP] Opened modal: ${modalType}`);

    // Clear previous input values
    modal.querySelectorAll('input').forEach(input => {
      if (input.type !== 'tel') input.value = '';
    });
  } else {
    console.error(`[APP] Modal not found: ${modalId}`);
  }
}

function closeModal() {
  if (AppState.currentModal) {
    const modal = document.getElementById(AppState.currentModal);
    if (modal) {
      modal.classList.remove('active');
    }
    AppState.currentModal = null;
    console.log('[APP] Modal closed');
  }
}

// ═══════════════════════════════════════════════════════════════════════
// AUTHENTICATION FLOW
// ═══════════════════════════════════════════════════════════════════════

async function sendOTP() {
  const phoneInput = document.getElementById('phone-number');
  const phone = phoneInput.value.trim();
  const btn = document.getElementById('send-otp-btn');
  
  // Get selected country dial code
  const dialCode = typeof getSelectedDialCode === 'function' ? getSelectedDialCode() : '+256';

  if (!phone || phone.length < 6) {
    showAlert('Please enter a valid phone number', 'error');
    phoneInput.focus();
    return;
  }

  // Show loading state
  btn.disabled = true;
  btn.innerHTML = '<span class="animate-spin inline-block">⏳</span> Sending...';

  const result = await gmgAPI.sendOTP(phone, dialCode);

  if (result.success) {
    // Show OTP step
    document.getElementById('phone-step').classList.add('hidden');
    document.getElementById('otp-step').classList.remove('hidden');
    
    // Show full phone with selected country code
    const cleanPhone = phone.replace(/^0+/, '').replace(/\D/g, '');
    document.getElementById('display-phone').textContent = `${dialCode}${cleanPhone}`;
    document.getElementById('otp-code').focus();

    showAlert('OTP sent successfully! Check your phone.', 'success');
    console.log('[AUTH] OTP sent successfully');
  } else {
    showAlert(result.error || 'Failed to send OTP. Please try again.', 'error');
    console.error('[AUTH] OTP send failed:', result.error);
  }

  // Reset button
  btn.disabled = false;
  btn.innerHTML = 'Send OTP';
}

async function verifyOTP() {
  const otpInput = document.getElementById('otp-code');
  const otp = otpInput.value.trim();
  const phone = localStorage.getItem('gmg_pending_phone') || `+256${document.getElementById('phone-number').value}`;

  if (!otp || otp.length !== 6) {
    showAlert('Please enter the 6-digit OTP', 'error');
    otpInput.focus();
    return;
  }

  // Show loading state
  showLoadingOverlay('Verifying OTP...');

  const result = await gmgAPI.verifyOTP(phone, otp);

  hideLoadingOverlay();

  if (result.success) {
    showAlert('Login successful! Welcome to GMG Uganda.', 'success');
    console.log('[AUTH] Login successful');

    // Navigate to dashboard
    setTimeout(() => {
      showPage('mobile-app-page');
      loadDashboardData();
    }, 500);
  } else {
    showAlert(result.error || 'Invalid OTP. Please try again.', 'error');
    console.error('[AUTH] OTP verification failed:', result.error);
    otpInput.value = '';
    otpInput.focus();
  }
}

function backToPhone() {
  document.getElementById('otp-step').classList.add('hidden');
  document.getElementById('phone-step').classList.remove('hidden');
  document.getElementById('phone-number').focus();
  document.getElementById('otp-code').value = '';
}

function logout() {
  if (confirm('Are you sure you want to logout?')) {
    gmgAPI.logout();
    showAlert('Logged out successfully', 'success');
    showPage('login-page');
    console.log('[AUTH] User logged out');
  }
}

// Google Sign-In Configuration
const GOOGLE_CLIENT_ID = '741987457462-3vrl286l61v4g29j6ppnn9kc0bp34bh4.apps.googleusercontent.com';

// Initialize Google Sign-In when page loads
function initGoogleSignIn() {
  if (typeof google === 'undefined' || !google.accounts) {
    console.log('[AUTH] Google SDK not loaded yet, retrying...');
    setTimeout(initGoogleSignIn, 500);
    return;
  }

  google.accounts.id.initialize({
    client_id: GOOGLE_CLIENT_ID,
    callback: handleGoogleCredentialResponse,
    auto_select: false,
    cancel_on_tap_outside: true
  });

  // Render the Google Sign-In button
  const btnContainer = document.getElementById('google-signin-btn');
  if (btnContainer) {
    google.accounts.id.renderButton(btnContainer, {
      type: 'standard',
      theme: 'outline',
      size: 'large',
      text: 'continue_with',
      shape: 'rectangular',
      width: 300
    });
  }

  console.log('[AUTH] Google Sign-In initialized');
}

// Handle Google credential response
async function handleGoogleCredentialResponse(response) {
  console.log('[AUTH] Google credential received');
  showLoadingOverlay('Signing in with Google...');

  try {
    // Decode the JWT credential to get user info
    const credential = response.credential;
    const payload = JSON.parse(atob(credential.split('.')[1]));
    
    console.log('[AUTH] Google user:', payload.email);

    // Send to backend
    const apiResponse = await fetch('http://localhost:3010/api/auth/google', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        credential: credential,
        email: payload.email,
        name: payload.name,
        picture: payload.picture
      })
    });

    const result = await apiResponse.json();
    hideLoadingOverlay();

    if (result.success) {
      // Store auth data
      localStorage.setItem('gmg_auth_token', result.data.accessToken);
      localStorage.setItem('gmg_user_phone', result.data.user.phone);
      localStorage.setItem('gmg_user_data', JSON.stringify(result.data.user));

      showAlert('Welcome! Signed in with Google.', 'success');
      setTimeout(() => {
        showPage('mobile-app-page');
        loadDashboardData();
      }, 500);
    } else {
      showAlert(result.error || 'Google Sign-In failed', 'error');
    }
  } catch (error) {
    hideLoadingOverlay();
    console.error('[AUTH] Google Sign-In error:', error);
    showAlert('Google Sign-In failed. Please try again.', 'error');
  }
}

// Initialize Google Sign-In after DOM loads
document.addEventListener('DOMContentLoaded', function() {
  setTimeout(initGoogleSignIn, 1000);
});

// ═══════════════════════════════════════════════════════════════════════
// DASHBOARD OPERATIONS
// ═══════════════════════════════════════════════════════════════════════

async function loadDashboardData() {
  console.log('[DASHBOARD] Loading data...');

  // Load balance
  const balanceResult = await gmgAPI.getBalance();
  if (balanceResult.success && balanceResult.data) {
    updateBalanceDisplay(balanceResult.data.balance || 0);
  }

  // Load user profile
  const profileResult = await gmgAPI.getUserProfile();
  if (profileResult.success && profileResult.data) {
    AppState.userData = profileResult.data;
    updateUserDisplay(profileResult.data);
  }

  // Load recent transactions
  const txnResult = await gmgAPI.getTransactions(5, 0);
  if (txnResult.success && txnResult.data) {
    const transactions = txnResult.data.transactions || txnResult.data;
    AppState.transactions = transactions;
    updateRecentTransactions(transactions);
  }

  // Update notification badge
  updateNotificationBadge(0);
}

function updateBalanceDisplay(balance) {
  const balanceElement = document.getElementById('total-balance');
  if (balanceElement) {
    balanceElement.textContent = formatMoney(balance);
  }
}

function updateUserDisplay(user) {
  const phoneDisplay = document.getElementById('user-phone-display');
  if (phoneDisplay) {
    phoneDisplay.textContent = user.phone || '';
  }

  const kycTier = document.getElementById('kyc-tier');
  if (kycTier) {
    const tier = user.kycTier || 1;
    kycTier.textContent = `TIER ${tier}`;
    kycTier.className = `kyc-tier tier-${tier}`;
  }
}

function updateRecentTransactions(transactions) {
  const listElement = document.getElementById('transactions-list');
  if (!listElement) return;

  if (!transactions || transactions.length === 0) {
    listElement.innerHTML = `
      <div class="text-center text-gray-400 py-8">
        <div class="text-4xl mb-2">📋</div>
        <p>No transactions yet</p>
      </div>`;
    return;
  }

  listElement.innerHTML = transactions.slice(0, 5).map(txn => `
    <div class="bg-white p-4 rounded-xl shadow-sm flex justify-between items-center">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center text-xl">
          ${getTransactionIcon(txn.type)}
        </div>
        <div>
          <div class="font-medium text-sm">${escapeHtml(txn.description || txn.type)}</div>
          <div class="text-xs text-gray-500">${formatDate(txn.createdAt)}</div>
        </div>
      </div>
      <div class="text-right">
        <div class="font-semibold text-sm ${isCredit(txn.type) ? 'text-green-600' : 'text-red-600'}">
          ${isCredit(txn.type) ? '+' : '-'}${formatMoney(txn.amount)}
        </div>
      </div>
    </div>
  `).join('');
}

function updateNotificationBadge(count) {
  const badge = document.getElementById('notif-badge');
  if (badge) {
    badge.textContent = count;
    badge.style.display = count > 0 ? 'flex' : 'none';
  }
}

function toggleBalanceVisibility() {
  AppState.isBalanceVisible = !AppState.isBalanceVisible;
  const balanceElement = document.getElementById('total-balance');
  if (balanceElement) {
    if (AppState.isBalanceVisible) {
      balanceElement.classList.remove('blur-sensitive');
    } else {
      balanceElement.classList.add('blur-sensitive');
    }
  }
}

// ═══════════════════════════════════════════════════════════════════════
// TRANSACTION OPERATIONS
// ═══════════════════════════════════════════════════════════════════════

async function processSendMoney() {
  const recipient = document.getElementById('send-recipient').value.trim();
  const amount = document.getElementById('send-amount').value.trim();
  const description = document.getElementById('send-description').value.trim();
  const pin = document.getElementById('send-pin').value.trim();

  if (!recipient || recipient.length !== 9) {
    showAlert('Please enter a valid 9-digit recipient phone number', 'error');
    return;
  }

  if (!amount || Number(amount) < 1000) {
    showAlert('Minimum transfer amount is UGX 1,000', 'error');
    return;
  }

  if (!pin || pin.length !== 6) {
    showAlert('Please enter your 6-digit PIN', 'error');
    return;
  }

  showLoadingOverlay('Processing transfer...');

  const result = await gmgAPI.sendMoney(recipient, amount, pin, description);

  hideLoadingOverlay();

  if (result.success) {
    showAlert(`Successfully sent UGX ${formatMoney(amount)} to +256${recipient}`, 'success');
    closeModal();
    loadDashboardData();
  } else {
    showAlert(result.error || 'Transfer failed. Please try again.', 'error');
  }
}

async function processDeposit() {
  const method = document.getElementById('deposit-method').value;
  const amount = document.getElementById('deposit-amount').value.trim();
  const phone = document.getElementById('deposit-phone').value.trim();

  if (!amount || Number(amount) < 1000) {
    showAlert('Minimum deposit amount is UGX 1,000', 'error');
    return;
  }

  if (!phone || phone.length !== 9) {
    showAlert('Please enter a valid 9-digit phone number', 'error');
    return;
  }

  showLoadingOverlay('Initiating deposit...');

  const result = await gmgAPI.deposit(amount, method, phone);

  hideLoadingOverlay();

  if (result.success) {
    showAlert(`Deposit request sent! Check your phone for the ${method} prompt.`, 'success');
    closeModal();
    setTimeout(() => loadDashboardData(), 3000);
  } else {
    showAlert(result.error || 'Deposit failed. Please try again.', 'error');
  }
}

async function processWithdraw() {
  const amount = document.getElementById('withdraw-amount').value.trim();
  const description = document.getElementById('withdraw-description').value.trim();
  const pin = document.getElementById('withdraw-pin').value.trim();

  if (!amount || Number(amount) < 1000) {
    showAlert('Minimum withdrawal amount is UGX 1,000', 'error');
    return;
  }

  if (!pin || pin.length !== 6) {
    showAlert('Please enter your 6-digit PIN', 'error');
    return;
  }

  showLoadingOverlay('Processing withdrawal...');

  const result = await gmgAPI.withdraw(amount, pin, description);

  hideLoadingOverlay();

  if (result.success) {
    showAlert(`Successfully withdrew UGX ${formatMoney(amount)}`, 'success');
    closeModal();
    loadDashboardData();
  } else {
    showAlert(result.error || 'Withdrawal failed. Please try again.', 'error');
  }
}

async function searchRecipient() {
  const input = document.getElementById('send-recipient');
  const phone = input.value.trim();
  const infoDiv = document.getElementById('recipient-info');

  if (phone.length === 9) {
    infoDiv.innerHTML = '<div class="text-xs text-gray-500 mt-1">Checking recipient...</div>';

    const result = await gmgAPI.checkRecipient(phone);

    if (result.success && result.data) {
      infoDiv.innerHTML = `<div class="text-xs text-green-600 mt-1">✓ Valid GMG user</div>`;
    } else {
      infoDiv.innerHTML = `<div class="text-xs text-yellow-600 mt-1">⚠ Not a GMG user yet</div>`;
    }
  } else {
    infoDiv.innerHTML = '';
  }
}


// ═══════════════════════════════════════════════════════════════════════
// TRANSACTION HISTORY
// ═══════════════════════════════════════════════════════════════════════

async function loadTransactionHistory() {
  showLoadingOverlay('Loading transactions...');

  const result = await gmgAPI.getTransactions(50, 0);

  hideLoadingOverlay();

  if (result.success && result.data) {
    const transactions = result.data.transactions || result.data;
    renderTransactionHistory(transactions);
  } else {
    showAlert('Failed to load transactions', 'error');
  }
}

function renderTransactionHistory(transactions) {
  const listElement = document.getElementById('history-transactions-list');
  if (!listElement) return;

  if (!transactions || transactions.length === 0) {
    listElement.innerHTML = `
      <div class="text-center text-gray-400 py-8">
        <div class="text-4xl mb-2">📋</div>
        <p>No transactions found</p>
      </div>`;
    return;
  }

  listElement.innerHTML = transactions.map(txn => `
    <div class="bg-white p-4 rounded-xl shadow-sm">
      <div class="flex justify-between items-start mb-2">
        <div class="flex items-center gap-3">
          <div class="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center text-xl">
            ${getTransactionIcon(txn.type)}
          </div>
          <div>
            <div class="font-semibold">${escapeHtml(txn.description || txn.type)}</div>
            <div class="text-xs text-gray-500">${formatDate(txn.createdAt)}</div>
          </div>
        </div>
        <div class="text-right">
          <div class="font-bold ${isCredit(txn.type) ? 'text-green-600' : 'text-red-600'}">
            ${isCredit(txn.type) ? '+' : '-'}${formatMoney(txn.amount)}
          </div>
          <div class="text-xs px-2 py-1 rounded-full ${getStatusColor(txn.status)}">${txn.status}</div>
        </div>
      </div>
      ${txn.reference ? `<div class="text-xs text-gray-400 mt-2">Ref: ${txn.reference}</div>` : ''}
    </div>
  `).join('');
}

// ═══════════════════════════════════════════════════════════════════════
// PROFILE & BENEFICIARIES
// ═══════════════════════════════════════════════════════════════════════

async function loadProfileData() {
  const result = await gmgAPI.getUserProfile();

  if (result.success && result.data) {
    const user = result.data;
    document.getElementById('profile-name').textContent = user.firstName || 'GMG User';
    document.getElementById('profile-phone').textContent = user.phone || '';

    const kycTier = document.getElementById('profile-kyc-tier');
    const tier = user.kycTier || 1;
    kycTier.textContent = `TIER ${tier}`;
    kycTier.className = `kyc-tier tier-${tier}`;
  }
}

async function loadBeneficiaries() {
  const result = await gmgAPI.getBeneficiaries();
  const listElement = document.getElementById('beneficiaries-list');

  if (!listElement) return;

  if (result.success && result.data && result.data.length > 0) {
    listElement.innerHTML = result.data.map(ben => `
      <div class="bg-white p-4 rounded-xl shadow-sm flex justify-between items-center">
        <div class="flex items-center gap-3">
          <div class="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center text-xl">👤</div>
          <div>
            <div class="font-semibold">${escapeHtml(ben.name)}</div>
            <div class="text-sm text-gray-500">${ben.phone}</div>
          </div>
        </div>
        <button onclick="deleteBeneficiary('${ben.id}')" class="text-red-500 hover:text-red-700">🗑️</button>
      </div>
    `).join('');
  } else {
    listElement.innerHTML = `
      <div class="text-center text-gray-400 py-8">
        <div class="text-4xl mb-2">👥</div>
        <p>No saved beneficiaries</p>
      </div>`;
  }
}

async function addNewBeneficiary() {
  const name = prompt('Enter beneficiary name:');
  if (!name) return;

  const phone = prompt('Enter phone number (9 digits):');
  if (!phone || phone.length !== 9) {
    showAlert('Please enter a valid 9-digit phone number', 'error');
    return;
  }

  showLoadingOverlay('Adding beneficiary...');

  const result = await gmgAPI.addBeneficiary(phone, name);

  hideLoadingOverlay();

  if (result.success) {
    showAlert('Beneficiary added successfully', 'success');
    loadBeneficiaries();
  } else {
    showAlert(result.error || 'Failed to add beneficiary', 'error');
  }
}

async function deleteBeneficiary(id) {
  if (!confirm('Remove this beneficiary?')) return;

  const result = await gmgAPI.deleteBeneficiary(id);

  if (result.success) {
    showAlert('Beneficiary removed', 'success');
    loadBeneficiaries();
  } else {
    showAlert('Failed to remove beneficiary', 'error');
  }
}

// ═══════════════════════════════════════════════════════════════════════
// QR CODE GENERATION
// ═══════════════════════════════════════════════════════════════════════

function generateQRCode() {
  const qrContainer = document.getElementById('qr-code');
  const phone = localStorage.getItem('gmg_user_phone') || '+256700000000';

  document.getElementById('qr-phone').textContent = phone;

  if (qrContainer && typeof QRCode !== 'undefined') {
    qrContainer.innerHTML = '';
    new QRCode(qrContainer, {
      text: `gmg://pay?phone=${phone}`,
      width: 200,
      height: 200,
      colorDark: '#0066FF',
      colorLight: '#ffffff'
    });
  }
}

// ═══════════════════════════════════════════════════════════════════════
// UTILITY FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════

function formatMoney(amount) {
  return new Intl.NumberFormat('en-UG', {
    style: 'decimal',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
}

function formatDate(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  const now = new Date();
  const diff = now - date;

  if (diff < 60000) return 'Just now';
  if (diff < 3600000) {
    const mins = Math.floor(diff / 60000);
    return `${mins} minute${mins > 1 ? 's' : ''} ago`;
  }
  if (diff < 86400000) {
    const hours = Math.floor(diff / 3600000);
    return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  }
  if (diff < 604800000) {
    const days = Math.floor(diff / 86400000);
    return `${days} day${days > 1 ? 's' : ''} ago`;
  }

  return date.toLocaleDateString('en-UG', {
    day: 'numeric',
    month: 'short',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
  });
}

function getTransactionIcon(type) {
  const icons = {
    'SEND': '📤',
    'RECEIVE': '📥',
    'DEPOSIT': '💵',
    'WITHDRAW': '💸',
    'AIRTIME': '📱',
    'DATA': '📶',
    'BILL': '📄',
    'send': '📤',
    'receive': '📥',
    'deposit': '💵',
    'withdrawal': '💸'
  };
  return icons[type] || '💳';
}

function isCredit(type) {
  return ['RECEIVE', 'DEPOSIT', 'CREDIT', 'receive', 'deposit'].includes(type);
}

function getStatusColor(status) {
  const colors = {
    'COMPLETED': 'bg-green-100 text-green-800',
    'completed': 'bg-green-100 text-green-800',
    'PENDING': 'bg-yellow-100 text-yellow-800',
    'pending': 'bg-yellow-100 text-yellow-800',
    'FAILED': 'bg-red-100 text-red-800',
    'failed': 'bg-red-100 text-red-800'
  };
  return colors[status] || 'bg-gray-100 text-gray-800';
}

function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function showAlert(message, type = 'info') {
  const toast = document.createElement('div');
  toast.className = `fixed top-20 left-1/2 transform -translate-x-1/2 z-[9999] px-6 py-4 rounded-xl shadow-2xl max-w-sm ${
    type === 'success' ? 'bg-green-500' : type === 'error' ? 'bg-red-500' : 'bg-blue-500'
  } text-white font-semibold text-center`;
  toast.textContent = message;

  document.body.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translate(-50%, -100%)';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

function showLoadingOverlay(message = 'Processing...') {
  let overlay = document.getElementById('loading-overlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'loading-overlay';
    overlay.className = 'fixed inset-0 bg-black/70 z-[9999] flex items-center justify-center';
    overlay.innerHTML = `
      <div class="bg-white rounded-2xl p-8 text-center shadow-2xl">
        <div class="w-16 h-16 border-4 border-purple-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p class="text-gray-800 font-semibold">${message}</p>
      </div>
    `;
    document.body.appendChild(overlay);
  }
}

function hideLoadingOverlay() {
  const overlay = document.getElementById('loading-overlay');
  if (overlay) {
    overlay.remove();
  }
}

// ═══════════════════════════════════════════════════════════════════════
// GLOBAL ERROR HANDLER
// ═══════════════════════════════════════════════════════════════════════

window.addEventListener('error', (event) => {
  console.error('[APP ERROR]', event.error);
  showAlert('An unexpected error occurred. Please try again.', 'error');
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('[APP PROMISE REJECTION]', event.reason);
  showAlert('A connection error occurred. Please check your internet.', 'error');
});

// Make functions globally available
window.showPage = showPage;
window.openModal = openModal;
window.closeModal = closeModal;
window.sendOTP = sendOTP;
window.verifyOTP = verifyOTP;
window.backToPhone = backToPhone;
window.logout = logout;
window.processSendMoney = processSendMoney;
window.processDeposit = processDeposit;
window.processWithdraw = processWithdraw;
window.searchRecipient = searchRecipient;
window.toggleBalanceVisibility = toggleBalanceVisibility;
window.showCardsPage = showCardsPage;
window.loadBeneficiaries = loadBeneficiaries;
window.addNewBeneficiary = addNewBeneficiary;
window.deleteBeneficiary = deleteBeneficiary;

console.log('[APP] GMG Uganda initialized successfully');
