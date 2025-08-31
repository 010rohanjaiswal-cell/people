#!/bin/bash

# 🖥️ Freelancing Platform - Admin Panel Deployment Script

echo "🖥️ Starting admin panel deployment..."

# Navigate to admin panel directory
cd freelancing-platform/freelancing-admin-panel

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "📦 Installing Vercel CLI..."
    npm install -g vercel
fi

# Check if logged into Vercel
if ! vercel whoami &> /dev/null; then
    echo "🔐 Please log into your Vercel account..."
    vercel login
fi

# Check if project is configured
if [ ! -f "package.json" ]; then
    echo "❌ package.json not found. Please check the directory."
    exit 1
fi

# Check environment variables
echo "📋 Checking environment variables..."

if [ -z "$NEXT_PUBLIC_API_URL" ]; then
    echo "❌ NEXT_PUBLIC_API_URL is not set."
    echo "Please set the backend API URL before deploying."
    echo "Example: export NEXT_PUBLIC_API_URL=https://your-backend.onrender.com/api"
    exit 1
fi

echo "✅ Environment variables are set."
echo "   API URL: $NEXT_PUBLIC_API_URL"

# Build the project
echo "🔨 Building the project..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed. Please check the errors above."
    exit 1
fi

echo "✅ Build completed successfully."

# Deploy to Vercel
echo "🚀 Deploying to Vercel..."
vercel --prod

if [ $? -eq 0 ]; then
    echo "✅ Deployment completed successfully!"
    echo ""
    echo "🌐 Your admin panel is now live!"
    echo "📊 Monitor your deployment at: https://vercel.com/dashboard"
    echo ""
    echo "🔧 Environment variables can be configured in the Vercel dashboard."
else
    echo "❌ Deployment failed. Please check the errors above."
    exit 1
fi

echo ""
echo "🎉 Admin panel deployment completed!"
echo ""
echo "📱 Next steps:"
echo "1. Test the admin panel functionality"
echo "2. Configure analytics and monitoring"
echo "3. Set up custom domain (optional)"
echo "4. Configure environment variables in Vercel dashboard"
