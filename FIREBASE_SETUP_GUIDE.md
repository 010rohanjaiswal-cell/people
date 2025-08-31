# 🔥 Firebase Production Setup Guide

## 📋 Your Existing Firebase Project Configuration

### 1. Firebase Project Settings

**Current Project:** [Your Firebase Project Name]
**Project ID:** [Your Project ID]

### 2. Required Firebase Services Setup

#### 🔐 Authentication Setup
1. **Go to Firebase Console > Authentication > Sign-in method**
2. **Enable Phone Number provider:**
   - ✅ Enable Phone Number sign-in
   - ✅ Add test phone numbers for development
   - ✅ Configure reCAPTCHA verification

#### 📱 Cloud Messaging Setup
1. **Go to Project Settings > Cloud Messaging**
2. **Generate Server Key:**
   - Copy the Server Key for backend integration
   - Save as: `FIREBASE_SERVER_KEY` in environment variables

3. **Configure VAPID Key:**
   - Generate VAPID key for web push notifications
   - Save as: `FIREBASE_VAPID_KEY` in environment variables

#### ☁️ Cloud Storage Setup
1. **Go to Storage > Rules**
2. **Update Storage Rules:**
```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Allow authenticated users to upload files
    match /{userId}/{allPaths=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Allow public read access to uploaded files
    match /public/{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}
```

### 3. Service Account Setup

#### Generate Service Account Key
1. **Go to Project Settings > Service Accounts**
2. **Click "Generate New Private Key"**
3. **Download the JSON file**
4. **Save as:** `config/firebase-service-account.json`

### 4. Environment Variables Configuration

#### Backend Environment Variables (.env)
```env
# Firebase Configuration
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
FIREBASE_SERVICE_ACCOUNT_PATH=./config/firebase-service-account.json
FIREBASE_SERVER_KEY=your-server-key
FIREBASE_VAPID_KEY=your-vapid-key

# Production Settings
NODE_ENV=production
JWT_SECRET=your-super-secure-jwt-secret
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/freelancing-platform
REDIS_URL=redis://your-redis-url:6379
```

#### Mobile App Environment Variables (.env)
```env
# Firebase Configuration
EXPO_PUBLIC_FIREBASE_API_KEY=your-api-key
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project-id.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
EXPO_PUBLIC_FIREBASE_APP_ID=your-app-id
EXPO_PUBLIC_FIREBASE_VAPID_KEY=your-vapid-key

# API Configuration
EXPO_PUBLIC_API_URL=https://your-backend.onrender.com/api
```

### 5. Firebase Configuration Files

#### Backend Firebase Config (config/firebase.js)
```javascript
// Update the project ID and bucket name
const firebaseConfig = {
  projectId: process.env.FIREBASE_PROJECT_ID || 'your-project-id',
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET || 'your-project-id.appspot.com'
};
```

#### Mobile App Firebase Config (src/config/firebase.js)
```javascript
// Update with your Firebase config
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID
};
```

### 6. Testing Firebase Integration

#### Test Push Notifications
```bash
# Test backend push notifications
curl -X POST \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"Test Notification","body":"Firebase integration test"}' \
  http://localhost:10000/api/notifications/send-test
```

#### Test File Upload
```bash
# Test file upload to Firebase Storage
curl -X POST \
  -H "Authorization: Bearer YOUR_USER_TOKEN" \
  -F "file=@test-image.jpg" \
  http://localhost:10000/api/upload/file
```

### 7. Firebase Security Checklist

- ✅ **Authentication Rules** - Phone number auth enabled
- ✅ **Storage Rules** - Secure file access rules
- ✅ **Service Account** - Private key downloaded
- ✅ **Environment Variables** - All keys configured
- ✅ **CORS Settings** - Allowed origins configured
- ✅ **API Keys** - Restricted to your domains

### 8. Next Steps

1. **Configure your Firebase project** with the settings above
2. **Update environment variables** with your actual Firebase credentials
3. **Test the integration** locally
4. **Proceed to Redis setup**
5. **Deploy to production**

---

**🎯 Once you've configured your Firebase project, we'll proceed with Redis setup and production deployment!**
