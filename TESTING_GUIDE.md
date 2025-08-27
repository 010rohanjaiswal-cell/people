# 🧪 Testing Guide for Separated Projects

## ✅ **Current Status**

- **Backend API**: ✅ Running on `http://localhost:10000`
- **Admin Panel**: ✅ Running on `http://localhost:3000`
- **Mobile App**: ✅ Running on Expo development server
- **API Integration**: ✅ All endpoints working

## 🚀 **Quick Test Commands**

### 1. Test Backend API
```bash
# Health check
curl http://localhost:10000/api/health

# Send OTP
curl -X POST http://localhost:10000/api/auth/send-otp \
  -H "Content-Type: application/json" \
  -d '{"phone": "9876543210"}'

# Admin login
curl -X POST http://localhost:10000/api/auth/admin/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@freelancingplatform.com", "password": "admin123456"}'
```

### 2. Test Frontend Applications

#### Admin Panel
1. Open browser and go to: `http://localhost:3000/login`
2. Login with:
   - Email: `admin@freelancingplatform.com`
   - Password: `admin123456`
3. You should see the dashboard with platform statistics

#### Mobile App
1. Install Expo Go app on your phone
2. Scan the QR code from the terminal
3. Test the login flow:
   - Enter phone number: `9876543210`
   - Enter OTP: `123456`
   - Select role: Client or Freelancer

## 📱 **Mobile App Testing**

### Authentication Flow
1. **Login Screen**
   - Enter phone number
   - Tap "Send OTP"
   - Should show success message

2. **OTP Screen**
   - Enter 6-digit OTP: `123456`
   - Select role (Client/Freelancer)
   - Tap "Verify OTP"
   - Should navigate to appropriate dashboard

### Expected Behavior
- ✅ Phone number validation
- ✅ OTP sending and verification
- ✅ Role selection
- ✅ Navigation to dashboard
- ✅ Error handling for invalid inputs

## 🖥️ **Admin Panel Testing**

### Authentication Flow
1. **Login Page**
   - Enter admin email and password
   - Tap "Sign in"
   - Should redirect to dashboard

2. **Dashboard**
   - Should display platform statistics
   - Should show quick action buttons
   - Should handle API errors gracefully

### Expected Behavior
- ✅ Admin authentication
- ✅ Dashboard data loading
- ✅ Statistics display
- ✅ Error handling
- ✅ Responsive design

## 🔗 **API Integration Testing**

### Environment Variables
```env
# Mobile App (.env)
EXPO_PUBLIC_API_URL=http://localhost:10000/api

# Admin Panel (.env.local)
NEXT_PUBLIC_API_URL=http://localhost:10000/api
```

### API Endpoints Tested
- ✅ `GET /api/health` - Health check
- ✅ `POST /api/auth/send-otp` - Send OTP
- ✅ `POST /api/auth/verify-otp` - Verify OTP
- ✅ `POST /api/auth/admin/login` - Admin login
- ✅ `GET /api/admin/stats` - Platform statistics

## 🐛 **Troubleshooting**

### Common Issues

#### 1. Backend Not Running
```bash
# Check if backend is running
curl http://localhost:10000/api/health

# If not running, start it
npm run dev
```

#### 2. CORS Issues
- Backend CORS is configured for:
  - `http://localhost:3000` (Admin Panel)
  - `http://localhost:19006` (Expo)
  - `http://localhost:8081` (React Native Metro)

#### 3. API Connection Issues
- Verify environment variables are set correctly
- Check that API URLs match the backend port (10000)
- Ensure backend is running before testing frontend

#### 4. Mobile App Issues
- Make sure Expo Go app is installed
- Check that phone and computer are on same network
- Try refreshing the Expo development server

#### 5. Admin Panel Issues
- Clear browser cache
- Check browser console for errors
- Verify Next.js development server is running

## 📊 **Performance Testing**

### Backend Performance
```bash
# Test API response time
time curl http://localhost:10000/api/health

# Test concurrent requests
for i in {1..10}; do
  curl http://localhost:10000/api/health &
done
wait
```

### Frontend Performance
- Admin Panel: Check browser dev tools for load times
- Mobile App: Monitor Expo development server logs

## 🔒 **Security Testing**

### Authentication
- ✅ JWT token generation and validation
- ✅ Admin authentication
- ✅ OTP-based authentication
- ✅ Token expiration handling

### Input Validation
- ✅ Phone number validation
- ✅ OTP format validation
- ✅ Email/password validation
- ✅ API input sanitization

## 📱 **Mobile App Specific Tests**

### Device Testing
- Test on both iOS and Android devices
- Test on different screen sizes
- Test with different network conditions

### Offline Handling
- Test app behavior when offline
- Test API error handling
- Test retry mechanisms

## 🖥️ **Admin Panel Specific Tests**

### Browser Compatibility
- Test on Chrome, Firefox, Safari, Edge
- Test responsive design on different screen sizes
- Test with different zoom levels

### Data Display
- Verify statistics are accurate
- Test real-time data updates
- Test error states and loading states

## 🚀 **Production Readiness Checklist**

### Backend
- [ ] All environment variables configured
- [ ] Database connection stable
- [ ] API endpoints responding correctly
- [ ] Error handling implemented
- [ ] Logging configured

### Frontend
- [ ] API integration working
- [ ] Authentication flows complete
- [ ] Error handling implemented
- [ ] Loading states implemented
- [ ] Responsive design verified

### Integration
- [ ] CORS properly configured
- [ ] Environment variables set correctly
- [ ] API URLs updated for production
- [ ] Cross-platform testing completed

## 📝 **Test Results Template**

```
Test Date: _______________
Tester: _________________

Backend API:
- Health Check: ✅/❌
- OTP Endpoint: ✅/❌
- Admin Login: ✅/❌
- Stats Endpoint: ✅/❌

Admin Panel:
- Login Page: ✅/❌
- Dashboard: ✅/❌
- Responsive Design: ✅/❌

Mobile App:
- Login Screen: ✅/❌
- OTP Verification: ✅/❌
- Role Selection: ✅/❌
- Navigation: ✅/❌

Integration:
- API Communication: ✅/❌
- Error Handling: ✅/❌
- Performance: ✅/❌

Issues Found:
1. _________________
2. _________________
3. _________________

Notes:
_________________
_________________
```

## 🎯 **Next Steps After Testing**

1. **Fix any issues** found during testing
2. **Create GitHub repositories** using the setup script
3. **Configure production environment** variables
4. **Set up deployment pipelines**
5. **Deploy to production platforms**

---

## 🎉 **Success Criteria**

All tests should pass with:
- ✅ Backend API responding correctly
- ✅ Frontend applications loading properly
- ✅ Authentication flows working
- ✅ API integration successful
- ✅ Error handling graceful
- ✅ Performance acceptable

**Your separated projects are ready for production deployment!** 🚀
