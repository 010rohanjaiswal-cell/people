#!/bin/bash

# Push to GitHub Repositories Script
# Run this after creating the repositories on GitHub

echo "🚀 Pushing Projects to GitHub Repositories"
echo "=========================================="

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

# GitHub username
GITHUB_USERNAME="010rohanjaiswal-cell"

# Repository names
BACKEND_REPO="freelancing-platform-backend"
MOBILE_REPO="freelancing-mobile-app"
ADMIN_REPO="freelancing-admin-panel"

echo ""
print_info "This script will push the following projects to GitHub:"
echo "1. $BACKEND_REPO (Backend API)"
echo "2. $MOBILE_REPO (React Native Mobile App)"
echo "3. $ADMIN_REPO (Next.js Admin Panel)"

echo ""
print_warning "Make sure you have created these repositories on GitHub first!"
echo "Repository URLs:"
echo "Backend: https://github.com/$GITHUB_USERNAME/$BACKEND_REPO"
echo "Mobile App: https://github.com/$GITHUB_USERNAME/$MOBILE_REPO"
echo "Admin Panel: https://github.com/$GITHUB_USERNAME/$ADMIN_REPO"

echo ""
read -p "Have you created the repositories on GitHub? (y/n): " -n 1 -r
echo

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    print_info "Please create the repositories on GitHub first, then run this script again."
    exit 1
fi

# Function to push repository
push_repo() {
    local repo_name=$1
    local repo_path=$2
    
    echo ""
    print_info "Pushing $repo_name to GitHub..."
    
    if [ ! -d "$repo_path" ]; then
        print_error "Directory $repo_path does not exist"
        return 1
    fi
    
    cd "$repo_path" || return 1
    
    # Check if git repository exists
    if [ ! -d ".git" ]; then
        print_error "Git repository not found in $repo_path"
        return 1
    fi
    
    # Set remote origin
    git remote remove origin 2>/dev/null || true
    git remote add origin "https://github.com/$GITHUB_USERNAME/$repo_name.git"
    
    # Push to GitHub
    print_info "Pushing to GitHub..."
    if git push -u origin main 2>/dev/null || git push -u origin master 2>/dev/null; then
        print_status "$repo_name successfully pushed to GitHub"
        echo "   Repository URL: https://github.com/$GITHUB_USERNAME/$repo_name"
    else
        print_error "Failed to push $repo_name to GitHub"
        print_warning "Check your GitHub credentials and repository permissions"
    fi
    
    cd - > /dev/null || return 1
}

# Push each repository
print_info "Starting push process..."

# 1. Backend Repository
push_repo "$BACKEND_REPO" "."

# 2. Mobile App Repository
push_repo "$MOBILE_REPO" "freelancing-platform/freelancing-mobile-app"

# 3. Admin Panel Repository
push_repo "$ADMIN_REPO" "freelancing-platform/freelancing-admin-panel"

echo ""
print_status "Push process complete!"
echo ""
print_info "Repository URLs:"
echo "Backend: https://github.com/$GITHUB_USERNAME/$BACKEND_REPO"
echo "Mobile App: https://github.com/$GITHUB_USERNAME/$MOBILE_REPO"
echo "Admin Panel: https://github.com/$GITHUB_USERNAME/$ADMIN_REPO"
echo ""
print_info "Next steps:"
echo "1. Verify all code is pushed correctly"
echo "2. Set up deployment platforms (Render, Vercel, Expo)"
echo "3. Configure environment variables for production"
echo "4. Set up CI/CD pipelines"
echo ""
print_warning "Remember to update API URLs in production environment variables!"
