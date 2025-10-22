import { Client } from '@elastic/elasticsearch';

// Elasticsearch client configuration
const client = new Client({
  node: process.env.ELASTICSEARCH_URL || 'http://localhost:9200',
  auth: process.env.ELASTICSEARCH_API_KEY ? {
    apiKey: process.env.ELASTICSEARCH_API_KEY
  } : process.env.ELASTICSEARCH_USERNAME ? {
    username: process.env.ELASTICSEARCH_USERNAME,
    password: process.env.ELASTICSEARCH_PASSWORD || ''
  } : undefined,
  requestTimeout: 30000,
  pingTimeout: 3000,
  maxRetries: 3,
});

// Index names
export const INDICES = {
  DOCUMENTS: 'fractal-documents',
  IMAGES: 'fractal-images',
  ANALYTICS: 'fractal-analytics'
};

// Document interface
export interface SearchDocument {
  id: string;
  title: string;
  content: string;
  url: string;
  images?: string[];
  metadata: {
    author?: string;
    date?: string;
    category?: string;
    source?: string;
    tags?: string[];
    language?: string;
    aiScore?: number;
    relevanceScore?: number;
  };
  timestamp: string;
  embedding?: number[];
}

// Image interface
export interface ImageDocument {
  id: string;
  title: string;
  url: string;
  sourceUrl: string;
  alt: string;
  metadata: {
    category?: string;
    source?: string;
    tags?: string[];
    aiScore?: number;
    relevanceScore?: number;
  };
  timestamp: string;
}

// Analytics interface
export interface AnalyticsDocument {
  id: string;
  query: string;
  results: number;
  responseTime: number;
  timestamp: string;
  userAgent?: string;
  ip?: string;
}

// Global connection status cache
let elasticsearchConnected: boolean | null = null;
let lastConnectionCheck = 0;
const CONNECTION_CHECK_INTERVAL = 30000; // 30 seconds

// Initialize Elasticsearch indices with improved error handling
export async function initializeElasticsearch(): Promise<boolean> {
  // Return cached result if recent check was made
  const now = Date.now();
  if (elasticsearchConnected !== null && (now - lastConnectionCheck) < CONNECTION_CHECK_INTERVAL) {
    return elasticsearchConnected;
  }

  try {
    // Test connection with shorter timeout
    await client.ping();
    
    // Only create indices if connection is successful
    await Promise.all([
      createDocumentsIndex(),
      createImagesIndex(), 
      createAnalyticsIndex()
    ]);

    elasticsearchConnected = true;
    lastConnectionCheck = now;
    console.log('✅ Elasticsearch connection established and indices ready');
    return true;
  } catch (error) {
    elasticsearchConnected = false;
    lastConnectionCheck = now;
    
    // Only log detailed error once per minute to avoid spam
    if (now - lastConnectionCheck > 60000) {
      console.warn('⚠️ Elasticsearch not available, using fallback mode:', error instanceof Error ? error.message : 'Connection failed');
    }
    return false;
  }
}

// Quick connection check without initialization
export async function isElasticsearchConnected(): Promise<boolean> {
  if (elasticsearchConnected !== null && (Date.now() - lastConnectionCheck) < CONNECTION_CHECK_INTERVAL) {
    return elasticsearchConnected;
  }
  
  try {
    await client.ping();
    elasticsearchConnected = true;
    lastConnectionCheck = Date.now();
    return true;
  } catch {
    elasticsearchConnected = false;
    lastConnectionCheck = Date.now();
    return false;
  }
}

// Create documents index with proper mappings
async function createDocumentsIndex() {
  const indexExists = await client.indices.exists({ index: INDICES.DOCUMENTS });
  
  if (!indexExists) {
    await client.indices.create({
      index: INDICES.DOCUMENTS,
      body: {
        mappings: {
          properties: {
            id: { type: 'keyword' },
            title: { 
              type: 'text', 
              analyzer: 'standard',
              fields: {
                keyword: { type: 'keyword' }
              }
            },
            content: { 
              type: 'text', 
              analyzer: 'english' 
            },
            url: { type: 'keyword' },
            images: { type: 'keyword' },
            timestamp: { type: 'date' },
            embedding: { 
              type: 'dense_vector', 
              dims: 768 
            },
            metadata: {
              properties: {
                author: { type: 'keyword' },
                date: { type: 'date' },
                category: { type: 'keyword' },
                source: { type: 'keyword' },
                tags: { type: 'keyword' },
                language: { type: 'keyword' },
                aiScore: { type: 'float' },
                relevanceScore: { type: 'float' }
              }
            }
          }
        },
        settings: {
          number_of_shards: 1,
          number_of_replicas: 0,
          analysis: {
            analyzer: {
              content_analyzer: {
                type: 'custom',
                tokenizer: 'standard',
                filter: ['lowercase', 'stop', 'stemmer']
              }
            }
          }
        }
      }
    });
    console.log(`✅ Created index: ${INDICES.DOCUMENTS}`);
  }
}

// Create images index
async function createImagesIndex() {
  const indexExists = await client.indices.exists({ index: INDICES.IMAGES });
  
  if (!indexExists) {
    await client.indices.create({
      index: INDICES.IMAGES,
      body: {
        mappings: {
          properties: {
            id: { type: 'keyword' },
            title: { 
              type: 'text', 
              analyzer: 'standard' 
            },
            url: { type: 'keyword' },
            sourceUrl: { type: 'keyword' },
            alt: { 
              type: 'text', 
              analyzer: 'standard' 
            },
            timestamp: { type: 'date' },
            metadata: {
              properties: {
                category: { type: 'keyword' },
                source: { type: 'keyword' },
                tags: { type: 'keyword' },
                aiScore: { type: 'float' },
                relevanceScore: { type: 'float' }
              }
            }
          }
        }
      }
    });
    console.log(`✅ Created index: ${INDICES.IMAGES}`);
  }
}

// Create analytics index
async function createAnalyticsIndex() {
  const indexExists = await client.indices.exists({ index: INDICES.ANALYTICS });
  
  if (!indexExists) {
    await client.indices.create({
      index: INDICES.ANALYTICS,
      body: {
        mappings: {
          properties: {
            id: { type: 'keyword' },
            query: { 
              type: 'text', 
              analyzer: 'keyword' 
            },
            results: { type: 'integer' },
            responseTime: { type: 'integer' },
            timestamp: { type: 'date' },
            userAgent: { type: 'text' },
            ip: { type: 'ip' }
          }
        }
      }
    });
    console.log(`✅ Created index: ${INDICES.ANALYTICS}`);
  }
}

// Index a document
export async function indexDocument(document: SearchDocument): Promise<boolean> {
  try {
    await client.index({
      index: INDICES.DOCUMENTS,
      id: document.id,
      body: document,
      refresh: 'wait_for'
    });
    console.log(`✅ Indexed document: ${document.id}`);
    return true;
  } catch (error) {
    console.error(`❌ Failed to index document ${document.id}:`, error);
    return false;
  }
}

// Index multiple documents in bulk
export async function bulkIndexDocuments(documents: SearchDocument[]): Promise<number> {
  try {
    const body = documents.flatMap(doc => [
      { index: { _index: INDICES.DOCUMENTS, _id: doc.id } },
      doc
    ]);

    const response = await client.bulk({
      body,
      refresh: 'wait_for'
    });

    const successful = response.items.filter((item: any) => !item.index.error).length;
    console.log(`✅ Bulk indexed ${successful}/${documents.length} documents`);
    return successful;
  } catch (error) {
    console.error('❌ Bulk indexing failed:', error);
    return 0;
  }
}

// Index an image
export async function indexImage(image: ImageDocument): Promise<boolean> {
  try {
    await client.index({
      index: INDICES.IMAGES,
      id: image.id,
      body: image,
      refresh: 'wait_for'
    });
    console.log(`✅ Indexed image: ${image.id}`);
    return true;
  } catch (error) {
    console.error(`❌ Failed to index image ${image.id}:`, error);
    return false;
  }
}

// Search documents with hybrid approach
export async function searchDocuments(
  query: string, 
  options: {
    size?: number;
    from?: number;
    filters?: any;
    includeImages?: boolean;
  } = {}
): Promise<{
  documents: any[];
  images: any[];
  total: number;
  took: number;
}> {
  try {
    const { size = 10, from = 0, filters = {}, includeImages = true } = options;

    // Build query
    const searchQuery: any = {
      bool: {
        must: [
          {
            multi_match: {
              query,
              fields: ['title^2', 'content', 'metadata.tags'],
              type: 'best_fields',
              fuzziness: 'AUTO'
            }
          }
        ]
      }
    };

    // Add filters
    if (filters.category) {
      searchQuery.bool.filter = [
        { term: { 'metadata.category': filters.category } }
      ];
    }

    console.log('🔍 Elasticsearch search query:', JSON.stringify(searchQuery, null, 2));
    
    // Search documents
    const docResponse = await client.search({
      index: INDICES.DOCUMENTS,
      body: {
        query: searchQuery,
        size,
        from,
        sort: [
          { 'metadata.aiScore': { order: 'desc' } },
          { _score: { order: 'desc' } }
        ],
        highlight: {
          fields: {
            title: {},
            content: { fragment_size: 150, number_of_fragments: 3 }
          }
        }
      }
    });
    
    console.log(`📊 Elasticsearch returned ${docResponse.body.hits.total.value} documents`);

    // Search images if requested
    let imageResponse: any = { body: { hits: { hits: [] } } };
    if (includeImages) {
      imageResponse = await client.search({
        index: INDICES.IMAGES,
        body: {
          query: {
            multi_match: {
              query,
              fields: ['title', 'alt', 'metadata.tags'],
              fuzziness: 'AUTO'
            }
          },
          size: 10,
          sort: [
            { 'metadata.aiScore': { order: 'desc' } }
          ]
        }
      });
    }

    // Format results
    const documents = docResponse.body.hits.hits.map((hit: any) => ({
      ...hit._source,
      score: hit._score,
      highlights: hit.highlight
    }));

    const images = imageResponse.body.hits.hits.map((hit: any) => ({
      ...hit._source,
      score: hit._score
    }));

    return {
      documents,
      images,
      total: docResponse.body.hits.total.value,
      took: docResponse.body.took
    };

  } catch (error) {
    console.error('❌ Search failed:', error);
    return {
      documents: [],
      images: [],
      total: 0,
      took: 0
    };
  }
}

// Get index statistics
export async function getIndexStats(): Promise<{
  documents: number;
  images: number;
  analytics: number;
  indexSize: string;
}> {
  try {
    const [docStats, imgStats, analyticsStats] = await Promise.all([
      client.count({ index: INDICES.DOCUMENTS }),
      client.count({ index: INDICES.IMAGES }),
      client.count({ index: INDICES.ANALYTICS })
    ]);

    const indexInfo = await client.indices.stats({ index: Object.values(INDICES) });
    const totalSize = indexInfo.body._all.total.store.size_in_bytes;
    const sizeInMB = (totalSize / (1024 * 1024)).toFixed(2);

    return {
      documents: docStats.body.count,
      images: imgStats.body.count,
      analytics: analyticsStats.body.count,
      indexSize: `${sizeInMB} MB`
    };
  } catch (error) {
    console.error('❌ Failed to get index stats:', error);
    return {
      documents: 0,
      images: 0,
      analytics: 0,
      indexSize: '0 MB'
    };
  }
}

// Log search analytics
export async function logSearchAnalytics(
  query: string,
  results: number,
  responseTime: number,
  userAgent?: string,
  ip?: string
): Promise<void> {
  try {
    const analytics: AnalyticsDocument = {
      id: `analytics_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      query,
      results,
      responseTime,
      timestamp: new Date().toISOString(),
      userAgent,
      ip
    };

    await client.index({
      index: INDICES.ANALYTICS,
      id: analytics.id,
      body: analytics
    });
  } catch (error) {
    console.error('❌ Failed to log analytics:', error);
  }
}

// Delete all data (for testing)
export async function clearAllData(): Promise<boolean> {
  try {
    await Promise.all([
      client.deleteByQuery({
        index: INDICES.DOCUMENTS,
        body: { query: { match_all: {} } }
      }),
      client.deleteByQuery({
        index: INDICES.IMAGES,
        body: { query: { match_all: {} } }
      }),
      client.deleteByQuery({
        index: INDICES.ANALYTICS,
        body: { query: { match_all: {} } }
      })
    ]);
    
    console.log('✅ All data cleared from Elasticsearch');
    return true;
  } catch (error) {
    console.error('❌ Failed to clear data:', error);
    return false;
  }
}

export default client;
