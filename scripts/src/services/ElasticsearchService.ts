// Re-export the Elasticsearch service from the backend
// This allows scripts to use the same service implementation

import { Client } from '@elastic/elasticsearch';

export interface DocumentMetadata {
  author?: string;
  date?: string;
  category?: string;
  tags?: string[];
  source?: string;
  language?: string;
  description?: string;
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

  async deleteIndex(): Promise<void> {
    try {
      const exists = await this.client.indices.exists({ index: this.indexName });
      if (exists) {
        await this.client.indices.delete({ index: this.indexName });
        console.log(`✅ Deleted index: ${this.indexName}`);
      }
    } catch (error) {
      console.error('Failed to delete index:', error);
      throw error;
    }
  }

  async getDocumentCount(): Promise<number> {
    try {
      const response = await this.client.count({ index: this.indexName });
      return response.count;
    } catch (error) {
      console.error('Failed to get document count:', error);
      return 0;
    }
  }

  async close(): Promise<void> {
    await this.client.close();
  }
}
