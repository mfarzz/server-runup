const express = require('express');
const router = express.Router();
const { db } = require('../config/firebase');
const { authenticateUser } = require('../middleware/auth');

// POST /api/users/fcm-token
router.post('/fcm-token', authenticateUser, async (req, res) => {
  try {
    const { userId, fcmToken } = req.body;
    
    if (!userId || !fcmToken) {
      return res.status(400).json({
        success: false,
        error: 'userId and fcmToken are required'
      });
    }
    
    // Save FCM token to Firestore
    await db.collection('user_tokens').doc(userId).set({
      fcmToken,
      userId,
      updatedAt: new Date().toISOString(),
      createdAt: new Date().toISOString()
    }, { merge: true });
    
    res.json({
      success: true,
      message: 'FCM token saved successfully'
    });
    
  } catch (error) {
    console.error('Error saving FCM token:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to save FCM token'
    });
  }
});

// PUT /api/users/:userId/fcm-token
router.put('/:userId/fcm-token', authenticateUser, async (req, res) => {
  try {
    const { userId } = req.params;
    const { fcmToken } = req.body;
    
    if (!fcmToken) {
      return res.status(400).json({
        success: false,
        error: 'fcmToken is required'
      });
    }
    
    // Update FCM token in Firestore
    await db.collection('user_tokens').doc(userId).set({
      fcmToken,
      userId,
      updatedAt: new Date().toISOString()
    }, { merge: true });
    
    res.json({
      success: true,
      message: 'FCM token updated successfully'
    });
    
  } catch (error) {
    console.error('Error updating FCM token:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update FCM token'
    });
  }
});

// DELETE /api/users/fcm-token/:userId
router.delete('/fcm-token/:userId', authenticateUser, async (req, res) => {
  try {
    const { userId } = req.params;
    
    await db.collection('user_tokens').doc(userId).delete();
    
    res.json({
      success: true,
      message: 'FCM token removed successfully'
    });
    
  } catch (error) {
    console.error('Error removing FCM token:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to remove FCM token'
    });
  }
});

module.exports = router;
