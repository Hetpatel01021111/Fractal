import { Client } from '@elastic/elasticsearch';
import { 
  optimizedIndexSettings, 
  productionIndexSettings, 
  developmentIndexSettings,
  indexTemplate,
  searchTemplates 
} from './config/elasticsearch-optimized';

// Types for document structure
export interface DocumentMetadata {
  author?: string;
  date?: string;
  category?: string;
  tags?: string[];
  source?: string;
  language?: string;
  [key: string]: any;
}

export interface SearchDocument {
  id: string;
  title: string;
  content: string;
  url?: string;
  metadata?: DocumentMetadata;
  embedding?: number[];
  timestamp?: string;
}

export interface SearchOptions {
  size?: number;
  from?: number;
  filters?: {
    category?: string;
    tags?: string[];
    dateRange?: {
      from: string;
      to: string;
    };
    author?: string;
  };
  highlight?: boolean;
  sort?: 'relevance' | 'date' | 'title';
}

export interface SearchResult {
  id: string;
  title: string;
  content: string;
  url?: string;
  score: number;
  highlights?: string[];
  metadata?: DocumentMetadata;
}

export interface SearchResponse {
  results: SearchResult[];
  total: number;
  took: number;
  maxScore?: number;
}

export class ElasticsearchClient {
  private client: Client;
  private readonly indexName: string = 'ai-search-documents';

  constructor() {
    const config: any = {
      node: process.env.ELASTICSEARCH_URL || 'http://localhost:9200',
      requestTimeout: 30000,
      pingTimeout: 3000,
      maxRetries: 3,
    };

    if (process.env.ELASTICSEARCH_API_KEY) {
      config.auth = {
        apiKey: process.env.ELASTICSEARCH_API_KEY,
      };
    }
    // Fallback to username/password authentication
    else if (process.env.ELASTICSEARCH_USERNAME && process.env.ELASTICSEARCH_PASSWORD) {
      config.auth = {
        username: process.env.ELASTICSEARCH_USERNAME,
        password: process.env.ELASTICSEARCH_PASSWORD,
      };
    }

    // SSL configuration for production
    if (process.env.NODE_ENV === 'production') {
      config.ssl = {
        rejectUnauthorized: true,
      };
    }

    this.client = new Client(config);
  }

  /**
   * Initialize connection and create index if it doesn't exist
   */
  async initialize(): Promise<void> {
    try {
      // Test connection
      await this.client.ping();
      console.log('✅ Elasticsearch connection established');

      // Create index if it doesn't exist
      const indexExists = await this.client.indices.exists({
        index: this.indexName,
      });

      if (!indexExists) {
        await this.createIndex();
      } else {
        console.log(`✅ Index '${this.indexName}' already exists`);
      }
    } catch (error) {
      console.error('❌ Failed to initialize Elasticsearch:', error);
      throw error;
    }
  /**
   * Create index with proper mappings for text, metadata, and vector fields
   */
  async createIndex(): Promise<void> {
            },
            timestamp: {
              type: 'date',
              format: 'strict_date_optional_time||epoch_millis',
            },
            
            // Metadata fields
            'metadata.author': {
              type: 'keyword',
            },
            'metadata.date': {
              type: 'date',
              format: 'strict_date_optional_time||yyyy-MM-dd||epoch_millis',
            },
            'metadata.category': {
              type: 'keyword',
            },
            'metadata.tags': {
              type: 'keyword',
            },
            'metadata.source': {
              type: 'keyword',
            },
            'metadata.language': {
              type: 'keyword',
            },
            
            // Dense vector field for semantic search (Gemini embeddings)
            embedding: {
              type: 'dense_vector',
              dims: 768, // Gemini embedding dimension
              index: true,
              similarity: 'cosine',
            },
          },
        },
      },
    };

    try {
      await this.client.indices.create(indexConfig);
      console.log(`✅ Created Elasticsearch index: ${this.indexName}`);
    } catch (error) {
      console.error('❌ Failed to create index:', error);
      throw error;
    }
  }

  /**
   * Index a single document
   */
  async indexDocument(document: SearchDocument): Promise<void> {
    try {
      const docToIndex = {
        ...document,
        timestamp: document.timestamp || new Date().toISOString(),
      };

      await this.client.index({
        index: this.indexName,
        id: document.id,
        body: docToIndex,
        refresh: 'wait_for', // Ensure document is searchable immediately
      });

      console.log(`✅ Indexed document: ${document.id}`);
    } catch (error) {
      console.error(`❌ Failed to index document ${document.id}:`, error);
      throw error;
    }
  }

  /**
   * Index multiple documents in bulk
   */
  async indexDocuments(documents: SearchDocument[]): Promise<void> {
    if (documents.length === 0) return;

    try {
      const body = documents.flatMap(doc => [
        { index: { _index: this.indexName, _id: doc.id } },
        {
          ...doc,
          timestamp: doc.timestamp || new Date().toISOString(),
        },
      ]);

      const response = await this.client.bulk({
        body,
        refresh: 'wait_for',
      });

      if (response.errors) {
        const errors = response.items?.filter(item => item.index?.error);
        console.error('❌ Bulk indexing errors:', errors);
        throw new Error(`Failed to index ${errors?.length || 0} documents`);
      }

      console.log(`✅ Bulk indexed ${documents.length} documents`);
    } catch (error) {
      console.error('❌ Failed to bulk index documents:', error);
      throw error;
    }
  }

  /**
   * BM25 text search using Elasticsearch's built-in scoring
   */
  async searchDocuments(query: string, options: SearchOptions = {}): Promise<SearchResponse> {
    const {
      size = 10,
      from = 0,
      filters = {},
      highlight = true,
      sort = 'relevance',
    } = options;

    try {
      const searchQuery: any = {
        bool: {
          must: [],
          filter: [],
        },
      };

      // Main text search using BM25
      if (query && query.trim()) {
        searchQuery.bool.must.push({
          multi_match: {
            query: query.trim(),
            fields: [
              'title^3',      // Boost title matches
              'content^1',    // Standard content matches
              'metadata.tags^2', // Boost tag matches
            ],
            type: 'best_fields',
            fuzziness: 'AUTO',
            operator: 'or',
            minimum_should_match: '75%',
          },
        });
      } else {
        // If no query, match all documents
        searchQuery.bool.must.push({ match_all: {} });
      }

      // Apply filters
      if (filters.category) {
        searchQuery.bool.filter.push({
          term: { 'metadata.category': filters.category },
        });
      }

      if (filters.tags && filters.tags.length > 0) {
        searchQuery.bool.filter.push({
          terms: { 'metadata.tags': filters.tags },
        });
      }

      if (filters.author) {
        searchQuery.bool.filter.push({
          term: { 'metadata.author': filters.author },
        });
      }

      if (filters.dateRange) {
        searchQuery.bool.filter.push({
          range: {
            'metadata.date': {
              gte: filters.dateRange.from,
              lte: filters.dateRange.to,
            },
          },
        });
      }

      // Sorting
      let sortConfig: any[] = [];
      switch (sort) {
        case 'date':
          sortConfig = [{ 'metadata.date': { order: 'desc' } }, '_score'];
          break;
        case 'title':
          sortConfig = [{ 'title.keyword': { order: 'asc' } }, '_score'];
          break;
        default: // relevance
          sortConfig = ['_score'];
      }

      const searchParams: any = {
        index: this.indexName,
        body: {
          query: searchQuery,
          size,
          from,
          sort: sortConfig,
          _source: ['title', 'content', 'url', 'metadata', 'timestamp'],
        },
      };

      // Add highlighting
      if (highlight) {
        searchParams.body.highlight = {
          fields: {
            title: {
              fragment_size: 150,
              number_of_fragments: 1,
              pre_tags: ['<em>'],
              post_tags: ['</em>'],
            },
            content: {
              fragment_size: 150,
              number_of_fragments: 3,
              pre_tags: ['<em>'],
              post_tags: ['</em>'],
            },
          },
        };
      }

      const response = await this.client.search(searchParams);

      return this.formatSearchResponse(response);
    } catch (error) {
      console.error('❌ BM25 search failed:', error);
      throw error;
    }
  }

  /**
   * Vector search using dense_vector field for semantic search
   */
  async vectorSearchDocuments(
    embedding: number[],
    query?: string,
    options: SearchOptions = {}
  ): Promise<SearchResponse> {
    const { size = 10, from = 0, filters = {} } = options;

    try {
      const searchQuery: any = {
        bool: {
          must: [
            {
              script_score: {
                query: { match_all: {} },
                script: {
                  source: "cosineSimilarity(params.query_vector, 'embedding') + 1.0",
                  params: { query_vector: embedding },
                },
              },
            },
          ],
          filter: [],
        },
      };

      // Optionally boost with text search
      if (query && query.trim()) {
        searchQuery.bool.should = [
          {
            multi_match: {
              query: query.trim(),
              fields: ['title^2', 'content'],
              type: 'best_fields',
              fuzziness: 'AUTO',
            },
          },
        ];
        searchQuery.bool.minimum_should_match = 0;
      }

      // Apply same filters as text search
      if (filters.category) {
        searchQuery.bool.filter.push({
          term: { 'metadata.category': filters.category },
        });
      }

      if (filters.tags && filters.tags.length > 0) {
        searchQuery.bool.filter.push({
          terms: { 'metadata.tags': filters.tags },
        });
      }

      if (filters.author) {
        searchQuery.bool.filter.push({
          term: { 'metadata.author': filters.author },
        });
      }

      if (filters.dateRange) {
        searchQuery.bool.filter.push({
          range: {
            'metadata.date': {
              gte: filters.dateRange.from,
              lte: filters.dateRange.to,
            },
          },
        });
      }

      const response = await this.client.search({
        index: this.indexName,
        body: {
          query: searchQuery,
          size,
          from,
          _source: ['title', 'content', 'url', 'metadata', 'timestamp'],
          highlight: {
            fields: {
              title: {},
              content: {
                fragment_size: 150,
                number_of_fragments: 3,
              },
            },
          },
        },
      });

      return this.formatSearchResponse(response, true);
    } catch (error) {
      console.error('❌ Vector search failed:', error);
      throw error;
    }
  }

  /**
   * Hybrid search combining BM25 and vector search
   */
  async hybridSearch(
    query: string,
    embedding: number[],
    options: SearchOptions = {}
  ): Promise<SearchResponse> {
    const { size = 10 } = options;

    try {
      // Get results from both search methods
      const [bm25Results, vectorResults] = await Promise.all([
        this.searchDocuments(query, { ...options, size: size * 2 }),
        this.vectorSearchDocuments(embedding, query, { ...options, size: size * 2 }),
      ]);

      // Combine and re-rank results using Reciprocal Rank Fusion (RRF)
      const combinedResults = this.combineSearchResults(
        bm25Results.results,
        vectorResults.results,
        size
      );

      return {
        results: combinedResults,
        total: Math.max(bm25Results.total, vectorResults.total),
        took: bm25Results.took + vectorResults.took,
        maxScore: Math.max(bm25Results.maxScore || 0, vectorResults.maxScore || 0),
      };
    } catch (error) {
      console.error('❌ Hybrid search failed:', error);
      throw error;
    }
  }

  /**
   * Get document by ID
   */
  async getDocument(id: string): Promise<SearchDocument | null> {
    try {
      const response = await this.client.get({
        index: this.indexName,
        id,
      });

      return response._source as SearchDocument;
    } catch (error: any) {
      if (error.statusCode === 404) {
        return null;
      }
      console.error(`❌ Failed to get document ${id}:`, error);
      throw error;
    }
  }

  /**
   * Update document
   */
  async updateDocument(id: string, updates: Partial<SearchDocument>): Promise<void> {
    try {
      await this.client.update({
        index: this.indexName,
        id,
        body: {
          doc: {
            ...updates,
            timestamp: new Date().toISOString(),
          },
        },
        refresh: 'wait_for',
      });

      console.log(`✅ Updated document: ${id}`);
    } catch (error) {
      console.error(`❌ Failed to update document ${id}:`, error);
      throw error;
    }
  }

  /**
   * Delete document
   */
  async deleteDocument(id: string): Promise<void> {
    try {
      await this.client.delete({
        index: this.indexName,
        id,
        refresh: 'wait_for',
      });

      console.log(`✅ Deleted document: ${id}`);
    } catch (error: any) {
      if (error.statusCode !== 404) {
        console.error(`❌ Failed to delete document ${id}:`, error);
        throw error;
      }
    }
  }

  /**
   * Get index statistics
   */
  async getIndexStats(): Promise<any> {
    try {
      const response = await this.client.indices.stats({
        index: this.indexName,
      });
      return response;
    } catch (error) {
      console.error('❌ Failed to get index stats:', error);
      throw error;
    }
  }

  /**
   * Close the client connection
   */
  async close(): Promise<void> {
    await this.client.close();
  }

  /**
   * Format Elasticsearch response to our SearchResponse interface
   */
  private formatSearchResponse(response: any, isVectorSearch = false): SearchResponse {
    const hits = response.hits?.hits || [];
    const maxScore = response.hits?.max_score || 0;

    const results: SearchResult[] = hits.map((hit: any) => {
      let normalizedScore = hit._score || 0;
      
      // Normalize vector search scores (they start from 1.0)
      if (isVectorSearch && normalizedScore > 1) {
        normalizedScore = Math.max(0, (normalizedScore - 1) / maxScore);
      } else if (!isVectorSearch && maxScore > 0) {
        normalizedScore = normalizedScore / maxScore;
      }

      return {
        id: hit._id,
        title: hit._source?.title || '',
        content: hit._source?.content || '',
        url: hit._source?.url,
        score: normalizedScore,
        highlights: hit.highlight ? [
          ...(hit.highlight.title || []),
          ...(hit.highlight.content || []),
        ] : [],
        metadata: hit._source?.metadata,
      };
    });

    return {
      results,
      total: typeof response.hits?.total === 'number' 
        ? response.hits.total 
        : response.hits?.total?.value || 0,
      took: response.took || 0,
      maxScore,
    };
  }

  /**
   * Combine BM25 and vector search results using Reciprocal Rank Fusion
   */
  private combineSearchResults(
    bm25Results: SearchResult[],
    vectorResults: SearchResult[],
    finalSize: number
  ): SearchResult[] {
    const k = 60; // RRF parameter
    const scoreMap = new Map<string, { result: SearchResult; score: number }>();

    // Add BM25 scores
    bm25Results.forEach((result, index) => {
      const rrfScore = 1 / (k + index + 1);
      scoreMap.set(result.id, {
        result: { ...result, highlights: result.highlights || [] },
        score: rrfScore,
      });
    });

    // Add vector scores
    vectorResults.forEach((result, index) => {
      const rrfScore = 1 / (k + index + 1);
      const existing = scoreMap.get(result.id);
      
      if (existing) {
        // Combine scores and highlights
        existing.score += rrfScore;
        existing.result.highlights = [
          ...(existing.result.highlights || []),
          ...(result.highlights || []),
        ].filter((highlight, idx, arr) => arr.indexOf(highlight) === idx); // Remove duplicates
      } else {
        scoreMap.set(result.id, {
          result: { ...result, highlights: result.highlights || [] },
          score: rrfScore,
        });
      }
    });

    // Sort by combined score and return top results
    return Array.from(scoreMap.values())
      .sort((a, b) => b.score - a.score)
      .slice(0, finalSize)
      .map(item => ({
        ...item.result,
        score: item.score, // Use combined RRF score
      }));
  }
}
