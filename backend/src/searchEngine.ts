import { ElasticsearchClient, SearchDocument, SearchOptions, SearchResult } from './elasticsearchClient';
import { GeminiService } from './services/gemini';

// Enhanced interfaces for hybrid search
export interface HybridSearchQuery {
  query: string;
  filters?: {
    category?: string;
    tags?: string[];
    dateRange?: {
      from: string;
      to: string;
    };
    author?: string;
  };
  size?: number;
  from?: number;
  weights?: {
    bm25: number;    // Weight for BM25 scores (default: 0.7)
    vector: number;  // Weight for vector scores (default: 0.3)
  };
  rrf?: {
    k: number;       // RRF parameter (default: 60)
  };
  includeExplanation?: boolean; // Include scoring explanation
}

export interface ScoredResult extends SearchResult {
  scores: {
    bm25: number;
    vector: number;
    rrf: number;
    final: number;
  };
  rank: {
    bm25: number;
    vector: number;
    final: number;
  };
  explanation?: {
    bm25Contribution: number;
    vectorContribution: number;
    rrfScore: number;
    finalCalculation: string;
  };
}

export interface HybridSearchResponse {
  results: ScoredResult[];
  total: number;
  took: number;
  searchInfo: {
    bm25Results: number;
    vectorResults: number;
    combinedResults: number;
    rrfParameter: number;
    weights: {
      bm25: number;
      vector: number;
    };
  };
  query: {
    original: string;
    enhanced?: string | undefined;
    embedding?: boolean | undefined;
  };
}

export class SearchEngine {
  private elasticsearchClient: ElasticsearchClient;
  private geminiService: GeminiService;

  constructor(elasticsearchClient: ElasticsearchClient, geminiService: GeminiService) {
    this.elasticsearchClient = elasticsearchClient;
    this.geminiService = geminiService;
  }

  /**
   * Perform hybrid search combining BM25 and vector search with RRF
   */
  async hybridSearch(searchQuery: HybridSearchQuery): Promise<HybridSearchResponse> {
    const startTime = Date.now();
    
    // Set default parameters
    const {
      query,
      filters = {},
      size = 10,
      from = 0,
      weights = { bm25: 0.7, vector: 0.3 },
      rrf = { k: 60 },
      includeExplanation = false
    } = searchQuery;

    const searchOptions: SearchOptions = {
      size: Math.max(size * 2, 20), // Get more results for better fusion
      from: 0, // Always start from 0 for fusion, apply pagination later
      filters,
      highlight: true,
    };

    let enhancedQuery = query;
    let embeddingGenerated = false;
    let bm25Results: SearchResult[] = [];
    let vectorResults: SearchResult[] = [];

    try {
      // Step 1: Enhance query using Gemini AI
      try {
        enhancedQuery = await this.geminiService.enhanceQuery(query);
      } catch (error) {
        console.warn('Query enhancement failed, using original query:', error);
        enhancedQuery = query;
      }

      // Step 2: Perform BM25 keyword search
      console.log(`🔍 Performing BM25 search for: "${enhancedQuery}"`);
      const bm25Response = await this.elasticsearchClient.searchDocuments(enhancedQuery, searchOptions);
      bm25Results = bm25Response.results;

      // Step 3: Perform vector search (if embedding generation succeeds)
      try {
        console.log(`🧠 Generating embedding for: "${enhancedQuery}"`);
        const embedding = await this.geminiService.generateEmbedding(enhancedQuery);
        embeddingGenerated = true;

        console.log(`🎯 Performing vector search...`);
        const vectorResponse = await this.elasticsearchClient.vectorSearchDocuments(
          embedding, 
          enhancedQuery, 
          searchOptions
        );
        vectorResults = vectorResponse.results;
      } catch (error) {
        console.warn('Vector search failed, proceeding with BM25 only:', error);
        vectorResults = [];
      }

      // Step 4: Combine results using Reciprocal Rank Fusion (RRF)
      console.log(`⚡ Combining results using RRF (k=${rrf.k})`);
      const combinedResults = this.performReciprocalRankFusion(
        bm25Results,
        vectorResults,
        rrf.k,
        weights,
        includeExplanation
      );

      // Step 5: Apply pagination to final results
      const paginatedResults = combinedResults.slice(from, from + size);

      const endTime = Date.now();
      const took = endTime - startTime;

      return {
        results: paginatedResults,
        total: combinedResults.length,
        took,
        searchInfo: {
          bm25Results: bm25Results.length,
          vectorResults: vectorResults.length,
          combinedResults: combinedResults.length,
          rrfParameter: rrf.k,
          weights,
        },
        query: {
          original: query,
          enhanced: enhancedQuery !== query ? enhancedQuery : undefined,
          embedding: embeddingGenerated,
        },
      };

    } catch (error) {
      console.error('Hybrid search failed:', error);
      throw error;
    }
  }

  /**
   * Perform BM25-only search (fallback when vector search is unavailable)
   */
  async keywordSearch(searchQuery: HybridSearchQuery): Promise<HybridSearchResponse> {
    const startTime = Date.now();
    
    const {
      query,
      filters = {},
      size = 10,
      from = 0,
    } = searchQuery;

    const searchOptions: SearchOptions = {
      size,
      from,
      filters,
      highlight: true,
    };

    try {
      // Enhance query
      let enhancedQuery = query;
      try {
        enhancedQuery = await this.geminiService.enhanceQuery(query);
      } catch (error) {
        console.warn('Query enhancement failed, using original query');
      }

      // Perform BM25 search
      const bm25Response = await this.elasticsearchClient.searchDocuments(enhancedQuery, searchOptions);
      
      // Convert to scored results format
      const scoredResults: ScoredResult[] = bm25Response.results.map((result, index) => ({
        ...result,
        scores: {
          bm25: result.score,
          vector: 0,
          rrf: 0,
          final: result.score,
        },
        rank: {
          bm25: index + 1,
          vector: 0,
          final: index + 1,
        },
      }));

      const endTime = Date.now();

      return {
        results: scoredResults,
        total: bm25Response.total,
        took: endTime - startTime,
        searchInfo: {
          bm25Results: bm25Response.results.length,
          vectorResults: 0,
          combinedResults: scoredResults.length,
          rrfParameter: 0,
          weights: { bm25: 1.0, vector: 0.0 },
        },
        query: {
          original: query,
          enhanced: enhancedQuery !== query ? enhancedQuery : undefined,
          embedding: false,
        },
      };

    } catch (error) {
      console.error('Keyword search failed:', error);
      throw error;
    }
  }

  /**
   * Perform vector-only search
   */
  async vectorSearch(searchQuery: HybridSearchQuery): Promise<HybridSearchResponse> {
    const startTime = Date.now();
    
    const {
      query,
      filters = {},
      size = 10,
      from = 0,
    } = searchQuery;

    const searchOptions: SearchOptions = {
      size,
      from,
      filters,
      highlight: true,
    };

    try {
      // Generate embedding
      const embedding = await this.geminiService.generateEmbedding(query);
      
      // Perform vector search
      const vectorResponse = await this.elasticsearchClient.vectorSearchDocuments(
        embedding, 
        query, 
        searchOptions
      );
      
      // Convert to scored results format
      const scoredResults: ScoredResult[] = vectorResponse.results.map((result, index) => ({
        ...result,
        scores: {
          bm25: 0,
          vector: result.score,
          rrf: 0,
          final: result.score,
        },
        rank: {
          bm25: 0,
          vector: index + 1,
          final: index + 1,
        },
      }));

      const endTime = Date.now();

      return {
        results: scoredResults,
        total: vectorResponse.total,
        took: endTime - startTime,
        searchInfo: {
          bm25Results: 0,
          vectorResults: vectorResponse.results.length,
          combinedResults: scoredResults.length,
          rrfParameter: 0,
          weights: { bm25: 0.0, vector: 1.0 },
        },
        query: {
          original: query,
          embedding: true,
        },
      };

    } catch (error) {
      console.error('Vector search failed:', error);
      throw error;
    }
  }

  /**
   * Implement Reciprocal Rank Fusion (RRF) algorithm
   * RRF Score = Σ(1 / (k + rank_i)) for each ranking list
   */
  private performReciprocalRankFusion(
    bm25Results: SearchResult[],
    vectorResults: SearchResult[],
    k: number = 60,
    weights: { bm25: number; vector: number } = { bm25: 0.7, vector: 0.3 },
    includeExplanation: boolean = false
  ): ScoredResult[] {
    
    const scoreMap = new Map<string, {
      result: SearchResult;
      bm25Rank: number;
      vectorRank: number;
      bm25Score: number;
      vectorScore: number;
      rrfScore: number;
    }>();

    // Process BM25 results
    bm25Results.forEach((result, index) => {
      const rank = index + 1;
      const rrfContribution = 1 / (k + rank);
      
      scoreMap.set(result.id, {
        result: { ...result },
        bm25Rank: rank,
        vectorRank: 0,
        bm25Score: result.score,
        vectorScore: 0,
        rrfScore: rrfContribution * weights.bm25,
      });
    });

    // Process vector results
    vectorResults.forEach((result, index) => {
      const rank = index + 1;
      const rrfContribution = 1 / (k + rank);
      const existing = scoreMap.get(result.id);

      if (existing) {
        // Document exists in both rankings - combine scores
        existing.vectorRank = rank;
        existing.vectorScore = result.score;
        existing.rrfScore += rrfContribution * weights.vector;
        
        // Merge highlights (avoid duplicates)
        const existingHighlights = existing.result.highlights || [];
        const newHighlights = result.highlights || [];
        existing.result.highlights = [
          ...existingHighlights,
          ...newHighlights.filter(h => !existingHighlights.includes(h))
        ];
      } else {
        // Document only in vector results
        scoreMap.set(result.id, {
          result: { ...result },
          bm25Rank: 0,
          vectorRank: rank,
          bm25Score: 0,
          vectorScore: result.score,
          rrfScore: rrfContribution * weights.vector,
        });
      }
    });

    // Convert to final results and sort by RRF score
    const finalResults: ScoredResult[] = Array.from(scoreMap.values())
      .sort((a, b) => b.rrfScore - a.rrfScore)
      .map((item, finalIndex) => {
        const finalRank = finalIndex + 1;
        const finalScore = item.rrfScore;

        const scoredResult: ScoredResult = {
          ...item.result,
          scores: {
            bm25: item.bm25Score,
            vector: item.vectorScore,
            rrf: item.rrfScore,
            final: finalScore,
          },
          rank: {
            bm25: item.bm25Rank,
            vector: item.vectorRank,
            final: finalRank,
          },
        };

        // Add explanation if requested
        if (includeExplanation) {
          const bm25Contribution = item.bm25Rank > 0 ? (1 / (k + item.bm25Rank)) * weights.bm25 : 0;
          const vectorContribution = item.vectorRank > 0 ? (1 / (k + item.vectorRank)) * weights.vector : 0;
          
          scoredResult.explanation = {
            bm25Contribution,
            vectorContribution,
            rrfScore: item.rrfScore,
            finalCalculation: `RRF = ${bm25Contribution.toFixed(4)} (BM25) + ${vectorContribution.toFixed(4)} (Vector) = ${item.rrfScore.toFixed(4)}`,
          };
        }

        return scoredResult;
      });

    console.log(`🎯 RRF fusion complete: ${finalResults.length} unique documents`);
    return finalResults;
  }

  /**
   * Get search suggestions based on query
   */
  async getSearchSuggestions(query: string, limit: number = 5): Promise<string[]> {
    try {
      return await this.geminiService.generateSearchSuggestions(query);
    } catch (error) {
      console.warn('Failed to generate search suggestions:', error);
      return [];
    }
  }

  /**
   * Analyze search intent
   */
  async analyzeSearchIntent(query: string): Promise<any> {
    try {
      return await this.geminiService.analyzeSearchIntent(query);
    } catch (error) {
      console.warn('Failed to analyze search intent:', error);
      return {
        intent: 'informational',
        confidence: 0.5,
        suggestions: [],
      };
    }
  }

  /**
   * Generate search result summary
   */
  async summarizeResults(query: string, results: SearchResult[]): Promise<any> {
    try {
      return await this.geminiService.summarizeSearchResults(query, results);
    } catch (error) {
      console.warn('Failed to summarize results:', error);
      return {
        summary: 'Unable to generate summary at this time.',
        keyPoints: [],
      };
    }
  }

  /**
   * Perform intelligent search with automatic method selection
   */
  async intelligentSearch(searchQuery: HybridSearchQuery): Promise<HybridSearchResponse> {
    try {
      // Try hybrid search first (best results)
      return await this.hybridSearch(searchQuery);
    } catch (error) {
      console.warn('Hybrid search failed, falling back to keyword search:', error);
      
      try {
        // Fallback to keyword search
        return await this.keywordSearch(searchQuery);
      } catch (fallbackError) {
        console.error('All search methods failed:', fallbackError);
        throw fallbackError;
      }
    }
  }

  /**
   * Batch search for multiple queries
   */
  async batchSearch(queries: string[], options: Partial<HybridSearchQuery> = {}): Promise<HybridSearchResponse[]> {
    const results = await Promise.allSettled(
      queries.map(query => this.intelligentSearch({ query, ...options }))
    );

    return results.map((result, index) => {
      if (result.status === 'fulfilled') {
        return result.value;
      } else {
        console.error(`Batch search failed for query "${queries[index]}":`, result.reason);
        // Return empty result for failed queries
        return {
          results: [],
          total: 0,
          took: 0,
          searchInfo: {
            bm25Results: 0,
            vectorResults: 0,
            combinedResults: 0,
            rrfParameter: 0,
            weights: { bm25: 0, vector: 0 },
          },
          query: {
            original: queries[index] || '',
            enhanced: undefined,
            embedding: false,
          },
        } as HybridSearchResponse;
      }
    });
  }

  /**
   * Get search analytics and performance metrics
   */
  getSearchMetrics(): any {
    return {
      timestamp: new Date().toISOString(),
      elasticsearch: {
        status: 'connected',
        indexName: 'ai-search-documents',
      },
      gemini: {
        status: 'connected',
        embeddingModel: 'embedding-001',
      },
      features: {
        hybridSearch: true,
        vectorSearch: true,
        bm25Search: true,
        rrfFusion: true,
        queryEnhancement: true,
        resultSummarization: true,
      },
    };
  }
}
