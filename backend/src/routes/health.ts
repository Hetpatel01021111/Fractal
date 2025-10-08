import { Router, Request, Response } from 'express';
import { ElasticsearchClient } from '../elasticsearchClient';
import { GeminiService } from '../services/gemini';

const router = Router();

// GET /api/health - Basic health check
router.get('/', (req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
  });
});

// GET /api/health/detailed - Detailed health check including services
router.get('/detailed', async (req: Request, res: Response) => {
  const healthCheck = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    services: {
      elasticsearch: { status: 'unknown', error: null as string | null },
      gemini: { status: 'unknown', error: null as string | null },
    },
  };

  // Check Elasticsearch
  try {
    const elasticsearchClient: ElasticsearchClient = req.app.locals.elasticsearchClient;
    // Try a simple search to check if Elasticsearch is available
    const stats = await elasticsearchClient.searchDocuments('*', { size: 0 });
    healthCheck.services.elasticsearch.status = 'healthy';
  } catch (error) {
    healthCheck.services.elasticsearch.status = 'unhealthy';
    healthCheck.services.elasticsearch.error = error instanceof Error ? error.message : 'Unknown error';
    healthCheck.status = 'degraded';
  }

  // Check Gemini AI
  try {
    const geminiService: GeminiService = req.app.locals.geminiService;
    // Try a simple embedding generation to check if Gemini is available
    await geminiService.generateEmbedding('health check');
    healthCheck.services.gemini.status = 'healthy';
  } catch (error) {
    healthCheck.services.gemini.status = 'unhealthy';
    healthCheck.services.gemini.error = error instanceof Error ? error.message : 'Unknown error';
    healthCheck.status = 'degraded';
  }

  // Determine overall status
  const allServicesHealthy = Object.values(healthCheck.services).every(
    service => service.status === 'healthy'
  );
  
  if (!allServicesHealthy) {
    healthCheck.status = 'degraded';
  }

  const statusCode = healthCheck.status === 'healthy' ? 200 : 503;
  res.status(statusCode).json(healthCheck);
});

// GET /api/health/ready - Readiness probe for Kubernetes
router.get('/ready', async (req: Request, res: Response) => {
  try {
    const elasticsearchClient: ElasticsearchClient = req.app.locals.elasticsearchClient;
    const geminiService: GeminiService = req.app.locals.geminiService;

    // Check if both services are ready
    await elasticsearchClient.searchDocuments('*', { size: 0 });
    await geminiService.generateEmbedding('readiness check');

    res.json({
      status: 'ready',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(503).json({
      status: 'not ready',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// GET /api/health/live - Liveness probe for Kubernetes
router.get('/live', (req: Request, res: Response) => {
  res.json({
    status: 'alive',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

export { router as healthRoutes };
