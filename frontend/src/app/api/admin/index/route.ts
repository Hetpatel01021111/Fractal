import { NextRequest, NextResponse } from 'next/server';
import { 
  getIndexStats, 
  initializeElasticsearch, 
  bulkIndexDocuments, 
  clearAllData 
} from '@/lib/elasticsearch';

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

export async function GET() {
  try {
    // Initialize Elasticsearch connection
    const esConnected = await initializeElasticsearch();
    
    let stats: any;
    let dataSource = 'fallback';

    if (esConnected) {
      try {
        // Get real Elasticsearch statistics
        const esStats = await getIndexStats();
        stats = {
          totalDocuments: esStats.documents,
          totalImages: esStats.images,
          categories: { 'technology': 5, 'research': 3, 'business': 2 }, // Mock for now
          averageAIScore: 87.5, // Mock for now
          lastIndexed: new Date().toISOString(),
          searchPerformance: {
            averageResponseTime: 120,
            totalSearches: esStats.analytics,
            popularQueries: ['machine learning', 'artificial intelligence', 'deep learning']
          },
          indexSize: esStats.indexSize,
          elasticsearchConnected: true
        };
        dataSource = 'elasticsearch';
        console.log('✅ Retrieved stats from Elasticsearch');
      } catch (error) {
        console.error('❌ Failed to get Elasticsearch stats:', error);
        stats = getMockStats();
        dataSource = 'fallback_after_error';
      }
    } else {
      // Fallback to mock statistics
      stats = getMockStats();
      console.log('📝 Using fallback stats (Elasticsearch not available)');
    }

    return NextResponse.json({
      success: true,
      stats,
      dataSource,
      recentDocuments: mockDatabase.documents.slice(-5),
      recentImages: mockDatabase.images.slice(-5)
    });

  } catch (error) {
    console.error('Index stats error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

function getMockStats() {
  return {
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
    },
    elasticsearchConnected: false
  };
}

export async function POST(request: NextRequest) {
  try {
    // Add new documents to index
    const { documents, images } = await request.json();
    
    if (documents && Array.isArray(documents)) {
      mockDatabase.documents.push(...documents);
    }
    
    if (images && Array.isArray(images)) {
      mockDatabase.images.push(...images);
    }

    return NextResponse.json({
      success: true,
      message: 'Documents and images indexed successfully',
      indexed: {
        documents: documents?.length || 0,
        images: images?.length || 0
      }
    });

  } catch (error) {
    console.error('Index management error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Clear index (for testing)
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    
    if (type === 'all') {
      mockDatabase.documents = [];
      mockDatabase.images = [];
      mockDatabase.searches = [];
    } else if (type === 'documents') {
      mockDatabase.documents = [];
    } else if (type === 'images') {
      mockDatabase.images = [];
    }

    return NextResponse.json({
      success: true,
      message: `${type || 'all'} data cleared successfully`
    });

  } catch (error) {
    console.error('Index deletion error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
