# 🔐 Freelancer Verification Flow Testing Guide

## 📱 **Complete Verification Flow Testing**

### **🎯 What You'll Test:**
1. **Freelancer Registration** → **Manual Verification** → **Admin Review** → **Approve/Reject**

---

## **Step 1: Freelancer Registration & Login**

### **🌐 Access Mobile App**
```
URL: http://localhost:8081
```

### **📱 Freelancer Login Process**
1. **Open Mobile App**
   - Go to: http://localhost:8081
   - You should see the login screen

2. **Enter Phone Number**
   - Use a **new testing number**: `9999999999`
   - Click "Send OTP"

3. **Verify OTP**
   - **OTP will be**: `123456` (for any new number)
   - Enter the OTP
   - Select role: **Freelancer**
   - Click "Verify"

4. **Complete Profile Setup**
   - Fill in required information:
     - **Name**: "Test Freelancer"
     - **Email**: "test@freelancer.com"
     - **Skills**: "Plumbing, Electrical"
     - **Experience**: "5 years"
     - **Documents**: Upload any test document
   - Click "Complete Profile"

---

## **Step 2: Manual Verification Process**

### **📋 What Happens After Registration**
1. **Freelancer Status**: `pending_verification`
2. **Admin Notification**: New freelancer needs verification
3. **Freelancer Dashboard**: Shows "Verification Pending" message

### **🔍 Check Freelancer Dashboard**
- Login as freelancer: `9999999999` / `123456`
- Navigate to Profile/Dashboard
- You should see: "Verification Status: Pending"
- Limited access to features until verified

---

## **Step 3: Admin Review Process**

### **🖥️ Access Admin Panel**
```
URL: http://localhost:3000
```

### **🔐 Admin Login**
1. **Go to Admin Panel**
   - URL: http://localhost:3000
   - Should redirect to login page

2. **Admin Credentials**
   - **Email**: `admin@freelancingplatform.com`
   - **Password**: `admin123`
   - Click "Sign In"

### **📊 Review Pending Verifications**
1. **Navigate to Dashboard**
   - Check for new verification requests
   - Look for "Pending Verifications" section

2. **View Freelancer Details**
   - Click on the pending freelancer
   - Review submitted information:
     - Personal details
     - Skills and experience
     - Uploaded documents
     - Contact information

3. **Verification Options**
   - **Approve**: Change status to `verified`
   - **Reject**: Change status to `rejected`
   - **Request More Info**: Send message to freelancer

---

## **Step 4: Admin Decision**

### **✅ Approve Freelancer**
1. **Click "Approve"**
   - Status changes to `verified`
   - Freelancer gets notification
   - Full access granted

2. **Check Result**
   - Freelancer can now access all features
   - Can browse and apply for jobs
   - Can send messages to clients

### **❌ Reject Freelancer**
1. **Click "Reject"**
   - Status changes to `rejected`
   - Freelancer gets notification
   - Limited access maintained

2. **Provide Reason** (if available)
   - Enter rejection reason
   - Send notification to freelancer

---

## **Step 5: Verify Results**

### **📱 Check Freelancer Side**
1. **Login as Freelancer Again**
   - Phone: `9999999999`
   - OTP: `123456`

2. **Check Status**
   - **If Approved**: Full dashboard access
   - **If Rejected**: Limited access with rejection message

### **🖥️ Check Admin Side**
1. **Verify in Admin Dashboard**
   - Check user status updated
   - Review verification history
   - Monitor user activity

---

## **🧪 Testing Scenarios**

### **Scenario 1: Complete Approval Flow**
1. **Register Freelancer**: `9999999999`
2. **Admin Reviews**: Check all details
3. **Admin Approves**: Click approve
4. **Verify Access**: Freelancer gets full access

### **Scenario 2: Rejection Flow**
1. **Register Freelancer**: `8888888888`
2. **Admin Reviews**: Check details
3. **Admin Rejects**: Click reject
4. **Verify Limitation**: Freelancer access restricted

### **Scenario 3: Multiple Verifications**
1. **Register Multiple Freelancers**
   - `7777777777`, `6666666666`, `5555555555`
2. **Admin Reviews All**: Check dashboard
3. **Approve Some, Reject Others**
4. **Verify Different Outcomes**

---

## **🔧 Troubleshooting**

### **OTP Not Working**
- **Check Backend Logs**: Look for OTP generation
- **Use Known Numbers**: `+915555555555` (OTP: `555555`)
- **Check Network**: Ensure API calls are working

### **Admin Panel Issues**
- **Clear Browser Cache**: Hard refresh (Ctrl+F5)
- **Check Credentials**: Verify admin login details
- **Check Backend**: Ensure API is responding

### **Verification Not Showing**
- **Check Database**: Verify user status
- **Refresh Admin Panel**: Check for new requests
- **Check Notifications**: Look for admin alerts

---

## **📊 Expected Results**

### **✅ Successful Verification Flow**
- Freelancer registration completes
- Admin sees pending verification
- Admin can approve/reject
- Freelancer status updates correctly
- Notifications sent to freelancer

### **❌ Common Issues**
- OTP not sending (check backend logs)
- Admin panel not loading (check Next.js)
- Verification not showing (check database)
- Status not updating (check API calls)

---

## **🎯 Quick Test Commands**

### **Test OTP Sending**
```bash
curl -X POST http://localhost:10000/api/auth/send-otp \
  -H "Content-Type: application/json" \
  -d '{"phone": "9999999999"}'
```

### **Test OTP Verification**
```bash
curl -X POST http://localhost:10000/api/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{"phone": "9999999999", "otp": "123456", "role": "freelancer"}'
```

### **Check Admin Dashboard**
```bash
curl -X GET http://localhost:10000/api/admin/dashboard \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN"
```

---

## **🚀 Ready to Test!**

**Follow these steps to test the complete verification flow:**

1. **Start with Freelancer Registration**
2. **Complete Profile Setup**
3. **Switch to Admin Panel**
4. **Review and Make Decision**
5. **Verify Results on Both Sides**

**The platform is ready for comprehensive verification testing!** 🎉
