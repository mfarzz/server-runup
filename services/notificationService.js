const { messaging } = require('../config/firebase');
const { db } = require('../config/firebase');

class NotificationService {
  /**
   * Send notification to a single device
   */
  async sendNotification(fcmToken, title, body, data = {}) {
    try {
      const message = {
        token: fcmToken,
        notification: {
          title,
          body
        },
        data: {
          ...data,
          timestamp: new Date().toISOString()
        },
        android: {
          priority: 'high',
          notification: {
            icon: 'ic_notification',
            color: '#00E676',
            channelId: 'runup_notifications',
            priority: 'high',
            defaultSound: true,
            defaultVibrateTimings: true
          }
        },
        apns: {
          payload: {
            aps: {
              alert: {
                title,
                body
              },
              badge: 1,
              sound: 'default'
            }
          }
        }
      };

      const response = await messaging.send(message);
      
      // Log to notification history
      await this.logNotificationHistory(fcmToken, title, body, data, 'sent', response);
      return response;
      
    } catch (error) {
      console.error('Error sending notification:', error);
      
      // Log failed notification
      await this.logNotificationHistory(fcmToken, title, body, data, 'failed', null, error.message);
      
      throw error;
    }
  }

  /**
   * Send notification to multiple devices
   */
  async sendMultipleNotifications(tokens, title, body, data = {}) {
    try {
      const message = {
        tokens,
        notification: {
          title,
          body
        },
        data: {
          ...data,
          timestamp: new Date().toISOString()
        },
        android: {
          priority: 'high',
          notification: {
            icon: 'ic_notification',
            color: '#00E676',
            channelId: 'runup_notifications',
            priority: 'high',
            defaultSound: true,
            defaultVibrateTimings: true
          }
        },
        apns: {
          payload: {
            aps: {
              alert: {
                title,
                body
              },
              badge: 1,
              sound: 'default'
            }
          }
        }
      };

      const response = await messaging.sendMulticast(message);
      
      console.log(`Sent ${response.successCount} notifications successfully`);
      if (response.failureCount > 0) {
        console.log(`Failed to send ${response.failureCount} notifications`);
        response.responses.forEach((resp, idx) => {
          if (!resp.success) {
            console.error(`Error for token ${tokens[idx]}:`, resp.error);
          }
        });
      }
      
      return response;
      
    } catch (error) {
      console.error('Error sending multiple notifications:', error);
      throw error;
    }
  }

  /**
   * Send daily reminder notifications
   */
  async sendDailyReminders() {
    try {
      const now = new Date();
      const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
      const currentDay = now.getDay(); // 0 = Sunday, 6 = Saturday

      // Query users with daily reminders enabled for current time and day
      const settingsQuery = await db.collection('notification_settings')
        .where('dailyReminder.enabled', '==', true)
        .where('dailyReminder.time', '==', currentTime)
        .where('dailyReminder.days', 'array-contains', currentDay)
        .get();

      if (settingsQuery.empty) {
        return;
      }

      const notifications = [];
      
      for (const doc of settingsQuery.docs) {
        const userId = doc.id;
        const settings = doc.data();
        
        // Get user's FCM token
        const tokenDoc = await db.collection('user_tokens').doc(userId).get();
        if (!tokenDoc.exists) {
          console.log(`No FCM token found for user ${userId}`);
          continue;
        }

        const { fcmToken } = tokenDoc.data();
        const message = settings.dailyReminder.message || "Good morning! Time for your daily workout! 💪";

        notifications.push({
          fcmToken,
          userId,
          title: "🏃‍♂️ Daily Workout Reminder",
          body: message,
          data: {
            type: 'daily_reminder',
            userId
          }
        });
      }

      // Send all notifications
      for (const notification of notifications) {
        try {
          await this.sendNotification(
            notification.fcmToken,
            notification.title,
            notification.body,
            notification.data
          );
        } catch (error) {
          console.error(`Failed to send daily reminder to user ${notification.userId}:`, error);
        }
      }

      console.log(`Sent ${notifications.length} daily reminder notifications`);
      
    } catch (error) {
      console.error('Error sending daily reminders:', error);
    }
  }

  /**
   * Send weekly progress notifications
   */
  async sendWeeklyProgress() {
    try {
      const now = new Date();
      const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
      const currentDay = now.getDay();

      console.log(`Checking weekly progress notifications for ${currentTime} on day ${currentDay}`);

      // Query users with weekly progress enabled for current time and day
      const settingsQuery = await db.collection('notification_settings')
        .where('weeklyProgress.enabled', '==', true)
        .where('weeklyProgress.time', '==', currentTime)
        .where('weeklyProgress.day', '==', currentDay)
        .get();

      if (settingsQuery.empty) {
        console.log('No weekly progress notifications scheduled for this time');
        return;
      }

      console.log(`Found ${settingsQuery.size} users with weekly progress notifications`);

      const notifications = [];
      
      for (const doc of settingsQuery.docs) {
        const userId = doc.id;
        const settings = doc.data();
        
        // Get user's FCM token
        const tokenDoc = await db.collection('user_tokens').doc(userId).get();
        if (!tokenDoc.exists) {
          console.log(`No FCM token found for user ${userId}`);
          continue;
        }

        const { fcmToken } = tokenDoc.data();
        const message = settings.weeklyProgress.message || "Check out your weekly progress! 📊";

        notifications.push({
          fcmToken,
          userId,
          title: "📊 Weekly Progress Report",
          body: message,
          data: {
            type: 'weekly_progress',
            userId
          }
        });
      }

      // Send all notifications
      for (const notification of notifications) {
        try {
          await this.sendNotification(
            notification.fcmToken,
            notification.title,
            notification.body,
            notification.data
          );
        } catch (error) {
          console.error(`Failed to send weekly progress to user ${notification.userId}:`, error);
        }
      }

      console.log(`Sent ${notifications.length} weekly progress notifications`);
      
    } catch (error) {
      console.error('Error sending weekly progress notifications:', error);
    }
  }

  /**
   * Log notification history
   */
  async logNotificationHistory(fcmToken, title, body, data, status, response, error = null) {
    try {
      const historyData = {
        fcmToken,
        title,
        body,
        data,
        status, // 'sent', 'failed'
        response: response ? JSON.stringify(response) : null,
        error,
        sentAt: new Date().toISOString()
      };

      // Extract userId from data or fcmToken reference
      if (data.userId) {
        historyData.userId = data.userId;
      }

      await db.collection('notification_history').add(historyData);
      
    } catch (error) {
      console.error('Error logging notification history:', error);
    }
  }
}

module.exports = new NotificationService();
