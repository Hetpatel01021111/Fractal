import { Router, Request, Response } from 'express';
import Joi from 'joi';
import { ElasticsearchClient, SearchOptions } from '../elasticsearchClient';
import { GeminiService } from '../services/gemini';
import { SearchEngine, HybridSearchQuery } from '../searchEngine';

const router = Router();

// Validation schemas
const searchSchema = Joi.object({
  query: Joi.string().required().min(1).max(500),
  filters: Joi.object({
    category: Joi.string().optional(),
    dateRange: Joi.object({
      from: Joi.string().isoDate().optional(),
      to: Joi.string().isoDate().optional(),
    }).optional(),
    tags: Joi.array().items(Joi.string()).optional(),
  }).optional(),
  size: Joi.number().integer().min(1).max(50).default(10),
  from: Joi.number().integer().min(0).default(0),
  useSemanticSearch: Joi.boolean().default(true),
});

// POST /api/search - Main search endpoint
router.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    // Validate request
    const { error, value } = searchSchema.validate(req.body);
    if (error) {
      res.status(400).json({
        error: 'Invalid request',
        details: error.details.map(d => d.message),
      });
      return;
    }

    const { query, filters, size, from, useSemanticSearch } = value;
    const elasticsearchClient: ElasticsearchClient = req.app.locals.elasticsearchClient;
    const geminiService: GeminiService = req.app.locals.geminiService;

    // Initialize SearchEngine
    const searchEngine = new SearchEngine(elasticsearchClient, geminiService);

    const hybridQuery: HybridSearchQuery = {
      query,
      filters,
      size,
      from,
      weights: useSemanticSearch ? { bm25: 0.6, vector: 0.4 } : { bm25: 1.0, vector: 0.0 },
      includeExplanation: false,
    };

    let searchResults;
    let searchSummary;

    if (useSemanticSearch) {
      // Use intelligent hybrid search (automatically handles fallbacks)
      searchResults = await searchEngine.intelligentSearch(hybridQuery);
    } else {
      // Use keyword-only search
      searchResults = await searchEngine.keywordSearch(hybridQuery);
    }

    // Generate AI summary if we have results
    if (searchResults.results.length > 0) {
      try {
        const summaryResult = await searchEngine.summarizeResults(
          query,
          searchResults.results
        );
        searchSummary = summaryResult.summary;
      } catch (summaryError) {
        console.warn('Failed to generate summary:', summaryError);
        searchSummary = 'Unable to generate summary at this time.';
      }
    }

    // Generate search suggestions
    const suggestions = await searchEngine.getSearchSuggestions(query);

    res.json({
      results: searchResults.results,
      total: searchResults.total,
      took: searchResults.took,
      searchInfo: searchResults.searchInfo,
      query: searchResults.query,
      summary: searchSummary,
      suggestions: suggestions.slice(0, 5),
      pagination: {
        size,
        from,
        hasMore: from + size < searchResults.total,
      },
    });

  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({
      error: 'Search failed',
      message: 'An error occurred while processing your search request.',
    });
  }
});

// POST /api/search/hybrid - Advanced hybrid search with detailed scoring
router.post('/hybrid', async (req: Request, res: Response): Promise<void> => {
  try {
    const { error, value } = searchSchema.validate(req.body);
    if (error) {
      res.status(400).json({
        error: 'Invalid request',
        details: error.details.map(d => d.message),
      });
      return;
    }

    const { query, filters, size, from } = value;
    const elasticsearchClient: ElasticsearchClient = req.app.locals.elasticsearchClient;
    const geminiService: GeminiService = req.app.locals.geminiService;

    // Initialize SearchEngine
    const searchEngine = new SearchEngine(elasticsearchClient, geminiService);

    const hybridQuery: HybridSearchQuery = {
      query,
      filters,
      size,
      from,
      weights: { bm25: 0.6, vector: 0.4 }, // Balanced hybrid approach
      rrf: { k: 60 },
      includeExplanation: true, // Include detailed scoring explanation
    };

    // Perform hybrid search with detailed scoring
    const searchResults = await searchEngine.hybridSearch(hybridQuery);

    res.json({
      ...searchResults,
      explanation: 'This response includes detailed scoring information for BM25, vector search, and RRF fusion.',
    });

  } catch (error) {
    console.error('Hybrid search error:', error);
    res.status(500).json({
      error: 'Hybrid search failed',
      message: 'An error occurred while processing your hybrid search request.',
    });
  }
});

// GET /api/search/suggestions - Get search suggestions
router.get('/suggestions', async (req: Request, res: Response): Promise<void> => {
  try {
    const query = req.query.q as string;
    
    if (!query || query.length < 2) {
      res.status(400).json({
        error: 'Query parameter "q" is required and must be at least 2 characters long',
      });
      return;
    }

    const geminiService: GeminiService = req.app.locals.geminiService;
    const suggestions = await geminiService.generateSearchSuggestions(query);

    res.json({
      suggestions: suggestions.slice(0, 8),
      query,
    });

  } catch (error) {
    console.error('Suggestions error:', error);
    res.status(500).json({
      error: 'Failed to generate suggestions',
      suggestions: [],
    });
  }
});

// POST /api/search/analyze - Analyze search intent
router.post('/analyze', async (req: Request, res: Response): Promise<void> => {
  try {
    const { query } = req.body;
    
    if (!query || typeof query !== 'string') {
      res.status(400).json({
        error: 'Query is required and must be a string',
      });
      return;
    }

    const geminiService: GeminiService = req.app.locals.geminiService;
    const analysis = await geminiService.analyzeSearchIntent(query);

    res.json({
      query,
      analysis,
    });

  } catch (error) {
    console.error('Analysis error:', error);
    res.status(500).json({
      error: 'Failed to analyze search intent',
      analysis: {
        intent: 'informational',
        confidence: 0.5,
        suggestions: [],
      },
    });
  }
});

// GET /api/search/stats - Get search statistics
router.get('/stats', async (req: Request, res: Response): Promise<void> => {
  try {
    const elasticsearchClient: ElasticsearchClient = req.app.locals.elasticsearchClient;
    
    // Get index statistics
    const stats = await elasticsearchClient.getIndexStats();
    const searchStats = await elasticsearchClient.searchDocuments('*', { size: 0 });

    res.json({
      totalDocuments: searchStats.total,
      indexName: 'ai-search-documents',
      status: 'healthy',
      indexStats: {
        size: stats.indices?.['ai-search-documents']?.total?.store?.size_in_bytes || 0,
        documents: stats.indices?.['ai-search-documents']?.total?.docs?.count || 0,
      },
    });

  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({
      error: 'Failed to retrieve search statistics',
      totalDocuments: 0,
      status: 'error',
    });
  }
});

export { router as searchRoutes };
