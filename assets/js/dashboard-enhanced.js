/**
 * GMG Uganda - Enhanced Dashboard Module
 * Integrates with existing production-app.js and gmg-api-client.js
 * Zero tolerance for errors - production ready
 */

// ═══════════════════════════════════════════════════════════════════════
// ENHANCED DASHBOARD CONTROLLER
// ═══════════════════════════════════════════════════════════════════════

const Dashboard = {
    // State
    balance: 0,
    balanceVisible: true,
    transactions: [],
    isLoading: false,
    refreshInterval: null,
    lastRefresh: null,

    // ═══════════════════════════════════════════════════════════════════
    // INITIALIZATION
    // ═══════════════════════════════════════════════════════════════════

    async init() {
        console.log('[Dashboard] Initializing...');
        
        if (!gmgAPI.isAuthenticated()) {
            console.log('[Dashboard] Not authenticated, skipping init');
            return;
        }

        try {
            await Promise.all([
                this.loadBalance(),
                this.loadTransactions(),
                this.loadUserProfile()
            ]);
            
            this.updateGreeting();
            this.startAutoRefresh();
            this.lastRefresh = Date.now();
            
            console.log('[Dashboard] Initialized successfully');
        } catch (error) {
            console.error('[Dashboard] Init error:', error);
        }
    },

    // ═══════════════════════════════════════════════════════════════════
    // DATA LOADING
    // ═══════════════════════════════════════════════════════════════════

    async loadBalance() {
        try {
            const result = await gmgAPI.getBalance();
            
            if (result.success && result.data) {
                // Handle different response structures
                this.balance = result.data.balance || 
                               result.data.data?.balance || 
                               result.data.availableBalance || 
                               0;
                this.updateBalanceDisplay();
            }
        } catch (error) {
            console.error('[Dashboard] Load balance error:', error);
        }
    },

    async loadTransactions() {
        try {
            const result = await gmgAPI.getTransactions(10, 0);
            
            if (result.success && result.data) {
                // Handle different response structures
                this.transactions = result.data.transactions || 
                                   result.data.data?.transactions || 
                                   result.data || 
                                   [];
                this.renderTransactions();
            }
        } catch (error) {
            console.error('[Dashboard] Load transactions error:', error);
        }
    },

    async loadUserProfile() {
        try {
            const result = await gmgAPI.getUserProfile();
            
            if (result.success && result.data) {
                const user = result.data.user || result.data.data?.user || result.data;
                this.updateUserDisplay(user);
            }
        } catch (error) {
            console.error('[Dashboard] Load profile error:', error);
        }
    },

    // ═══════════════════════════════════════════════════════════════════
    // UI UPDATES
    // ═══════════════════════════════════════════════════════════════════

    updateBalanceDisplay() {
        const balanceEl = document.getElementById('total-balance');
        const balanceUsdEl = document.getElementById('balance-usd');
        
        if (balanceEl) {
            if (this.balanceVisible) {
                balanceEl.textContent = `UGX ${this.formatNumber(this.balance)}`;
                balanceEl.classList.remove('blur-sensitive');
                
                if (balanceUsdEl) {
                    const usdValue = (this.balance / 3750).toFixed(2);
                    balanceUsdEl.textContent = `≈ $${this.formatNumber(usdValue)} USD`;
                }
            } else {
                balanceEl.textContent = '••••••••';
                balanceEl.classList.add('blur-sensitive');
                
                if (balanceUsdEl) {
                    balanceUsdEl.textContent = '••••••';
                }
            }
        }
    },

    toggleBalance() {
        this.balanceVisible = !this.balanceVisible;
        this.updateBalanceDisplay();
        
        // Update eye icon if exists
        const eyeBtn = document.querySelector('[onclick*="toggleBalance"]');
        if (eyeBtn) {
            eyeBtn.textContent = this.balanceVisible ? '👁️' : '🙈';
        }
    },

    updateUserDisplay(user) {
        // Update phone display
        const phoneDisplay = document.getElementById('user-phone-display');
        if (phoneDisplay) {
            phoneDisplay.textContent = user.phone || user.phone_number || '';
        }

        // Update profile name
        const profileName = document.getElementById('profile-name');
        if (profileName) {
            const name = user.first_name || user.firstName || user.name || 'GMG User';
            profileName.textContent = name;
        }

        // Update KYC tier
        const kycTier = document.getElementById('kyc-tier');
        const profileKycTier = document.getElementById('profile-kyc-tier');
        const tier = user.kyc_tier || user.kycTier || 1;
        
        [kycTier, profileKycTier].forEach(el => {
            if (el) {
                el.textContent = `TIER ${tier}`;
                el.className = `kyc-tier tier-${tier}`;
            }
        });
    },

    updateGreeting() {
        const greetingEl = document.getElementById('user-greeting');
        if (greetingEl) {
            greetingEl.textContent = this.getGreeting();
        }
    },

    getGreeting() {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good Morning';
        if (hour < 17) return 'Good Afternoon';
        return 'Good Evening';
    },

    // ═══════════════════════════════════════════════════════════════════
    // TRANSACTION RENDERING
    // ═══════════════════════════════════════════════════════════════════

    renderTransactions() {
        const container = document.getElementById('transactions-list');
        if (!container) return;

        if (!this.transactions || this.transactions.length === 0) {
            container.innerHTML = `
                <div class="text-center text-gray-400 py-8">
                    <div class="text-4xl mb-2">📋</div>
                    <p>No transactions yet</p>
                    <p class="text-sm mt-2">Your transactions will appear here</p>
                </div>`;
            return;
        }

        container.innerHTML = this.transactions.slice(0, 5).map(tx => {
            const isCredit = this.isCredit(tx.transaction_type || tx.type);
            const icon = this.getTransactionIcon(tx.transaction_type || tx.type);
            const statusClass = this.getStatusClass(tx.status);
            
            return `
                <div class="bg-white p-4 rounded-xl shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                     onclick="Dashboard.showTransactionDetails('${tx.id}')">
                    <div class="flex justify-between items-center">
                        <div class="flex items-center gap-3">
                            <div class="w-12 h-12 rounded-full flex items-center justify-center text-xl ${isCredit ? 'bg-green-100' : 'bg-red-100'}">
                                ${icon}
                            </div>
                            <div>
                                <div class="font-semibold text-gray-800 text-sm">
                                    ${this.escapeHtml(this.getTransactionTitle(tx))}
                                </div>
                                <div class="text-xs text-gray-500 mt-1">
                                    ${this.formatRelativeTime(tx.created_at || tx.createdAt)}
                                </div>
                            </div>
                        </div>
                        <div class="text-right">
                            <div class="font-bold text-sm ${isCredit ? 'text-green-600' : 'text-red-600'}">
                                ${isCredit ? '+' : '-'}UGX ${this.formatNumber(Math.abs(tx.amount))}
                            </div>
                            <div class="text-xs px-2 py-1 rounded-full mt-1 inline-block ${statusClass}">
                                ${tx.status}
                            </div>
                        </div>
                    </div>
                </div>`;
        }).join('');
    },

    showTransactionDetails(txId) {
        const tx = this.transactions.find(t => t.id == txId);
        if (!tx) return;

        const isCredit = this.isCredit(tx.transaction_type || tx.type);
        const details = `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━
       TRANSACTION DETAILS
━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Reference: ${tx.reference || 'N/A'}
Type: ${tx.transaction_type || tx.type}
Amount: ${isCredit ? '+' : '-'}UGX ${this.formatNumber(Math.abs(tx.amount))}
Fee: UGX ${this.formatNumber(tx.fee || 0)}
Status: ${tx.status}

${tx.counterparty_name ? `Recipient: ${tx.counterparty_name}` : ''}
${tx.counterparty_phone ? `Phone: ${tx.counterparty_phone}` : ''}
${tx.description ? `Note: ${tx.description}` : ''}

Date: ${new Date(tx.created_at || tx.createdAt).toLocaleString()}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;

        alert(details);
    },

    // ═══════════════════════════════════════════════════════════════════
    // HELPER FUNCTIONS
    // ═══════════════════════════════════════════════════════════════════

    getTransactionIcon(type) {
        const icons = {
            'SEND': '📤', 'send': '📤',
            'RECEIVE': '📥', 'receive': '📥',
            'DEPOSIT': '💰', 'deposit': '💰',
            'WITHDRAW': '💸', 'withdrawal': '💸', 'WITHDRAWAL': '💸',
            'TRANSFER': '🔄', 'transfer': '🔄',
            'AIRTIME': '📱', 'airtime': '📱',
            'DATA': '📶', 'data': '📶',
            'BILL': '💡', 'bill': '💡',
            'EXCHANGE': '💱', 'exchange': '💱',
            'CRYPTO_BUY': '₿', 'CRYPTO_SELL': '₿'
        };
        return icons[type] || '💳';
    },

    getTransactionTitle(tx) {
        const type = tx.transaction_type || tx.type;
        
        const titles = {
            'SEND': `Sent to ${tx.counterparty_name || tx.recipient_name || 'User'}`,
            'RECEIVE': `Received from ${tx.counterparty_name || tx.sender_name || 'User'}`,
            'DEPOSIT': `Deposit via ${tx.payment_method || tx.method || 'Mobile Money'}`,
            'WITHDRAW': `Withdraw to ${tx.payment_method || tx.method || 'Mobile Money'}`,
            'WITHDRAWAL': `Withdraw to ${tx.payment_method || tx.method || 'Mobile Money'}`,
            'TRANSFER': 'Transfer',
            'AIRTIME': 'Airtime Purchase',
            'DATA': 'Data Bundle',
            'BILL': `${tx.biller || 'Bill'} Payment`,
            'EXCHANGE': 'Currency Exchange',
            'CRYPTO_BUY': 'Crypto Purchase',
            'CRYPTO_SELL': 'Crypto Sale'
        };
        
        return titles[type] || tx.description || type || 'Transaction';
    },

    isCredit(type) {
        return ['RECEIVE', 'DEPOSIT', 'CREDIT', 'receive', 'deposit', 'credit'].includes(type);
    },

    getStatusClass(status) {
        const classes = {
            'COMPLETED': 'bg-green-100 text-green-800',
            'completed': 'bg-green-100 text-green-800',
            'PENDING': 'bg-yellow-100 text-yellow-800',
            'pending': 'bg-yellow-100 text-yellow-800',
            'PROCESSING': 'bg-blue-100 text-blue-800',
            'processing': 'bg-blue-100 text-blue-800',
            'FAILED': 'bg-red-100 text-red-800',
            'failed': 'bg-red-100 text-red-800',
            'CANCELLED': 'bg-gray-100 text-gray-800',
            'cancelled': 'bg-gray-100 text-gray-800'
        };
        return classes[status] || 'bg-gray-100 text-gray-800';
    },

    formatNumber(num) {
        if (num === null || num === undefined) return '0';
        return new Intl.NumberFormat('en-UG').format(num);
    },

    formatRelativeTime(dateString) {
        if (!dateString) return '';
        
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
        if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
        if (diffDays === 1) return 'Yesterday';
        if (diffDays < 7) return `${diffDays} days ago`;
        
        return date.toLocaleDateString('en-UG', { 
            month: 'short', 
            day: 'numeric',
            year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
        });
    },

    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    },

    // ═══════════════════════════════════════════════════════════════════
    // AUTO REFRESH
    // ═══════════════════════════════════════════════════════════════════

    startAutoRefresh() {
        // Clear existing interval
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
        }

        // Refresh balance every 30 seconds
        this.refreshInterval = setInterval(() => {
            if (document.visibilityState === 'visible' && gmgAPI.isAuthenticated()) {
                this.loadBalance();
            }
        }, 30000);

        // Refresh transactions every 60 seconds
        setInterval(() => {
            if (document.visibilityState === 'visible' && gmgAPI.isAuthenticated()) {
                this.loadTransactions();
            }
        }, 60000);

        console.log('[Dashboard] Auto-refresh started');
    },

    stopAutoRefresh() {
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
            this.refreshInterval = null;
        }
    },

    // Manual refresh
    async refresh() {
        if (this.isLoading) return;
        
        this.isLoading = true;
        console.log('[Dashboard] Manual refresh...');

        try {
            await Promise.all([
                this.loadBalance(),
                this.loadTransactions()
            ]);
            this.lastRefresh = Date.now();
            showAlert('Dashboard refreshed', 'success');
        } catch (error) {
            console.error('[Dashboard] Refresh error:', error);
            showAlert('Failed to refresh', 'error');
        } finally {
            this.isLoading = false;
        }
    }
};


// ═══════════════════════════════════════════════════════════════════════
// QUICK ACTIONS HANDLER
// ═══════════════════════════════════════════════════════════════════════

const QuickActions = {
    
    // Deposit with proper modal handling
    async deposit() {
        const modal = document.getElementById('deposit-modal');
        if (modal) {
            openModal('deposit');
            return;
        }

        // Fallback if modal doesn't exist
        const method = await this.selectOption('Select deposit method:', [
            { value: 'MTN', label: '📱 MTN Mobile Money' },
            { value: 'AIRTEL', label: '📱 Airtel Money' },
            { value: 'BANK', label: '🏦 Bank Transfer' }
        ]);
        
        if (!method) return;

        const amount = await this.promptAmount('Enter deposit amount (UGX):', 1000);
        if (!amount) return;

        const phone = prompt('Enter phone number for payment (9 digits):');
        if (!phone || phone.length !== 9) {
            showAlert('Invalid phone number', 'error');
            return;
        }

        showLoadingOverlay('Initiating deposit...');

        const result = await gmgAPI.deposit(amount, method, phone);

        hideLoadingOverlay();

        if (result.success) {
            showAlert(`✅ Deposit initiated! Check your phone for the ${method} prompt.`, 'success');
            setTimeout(() => Dashboard.refresh(), 3000);
        } else {
            showAlert(`❌ ${result.error || 'Deposit failed'}`, 'error');
        }
    },

    // Send money with validation
    async send() {
        const modal = document.getElementById('send-modal');
        if (modal) {
            openModal('send');
            return;
        }

        // Fallback
        const recipient = prompt('Enter recipient phone number (9 digits):');
        if (!recipient || recipient.length !== 9) {
            showAlert('Invalid phone number', 'error');
            return;
        }

        const amount = await this.promptAmount('Enter amount to send (UGX):', 1000);
        if (!amount) return;

        const note = prompt('Add a note (optional):') || '';

        const pin = prompt('Enter your 6-digit PIN:');
        if (!pin || pin.length !== 6) {
            showAlert('Invalid PIN', 'error');
            return;
        }

        showLoadingOverlay('Processing transfer...');

        const result = await gmgAPI.sendMoney(recipient, amount, pin, note);

        hideLoadingOverlay();

        if (result.success) {
            showAlert(`✅ Successfully sent UGX ${Dashboard.formatNumber(amount)} to +256${recipient}`, 'success');
            Dashboard.refresh();
        } else {
            showAlert(`❌ ${result.error || 'Transfer failed'}`, 'error');
        }
    },

    // Withdraw
    async withdraw() {
        const modal = document.getElementById('withdraw-modal');
        if (modal) {
            openModal('withdraw');
            return;
        }

        const amount = await this.promptAmount('Enter withdrawal amount (UGX):', 1000);
        if (!amount) return;

        const pin = prompt('Enter your 6-digit PIN:');
        if (!pin || pin.length !== 6) {
            showAlert('Invalid PIN', 'error');
            return;
        }

        showLoadingOverlay('Processing withdrawal...');

        const result = await gmgAPI.withdraw(amount, pin, 'Withdrawal');

        hideLoadingOverlay();

        if (result.success) {
            showAlert(`✅ Successfully withdrew UGX ${Dashboard.formatNumber(amount)}`, 'success');
            Dashboard.refresh();
        } else {
            showAlert(`❌ ${result.error || 'Withdrawal failed'}`, 'error');
        }
    },

    // Buy airtime
    async buyAirtime() {
        const modal = document.getElementById('airtime-modal');
        if (modal) {
            openModal('airtime');
            return;
        }

        const network = await this.selectOption('Select network:', [
            { value: 'MTN', label: '🟡 MTN Uganda' },
            { value: 'AIRTEL', label: '🔴 Airtel Uganda' },
            { value: 'AFRICELL', label: '🟣 Africell' }
        ]);
        
        if (!network) return;

        const phone = prompt('Enter phone number (9 digits):');
        if (!phone || phone.length !== 9) {
            showAlert('Invalid phone number', 'error');
            return;
        }

        const amount = await this.promptAmount('Enter airtime amount (UGX):', 500);
        if (!amount) return;

        const pin = prompt('Enter your 6-digit PIN:');
        if (!pin || pin.length !== 6) {
            showAlert('Invalid PIN', 'error');
            return;
        }

        showLoadingOverlay('Purchasing airtime...');

        // Use generic transaction endpoint
        const result = await gmgAPI.request('/transactions/airtime', 'POST', {
            network,
            phone: `+256${phone}`,
            amount: Number(amount),
            pin
        }, true);

        hideLoadingOverlay();

        if (result.success) {
            showAlert(`✅ Airtime of UGX ${Dashboard.formatNumber(amount)} sent to +256${phone}`, 'success');
            Dashboard.refresh();
        } else {
            showAlert(`❌ ${result.error || 'Airtime purchase failed'}`, 'error');
        }
    },

    // Currency exchange
    async exchange() {
        const modal = document.getElementById('exchange-modal');
        if (modal) {
            openModal('exchange');
            return;
        }

        showAlert('Currency exchange feature - Opening soon!', 'info');
    },

    // Helper: Prompt for amount with validation
    async promptAmount(message, minAmount) {
        const input = prompt(message);
        if (!input) return null;

        const amount = parseFloat(input.replace(/,/g, ''));
        
        if (isNaN(amount) || amount < minAmount) {
            showAlert(`Minimum amount is UGX ${Dashboard.formatNumber(minAmount)}`, 'error');
            return null;
        }

        return amount;
    },

    // Helper: Select option (simple prompt-based)
    async selectOption(message, options) {
        const optionsList = options.map((opt, i) => `${i + 1}. ${opt.label}`).join('\n');
        const input = prompt(`${message}\n\n${optionsList}\n\nEnter number:`);
        
        if (!input) return null;
        
        const index = parseInt(input) - 1;
        if (index >= 0 && index < options.length) {
            return options[index].value;
        }
        
        showAlert('Invalid selection', 'error');
        return null;
    }
};

// ═══════════════════════════════════════════════════════════════════════
// NOTIFICATION HANDLER
// ═══════════════════════════════════════════════════════════════════════

const Notifications = {
    items: [],
    unreadCount: 0,

    async load() {
        try {
            const result = await gmgAPI.request('/notifications', 'GET', null, true);
            
            if (result.success && result.data) {
                this.items = result.data.notifications || result.data || [];
                this.unreadCount = this.items.filter(n => !n.is_read).length;
                this.updateBadge();
                this.render();
            }
        } catch (error) {
            console.error('[Notifications] Load error:', error);
        }
    },

    updateBadge() {
        const badge = document.getElementById('notif-badge');
        if (badge) {
            badge.textContent = this.unreadCount;
            badge.style.display = this.unreadCount > 0 ? 'flex' : 'none';
        }
    },

    render() {
        const container = document.getElementById('notifications-list');
        if (!container) return;

        if (!this.items || this.items.length === 0) {
            container.innerHTML = `
                <div class="text-center text-gray-400 py-8">
                    <div class="text-4xl mb-2">🔔</div>
                    <p>No notifications yet</p>
                </div>`;
            return;
        }

        container.innerHTML = this.items.map(notif => `
            <div class="bg-white p-4 rounded-xl shadow-sm ${notif.is_read ? 'opacity-70' : ''}"
                 onclick="Notifications.markAsRead('${notif.id}')">
                <div class="flex items-start gap-3">
                    <div class="text-2xl">${this.getIcon(notif.type)}</div>
                    <div class="flex-1">
                        <div class="font-semibold text-gray-800">${Dashboard.escapeHtml(notif.title)}</div>
                        <div class="text-sm text-gray-600 mt-1">${Dashboard.escapeHtml(notif.message)}</div>
                        <div class="text-xs text-gray-400 mt-2">${Dashboard.formatRelativeTime(notif.created_at)}</div>
                    </div>
                    ${!notif.is_read ? '<div class="w-2 h-2 bg-purple-600 rounded-full"></div>' : ''}
                </div>
            </div>
        `).join('');
    },

    getIcon(type) {
        const icons = {
            'TRANSACTION': '💳',
            'SECURITY': '🔐',
            'SYSTEM': '⚙️',
            'PROMOTION': '🎁',
            'KYC': '📄'
        };
        return icons[type] || '📢';
    },

    async markAsRead(id) {
        try {
            await gmgAPI.request(`/notifications/${id}/read`, 'POST', null, true);
            const notif = this.items.find(n => n.id == id);
            if (notif && !notif.is_read) {
                notif.is_read = true;
                this.unreadCount = Math.max(0, this.unreadCount - 1);
                this.updateBadge();
                this.render();
            }
        } catch (error) {
            console.error('[Notifications] Mark read error:', error);
        }
    },

    async markAllAsRead() {
        try {
            await gmgAPI.request('/notifications/read-all', 'POST', null, true);
            this.items.forEach(n => n.is_read = true);
            this.unreadCount = 0;
            this.updateBadge();
            this.render();
        } catch (error) {
            console.error('[Notifications] Mark all read error:', error);
        }
    }
};

// ═══════════════════════════════════════════════════════════════════════
// INTEGRATION WITH EXISTING APP
// ═══════════════════════════════════════════════════════════════════════

// Override/enhance existing functions
const originalShowPage = window.showPage;
window.showPage = function(pageId) {
    // Call original
    if (originalShowPage) {
        originalShowPage(pageId);
    }

    // Enhanced page handling
    if (pageId === 'mobile-app-page') {
        Dashboard.init();
    } else if (pageId === 'notifications-page') {
        Notifications.load();
    }
};

// Override toggleBalanceVisibility
window.toggleBalanceVisibility = function() {
    Dashboard.toggleBalance();
};

// Enhanced action handlers
window.handleDeposit = QuickActions.deposit.bind(QuickActions);
window.handleSend = QuickActions.send.bind(QuickActions);
window.handleWithdraw = QuickActions.withdraw.bind(QuickActions);
window.handleAirtime = QuickActions.buyAirtime.bind(QuickActions);
window.handleExchange = QuickActions.exchange.bind(QuickActions);

// Make modules globally available
window.Dashboard = Dashboard;
window.QuickActions = QuickActions;
window.Notifications = Notifications;

// Initialize on page load if already authenticated
document.addEventListener('DOMContentLoaded', () => {
    if (gmgAPI && gmgAPI.isAuthenticated()) {
        setTimeout(() => {
            if (document.getElementById('mobile-app-page')?.classList.contains('active')) {
                Dashboard.init();
            }
        }, 100);
    }
});

// Handle visibility change (pause/resume refresh)
document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && gmgAPI.isAuthenticated()) {
        // Refresh if more than 30 seconds since last refresh
        if (Dashboard.lastRefresh && Date.now() - Dashboard.lastRefresh > 30000) {
            Dashboard.loadBalance();
        }
    }
});

console.log('✅ Dashboard Enhanced Module loaded');
