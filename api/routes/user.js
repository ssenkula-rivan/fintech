// GMG Global - User Routes
// Handles user profile operations including profile photo

const express = require('express');
const router = express.Router();
const db = require('../config/database');
const { authenticateToken } = require('../middleware/auth');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../uploads/profiles');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

/**
 * POST /api/user/profile-photo
 * Upload or update profile photo
 */
router.post('/profile-photo', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { image } = req.body;

    if (!image) {
      return res.status(400).json({
        success: false,
        error: 'No image provided'
      });
    }

    // Validate base64 image
    if (!image.startsWith('data:image/')) {
      return res.status(400).json({
        success: false,
        error: 'Invalid image format'
      });
    }

    // Extract base64 data
    const matches = image.match(/^data:image\/(\w+);base64,(.+)$/);
    if (!matches) {
      return res.status(400).json({
        success: false,
        error: 'Invalid image data'
      });
    }

    const extension = matches[1];
    const base64Data = matches[2];
    const buffer = Buffer.from(base64Data, 'base64');

    // Validate file size (max 5MB)
    if (buffer.length > 5 * 1024 * 1024) {
      return res.status(400).json({
        success: false,
        error: 'Image too large. Maximum size is 5MB.'
      });
    }

    // Generate unique filename
    const filename = `${userId}_${crypto.randomBytes(8).toString('hex')}.${extension}`;
    const filepath = path.join(uploadsDir, filename);

    // Delete old profile photo if exists
    const [existingUser] = await db.query(
      'SELECT profile_picture FROM users WHERE id = ?',
      [userId]
    );

    if (existingUser.length > 0 && existingUser[0].profile_picture) {
      const oldFilename = existingUser[0].profile_picture.split('/').pop();
      const oldFilepath = path.join(uploadsDir, oldFilename);
      if (fs.existsSync(oldFilepath)) {
        fs.unlinkSync(oldFilepath);
      }
    }

    // Save new image
    fs.writeFileSync(filepath, buffer);

    // Generate URL for the image
    const profilePictureUrl = `/uploads/profiles/${filename}`;

    // Update database
    await db.query(
      'UPDATE users SET profile_picture = ? WHERE id = ?',
      [profilePictureUrl, userId]
    );

    res.json({
      success: true,
      data: {
        profilePicture: profilePictureUrl
      }
    });
  } catch (error) {
    console.error('[User] Profile photo upload error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to upload profile photo'
    });
  }
});

/**
 * DELETE /api/user/profile-photo
 * Remove profile photo
 */
router.delete('/profile-photo', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    // Get current profile photo
    const [user] = await db.query(
      'SELECT profile_picture FROM users WHERE id = ?',
      [userId]
    );

    if (user.length > 0 && user[0].profile_picture) {
      // Delete file
      const filename = user[0].profile_picture.split('/').pop();
      const filepath = path.join(uploadsDir, filename);
      if (fs.existsSync(filepath)) {
        fs.unlinkSync(filepath);
      }
    }

    // Update database
    await db.query(
      'UPDATE users SET profile_picture = NULL WHERE id = ?',
      [userId]
    );

    res.json({
      success: true,
      message: 'Profile photo removed'
    });
  } catch (error) {
    console.error('[User] Profile photo remove error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to remove profile photo'
    });
  }
});

/**
 * GET /api/user/profile
 * Get user profile
 */
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const [users] = await db.query(
      `SELECT id, phone, email, first_name, last_name, profile_picture, 
              chipptertag, kyc_tier, kyc_status, status, created_at
       FROM users WHERE id = ?`,
      [userId]
    );

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    const user = users[0];

    res.json({
      success: true,
      data: {
        id: user.id,
        phone: user.phone,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        profilePicture: user.profile_picture,
        chipptertag: user.chipptertag,
        kycTier: user.kyc_tier,
        kycStatus: user.kyc_status,
        status: user.status,
        createdAt: user.created_at
      }
    });
  } catch (error) {
    console.error('[User] Get profile error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get profile'
    });
  }
});

/**
 * PUT /api/user/profile
 * Update user profile
 */
router.put('/profile', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { firstName, lastName, email } = req.body;

    const updates = [];
    const values = [];

    if (firstName) {
      updates.push('first_name = ?');
      values.push(firstName);
    }
    if (lastName) {
      updates.push('last_name = ?');
      values.push(lastName);
    }
    if (email) {
      updates.push('email = ?');
      values.push(email);
    }

    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No fields to update'
      });
    }

    values.push(userId);

    await db.query(
      `UPDATE users SET ${updates.join(', ')} WHERE id = ?`,
      values
    );

    res.json({
      success: true,
      message: 'Profile updated successfully'
    });
  } catch (error) {
    console.error('[User] Update profile error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update profile'
    });
  }
});

module.exports = router;
