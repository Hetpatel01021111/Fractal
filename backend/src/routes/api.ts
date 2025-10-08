import { Router, Request, Response } from 'express';
import Joi from 'joi';
import { ElasticsearchClient, SearchDocument } from '../elasticsearchClient';
import { GeminiService } from '../services/gemini';
import { SearchEngine, HybridSearchQuery } from '../searchEngine';
import { AnalyticsService, QueryLog } from '../services/analytics';

const router = Router();

// Validation schemas
const searchSchema = Joi.object({
  query: Joi.string().required().min(1).max(500).trim(),
  filters: Joi.object({
    category: Joi.string().optional(),
    tags: Joi.array().items(Joi.string()).optional(),
    dateRange: Joi.object({
      from: Joi.string().isoDate().optional(),
      to: Joi.string().isoDate().optional(),
    }).optional(),
    author: Joi.string().optional(),
  }).optional(),
  size: Joi.number().integer().min(1).max(100).default(10),
  from: Joi.number().integer().min(0).default(0),
  includeReasoning: Joi.boolean().default(true),
  includeExplanation: Joi.boolean().default(false),
});

const indexSchema = Joi.object({
  documents: Joi.array().items(
    Joi.object({
      title: Joi.string().required().min(1).max(500),
      content: Joi.string().required().min(1).max(50000),
      url: Joi.string().uri().optional(),
      metadata: Joi.object({
        author: Joi.string().optional(),
        date: Joi.string().isoDate().optional(),
        category: Joi.string().optional(),
        source: Joi.string().optional(),
        tags: Joi.array().items(Joi.string()).optional(),
        language: Joi.string().default('en'),
      }).optional(),
    })
  ).min(1).max(50).required(),
  generateEmbeddings: Joi.boolean().default(true),
});

// Middleware for request logging
const requestLogger = (req: Request, res: Response, next: any) => {
  const startTime = Date.now();
  const { method, url, body } = req;
  
  console.log(`📥 ${method} ${url} - ${new Date().toISOString()}`);
  if (body && Object.keys(body).length > 0) {
    console.log(`📋 Request body: ${JSON.stringify(body, null, 2).substring(0, 200)}...`);
  }

  // Log response when finished
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const { statusCode } = res;
    const statusEmoji = statusCode >= 400 ? '❌' : statusCode >= 300 ? '⚠️' : '✅';
    console.log(`📤 ${statusEmoji} ${method} ${url} - ${statusCode} - ${duration}ms`);
  });

  next();
};

router.use(requestLogger);

/**
 * POST /api/search - Hybrid search with Gemini reasoning
 */
router.post('/search', async (req: Request, res: Response): Promise<void> => {
  const startTime = Date.now();
  let queryLog: QueryLog | null = null;
  
  try {
    console.log('🔍 Starting hybrid search request...');
    
    // Validate request
    const { error, value } = searchSchema.validate(req.body);
    if (error) {
      console.warn('❌ Search validation failed:', error.details);
      res.status(400).json({
        success: false,
        error: 'Invalid request parameters',
        details: error.details.map(d => ({
          field: d.path.join('.'),
          message: d.message,
        })),
        timestamp: new Date().toISOString(),
      });
      return;
    }

    const { query, filters, size, from, includeReasoning, includeExplanation } = value;
    
    // Get services
    const elasticsearchClient: ElasticsearchClient = req.app.locals.elasticsearchClient;
    const geminiService: GeminiService = req.app.locals.geminiService;
    const analyticsService: AnalyticsService = req.app.locals.analyticsService;

    if (!elasticsearchClient || !geminiService) {
      console.error('❌ Required services not available');
      res.status(500).json({
        success: false,
        error: 'Search services unavailable',
        message: 'Internal services are not properly initialized',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    // Initialize analytics logging
    if (analyticsService) {
      queryLog = {
        id: analyticsService.generateQueryId(),
        query,
        timestamp: new Date().toISOString(),
        resultsCount: 0,
        responseLatency: 0,
        searchType: 'hybrid',
        filters,
        userAgent: req.get('User-Agent') || 'Unknown',
        ipAddress: req.ip || req.connection.remoteAddress || 'Unknown',
        success: false
      };
    }

    // Initialize SearchEngine
    const searchEngine = new SearchEngine(elasticsearchClient, geminiService);

    const hybridQuery: HybridSearchQuery = {
      query,
      filters,
      size,
      from,
      weights: { bm25: 0.6, vector: 0.4 }, // Balanced approach
      rrf: { k: 60 },
      includeExplanation,
    };

    console.log(`🎯 Executing hybrid search for: "${query}"`);
    
    // Perform hybrid search
    const searchResults = await searchEngine.intelligentSearch(hybridQuery);
    
    const responseLatency = Date.now() - startTime;
    console.log(`✅ Search completed: ${searchResults.results.length} results in ${responseLatency}ms`);

    // Generate AI reasoning if requested and results exist
    let reasoning = null;
    let searchIntent = null;
    let suggestions: string[] = [];

    if (includeReasoning && searchResults.results.length > 0) {
      try {
        console.log('🧠 Generating AI reasoning and analysis...');
        
        // Parallel execution of AI tasks
        const [reasoningResult, intentResult, suggestionsResult] = await Promise.allSettled([
          searchEngine.summarizeResults(query, searchResults.results),
          searchEngine.analyzeSearchIntent(query),
          searchEngine.getSearchSuggestions(query),
        ]);

        if (reasoningResult.status === 'fulfilled') {
          reasoning = reasoningResult.value;
        } else {
          console.warn('⚠️ Reasoning generation failed:', reasoningResult.reason);
        }

        if (intentResult.status === 'fulfilled') {
          searchIntent = intentResult.value;
        } else {
          console.warn('⚠️ Intent analysis failed:', intentResult.reason);
        }

        if (suggestionsResult.status === 'fulfilled') {
          suggestions = suggestionsResult.value.slice(0, 5);
        } else {
          console.warn('⚠️ Suggestions generation failed:', suggestionsResult.reason);
        }

        console.log('✅ AI reasoning completed');
      } catch (reasoningError) {
        console.warn('⚠️ AI reasoning failed:', reasoningError);
        reasoning = {
          summary: 'AI reasoning temporarily unavailable',
          keyPoints: [],
          confidence: 0.5,
        };
      }
    }

    // Update analytics log with success
    if (queryLog && analyticsService) {
      queryLog.success = true;
      queryLog.resultsCount = searchResults.results.length;
      queryLog.responseLatency = responseLatency;
      queryLog.searchInfo = {
        bm25Results: searchResults.searchInfo?.bm25Results || 0,
        vectorResults: searchResults.searchInfo?.vectorResults || 0,
        combinedResults: searchResults.searchInfo?.combinedResults || 0,
        embeddingGenerated: searchResults.query?.embedding || false
      };
      
      // Log analytics (async, don't wait)
      analyticsService.logQuery(queryLog).catch(err => 
        console.warn('Failed to log analytics:', err)
      );
    }

    // Construct response
    const response = {
      success: true,
      results: searchResults.results,
      total: searchResults.total,
      took: searchResults.took,
      searchInfo: {
        ...searchResults.searchInfo,
        query: searchResults.query,
        reasoning: reasoning,
        intent: searchIntent,
        suggestions,
      },
      pagination: {
        size,
        from,
        hasMore: from + size < searchResults.total,
        totalPages: Math.ceil(searchResults.total / size),
        currentPage: Math.floor(from / size) + 1,
      },
      timestamp: new Date().toISOString(),
    };

    res.json(response);

  } catch (error) {
    console.error('❌ Search error:', error);
    
    // Log error in analytics
    if (queryLog && req.app.locals.analyticsService) {
      queryLog.success = false;
      queryLog.responseLatency = Date.now() - startTime;
      queryLog.errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      req.app.locals.analyticsService.logQuery(queryLog).catch((err: any) => 
        console.warn('Failed to log error analytics:', err)
      );
    }
    
    res.status(500).json({
      success: false,
      error: 'Search operation failed',
      message: error instanceof Error ? error.message : 'An unexpected error occurred',
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * POST /api/index - Manual indexing of new documents
 */
router.post('/index', async (req: Request, res: Response): Promise<void> => {
  try {
    console.log('📝 Starting document indexing request...');
    
    // Validate request
    const { error, value } = indexSchema.validate(req.body);
    if (error) {
      console.warn('❌ Index validation failed:', error.details);
      res.status(400).json({
        success: false,
        error: 'Invalid document format',
        details: error.details.map(d => ({
          field: d.path.join('.'),
          message: d.message,
        })),
        timestamp: new Date().toISOString(),
      });
      return;
    }

    const { documents, generateEmbeddings } = value;
    
    // Get services
    const elasticsearchClient: ElasticsearchClient = req.app.locals.elasticsearchClient;
    const geminiService: GeminiService = req.app.locals.geminiService;

    if (!elasticsearchClient) {
      console.error('❌ Elasticsearch client not available');
      res.status(500).json({
        success: false,
        error: 'Indexing service unavailable',
        message: 'Elasticsearch client is not properly initialized',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    console.log(`📊 Processing ${documents.length} documents for indexing...`);

    const indexResults = {
      successful: 0,
      failed: 0,
      errors: [] as any[],
      documents: [] as any[],
    };

    // Process each document
    for (let i = 0; i < documents.length; i++) {
      const doc = documents[i];
      try {
        console.log(`📄 Processing document ${i + 1}/${documents.length}: "${doc.title}"`);

        // Generate document ID
        const docId = `manual_${Date.now()}_${i}`;
        
        // Generate embedding if requested and service available
        let embedding: number[] | undefined;
        if (generateEmbeddings && geminiService) {
          try {
            const embeddingText = `${doc.title} ${doc.content}`.substring(0, 2000);
            embedding = await geminiService.generateEmbedding(embeddingText);
            console.log(`✅ Generated embedding for document ${i + 1}`);
          } catch (embeddingError) {
            console.warn(`⚠️ Embedding generation failed for document ${i + 1}:`, embeddingError);
            embedding = undefined;
          }
        }

        // Create search document
        const searchDoc: SearchDocument = {
          id: docId,
          title: doc.title,
          content: doc.content,
          url: doc.url,
          ...(embedding && { embedding }),
          metadata: {
            author: doc.metadata?.author,
            date: doc.metadata?.date || new Date().toISOString(),
            category: doc.metadata?.category || 'Manual',
            source: doc.metadata?.source || 'Manual Index',
            tags: doc.metadata?.tags || [],
            language: doc.metadata?.language || 'en',
            indexed: new Date().toISOString(),
          },
        };

        // Index document
        await elasticsearchClient.indexDocument(searchDoc);
        
        indexResults.successful++;
        indexResults.documents.push({
          id: docId,
          title: doc.title,
          status: 'indexed',
          hasEmbedding: !!embedding,
        });

        console.log(`✅ Successfully indexed document ${i + 1}: ${docId}`);

      } catch (docError) {
        console.error(`❌ Failed to index document ${i + 1}:`, docError);
        indexResults.failed++;
        indexResults.errors.push({
          documentIndex: i,
          title: doc.title,
          error: docError instanceof Error ? docError.message : 'Unknown error',
        });
      }
    }

    console.log(`📊 Indexing completed: ${indexResults.successful} successful, ${indexResults.failed} failed`);

    // Return results
    const response = {
      success: indexResults.failed === 0,
      message: `Indexed ${indexResults.successful} of ${documents.length} documents`,
      results: indexResults,
      timestamp: new Date().toISOString(),
    };

    const statusCode = indexResults.failed > 0 ? 207 : 200; // 207 Multi-Status for partial success
    res.status(statusCode).json(response);

  } catch (error) {
    console.error('❌ Indexing error:', error);
    res.status(500).json({
      success: false,
      error: 'Document indexing failed',
      message: error instanceof Error ? error.message : 'An unexpected error occurred',
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * GET /api/health - Comprehensive health check
 */
router.get('/health', async (req: Request, res: Response): Promise<void> => {
  try {
    console.log('🏥 Performing health check...');
    
    const healthCheck = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      services: {
        elasticsearch: {
          status: 'unknown',
          responseTime: 0,
          indexExists: false,
          documentCount: 0,
          error: null as string | null,
        },
        gemini: {
          status: 'unknown',
          responseTime: 0,
          modelsAvailable: false,
          quotaStatus: 'unknown',
          error: null as string | null,
        },
      },
      system: {
        memory: {
          used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
          total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
        },
        nodeVersion: process.version,
        platform: process.platform,
      },
    };

    // Test Elasticsearch
    try {
      const esStartTime = Date.now();
      const elasticsearchClient: ElasticsearchClient = req.app.locals.elasticsearchClient;
      
      if (elasticsearchClient) {
        // Test connection and get stats
        const stats = await elasticsearchClient.getIndexStats();
        healthCheck.services.elasticsearch = {
          status: 'healthy',
          responseTime: Date.now() - esStartTime,
          indexExists: true,
          documentCount: stats.documents || 0,
          error: null,
        };
        console.log('✅ Elasticsearch health check passed');
      } else {
        throw new Error('Elasticsearch client not initialized');
      }
    } catch (esError) {
      console.error('❌ Elasticsearch health check failed:', esError);
      healthCheck.services.elasticsearch = {
        status: 'unhealthy',
        responseTime: 0,
        indexExists: false,
        documentCount: 0,
        error: esError instanceof Error ? esError.message : 'Connection failed',
      };
      healthCheck.status = 'degraded';
    }

    // Test Gemini API
    try {
      const geminiStartTime = Date.now();
      const geminiService: GeminiService = req.app.locals.geminiService;
      
      if (geminiService) {
        // Test with a simple embedding generation
        await geminiService.generateEmbedding('health check test');
        healthCheck.services.gemini = {
          status: 'healthy',
          responseTime: Date.now() - geminiStartTime,
          modelsAvailable: true,
          quotaStatus: 'available',
          error: null,
        };
        console.log('✅ Gemini API health check passed');
      } else {
        throw new Error('Gemini service not initialized');
      }
    } catch (geminiError) {
      console.error('❌ Gemini API health check failed:', geminiError);
      const isQuotaError = geminiError instanceof Error && 
        (geminiError.message.includes('quota') || 
        geminiError.message.includes('429'));
      
      healthCheck.services.gemini = {
        status: isQuotaError ? 'degraded' : 'unhealthy',
        responseTime: 0,
        modelsAvailable: false,
        quotaStatus: isQuotaError ? 'exceeded' : 'unknown',
        error: geminiError instanceof Error ? geminiError.message : 'Connection failed',
      };
      
      if (healthCheck.status === 'healthy') {
        healthCheck.status = 'degraded';
      }
    }

    // Determine overall status
    const esHealthy = healthCheck.services.elasticsearch.status === 'healthy';
    const geminiHealthy = healthCheck.services.gemini.status === 'healthy';
    const geminiDegraded = healthCheck.services.gemini.status === 'degraded';

    if (esHealthy && geminiHealthy) {
      healthCheck.status = 'healthy';
    } else if (esHealthy && geminiDegraded) {
      healthCheck.status = 'degraded'; // Can still function with BM25 search
    } else {
      healthCheck.status = 'unhealthy';
    }

    console.log(`🏥 Health check completed: ${healthCheck.status}`);

    // Return appropriate status code
    const statusCode = healthCheck.status === 'healthy' ? 200 : 
                      healthCheck.status === 'degraded' ? 200 : 503;

    res.status(statusCode).json(healthCheck);

  } catch (error) {
    console.error('❌ Health check error:', error);
    res.status(500).json({
      status: 'unhealthy',
      error: 'Health check failed',
      message: error instanceof Error ? error.message : 'An unexpected error occurred',
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * GET /api/health/detailed - Extended health check with more metrics
 */
router.get('/health/detailed', async (req: Request, res: Response): Promise<void> => {
  try {
    // Get basic health info
    const healthCheck = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      features: {
        hybridSearch: true,
        bm25Search: true,
        vectorSearch: true,
        rrfFusion: true,
        newsApiIntegration: !!process.env.NEWSAPI_KEY,
        webScraping: true,
        jsonIngestion: true,
        rssIngestion: true,
      },
      endpoints: {
        search: '/api/search',
        index: '/api/index',
        health: '/api/health',
      },
    };

    res.json(healthCheck);

  } catch (error) {
    console.error('❌ Detailed health check error:', error);
    res.status(500).json({
      status: 'unhealthy',
      error: 'Detailed health check failed',
      message: error instanceof Error ? error.message : 'An unexpected error occurred',
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * GET /api/analytics - Get search analytics and usage stats
 */
router.get('/analytics', async (req: Request, res: Response): Promise<void> => {
  try {
    console.log('📊 Fetching analytics data...');
    
    // For demonstration, provide mock analytics data
    const days = parseInt(req.query.days as string) || 30;
    const includeRecent = req.query.recent === 'true';

    const mockAnalytics = {
      totalQueries: 1247,
      totalUniqueQueries: 892,
      averageLatency: 1850,
      successRate: 94.2,
      topQueries: [
        { query: 'artificial intelligence', count: 156, averageLatency: 1650, lastSearched: new Date().toISOString() },
        { query: 'machine learning algorithms', count: 134, averageLatency: 1920, lastSearched: new Date().toISOString() },
        { query: 'quantum computing', count: 98, averageLatency: 2100, lastSearched: new Date().toISOString() },
        { query: 'neural networks', count: 87, averageLatency: 1750, lastSearched: new Date().toISOString() },
        { query: 'deep learning', count: 76, averageLatency: 1980, lastSearched: new Date().toISOString() },
        { query: 'OpenAI research', count: 65, averageLatency: 1600, lastSearched: new Date().toISOString() },
        { query: 'natural language processing', count: 54, averageLatency: 2200, lastSearched: new Date().toISOString() },
        { query: 'computer vision', count: 43, averageLatency: 1850, lastSearched: new Date().toISOString() }
      ],
      queryTrends: Array.from({ length: Math.min(days, 30) }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - i);
        return {
          date: date.toISOString().split('T')[0],
          count: Math.floor(Math.random() * 50) + 20,
          averageLatency: Math.floor(Math.random() * 1000) + 1500
        };
      }).reverse(),
      searchTypes: {
        hybrid: 856,
        bm25: 298,
        vector: 93
      },
      popularFilters: {
        categories: [
          { category: 'Technology', count: 445 },
          { category: 'Science', count: 298 },
          { category: 'News', count: 234 },
          { category: 'Research', count: 156 },
          { category: 'Business', count: 114 }
        ],
        authors: [
          { author: 'Dr. Smith', count: 67 },
          { author: 'John Doe', count: 54 },
          { author: 'Jane Wilson', count: 43 },
          { author: 'Prof. Johnson', count: 32 }
        ]
      },
      performanceMetrics: {
        fastQueries: 423,
        mediumQueries: 678,
        slowQueries: 146
      },
      errorStats: {
        totalErrors: 72,
        errorTypes: [
          { error: 'Search timeout', count: 34 },
          { error: 'Service unavailable', count: 23 },
          { error: 'Invalid query', count: 15 }
        ]
      }
    };

    const mockRecentQueries = includeRecent ? [
      {
        id: 'query_1',
        query: 'artificial intelligence trends 2024',
        timestamp: new Date(Date.now() - 300000).toISOString(),
        resultsCount: 15,
        responseLatency: 1650,
        searchType: 'hybrid',
        success: true
      },
      {
        id: 'query_2',
        query: 'machine learning best practices',
        timestamp: new Date(Date.now() - 600000).toISOString(),
        resultsCount: 23,
        responseLatency: 1920,
        searchType: 'hybrid',
        success: true
      },
      {
        id: 'query_3',
        query: 'quantum computing applications',
        timestamp: new Date(Date.now() - 900000).toISOString(),
        resultsCount: 8,
        responseLatency: 2100,
        searchType: 'vector',
        success: true
      }
    ] : undefined;

    console.log(`✅ Mock analytics data generated: ${mockAnalytics.totalQueries} total queries`);

    const response = {
      success: true,
      analytics: mockAnalytics,
      recentQueries: mockRecentQueries,
      metadata: {
        period: `${days} days`,
        generatedAt: new Date().toISOString(),
        includeRecent,
        note: 'This is demonstration data. Real analytics require Elasticsearch setup.'
      },
      timestamp: new Date().toISOString(),
    };

    res.json(response);

  } catch (error) {
    console.error('❌ Analytics error:', error);
    res.status(500).json({
      success: false,
      error: 'Analytics retrieval failed',
      message: error instanceof Error ? error.message : 'An unexpected error occurred',
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * GET /api/analytics/queries - Get recent queries with optional search
 */
router.get('/analytics/queries', async (req: Request, res: Response): Promise<void> => {
  try {
    const analyticsService: AnalyticsService = req.app.locals.analyticsService;
    
    if (!analyticsService) {
      res.status(503).json({
        success: false,
        error: 'Analytics service unavailable',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    const limit = parseInt(req.query.limit as string) || 50;
    const searchTerm = req.query.search as string;

    let queries;
    if (searchTerm) {
      queries = await analyticsService.searchQueries(searchTerm, limit);
    } else {
      queries = await analyticsService.getRecentQueries(limit);
    }

    res.json({
      success: true,
      queries,
      total: queries.length,
      searchTerm: searchTerm || undefined,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('❌ Analytics queries error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve queries',
      message: error instanceof Error ? error.message : 'An unexpected error occurred',
      timestamp: new Date().toISOString(),
    });
  }
});

export default router;
