# 🚀 Vercel Deployment Guide - Fractal Search Engine

This guide will help you deploy your AI-powered search engine to Vercel in just a few minutes.

## 📋 Prerequisites

Before deploying, make sure you have:

1. **API Keys Ready:**
   - Google Custom Search API Key ([Get it here](https://developers.google.com/custom-search/v1/introduction))
   - Google Custom Search Engine ID (CX ID)
   - Gemini API Key ([Get it here](https://makersuite.google.com/app/apikey))

2. **Vercel Account:**
   - Sign up at [vercel.com](https://vercel.com) (free tier available)

## 🚀 Quick Deploy (Recommended)

### Option 1: One-Click Deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/Hetpatel01021111/Fractal&project-name=fractal-search-engine&repository-name=fractal-search-engine&root-directory=frontend)

### Option 2: Deploy Script

1. **Run the deployment script:**
   ```bash
   ./deploy.sh
   ```

2. **Follow the prompts** to configure environment variables and deploy.

## 🔧 Manual Deployment

### Step 1: Prepare Your Repository

1. **Push to GitHub/GitLab:**
   ```bash
   git add .
   git commit -m "Ready for Vercel deployment"
   git push origin main
   ```

### Step 2: Connect to Vercel

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click **"New Project"**
3. Import your Git repository
4. **Important:** Set **Root Directory** to `frontend`

### Step 3: Configure Build Settings

Vercel should auto-detect Next.js, but verify these settings:

```bash
Framework Preset: Next.js
Build Command: npm run build
Output Directory: .next
Install Command: npm install
Root Directory: frontend
```

### Step 4: Add Environment Variables

In Vercel Dashboard → Settings → Environment Variables, add:

#### Required Variables:
```bash
GOOGLE_API_KEY=your_google_custom_search_api_key
GOOGLE_CX_ID=your_custom_search_engine_id
GEMINI_API_KEY=your_gemini_api_key
```

#### Optional Variables:
```bash
# For enhanced search (if you have Elasticsearch)
ELASTICSEARCH_URL=https://your-elasticsearch-cloud-url.com:443
ELASTICSEARCH_API_KEY=your_elasticsearch_api_key

# App configuration
NEXT_PUBLIC_APP_NAME=Fractal Search Engine
NODE_ENV=production
```

### Step 5: Deploy

1. Click **"Deploy"**
2. Wait for build to complete (usually 2-3 minutes)
3. Your app will be live at `https://your-project-name.vercel.app`

## 🔑 Getting API Keys

### Google Custom Search API

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable "Custom Search API"
4. Go to "Credentials" → "Create Credentials" → "API Key"
5. Copy your API key

### Google Custom Search Engine ID

1. Go to [Google Custom Search](https://cse.google.com/cse/)
2. Click "Add" to create new search engine
3. Enter `*` to search the entire web
4. Click "Create"
5. Copy the "Search engine ID" (CX ID)

### Gemini API Key

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Click "Create API Key"
3. Select your project
4. Copy the generated API key

## 🎯 Features Included

Your deployed search engine includes:

✅ **Real Google Search Results** - Web, Images, Videos  
✅ **AI-Generated Descriptions** - Powered by Gemini API  
✅ **Beautiful Shader Background** - Animated Three.js graphics  
✅ **Perfect Card Alignment** - Consistent 140px height cards  
✅ **Responsive Design** - Works on all devices  
✅ **Fast Performance** - Optimized for Vercel Edge Network  

## 🔧 Troubleshooting

### Build Fails

**Error:** `Module not found: Can't resolve 'three'`
```bash
# Solution: Install missing dependencies
cd frontend
npm install three @types/three @react-three/fiber
```

**Error:** `Turbopack not supported on Vercel`
```bash
# Solution: Already fixed in next.config.js
# Turbopack is disabled for Vercel compatibility
```

### API Keys Not Working

1. **Check Environment Variables:**
   - Go to Vercel Dashboard → Settings → Environment Variables
   - Ensure all keys are added without quotes
   - Redeploy after adding variables

2. **Test API Keys:**
   ```bash
   # Test Google Custom Search
   curl "https://www.googleapis.com/customsearch/v1?key=YOUR_API_KEY&cx=YOUR_CX_ID&q=test"
   
   # Test Gemini API (requires proper authentication)
   ```

### Search Returns No Results

1. **Check API Quotas:**
   - Google Custom Search: 100 queries/day (free tier)
   - Gemini API: Check your quota in Google AI Studio

2. **Verify CX ID:**
   - Make sure your Custom Search Engine is set to search "Entire web"
   - CX ID should be in format: `abc123def456:ghi789jkl`

## 📊 Performance Optimization

### Vercel Edge Functions

Your API routes automatically run on Vercel's Edge Network for optimal performance:

- `/api/search` - Web search with AI descriptions
- `/api/searchimages` - Image search
- `/api/searchvideos` - Video search

### Caching Strategy

Vercel automatically caches:
- Static assets (CSS, JS, images)
- API responses (with proper headers)
- Build outputs

## 🌐 Custom Domain

### Add Your Domain

1. Go to Vercel Dashboard → Settings → Domains
2. Add your custom domain
3. Configure DNS records as instructed:
   ```
   Type: CNAME
   Name: www (or @)
   Value: cname.vercel-dns.com
   ```

### SSL Certificate

Vercel automatically provisions SSL certificates for all domains.

## 📈 Monitoring

### Built-in Analytics

Vercel provides:
- Real-time performance metrics
- Error tracking
- Usage statistics

### Custom Monitoring

Add Sentry for advanced error tracking:

```bash
npm install @sentry/nextjs
```

## 🔄 Updates & Maintenance

### Automatic Deployments

Vercel automatically deploys when you push to your main branch:

```bash
git add .
git commit -m "Update search features"
git push origin main
# Vercel automatically deploys
```

### Manual Deployments

```bash
# From frontend directory
vercel --prod
```

## 💡 Tips for Success

1. **Start Small:** Deploy with basic features first, then add advanced ones
2. **Monitor Quotas:** Keep track of your API usage
3. **Test Thoroughly:** Use Vercel preview deployments for testing
4. **Optimize Images:** Use Next.js Image component for better performance
5. **Cache Wisely:** Implement caching for API responses

## 🎉 You're Live!

Once deployed, your search engine will be available at:
- **Production:** `https://your-project-name.vercel.app`
- **Custom Domain:** `https://yourdomain.com` (if configured)

### Share Your Success

Your AI-powered search engine is now live with:
- Real Google search results
- AI-generated descriptions
- Beautiful animations
- Professional design
- Lightning-fast performance

Enjoy your new search engine! 🚀✨
