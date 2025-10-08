import { Client } from '@elastic/elasticsearch';

export interface SearchDocument {
  id: string;
  title: string;
  content: string;
  url?: string;
  metadata?: {
    author?: string;
    date?: string;
    category?: string;
    tags?: string[];
  };
  embedding?: number[];
}

export interface SearchQuery {
  query: string;
  filters?: {
    category?: string;
    dateRange?: {
      from: string;
      to: string;
    };
    tags?: string[];
  };
  size?: number;
  from?: number;
}

export interface SearchResult {
  id: string;
  title: string;
  content: string;
  url?: string;
  score: number;
  highlights?: string[];
  metadata?: {
    author?: string;
    date?: string;
    category?: string;
    tags?: string[];
  };
}

export class ElasticsearchService {
  private client: Client;
  private readonly indexName = 'ai-search-documents';

  constructor() {
    const config: any = {
      node: process.env.ELASTICSEARCH_URL || 'http://localhost:9200',
    };
    
    // API Key authentication (preferred for Elastic Cloud)
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
    
    this.client = new Client(config);
  }

  async initialize(): Promise<void> {
    try {
      // Check if Elasticsearch is available
      await this.client.ping();
      
      // Create index if it doesn't exist
      const indexExists = await this.client.indices.exists({
        index: this.indexName,
      });

      if (!indexExists) {
        await this.createIndex();
      }
    } catch (error) {
      console.error('Failed to initialize Elasticsearch:', error);
      throw error;
    }
  }

  private async createIndex(): Promise<void> {
    const indexConfig = {
      index: this.indexName,
      body: {
        settings: {
          number_of_shards: 1,
          number_of_replicas: 0,
          analysis: {
            analyzer: {
              content_analyzer: {
                type: 'custom',
                tokenizer: 'standard',
                filter: ['lowercase', 'stop', 'snowball'],
              },
            },
          },
        },
        mappings: {
          properties: {
            title: {
              type: 'text',
              analyzer: 'content_analyzer',
              fields: {
                keyword: {
                  type: 'keyword',
                },
              },
            },
            content: {
              type: 'text',
              analyzer: 'content_analyzer',
            },
            url: {
              type: 'keyword',
            },
            'metadata.author': {
              type: 'keyword',
            },
            'metadata.date': {
              type: 'date',
            },
            'metadata.category': {
              type: 'keyword',
            },
            'metadata.tags': {
              type: 'keyword',
            },
            embedding: {
              type: 'dense_vector',
              dims: 768, // Gemini embedding dimension
            },
          },
        },
      },
    };

    await this.client.indices.create(indexConfig);
    console.log(`✅ Created Elasticsearch index: ${this.indexName}`);
  }

  async indexDocument(document: SearchDocument): Promise<void> {
    try {
      await this.client.index({
        index: this.indexName,
        id: document.id,
        body: document,
      });
    } catch (error) {
      console.error('Failed to index document:', error);
      throw error;
    }
  }

  async indexDocuments(documents: SearchDocument[]): Promise<void> {
    try {
      const body = documents.flatMap(doc => [
        { index: { _index: this.indexName, _id: doc.id } },
        doc,
      ]);

      const response = await this.client.bulk({ body });
      
      if (response.errors) {
        console.error('Bulk indexing errors:', response.items);
        throw new Error('Some documents failed to index');
      }
      
      console.log(`✅ Indexed ${documents.length} documents`);
    } catch (error) {
      console.error('Failed to bulk index documents:', error);
      throw error;
    }
  }

  async search(searchQuery: SearchQuery): Promise<{ results: SearchResult[]; total: number; took: number }> {
    try {
      const query: any = {
        bool: {
          must: [
            {
              multi_match: {
                query: searchQuery.query,
                fields: ['title^2', 'content'],
                type: 'best_fields',
                fuzziness: 'AUTO',
              },
            },
          ],
          filter: [],
        },
      };

      // Add filters
      if (searchQuery.filters) {
        if (searchQuery.filters.category) {
          query.bool.filter.push({
            term: { 'metadata.category': searchQuery.filters.category },
          });
        }

        if (searchQuery.filters.tags && searchQuery.filters.tags.length > 0) {
          query.bool.filter.push({
            terms: { 'metadata.tags': searchQuery.filters.tags },
          });
        }

        if (searchQuery.filters.dateRange) {
          query.bool.filter.push({
            range: {
              'metadata.date': {
                gte: searchQuery.filters.dateRange.from,
                lte: searchQuery.filters.dateRange.to,
              },
            },
          });
        }
      }

      const response = await this.client.search({
        index: this.indexName,
        body: {
          query,
          size: searchQuery.size || 10,
          from: searchQuery.from || 0,
          highlight: {
            fields: {
              title: {},
              content: {
                fragment_size: 150,
                number_of_fragments: 3,
              },
            },
          },
          _source: ['title', 'content', 'url', 'metadata'],
        },
      });

      const results: SearchResult[] = response.hits.hits.map((hit: any) => ({
        id: hit._id,
        title: hit._source.title,
        content: hit._source.content,
        url: hit._source.url,
        score: hit._score / (response.hits.max_score || 1),
        highlights: hit.highlight ? [
          ...(hit.highlight.title || []),
          ...(hit.highlight.content || []),
        ] : [],
        metadata: hit._source.metadata,
      }));

      return {
        results,
        total: typeof response.hits.total === 'number' ? response.hits.total : response.hits.total?.value || 0,
        took: response.took || 0,
      };
    } catch (error) {
      console.error('Search failed:', error);
      throw error;
    }
  }

  async semanticSearch(embedding: number[], searchQuery: SearchQuery): Promise<{ results: SearchResult[]; total: number; took: number }> {
    try {
      const query: any = {
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

      // Add text search boost
      if (searchQuery.query) {
        query.bool.should = [
          {
            multi_match: {
              query: searchQuery.query,
              fields: ['title^2', 'content'],
              type: 'best_fields',
              fuzziness: 'AUTO',
            },
          },
        ];
        query.bool.minimum_should_match = 0;
      }

      // Add filters (same as regular search)
      if (searchQuery.filters) {
        if (searchQuery.filters.category) {
          query.bool.filter.push({
            term: { 'metadata.category': searchQuery.filters.category },
          });
        }

        if (searchQuery.filters.tags && searchQuery.filters.tags.length > 0) {
          query.bool.filter.push({
            terms: { 'metadata.tags': searchQuery.filters.tags },
          });
        }

        if (searchQuery.filters.dateRange) {
          query.bool.filter.push({
            range: {
              'metadata.date': {
                gte: searchQuery.filters.dateRange.from,
                lte: searchQuery.filters.dateRange.to,
              },
            },
          });
        }
      }

      const response = await this.client.search({
        index: this.indexName,
        body: {
          query,
          size: searchQuery.size || 10,
          from: searchQuery.from || 0,
          highlight: {
            fields: {
              title: {},
              content: {
                fragment_size: 150,
                number_of_fragments: 3,
              },
            },
          },
          _source: ['title', 'content', 'url', 'metadata'],
        },
      });

      const maxScore = response.hits.max_score || 1;
      const results: SearchResult[] = response.hits.hits.map((hit: any) => ({
        id: hit._id,
        title: hit._source.title,
        content: hit._source.content,
        url: hit._source.url,
        score: Math.max(0, (hit._score - 1) / maxScore), // Normalize semantic similarity score
        highlights: hit.highlight ? [
          ...(hit.highlight.title || []),
          ...(hit.highlight.content || []),
        ] : [],
        metadata: hit._source.metadata,
      }));

      return {
        results,
        total: typeof response.hits.total === 'number' ? response.hits.total : response.hits.total?.value || 0,
        took: response.took || 0,
      };
    } catch (error) {
      console.error('Semantic search failed:', error);
      throw error;
    }
  }

  async close(): Promise<void> {
    await this.client.close();
  }
}
