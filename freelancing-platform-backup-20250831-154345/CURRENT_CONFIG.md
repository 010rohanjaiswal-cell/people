# ⚙️ Current Working Configuration

## 🔑 **Environment Variables**

### **Backend (.env)**
```env
NODE_ENV=production
PORT=10000
MONGODB_URI=mongodb+srv://rohanjaiswar2467:N8iwsBEfkbF2Dd2S@cluster1.sg9pmcf.mongodb.net/freelancing-platform?retryWrites=true&w=majority&appName=Cluster1
JWT_SECRET=your-jwt-secret
JWT_EXPIRES_IN=7d
CLOUDINARY_CLOUD_NAME=your-cloudinary-name
CLOUDINARY_API_KEY=your-cloudinary-key
CLOUDINARY_API_SECRET=your-cloudinary-secret
```

### **Mobile App (.env)**
```env
EXPO_PUBLIC_API_URL=https://freelancer-backend-jv21.onrender.com
```

## 🌐 **Production URLs**

- **Backend API**: `https://freelancer-backend-jv21.onrender.com`
- **Admin Panel**: `https://your-admin-panel.vercel.app`
- **Database**: MongoDB Atlas (Production)

## 📱 **Working Phone Numbers & OTPs**

### **Predefined OTPs (for testing)**
- `+919876543212` → OTP: `123456`
- `+919876543210` → OTP: `123456`
- `+918888888888` → OTP: `888888`
- `+917777777777` → OTP: `777777`
- `+916666666666` → OTP: `666666`

### **Random OTPs**
- Any other phone number generates random 6-digit OTP
- OTP expires in 10 minutes
- OTP can only be used once

## 🔧 **API Endpoints**

### **Authentication**
- `POST /api/auth/send-otp` - Send OTP
- `POST /api/auth/verify-otp` - Verify OTP
- `POST /api/auth/admin/login` - Admin login

### **Freelancer**
- `GET /api/freelancer/profile` - Get profile
- `POST /api/freelancer/save-profile` - Save profile
- `GET /api/freelancer/jobs/available` - Available jobs
- `POST /api/freelancer/jobs/:jobId/apply` - Apply for job

### **Client**
- `GET /api/client/profile` - Get profile
- `POST /api/client/save-profile` - Save profile
- `POST /api/client/jobs` - Post job
- `GET /api/client/jobs` - Get posted jobs

### **Jobs**
- `GET /api/jobs` - Get all jobs
- `GET /api/jobs/:jobId/offers` - Get job offers
- `POST /api/client/offers/:offerId/respond` - Respond to offer

## 📊 **Database Collections**

### **Users**
- `users` - User accounts
- `freelancerprofiles` - Freelancer profiles
- `clientprofiles` - Client profiles
- `jobs` - Job listings
- `offers` - Job offers
- `transactions` - Payment transactions
- `wallets` - User wallets
- `otps` - OTP records

## 🚀 **Development Commands**

### **Backend**
```bash
npm start          # Start production server
npm run dev        # Start development server
```

### **Mobile App**
```bash
npx expo start --tunnel --dev-client    # Start with tunnel mode
npx expo start --local                  # Start in local mode
```

### **Admin Panel**
```bash
npm run dev        # Start development server
npm run build      # Build for production
npm run start      # Start production server
```

## 🔍 **Debugging**

### **Check API Health**
```bash
curl https://freelancer-backend-jv21.onrender.com/api/health
```

### **Test OTP Send**
```bash
curl -X POST https://freelancer-backend-jv21.onrender.com/api/auth/send-otp \
  -H "Content-Type: application/json" \
  -d '{"phone":"9876543210"}'
```

### **Test OTP Verify**
```bash
curl -X POST https://freelancer-backend-jv21.onrender.com/api/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{"phone":"9876543210","otp":"123456"}'
```

## 📝 **Current Issues & Solutions**

### **OTP Verification Issue**
- **Problem**: Random OTPs not known to mobile app
- **Solution**: Use predefined phone numbers for testing
- **Workaround**: Check server logs for generated OTP

### **Network Issues**
- **Problem**: Local network connectivity in tunnel mode
- **Solution**: Use production URL in mobile app
- **Status**: ✅ Fixed

### **Firebase Integration**
- **Problem**: UID conflicts and authentication flow changes
- **Solution**: Create backup before integration
- **Status**: 🔄 Ready for integration

## 🎯 **Next Steps for Firebase Integration**

1. **Create New Branch**: `git checkout -b firebase-integration`
2. **Install Firebase**: `npm install firebase`
3. **Configure Firebase**: Set up Firebase project
4. **Update Authentication**: Replace OTP with Firebase Auth
5. **Update Database**: Add Firebase UID to user models
6. **Test Thoroughly**: Ensure all features work
7. **Deploy**: Update production with Firebase

## 📞 **Quick Commands**

### **Create New Backup**
```bash
cp -r freelancing-platform freelancing-platform-backup-$(date +%Y%m%d-%H%M%S)
```

### **Restore Backup**
```bash
cp -r freelancing-platform-backup-20250831-154345 freelancing-platform-restored
cd freelancing-platform-restored
npm install
```

### **Check Production Status**
```bash
curl -I https://freelancer-backend-jv21.onrender.com/api/health
```

---

**💡 This configuration is working perfectly! Use this as reference when integrating Firebase.**
