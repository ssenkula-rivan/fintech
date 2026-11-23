/**
 * Crypto Wallet Service - PRODUCTION IMPLEMENTATION
 * Real HD Wallet with ethers.js and bip39
 * 
 * NO MOCKS - All real blockchain operations
 */

const crypto = require('crypto');
const { ethers } = require('ethers');
const bip39 = require('bip39');

// Chain configurations with real RPC endpoints
const CHAINS = {
    1: {
        name: 'Ethereum',
        symbol: 'ETH',
        rpcUrl: process.env.ETHEREUM_RPC_URL || 'https://eth.llamarpc.com',
        explorerApi: 'https://api.etherscan.io/api',
        explorerApiKey: process.env.ETHERSCAN_API_KEY,
        explorerUrl: 'https://etherscan.io',
        decimals: 18,
        chainId: 1
    },
    56: {
        name: 'BSC',
        symbol: 'BNB',
        rpcUrl: process.env.BSC_RPC_URL || 'https://bsc-dataseed1.binance.org',
        explorerApi: 'https://api.bscscan.com/api',
        explorerApiKey: process.env.BSCSCAN_API_KEY,
        explorerUrl: 'https://bscscan.com',
        decimals: 18,
        chainId: 56
    },
    137: {
        name: 'Polygon',
        symbol: 'MATIC',
        rpcUrl: process.env.POLYGON_RPC_URL || 'https://polygon-rpc.com',
        explorerApi: 'https://api.polygonscan.com/api',
        explorerApiKey: process.env.POLYGONSCAN_API_KEY,
        explorerUrl: 'https://polygonscan.com',
        decimals: 18,
        chainId: 137
    }
};

// Provider cache
const providers = {};

/**
 * Get ethers provider for chain
 */
function getProvider(chainId = 1) {
    if (!providers[chainId]) {
        const chain = CHAINS[chainId];
        if (!chain) throw new Error(`Unsupported chain: ${chainId}`);
        providers[chainId] = new ethers.JsonRpcProvider(chain.rpcUrl, chainId);
    }
    return providers[chainId];
}

/**
 * Generate BIP39 mnemonic (12 or 24 words) - REAL implementation
 */
function generateMnemonic(strength = 128) {
    // 128 bits = 12 words, 256 bits = 24 words
    return bip39.generateMnemonic(strength);
}

/**
 * Validate mnemonic - REAL implementation
 */
function validateMnemonic(mnemonic) {
    const isValid = bip39.validateMnemonic(mnemonic.trim().toLowerCase());
    return {
        valid: isValid,
        error: isValid ? null : 'Invalid mnemonic phrase'
    };
}

/**
 * Derive seed from mnemonic - REAL implementation
 */
async function mnemonicToSeed(mnemonic, passphrase = '') {
    return bip39.mnemonicToSeed(mnemonic, passphrase);
}

/**
 * AES-256-GCM Encryption
 */
function encrypt(data, key) {
    const encryptionKey = key || process.env.WALLET_ENCRYPTION_KEY;
    
    if (!encryptionKey || encryptionKey.length < 32) {
        throw new Error('WALLET_ENCRYPTION_KEY must be at least 32 characters');
    }
    
    const keyBuffer = crypto.createHash('sha256').update(encryptionKey).digest();
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv('aes-256-gcm', keyBuffer, iv);
    
    const dataBuffer = Buffer.isBuffer(data) ? data : Buffer.from(data);
    const encrypted = Buffer.concat([cipher.update(dataBuffer), cipher.final()]);
    const authTag = cipher.getAuthTag();
    
    return {
        encrypted: encrypted.toString('hex'),
        iv: iv.toString('hex'),
        authTag: authTag.toString('hex')
    };
}

/**
 * AES-256-GCM Decryption
 */
function decrypt(encryptedData, iv, authTag, key) {
    const encryptionKey = key || process.env.WALLET_ENCRYPTION_KEY;
    
    if (!encryptionKey) {
        throw new Error('WALLET_ENCRYPTION_KEY not configured');
    }
    
    const keyBuffer = crypto.createHash('sha256').update(encryptionKey).digest();
    const decipher = crypto.createDecipheriv(
        'aes-256-gcm',
        keyBuffer,
        Buffer.from(iv, 'hex')
    );
    
    decipher.setAuthTag(Buffer.from(authTag, 'hex'));
    
    const decrypted = Buffer.concat([
        decipher.update(Buffer.from(encryptedData, 'hex')),
        decipher.final()
    ]);
    
    return decrypted;
}

/**
 * Create HD Wallet - REAL implementation using ethers.js
 */
function createWallet(passphrase = '') {
    // Generate real BIP39 mnemonic
    const mnemonic = generateMnemonic(128);
    
    // Create HD wallet from mnemonic
    const hdNode = ethers.HDNodeWallet.fromPhrase(mnemonic, passphrase);
    
    // Derive first account (m/44'/60'/0'/0/0)
    const wallet = hdNode.derivePath("m/44'/60'/0'/0/0");
    
    // Encrypt mnemonic
    const encryptedMnemonic = encrypt(mnemonic);
    
    // Encrypt private key
    const encryptedPrivateKey = encrypt(wallet.privateKey);
    
    return {
        uuid: crypto.randomUUID(),
        address: wallet.address,
        publicKey: wallet.publicKey,
        derivationPath: "m/44'/60'/0'/0/0",
        mnemonic: {
            encrypted: encryptedMnemonic.encrypted,
            iv: encryptedMnemonic.iv,
            authTag: encryptedMnemonic.authTag
        },
        privateKey: {
            encrypted: encryptedPrivateKey.encrypted,
            iv: encryptedPrivateKey.iv,
            authTag: encryptedPrivateKey.authTag
        },
        mnemonicPlain: mnemonic, // Return ONLY for initial backup
        createdAt: new Date().toISOString()
    };
}

/**
 * Import wallet from mnemonic - REAL implementation
 */
function importWallet(mnemonic, passphrase = '') {
    const validation = validateMnemonic(mnemonic);
    if (!validation.valid) {
        throw new Error(validation.error);
    }
    
    const hdNode = ethers.HDNodeWallet.fromPhrase(mnemonic.trim(), passphrase);
    const wallet = hdNode.derivePath("m/44'/60'/0'/0/0");
    
    const encryptedMnemonic = encrypt(mnemonic);
    const encryptedPrivateKey = encrypt(wallet.privateKey);
    
    return {
        uuid: crypto.randomUUID(),
        address: wallet.address,
        publicKey: wallet.publicKey,
        derivationPath: "m/44'/60'/0'/0/0",
        mnemonic: {
            encrypted: encryptedMnemonic.encrypted,
            iv: encryptedMnemonic.iv,
            authTag: encryptedMnemonic.authTag
        },
        privateKey: {
            encrypted: encryptedPrivateKey.encrypted,
            iv: encryptedPrivateKey.iv,
            authTag: encryptedPrivateKey.authTag
        },
        createdAt: new Date().toISOString()
    };
}

/**
 * Derive additional address from wallet
 */
function deriveAddress(encryptedMnemonic, iv, authTag, index, passphrase = '') {
    const mnemonic = decrypt(encryptedMnemonic, iv, authTag).toString('utf8');
    const hdNode = ethers.HDNodeWallet.fromPhrase(mnemonic, passphrase);
    const wallet = hdNode.derivePath(`m/44'/60'/0'/0/${index}`);
    
    const encryptedPrivateKey = encrypt(wallet.privateKey);
    
    return {
        address: wallet.address,
        publicKey: wallet.publicKey,
        index,
        derivationPath: `m/44'/60'/0'/0/${index}`,
        privateKey: {
            encrypted: encryptedPrivateKey.encrypted,
            iv: encryptedPrivateKey.iv,
            authTag: encryptedPrivateKey.authTag
        }
    };
}

/**
 * Get wallet instance from encrypted private key
 */
function getWalletInstance(encryptedPrivateKey, iv, authTag, chainId = 1) {
    const privateKey = decrypt(encryptedPrivateKey, iv, authTag).toString('utf8');
    const provider = getProvider(chainId);
    return new ethers.Wallet(privateKey, provider);
}

/**
 * Get native token balance - REAL blockchain query
 */
async function getBalance(address, chainId = 1) {
    const chain = CHAINS[chainId];
    if (!chain) throw new Error(`Unsupported chain: ${chainId}`);
    
    const provider = getProvider(chainId);
    const balanceWei = await provider.getBalance(address);
    const balanceEth = ethers.formatEther(balanceWei);
    
    return {
        address,
        chainId,
        chainName: chain.name,
        symbol: chain.symbol,
        balanceWei: balanceWei.toString(),
        balance: parseFloat(balanceEth),
        formatted: `${parseFloat(balanceEth).toFixed(6)} ${chain.symbol}`
    };
}

/**
 * Get ERC20 token balance - REAL blockchain query
 */
async function getTokenBalance(address, tokenContract, chainId = 1) {
    const provider = getProvider(chainId);
    
    const erc20Abi = ['function balanceOf(address) view returns (uint256)', 'function decimals() view returns (uint8)', 'function symbol() view returns (string)'];
    const contract = new ethers.Contract(tokenContract, erc20Abi, provider);
    
    const [balance, decimals, symbol] = await Promise.all([
        contract.balanceOf(address),
        contract.decimals(),
        contract.symbol()
    ]);
    
    const formatted = ethers.formatUnits(balance, decimals);
    
    return {
        address,
        tokenContract,
        chainId,
        symbol,
        decimals: Number(decimals),
        balanceRaw: balance.toString(),
        balance: parseFloat(formatted),
        formatted: `${parseFloat(formatted).toFixed(6)} ${symbol}`
    };
}

/**
 * Get current gas price - REAL blockchain query
 */
async function getGasPrice(chainId = 1) {
    const provider = getProvider(chainId);
    const feeData = await provider.getFeeData();
    
    return {
        chainId,
        gasPrice: feeData.gasPrice?.toString() || '0',
        maxFeePerGas: feeData.maxFeePerGas?.toString(),
        maxPriorityFeePerGas: feeData.maxPriorityFeePerGas?.toString(),
        gasPriceGwei: feeData.gasPrice ? ethers.formatUnits(feeData.gasPrice, 'gwei') : '0'
    };
}

/**
 * Get transaction count (nonce) - REAL blockchain query
 */
async function getTransactionCount(address, chainId = 1) {
    const provider = getProvider(chainId);
    return await provider.getTransactionCount(address, 'pending');
}

/**
 * Estimate gas - REAL blockchain query
 */
async function estimateGas(txParams, chainId = 1) {
    const provider = getProvider(chainId);
    return await provider.estimateGas(txParams);
}

/**
 * Transfer native token - REAL blockchain transaction
 */
async function transferNative(params) {
    const {
        toAddress,
        amount,
        encryptedPrivateKey,
        iv,
        authTag,
        chainId = 1
    } = params;
    
    const wallet = getWalletInstance(encryptedPrivateKey, iv, authTag, chainId);
    const chain = CHAINS[chainId];
    
    // Build transaction
    const tx = {
        to: toAddress,
        value: ethers.parseEther(amount.toString())
    };
    
    // Send transaction
    const txResponse = await wallet.sendTransaction(tx);
    
    return {
        success: true,
        txHash: txResponse.hash,
        from: wallet.address,
        to: toAddress,
        amount,
        chainId,
        explorerUrl: `${chain.explorerUrl}/tx/${txResponse.hash}`,
        nonce: txResponse.nonce
    };
}

/**
 * Transfer ERC20 token - REAL blockchain transaction
 */
async function transferToken(params) {
    const {
        toAddress,
        tokenContract,
        amount,
        encryptedPrivateKey,
        iv,
        authTag,
        chainId = 1
    } = params;
    
    const wallet = getWalletInstance(encryptedPrivateKey, iv, authTag, chainId);
    const chain = CHAINS[chainId];
    
    const erc20Abi = [
        'function transfer(address to, uint256 amount) returns (bool)',
        'function decimals() view returns (uint8)'
    ];
    const contract = new ethers.Contract(tokenContract, erc20Abi, wallet);
    
    // Get decimals
    const decimals = await contract.decimals();
    const amountWei = ethers.parseUnits(amount.toString(), decimals);
    
    // Send transaction
    const txResponse = await contract.transfer(toAddress, amountWei);
    
    return {
        success: true,
        txHash: txResponse.hash,
        from: wallet.address,
        to: toAddress,
        tokenContract,
        amount,
        chainId,
        explorerUrl: `${chain.explorerUrl}/tx/${txResponse.hash}`,
        nonce: txResponse.nonce
    };
}

/**
 * Get transaction receipt - REAL blockchain query
 */
async function getTransactionReceipt(txHash, chainId = 1) {
    const provider = getProvider(chainId);
    const receipt = await provider.getTransactionReceipt(txHash);
    
    if (!receipt) {
        return { status: 'pending', txHash };
    }
    
    return {
        status: receipt.status === 1 ? 'confirmed' : 'failed',
        txHash,
        blockNumber: receipt.blockNumber,
        blockHash: receipt.blockHash,
        gasUsed: receipt.gasUsed.toString(),
        from: receipt.from,
        to: receipt.to,
        contractAddress: receipt.contractAddress,
        logs: receipt.logs.length
    };
}

/**
 * Wait for transaction confirmation - REAL blockchain monitoring
 */
async function waitForConfirmation(txHash, chainId = 1, confirmations = 12) {
    const provider = getProvider(chainId);
    const receipt = await provider.waitForTransaction(txHash, confirmations);
    
    return {
        status: receipt.status === 1 ? 'confirmed' : 'failed',
        txHash,
        blockNumber: receipt.blockNumber,
        confirmations,
        gasUsed: receipt.gasUsed.toString()
    };
}

/**
 * Sign message - REAL cryptographic signature
 */
async function signMessage(message, encryptedPrivateKey, iv, authTag) {
    const privateKey = decrypt(encryptedPrivateKey, iv, authTag).toString('utf8');
    const wallet = new ethers.Wallet(privateKey);
    return await wallet.signMessage(message);
}

/**
 * Verify message signature
 */
function verifyMessage(message, signature) {
    return ethers.verifyMessage(message, signature);
}

/**
 * Validate Ethereum address
 */
function isValidAddress(address) {
    return ethers.isAddress(address);
}

/**
 * Get checksum address
 */
function getChecksumAddress(address) {
    return ethers.getAddress(address);
}

/**
 * Get supported chains
 */
function getSupportedChains() {
    return Object.entries(CHAINS).map(([id, chain]) => ({
        chainId: parseInt(id),
        name: chain.name,
        symbol: chain.symbol,
        decimals: chain.decimals,
        explorerUrl: chain.explorerUrl
    }));
}

/**
 * Format wei to ETH
 */
function formatWei(wei, decimals = 18) {
    return ethers.formatUnits(wei, decimals);
}

/**
 * Parse ETH to wei
 */
function parseToWei(amount, decimals = 18) {
    return ethers.parseUnits(amount.toString(), decimals).toString();
}

module.exports = {
    // Wallet management
    createWallet,
    importWallet,
    deriveAddress,
    validateMnemonic,
    generateMnemonic,
    
    // Encryption
    encrypt,
    decrypt,
    getWalletInstance,
    
    // Balance queries
    getBalance,
    getTokenBalance,
    
    // Gas
    estimateGas,
    getGasPrice,
    getTransactionCount,
    
    // Transactions
    transferNative,
    transferToken,
    getTransactionReceipt,
    waitForConfirmation,
    
    // Signing
    signMessage,
    verifyMessage,
    
    // Utilities
    isValidAddress,
    getChecksumAddress,
    getSupportedChains,
    formatWei,
    parseToWei,
    getProvider,
    
    // Constants
    CHAINS
};
