# Freelancing Platform - Complete Project

This repository contains the complete freelancing platform with separated backend and frontend projects.

## Project Structure

```
freelancing-platform/
├── freelancing-platform-backend/  # Backend API (separate repo)
├── freelancing-mobile-app/        # React Native mobile app
└── freelancing-admin-panel/       # Next.js admin panel
```

## Quick Start

### 1. Backend Setup
```bash
cd freelancing-platform-backend
npm install
npm run dev
```

### 2. Mobile App Setup
```bash
cd freelancing-mobile-app
npm install
npm start
```

### 3. Admin Panel Setup
```bash
cd freelancing-admin-panel
npm install
npm run dev
```

## Development Workflow

1. **Backend Development**
   - API runs on `http://localhost:5000`
   - Use Postman collection for testing

2. **Mobile App Development**
   - Expo dev server starts automatically
   - Test on device or simulator

3. **Admin Panel Development**
   - Runs on `http://localhost:3000`
   - Hot reload enabled

## Deployment

- **Backend**: Deploy to Render
- **Mobile App**: Build with EAS, submit to app stores
- **Admin Panel**: Deploy to Vercel

See `DEPLOYMENT_CHECKLIST.md` for detailed deployment instructions.

## Documentation

- `SEPARATED_PROJECTS_GUIDE.md` - Architecture overview
- `FRONTEND_API_GUIDE.md` - API integration guide
- `DEPLOYMENT_CHECKLIST.md` - Deployment instructions

## Support

For issues and questions, please refer to the individual project READMEs or create an issue in the respective repository.
