# Freelancing Platform Mobile App

React Native mobile application for the freelancing platform.

## Features

- Client and Freelancer interfaces
- OTP-based authentication
- Job posting and application
- Real-time messaging
- Payment management
- Profile management

## Quick Start

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Set environment variables**
   ```bash
   # .env
   EXPO_PUBLIC_API_URL=http://localhost:5000/api
   ```

3. **Start development server**
   ```bash
   npm start
   ```

4. **Run on device/simulator**
   ```bash
   # iOS
   npm run ios
   
   # Android
   npm run android
   ```

## Project Structure

```
src/
├── components/       # Reusable components
├── screens/         # App screens
│   ├── auth/        # Authentication screens
│   ├── client/      # Client-specific screens
│   ├── freelancer/  # Freelancer-specific screens
│   └── common/      # Shared screens
├── services/        # API services
├── utils/           # Helper functions
├── navigation/      # Navigation setup
└── store/           # State management
```

## API Integration

The app connects to the backend API at: `http://localhost:5000/api`

See `FRONTEND_API_GUIDE.md` in the backend repository for detailed API documentation.

## Deployment

1. **Build for production**
   ```bash
   eas build --platform all --profile production
   ```

2. **Submit to stores**
   ```bash
   eas submit --platform ios
   eas submit --platform android
   ```

## Environment Variables

- `EXPO_PUBLIC_API_URL` - Backend API URL
