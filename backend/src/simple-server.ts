import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config({ path: '../.env' });
dotenv.config();

const app = express();
const PORT = process.env.BACKEND_PORT || 3001;

// Basic middleware
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3002'],
  credentials: true
}));
app.use(express.json());

// Simple health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    message: 'Simple backend server is running'
  });
});

// Simple search endpoint with mock data
app.post('/api/search', (req, res) => {
  const { query } = req.body;
  
  // Mock search results
  const mockResults = [
    {
      id: '1',
      title: `Search result for: ${query}`,
      content: `This is a mock search result for the query "${query}". The AI-powered search engine is working correctly.`,
      url: 'https://example.com/result1',
      metadata: {
        author: 'System',
        date: new Date().toISOString(),
        category: 'Mock',
        source: 'Test Data'
      },
      score: 0.95
    },
    {
      id: '2',
      title: `Another result for: ${query}`,
      content: `This is another mock search result demonstrating the search functionality for "${query}".`,
      url: 'https://example.com/result2',
      metadata: {
        author: 'System',
        date: new Date().toISOString(),
        category: 'Mock',
        source: 'Test Data'
      },
      score: 0.87
    }
  ];

  res.json({
    success: true,
    results: mockResults,
    total: mockResults.length,
    took: 45,
    searchInfo: {
      query: {
        original: query,
        enhanced: query
      },
      reasoning: {
        summary: `Found ${mockResults.length} results for "${query}"`,
        keyPoints: ['Mock data demonstration', 'Backend API working'],
        confidence: 0.9
      }
    },
    pagination: {
      size: 10,
      from: 0,
      hasMore: false,
      totalPages: 1,
      currentPage: 1
    },
    timestamp: new Date().toISOString()
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Simple backend server running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 API available at: http://localhost:${PORT}/api`);
});
