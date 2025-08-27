# Deployment Checklist for Separated Projects

## 🚀 Backend Deployment (Render)

### Pre-Deployment Checklist
- [ ] **Environment Variables Set**
  - [ ] `MONGODB_URI` (MongoDB Atlas connection string)
  - [ ] `JWT_SECRET` (strong secret key)
  - [ ] `JWT_EXPIRES_IN` (token expiration time)
  - [ ] `ADMIN_EMAIL` (admin login email)
  - [ ] `ADMIN_PASSWORD` (admin login password)
  - [ ] `NODE_ENV=production`
  - [ ] `CORS_ORIGIN` (frontend URLs)

- [ ] **Database Setup**
  - [ ] MongoDB Atlas cluster created
  - [ ] Database user with proper permissions
  - [ ] Network access configured (0.0.0.0/0 for Render)
  - [ ] Database seeded with initial data

- [ ] **Code Preparation**
  - [ ] All environment variables moved to `.env`
  - [ ] No hardcoded secrets in code
  - [ ] Error handling implemented
  - [ ] Logging configured
  - [ ] CORS properly configured for frontend domains

### Render Deployment Steps
1. **Connect Repository**
   - [ ] Link GitHub repository to Render
   - [ ] Select `freelancing-platform-backend` branch

2. **Configure Service**
   - [ ] Service Type: Web Service
   - [ ] Environment: Node
   - [ ] Build Command: `npm install`
   - [ ] Start Command: `npm start`
   - [ ] Auto-Deploy: Yes

3. **Environment Variables**
   ```env
   NODE_ENV=production
   PORT=10000
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database
   JWT_SECRET=your-super-secret-jwt-key-here
   JWT_EXPIRES_IN=7d
   ADMIN_EMAIL=admin@yourplatform.com
   ADMIN_PASSWORD=secure-admin-password
   CORS_ORIGIN=https://your-admin-panel.vercel.app,https://your-mobile-app.expo.dev
   ```

4. **Deploy**
   - [ ] Trigger initial deployment
   - [ ] Verify deployment success
   - [ ] Test health endpoint: `https://your-backend.onrender.com/api/health`

### Post-Deployment Verification
- [ ] **API Testing**
  - [ ] Health check endpoint responds
  - [ ] Authentication endpoints work
  - [ ] File uploads work
  - [ ] Database connections stable

- [ ] **Security Check**
  - [ ] HTTPS enforced
  - [ ] CORS properly configured
  - [ ] Rate limiting active
  - [ ] No sensitive data in logs

- [ ] **Performance Check**
  - [ ] Response times acceptable
  - [ ] Memory usage stable
  - [ ] No memory leaks

## 📱 Mobile App Deployment (Expo)

### Pre-Deployment Checklist
- [ ] **Environment Setup**
  - [ ] Expo account created
  - [ ] EAS CLI installed: `npm install -g @expo/eas-cli`
  - [ ] EAS project configured: `eas build:configure`

- [ ] **Code Preparation**
  - [ ] API base URL updated to production
  - [ ] Environment variables configured
  - [ ] App icons and splash screens ready
  - [ ] App.json configured properly

### Environment Configuration
```json
// app.json
{
  "expo": {
    "name": "Freelancing Platform",
    "slug": "freelancing-platform",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#ffffff"
    },
    "updates": {
      "fallbackToCacheTimeout": 0
    },
    "assetBundlePatterns": [
      "**/*"
    ],
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "com.yourcompany.freelancingplatform"
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#FFFFFF"
      },
      "package": "com.yourcompany.freelancingplatform"
    }
  }
}
```

### EAS Build Configuration
```json
// eas.json
{
  "cli": {
    "version": ">= 3.13.3"
  },
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "preview": {
      "distribution": "internal"
    },
    "production": {
      "android": {
        "buildType": "apk"
      }
    }
  },
  "submit": {
    "production": {}
  }
}
```

### Build and Deploy Steps
1. **Development Build**
   ```bash
   eas build --platform all --profile development
   ```

2. **Production Build**
   ```bash
   eas build --platform all --profile production
   ```

3. **Submit to Stores**
   ```bash
   eas submit --platform ios
   eas submit --platform android
   ```

### Post-Deployment Verification
- [ ] **App Store/Play Store**
  - [ ] App submitted successfully
  - [ ] App review process initiated
  - [ ] App available for download

- [ ] **Functionality Testing**
  - [ ] Authentication works
  - [ ] API calls successful
  - [ ] Push notifications work
  - [ ] Offline functionality works

## 🖥️ Admin Panel Deployment (Vercel)

### Pre-Deployment Checklist
- [ ] **Environment Setup**
  - [ ] Vercel account created
  - [ ] Vercel CLI installed: `npm i -g vercel`
  - [ ] Next.js project configured

- [ ] **Code Preparation**
  - [ ] API base URL updated to production
  - [ ] Environment variables configured
  - [ ] Build optimization completed
  - [ ] SEO meta tags added

### Environment Configuration
```env
# .env.local
NEXT_PUBLIC_API_URL=https://your-backend.onrender.com/api
NEXT_PUBLIC_APP_NAME=Freelancing Platform Admin
```

### Vercel Configuration
```json
// vercel.json
{
  "version": 2,
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/next"
    }
  ],
  "env": {
    "NEXT_PUBLIC_API_URL": "https://your-backend.onrender.com/api"
  }
}
```

### Deploy Steps
1. **Connect Repository**
   - [ ] Link GitHub repository to Vercel
   - [ ] Configure build settings

2. **Environment Variables**
   - [ ] Set `NEXT_PUBLIC_API_URL`
   - [ ] Set any other required variables

3. **Deploy**
   - [ ] Trigger deployment
   - [ ] Verify build success
   - [ ] Test admin panel functionality

### Post-Deployment Verification
- [ ] **Functionality Testing**
  - [ ] Admin login works
  - [ ] Dashboard loads correctly
  - [ ] All admin features functional
  - [ ] Responsive design works

- [ ] **Performance Check**
  - [ ] Page load times acceptable
  - [ ] Images optimized
  - [ ] Bundle size reasonable

## 🔗 Cross-Project Integration

### API Integration Verification
- [ ] **Backend API**
  - [ ] All endpoints accessible from frontend
  - [ ] CORS properly configured
  - [ ] Authentication working
  - [ ] File uploads functional

- [ ] **Mobile App**
  - [ ] API calls successful
  - [ ] Token storage working
  - [ ] Error handling implemented
  - [ ] Offline handling configured

- [ ] **Admin Panel**
  - [ ] API integration working
  - [ ] Real-time updates functional
  - [ ] Admin authentication secure
  - [ ] Dashboard data accurate

### Environment Variables Sync
```bash
# Backend (Render)
MONGODB_URI=mongodb+srv://...
JWT_SECRET=your-secret
CORS_ORIGIN=https://your-admin-panel.vercel.app

# Mobile App (Expo)
EXPO_PUBLIC_API_URL=https://your-backend.onrender.com/api

# Admin Panel (Vercel)
NEXT_PUBLIC_API_URL=https://your-backend.onrender.com/api
```

## 📊 Monitoring Setup

### Backend Monitoring
- [ ] **Render Dashboard**
  - [ ] Uptime monitoring enabled
  - [ ] Performance metrics tracked
  - [ ] Error logs monitored

- [ ] **MongoDB Atlas**
  - [ ] Database performance monitoring
  - [ ] Connection pool monitoring
  - [ ] Query performance tracking

### Frontend Monitoring
- [ ] **Mobile App**
  - [ ] Crash reporting (Sentry)
  - [ ] Analytics (Firebase Analytics)
  - [ ] Performance monitoring

- [ ] **Admin Panel**
  - [ ] Vercel Analytics enabled
  - [ ] Error tracking (Sentry)
  - [ ] User behavior analytics

## 🔒 Security Verification

### Backend Security
- [ ] **Authentication**
  - [ ] JWT tokens secure
  - [ ] Password hashing implemented
  - [ ] Rate limiting active

- [ ] **Data Protection**
  - [ ] HTTPS enforced
  - [ ] Input validation active
  - [ ] SQL injection prevention

### Frontend Security
- [ ] **Token Management**
  - [ ] Secure token storage
  - [ ] Token refresh mechanism
  - [ ] Logout functionality

- [ ] **Data Validation**
  - [ ] Client-side validation
  - [ ] XSS prevention
  - [ ] CSRF protection

## 🚨 Emergency Procedures

### Rollback Procedures
- [ ] **Backend Rollback**
  - [ ] Previous deployment available
  - [ ] Database backup available
  - [ ] Environment variables documented

- [ ] **Frontend Rollback**
  - [ ] Previous versions tagged
  - [ ] App store rollback process
  - [ ] CDN cache clearing

### Incident Response
- [ ] **Monitoring Alerts**
  - [ ] Uptime alerts configured
  - [ ] Error rate alerts
  - [ ] Performance degradation alerts

- [ ] **Communication Plan**
  - [ ] Team notification system
  - [ ] User communication plan
  - [ ] Status page setup

## 📈 Post-Launch Checklist

### Performance Monitoring
- [ ] **Backend Performance**
  - [ ] Response times tracked
  - [ ] Error rates monitored
  - [ ] Database performance optimized

- [ ] **Frontend Performance**
  - [ ] App load times monitored
  - [ ] User engagement tracked
  - [ ] Crash rates monitored

### User Experience
- [ ] **Mobile App**
  - [ ] User onboarding flow
  - [ ] Feature discovery
  - [ ] Support system

- [ ] **Admin Panel**
  - [ ] Admin workflow efficiency
  - [ ] Data visualization
  - [ ] Management tools

### Business Metrics
- [ ] **Platform Analytics**
  - [ ] User registration rates
  - [ ] Job posting frequency
  - [ ] Transaction volumes
  - [ ] Revenue tracking

## 🔄 Maintenance Schedule

### Weekly Tasks
- [ ] Review error logs
- [ ] Check performance metrics
- [ ] Update dependencies
- [ ] Backup verification

### Monthly Tasks
- [ ] Security audit
- [ ] Performance optimization
- [ ] User feedback review
- [ ] Feature planning

### Quarterly Tasks
- [ ] Infrastructure review
- [ ] Scaling assessment
- [ ] Technology stack evaluation
- [ ] Business metrics analysis
