# RunUp Server Setup

## Prerequisites
- Node.js (>= 16.0.0)
- Firebase Admin SDK service account key
- Firebase project with Firestore and FCM enabled

## Installation

1. Navigate to the server directory:
```bash
cd server
```

2. Install dependencies:
```bash
npm install
```

3. Create environment file:
```bash
cp .env.example .env
```

4. Configure environment variables in `.env`:
```env
NODE_ENV=development
PORT=3000
FIREBASE_SERVICE_ACCOUNT_KEY_PATH=./path/to/your/service-account-key.json
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

5. Add your Firebase service account key JSON file to the server directory.

## Running the Server

### Development mode (with auto-restart):
```bash
npm run dev
```

### Production mode:
```bash
npm start
```

## API Endpoints

### Notification Settings
- `GET /api/notifications/settings/:userId` - Get user notification settings
- `PUT /api/notifications/settings/:userId` - Update user notification settings
- `POST /api/notifications/test/:userId` - Send test notification
- `GET /api/notifications/history/:userId` - Get notification history

### User Management
- `PUT /api/users/:userId/fcm-token` - Update user's FCM token

### Health Check
- `GET /health` - Server health check

## Authentication
All API endpoints require Firebase ID token in the Authorization header:
```
Authorization: Bearer <firebase-id-token>
```

## Notification Types

### Daily Reminder
```json
{
  "dailyReminder": {
    "enabled": true,
    "time": "07:00",
    "message": "Good morning! Time for your daily workout! 💪",
    "days": [1, 2, 3, 4, 5]
  }
}
```

### Weekly Progress
```json
{
  "weeklyProgress": {
    "enabled": true,
    "day": 0,
    "time": "19:00",
    "message": "Check out your weekly progress! 📊"
  }
}
```

### Other Settings
```json
{
  "achievementNotifications": true,
  "motivationalMessages": true
}
```

## Database Collections

### notification_settings
Stores user notification preferences with fields:
- `dailyReminder` - Daily reminder settings
- `weeklyProgress` - Weekly progress notification settings
- `achievementNotifications` - Boolean for achievement notifications
- `motivationalMessages` - Boolean for motivational messages
- `createdAt` - Timestamp
- `updatedAt` - Timestamp

### user_tokens
Stores FCM tokens with fields:
- `fcmToken` - Firebase Cloud Messaging token
- `updatedAt` - Timestamp

### notification_history
Stores notification sending history with fields:
- `userId` - User ID
- `type` - Notification type
- `title` - Notification title
- `body` - Notification body
- `sentAt` - Timestamp
- `success` - Boolean indicating if send was successful

## Flutter Integration

Add to `pubspec.yaml`:
```yaml
dependencies:
  http: ^1.1.0
  firebase_messaging: ^15.1.5
```

Update the base URL in `NotificationApiService`:
```dart
static const String baseUrl = 'http://your-server-url:3000/api';
```

Initialize FCM in your Flutter app:
```dart
await NotificationService().initializeFCM();
```

Navigate to notification settings:
```dart
context.go('/notification-settings');
```
