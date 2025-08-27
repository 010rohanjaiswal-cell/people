# Separated Projects Architecture Guide

## 🏗️ Project Structure Overview

This guide explains how to manage your freelancing platform with separated backend and frontend projects.

```
📁 Freelancing Platform
├── 📁 freelancing-platform-backend (this repo)
│   ├── Node.js/Express API
│   ├── MongoDB Database
│   └── Deployed on Render/Heroku
│
├── 📁 freelancing-mobile-app (separate repo)
│   ├── React Native App
│   ├── Client & Freelancer interfaces
│   └── Deployed on Expo/App Store
│
└── 📁 freelancing-admin-panel (separate repo)
    ├── Next.js Web App
    ├── Admin dashboard
    └── Deployed on Vercel/Netlify
```

## 🚀 Backend Project (Current)

### Repository Structure
```
freelancing-platform-backend/
├── config/                 # Firebase, payment configs
├── middleware/            # Auth, upload, role middleware
├── models/               # MongoDB models
├── routes/               # API endpoints
├── scripts/              # Database seeding
├── utils/                # Utility services
├── uploads/              # File storage
├── server.js             # Main server
├── package.json
├── render.yaml           # Render deployment
└── README.md
```

### Deployment (Render)
```yaml
# render.yaml
services:
  - type: web
    name: freelancing-backend
    env: node
    buildCommand: npm install
    startCommand: npm start
    envVars:
      - key: NODE_ENV
        value: production
      - key: MONGODB_URI
        sync: false
      - key: JWT_SECRET
        sync: false
```

### Environment Variables
```env
# Production (.env)
PORT=5000
MONGODB_URI=mongodb+srv://...
JWT_SECRET=your-super-secret-key
JWT_EXPIRES_IN=7d
ADMIN_EMAIL=admin@platform.com
ADMIN_PASSWORD=secure-password
```

## 📱 Mobile App Project (React Native)

### Create New Repository
```bash
# Create new repo: freelancing-mobile-app
npx create-expo-app freelancing-mobile-app
cd freelancing-mobile-app
```

### Project Structure
```
freelancing-mobile-app/
├── src/
│   ├── components/       # Reusable components
│   ├── screens/         # App screens
│   │   ├── auth/        # Login, OTP screens
│   │   ├── client/      # Client-specific screens
│   │   ├── freelancer/  # Freelancer-specific screens
│   │   └── common/      # Shared screens
│   ├── services/        # API calls
│   ├── utils/           # Helper functions
│   ├── navigation/      # Navigation setup
│   └── store/           # State management
├── assets/              # Images, fonts
├── App.js
├── package.json
└── app.json
```

### Key Dependencies
```json
{
  "dependencies": {
    "expo": "~49.0.0",
    "react": "18.2.0",
    "react-native": "0.72.6",
    "@react-navigation/native": "^6.1.9",
    "@react-navigation/stack": "^6.3.20",
    "axios": "^1.6.0",
    "@react-native-async-storage/async-storage": "^1.19.5",
    "expo-location": "~16.1.0",
    "expo-image-picker": "~14.3.2"
  }
}
```

### API Integration
```javascript
// src/services/api.js
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

// Add auth token to requests
api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
```

### Environment Setup
```env
# .env
EXPO_PUBLIC_API_URL=https://your-backend.onrender.com/api
```

## 🖥️ Admin Panel Project (Next.js)

### Create New Repository
```bash
# Create new repo: freelancing-admin-panel
npx create-next-app@latest freelancing-admin-panel --typescript --tailwind --eslint
cd freelancing-admin-panel
```

### Project Structure
```
freelancing-admin-panel/
├── src/
│   ├── components/       # UI components
│   ├── pages/           # Next.js pages
│   │   ├── auth/        # Login page
│   │   ├── dashboard/   # Admin dashboard
│   │   ├── users/       # User management
│   │   ├── jobs/        # Job management
│   │   └── transactions/ # Payment management
│   ├── services/        # API services
│   ├── utils/           # Helper functions
│   ├── hooks/           # Custom hooks
│   └── types/           # TypeScript types
├── public/              # Static assets
├── package.json
├── next.config.js
└── tailwind.config.js
```

### Key Dependencies
```json
{
  "dependencies": {
    "next": "14.0.0",
    "react": "18.2.0",
    "react-dom": "18.2.0",
    "axios": "^1.6.0",
    "react-query": "^3.39.3",
    "recharts": "^2.8.0",
    "react-hook-form": "^7.48.2",
    "next-auth": "^4.24.5"
  }
}
```

### API Integration
```typescript
// src/services/api.ts
import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
```

### Environment Setup
```env
# .env.local
NEXT_PUBLIC_API_URL=https://your-backend.onrender.com/api
```

## 🔄 Development Workflow

### 1. Backend Development
```bash
# In freelancing-platform-backend
npm run dev
# API runs on http://localhost:5000
```

### 2. Mobile App Development
```bash
# In freelancing-mobile-app
npm start
# Expo dev server starts
```

### 3. Admin Panel Development
```bash
# In freelancing-admin-panel
npm run dev
# Admin panel runs on http://localhost:3000
```

## 🚀 Deployment Strategy

### Backend (Render)
1. Connect GitHub repo to Render
2. Set environment variables
3. Deploy automatically on push to main

### Mobile App (Expo)
1. Build with EAS Build
2. Submit to App Store/Play Store
3. Use Expo Updates for OTA updates

### Admin Panel (Vercel)
1. Connect GitHub repo to Vercel
2. Set environment variables
3. Deploy automatically on push to main

## 🔐 Environment Variables Management

### Backend (.env)
```env
PORT=5000
MONGODB_URI=mongodb+srv://...
JWT_SECRET=your-secret
JWT_EXPIRES_IN=7d
ADMIN_EMAIL=admin@platform.com
ADMIN_PASSWORD=secure-password
```

### Mobile App (.env)
```env
EXPO_PUBLIC_API_URL=https://your-backend.onrender.com/api
```

### Admin Panel (.env.local)
```env
NEXT_PUBLIC_API_URL=https://your-backend.onrender.com/api
```

## 📊 Monitoring & Analytics

### Backend Monitoring
- Render dashboard for API performance
- MongoDB Atlas for database monitoring
- Custom logging for business metrics

### Mobile App Analytics
- Expo Analytics
- Firebase Analytics
- Custom event tracking

### Admin Panel Analytics
- Vercel Analytics
- Google Analytics
- Custom dashboard metrics

## 🔄 CI/CD Pipeline

### Backend Pipeline
```yaml
# .github/workflows/deploy.yml
name: Deploy Backend
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Deploy to Render
        run: |
          # Render deployment steps
```

### Frontend Pipelines
- Mobile: EAS Build + App Store Connect
- Admin: Vercel automatic deployment

## 🧪 Testing Strategy

### Backend Testing
- Unit tests for services
- Integration tests for API endpoints
- Load testing for performance

### Frontend Testing
- Mobile: Jest + React Native Testing Library
- Admin: Jest + React Testing Library

## 📱 Cross-Platform Considerations

### Mobile App
- iOS and Android compatibility
- Responsive design for different screen sizes
- Offline functionality
- Push notifications

### Admin Panel
- Responsive web design
- Cross-browser compatibility
- Progressive Web App features

## 🔒 Security Considerations

### Backend Security
- JWT token validation
- Rate limiting
- Input sanitization
- CORS configuration

### Frontend Security
- Secure token storage
- HTTPS enforcement
- Input validation
- XSS protection

## 📈 Scaling Strategy

### Backend Scaling
- Horizontal scaling on Render
- Database optimization
- Caching strategies
- CDN for static assets

### Frontend Scaling
- CDN for static assets
- Code splitting
- Lazy loading
- Progressive enhancement

## 🆘 Troubleshooting

### Common Issues
1. **CORS Errors**: Check backend CORS configuration
2. **API Connection**: Verify environment variables
3. **Build Failures**: Check dependency versions
4. **Deployment Issues**: Review deployment logs

### Support Resources
- Backend: Render logs and MongoDB Atlas
- Mobile: Expo logs and device testing
- Admin: Vercel logs and browser dev tools
