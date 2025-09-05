# 🔧 Render Firebase Environment Variables Setup

## ❌ **Current Issue**
Even with new Firebase project, still getting:
```
Failed to initialize reCAPTCHA Enterprise config. Triggering the reCAPTCHA v2 verification.
Firebase: Error (auth/argument-error)
```

## 🎯 **Root Cause**
The issue is in the app code, and we need to add Firebase credentials to Render environment variables.

## 🔧 **Step 1: Add Firebase Credentials to Render**

### **Go to Render Dashboard**
1. **Visit**: https://dashboard.render.com
2. **Select**: Your freelancing-platform-backend service
3. **Click**: Environment tab

### **Add These Environment Variables**
```
FIREBASE_PROJECT_ID=freelancing-platform-v2
FIREBASE_PRIVATE_KEY=YOUR_PRIVATE_KEY_HERE
FIREBASE_CLIENT_EMAIL=YOUR_CLIENT_EMAIL_HERE
```

## 🔧 **Step 2: Get Firebase Service Account Key**

### **From Firebase Console**
1. **Go to**: https://console.firebase.google.com
2. **Select**: freelancing-platform-v2
3. **Go to**: Project Settings → Service accounts
4. **Click**: "Generate new private key"
5. **Download**: JSON file

### **From JSON File, Get These Values**
```json
{
  "type": "service_account",
  "project_id": "freelancing-platform-v2",
  "private_key_id": "...",
  "private_key": "-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n",
  "client_email": "firebase-adminsdk-xxxxx@freelancing-platform-v2.iam.gserviceaccount.com",
  "client_id": "...",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "..."
}
```

### **Add to Render Environment Variables**
```
FIREBASE_PROJECT_ID=freelancing-platform-v2
FIREBASE_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@freelancing-platform-v2.iam.gserviceaccount.com
```

## 🔧 **Step 3: Update Backend Firebase Config**

The backend needs to use these environment variables properly.

## 🚀 **Step 4: Fix the App Code Issue**

The reCAPTCHA error is coming from the mobile app code, not Firebase project settings.

## 📞 **Next Steps**
1. **Add Firebase credentials** to Render environment variables
2. **Fix the mobile app code** to handle phone auth properly
3. **Test the complete flow**

**The issue is in the app code - we need to fix the phone authentication implementation!** 🔧
