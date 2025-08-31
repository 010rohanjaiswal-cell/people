# 🔧 Disable reCAPTCHA Enterprise in Firebase Console

## ❌ **Current Issue**
```
Failed to initialize reCAPTCHA Enterprise config. Triggering the reCAPTCHA v2 verification.
Firebase: Error (auth/argument-error)
```

## 🎯 **Root Cause**
Firebase is automatically trying to use **reCAPTCHA Enterprise** even when not explicitly enabled. This needs to be disabled in Firebase Console.

## 🔧 **Step-by-Step Solution**

### **Step 1: Access Firebase Console**
1. **Go to**: https://console.firebase.google.com
2. **Select project**: freelancing-platform-69389
3. **Login**: Use your Google account

### **Step 2: Navigate to Authentication Settings**
1. **Click**: Authentication (left sidebar)
2. **Click**: Settings (gear icon)
3. **Click**: Advanced tab

### **Step 3: Disable reCAPTCHA Enterprise**
1. **Look for**: "reCAPTCHA Enterprise" section
2. **Find**: "Enable reCAPTCHA Enterprise" toggle
3. **Action**: Turn OFF (disable)
4. **Save**: Click "Save" button

### **Step 4: Alternative - Check Project Settings**
1. **Go to**: Project Settings (gear icon in top left)
2. **Click**: General tab
3. **Look for**: "reCAPTCHA Enterprise" settings
4. **Disable**: Any reCAPTCHA Enterprise options

### **Step 5: Enable Standard Phone Auth**
1. **Go to**: Authentication → Sign-in method
2. **Find**: Phone
3. **Click**: Enable
4. **Save**: Apply changes

### **Step 6: Add Test Numbers**
1. **Go to**: Authentication → Phone → Phone numbers for testing
2. **Add**:
   ```
   +918282828282 - 828282
   +916666666666 - 666666
   +919999999999 - 999999
   ```

## 🚀 **Firebase Console Navigation Path**

### **Method 1: Authentication Settings**
```
Firebase Console → Authentication → Settings → Advanced → reCAPTCHA Enterprise → Disable
```

### **Method 2: Project Settings**
```
Firebase Console → Project Settings → General → reCAPTCHA Enterprise → Disable
```

### **Method 3: Security Rules**
```
Firebase Console → Authentication → Rules → Check for reCAPTCHA settings
```

## 📱 **After Disabling reCAPTCHA Enterprise**

### **Expected Behavior**
- ✅ No reCAPTCHA Enterprise errors
- ✅ Phone authentication works
- ✅ OTP sent successfully
- ✅ Backend integration works

### **Test Flow**
1. **Add test number**: +918282828282 - 828282
2. **Send OTP**: Should work without errors
3. **Enter OTP**: 828282
4. **Verify**: Authentication successful

## 🔍 **If reCAPTCHA Enterprise Option Not Found**

### **Alternative Solutions**
1. **Check Billing**: reCAPTCHA Enterprise might be tied to billing
2. **Contact Support**: Firebase support can disable it
3. **Create New Project**: Start fresh without reCAPTCHA Enterprise
4. **Use Different Region**: Some regions have different defaults

### **Billing Check**
1. **Go to**: Firebase Console → Usage and billing
2. **Check**: reCAPTCHA Enterprise usage
3. **Disable**: If enabled, disable billing for it

## 🎯 **Verification Steps**

### **After Changes**
1. **Wait**: 2-3 minutes for changes to propagate
2. **Restart**: Development server
3. **Test**: OTP flow again
4. **Check**: No reCAPTCHA errors

### **Success Indicators**
```
✅ Firebase: Sending OTP to: +918282828282
✅ Firebase: OTP sent successfully
✅ Backend: Token verified
✅ App: Navigation to profile creation
```

## 📞 **Next Steps**
1. **Disable reCAPTCHA Enterprise** in Firebase Console
2. **Enable phone authentication**
3. **Add test numbers**
4. **Restart development server**
5. **Test OTP flow**

**The key is to disable reCAPTCHA Enterprise in Firebase Console - this is a project-level setting that's causing the auth/argument-error!** 🔧
