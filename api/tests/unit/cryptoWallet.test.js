/**
 * Unit Tests - Crypto Wallet Logic
 * Tests encryption, address validation, and balance formatting
 */

const crypto = require('crypto');

// Encryption functions (from cryptoWallet.js)
function encrypt(data, key) {
    if (!key || key.length < 32) {
        throw new Error('Encryption key must be at least 32 characters');
    }
    
    const keyBuffer = crypto.createHash('sha256').update(key).digest();
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

function decrypt(encryptedData, iv, authTag, key) {
    if (!key) {
        throw new Error('Encryption key required');
    }
    
    const keyBuffer = crypto.createHash('sha256').update(key).digest();
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

// Address validation
function isValidAddress(address) {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
}

// Format wei to ETH
function formatWei(wei, decimals = 18) {
    const value = BigInt(wei);
    const divisor = BigInt(10 ** decimals);
    const intPart = value / divisor;
    const fracPart = value % divisor;
    return `${intPart}.${fracPart.toString().padStart(decimals, '0')}`;
}

// Parse ETH to wei
function parseToWei(amount, decimals = 18) {
    const [intPart, fracPart = ''] = amount.toString().split('.');
    const paddedFrac = fracPart.padEnd(decimals, '0').slice(0, decimals);
    return BigInt(intPart + paddedFrac);
}

// Chain configurations
const CHAINS = {
    1: { name: 'Ethereum', symbol: 'ETH', decimals: 18 },
    56: { name: 'BSC', symbol: 'BNB', decimals: 18 },
    137: { name: 'Polygon', symbol: 'MATIC', decimals: 18 }
};

describe('Crypto Wallet', () => {

    describe('Encryption', () => {
        const testKey = 'test-encryption-key-32-characters!';
        
        test('encrypts and decrypts string data', () => {
            const original = 'secret mnemonic phrase';
            const { encrypted, iv, authTag } = encrypt(original, testKey);
            const decrypted = decrypt(encrypted, iv, authTag, testKey);
            
            expect(decrypted.toString('utf8')).toBe(original);
        });

        test('encrypts and decrypts buffer data', () => {
            const original = Buffer.from('private key bytes');
            const { encrypted, iv, authTag } = encrypt(original, testKey);
            const decrypted = decrypt(encrypted, iv, authTag, testKey);
            
            expect(decrypted.equals(original)).toBe(true);
        });

        test('produces different ciphertext each time (random IV)', () => {
            const data = 'same data';
            const result1 = encrypt(data, testKey);
            const result2 = encrypt(data, testKey);
            
            expect(result1.encrypted).not.toBe(result2.encrypted);
            expect(result1.iv).not.toBe(result2.iv);
        });

        test('throws on short key', () => {
            expect(() => encrypt('data', 'short')).toThrow('at least 32 characters');
        });

        test('throws on wrong key during decryption', () => {
            const { encrypted, iv, authTag } = encrypt('secret', testKey);
            
            expect(() => {
                decrypt(encrypted, iv, authTag, 'wrong-key-32-characters-long!!!');
            }).toThrow();
        });

        test('throws on tampered ciphertext', () => {
            const { encrypted, iv, authTag } = encrypt('secret', testKey);
            const tampered = 'ff' + encrypted.slice(2);
            
            expect(() => {
                decrypt(tampered, iv, authTag, testKey);
            }).toThrow();
        });
    });

    describe('Address Validation', () => {
        test('valid Ethereum address', () => {
            expect(isValidAddress('0x742d35Cc6634C0532925a3b844Bc9e7595f5bE21')).toBe(true);
        });

        test('valid lowercase address', () => {
            expect(isValidAddress('0x742d35cc6634c0532925a3b844bc9e7595f5be21')).toBe(true);
        });

        test('valid uppercase address', () => {
            expect(isValidAddress('0x742D35CC6634C0532925A3B844BC9E7595F5BE21')).toBe(true);
        });

        test('rejects address without 0x prefix', () => {
            expect(isValidAddress('742d35Cc6634C0532925a3b844Bc9e7595f5bE21')).toBe(false);
        });

        test('rejects short address', () => {
            expect(isValidAddress('0x742d35Cc6634C0532925a3b844Bc9e7595f5bE')).toBe(false);
        });

        test('rejects long address', () => {
            expect(isValidAddress('0x742d35Cc6634C0532925a3b844Bc9e7595f5bE2100')).toBe(false);
        });

        test('rejects address with invalid characters', () => {
            expect(isValidAddress('0x742d35Cc6634C0532925a3b844Bc9e7595f5bGHI')).toBe(false);
        });

        test('rejects empty string', () => {
            expect(isValidAddress('')).toBe(false);
        });

        test('rejects null', () => {
            expect(isValidAddress(null)).toBe(false);
        });
    });

    describe('Wei Formatting', () => {
        test('formats 1 ETH correctly', () => {
            const oneEth = '1000000000000000000';
            const formatted = formatWei(oneEth);
            expect(formatted.startsWith('1.')).toBe(true);
        });

        test('formats 0.5 ETH correctly', () => {
            const halfEth = '500000000000000000';
            const formatted = formatWei(halfEth);
            expect(formatted.startsWith('0.')).toBe(true);
        });

        test('formats large amounts', () => {
            const largeAmount = '100000000000000000000'; // 100 ETH
            const formatted = formatWei(largeAmount);
            expect(formatted.startsWith('100.')).toBe(true);
        });

        test('handles zero', () => {
            const formatted = formatWei('0');
            expect(formatted.startsWith('0.')).toBe(true);
        });
    });

    describe('Wei Parsing', () => {
        test('parses 1 ETH to wei', () => {
            const wei = parseToWei('1');
            expect(wei.toString()).toBe('1000000000000000000');
        });

        test('parses 0.5 ETH to wei', () => {
            const wei = parseToWei('0.5');
            expect(wei.toString()).toBe('500000000000000000');
        });

        test('parses small amounts', () => {
            const wei = parseToWei('0.000000000000000001');
            expect(wei.toString()).toBe('1');
        });

        test('parses integer amounts', () => {
            const wei = parseToWei(100);
            expect(wei.toString()).toBe('100000000000000000000');
        });
    });

    describe('Chain Configuration', () => {
        test('Ethereum chain config', () => {
            expect(CHAINS[1].name).toBe('Ethereum');
            expect(CHAINS[1].symbol).toBe('ETH');
            expect(CHAINS[1].decimals).toBe(18);
        });

        test('BSC chain config', () => {
            expect(CHAINS[56].name).toBe('BSC');
            expect(CHAINS[56].symbol).toBe('BNB');
        });

        test('Polygon chain config', () => {
            expect(CHAINS[137].name).toBe('Polygon');
            expect(CHAINS[137].symbol).toBe('MATIC');
        });

        test('all chains have required properties', () => {
            Object.values(CHAINS).forEach(chain => {
                expect(chain.name).toBeDefined();
                expect(chain.symbol).toBeDefined();
                expect(chain.decimals).toBe(18);
            });
        });
    });

    describe('Mnemonic Validation', () => {
        const BIP39_SAMPLE = ['abandon', 'ability', 'able', 'about', 'above', 'absent'];
        
        function validateMnemonic(mnemonic, wordlist = BIP39_SAMPLE) {
            const words = mnemonic.trim().toLowerCase().split(/\s+/);
            
            if (words.length !== 12 && words.length !== 24) {
                return { valid: false, error: 'Mnemonic must be 12 or 24 words' };
            }
            
            // In real implementation, check against full wordlist
            return { valid: true };
        }

        test('accepts 12-word mnemonic', () => {
            const mnemonic = 'abandon ability able about above absent abandon ability able about above absent';
            const result = validateMnemonic(mnemonic);
            expect(result.valid).toBe(true);
        });

        test('accepts 24-word mnemonic', () => {
            const mnemonic = Array(24).fill('abandon').join(' ');
            const result = validateMnemonic(mnemonic);
            expect(result.valid).toBe(true);
        });

        test('rejects 11-word mnemonic', () => {
            const mnemonic = Array(11).fill('abandon').join(' ');
            const result = validateMnemonic(mnemonic);
            expect(result.valid).toBe(false);
            expect(result.error).toContain('12 or 24');
        });

        test('rejects 13-word mnemonic', () => {
            const mnemonic = Array(13).fill('abandon').join(' ');
            const result = validateMnemonic(mnemonic);
            expect(result.valid).toBe(false);
        });
    });
});
