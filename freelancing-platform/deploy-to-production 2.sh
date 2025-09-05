#!/bin/bash

echo "🚀 Deploying Freelancing Platform to Production..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    print_error "Please run this script from the freelancing-platform directory"
    exit 1
fi

print_status "Starting production deployment..."

# 1. Deploy Backend to Render (if not already deployed)
print_status "1. Checking backend deployment..."
if curl -s https://freelancer-backend-jv21.onrender.com/api/health > /dev/null; then
    print_success "Backend is already deployed on Render"
else
    print_warning "Backend deployment status unknown. Please check Render dashboard."
fi

# 2. Deploy Admin Panel to Vercel
print_status "2. Deploying admin panel to Vercel..."
cd freelancing-admin-panel

# Check if Vercel is installed
if ! command -v vercel &> /dev/null; then
    print_warning "Vercel CLI not found. Installing..."
    npm install -g vercel
fi

# Deploy to Vercel
print_status "Building admin panel..."
npm run build

print_status "Deploying to Vercel..."
vercel --prod --yes

cd ..

# 3. Deploy Mobile App to Expo
print_status "3. Deploying mobile app to Expo..."
cd freelancing-mobile-app

# Check if EAS CLI is installed
if ! command -v eas &> /dev/null; then
    print_warning "EAS CLI not found. Installing..."
    npm install -g @expo/eas-cli
fi

# Build for production
print_status "Building mobile app for production..."
eas build --platform web --profile production

cd ..

# 4. Update environment variables
print_status "4. Updating environment variables..."

# Create production environment file for admin panel
cat > freelancing-admin-panel/.env.production << EOF
NEXT_PUBLIC_API_URL=https://freelancer-backend-jv21.onrender.com/api
NEXT_PUBLIC_APP_NAME=Freelancing Platform Admin
EOF

# Create production environment file for mobile app
cat > freelancing-mobile-app/.env.production << EOF
EXPO_PUBLIC_API_URL=https://freelancer-backend-jv21.onrender.com/api
EOF

print_success "Environment variables updated"

# 5. Test production endpoints
print_status "5. Testing production endpoints..."

# Test backend health
if curl -s https://freelancer-backend-jv21.onrender.com/api/health | grep -q "OK"; then
    print_success "Backend health check passed"
else
    print_error "Backend health check failed"
fi

# Test Firebase auth endpoint
if curl -s -X POST https://freelancer-backend-jv21.onrender.com/api/firebase-auth/firebase \
    -H "Content-Type: application/json" \
    -d '{"idToken":"test","phone":"+918282828282","role":"client"}' | grep -q "Firebase authentication failed"; then
    print_success "Firebase auth endpoint is accessible"
else
    print_error "Firebase auth endpoint test failed"
fi

print_status "6. Deployment Summary:"
echo ""
echo "🌐 Production URLs:"
echo "   Backend API: https://freelancer-backend-jv21.onrender.com/api"
echo "   Admin Panel: [Check Vercel deployment URL]"
echo "   Mobile App: [Check Expo deployment URL]"
echo ""
echo "📱 Testing Instructions:"
echo "   1. Add test numbers to Firebase Console"
echo "   2. Use production URLs for testing"
echo "   3. Test Firebase authentication flow"
echo ""
echo "🔧 Next Steps:"
echo "   1. Check Vercel dashboard for admin panel URL"
echo "   2. Check Expo dashboard for mobile app URL"
echo "   3. Test complete authentication flow"
echo "   4. Verify all features work in production"

print_success "Production deployment completed!"
print_warning "Please check the deployment URLs in your respective dashboards."
