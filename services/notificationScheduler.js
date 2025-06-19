const cron = require('node-cron');
const notificationService = require('./notificationService');

let dailyReminderJob = null;
let weeklyProgressJob = null;

/**
 * Start the notification scheduler
 */
function startNotificationScheduler() {
  console.log('🕐 Starting notification scheduler...');

  // Daily reminder job - runs every minute to check for scheduled reminders
  dailyReminderJob = cron.schedule('* * * * *', async () => {
    try {
      await notificationService.sendDailyReminders();
    } catch (error) {
      console.error('Error in daily reminder job:', error);
    }
  }, {
    scheduled: true,
    timezone: "Asia/Jakarta" // Adjust timezone as needed
  });

  // Weekly progress job - runs every minute to check for scheduled weekly reports
  weeklyProgressJob = cron.schedule('* * * * *', async () => {
    try {
      await notificationService.sendWeeklyProgress();
    } catch (error) {
      console.error('Error in weekly progress job:', error);
    }
  }, {
    scheduled: true,
    timezone: "Asia/Jakarta" // Adjust timezone as needed
  });

  console.log('✅ Notification scheduler started successfully');
}

/**
 * Stop the notification scheduler
 */
function stopNotificationScheduler() {
  console.log('🛑 Stopping notification scheduler...');
  
  if (dailyReminderJob) {
    dailyReminderJob.stop();
    dailyReminderJob = null;
  }
  
  if (weeklyProgressJob) {
    weeklyProgressJob.stop();
    weeklyProgressJob = null;
  }
  
  console.log('✅ Notification scheduler stopped');
}

/**
 * Get scheduler status
 */
function getSchedulerStatus() {
  return {
    dailyReminder: dailyReminderJob ? dailyReminderJob.scheduled : false,
    weeklyProgress: weeklyProgressJob ? weeklyProgressJob.scheduled : false
  };
}

module.exports = {
  startNotificationScheduler,
  stopNotificationScheduler,
  getSchedulerStatus
};
