/**
 * Database Backup Service
 * Automated backup and restore functionality
 */

const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const BACKUP_DIR = process.env.BACKUP_DIR || path.join(__dirname, '../backups');
const MAX_BACKUPS = parseInt(process.env.MAX_BACKUPS) || 7;

// Ensure backup directory exists (with error handling for Docker)
try {
    if (!fs.existsSync(BACKUP_DIR)) {
        fs.mkdirSync(BACKUP_DIR, { recursive: true });
    }
} catch (err) {
    console.warn('Could not create backup directory:', err.message);
}

/**
 * Create database backup
 */
async function createBackup(options = {}) {
    const {
        compress = true,
        encrypt = false,
        tables = null
    } = options;

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `gmg_uganda_${timestamp}.sql`;
    const filepath = path.join(BACKUP_DIR, filename);

    const dbConfig = {
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USERNAME || process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'gmg_uganda'
    };

    // Build mysqldump command
    let cmd = `mysqldump -h ${dbConfig.host} -u ${dbConfig.user}`;
    if (dbConfig.password) {
        cmd += ` -p"${dbConfig.password}"`;
    }
    cmd += ` --single-transaction --routines --triggers`;
    
    if (tables) {
        cmd += ` ${dbConfig.database} ${tables.join(' ')}`;
    } else {
        cmd += ` ${dbConfig.database}`;
    }
    
    cmd += ` > "${filepath}"`;

    return new Promise((resolve, reject) => {
        exec(cmd, async (error, stdout, stderr) => {
            if (error) {
                console.error('Backup failed:', error.message);
                reject(error);
                return;
            }

            let finalPath = filepath;
            let size = fs.statSync(filepath).size;

            // Compress if requested
            if (compress) {
                const gzipPath = filepath + '.gz';
                await compressFile(filepath, gzipPath);
                fs.unlinkSync(filepath);
                finalPath = gzipPath;
                size = fs.statSync(gzipPath).size;
            }

            // Encrypt if requested
            if (encrypt && process.env.BACKUP_ENCRYPTION_KEY) {
                const encPath = finalPath + '.enc';
                await encryptFile(finalPath, encPath, process.env.BACKUP_ENCRYPTION_KEY);
                fs.unlinkSync(finalPath);
                finalPath = encPath;
                size = fs.statSync(encPath).size;
            }

            // Cleanup old backups
            await cleanupOldBackups();

            const result = {
                success: true,
                filename: path.basename(finalPath),
                path: finalPath,
                size,
                sizeFormatted: formatBytes(size),
                timestamp: new Date().toISOString()
            };

            console.log(`✓ Backup created: ${result.filename} (${result.sizeFormatted})`);
            resolve(result);
        });
    });
}

/**
 * Restore database from backup
 */
async function restoreBackup(filename) {
    let filepath = path.join(BACKUP_DIR, filename);
    
    if (!fs.existsSync(filepath)) {
        throw new Error(`Backup file not found: ${filename}`);
    }

    const dbConfig = {
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USERNAME || process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'gmg_uganda'
    };

    // Decrypt if needed
    if (filepath.endsWith('.enc')) {
        if (!process.env.BACKUP_ENCRYPTION_KEY) {
            throw new Error('BACKUP_ENCRYPTION_KEY required for encrypted backups');
        }
        const decPath = filepath.replace('.enc', '');
        await decryptFile(filepath, decPath, process.env.BACKUP_ENCRYPTION_KEY);
        filepath = decPath;
    }

    // Decompress if needed
    if (filepath.endsWith('.gz')) {
        const sqlPath = filepath.replace('.gz', '');
        await decompressFile(filepath, sqlPath);
        filepath = sqlPath;
    }

    // Restore
    let cmd = `mysql -h ${dbConfig.host} -u ${dbConfig.user}`;
    if (dbConfig.password) {
        cmd += ` -p"${dbConfig.password}"`;
    }
    cmd += ` ${dbConfig.database} < "${filepath}"`;

    return new Promise((resolve, reject) => {
        exec(cmd, (error) => {
            // Cleanup temp files
            if (filepath !== path.join(BACKUP_DIR, filename)) {
                fs.unlinkSync(filepath);
            }

            if (error) {
                console.error('Restore failed:', error.message);
                reject(error);
                return;
            }

            console.log(`✓ Database restored from: ${filename}`);
            resolve({ success: true, filename });
        });
    });
}

/**
 * List available backups
 */
function listBackups() {
    const files = fs.readdirSync(BACKUP_DIR)
        .filter(f => f.startsWith('gmg_uganda_'))
        .map(filename => {
            const filepath = path.join(BACKUP_DIR, filename);
            const stats = fs.statSync(filepath);
            return {
                filename,
                size: stats.size,
                sizeFormatted: formatBytes(stats.size),
                created: stats.mtime,
                encrypted: filename.endsWith('.enc'),
                compressed: filename.includes('.gz')
            };
        })
        .sort((a, b) => b.created - a.created);

    return files;
}

/**
 * Cleanup old backups
 */
async function cleanupOldBackups() {
    const backups = listBackups();
    
    if (backups.length > MAX_BACKUPS) {
        const toDelete = backups.slice(MAX_BACKUPS);
        for (const backup of toDelete) {
            const filepath = path.join(BACKUP_DIR, backup.filename);
            fs.unlinkSync(filepath);
            console.log(`✓ Deleted old backup: ${backup.filename}`);
        }
    }
}

// Helper functions
function compressFile(input, output) {
    return new Promise((resolve, reject) => {
        const zlib = require('zlib');
        const readStream = fs.createReadStream(input);
        const writeStream = fs.createWriteStream(output);
        const gzip = zlib.createGzip();
        
        readStream.pipe(gzip).pipe(writeStream)
            .on('finish', resolve)
            .on('error', reject);
    });
}

function decompressFile(input, output) {
    return new Promise((resolve, reject) => {
        const zlib = require('zlib');
        const readStream = fs.createReadStream(input);
        const writeStream = fs.createWriteStream(output);
        const gunzip = zlib.createGunzip();
        
        readStream.pipe(gunzip).pipe(writeStream)
            .on('finish', resolve)
            .on('error', reject);
    });
}

function encryptFile(input, output, key) {
    return new Promise((resolve, reject) => {
        const algorithm = 'aes-256-cbc';
        const iv = crypto.randomBytes(16);
        const keyBuffer = crypto.scryptSync(key, 'salt', 32);
        const cipher = crypto.createCipheriv(algorithm, keyBuffer, iv);
        
        const readStream = fs.createReadStream(input);
        const writeStream = fs.createWriteStream(output);
        
        writeStream.write(iv);
        readStream.pipe(cipher).pipe(writeStream)
            .on('finish', resolve)
            .on('error', reject);
    });
}

function decryptFile(input, output, key) {
    return new Promise((resolve, reject) => {
        const algorithm = 'aes-256-cbc';
        const keyBuffer = crypto.scryptSync(key, 'salt', 32);
        
        const readStream = fs.createReadStream(input);
        const writeStream = fs.createWriteStream(output);
        
        let iv;
        let decipher;
        let first = true;
        
        readStream.on('data', (chunk) => {
            if (first) {
                iv = chunk.slice(0, 16);
                decipher = crypto.createDecipheriv(algorithm, keyBuffer, iv);
                writeStream.write(decipher.update(chunk.slice(16)));
                first = false;
            } else {
                writeStream.write(decipher.update(chunk));
            }
        });
        
        readStream.on('end', () => {
            writeStream.write(decipher.final());
            writeStream.end();
            resolve();
        });
        
        readStream.on('error', reject);
    });
}

function formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

module.exports = {
    createBackup,
    restoreBackup,
    listBackups,
    cleanupOldBackups
};
