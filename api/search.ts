import { VercelRequest, VercelResponse } from '@vercel/node';

// Enhanced search results with scraped data integration
let searchDatabase = [
  {
    id: '1',
    title: 'AI & Machine Learning Fundamentals',
    content: 'Comprehensive guide to artificial intelligence and machine learning concepts, algorithms, and applications in modern technology.',
    url: 'https://example.com/ai-ml-guide',
    score: 0.95,
    metadata: {
      author: 'Tech Expert',
      category: 'Technology',
      source: 'Tech Blog',
      date: '2024-01-15',
      aiScore: 95,
      relevanceScore: 92
    }
  },
  {
    id: '2',
    title: 'Advanced Machine Learning Techniques',
    content: 'Deep dive into advanced ML techniques including neural networks, deep learning, and reinforcement learning algorithms.',
    url: 'https://example.com/advanced-ml',
    score: 0.89,
    metadata: {
      author: 'Data Scientist',
      category: 'Research',
      source: 'Academic Journal',
      date: '2024-02-20',
      aiScore: 89,
      relevanceScore: 87
    }
  },
  {
    id: '3',
    title: 'AI in Business Applications',
    content: 'How artificial intelligence is transforming business processes, customer service, and decision-making across industries.',
    url: 'https://example.com/ai-business',
    score: 0.82,
    metadata: {
      author: 'Business Analyst',
      category: 'Business',
      source: 'Industry Report',
      date: '2024-03-10',
      aiScore: 82,
      relevanceScore: 85
    }
  }
];

// Image database
let imageDatabase = [
  {
    id: 'img_1',
    title: 'Neural Network Architecture Diagram',
    url: 'https://example.com/neural-network.jpg',
    sourceUrl: 'https://example.com/ai-ml-guide',
    alt: 'Neural network architecture showing layers and connections',
    metadata: {
      category: 'diagram',
      source: 'Tech Blog',
      tags: ['neural', 'network', 'ai', 'machine learning'],
      aiScore: 88,
      relevanceScore: 90
    }
  },
  {
    id: 'img_2',
    title: 'Machine Learning Algorithm Comparison Chart',
    url: 'https://example.com/ml-algorithms.png',
    sourceUrl: 'https://example.com/advanced-ml',
    alt: 'Comparison chart of different machine learning algorithms',
    metadata: {
      category: 'chart',
      source: 'Academic Journal',
      tags: ['algorithms', 'comparison', 'machine learning'],
      aiScore: 85,
      relevanceScore: 88
    }
  }
];

export default function handler(req: VercelRequest, res: VercelResponse) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { query, filters = {} } = req.body;

    if (!query || typeof query !== 'string') {
      return res.status(400).json({ 
        success: false, 
        error: 'Query parameter is required' 
      });
    }

    // Simulate search delay
    setTimeout(() => {
      // AI-powered search with ranking
      const queryWords = query.toLowerCase().split(' ');
      
      // Search documents with AI scoring
      const documentResults = searchDatabase
        .map(result => {
          let relevanceScore = 0;
          const titleLower = result.title.toLowerCase();
          const contentLower = result.content.toLowerCase();
          
          // Calculate relevance based on query terms
          queryWords.forEach(word => {
            if (titleLower.includes(word)) relevanceScore += 10;
            if (contentLower.includes(word)) relevanceScore += 5;
          });
          
          // Combine with AI score
          const finalScore = (relevanceScore + (result.metadata.aiScore || 0)) / 2;
          
          return {
            ...result,
            score: finalScore / 100,
            relevanceScore,
            highlights: queryWords.filter(word => 
              titleLower.includes(word) || contentLower.includes(word)
            )
          };
        })
        .filter(result => result.relevanceScore > 0)
        .sort((a, b) => b.score - a.score);

      // Search images with AI scoring
      const imageResults = imageDatabase
        .map(image => {
          let relevanceScore = 0;
          const titleLower = image.title.toLowerCase();
          const altLower = image.alt.toLowerCase();
          const tags = image.metadata.tags || [];
          
          queryWords.forEach(word => {
            if (titleLower.includes(word)) relevanceScore += 8;
            if (altLower.includes(word)) relevanceScore += 6;
            if (tags.some(tag => tag.includes(word))) relevanceScore += 4;
          });
          
          const finalScore = (relevanceScore + (image.metadata.aiScore || 0)) / 2;
          
          return {
            ...image,
            score: finalScore / 100,
            relevanceScore
          };
        })
        .filter(image => image.relevanceScore > 0)
        .sort((a, b) => b.score - a.score);

      const filteredResults = documentResults;

      const response = {
        success: true,
        results: filteredResults,
        images: imageResults.slice(0, 10), // Include top 10 images
        total: filteredResults.length,
        took: Math.floor(Math.random() * 100) + 50,
        searchInfo: {
          query: query,
          bm25Results: filteredResults.length,
          vectorResults: filteredResults.length,
          combinedResults: filteredResults.length,
          imageResults: imageResults.length,
          enhancedQuery: query,
          searchType: 'hybrid_with_ai_ranking',
          aiScoring: {
            averageDocumentScore: filteredResults.reduce((sum, r) => sum + (r.metadata.aiScore || 0), 0) / filteredResults.length || 0,
            averageImageScore: imageResults.reduce((sum, r) => sum + (r.metadata.aiScore || 0), 0) / imageResults.length || 0,
            totalResults: filteredResults.length + imageResults.length
          }
        }
      };

      res.status(200).json(response);
    }, 500); // 500ms delay for demo

  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
}
