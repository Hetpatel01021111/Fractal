import express from 'express';
import cors from 'cors';
import compression from 'compression';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import dotenv from 'dotenv';

import apiRoutes from './routes/api';
import { ElasticsearchClient } from './elasticsearchClient';
import { GeminiService } from './services/gemini';
import { AnalyticsService } from './services/analytics';
import { Client } from '@elastic/elasticsearch';
dotenv.config({ path: '../.env' });
dotenv.config(); // Also try local .env

const app = express();
const PORT = process.env.BACKEND_PORT || 3001;

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://your-frontend-domain.com'] 
    : ['http://localhost:3000', 'http://localhost:3002'],
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// General middleware
app.use(compression());
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Initialize services
let elasticsearchClient: ElasticsearchClient | null = null;
let geminiService: GeminiService;
let analyticsService: AnalyticsService | null = null;
try {
  const analyticsClient = new Client({
    node: process.env.ELASTICSEARCH_URL || 'http://localhost:9200'
  });
  analyticsService = new AnalyticsService(analyticsClient);
} catch (error) {
  console.warn('⚠️ Analytics service will use mock data (Elasticsearch not available)');
}

// Initialize Gemini service
geminiService = new GeminiService();

// Make services available to routes (will be set properly in startServer)
app.locals.elasticsearchClient = null;
app.locals.geminiService = geminiService;
app.locals.analyticsService = analyticsService;

// Routes
app.use('/api', apiRoutes);

// Basic error handling middleware
app.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('❌ Unhandled error:', error);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong',
    timestamp: new Date().toISOString(),
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Start server
const startServer = async () => {
  try {
    // Initialize Elasticsearch client
    elasticsearchClient = new ElasticsearchClient();
    
    // Initialize Elasticsearch connection
    await elasticsearchClient.initialize();
    console.log('✅ Elasticsearch connected successfully');
    
    // Update app.locals with initialized client
    app.locals.elasticsearchClient = elasticsearchClient;

    // Initialize Gemini service
    await geminiService.initialize();
    console.log('✅ Gemini AI service initialized');

    // Initialize Analytics service if available
    if (analyticsService) {
      try {
        await analyticsService.initialize();
        console.log('✅ Analytics service initialized');
      } catch (error) {
        console.warn('⚠️ Analytics service initialization failed:', error);
        console.log('📊 Analytics will use mock data for demonstration');
        analyticsService = null;
        app.locals.analyticsService = null;
      }
    } else {
      console.log('📊 Using mock analytics data for demonstration');
    }

    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`📈 Analytics: ${analyticsService ? 'Enabled' : 'Disabled'}`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('🔄 SIGTERM received, shutting down gracefully');
  // Note: ElasticsearchClient doesn't have a close method, connection will close automatically
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('🔄 SIGINT received, shutting down gracefully');
  // Note: ElasticsearchClient doesn't have a close method, connection will close automatically
  process.exit(0);
});

startServer();
