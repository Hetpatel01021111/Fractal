#!/bin/bash

# 🚀 Fractal Search Engine - Deployment Script
# This script helps deploy your AI-powered search engine to Vercel

set -e

echo "🚀 Fractal Search Engine Deployment Script"
echo "=========================================="

# Check if we're in the right directory
if [ ! -f "vercel.json" ]; then
    echo "❌ Error: vercel.json not found. Please run this script from the project root."
    exit 1
fi

# Check if frontend directory exists
if [ ! -d "frontend" ]; then
    echo "❌ Error: frontend directory not found."
    exit 1
fi

echo "📁 Changing to frontend directory..."
cd frontend

# Check if package.json exists
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found in frontend directory."
    exit 1
fi

# Check if .env.local exists
if [ ! -f ".env.local" ]; then
    echo "⚠️  Warning: .env.local not found. Creating from template..."
    if [ -f ".env.example" ]; then
        cp .env.example .env.local
        echo "📝 Please edit .env.local with your API keys before deploying."
        echo "   Required variables:"
        echo "   - GOOGLE_API_KEY"
        echo "   - GOOGLE_CX_ID" 
        echo "   - GEMINI_API_KEY"
        read -p "Press Enter when you've updated .env.local..."
    else
        echo "❌ Error: .env.example not found. Please create .env.local manually."
        exit 1
    fi
fi

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Run build to check for errors
echo "🔨 Building application..."
npm run build

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "📥 Installing Vercel CLI..."
    npm install -g vercel
fi

# Deploy to Vercel
echo "🚀 Deploying to Vercel..."
echo "   Note: You'll need to configure environment variables in Vercel dashboard"
echo "   Go to: https://vercel.com/dashboard → Your Project → Settings → Environment Variables"

# Ask for deployment type
read -p "Deploy to production? (y/N): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    vercel --prod
else
    vercel
fi

echo "✅ Deployment complete!"
echo ""
echo "📋 Next Steps:"
echo "1. Configure environment variables in Vercel dashboard"
echo "2. Set up custom domain (optional)"
echo "3. Test your deployed application"
echo ""
echo "🔗 Useful Links:"
echo "   - Vercel Dashboard: https://vercel.com/dashboard"
echo "   - Google Custom Search: https://developers.google.com/custom-search/v1/introduction"
echo "   - Gemini API: https://makersuite.google.com/app/apikey"
echo ""
echo "🎉 Happy searching!"
