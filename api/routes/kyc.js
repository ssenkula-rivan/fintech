const express = require('express');
const router = express.Router();
const mysql = require('mysql2/promise');
const crypto = require('crypto');

// Database pool
const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USERNAME || process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'gmg_uganda',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// Auth middleware
const { authenticateToken } = require('../middleware/auth');

/**
 * POST /api/kyc/submit
 * Submit KYC verification request
 */
router.post('/submit', authenticateToken, async (req, res) => {
    const connection = await pool.getConnection();
    try {
        const userId = req.user.id;
        const { tier, personalInfo, documents } = req.body;

        // Validate required fields
        if (!tier || !personalInfo || !documents) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields'
            });
        }

        if (!personalInfo.fullName || !personalInfo.dob || !personalInfo.nationalId) {
            return res.status(400).json({
                success: false,
                error: 'Missing personal information'
            });
        }

        if (!documents.idFront || !documents.idBack || !documents.selfie) {
            return res.status(400).json({
                success: false,
                error: 'Missing required documents'
            });
        }

        // Check if user already has pending KYC
        const [existing] = await connection.execute(
            `SELECT id, status FROM kyc_submissions WHERE user_id = ? AND status = 'PENDING'`,
            [userId]
        );

        if (existing.length > 0) {
            return res.status(400).json({
                success: false,
                error: 'Pending KYC exists',
                message: 'You already have a pending KYC verification request'
            });
        }

        // Generate submission reference
        const reference = `KYC${Date.now()}${crypto.randomBytes(4).toString('hex').toUpperCase()}`;

        // Insert KYC submission
        await connection.execute(
            `INSERT INTO kyc_submissions 
             (user_id, reference, target_tier, full_name, date_of_birth, gender, 
              national_id, district, id_front_url, id_back_url, selfie_url, status, created_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'PENDING', NOW())`,
            [
                userId,
                reference,
                tier,
                personalInfo.fullName,
                personalInfo.dob,
                personalInfo.gender || 'M',
                personalInfo.nationalId,
                personalInfo.district || '',
                documents.idFront.substring(0, 500), // Store truncated for demo
                documents.idBack.substring(0, 500),
                documents.selfie.substring(0, 500)
            ]
        );

        // Update user KYC status to pending
        await connection.execute(
            `UPDATE users SET kyc_status = 'PENDING' WHERE id = ?`,
            [userId]
        );

        // Create notification
        await connection.execute(
            `INSERT INTO notifications (user_id, title, message, type, created_at)
             VALUES (?, 'KYC Submitted', 'Your verification request has been submitted. We will review it within 24-48 hours.', 'SYSTEM', NOW())`,
            [userId]
        );

        res.json({
            success: true,
            message: 'KYC submitted successfully',
            data: {
                reference,
                status: 'PENDING',
                targetTier: tier,
                estimatedReviewTime: '24-48 hours'
            }
        });

    } catch (error) {
        console.error('KYC submit error:', error);
        res.status(500).json({
            success: false,
            error: 'Submission failed',
            message: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    } finally {
        connection.release();
    }
});

/**
 * GET /api/kyc/status
 * Get current KYC status
 */
router.get('/status', authenticateToken, async (req, res) => {
    const connection = await pool.getConnection();
    try {
        const userId = req.user.id;

        // Get user KYC info
        const [users] = await connection.execute(
            `SELECT kyc_tier, kyc_status FROM users WHERE id = ?`,
            [userId]
        );

        if (users.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'User not found'
            });
        }

        // Get latest submission
        const [submissions] = await connection.execute(
            `SELECT reference, target_tier, status, created_at, reviewed_at, rejection_reason
             FROM kyc_submissions WHERE user_id = ? ORDER BY created_at DESC LIMIT 1`,
            [userId]
        );

        const user = users[0];
        const submission = submissions[0] || null;

        res.json({
            success: true,
            data: {
                currentTier: user.kyc_tier,
                kycStatus: user.kyc_status,
                latestSubmission: submission ? {
                    reference: submission.reference,
                    targetTier: submission.target_tier,
                    status: submission.status,
                    submittedAt: submission.created_at,
                    reviewedAt: submission.reviewed_at,
                    rejectionReason: submission.rejection_reason
                } : null
            }
        });

    } catch (error) {
        console.error('KYC status error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to get KYC status'
        });
    } finally {
        connection.release();
    }
});

module.exports = router;
