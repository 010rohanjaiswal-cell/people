#!/bin/bash

# 📱 Freelancing Platform - Mobile App Deployment Script

echo "📱 Starting mobile app deployment..."

# Navigate to mobile app directory
cd freelancing-platform/freelancing-mobile-app

# Check if EAS CLI is installed
if ! command -v eas &> /dev/null; then
    echo "📦 Installing EAS CLI..."
    npm install -g @expo/eas-cli
fi

# Check if logged into Expo
if ! eas whoami &> /dev/null; then
    echo "🔐 Please log into your Expo account..."
    eas login
fi

# Check if project is configured
if [ ! -f "eas.json" ]; then
    echo "❌ eas.json not found. Please configure EAS first."
    exit 1
fi

# Check environment variables
echo "📋 Checking environment variables..."

required_vars=(
    "EXPO_PUBLIC_FIREBASE_API_KEY"
    "EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN"
    "EXPO_PUBLIC_FIREBASE_PROJECT_ID"
    "EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET"
    "EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID"
    "EXPO_PUBLIC_FIREBASE_APP_ID"
    "EXPO_PUBLIC_API_URL"
)

missing_vars=()

for var in "${required_vars[@]}"; do
    if [ -z "${!var}" ]; then
        missing_vars+=("$var")
    fi
done

if [ ${#missing_vars[@]} -ne 0 ]; then
    echo "❌ Missing required environment variables:"
    for var in "${missing_vars[@]}"; do
        echo "   - $var"
    done
    echo ""
    echo "Please set these environment variables before deploying."
    exit 1
fi

echo "✅ All required environment variables are set."

# Build for Android
echo "🤖 Building Android APK..."
eas build --platform android --profile production

# Check if build was successful
if [ $? -eq 0 ]; then
    echo "✅ Android build completed successfully!"
    echo ""
    echo "📱 Your Android APK is ready for distribution."
    echo "🌐 Download from: https://expo.dev/artifacts/eas/your-build-id.apk"
else
    echo "❌ Android build failed. Please check the logs."
    exit 1
fi

# Build for iOS (optional)
read -p "🍎 Do you want to build for iOS? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🍎 Building iOS app..."
    eas build --platform ios --profile production
    
    if [ $? -eq 0 ]; then
        echo "✅ iOS build completed successfully!"
        echo ""
        echo "🍎 Your iOS app is ready for App Store submission."
    else
        echo "❌ iOS build failed. Please check the logs."
    fi
fi

echo ""
echo "🎉 Mobile app deployment completed!"
echo ""
echo "📱 Next steps:"
echo "1. Download the Android APK from the provided link"
echo "2. Test the app on multiple devices"
echo "3. Submit to Google Play Store (Android)"
echo "4. Submit to App Store Connect (iOS)"
echo ""
echo "🔧 For app store submission, see: https://docs.expo.dev/submit/overview/"
