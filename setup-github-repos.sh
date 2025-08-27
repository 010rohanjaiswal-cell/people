#!/bin/bash

# GitHub Repository Setup Script for Freelancing Platform
# This script helps you create and push the separated projects to GitHub

echo "🚀 Setting up GitHub Repositories for Freelancing Platform"
echo "========================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

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

# Check if git is installed
if ! command -v git &> /dev/null; then
    print_error "Git is not installed. Please install Git first."
    exit 1
fi

print_status "Git is installed"

# Get GitHub username
echo ""
print_info "Please enter your GitHub username:"
read -r GITHUB_USERNAME

if [ -z "$GITHUB_USERNAME" ]; then
    print_error "GitHub username is required"
    exit 1
fi

print_status "GitHub username: $GITHUB_USERNAME"

# Repository names
BACKEND_REPO="freelancing-platform-backend"
MOBILE_REPO="freelancing-mobile-app"
ADMIN_REPO="freelancing-admin-panel"

echo ""
print_info "This script will help you create the following repositories:"
echo "1. $BACKEND_REPO (your current backend)"
echo "2. $MOBILE_REPO (React Native mobile app)"
echo "3. $ADMIN_REPO (Next.js admin panel)"

echo ""
print_warning "Make sure you have created these repositories on GitHub first!"
echo "You can create them at: https://github.com/new"

echo ""
read -p "Have you created the repositories on GitHub? (y/n): " -n 1 -r
echo

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    print_info "Please create the repositories on GitHub first, then run this script again."
    exit 1
fi

# Function to setup repository
setup_repo() {
    local repo_name=$1
    local repo_path=$2
    local description=$3
    
    echo ""
    print_info "Setting up $repo_name..."
    
    if [ ! -d "$repo_path" ]; then
        print_error "Directory $repo_path does not exist"
        return 1
    fi
    
    cd "$repo_path" || return 1
    
    # Initialize git if not already initialized
    if [ ! -d ".git" ]; then
        git init
        print_status "Git repository initialized"
    fi
    
    # Add all files
    git add .
    
    # Check if there are changes to commit
    if git diff --cached --quiet; then
        print_warning "No changes to commit in $repo_name"
    else
        git commit -m "Initial commit: $description"
        print_status "Initial commit created"
    fi
    
    # Set up remote
    git remote remove origin 2>/dev/null || true
    git remote add origin "https://github.com/$GITHUB_USERNAME/$repo_name.git"
    
    # Push to GitHub
    print_info "Pushing to GitHub..."
    if git push -u origin main 2>/dev/null || git push -u origin master 2>/dev/null; then
        print_status "$repo_name successfully pushed to GitHub"
        echo "   Repository URL: https://github.com/$GITHUB_USERNAME/$repo_name"
    else
        print_error "Failed to push $repo_name to GitHub"
        print_warning "Make sure the repository exists and you have proper permissions"
    fi
    
    cd - > /dev/null || return 1
}

# Setup each repository
print_info "Starting repository setup..."

# 1. Backend Repository (current directory)
setup_repo "$BACKEND_REPO" "." "Backend API for freelancing platform"

# 2. Mobile App Repository
setup_repo "$MOBILE_REPO" "freelancing-platform/freelancing-mobile-app" "React Native mobile app for freelancing platform"

# 3. Admin Panel Repository
setup_repo "$ADMIN_REPO" "freelancing-platform/freelancing-admin-panel" "Next.js admin panel for freelancing platform"

echo ""
print_status "Repository setup complete!"
echo ""
print_info "Repository URLs:"
echo "Backend: https://github.com/$GITHUB_USERNAME/$BACKEND_REPO"
echo "Mobile App: https://github.com/$GITHUB_USERNAME/$MOBILE_REPO"
echo "Admin Panel: https://github.com/$GITHUB_USERNAME/$ADMIN_REPO"
echo ""
print_info "Next steps:"
echo "1. Configure deployment settings in each repository"
echo "2. Set up environment variables for production"
echo "3. Connect repositories to deployment platforms (Render, Vercel, Expo)"
echo ""
print_warning "Remember to update API URLs in production environment variables!"
