import { VercelRequest, VercelResponse } from '@vercel/node';

interface IndexStats {
  totalDocuments: number;
  totalImages: number;
  categories: { [key: string]: number };
  averageAIScore: number;
  lastIndexed: string;
  searchPerformance: {
    averageResponseTime: number;
    totalSearches: number;
    popularQueries: string[];
  };
}

// Mock database for demonstration
let mockDatabase = {
  documents: [
    {
      id: 'doc_1',
      title: 'Introduction to Machine Learning',
      content: 'Machine learning is a method of data analysis...',
      url: 'https://example.com/ml-intro',
      metadata: { category: 'education', aiScore: 85, source: 'example.com' }
    },
    {
      id: 'doc_2', 
      title: 'AI Ethics and Future',
      content: 'Artificial intelligence ethics discusses...',
      url: 'https://example.com/ai-ethics',
      metadata: { category: 'research', aiScore: 92, source: 'example.com' }
    }
  ],
  images: [
    {
      id: 'img_1',
      title: 'Neural Network Diagram',
      url: 'https://example.com/neural-network.jpg',
      metadata: { category: 'diagram', aiScore: 78, source: 'example.com' }
    }
  ],
  searches: [
    { query: 'machine learning', count: 45, avgResponseTime: 120 },
    { query: 'artificial intelligence', count: 38, avgResponseTime: 110 },
    { query: 'deep learning', count: 29, avgResponseTime: 135 }
  ]
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  try {
    switch (req.method) {
      case 'GET':
        // Get index statistics
        const stats: IndexStats = {
          totalDocuments: mockDatabase.documents.length,
          totalImages: mockDatabase.images.length,
          categories: mockDatabase.documents.reduce((acc, doc) => {
            const category = doc.metadata.category;
            acc[category] = (acc[category] || 0) + 1;
            return acc;
          }, {} as { [key: string]: number }),
          averageAIScore: mockDatabase.documents.reduce((sum, doc) => sum + doc.metadata.aiScore, 0) / mockDatabase.documents.length,
          lastIndexed: new Date().toISOString(),
          searchPerformance: {
            averageResponseTime: mockDatabase.searches.reduce((sum, s) => sum + s.avgResponseTime, 0) / mockDatabase.searches.length,
            totalSearches: mockDatabase.searches.reduce((sum, s) => sum + s.count, 0),
            popularQueries: mockDatabase.searches.sort((a, b) => b.count - a.count).map(s => s.query).slice(0, 5)
          }
        };

        res.status(200).json({
          success: true,
          stats,
          recentDocuments: mockDatabase.documents.slice(-5),
          recentImages: mockDatabase.images.slice(-5)
        });
        break;

      case 'POST':
        // Add new documents to index
        const { documents, images } = req.body;
        
        if (documents && Array.isArray(documents)) {
          mockDatabase.documents.push(...documents);
        }
        
        if (images && Array.isArray(images)) {
          mockDatabase.images.push(...images);
        }

        res.status(200).json({
          success: true,
          message: 'Documents and images indexed successfully',
          indexed: {
            documents: documents?.length || 0,
            images: images?.length || 0
          }
        });
        break;

      case 'DELETE':
        // Clear index (for testing)
        const { type } = req.query;
        
        if (type === 'all') {
          mockDatabase.documents = [];
          mockDatabase.images = [];
          mockDatabase.searches = [];
        } else if (type === 'documents') {
          mockDatabase.documents = [];
        } else if (type === 'images') {
          mockDatabase.images = [];
        }

        res.status(200).json({
          success: true,
          message: `${type || 'all'} data cleared successfully`
        });
        break;

      default:
        res.status(405).json({ error: 'Method not allowed' });
    }

  } catch (error) {
    console.error('Index management error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
