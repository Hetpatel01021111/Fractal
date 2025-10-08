import { SearchEngine } from '../../src/searchEngine';
import { ElasticsearchClient } from '../../src/elasticsearchClient';
import { GeminiService } from '../../src/services/gemini';

// Mock dependencies
jest.mock('../../src/elasticsearchClient');
jest.mock('../../src/services/gemini');

describe('Search Engine - Retrieval Module', () => {
  let searchEngine: SearchEngine;
  let mockElasticsearchClient: jest.Mocked<ElasticsearchClient>;
  let mockGeminiService: jest.Mocked<GeminiService>;

  beforeEach(() => {
    mockElasticsearchClient = new ElasticsearchClient() as jest.Mocked<ElasticsearchClient>;
    mockGeminiService = new GeminiService() as jest.Mocked<GeminiService>;
    
    searchEngine = new SearchEngine(mockElasticsearchClient, mockGeminiService);
  });

  describe('BM25 Search', () => {
    it('should perform BM25 search successfully', async () => {
      const mockBM25Results = {
        results: [
          {
            id: '1',
            title: 'AI Research Paper',
            content: 'This paper discusses artificial intelligence advances',
            score: 8.5,
            metadata: { category: 'Research' }
          },
          {
            id: '2',
            title: 'Machine Learning Guide',
            content: 'A comprehensive guide to machine learning',
            score: 7.2,
            metadata: { category: 'Education' }
          }
        ],
        total: 2,
        took: 15
      };

      mockElasticsearchClient.search = jest.fn().mockResolvedValue(mockBM25Results);

      const query = {
        query: 'artificial intelligence',
        size: 10,
        from: 0
      };

      const result = await searchEngine.bm25Search(query);

      expect(result.success).toBe(true);
      expect(result.results).toHaveLength(2);
      expect(result.results[0].score).toBe(8.5);
      expect(mockElasticsearchClient.search).toHaveBeenCalledWith(
        expect.objectContaining({
          query: expect.objectContaining({
            bool: expect.objectContaining({
              must: expect.arrayContaining([
                expect.objectContaining({
                  multi_match: expect.objectContaining({
                    query: 'artificial intelligence'
                  })
                })
              ])
            })
          })
        })
      );
    });

    it('should handle BM25 search with filters', async () => {
      const mockResults = {
        results: [
          {
            id: '1',
            title: 'Filtered Result',
            content: 'Content matching filters',
            score: 9.0,
            metadata: { category: 'Technology', author: 'John Doe' }
          }
        ],
        total: 1,
        took: 12
      };

      mockElasticsearchClient.search = jest.fn().mockResolvedValue(mockResults);

      const query = {
        query: 'machine learning',
        filters: {
          category: 'Technology',
          author: 'John Doe',
          dateRange: {
            from: '2024-01-01',
            to: '2024-12-31'
          }
        },
        size: 10,
        from: 0
      };

      const result = await searchEngine.bm25Search(query);

      expect(result.success).toBe(true);
      expect(mockElasticsearchClient.search).toHaveBeenCalledWith(
        expect.objectContaining({
          query: expect.objectContaining({
            bool: expect.objectContaining({
              filter: expect.arrayContaining([
                { term: { 'metadata.category': 'Technology' } },
                { term: { 'metadata.author': 'John Doe' } },
                expect.objectContaining({
                  range: expect.objectContaining({
                    'metadata.date': {
                      gte: '2024-01-01',
                      lte: '2024-12-31'
                    }
                  })
                })
              ])
            })
          })
        })
      );
    });

    it('should handle BM25 search errors', async () => {
      mockElasticsearchClient.search = jest.fn()
        .mockRejectedValue(new Error('Elasticsearch connection failed'));

      const query = {
        query: 'test query',
        size: 10,
        from: 0
      };

      const result = await searchEngine.bm25Search(query);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Elasticsearch connection failed');
    });
  });

  describe('Vector Search', () => {
    it('should perform vector search successfully', async () => {
      const mockEmbedding = [0.1, 0.2, 0.3, 0.4, 0.5];
      const mockVectorResults = {
        results: [
          {
            id: '1',
            title: 'Similar Document',
            content: 'Content with semantic similarity',
            score: 0.95,
            metadata: { category: 'AI' }
          },
          {
            id: '2',
            title: 'Related Article',
            content: 'Another semantically related article',
            score: 0.87,
            metadata: { category: 'ML' }
          }
        ],
        total: 2,
        took: 25
      };

      mockGeminiService.generateEmbedding = jest.fn().mockResolvedValue(mockEmbedding);
      mockElasticsearchClient.search = jest.fn().mockResolvedValue(mockVectorResults);

      const query = {
        query: 'neural networks deep learning',
        size: 10,
        from: 0
      };

      const result = await searchEngine.vectorSearch(query);

      expect(result.success).toBe(true);
      expect(result.results).toHaveLength(2);
      expect(result.results[0].score).toBe(0.95);
      expect(mockGeminiService.generateEmbedding).toHaveBeenCalledWith('neural networks deep learning');
      expect(mockElasticsearchClient.search).toHaveBeenCalledWith(
        expect.objectContaining({
          query: expect.objectContaining({
            bool: expect.objectContaining({
              must: expect.arrayContaining([
                expect.objectContaining({
                  knn: expect.objectContaining({
                    field: 'embedding',
                    query_vector: mockEmbedding,
                    k: 10
                  })
                })
              ])
            })
          })
        })
      );
    });

    it('should handle embedding generation failures', async () => {
      mockGeminiService.generateEmbedding = jest.fn()
        .mockRejectedValue(new Error('Quota exceeded'));

      const query = {
        query: 'test query',
        size: 10,
        from: 0
      };

      const result = await searchEngine.vectorSearch(query);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Quota exceeded');
    });

    it('should handle vector search with filters', async () => {
      const mockEmbedding = [0.1, 0.2, 0.3];
      const mockResults = {
        results: [
          {
            id: '1',
            title: 'Filtered Vector Result',
            content: 'Content matching vector and filters',
            score: 0.92,
            metadata: { category: 'Science' }
          }
        ],
        total: 1,
        took: 30
      };

      mockGeminiService.generateEmbedding = jest.fn().mockResolvedValue(mockEmbedding);
      mockElasticsearchClient.search = jest.fn().mockResolvedValue(mockResults);

      const query = {
        query: 'quantum computing',
        filters: {
          category: 'Science'
        },
        size: 5,
        from: 0
      };

      const result = await searchEngine.vectorSearch(query);

      expect(result.success).toBe(true);
      expect(mockElasticsearchClient.search).toHaveBeenCalledWith(
        expect.objectContaining({
          query: expect.objectContaining({
            bool: expect.objectContaining({
              filter: expect.arrayContaining([
                { term: { 'metadata.category': 'Science' } }
              ])
            })
          })
        })
      );
    });
  });

  describe('Hybrid Search', () => {
    it('should perform hybrid search with RRF fusion', async () => {
      const mockBM25Results = {
        results: [
          { id: '1', title: 'BM25 Result 1', content: 'Content 1', score: 8.5 },
          { id: '2', title: 'BM25 Result 2', content: 'Content 2', score: 7.2 },
          { id: '3', title: 'BM25 Result 3', content: 'Content 3', score: 6.8 }
        ],
        total: 3,
        took: 15
      };

      const mockVectorResults = {
        results: [
          { id: '2', title: 'Vector Result 1', content: 'Content 2', score: 0.95 },
          { id: '4', title: 'Vector Result 2', content: 'Content 4', score: 0.87 },
          { id: '1', title: 'Vector Result 3', content: 'Content 1', score: 0.82 }
        ],
        total: 3,
        took: 25
      };

      const mockEmbedding = [0.1, 0.2, 0.3];

      mockGeminiService.generateEmbedding = jest.fn().mockResolvedValue(mockEmbedding);
      
      // Mock both BM25 and vector searches
      jest.spyOn(searchEngine, 'bm25Search').mockResolvedValue({
        success: true,
        ...mockBM25Results
      });
      
      jest.spyOn(searchEngine, 'vectorSearch').mockResolvedValue({
        success: true,
        ...mockVectorResults
      });

      const query = {
        query: 'artificial intelligence',
        size: 10,
        from: 0,
        weights: { bm25: 0.6, vector: 0.4 },
        rrf: { k: 60 }
      };

      const result = await searchEngine.hybridSearch(query);

      expect(result.success).toBe(true);
      expect(result.results.length).toBeGreaterThan(0);
      expect(result.searchInfo).toEqual(
        expect.objectContaining({
          bm25Results: 3,
          vectorResults: 3,
          combinedResults: expect.any(Number),
          rrfParameter: 60,
          weights: { bm25: 0.6, vector: 0.4 }
        })
      );

      // Check that results are properly ranked by RRF
      expect(result.results[0].id).toBeDefined();
      expect(result.results[0].score).toBeGreaterThan(0);
    });

    it('should handle hybrid search when vector search fails', async () => {
      const mockBM25Results = {
        results: [
          { id: '1', title: 'BM25 Only Result', content: 'Content 1', score: 8.5 }
        ],
        total: 1,
        took: 15
      };

      jest.spyOn(searchEngine, 'bm25Search').mockResolvedValue({
        success: true,
        ...mockBM25Results
      });
      
      jest.spyOn(searchEngine, 'vectorSearch').mockResolvedValue({
        success: false,
        error: 'Vector search failed',
        results: [],
        total: 0,
        took: 0
      });

      const query = {
        query: 'test query',
        size: 10,
        from: 0,
        weights: { bm25: 0.6, vector: 0.4 }
      };

      const result = await searchEngine.hybridSearch(query);

      expect(result.success).toBe(true);
      expect(result.results).toHaveLength(1);
      expect(result.searchInfo?.bm25Results).toBe(1);
      expect(result.searchInfo?.vectorResults).toBe(0);
    });

    it('should handle hybrid search when BM25 search fails', async () => {
      const mockVectorResults = {
        results: [
          { id: '1', title: 'Vector Only Result', content: 'Content 1', score: 0.95 }
        ],
        total: 1,
        took: 25
      };

      jest.spyOn(searchEngine, 'bm25Search').mockResolvedValue({
        success: false,
        error: 'BM25 search failed',
        results: [],
        total: 0,
        took: 0
      });
      
      jest.spyOn(searchEngine, 'vectorSearch').mockResolvedValue({
        success: true,
        ...mockVectorResults
      });

      const query = {
        query: 'test query',
        size: 10,
        from: 0,
        weights: { bm25: 0.6, vector: 0.4 }
      };

      const result = await searchEngine.hybridSearch(query);

      expect(result.success).toBe(true);
      expect(result.results).toHaveLength(1);
      expect(result.searchInfo?.bm25Results).toBe(0);
      expect(result.searchInfo?.vectorResults).toBe(1);
    });
  });

  describe('RRF (Reciprocal Rank Fusion)', () => {
    it('should calculate RRF scores correctly', () => {
      const bm25Results = [
        { id: '1', score: 10.0 },
        { id: '2', score: 8.0 },
        { id: '3', score: 6.0 }
      ];

      const vectorResults = [
        { id: '2', score: 0.95 },
        { id: '4', score: 0.87 },
        { id: '1', score: 0.82 }
      ];

      const k = 60;
      const weights = { bm25: 0.6, vector: 0.4 };

      const fusedResults = (searchEngine as any).fuseResultsWithRRF(
        bm25Results,
        vectorResults,
        k,
        weights
      );

      expect(fusedResults).toHaveLength(4); // Unique documents
      
      // Document '2' should rank high (appears in both lists)
      const doc2 = fusedResults.find(r => r.id === '2');
      expect(doc2).toBeDefined();
      expect(doc2?.score).toBeGreaterThan(0);

      // Results should be sorted by RRF score
      for (let i = 1; i < fusedResults.length; i++) {
        expect(fusedResults[i-1].score).toBeGreaterThanOrEqual(fusedResults[i].score);
      }
    });

    it('should handle empty result sets', () => {
      const bm25Results: any[] = [];
      const vectorResults = [
        { id: '1', score: 0.95 }
      ];

      const fusedResults = (searchEngine as any).fuseResultsWithRRF(
        bm25Results,
        vectorResults,
        60,
        { bm25: 0.6, vector: 0.4 }
      );

      expect(fusedResults).toHaveLength(1);
      expect(fusedResults[0].id).toBe('1');
    });

    it('should handle different k values', () => {
      const bm25Results = [
        { id: '1', score: 10.0 },
        { id: '2', score: 8.0 }
      ];

      const vectorResults = [
        { id: '1', score: 0.95 },
        { id: '2', score: 0.87 }
      ];

      const resultsK60 = (searchEngine as any).fuseResultsWithRRF(
        bm25Results,
        vectorResults,
        60,
        { bm25: 0.5, vector: 0.5 }
      );

      const resultsK10 = (searchEngine as any).fuseResultsWithRRF(
        bm25Results,
        vectorResults,
        10,
        { bm25: 0.5, vector: 0.5 }
      );

      // Different k values should produce different scores
      expect(resultsK60[0].score).not.toBe(resultsK10[0].score);
    });
  });

  describe('Query Enhancement', () => {
    it('should enhance queries with Gemini', async () => {
      const originalQuery = 'AI';
      const enhancedQuery = 'artificial intelligence machine learning deep learning neural networks';

      mockGeminiService.enhanceQuery = jest.fn().mockResolvedValue(enhancedQuery);

      const result = await searchEngine.enhanceQuery(originalQuery);

      expect(result.success).toBe(true);
      expect(result.enhancedQuery).toBe(enhancedQuery);
      expect(mockGeminiService.enhanceQuery).toHaveBeenCalledWith(originalQuery);
    });

    it('should handle query enhancement failures', async () => {
      const originalQuery = 'test query';

      mockGeminiService.enhanceQuery = jest.fn()
        .mockRejectedValue(new Error('Enhancement failed'));

      const result = await searchEngine.enhanceQuery(originalQuery);

      expect(result.success).toBe(false);
      expect(result.enhancedQuery).toBe(originalQuery); // Should fallback to original
    });

    it('should use enhanced query in intelligent search', async () => {
      const originalQuery = 'AI';
      const enhancedQuery = 'artificial intelligence machine learning';

      mockGeminiService.enhanceQuery = jest.fn().mockResolvedValue(enhancedQuery);
      
      const mockSearchResults = {
        results: [
          { id: '1', title: 'AI Article', content: 'Content about AI', score: 8.5 }
        ],
        total: 1,
        took: 20
      };

      jest.spyOn(searchEngine, 'hybridSearch').mockResolvedValue({
        success: true,
        ...mockSearchResults,
        searchInfo: {
          bm25Results: 1,
          vectorResults: 1,
          combinedResults: 1,
          rrfParameter: 60,
          weights: { bm25: 0.6, vector: 0.4 }
        }
      });

      const query = {
        query: originalQuery,
        size: 10,
        from: 0
      };

      const result = await searchEngine.intelligentSearch(query);

      expect(result.success).toBe(true);
      expect(result.query?.enhanced).toBe(enhancedQuery);
      expect(searchEngine.hybridSearch).toHaveBeenCalledWith(
        expect.objectContaining({
          query: enhancedQuery
        })
      );
    });
  });

  describe('Search Result Ranking', () => {
    it('should apply custom ranking factors', () => {
      const results = [
        {
          id: '1',
          title: 'Old Article',
          content: 'Content 1',
          score: 8.0,
          metadata: { date: '2020-01-01', category: 'Technology' }
        },
        {
          id: '2',
          title: 'Recent Article',
          content: 'Content 2',
          score: 7.5,
          metadata: { date: '2024-01-01', category: 'Technology' }
        },
        {
          id: '3',
          title: 'Popular Article',
          content: 'Content 3',
          score: 7.0,
          metadata: { date: '2023-01-01', category: 'Technology', views: 10000 }
        }
      ];

      const rankedResults = (searchEngine as any).applyCustomRanking(results, {
        recencyBoost: 0.2,
        popularityBoost: 0.1
      });

      expect(rankedResults).toHaveLength(3);
      
      // Recent article should get a boost
      const recentArticle = rankedResults.find(r => r.id === '2');
      expect(recentArticle?.score).toBeGreaterThan(7.5);
    });

    it('should handle missing metadata gracefully', () => {
      const results = [
        {
          id: '1',
          title: 'Article without metadata',
          content: 'Content 1',
          score: 8.0
        }
      ];

      const rankedResults = (searchEngine as any).applyCustomRanking(results, {
        recencyBoost: 0.2
      });

      expect(rankedResults).toHaveLength(1);
      expect(rankedResults[0].score).toBe(8.0); // Should remain unchanged
    });
  });

  describe('Search Performance', () => {
    it('should track search performance metrics', async () => {
      const mockResults = {
        results: [
          { id: '1', title: 'Result 1', content: 'Content 1', score: 8.5 }
        ],
        total: 1,
        took: 150
      };

      jest.spyOn(searchEngine, 'hybridSearch').mockResolvedValue({
        success: true,
        ...mockResults,
        searchInfo: {
          bm25Results: 1,
          vectorResults: 1,
          combinedResults: 1,
          rrfParameter: 60,
          weights: { bm25: 0.6, vector: 0.4 }
        }
      });

      const startTime = Date.now();
      const result = await searchEngine.intelligentSearch({
        query: 'test query',
        size: 10,
        from: 0
      });
      const endTime = Date.now();

      expect(result.success).toBe(true);
      expect(result.took).toBeGreaterThan(0);
      expect(result.took).toBeLessThan(endTime - startTime + 100); // Allow some margin
    });

    it('should handle timeout scenarios', async () => {
      jest.spyOn(searchEngine, 'hybridSearch').mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve({
          success: false,
          error: 'Search timeout',
          results: [],
          total: 0,
          took: 30000
        }), 100))
      );

      const result = await searchEngine.intelligentSearch({
        query: 'test query',
        size: 10,
        from: 0,
        timeout: 50 // Very short timeout
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('timeout');
    });
  });

  describe('Search Filters', () => {
    it('should apply multiple filters correctly', async () => {
      const mockResults = {
        results: [
          {
            id: '1',
            title: 'Filtered Result',
            content: 'Content matching all filters',
            score: 9.0,
            metadata: {
              category: 'Technology',
              author: 'John Doe',
              date: '2024-06-15',
              tags: ['AI', 'ML']
            }
          }
        ],
        total: 1,
        took: 20
      };

      mockElasticsearchClient.search = jest.fn().mockResolvedValue(mockResults);

      const query = {
        query: 'machine learning',
        filters: {
          category: 'Technology',
          author: 'John Doe',
          tags: ['AI', 'ML'],
          dateRange: {
            from: '2024-01-01',
            to: '2024-12-31'
          }
        },
        size: 10,
        from: 0
      };

      const result = await searchEngine.bm25Search(query);

      expect(result.success).toBe(true);
      expect(mockElasticsearchClient.search).toHaveBeenCalledWith(
        expect.objectContaining({
          query: expect.objectContaining({
            bool: expect.objectContaining({
              filter: expect.arrayContaining([
                { term: { 'metadata.category': 'Technology' } },
                { term: { 'metadata.author': 'John Doe' } },
                { terms: { 'metadata.tags': ['AI', 'ML'] } },
                expect.objectContaining({
                  range: expect.objectContaining({
                    'metadata.date': {
                      gte: '2024-01-01',
                      lte: '2024-12-31'
                    }
                  })
                })
              ])
            })
          })
        })
      );
    });

    it('should handle invalid filter values', async () => {
      const query = {
        query: 'test',
        filters: {
          category: '', // Empty filter
          dateRange: {
            from: 'invalid-date',
            to: '2024-12-31'
          }
        },
        size: 10,
        from: 0
      };

      // Should not throw error, but should ignore invalid filters
      const result = await searchEngine.bm25Search(query);
      
      expect(mockElasticsearchClient.search).toHaveBeenCalledWith(
        expect.objectContaining({
          query: expect.objectContaining({
            bool: expect.objectContaining({
              filter: expect.not.arrayContaining([
                { term: { 'metadata.category': '' } }
              ])
            })
          })
        })
      );
    });
  });
});
