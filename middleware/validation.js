const Joi = require('joi');

// Validation middleware for notification settings
const validateNotificationSettings = (req, res, next) => {
  const schema = Joi.object({
    dailyReminder: Joi.object({
      enabled: Joi.boolean().required(),
      time: Joi.string().pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).required(),
      message: Joi.string().max(200).optional(),
      days: Joi.array().items(Joi.number().min(0).max(6)).min(1).max(7).required()
    }).required(),
    weeklyProgress: Joi.object({
      enabled: Joi.boolean().required(),
      day: Joi.number().min(0).max(6).required(),
      time: Joi.string().pattern(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/).required(),
      message: Joi.string().max(200).optional()
    }).required(),
    achievementNotifications: Joi.boolean().required(),
    motivationalMessages: Joi.boolean().required(),
    fcmToken: Joi.string().optional()
  });

  const { error } = schema.validate(req.body);
  
  if (error) {
    return res.status(400).json({
      success: false,
      error: 'Validation error',
      details: error.details.map(detail => detail.message)
    });
  }
  
  next();
};

module.exports = {
  validateNotificationSettings
};
