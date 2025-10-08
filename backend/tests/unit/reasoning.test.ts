import { GeminiService } from '../../src/services/gemini';

// Mock the Google Generative AI
jest.mock('@google/generative-ai', () => ({
  GoogleGenerativeAI: jest.fn().mockImplementation(() => ({
    getGenerativeModel: jest.fn().mockReturnValue({
      generateContent: jest.fn(),
      embedContent: jest.fn()
    })
  }))
}));

describe('Reasoning Module - GeminiService', () => {
  let geminiService: GeminiService;
  let mockModel: any;

  beforeEach(() => {
    const { GoogleGenerativeAI } = require('@google/generative-ai');
    const mockGenAI = new GoogleGenerativeAI();
    mockModel = mockGenAI.getGenerativeModel();
    
    geminiService = new GeminiService();
    (geminiService as any).model = mockModel;
    (geminiService as any).embeddingModel = mockModel;
  });

  describe('Initialization', () => {
    it('should initialize successfully with valid API key', async () => {
      process.env.GEMINI_API_KEY = 'test-api-key';
      
      await expect(geminiService.initialize()).resolves.not.toThrow();
    });

    it('should throw error without API key', async () => {
      delete process.env.GEMINI_API_KEY;
      
      await expect(geminiService.initialize()).rejects.toThrow('GEMINI_API_KEY is required');
    });
  });

  describe('Query Enhancement', () => {
    beforeEach(async () => {
      process.env.GEMINI_API_KEY = 'test-api-key';
      await geminiService.initialize();
    });

    it('should enhance simple queries', async () => {
      const mockResponse = {
        response: {
          text: () => 'artificial intelligence machine learning deep learning neural networks computer science'
        }
      };

      mockModel.generateContent = jest.fn().mockResolvedValue(mockResponse);

      const result = await geminiService.enhanceQuery('AI');

      expect(result).toBe('artificial intelligence machine learning deep learning neural networks computer science');
      expect(mockModel.generateContent).toHaveBeenCalledWith(
        expect.stringContaining('AI')
      );
    });

    it('should handle technical queries', async () => {
      const mockResponse = {
        response: {
          text: () => 'quantum computing quantum mechanics qubits quantum algorithms quantum supremacy quantum entanglement'
        }
      };

      mockModel.generateContent = jest.fn().mockResolvedValue(mockResponse);

      const result = await geminiService.enhanceQuery('quantum computing');

      expect(result).toContain('quantum');
      expect(result).toContain('computing');
      expect(mockModel.generateContent).toHaveBeenCalledWith(
        expect.stringContaining('quantum computing')
      );
    });

    it('should handle ambiguous queries', async () => {
      const mockResponse = {
        response: {
          text: () => 'apple fruit nutrition health food cooking recipes apple tree orchard'
        }
      };

      mockModel.generateContent = jest.fn().mockResolvedValue(mockResponse);

      const result = await geminiService.enhanceQuery('apple');

      expect(result).toBeDefined();
      expect(result.length).toBeGreaterThan('apple'.length);
    });

    it('should handle query enhancement errors', async () => {
      mockModel.generateContent = jest.fn().mockRejectedValue(new Error('API quota exceeded'));

      await expect(geminiService.enhanceQuery('test query')).rejects.toThrow('API quota exceeded');
    });

    it('should handle empty or invalid queries', async () => {
      await expect(geminiService.enhanceQuery('')).rejects.toThrow('Query cannot be empty');
      await expect(geminiService.enhanceQuery('   ')).rejects.toThrow('Query cannot be empty');
    });

    it('should limit enhanced query length', async () => {
      const longResponse = 'word '.repeat(200); // Very long response
      const mockResponse = {
        response: {
          text: () => longResponse
        }
      };

      mockModel.generateContent = jest.fn().mockResolvedValue(mockResponse);

      const result = await geminiService.enhanceQuery('test');

      // Should be truncated to reasonable length
      expect(result.length).toBeLessThan(500);
    });
  });

  describe('Content Summarization', () => {
    beforeEach(async () => {
      process.env.GEMINI_API_KEY = 'test-api-key';
      await geminiService.initialize();
    });

    it('should summarize search results', async () => {
      const searchResults = [
        {
          id: '1',
          title: 'AI Research Paper',
          content: 'This paper discusses the latest advances in artificial intelligence, focusing on deep learning and neural networks.',
          score: 0.95
        },
        {
          id: '2',
          title: 'Machine Learning Guide',
          content: 'A comprehensive guide to machine learning algorithms, including supervised and unsupervised learning techniques.',
          score: 0.87
        }
      ];

      const mockResponse = {
        response: {
          text: () => JSON.stringify({
            summary: 'The search results discuss artificial intelligence and machine learning, covering deep learning, neural networks, and various ML algorithms.',
            keyPoints: [
              'Latest advances in artificial intelligence',
              'Deep learning and neural networks',
              'Machine learning algorithms',
              'Supervised and unsupervised learning'
            ],
            confidence: 0.9
          })
        }
      };

      mockModel.generateContent = jest.fn().mockResolvedValue(mockResponse);

      const result = await geminiService.summarizeResults(searchResults, 'artificial intelligence');

      expect(result.summary).toContain('artificial intelligence');
      expect(result.keyPoints).toHaveLength(4);
      expect(result.confidence).toBe(0.9);
      expect(mockModel.generateContent).toHaveBeenCalledWith(
        expect.stringContaining('artificial intelligence')
      );
    });

    it('should handle empty search results', async () => {
      const result = await geminiService.summarizeResults([], 'test query');

      expect(result.summary).toBe('No results found for the given query.');
      expect(result.keyPoints).toHaveLength(0);
      expect(result.confidence).toBe(0);
    });

    it('should handle summarization errors', async () => {
      const searchResults = [
        {
          id: '1',
          title: 'Test',
          content: 'Test content',
          score: 0.8
        }
      ];

      mockModel.generateContent = jest.fn().mockRejectedValue(new Error('Summarization failed'));

      const result = await geminiService.summarizeResults(searchResults, 'test');

      expect(result.summary).toContain('Unable to generate summary');
      expect(result.keyPoints).toHaveLength(0);
      expect(result.confidence).toBe(0);
    });

    it('should handle malformed JSON responses', async () => {
      const searchResults = [
        {
          id: '1',
          title: 'Test',
          content: 'Test content',
          score: 0.8
        }
      ];

      const mockResponse = {
        response: {
          text: () => 'Invalid JSON response'
        }
      };

      mockModel.generateContent = jest.fn().mockResolvedValue(mockResponse);

      const result = await geminiService.summarizeResults(searchResults, 'test');

      expect(result.summary).toContain('Unable to generate summary');
      expect(result.confidence).toBe(0);
    });
  });

  describe('Search Intent Analysis', () => {
    beforeEach(async () => {
      process.env.GEMINI_API_KEY = 'test-api-key';
      await geminiService.initialize();
    });

    it('should analyze informational queries', async () => {
      const mockResponse = {
        response: {
          text: () => JSON.stringify({
            intent: 'informational',
            confidence: 0.95,
            category: 'technology',
            entities: ['artificial intelligence', 'machine learning'],
            suggestions: [
              'What is artificial intelligence?',
              'How does machine learning work?',
              'AI vs machine learning differences'
            ]
          })
        }
      };

      mockModel.generateContent = jest.fn().mockResolvedValue(mockResponse);

      const result = await geminiService.analyzeSearchIntent('what is artificial intelligence');

      expect(result.intent).toBe('informational');
      expect(result.confidence).toBe(0.95);
      expect(result.category).toBe('technology');
      expect(result.entities).toContain('artificial intelligence');
      expect(result.suggestions).toHaveLength(3);
    });

    it('should analyze navigational queries', async () => {
      const mockResponse = {
        response: {
          text: () => JSON.stringify({
            intent: 'navigational',
            confidence: 0.88,
            category: 'website',
            entities: ['OpenAI', 'ChatGPT'],
            suggestions: [
              'OpenAI official website',
              'ChatGPT login page',
              'OpenAI API documentation'
            ]
          })
        }
      };

      mockModel.generateContent = jest.fn().mockResolvedValue(mockResponse);

      const result = await geminiService.analyzeSearchIntent('OpenAI ChatGPT website');

      expect(result.intent).toBe('navigational');
      expect(result.entities).toContain('OpenAI');
      expect(result.suggestions).toHaveLength(3);
    });

    it('should analyze transactional queries', async () => {
      const mockResponse = {
        response: {
          text: () => JSON.stringify({
            intent: 'transactional',
            confidence: 0.92,
            category: 'purchase',
            entities: ['laptop', 'buy', 'gaming'],
            suggestions: [
              'Best gaming laptops 2024',
              'Gaming laptop reviews',
              'Where to buy gaming laptops'
            ]
          })
        }
      };

      mockModel.generateContent = jest.fn().mockResolvedValue(mockResponse);

      const result = await geminiService.analyzeSearchIntent('buy gaming laptop');

      expect(result.intent).toBe('transactional');
      expect(result.category).toBe('purchase');
      expect(result.entities).toContain('laptop');
    });

    it('should handle intent analysis errors', async () => {
      mockModel.generateContent = jest.fn().mockRejectedValue(new Error('Intent analysis failed'));

      const result = await geminiService.analyzeSearchIntent('test query');

      expect(result.intent).toBe('unknown');
      expect(result.confidence).toBe(0);
      expect(result.suggestions).toHaveLength(0);
    });
  });

  describe('Embedding Generation', () => {
    beforeEach(async () => {
      process.env.GEMINI_API_KEY = 'test-api-key';
      await geminiService.initialize();
    });

    it('should generate embeddings for text', async () => {
      const mockEmbedding = [0.1, 0.2, 0.3, 0.4, 0.5];
      const mockResponse = {
        embedding: {
          values: mockEmbedding
        }
      };

      mockModel.embedContent = jest.fn().mockResolvedValue(mockResponse);

      const result = await geminiService.generateEmbedding('artificial intelligence');

      expect(result).toEqual(mockEmbedding);
      expect(mockModel.embedContent).toHaveBeenCalledWith({
        content: { parts: [{ text: 'artificial intelligence' }] },
        taskType: 'RETRIEVAL_DOCUMENT'
      });
    });

    it('should handle embedding generation errors', async () => {
      mockModel.embedContent = jest.fn().mockRejectedValue(new Error('Embedding failed'));

      await expect(geminiService.generateEmbedding('test text')).rejects.toThrow('Embedding failed');
    });

    it('should handle empty text', async () => {
      await expect(geminiService.generateEmbedding('')).rejects.toThrow('Text cannot be empty');
    });

    it('should handle very long text', async () => {
      const longText = 'word '.repeat(10000); // Very long text
      const mockEmbedding = [0.1, 0.2, 0.3];
      const mockResponse = {
        embedding: {
          values: mockEmbedding
        }
      };

      mockModel.embedContent = jest.fn().mockResolvedValue(mockResponse);

      const result = await geminiService.generateEmbedding(longText);

      expect(result).toEqual(mockEmbedding);
      // Should truncate long text
      expect(mockModel.embedContent).toHaveBeenCalledWith(
        expect.objectContaining({
          content: expect.objectContaining({
            parts: expect.arrayContaining([
              expect.objectContaining({
                text: expect.stringMatching(/^word\s+word\s+.*/)
              })
            ])
          })
        })
      );
    });
  });

  describe('Follow-up Question Generation', () => {
    beforeEach(async () => {
      process.env.GEMINI_API_KEY = 'test-api-key';
      await geminiService.initialize();
    });

    it('should generate relevant follow-up questions', async () => {
      const mockResponse = {
        response: {
          text: () => JSON.stringify([
            'What are the applications of artificial intelligence?',
            'How does machine learning differ from AI?',
            'What are the ethical concerns with AI?',
            'What is the future of artificial intelligence?'
          ])
        }
      };

      mockModel.generateContent = jest.fn().mockResolvedValue(mockResponse);

      const result = await geminiService.generateFollowUpQuestions('artificial intelligence', [
        { id: '1', title: 'AI Overview', content: 'AI is...', score: 0.9 }
      ]);

      expect(result).toHaveLength(4);
      expect(result[0]).toContain('artificial intelligence');
      expect(mockModel.generateContent).toHaveBeenCalledWith(
        expect.stringContaining('artificial intelligence')
      );
    });

    it('should handle follow-up generation errors', async () => {
      mockModel.generateContent = jest.fn().mockRejectedValue(new Error('Generation failed'));

      const result = await geminiService.generateFollowUpQuestions('test', []);

      expect(result).toHaveLength(0);
    });

    it('should handle malformed JSON in follow-up response', async () => {
      const mockResponse = {
        response: {
          text: () => 'Invalid JSON'
        }
      };

      mockModel.generateContent = jest.fn().mockResolvedValue(mockResponse);

      const result = await geminiService.generateFollowUpQuestions('test', []);

      expect(result).toHaveLength(0);
    });
  });

  describe('Content Quality Assessment', () => {
    beforeEach(async () => {
      process.env.GEMINI_API_KEY = 'test-api-key';
      await geminiService.initialize();
    });

    it('should assess content quality', async () => {
      const mockResponse = {
        response: {
          text: () => JSON.stringify({
            qualityScore: 0.85,
            factors: {
              relevance: 0.9,
              accuracy: 0.8,
              completeness: 0.85,
              readability: 0.9
            },
            issues: ['Could include more recent data'],
            recommendations: ['Add more examples', 'Include citations']
          })
        }
      };

      mockModel.generateContent = jest.fn().mockResolvedValue(mockResponse);

      const content = 'This is a comprehensive article about artificial intelligence...';
      const result = await geminiService.assessContentQuality(content, 'artificial intelligence');

      expect(result.qualityScore).toBe(0.85);
      expect(result.factors.relevance).toBe(0.9);
      expect(result.issues).toHaveLength(1);
      expect(result.recommendations).toHaveLength(2);
    });

    it('should handle quality assessment errors', async () => {
      mockModel.generateContent = jest.fn().mockRejectedValue(new Error('Assessment failed'));

      const result = await geminiService.assessContentQuality('test content', 'test query');

      expect(result.qualityScore).toBe(0);
      expect(result.factors).toEqual({
        relevance: 0,
        accuracy: 0,
        completeness: 0,
        readability: 0
      });
    });
  });

  describe('Error Handling and Resilience', () => {
    beforeEach(async () => {
      process.env.GEMINI_API_KEY = 'test-api-key';
      await geminiService.initialize();
    });

    it('should handle API quota exceeded errors', async () => {
      const quotaError = new Error('Quota exceeded');
      quotaError.name = 'GoogleGenerativeAIError';
      
      mockModel.generateContent = jest.fn().mockRejectedValue(quotaError);

      await expect(geminiService.enhanceQuery('test')).rejects.toThrow('Quota exceeded');
    });

    it('should handle network timeout errors', async () => {
      const timeoutError = new Error('Request timeout');
      timeoutError.name = 'TimeoutError';
      
      mockModel.generateContent = jest.fn().mockRejectedValue(timeoutError);

      await expect(geminiService.enhanceQuery('test')).rejects.toThrow('Request timeout');
    });

    it('should handle invalid API key errors', async () => {
      const authError = new Error('Invalid API key');
      authError.name = 'GoogleGenerativeAIError';
      
      mockModel.generateContent = jest.fn().mockRejectedValue(authError);

      await expect(geminiService.enhanceQuery('test')).rejects.toThrow('Invalid API key');
    });

    it('should retry on transient errors', async () => {
      let attempts = 0;
      mockModel.generateContent = jest.fn().mockImplementation(() => {
        attempts++;
        if (attempts < 3) {
          throw new Error('Temporary failure');
        }
        return Promise.resolve({
          response: {
            text: () => 'success after retry'
          }
        });
      });

      const result = await (geminiService as any).executeWithRetry(
        () => geminiService.enhanceQuery('test'),
        { maxRetries: 3 }
      );

      expect(result).toBe('success after retry');
      expect(attempts).toBe(3);
    });

    it('should fail after max retries', async () => {
      mockModel.generateContent = jest.fn().mockRejectedValue(new Error('Persistent failure'));

      await expect(
        (geminiService as any).executeWithRetry(
          () => geminiService.enhanceQuery('test'),
          { maxRetries: 2 }
        )
      ).rejects.toThrow('Persistent failure');

      expect(mockModel.generateContent).toHaveBeenCalledTimes(3); // Initial + 2 retries
    });
  });

  describe('Content Filtering and Safety', () => {
    beforeEach(async () => {
      process.env.GEMINI_API_KEY = 'test-api-key';
      await geminiService.initialize();
    });

    it('should filter inappropriate content', async () => {
      const inappropriateQuery = 'harmful content query';
      
      const result = await (geminiService as any).filterContent(inappropriateQuery);
      
      expect(result.isAppropriate).toBeDefined();
      expect(typeof result.isAppropriate).toBe('boolean');
    });

    it('should handle content safety checks', async () => {
      const mockResponse = {
        response: {
          text: () => 'This is safe content about technology',
          candidates: [{
            safetyRatings: [
              { category: 'HARM_CATEGORY_HARASSMENT', probability: 'NEGLIGIBLE' },
              { category: 'HARM_CATEGORY_HATE_SPEECH', probability: 'NEGLIGIBLE' }
            ]
          }]
        }
      };

      mockModel.generateContent = jest.fn().mockResolvedValue(mockResponse);

      const result = await geminiService.enhanceQuery('technology');

      expect(result).toBe('This is safe content about technology');
    });
  });

  describe('Performance and Caching', () => {
    beforeEach(async () => {
      process.env.GEMINI_API_KEY = 'test-api-key';
      await geminiService.initialize();
    });

    it('should cache frequent queries', async () => {
      const mockResponse = {
        response: {
          text: () => 'cached response'
        }
      };

      mockModel.generateContent = jest.fn().mockResolvedValue(mockResponse);

      // First call
      const result1 = await geminiService.enhanceQuery('popular query');
      // Second call (should use cache)
      const result2 = await geminiService.enhanceQuery('popular query');

      expect(result1).toBe('cached response');
      expect(result2).toBe('cached response');
      
      // Should only call the API once due to caching
      expect(mockModel.generateContent).toHaveBeenCalledTimes(1);
    });

    it('should respect cache expiration', async () => {
      const mockResponse = {
        response: {
          text: () => 'fresh response'
        }
      };

      mockModel.generateContent = jest.fn().mockResolvedValue(mockResponse);

      // Mock cache expiration
      jest.spyOn(Date, 'now')
        .mockReturnValueOnce(1000) // First call
        .mockReturnValueOnce(2000) // Cache check
        .mockReturnValueOnce(61000); // Second call (after expiration)

      await geminiService.enhanceQuery('test query');
      await geminiService.enhanceQuery('test query'); // Should use fresh call due to expiration

      expect(mockModel.generateContent).toHaveBeenCalledTimes(2);
    });
  });
});
