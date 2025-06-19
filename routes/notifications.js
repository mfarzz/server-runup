const express = require('express');
const router = express.Router();
const Joi = require('joi');
const { db } = require('../config/firebase');
const { validateNotificationSettings } = require('../middleware/validation');
const { authenticateUser } = require('../middleware/auth');

// Validation schemas
const notificationSettingsSchema = Joi.object({
  dailyReminder: Joi.object({
    enabled: Joi.boolean().required(),
    time: Joi.string().pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).required(), // HH:MM format
    message: Joi.string().max(200).optional(),
    days: Joi.array().items(Joi.number().min(0).max(6)).min(1).max(7).required() // 0=Sunday, 6=Saturday
  }).required(),
  weeklyProgress: Joi.object({
    enabled: Joi.boolean().required(),
    day: Joi.number().min(0).max(6).required(), // 0=Sunday, 6=Saturday
    time: Joi.string().pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).required(),
    message: Joi.string().max(200).optional()
  }).required(),
  achievementNotifications: Joi.boolean().required(),
  motivationalMessages: Joi.boolean().required()
});

// GET /api/notifications/settings/:userId
router.get('/settings/:userId', authenticateUser, async (req, res) => {
  try {
    const { userId } = req.params;
    
    const userDoc = await db.collection('notification_settings').doc(userId).get();
    
    if (!userDoc.exists) {
      // Return default settings if none exist
      const defaultSettings = {
        dailyReminder: {
          enabled: true,
          time: "07:00",
          message: "Good morning! Time for your daily workout! 💪",
          days: [1, 2, 3, 4, 5] // Monday to Friday
        },
        weeklyProgress: {
          enabled: true,
          day: 0, // Sunday
          time: "19:00",
          message: "Check out your weekly progress! 📊"
        },
        achievementNotifications: true,
        motivationalMessages: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      // Save default settings
      await db.collection('notification_settings').doc(userId).set(defaultSettings);
      
      return res.json({
        success: true,
        data: defaultSettings
      });
    }
    
    res.json({
      success: true,
      data: userDoc.data()
    });
    
  } catch (error) {
    console.error('Error fetching notification settings:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch notification settings'
    });
  }
});

// PUT /api/notifications/settings/:userId
router.put('/settings/:userId', authenticateUser, validateNotificationSettings, async (req, res) => {
  try {
    const { userId } = req.params;
    const settings = req.body;
    
    // Add metadata
    settings.updatedAt = new Date().toISOString();
    if (!settings.createdAt) {
      settings.createdAt = new Date().toISOString();
    }
    
    // Save to Firestore
    await db.collection('notification_settings').doc(userId).set(settings, { merge: true });
    
    // Update user's FCM token if provided
    if (req.body.fcmToken) {
      await db.collection('user_tokens').doc(userId).set({
        fcmToken: req.body.fcmToken,
        updatedAt: new Date().toISOString()
      }, { merge: true });
    }
    
    res.json({
      success: true,
      message: 'Notification settings updated successfully',
      data: settings
    });
    
  } catch (error) {
    console.error('Error updating notification settings:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update notification settings'
    });
  }
});


// GET /api/notifications/history/:userId
router.get('/history/:userId', authenticateUser, async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 50, offset = 0 } = req.query;
    
    const historyQuery = await db.collection('notification_history')
      .where('userId', '==', userId)
      .orderBy('sentAt', 'desc')
      .limit(parseInt(limit))
      .offset(parseInt(offset))
      .get();
    
    const history = historyQuery.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    res.json({
      success: true,
      data: history,
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset),
        total: history.length
      }
    });
    
  } catch (error) {
    console.error('Error fetching notification history:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch notification history'
    });
  }
});

module.exports = router;
