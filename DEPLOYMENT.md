# 🚀 AI-Powered Search Engine - Deployment Guide

This comprehensive guide covers deploying your AI-powered search engine to various cloud platforms including Vercel, Render, Google Cloud Platform (GCP), and Amazon Web Services (AWS).

## 📋 Table of Contents

- [Prerequisites](#prerequisites)
- [Environment Variables](#environment-variables)
- [Local Development with Docker](#local-development-with-docker)
- [Frontend Deployment](#frontend-deployment)
  - [Vercel Deployment](#vercel-deployment)
  - [Netlify Deployment](#netlify-deployment)
- [Backend Deployment](#backend-deployment)
  - [Render Deployment](#render-deployment)
  - [Railway Deployment](#railway-deployment)
  - [Google Cloud Run](#google-cloud-run)
  - [AWS ECS](#aws-ecs)
- [Full Stack Deployment](#full-stack-deployment)
  - [Google Cloud Platform](#google-cloud-platform)
  - [Amazon Web Services](#amazon-web-services)
- [Database & Search](#database--search)
  - [Elasticsearch Cloud](#elasticsearch-cloud)
  - [Self-hosted Elasticsearch](#self-hosted-elasticsearch)
- [Monitoring & Analytics](#monitoring--analytics)
- [Troubleshooting](#troubleshooting)

## 🔧 Prerequisites

Before deploying, ensure you have:

- **Node.js 18+** installed locally
- **Docker** and **Docker Compose** (for containerized deployment)
- **Git** for version control
- **Gemini API Key** from Google AI Studio
- **Elasticsearch** instance (cloud or self-hosted)
- Cloud platform accounts (Vercel, Render, GCP, AWS)

## 🔐 Environment Variables

### Frontend Environment Variables

Create `.env.local` in the `frontend/` directory:

```bash
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_APP_NAME="AI Search Engine"
NEXT_PUBLIC_APP_VERSION=1.0.0

# Analytics (Optional)
NEXT_PUBLIC_GA_ID=your-google-analytics-id
NEXT_PUBLIC_HOTJAR_ID=your-hotjar-id

# Feature Flags
NEXT_PUBLIC_ENABLE_VOICE_SEARCH=true
NEXT_PUBLIC_ENABLE_ANALYTICS=true
```

### Backend Environment Variables

Create `.env` in the `backend/` directory:

```bash
# Server Configuration
NODE_ENV=production
BACKEND_PORT=3001

# Elasticsearch Configuration
ELASTICSEARCH_URL=https://your-elasticsearch-url:9200
ELASTICSEARCH_USERNAME=elastic
ELASTICSEARCH_PASSWORD=your-elasticsearch-password
ELASTICSEARCH_API_KEY=your-api-key

# AI Configuration
GEMINI_API_KEY=your-gemini-api-key

# Security & Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
JWT_SECRET=your-jwt-secret

# Caching (Optional)
REDIS_URL=redis://localhost:6379
REDIS_PASSWORD=your-redis-password

# Monitoring (Optional)
SENTRY_DSN=your-sentry-dsn
LOG_LEVEL=info
```

## 🐳 Local Development with Docker

### Quick Start

1. **Clone and setup:**
```bash
git clone <your-repo-url>
cd ai-powered-search-engine
cp .env.example .env
```

2. **Start all services:**
```bash
docker-compose up -d
```

3. **Access the application:**
- Frontend: http://localhost:3002
- Backend API: http://localhost:3001
- Elasticsearch: http://localhost:9200

### Development Commands

```bash
# Start development environment
docker-compose up

# Start production environment
docker-compose -f docker-compose.prod.yml up

# View logs
docker-compose logs -f backend
docker-compose logs -f frontend

# Rebuild containers
docker-compose build --no-cache

# Stop all services
docker-compose down

# Clean up volumes
docker-compose down -v
```

## 🌐 Frontend Deployment

### Vercel Deployment

Vercel is the recommended platform for Next.js applications.

#### Automatic Deployment

1. **Connect Repository:**
   - Go to [Vercel Dashboard](https://vercel.com/dashboard)
   - Click "New Project"
   - Import your Git repository
   - Select the `frontend` folder as the root directory

2. **Configure Build Settings:**
   ```bash
   # Build Command
   npm run build
   
   # Output Directory
   .next
   
   # Install Command
   npm install
   
   # Root Directory
   frontend
   ```

3. **Environment Variables:**
   Add these in Vercel dashboard:
   ```bash
   NEXT_PUBLIC_API_URL=https://your-backend-url.com
   NEXT_PUBLIC_APP_NAME=AI Search Engine
   NEXT_PUBLIC_ENABLE_VOICE_SEARCH=true
   ```

#### Manual Deployment

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy from frontend directory
cd frontend
vercel

# Deploy to production
vercel --prod
```

#### Custom Domain

1. Go to your project settings in Vercel
2. Navigate to "Domains"
3. Add your custom domain
4. Configure DNS records as instructed

### Netlify Deployment

Alternative frontend hosting platform.

1. **Build Settings:**
   ```bash
   # Build command
   npm run build
   
   # Publish directory
   .next
   
   # Base directory
   frontend
   ```

2. **Deploy:**
   ```bash
   # Install Netlify CLI
   npm install -g netlify-cli
   
   # Deploy
   cd frontend
   netlify deploy
   
   # Deploy to production
   netlify deploy --prod
   ```

## 🔧 Backend Deployment

### Render Deployment

Render provides easy deployment for Node.js applications.

#### Setup

1. **Connect Repository:**
   - Go to [Render Dashboard](https://dashboard.render.com)
   - Click "New +" → "Web Service"
   - Connect your Git repository

2. **Configure Service:**
   ```yaml
   # Service Configuration
   Name: ai-search-backend
   Environment: Node
   Region: Oregon (US West)
   Branch: main
   Root Directory: backend
   
   # Build & Start Commands
   Build Command: npm install && npm run build
   Start Command: npm start
   ```

3. **Environment Variables:**
   Add in Render dashboard:
   ```bash
   NODE_ENV=production
   ELASTICSEARCH_URL=your-elasticsearch-url
   GEMINI_API_KEY=your-gemini-key
   BACKEND_PORT=3001
   ```

#### Custom Domain

1. Go to Settings → Custom Domains
2. Add your domain
3. Configure DNS CNAME record

### Railway Deployment

Modern deployment platform with great developer experience.

1. **Deploy with Railway CLI:**
   ```bash
   # Install Railway CLI
   npm install -g @railway/cli
   
   # Login and deploy
   railway login
   cd backend
   railway deploy
   ```

2. **Or connect via GitHub:**
   - Go to [Railway Dashboard](https://railway.app)
   - Connect your repository
   - Select backend directory
   - Configure environment variables

### Google Cloud Run

Serverless container platform.

#### Prerequisites

```bash
# Install Google Cloud SDK
curl https://sdk.cloud.google.com | bash
gcloud init
gcloud auth configure-docker
```

#### Deployment

1. **Build and push container:**
   ```bash
   cd backend
   
   # Build image
   docker build -t gcr.io/YOUR_PROJECT_ID/ai-search-backend .
   
   # Push to Container Registry
   docker push gcr.io/YOUR_PROJECT_ID/ai-search-backend
   ```

2. **Deploy to Cloud Run:**
   ```bash
   gcloud run deploy ai-search-backend \
     --image gcr.io/YOUR_PROJECT_ID/ai-search-backend \
     --platform managed \
     --region us-central1 \
     --allow-unauthenticated \
     --set-env-vars="NODE_ENV=production,GEMINI_API_KEY=your-key"
   ```

3. **Configure custom domain:**
   ```bash
   gcloud run domain-mappings create \
     --service ai-search-backend \
     --domain api.yourdomain.com
   ```

### AWS ECS

Container orchestration service.

#### Setup

1. **Create ECR repository:**
   ```bash
   aws ecr create-repository --repository-name ai-search-backend
   ```

2. **Build and push:**
   ```bash
   # Get login token
   aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin YOUR_ACCOUNT.dkr.ecr.us-east-1.amazonaws.com
   
   # Build and tag
   docker build -t ai-search-backend .
   docker tag ai-search-backend:latest YOUR_ACCOUNT.dkr.ecr.us-east-1.amazonaws.com/ai-search-backend:latest
   
   # Push
   docker push YOUR_ACCOUNT.dkr.ecr.us-east-1.amazonaws.com/ai-search-backend:latest
   ```

3. **Create ECS service:**
   ```bash
   # Create task definition
   aws ecs register-task-definition --cli-input-json file://task-definition.json
   
   # Create service
   aws ecs create-service \
     --cluster your-cluster \
     --service-name ai-search-backend \
     --task-definition ai-search-backend:1 \
     --desired-count 2
   ```

## 🏗️ Full Stack Deployment

### Google Cloud Platform

Complete GCP deployment with managed services.

#### Architecture

```
Internet → Cloud Load Balancer → Cloud Run (Frontend & Backend) → Cloud SQL/Elasticsearch
```

#### Setup

1. **Enable APIs:**
   ```bash
   gcloud services enable run.googleapis.com
   gcloud services enable cloudbuild.googleapis.com
   gcloud services enable container.googleapis.com
   ```

2. **Deploy with Cloud Build:**
   
   Create `cloudbuild.yaml`:
   ```yaml
   steps:
   # Build backend
   - name: 'gcr.io/cloud-builders/docker'
     args: ['build', '-t', 'gcr.io/$PROJECT_ID/ai-search-backend', './backend']
   
   # Build frontend
   - name: 'gcr.io/cloud-builders/docker'
     args: ['build', '-t', 'gcr.io/$PROJECT_ID/ai-search-frontend', './frontend']
   
   # Push images
   - name: 'gcr.io/cloud-builders/docker'
     args: ['push', 'gcr.io/$PROJECT_ID/ai-search-backend']
   - name: 'gcr.io/cloud-builders/docker'
     args: ['push', 'gcr.io/$PROJECT_ID/ai-search-frontend']
   
   # Deploy to Cloud Run
   - name: 'gcr.io/cloud-builders/gcloud'
     args: ['run', 'deploy', 'ai-search-backend', '--image', 'gcr.io/$PROJECT_ID/ai-search-backend', '--region', 'us-central1', '--platform', 'managed', '--allow-unauthenticated']
   
   - name: 'gcr.io/cloud-builders/gcloud'
     args: ['run', 'deploy', 'ai-search-frontend', '--image', 'gcr.io/$PROJECT_ID/ai-search-frontend', '--region', 'us-central1', '--platform', 'managed', '--allow-unauthenticated']
   ```

3. **Deploy:**
   ```bash
   gcloud builds submit --config cloudbuild.yaml
   ```

#### Managed Elasticsearch

Use Elastic Cloud on GCP:

1. Go to [Elastic Cloud](https://cloud.elastic.co)
2. Create deployment on Google Cloud
3. Configure security and networking
4. Update backend environment variables

### Amazon Web Services

Complete AWS deployment with ECS, RDS, and CloudFront.

#### Architecture

```
CloudFront → ALB → ECS (Frontend & Backend) → RDS/OpenSearch
```

#### Infrastructure as Code

Create `infrastructure/aws/main.tf`:

```hcl
# VPC and Networking
resource "aws_vpc" "main" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true
  
  tags = {
    Name = "ai-search-vpc"
  }
}

# ECS Cluster
resource "aws_ecs_cluster" "main" {
  name = "ai-search-cluster"
  
  setting {
    name  = "containerInsights"
    value = "enabled"
  }
}

# Application Load Balancer
resource "aws_lb" "main" {
  name               = "ai-search-alb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb.id]
  subnets           = aws_subnet.public[*].id
}

# OpenSearch Domain
resource "aws_opensearch_domain" "main" {
  domain_name    = "ai-search"
  engine_version = "OpenSearch_2.3"
  
  cluster_config {
    instance_type  = "t3.small.search"
    instance_count = 1
  }
  
  ebs_options {
    ebs_enabled = true
    volume_size = 20
  }
}
```

Deploy with Terraform:
```bash
cd infrastructure/aws
terraform init
terraform plan
terraform apply
```

## 🔍 Database & Search

### Elasticsearch Cloud

Recommended for production deployments.

#### Elastic Cloud Setup

1. **Create Deployment:**
   - Go to [Elastic Cloud](https://cloud.elastic.co)
   - Choose cloud provider (AWS, GCP, Azure)
   - Select region close to your application
   - Choose deployment size based on data volume

2. **Security Configuration:**
   ```bash
   # Enable security features
   xpack.security.enabled: true
   xpack.security.transport.ssl.enabled: true
   xpack.security.http.ssl.enabled: true
   ```

3. **Index Templates:**
   Use the optimized settings from `backend/src/config/elasticsearch-optimized.ts`

#### Connection Configuration

```javascript
// backend/src/elasticsearchClient.ts
const client = new Client({
  cloud: {
    id: process.env.ELASTICSEARCH_CLOUD_ID
  },
  auth: {
    apiKey: process.env.ELASTICSEARCH_API_KEY
  }
});
```

### Self-hosted Elasticsearch

For cost optimization or specific requirements.

#### Docker Deployment

```yaml
# docker-compose.elasticsearch.yml
version: '3.8'
services:
  elasticsearch:
    image: docker.elastic.co/elasticsearch/elasticsearch:8.11.0
    environment:
      - discovery.type=single-node
      - "ES_JAVA_OPTS=-Xms2g -Xmx2g"
      - xpack.security.enabled=true
      - ELASTIC_PASSWORD=your-password
    volumes:
      - elasticsearch_data:/usr/share/elasticsearch/data
    ports:
      - "9200:9200"
    deploy:
      resources:
        limits:
          memory: 4G
        reservations:
          memory: 2G

  kibana:
    image: docker.elastic.co/kibana/kibana:8.11.0
    environment:
      - ELASTICSEARCH_HOSTS=http://elasticsearch:9200
      - ELASTICSEARCH_USERNAME=elastic
      - ELASTICSEARCH_PASSWORD=your-password
    ports:
      - "5601:5601"
    depends_on:
      - elasticsearch
```

#### Kubernetes Deployment

```yaml
# k8s/elasticsearch.yaml
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: elasticsearch
spec:
  serviceName: elasticsearch
  replicas: 3
  selector:
    matchLabels:
      app: elasticsearch
  template:
    metadata:
      labels:
        app: elasticsearch
    spec:
      containers:
      - name: elasticsearch
        image: docker.elastic.co/elasticsearch/elasticsearch:8.11.0
        env:
        - name: cluster.name
          value: ai-search-cluster
        - name: node.name
          valueFrom:
            fieldRef:
              fieldPath: metadata.name
        - name: discovery.seed_hosts
          value: "elasticsearch-0.elasticsearch,elasticsearch-1.elasticsearch,elasticsearch-2.elasticsearch"
        - name: cluster.initial_master_nodes
          value: "elasticsearch-0,elasticsearch-1,elasticsearch-2"
        - name: ES_JAVA_OPTS
          value: "-Xms2g -Xmx2g"
        resources:
          limits:
            memory: 4Gi
          requests:
            memory: 2Gi
        volumeMounts:
        - name: data
          mountPath: /usr/share/elasticsearch/data
  volumeClaimTemplates:
  - metadata:
      name: data
    spec:
      accessModes: [ "ReadWriteOnce" ]
      resources:
        requests:
          storage: 100Gi
```

## 📊 Monitoring & Analytics

### Application Monitoring

#### Sentry Integration

1. **Setup Sentry:**
   ```bash
   npm install @sentry/node @sentry/nextjs
   ```

2. **Backend Configuration:**
   ```javascript
   // backend/src/monitoring/sentry.ts
   import * as Sentry from "@sentry/node";
   
   Sentry.init({
     dsn: process.env.SENTRY_DSN,
     environment: process.env.NODE_ENV,
     tracesSampleRate: 1.0,
   });
   ```

3. **Frontend Configuration:**
   ```javascript
   // frontend/sentry.client.config.js
   import * as Sentry from "@sentry/nextjs";
   
   Sentry.init({
     dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
     tracesSampleRate: 1.0,
   });
   ```

#### Health Checks

Implement comprehensive health checks:

```javascript
// backend/src/routes/health.ts
app.get('/api/health', async (req, res) => {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    services: {
      elasticsearch: await checkElasticsearch(),
      gemini: await checkGemini(),
      redis: await checkRedis(),
    },
    metrics: {
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      cpu: process.cpuUsage(),
    }
  };
  
  const isHealthy = Object.values(health.services).every(s => s.status === 'healthy');
  res.status(isHealthy ? 200 : 503).json(health);
});
```

### Infrastructure Monitoring

#### Prometheus & Grafana

```yaml
# monitoring/docker-compose.yml
version: '3.8'
services:
  prometheus:
    image: prom/prometheus
    ports:
      - "9090:9090"
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus_data:/prometheus

  grafana:
    image: grafana/grafana
    ports:
      - "3000:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin
    volumes:
      - grafana_data:/var/lib/grafana
      - ./grafana/dashboards:/etc/grafana/provisioning/dashboards
```

## 🔧 Troubleshooting

### Common Issues

#### 1. Elasticsearch Connection Issues

**Problem:** Cannot connect to Elasticsearch
```
Error: connect ECONNREFUSED 127.0.0.1:9200
```

**Solutions:**
- Check Elasticsearch is running: `curl http://localhost:9200`
- Verify environment variables: `ELASTICSEARCH_URL`
- Check network connectivity in Docker: `docker network ls`
- Review Elasticsearch logs: `docker logs elasticsearch`

#### 2. Gemini API Quota Exceeded

**Problem:** AI features not working
```
Error: Quota exceeded for Gemini API
```

**Solutions:**
- Check API quota in Google AI Studio
- Implement request caching
- Add retry logic with exponential backoff
- Consider upgrading API plan

#### 3. Memory Issues

**Problem:** Application crashes with OOM
```
Error: JavaScript heap out of memory
```

**Solutions:**
- Increase Node.js memory: `--max-old-space-size=4096`
- Optimize Elasticsearch queries
- Implement pagination for large result sets
- Add memory monitoring

#### 4. CORS Issues

**Problem:** Frontend cannot access backend
```
Error: CORS policy: No 'Access-Control-Allow-Origin' header
```

**Solutions:**
- Update CORS configuration in backend
- Check environment variables: `NEXT_PUBLIC_API_URL`
- Verify domain whitelist
- Use proxy in development

### Performance Optimization

#### 1. Elasticsearch Optimization

```javascript
// Optimize index settings
const optimizedSettings = {
  "index.refresh_interval": "30s",
  "index.number_of_replicas": 0,
  "index.queries.cache.enabled": true,
  "index.requests.cache.enable": true
};
```

#### 2. Caching Strategy

```javascript
// Implement Redis caching
const cache = require('redis').createClient();

async function getCachedResults(query) {
  const cached = await cache.get(`search:${query}`);
  if (cached) return JSON.parse(cached);
  
  const results = await performSearch(query);
  await cache.setex(`search:${query}`, 300, JSON.stringify(results));
  return results;
}
```

#### 3. Database Connection Pooling

```javascript
// Optimize Elasticsearch client
const client = new Client({
  node: process.env.ELASTICSEARCH_URL,
  maxRetries: 3,
  requestTimeout: 30000,
  sniffOnStart: true,
  sniffInterval: 300000
});
```

### Deployment Checklist

#### Pre-deployment

- [ ] Environment variables configured
- [ ] Database migrations completed
- [ ] SSL certificates installed
- [ ] Domain DNS configured
- [ ] Health checks implemented
- [ ] Monitoring setup
- [ ] Backup strategy defined

#### Post-deployment

- [ ] Health checks passing
- [ ] SSL certificate valid
- [ ] Performance metrics normal
- [ ] Error rates acceptable
- [ ] Search functionality working
- [ ] Analytics tracking active
- [ ] Monitoring alerts configured

## 📞 Support

For deployment issues:

1. **Check logs:** Application and infrastructure logs
2. **Review documentation:** Platform-specific guides
3. **Community support:** Stack Overflow, Discord
4. **Professional support:** Consider managed services

## 🔄 Updates & Maintenance

### Regular Maintenance

1. **Security Updates:**
   ```bash
   # Update dependencies
   npm audit fix
   
   # Update Docker images
   docker pull docker.elastic.co/elasticsearch/elasticsearch:latest
   ```

2. **Performance Monitoring:**
   - Monitor response times
   - Check error rates
   - Review resource usage
   - Optimize slow queries

3. **Backup Strategy:**
   - Elasticsearch snapshots
   - Database backups
   - Configuration backups
   - Disaster recovery testing

This deployment guide provides comprehensive instructions for deploying your AI-powered search engine across various platforms. Choose the deployment strategy that best fits your requirements, budget, and technical expertise.
