import { VercelRequest, VercelResponse } from '@vercel/node';
import * as cheerio from 'cheerio';

interface ScrapedData {
  id: string;
  title: string;
  content: string;
  url: string;
  images: string[];
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
}

interface ScrapeRequest {
  query: string;
  maxResults?: number;
  includeImages?: boolean;
  categories?: string[];
}

// Mock Google search results (in production, you'd use a proper search API)
const mockGoogleResults = [
  {
    title: "Machine Learning Fundamentals - Complete Guide",
    url: "https://example.com/ml-fundamentals",
    snippet: "Comprehensive guide to machine learning algorithms, neural networks, and deep learning techniques.",
    images: ["https://example.com/ml-image1.jpg", "https://example.com/ml-image2.jpg"]
  },
  {
    title: "AI Learning Path - From Beginner to Expert",
    url: "https://example.com/ai-learning-path",
    snippet: "Step-by-step artificial intelligence learning curriculum covering supervised and unsupervised learning.",
    images: ["https://example.com/ai-image1.jpg", "https://example.com/ai-image2.jpg"]
  },
  {
    title: "Deep Learning with Python - Practical Examples",
    url: "https://example.com/deep-learning-python",
    snippet: "Hands-on deep learning tutorials using TensorFlow and PyTorch with real-world applications.",
    images: ["https://example.com/dl-image1.jpg", "https://example.com/dl-image2.jpg"]
  }
];

// AI-powered content scoring
function calculateAIScore(content: string, query: string): number {
  const queryWords = query.toLowerCase().split(' ');
  const contentLower = content.toLowerCase();
  
  let score = 0;
  
  // Keyword relevance
  queryWords.forEach(word => {
    const occurrences = (contentLower.match(new RegExp(word, 'g')) || []).length;
    score += occurrences * 10;
  });
  
  // Content quality indicators
  if (content.length > 500) score += 20;
  if (content.includes('tutorial') || content.includes('guide')) score += 15;
  if (content.includes('example') || content.includes('practical')) score += 10;
  
  // Normalize to 0-100
  return Math.min(100, score);
}

// Extract and rank images
function rankImages(images: string[], query: string): string[] {
  return images.sort((a, b) => {
    const aScore = a.toLowerCase().includes(query.toLowerCase()) ? 1 : 0;
    const bScore = b.toLowerCase().includes(query.toLowerCase()) ? 1 : 0;
    return bScore - aScore;
  });
}

// Simulate web scraping (in production, use proper scraping tools)
async function scrapeContent(url: string): Promise<string> {
  // Mock content extraction
  const mockContent = `
    This is a comprehensive article about machine learning and artificial intelligence.
    
    Machine learning is a subset of artificial intelligence that enables computers to learn
    and improve from experience without being explicitly programmed. It focuses on the
    development of computer programs that can access data and use it to learn for themselves.
    
    Key concepts include:
    - Supervised learning
    - Unsupervised learning
    - Reinforcement learning
    - Neural networks
    - Deep learning
    
    Practical applications span across various industries including healthcare, finance,
    technology, and autonomous vehicles. Modern AI systems use sophisticated algorithms
    to process large datasets and make intelligent decisions.
  `;
  
  return mockContent;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
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
    const { query, maxResults = 10, includeImages = true, categories = [] }: ScrapeRequest = req.body;

    if (!query || typeof query !== 'string') {
      return res.status(400).json({ 
        success: false, 
        error: 'Query parameter is required' 
      });
    }

    console.log(`Starting scrape for query: "${query}"`);

    // Simulate Google search (in production, use Google Custom Search API)
    const searchResults = mockGoogleResults.slice(0, maxResults);
    
    const scrapedData: ScrapedData[] = [];
    const imageData: any[] = [];

    for (let i = 0; i < searchResults.length; i++) {
      const result = searchResults[i];
      
      try {
        // Scrape content from each URL
        const content = await scrapeContent(result.url);
        
        // Calculate AI scores
        const aiScore = calculateAIScore(content, query);
        const relevanceScore = calculateAIScore(result.snippet, query);
        
        // Process images
        let processedImages: string[] = [];
        if (includeImages && result.images) {
          processedImages = rankImages(result.images, query);
          
          // Add to image data for separate indexing
          result.images.forEach((imageUrl, idx) => {
            imageData.push({
              id: `img_${i}_${idx}`,
              title: `${result.title} - Image ${idx + 1}`,
              url: imageUrl,
              sourceUrl: result.url,
              alt: `${query} related image`,
              metadata: {
                category: 'image',
                source: new URL(result.url).hostname,
                tags: query.split(' '),
                aiScore: aiScore * 0.8, // Images get slightly lower AI score
                relevanceScore
              }
            });
          });
        }

        // Create document for indexing
        const document: ScrapedData = {
          id: `doc_${Date.now()}_${i}`,
          title: result.title,
          content: content,
          url: result.url,
          images: processedImages,
          metadata: {
            author: 'Web Scraper',
            date: new Date().toISOString(),
            category: categories.length > 0 ? categories[0] : 'general',
            source: new URL(result.url).hostname,
            tags: query.split(' '),
            language: 'en',
            aiScore,
            relevanceScore
          },
          timestamp: new Date().toISOString()
        };

        scrapedData.push(document);
        
        // Simulate processing delay
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (error) {
        console.error(`Error scraping ${result.url}:`, error);
        continue;
      }
    }

    // Sort by AI score (highest first)
    scrapedData.sort((a, b) => (b.metadata.aiScore || 0) - (a.metadata.aiScore || 0));
    imageData.sort((a, b) => (b.metadata.aiScore || 0) - (a.metadata.aiScore || 0));

    // Simulate indexing process
    const indexingResults = {
      documentsIndexed: scrapedData.length,
      imagesIndexed: imageData.length,
      averageAIScore: scrapedData.reduce((sum, doc) => sum + (doc.metadata.aiScore || 0), 0) / scrapedData.length,
      topCategories: [...new Set(scrapedData.map(doc => doc.metadata.category))],
      processingTime: Math.floor(Math.random() * 1000) + 500 // Mock processing time
    };

    const response = {
      success: true,
      query,
      results: {
        documents: scrapedData,
        images: imageData,
        indexing: indexingResults,
        summary: {
          totalResults: scrapedData.length + imageData.length,
          documentsFound: scrapedData.length,
          imagesFound: imageData.length,
          averageRelevance: indexingResults.averageAIScore,
          processingTimeMs: indexingResults.processingTime
        }
      },
      timestamp: new Date().toISOString()
    };

    console.log(`Scraping completed: ${scrapedData.length} documents, ${imageData.length} images`);

    res.status(200).json(response);

  } catch (error) {
    console.error('Scraping error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error during scraping',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
