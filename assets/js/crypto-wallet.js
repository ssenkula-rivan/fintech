/**
 * GMG Crypto Wallet - PRODUCTION JavaScript
 * NO MOCKS - Real Web3 and API integration only
 */

const API_BASE = window.location.hostname === 'localhost' 
    ? 'http://localhost:3000/api' 
    : '/api';

// State
let web3 = null;
let walletData = null;
let tokens = [];
let transactions = [];

// ═══════════════════════════════════════════════════════════════════════
// WEB3 INITIALIZATION - REAL ONLY
// ═══════════════════════════════════════════════════════════════════════

async function initWeb3() {
    if (typeof window.ethereum !== 'undefined') {
        web3 = new Web3(window.ethereum);
        console.log('[Web3] MetaMask detected');
        return true;
    } else if (typeof Web3 !== 'undefined') {
        // Use Infura/Alchemy for read-only operations
        const rpcUrl = 'https://eth.llamarpc.com';
        web3 = new Web3(new Web3.providers.HttpProvider(rpcUrl));
        console.log('[Web3] Using public RPC');
        return true;
    }
    console.error('[Web3] No Web3 provider available');
    return false;
}

// ═══════════════════════════════════════════════════════════════════════
// PAGE NAVIGATION
// ═══════════════════════════════════════════════════════════════════════

function showPage(pageId) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    const page = document.getElementById(pageId);
    if (page) {
        page.classList.add('active');
        if (pageId === 'dashboard-page') loadDashboard();
        if (pageId === 'history-page') loadTransactionHistory();
        if (pageId === 'receive-page') generateQRCode();
    }
}


// ═══════════════════════════════════════════════════════════════════════
// AUTHENTICATION - REAL API CALLS
// ═══════════════════════════════════════════════════════════════════════

async function handleSignup() {
    const name = document.getElementById('signup-name').value.trim();
    const phone = document.getElementById('signup-phone').value.trim();
    const email = document.getElementById('signup-email').value.trim();
    const pin = document.getElementById('signup-pin').value.trim();

    if (!name || !phone || !email || !pin) {
        showAlert('Please fill all fields', 'error');
        return;
    }

    if (pin.length !== 6 || !/^\d+$/.test(pin)) {
        showAlert('PIN must be 6 digits', 'error');
        return;
    }

    showLoading(true);

    try {
        const response = await fetch(`${API_BASE}/crypto-wallet/signup`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, phone, email, pin })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Signup failed');
        }

        // Store auth data securely
        sessionStorage.setItem('crypto_token', data.token);
        sessionStorage.setItem('wallet_address', data.walletAddress);
        
        walletData = {
            address: data.walletAddress,
            mnemonic: data.mnemonic // Show ONCE for backup
        };

        // Show mnemonic backup prompt
        showMnemonicBackup(data.mnemonic);
        
    } catch (error) {
        showAlert(error.message, 'error');
    } finally {
        showLoading(false);
    }
}

function showMnemonicBackup(mnemonic) {
    const words = mnemonic.split(' ');
    const modal = document.createElement('div');
    modal.className = 'modal active';
    modal.id = 'mnemonic-modal';
    modal.innerHTML = `
        <div style="background: white; border-radius: 24px; padding: 32px; max-width: 400px; margin: 20px;">
            <h2 style="font-size: 24px; font-weight: 800; margin-bottom: 16px; color: #dc2626;">⚠️ BACKUP YOUR WALLET</h2>
            <p style="color: #6b7280; margin-bottom: 20px;">Write down these 12 words in order. This is the ONLY way to recover your wallet. Never share them!</p>
            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin-bottom: 24px;">
                ${words.map((w, i) => `<div style="background: #f3f4f6; padding: 8px; border-radius: 8px; font-size: 14px;"><span style="color: #9ca3af;">${i+1}.</span> ${w}</div>`).join('')}
            </div>
            <label style="display: flex; align-items: center; margin-bottom: 20px; cursor: pointer;">
                <input type="checkbox" id="backup-confirm" style="margin-right: 12px;">
                <span style="font-size: 14px;">I have written down my recovery phrase</span>
            </label>
            <button onclick="confirmBackup()" class="btn-primary">Continue to Wallet</button>
        </div>
    `;
    document.body.appendChild(modal);
}

function confirmBackup() {
    const confirmed = document.getElementById('backup-confirm')?.checked;
    if (!confirmed) {
        showAlert('Please confirm you have backed up your recovery phrase', 'error');
        return;
    }
    document.getElementById('mnemonic-modal')?.remove();
    showPage('dashboard-page');
}

async function handleLogin() {
    const phone = document.getElementById('login-phone').value.trim();
    const pin = document.getElementById('login-pin').value.trim();

    if (!phone || !pin) {
        showAlert('Please fill all fields', 'error');
        return;
    }

    showLoading(true);

    try {
        const response = await fetch(`${API_BASE}/crypto-wallet/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phone, pin })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Login failed');
        }

        sessionStorage.setItem('crypto_token', data.token);
        sessionStorage.setItem('wallet_address', data.walletAddress);
        
        showPage('dashboard-page');
    } catch (error) {
        showAlert(error.message, 'error');
    } finally {
        showLoading(false);
    }
}

function logout() {
    if (confirm('Are you sure you want to logout?')) {
        sessionStorage.clear();
        walletData = null;
        tokens = [];
        showPage('login-page');
    }
}

function getAuthHeaders() {
    const token = sessionStorage.getItem('crypto_token');
    return {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : ''
    };
}


// ═══════════════════════════════════════════════════════════════════════
// DASHBOARD - REAL BALANCE FETCHING
// ═══════════════════════════════════════════════════════════════════════

async function loadDashboard() {
    const address = sessionStorage.getItem('wallet_address');
    if (!address) {
        showPage('login-page');
        return;
    }
    await refreshBalances();
}

async function refreshBalances() {
    showLoading(true);
    
    try {
        const response = await fetch(`${API_BASE}/crypto-wallet/balances`, {
            headers: getAuthHeaders()
        });

        if (!response.ok) {
            if (response.status === 401) {
                showPage('login-page');
                return;
            }
            throw new Error('Failed to fetch balances');
        }

        const data = await response.json();
        tokens = data.tokens || [];
        
        renderTokenList();
        updatePortfolioValue();
    } catch (error) {
        console.error('[Dashboard] Error:', error);
        showAlert('Failed to load balances', 'error');
    } finally {
        showLoading(false);
    }
}

function renderTokenList() {
    const container = document.getElementById('token-list');
    if (!container) return;

    if (tokens.length === 0) {
        container.innerHTML = '<div style="text-align: center; padding: 40px; color: #6b7280;">No tokens found</div>';
        return;
    }

    const iconColors = { BTC: '#f7931a', ETH: '#627eea', USDT: '#26a17b', BNB: '#f3ba2f', MATIC: '#8247e5' };

    container.innerHTML = tokens.map(token => `
        <div class="token-item" onclick="showTokenDetails('${token.symbol}')">
            <div style="display: flex; align-items: center;">
                <div class="token-icon" style="background: ${iconColors[token.symbol] || '#0066FF'};">${token.symbol[0]}</div>
                <div>
                    <div style="font-weight: 700; font-size: 15px;">${token.name}</div>
                    <div style="font-size: 13px; color: #6b7280;">${parseFloat(token.balance).toFixed(6)} ${token.symbol}</div>
                </div>
            </div>
            <div style="text-align: right;">
                <div style="font-weight: 700; font-size: 15px;">$${token.valueUsd.toFixed(2)}</div>
                <div style="font-size: 13px; color: ${token.change24h >= 0 ? '#10b981' : '#ef4444'};">
                    ${token.change24h >= 0 ? '+' : ''}${token.change24h.toFixed(2)}%
                </div>
            </div>
        </div>
    `).join('');
}

function updatePortfolioValue() {
    const total = tokens.reduce((sum, t) => sum + (t.valueUsd || 0), 0);
    const change = tokens.reduce((sum, t) => sum + ((t.valueUsd * t.change24h / 100) || 0), 0);
    
    const portfolioEl = document.getElementById('total-portfolio');
    const changeEl = document.getElementById('portfolio-change');
    
    if (portfolioEl) portfolioEl.textContent = '$' + total.toFixed(2);
    if (changeEl) {
        const isPositive = change >= 0;
        changeEl.textContent = `${isPositive ? '+' : ''}$${Math.abs(change).toFixed(2)} (${isPositive ? '+' : ''}${total > 0 ? (change / total * 100).toFixed(2) : 0}%)`;
        changeEl.style.color = isPositive ? '#10b981' : '#ef4444';
    }
}

function showTokenDetails(symbol) {
    const token = tokens.find(t => t.symbol === symbol);
    if (!token) return;
    
    alert(`${token.name} (${token.symbol})\n\nBalance: ${token.balance}\nValue: $${token.valueUsd.toFixed(2)}\nPrice: $${token.price.toFixed(2)}\n24h Change: ${token.change24h.toFixed(2)}%`);
}


// ═══════════════════════════════════════════════════════════════════════
// SEND CRYPTO - REAL TRANSACTIONS
// ═══════════════════════════════════════════════════════════════════════

async function confirmSend() {
    const tokenSymbol = document.getElementById('send-token').value;
    const address = document.getElementById('send-address').value.trim();
    const amount = document.getElementById('send-amount').value;
    const pin = prompt('Enter your 6-digit PIN to confirm:');

    if (!address || !amount || !pin) {
        showAlert('Please fill all fields', 'error');
        return;
    }

    // Validate address format
    if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
        showAlert('Invalid wallet address', 'error');
        return;
    }

    if (!confirm(`Send ${amount} ${tokenSymbol} to ${address.slice(0, 10)}...${address.slice(-8)}?`)) {
        return;
    }

    showLoading(true);

    try {
        const response = await fetch(`${API_BASE}/crypto-wallet/send`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({
                token: tokenSymbol,
                toAddress: address,
                amount: parseFloat(amount),
                pin
            })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Transaction failed');
        }

        showAlert(`✅ Transaction sent!\nTx: ${data.txHash.slice(0, 20)}...`, 'success');
        showPage('dashboard-page');
    } catch (error) {
        showAlert(error.message, 'error');
    } finally {
        showLoading(false);
    }
}

function updateSendBalance() {
    const symbol = document.getElementById('send-token').value;
    const token = tokens.find(t => t.symbol === symbol);
    const el = document.getElementById('send-balance');
    if (el && token) {
        el.textContent = `${parseFloat(token.balance).toFixed(6)} ${symbol}`;
    }
}

function setMaxSend() {
    const symbol = document.getElementById('send-token').value;
    const token = tokens.find(t => t.symbol === symbol);
    const el = document.getElementById('send-amount');
    if (el && token) {
        // Leave some for gas if ETH/BNB/MATIC
        const gasReserve = ['ETH', 'BNB', 'MATIC'].includes(symbol) ? 0.001 : 0;
        el.value = Math.max(0, parseFloat(token.balance) - gasReserve).toFixed(6);
    }
}

// ═══════════════════════════════════════════════════════════════════════
// RECEIVE CRYPTO
// ═══════════════════════════════════════════════════════════════════════

function generateQRCode() {
    const address = sessionStorage.getItem('wallet_address');
    if (!address) return;

    const addressEl = document.getElementById('wallet-address');
    if (addressEl) addressEl.textContent = address;

    const qrContainer = document.getElementById('qr-code');
    if (qrContainer && typeof QRCode !== 'undefined') {
        qrContainer.innerHTML = '';
        new QRCode(qrContainer, {
            text: address,
            width: 200,
            height: 200,
            colorDark: '#1a1a1a',
            colorLight: '#ffffff'
        });
    }
}

function copyAddress() {
    const address = sessionStorage.getItem('wallet_address');
    if (address) {
        navigator.clipboard.writeText(address).then(() => {
            showAlert('Address copied!', 'success');
        });
    }
}

function shareAddress() {
    const address = sessionStorage.getItem('wallet_address');
    if (navigator.share && address) {
        navigator.share({ title: 'My Wallet', text: `Send crypto to: ${address}` });
    } else {
        copyAddress();
    }
}


// ═══════════════════════════════════════════════════════════════════════
// SWAP - REAL DEX INTEGRATION
// ═══════════════════════════════════════════════════════════════════════

async function calculateSwap() {
    const fromToken = document.getElementById('swap-from')?.value;
    const toToken = document.getElementById('swap-to')?.value;
    const amount = parseFloat(document.getElementById('swap-from-amt')?.value) || 0;

    if (!fromToken || !toToken || amount <= 0) return;

    try {
        const response = await fetch(`${API_BASE}/crypto-wallet/swap/quote?from=${fromToken}&to=${toToken}&amount=${amount}`, {
            headers: getAuthHeaders()
        });

        const data = await response.json();

        if (response.ok && data.quote) {
            document.getElementById('swap-to-amt').value = data.quote.toAmount.toFixed(6);
            document.getElementById('swap-rate').textContent = `1 ${fromToken} = ${data.quote.rate.toFixed(6)} ${toToken}`;
        }
    } catch (error) {
        console.error('[Swap] Quote error:', error);
    }
}

function flipSwap() {
    const fromEl = document.getElementById('swap-from');
    const toEl = document.getElementById('swap-to');
    if (fromEl && toEl) {
        const temp = fromEl.value;
        fromEl.value = toEl.value;
        toEl.value = temp;
        calculateSwap();
    }
}

async function executeSwap() {
    const fromToken = document.getElementById('swap-from')?.value;
    const toToken = document.getElementById('swap-to')?.value;
    const amount = parseFloat(document.getElementById('swap-from-amt')?.value);
    const pin = prompt('Enter your 6-digit PIN to confirm:');

    if (!amount || amount <= 0 || !pin) {
        showAlert('Invalid swap parameters', 'error');
        return;
    }

    showLoading(true);

    try {
        const response = await fetch(`${API_BASE}/crypto-wallet/swap`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ fromToken, toToken, amount, pin })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Swap failed');
        }

        showAlert(`✅ Swapped ${amount} ${fromToken} for ${data.received} ${toToken}`, 'success');
        showPage('dashboard-page');
    } catch (error) {
        showAlert(error.message, 'error');
    } finally {
        showLoading(false);
    }
}

// ═══════════════════════════════════════════════════════════════════════
// BUY CRYPTO - REAL MOBILE MONEY INTEGRATION
// ═══════════════════════════════════════════════════════════════════════

async function calculateBuy() {
    const ugx = parseFloat(document.getElementById('buy-amount')?.value) || 0;
    const tokenSymbol = document.getElementById('buy-token')?.value;

    if (ugx < 10000) {
        document.getElementById('buy-receive').textContent = 'Min: 10,000 UGX';
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/crypto-wallet/buy/quote?token=${tokenSymbol}&ugx=${ugx}`, {
            headers: getAuthHeaders()
        });

        const data = await response.json();

        if (response.ok && data.quote) {
            document.getElementById('buy-receive').textContent = `${data.quote.cryptoAmount.toFixed(8)} ${tokenSymbol}`;
        }
    } catch (error) {
        console.error('[Buy] Quote error:', error);
    }
}

function setBuyAmt(amount) {
    document.getElementById('buy-amount').value = amount;
    calculateBuy();
}

async function processBuy() {
    const ugx = parseFloat(document.getElementById('buy-amount')?.value);
    const tokenSymbol = document.getElementById('buy-token')?.value;
    const payment = document.querySelector('input[name="payment"]:checked')?.value;

    if (!ugx || ugx < 10000) {
        showAlert('Minimum purchase is 10,000 UGX', 'error');
        return;
    }

    const phone = prompt('Enter your mobile money number:');
    if (!phone) return;

    showLoading(true);

    try {
        const response = await fetch(`${API_BASE}/crypto-wallet/buy`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({
                token: tokenSymbol,
                amountUgx: ugx,
                paymentMethod: payment,
                phone
            })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Purchase failed');
        }

        showAlert(`✅ Payment request sent to ${phone}. Approve on your phone to complete purchase.`, 'success');
        
        // Poll for payment status
        pollPaymentStatus(data.referenceId);
    } catch (error) {
        showAlert(error.message, 'error');
        showLoading(false);
    }
}

async function pollPaymentStatus(referenceId) {
    let attempts = 0;
    const maxAttempts = 60; // 5 minutes

    const poll = async () => {
        try {
            const response = await fetch(`${API_BASE}/crypto-wallet/buy/status/${referenceId}`, {
                headers: getAuthHeaders()
            });
            const data = await response.json();

            if (data.status === 'SUCCESSFUL') {
                showLoading(false);
                showAlert('✅ Purchase complete! Crypto added to your wallet.', 'success');
                showPage('dashboard-page');
                return;
            } else if (data.status === 'FAILED') {
                showLoading(false);
                showAlert('❌ Payment failed or was cancelled.', 'error');
                return;
            }

            attempts++;
            if (attempts < maxAttempts) {
                setTimeout(poll, 5000);
            } else {
                showLoading(false);
                showAlert('Payment timeout. Check your transaction history.', 'error');
            }
        } catch (error) {
            showLoading(false);
            console.error('[Buy] Status poll error:', error);
        }
    };

    poll();
}


// ═══════════════════════════════════════════════════════════════════════
// TRANSACTION HISTORY - REAL BLOCKCHAIN DATA
// ═══════════════════════════════════════════════════════════════════════

async function loadTransactionHistory() {
    showLoading(true);
    
    try {
        const response = await fetch(`${API_BASE}/crypto-wallet/transactions`, {
            headers: getAuthHeaders()
        });

        if (!response.ok) throw new Error('Failed to load transactions');

        const data = await response.json();
        transactions = data.transactions || [];
        renderTransactions(transactions);
    } catch (error) {
        console.error('[History] Error:', error);
        document.getElementById('tx-list').innerHTML = '<div style="text-align: center; padding: 40px; color: #6b7280;">Failed to load transactions</div>';
    } finally {
        showLoading(false);
    }
}

function renderTransactions(txs) {
    const container = document.getElementById('tx-list');
    if (!container) return;

    if (txs.length === 0) {
        container.innerHTML = '<div style="text-align: center; padding: 40px; color: #6b7280;">No transactions yet</div>';
        return;
    }

    container.innerHTML = txs.map(tx => {
        const isReceive = tx.type === 'receive';
        const icon = isReceive ? '📥' : tx.type === 'send' ? '📤' : '🔄';
        const color = isReceive ? '#d1fae5' : tx.type === 'send' ? '#fee2e2' : '#dbeafe';
        const textColor = isReceive ? '#10b981' : '#ef4444';
        
        return `
            <div style="background: #f9fafb; border-radius: 12px; padding: 16px; margin-bottom: 12px;" onclick="showTxDetails('${tx.hash}')">
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <div style="display: flex; align-items: center; gap: 12px;">
                        <div style="width: 40px; height: 40px; border-radius: 10px; background: ${color}; display: flex; align-items: center; justify-content: center; font-size: 20px;">${icon}</div>
                        <div>
                            <div style="font-weight: 700; margin-bottom: 4px;">${tx.type.charAt(0).toUpperCase() + tx.type.slice(1)} ${tx.token}</div>
                            <div style="font-size: 13px; color: #6b7280;">${formatTime(tx.timestamp)}</div>
                        </div>
                    </div>
                    <div style="text-align: right;">
                        <div style="font-weight: 700; color: ${textColor};">${isReceive ? '+' : '-'}${tx.amount} ${tx.token}</div>
                        <div style="font-size: 13px; color: #6b7280;">$${tx.valueUsd?.toFixed(2) || '0.00'}</div>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function filterTx(type) {
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.style.background = btn.dataset.filter === type ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.2)';
    });

    if (type === 'all') {
        renderTransactions(transactions);
    } else {
        renderTransactions(transactions.filter(tx => tx.type === type));
    }
}

function showTxDetails(hash) {
    const tx = transactions.find(t => t.hash === hash);
    if (!tx) return;
    
    const explorerUrl = tx.chainId === 56 ? 'https://bscscan.com' : tx.chainId === 137 ? 'https://polygonscan.com' : 'https://etherscan.io';
    
    if (confirm(`View transaction on blockchain explorer?\n\nHash: ${hash.slice(0, 20)}...`)) {
        window.open(`${explorerUrl}/tx/${hash}`, '_blank');
    }
}

// ═══════════════════════════════════════════════════════════════════════
// BACKUP & SECURITY
// ═══════════════════════════════════════════════════════════════════════

async function revealMnemonic() {
    const pin = document.getElementById('backup-pin')?.value;
    if (!pin || pin.length !== 6) {
        showAlert('Please enter your 6-digit PIN', 'error');
        return;
    }

    showLoading(true);

    try {
        const response = await fetch(`${API_BASE}/crypto-wallet/backup`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ pin })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Failed to retrieve backup');
        }

        const words = data.mnemonic.split(' ');
        const wordsContainer = document.getElementById('mnemonic-words');
        if (wordsContainer) {
            wordsContainer.innerHTML = words.map((word, i) => `
                <div style="background: white; padding: 8px; border-radius: 8px; font-size: 14px;">
                    <span style="color: #9ca3af;">${i + 1}.</span> ${word}
                </div>
            `).join('');
        }

        document.getElementById('mnemonic-box').style.display = 'block';
        document.getElementById('backup-verify').style.display = 'none';
    } catch (error) {
        showAlert(error.message, 'error');
    } finally {
        showLoading(false);
    }
}

function copyMnemonic() {
    const words = document.getElementById('mnemonic-words');
    if (words) {
        const text = Array.from(words.querySelectorAll('div')).map(d => d.textContent.split('. ')[1]).join(' ');
        navigator.clipboard.writeText(text).then(() => {
            showAlert('Recovery phrase copied! Store it safely.', 'success');
        });
    }
}

async function changePin() {
    const currentPin = prompt('Enter current PIN:');
    const newPin = prompt('Enter new PIN (6 digits):');
    const confirmPin = prompt('Confirm new PIN:');

    if (!currentPin || !newPin || newPin !== confirmPin) {
        showAlert('PINs do not match', 'error');
        return;
    }

    if (newPin.length !== 6 || !/^\d+$/.test(newPin)) {
        showAlert('PIN must be 6 digits', 'error');
        return;
    }

    showLoading(true);

    try {
        const response = await fetch(`${API_BASE}/crypto-wallet/change-pin`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ currentPin, newPin })
        });

        if (!response.ok) {
            const data = await response.json();
            throw new Error(data.error || 'Failed to change PIN');
        }

        showAlert('PIN changed successfully', 'success');
    } catch (error) {
        showAlert(error.message, 'error');
    } finally {
        showLoading(false);
    }
}


// ═══════════════════════════════════════════════════════════════════════
// UTILITIES
// ═══════════════════════════════════════════════════════════════════════

function showLoading(show) {
    let modal = document.getElementById('loading-modal');
    if (!modal && show) {
        modal = document.createElement('div');
        modal.id = 'loading-modal';
        modal.className = 'modal';
        modal.innerHTML = '<div class="loader"></div>';
        document.body.appendChild(modal);
    }
    if (modal) {
        modal.classList.toggle('active', show);
    }
}

function showAlert(message, type = 'info') {
    // Remove existing alerts
    document.querySelectorAll('.alert-toast').forEach(a => a.remove());
    
    const alert = document.createElement('div');
    alert.className = 'alert-toast';
    alert.style.cssText = `
        position: fixed; top: 20px; left: 50%; transform: translateX(-50%);
        padding: 16px 24px; border-radius: 12px; z-index: 10000;
        font-weight: 600; max-width: 90%; text-align: center;
        background: ${type === 'error' ? '#fee2e2' : type === 'success' ? '#d1fae5' : '#dbeafe'};
        color: ${type === 'error' ? '#dc2626' : type === 'success' ? '#065f46' : '#1e40af'};
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    `;
    alert.textContent = message;
    document.body.appendChild(alert);
    
    setTimeout(() => alert.remove(), 5000);
}

function formatTime(timestamp) {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
    if (diffMins < 10080) return `${Math.floor(diffMins / 1440)}d ago`;
    return date.toLocaleDateString();
}

// ═══════════════════════════════════════════════════════════════════════
// INITIALIZATION
// ═══════════════════════════════════════════════════════════════════════

window.onload = async () => {
    console.log('[GMG Crypto Wallet] Initializing...');
    
    await initWeb3();

    const token = sessionStorage.getItem('crypto_token');
    const address = sessionStorage.getItem('wallet_address');

    if (token && address) {
        showPage('dashboard-page');
    } else {
        showPage('signup-page');
    }
};

// Global error handler
window.onerror = function(msg, url, line) {
    console.error('Error:', msg, url, line);
    return false;
};

// Export functions for HTML onclick handlers
window.showPage = showPage;
window.handleSignup = handleSignup;
window.handleLogin = handleLogin;
window.logout = logout;
window.confirmBackup = confirmBackup;
window.refreshBalances = refreshBalances;
window.showTokenDetails = showTokenDetails;
window.confirmSend = confirmSend;
window.updateSendBalance = updateSendBalance;
window.setMaxSend = setMaxSend;
window.copyAddress = copyAddress;
window.shareAddress = shareAddress;
window.calculateSwap = calculateSwap;
window.flipSwap = flipSwap;
window.executeSwap = executeSwap;
window.setBuyAmt = setBuyAmt;
window.calculateBuy = calculateBuy;
window.processBuy = processBuy;
window.filterTx = filterTx;
window.showTxDetails = showTxDetails;
window.revealMnemonic = revealMnemonic;
window.copyMnemonic = copyMnemonic;
window.changePin = changePin;

console.log('✅ Crypto Wallet JS loaded - NO MOCKS');
