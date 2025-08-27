#!/bin/bash

# Freelancing Platform Frontend Projects Setup Script
# This script creates the mobile app and admin panel projects

echo "🚀 Setting up Freelancing Platform Frontend Projects"
echo "=================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    print_error "npm is not installed. Please install npm first."
    exit 1
fi

print_status "Node.js and npm are installed"

# Create parent directory for all projects
PARENT_DIR="freelancing-platform"
mkdir -p $PARENT_DIR
cd $PARENT_DIR

print_info "Created parent directory: $PARENT_DIR"

# 1. Create Mobile App (React Native with Expo)
echo ""
print_info "Creating Mobile App (React Native with Expo)..."

if [ -d "freelancing-mobile-app" ]; then
    print_warning "Mobile app directory already exists. Skipping..."
else
    npx create-expo-app@latest freelancing-mobile-app --template blank
    if [ $? -eq 0 ]; then
        print_status "Mobile app created successfully"
    else
        print_error "Failed to create mobile app"
        exit 1
    fi
fi

# 2. Create Admin Panel (Next.js)
echo ""
print_info "Creating Admin Panel (Next.js)..."

if [ -d "freelancing-admin-panel" ]; then
    print_warning "Admin panel directory already exists. Skipping..."
else
    npx create-next-app@latest freelancing-admin-panel --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --yes
    if [ $? -eq 0 ]; then
        print_status "Admin panel created successfully"
    else
        print_error "Failed to create admin panel"
        exit 1
    fi
fi

# 3. Install additional dependencies for Mobile App
echo ""
print_info "Installing Mobile App dependencies..."

cd freelancing-mobile-app

# Install essential dependencies
npm install axios @react-native-async-storage/async-storage @react-navigation/native @react-navigation/stack react-native-screens react-native-safe-area-context expo-location expo-image-picker

# Install dev dependencies
npm install --save-dev @babel/core

print_status "Mobile app dependencies installed"

# Create environment file
cat > .env << EOF
EXPO_PUBLIC_API_URL=http://localhost:5000/api
EOF

print_status "Mobile app environment file created"

# Create basic project structure
mkdir -p src/{components,screens/{auth,client,freelancer,common},services,utils,navigation,store}
mkdir -p assets

print_status "Mobile app directory structure created"

cd ..

# 4. Install additional dependencies for Admin Panel
echo ""
print_info "Installing Admin Panel dependencies..."

cd freelancing-admin-panel

# Install essential dependencies
npm install axios react-query recharts react-hook-form @headlessui/react @heroicons/react

print_status "Admin panel dependencies installed"

# Create environment file
cat > .env.local << EOF
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_APP_NAME=Freelancing Platform Admin
EOF

print_status "Admin panel environment file created"

# Create basic project structure
mkdir -p src/{components,services,utils,hooks,types}
mkdir -p src/app/{auth,dashboard,users,jobs,transactions,analytics}

print_status "Admin panel directory structure created"

cd ..

# 5. Create README files
echo ""
print_info "Creating README files..."

# Mobile App README
cat > freelancing-mobile-app/README.md << 'EOF'
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
EOF

# Admin Panel README
cat > freelancing-admin-panel/README.md << 'EOF'
# Freelancing Platform Admin Panel

Next.js web application for platform administration.

## Features

- Admin authentication
- User management
- Job monitoring
- Transaction management
- Platform analytics
- Freelancer verification

## Quick Start

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Set environment variables**
   ```bash
   # .env.local
   NEXT_PUBLIC_API_URL=http://localhost:5000/api
   NEXT_PUBLIC_APP_NAME=Freelancing Platform Admin
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

4. **Open in browser**
   ```
   http://localhost:3000
   ```

## Project Structure

```
src/
├── app/             # Next.js app router pages
│   ├── auth/        # Authentication pages
│   ├── dashboard/   # Dashboard pages
│   ├── users/       # User management
│   ├── jobs/        # Job management
│   ├── transactions/ # Transaction management
│   └── analytics/   # Analytics pages
├── components/      # UI components
├── services/        # API services
├── utils/           # Helper functions
├── hooks/           # Custom hooks
└── types/           # TypeScript types
```

## API Integration

The admin panel connects to the backend API at: `http://localhost:5000/api`

See `FRONTEND_API_GUIDE.md` in the backend repository for detailed API documentation.

## Deployment

1. **Deploy to Vercel**
   ```bash
   vercel --prod
   ```

2. **Or connect GitHub repository to Vercel for automatic deployment**

## Environment Variables

- `NEXT_PUBLIC_API_URL` - Backend API URL
- `NEXT_PUBLIC_APP_NAME` - Application name
EOF

print_status "README files created"

# 6. Create a main README for the entire project
cat > README.md << 'EOF'
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
EOF

print_status "Main README created"

# 7. Final summary
echo ""
echo "🎉 Frontend Projects Setup Complete!"
echo "=================================="
print_status "Mobile App: freelancing-mobile-app/"
print_status "Admin Panel: freelancing-admin-panel/"
echo ""
print_info "Next Steps:"
echo "1. Navigate to each project directory"
echo "2. Install dependencies: npm install"
echo "3. Start development servers"
echo "4. Configure environment variables"
echo "5. Begin development!"
echo ""
print_info "Backend API should be running on: http://localhost:5000"
print_info "Mobile App will connect via Expo"
print_info "Admin Panel will run on: http://localhost:3000"
echo ""
print_warning "Remember to update API URLs in production!"
