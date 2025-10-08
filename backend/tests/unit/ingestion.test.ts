import { DataIngestionService } from '../../scripts/src/ingestData';
import { ElasticsearchClient } from '../../src/elasticsearchClient';
import { GeminiService } from '../../src/services/gemini';

// Mock dependencies
jest.mock('../../src/elasticsearchClient');
jest.mock('../../src/services/gemini');
jest.mock('fs');
jest.mock('axios');

describe('Data Ingestion Service', () => {
  let ingestionService: DataIngestionService;
  let mockElasticsearchClient: jest.Mocked<ElasticsearchClient>;
  let mockGeminiService: jest.Mocked<GeminiService>;

  beforeEach(() => {
    mockElasticsearchClient = new ElasticsearchClient() as jest.Mocked<ElasticsearchClient>;
    mockGeminiService = new GeminiService() as jest.Mocked<GeminiService>;
    
    // Mock successful initialization
    mockElasticsearchClient.initialize = jest.fn().mockResolvedValue(undefined);
    mockGeminiService.initialize = jest.fn().mockResolvedValue(undefined);
    
    ingestionService = new DataIngestionService(mockElasticsearchClient, mockGeminiService);
  });

  describe('Initialization', () => {
    it('should initialize successfully with valid clients', async () => {
      await expect(ingestionService.initialize()).resolves.not.toThrow();
      expect(mockElasticsearchClient.initialize).toHaveBeenCalled();
      expect(mockGeminiService.initialize).toHaveBeenCalled();
    });

    it('should handle initialization errors gracefully', async () => {
      mockElasticsearchClient.initialize = jest.fn().mockRejectedValue(new Error('Connection failed'));
      
      await expect(ingestionService.initialize()).rejects.toThrow('Connection failed');
    });
  });

  describe('URL Processing', () => {
    beforeEach(async () => {
      await ingestionService.initialize();
    });

    it('should process a valid URL successfully', async () => {
      const mockWebPage = {
        title: 'Test Article',
        content: 'This is test content about artificial intelligence.',
        url: 'https://example.com/test',
        metadata: {
          author: 'Test Author',
          date: '2024-01-01',
          category: 'Technology'
        }
      };

      const mockEmbedding = [0.1, 0.2, 0.3];
      
      // Mock web scraping
      jest.spyOn(ingestionService as any, 'scrapeWebPage')
        .mockResolvedValue(mockWebPage);
      
      // Mock embedding generation
      mockGeminiService.generateEmbedding = jest.fn().mockResolvedValue(mockEmbedding);
      
      // Mock document indexing
      mockElasticsearchClient.indexDocument = jest.fn().mockResolvedValue({ success: true });

      const result = await ingestionService.processUrl('https://example.com/test');

      expect(result.success).toBe(true);
      expect(result.documentsProcessed).toBe(1);
      expect(mockGeminiService.generateEmbedding).toHaveBeenCalledWith(mockWebPage.content);
      expect(mockElasticsearchClient.indexDocument).toHaveBeenCalled();
    });

    it('should handle invalid URLs', async () => {
      const result = await ingestionService.processUrl('invalid-url');
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid URL');
    });

    it('should handle web scraping failures', async () => {
      jest.spyOn(ingestionService as any, 'scrapeWebPage')
        .mockRejectedValue(new Error('Failed to fetch'));

      const result = await ingestionService.processUrl('https://example.com/test');
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Failed to fetch');
    });

    it('should continue processing when embedding generation fails', async () => {
      const mockWebPage = {
        title: 'Test Article',
        content: 'Test content',
        url: 'https://example.com/test',
        metadata: {}
      };

      jest.spyOn(ingestionService as any, 'scrapeWebPage')
        .mockResolvedValue(mockWebPage);
      
      // Mock embedding generation failure
      mockGeminiService.generateEmbedding = jest.fn()
        .mockRejectedValue(new Error('Quota exceeded'));
      
      mockElasticsearchClient.indexDocument = jest.fn().mockResolvedValue({ success: true });

      const result = await ingestionService.processUrl('https://example.com/test');

      expect(result.success).toBe(true);
      expect(result.documentsProcessed).toBe(1);
      expect(mockElasticsearchClient.indexDocument).toHaveBeenCalledWith(
        expect.objectContaining({
          title: mockWebPage.title,
          content: mockWebPage.content,
          embedding: undefined // Should be undefined when generation fails
        })
      );
    });
  });

  describe('JSON Processing', () => {
    beforeEach(async () => {
      await ingestionService.initialize();
    });

    it('should process valid JSON data', async () => {
      const mockJsonData = [
        {
          title: 'Document 1',
          content: 'Content 1',
          metadata: { category: 'Tech' }
        },
        {
          title: 'Document 2',
          content: 'Content 2',
          metadata: { category: 'Science' }
        }
      ];

      const fs = require('fs');
      fs.readFileSync = jest.fn().mockReturnValue(JSON.stringify(mockJsonData));
      fs.existsSync = jest.fn().mockReturnValue(true);

      mockGeminiService.generateEmbedding = jest.fn().mockResolvedValue([0.1, 0.2, 0.3]);
      mockElasticsearchClient.indexDocument = jest.fn().mockResolvedValue({ success: true });

      const result = await ingestionService.processJsonFile('/path/to/test.json');

      expect(result.success).toBe(true);
      expect(result.documentsProcessed).toBe(2);
      expect(mockElasticsearchClient.indexDocument).toHaveBeenCalledTimes(2);
    });

    it('should handle invalid JSON format', async () => {
      const fs = require('fs');
      fs.readFileSync = jest.fn().mockReturnValue('invalid json');
      fs.existsSync = jest.fn().mockReturnValue(true);

      const result = await ingestionService.processJsonFile('/path/to/invalid.json');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid JSON');
    });

    it('should handle missing files', async () => {
      const fs = require('fs');
      fs.existsSync = jest.fn().mockReturnValue(false);

      const result = await ingestionService.processJsonFile('/path/to/missing.json');

      expect(result.success).toBe(false);
      expect(result.error).toContain('File not found');
    });
  });

  describe('RSS Processing', () => {
    beforeEach(async () => {
      await ingestionService.initialize();
    });

    it('should process RSS feed successfully', async () => {
      const mockRssData = `
        <?xml version="1.0" encoding="UTF-8"?>
        <rss version="2.0">
          <channel>
            <title>Test Feed</title>
            <item>
              <title>Article 1</title>
              <description>Description 1</description>
              <link>https://example.com/article1</link>
              <pubDate>Mon, 01 Jan 2024 00:00:00 GMT</pubDate>
            </item>
            <item>
              <title>Article 2</title>
              <description>Description 2</description>
              <link>https://example.com/article2</link>
              <pubDate>Tue, 02 Jan 2024 00:00:00 GMT</pubDate>
            </item>
          </channel>
        </rss>
      `;

      const axios = require('axios');
      axios.get = jest.fn().mockResolvedValue({ data: mockRssData });

      mockGeminiService.generateEmbedding = jest.fn().mockResolvedValue([0.1, 0.2, 0.3]);
      mockElasticsearchClient.indexDocument = jest.fn().mockResolvedValue({ success: true });

      const result = await ingestionService.processRssFeed('https://example.com/rss');

      expect(result.success).toBe(true);
      expect(result.documentsProcessed).toBe(2);
      expect(mockElasticsearchClient.indexDocument).toHaveBeenCalledTimes(2);
    });

    it('should handle RSS fetch failures', async () => {
      const axios = require('axios');
      axios.get = jest.fn().mockRejectedValue(new Error('Network error'));

      const result = await ingestionService.processRssFeed('https://example.com/rss');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Network error');
    });

    it('should handle invalid RSS format', async () => {
      const axios = require('axios');
      axios.get = jest.fn().mockResolvedValue({ data: 'invalid xml' });

      const result = await ingestionService.processRssFeed('https://example.com/rss');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid RSS');
    });
  });

  describe('NewsAPI Processing', () => {
    beforeEach(async () => {
      await ingestionService.initialize();
    });

    it('should process NewsAPI articles successfully', async () => {
      const mockNewsResponse = {
        status: 'ok',
        totalResults: 2,
        articles: [
          {
            title: 'News Article 1',
            description: 'Description 1',
            content: 'Full content 1',
            url: 'https://news.com/article1',
            author: 'Author 1',
            publishedAt: '2024-01-01T00:00:00Z',
            source: { name: 'News Source' }
          },
          {
            title: 'News Article 2',
            description: 'Description 2',
            content: 'Full content 2',
            url: 'https://news.com/article2',
            author: 'Author 2',
            publishedAt: '2024-01-02T00:00:00Z',
            source: { name: 'News Source' }
          }
        ]
      };

      const axios = require('axios');
      axios.get = jest.fn().mockResolvedValue({ data: mockNewsResponse });

      mockGeminiService.generateEmbedding = jest.fn().mockResolvedValue([0.1, 0.2, 0.3]);
      mockElasticsearchClient.indexDocument = jest.fn().mockResolvedValue({ success: true });

      const result = await ingestionService.processNewsAPI('technology', 'test-api-key');

      expect(result.success).toBe(true);
      expect(result.documentsProcessed).toBe(2);
      expect(mockElasticsearchClient.indexDocument).toHaveBeenCalledTimes(2);
    });

    it('should handle NewsAPI errors', async () => {
      const mockErrorResponse = {
        status: 'error',
        code: 'apiKeyInvalid',
        message: 'Your API key is invalid'
      };

      const axios = require('axios');
      axios.get = jest.fn().mockResolvedValue({ data: mockErrorResponse });

      const result = await ingestionService.processNewsAPI('technology', 'invalid-key');

      expect(result.success).toBe(false);
      expect(result.error).toContain('apiKeyInvalid');
    });

    it('should handle network failures', async () => {
      const axios = require('axios');
      axios.get = jest.fn().mockRejectedValue(new Error('Network timeout'));

      const result = await ingestionService.processNewsAPI('technology', 'test-key');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Network timeout');
    });
  });

  describe('Data Validation', () => {
    beforeEach(async () => {
      await ingestionService.initialize();
    });

    it('should validate document structure', () => {
      const validDocument = {
        title: 'Valid Title',
        content: 'Valid content with sufficient length',
        url: 'https://example.com',
        metadata: {
          author: 'Author',
          date: '2024-01-01',
          category: 'Technology'
        }
      };

      const isValid = (ingestionService as any).validateDocument(validDocument);
      expect(isValid).toBe(true);
    });

    it('should reject documents with missing required fields', () => {
      const invalidDocument = {
        content: 'Content without title',
        url: 'https://example.com'
      };

      const isValid = (ingestionService as any).validateDocument(invalidDocument);
      expect(isValid).toBe(false);
    });

    it('should reject documents with insufficient content', () => {
      const shortDocument = {
        title: 'Title',
        content: 'Too short',
        url: 'https://example.com'
      };

      const isValid = (ingestionService as any).validateDocument(shortDocument);
      expect(isValid).toBe(false);
    });

    it('should sanitize HTML content', () => {
      const htmlContent = '<p>This is <strong>bold</strong> text with <script>alert("xss")</script></p>';
      const sanitized = (ingestionService as any).sanitizeContent(htmlContent);
      
      expect(sanitized).not.toContain('<script>');
      expect(sanitized).toContain('This is bold text');
    });
  });

  describe('Batch Processing', () => {
    beforeEach(async () => {
      await ingestionService.initialize();
    });

    it('should process multiple URLs in batch', async () => {
      const urls = [
        'https://example.com/1',
        'https://example.com/2',
        'https://example.com/3'
      ];

      jest.spyOn(ingestionService, 'processUrl')
        .mockResolvedValue({ success: true, documentsProcessed: 1 });

      const result = await ingestionService.processBatch(urls, 'url');

      expect(result.success).toBe(true);
      expect(result.documentsProcessed).toBe(3);
      expect(ingestionService.processUrl).toHaveBeenCalledTimes(3);
    });

    it('should handle partial failures in batch processing', async () => {
      const urls = [
        'https://example.com/1',
        'https://example.com/2',
        'https://example.com/3'
      ];

      jest.spyOn(ingestionService, 'processUrl')
        .mockResolvedValueOnce({ success: true, documentsProcessed: 1 })
        .mockResolvedValueOnce({ success: false, error: 'Failed to process' })
        .mockResolvedValueOnce({ success: true, documentsProcessed: 1 });

      const result = await ingestionService.processBatch(urls, 'url');

      expect(result.success).toBe(true); // Should succeed overall
      expect(result.documentsProcessed).toBe(2); // Only successful ones
      expect(result.errors).toHaveLength(1);
    });

    it('should respect batch size limits', async () => {
      const largeUrlList = Array.from({ length: 100 }, (_, i) => `https://example.com/${i}`);
      
      jest.spyOn(ingestionService, 'processUrl')
        .mockResolvedValue({ success: true, documentsProcessed: 1 });

      const result = await ingestionService.processBatch(largeUrlList, 'url', { batchSize: 10 });

      expect(result.success).toBe(true);
      expect(result.documentsProcessed).toBe(100);
      // Should process in batches of 10
    });
  });

  describe('Error Handling and Recovery', () => {
    beforeEach(async () => {
      await ingestionService.initialize();
    });

    it('should retry failed operations', async () => {
      let attempts = 0;
      mockElasticsearchClient.indexDocument = jest.fn().mockImplementation(() => {
        attempts++;
        if (attempts < 3) {
          throw new Error('Temporary failure');
        }
        return Promise.resolve({ success: true });
      });

      const document = {
        title: 'Test',
        content: 'Test content',
        url: 'https://example.com'
      };

      const result = await (ingestionService as any).indexWithRetry(document);

      expect(result.success).toBe(true);
      expect(attempts).toBe(3);
    });

    it('should fail after maximum retry attempts', async () => {
      mockElasticsearchClient.indexDocument = jest.fn()
        .mockRejectedValue(new Error('Persistent failure'));

      const document = {
        title: 'Test',
        content: 'Test content',
        url: 'https://example.com'
      };

      const result = await (ingestionService as any).indexWithRetry(document, { maxRetries: 2 });

      expect(result.success).toBe(false);
      expect(mockElasticsearchClient.indexDocument).toHaveBeenCalledTimes(3); // Initial + 2 retries
    });

    it('should handle quota exceeded errors gracefully', async () => {
      const quotaError = new Error('Quota exceeded');
      quotaError.name = 'GoogleGenerativeAIError';
      
      mockGeminiService.generateEmbedding = jest.fn().mockRejectedValue(quotaError);
      mockElasticsearchClient.indexDocument = jest.fn().mockResolvedValue({ success: true });

      const document = {
        title: 'Test',
        content: 'Test content',
        url: 'https://example.com'
      };

      const result = await (ingestionService as any).processDocument(document);

      expect(result.success).toBe(true);
      expect(mockElasticsearchClient.indexDocument).toHaveBeenCalledWith(
        expect.objectContaining({
          embedding: undefined // Should proceed without embedding
        })
      );
    });
  });
});
