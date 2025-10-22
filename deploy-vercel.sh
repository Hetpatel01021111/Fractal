#!/bin/bash

echo "🚀 Deploying Fractal Search Engine to Vercel..."

# Check if vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI not found. Installing..."
    npm install -g vercel
fi

# Check if we're in the right directory
if [ ! -f "vercel.json" ]; then
    echo "❌ vercel.json not found. Make sure you're in the project root directory."
    exit 1
fi

# Clean and prepare frontend
echo "📦 Preparing frontend..."
cd frontend
npm install
npm run build
cd ..

# Deploy to Vercel
echo "🌐 Deploying to Vercel..."
vercel --prod

echo "✅ Deployment complete!"
echo "🎉 Your Fractal Search Engine is now live on Vercel!"
echo ""
echo "Next steps:"
echo "1. Visit your deployment URL"
echo "2. Test the search functionality"
echo "3. Enjoy the beautiful animations!"
echo ""
echo "📚 For more info, see VERCEL_DEPLOYMENT.md"
