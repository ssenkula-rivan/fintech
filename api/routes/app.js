// GMG Global - App Routes
// Handles app version checking for update notifications

const express = require('express');
const router = express.Router();
const db = require('../config/database');

// App version configuration - stored in database
// This allows updating version info without redeploying the API

/**
 * GET /api/app/version
 * Returns the latest app version info for update checking
 * Query params: platform (ios/android)
 */
router.get('/version', async (req, res) => {
  try {
    const { platform } = req.query;
    
    if (!platform || !['ios', 'android'].includes(platform)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid platform. Must be ios or android.'
      });
    }

    // Get version info from database
    try {
      const [rows] = await db.query(
        `SELECT latest_version, min_supported_version, release_notes, force_update 
         FROM app_versions 
         WHERE platform = ? AND is_active = 1 
         ORDER BY created_at DESC 
         LIMIT 1`,
        [platform]
      );

      if (rows.length === 0) {
        // No version info in database - return default
        return res.json({
          success: true,
          data: {
            latestVersion: '1.0.0',
            minSupportedVersion: '1.0.0',
            releaseNotes: null,
            forceUpdate: false
          }
        });
      }

      const versionInfo = rows[0];
      
      res.json({
        success: true,
        data: {
          latestVersion: versionInfo.latest_version,
          minSupportedVersion: versionInfo.min_supported_version,
          releaseNotes: versionInfo.release_notes,
          forceUpdate: versionInfo.force_update === 1
        }
      });
    } catch (dbError) {
      // Table doesn't exist - return default version
      console.log('[App Version] DB error (table may not exist):', dbError.code);
      return res.json({
        success: true,
        data: {
          latestVersion: '1.0.0',
          minSupportedVersion: '1.0.0',
          releaseNotes: null,
          forceUpdate: false
        }
      });
    }
  } catch (error) {
    console.error('[App Version] Error:', error);
    res.json({
      success: true,
      data: {
        latestVersion: '1.0.0',
        minSupportedVersion: '1.0.0',
        releaseNotes: null,
        forceUpdate: false
      }
    });
  }
});

/**
 * POST /api/app/version (Admin only)
 * Update app version info
 */
router.post('/version', async (req, res) => {
  try {
    const { platform, latestVersion, minSupportedVersion, releaseNotes, forceUpdate } = req.body;

    if (!platform || !latestVersion) {
      return res.status(400).json({
        success: false,
        error: 'Platform and latestVersion are required'
      });
    }

    // Deactivate previous versions for this platform
    await db.query(
      'UPDATE app_versions SET is_active = 0 WHERE platform = ?',
      [platform]
    );

    // Insert new version
    await db.query(
      `INSERT INTO app_versions (platform, latest_version, min_supported_version, release_notes, force_update, is_active) 
       VALUES (?, ?, ?, ?, ?, 1)`,
      [platform, latestVersion, minSupportedVersion || latestVersion, releaseNotes || null, forceUpdate ? 1 : 0]
    );

    res.json({
      success: true,
      message: 'App version updated successfully'
    });
  } catch (error) {
    console.error('[App Version] Update error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update app version'
    });
  }
});

/**
 * GET /api/app/ephemeral-status
 * Returns the current ephemeral status message from admin (if any)
 * Messages are temporary greetings/announcements that show for 5 seconds
 */
router.get('/ephemeral-status', async (req, res) => {
  try {
    // Get active ephemeral message
    const [rows] = await db.query(
      `SELECT message, expires_at FROM ephemeral_status 
       WHERE is_active = 1 AND (expires_at IS NULL OR expires_at > NOW())
       ORDER BY created_at DESC 
       LIMIT 1`
    );

    if (rows.length === 0) {
      return res.json({
        success: true,
        data: { message: null }
      });
    }

    res.json({
      success: true,
      data: { message: rows[0].message }
    });
  } catch (error) {
    // If table doesn't exist, just return null
    console.log('[Ephemeral Status] Error:', error.message);
    res.json({
      success: true,
      data: { message: null }
    });
  }
});

/**
 * POST /api/app/ephemeral-status (Admin only)
 * Set ephemeral status message for all users
 */
router.post('/ephemeral-status', async (req, res) => {
  try {
    const { message, expiresInHours } = req.body;

    if (!message) {
      return res.status(400).json({
        success: false,
        error: 'Message is required'
      });
    }

    // Deactivate previous messages
    await db.query('UPDATE ephemeral_status SET is_active = 0');

    // Calculate expiry
    const expiresAt = expiresInHours 
      ? new Date(Date.now() + expiresInHours * 60 * 60 * 1000)
      : null;

    // Insert new message
    await db.query(
      `INSERT INTO ephemeral_status (message, expires_at, is_active) VALUES (?, ?, 1)`,
      [message, expiresAt]
    );

    res.json({
      success: true,
      message: 'Ephemeral status set successfully'
    });
  } catch (error) {
    console.error('[Ephemeral Status] Set error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to set ephemeral status'
    });
  }
});

/**
 * DELETE /api/app/ephemeral-status (Admin only)
 * Clear ephemeral status message
 */
router.delete('/ephemeral-status', async (req, res) => {
  try {
    await db.query('UPDATE ephemeral_status SET is_active = 0');
    res.json({
      success: true,
      message: 'Ephemeral status cleared'
    });
  } catch (error) {
    console.error('[Ephemeral Status] Clear error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to clear ephemeral status'
    });
  }
});

module.exports = router;
