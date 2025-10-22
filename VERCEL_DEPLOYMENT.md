# Vercel Deployment Guide - Fractal Search Engine

## 🚀 Quick Deploy to Vercel

### Option 1: Deploy with Vercel CLI

1. **Install Vercel CLI**
   ```bash
   npm i -g vercel
   ```

2. **Login to Vercel**
   ```bash
   vercel login
   ```

3. **Deploy from project root**
   ```bash
   vercel --prod
   ```

### Option 2: Deploy via GitHub Integration

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Prepare for Vercel deployment"
   git push origin main
   ```

2. **Connect to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Import your GitHub repository
   - Vercel will auto-detect Next.js and configure build settings

## 📁 Project Structure for Vercel

```
Project/
├── frontend/                 # Next.js app (main deployment)
│   ├── src/
│   ├── package.json
│   └── next.config.js
├── api/                     # Vercel serverless functions
│   ├── search.ts           # Main search API
│   ├── health.ts           # Health check
│   └── package.json
├── vercel.json             # Vercel configuration
├── .vercelignore          # Files to ignore
└── .env.production        # Production environment variables
```

## ⚙️ Configuration Files

### `vercel.json`
- Configures builds for frontend and API
- Sets up routing between frontend and API
- Defines function timeouts and environment

### `next.config.js`
- Optimized for Vercel deployment
- Three.js webpack configuration
- Security headers and performance optimizations

## 🔧 Environment Variables

Set these in Vercel Dashboard → Settings → Environment Variables:

### Required
- `NODE_ENV=production`
- `NEXT_PUBLIC_APP_NAME=Fractal Search Engine`

### Optional
- `NEXT_PUBLIC_ANALYTICS_ID` - For analytics tracking
- `VERCEL_ANALYTICS_ID` - For Vercel Analytics

## 🎯 Features Included

### Frontend (Next.js)
- ✅ Beautiful shader animations with Three.js
- ✅ Responsive design with Tailwind CSS
- ✅ Framer Motion animations
- ✅ Search interface with transparent cards
- ✅ Optimized for Vercel's edge network

### Backend (Serverless Functions)
- ✅ Mock search API with realistic data
- ✅ Health check endpoint
- ✅ CORS enabled for cross-origin requests
- ✅ TypeScript support

## 🌐 API Endpoints

After deployment, your API will be available at:

- `https://your-app.vercel.app/api/search` - Search functionality
- `https://your-app.vercel.app/api/health` - Health check

## 🔄 Development vs Production

### Development
```bash
cd frontend
npm run dev
```

### Production (Vercel)
- Automatic builds on git push
- Edge caching and optimization
- Global CDN distribution
- Serverless function scaling

## 📊 Performance Optimizations

### Frontend
- Static generation where possible
- Image optimization
- Code splitting
- Gzip compression

### API
- Serverless functions with cold start optimization
- Response caching headers
- Efficient mock data serving

## 🛠️ Troubleshooting

### Build Issues
1. Check Node.js version compatibility
2. Verify all dependencies are in package.json
3. Check TypeScript compilation errors

### Runtime Issues
1. Check Vercel function logs
2. Verify environment variables
3. Test API endpoints individually

### Three.js Issues
1. Webpack fallbacks configured in next.config.js
2. Client-side only rendering for WebGL

## 🚀 Post-Deployment

1. **Test the deployment**
   - Visit your Vercel URL
   - Test search functionality
   - Verify animations work properly

2. **Set up custom domain** (optional)
   - Add domain in Vercel dashboard
   - Configure DNS settings

3. **Enable analytics** (optional)
   - Add Vercel Analytics
   - Set up monitoring

## 📈 Scaling Considerations

- Vercel automatically scales serverless functions
- Frontend is served from global CDN
- Consider upgrading to Pro plan for higher limits
- Add real backend services as needed (Elasticsearch, etc.)

## 🔐 Security

- CORS properly configured
- Security headers enabled
- No sensitive data in client-side code
- Environment variables properly secured

---

**Ready to deploy!** 🎉

Your Fractal Search Engine is now optimized for Vercel's platform with beautiful animations, responsive design, and scalable architecture.
