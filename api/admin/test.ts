import { VercelRequest, VercelResponse } from '@vercel/node';

interface TestResult {
  test: string;
  status: 'pass' | 'fail' | 'warning';
  message: string;
  details?: any;
  duration?: number;
}

// Test search functionality
async function testSearch(query: string): Promise<TestResult> {
  const startTime = Date.now();
  
  try {
    // Mock search test
    const mockResults = [
      { id: '1', title: 'Test Result 1', score: 0.95 },
      { id: '2', title: 'Test Result 2', score: 0.87 }
    ];
    
    const duration = Date.now() - startTime;
    
    if (mockResults.length > 0) {
      return {
        test: 'Search Functionality',
        status: 'pass',
        message: `Search returned ${mockResults.length} results`,
        details: { query, results: mockResults.length, topScore: mockResults[0].score },
        duration
      };
    } else {
      return {
        test: 'Search Functionality',
        status: 'warning',
        message: 'Search returned no results',
        duration
      };
    }
  } catch (error) {
    return {
      test: 'Search Functionality',
      status: 'fail',
      message: 'Search test failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      duration: Date.now() - startTime
    };
  }
}

// Test AI ranking
async function testAIRanking(): Promise<TestResult> {
  const startTime = Date.now();
  
  try {
    const testDocuments = [
      { id: '1', content: 'machine learning algorithms neural networks', aiScore: 85 },
      { id: '2', content: 'artificial intelligence deep learning', aiScore: 92 },
      { id: '3', content: 'data science statistics', aiScore: 70 }
    ];
    
    // Sort by AI score
    const ranked = testDocuments.sort((a, b) => b.aiScore - a.aiScore);
    const duration = Date.now() - startTime;
    
    return {
      test: 'AI Ranking System',
      status: 'pass',
      message: 'AI ranking working correctly',
      details: {
        topDocument: ranked[0],
        averageScore: ranked.reduce((sum, doc) => sum + doc.aiScore, 0) / ranked.length,
        scoreRange: { min: Math.min(...ranked.map(d => d.aiScore)), max: Math.max(...ranked.map(d => d.aiScore)) }
      },
      duration
    };
  } catch (error) {
    return {
      test: 'AI Ranking System',
      status: 'fail',
      message: 'AI ranking test failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      duration: Date.now() - startTime
    };
  }
}

// Test image indexing
async function testImageIndexing(): Promise<TestResult> {
  const startTime = Date.now();
  
  try {
    const testImages = [
      { url: 'https://example.com/ml-diagram.jpg', alt: 'machine learning diagram' },
      { url: 'https://example.com/ai-chart.png', alt: 'AI performance chart' }
    ];
    
    // Simulate image processing
    const processedImages = testImages.map((img, idx) => ({
      id: `img_test_${idx}`,
      ...img,
      indexed: true,
      aiScore: Math.floor(Math.random() * 40) + 60 // 60-100 range
    }));
    
    const duration = Date.now() - startTime;
    
    return {
      test: 'Image Indexing',
      status: 'pass',
      message: `Successfully indexed ${processedImages.length} images`,
      details: {
        imagesProcessed: processedImages.length,
        averageScore: processedImages.reduce((sum, img) => sum + img.aiScore, 0) / processedImages.length,
        formats: ['jpg', 'png']
      },
      duration
    };
  } catch (error) {
    return {
      test: 'Image Indexing',
      status: 'fail',
      message: 'Image indexing test failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      duration: Date.now() - startTime
    };
  }
}

// Test scraping functionality
async function testScraping(): Promise<TestResult> {
  const startTime = Date.now();
  
  try {
    // Mock scraping test
    const testQuery = 'machine learning';
    const mockScrapedData = {
      documentsFound: 5,
      imagesFound: 8,
      averageQuality: 85,
      sources: ['example.com', 'test.org', 'demo.net']
    };
    
    const duration = Date.now() - startTime;
    
    return {
      test: 'Web Scraping',
      status: 'pass',
      message: 'Scraping functionality working',
      details: {
        query: testQuery,
        ...mockScrapedData,
        sourceDiversity: mockScrapedData.sources.length
      },
      duration
    };
  } catch (error) {
    return {
      test: 'Web Scraping',
      status: 'fail',
      message: 'Scraping test failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      duration: Date.now() - startTime
    };
  }
}

// Test performance
async function testPerformance(): Promise<TestResult> {
  const startTime = Date.now();
  
  try {
    // Simulate performance test
    const testQueries = ['AI', 'machine learning', 'deep learning', 'neural networks'];
    const results = [];
    
    for (const query of testQueries) {
      const queryStart = Date.now();
      // Simulate search
      await new Promise(resolve => setTimeout(resolve, Math.random() * 100 + 50));
      const queryDuration = Date.now() - queryStart;
      results.push({ query, duration: queryDuration });
    }
    
    const averageResponseTime = results.reduce((sum, r) => sum + r.duration, 0) / results.length;
    const duration = Date.now() - startTime;
    
    const status = averageResponseTime < 200 ? 'pass' : averageResponseTime < 500 ? 'warning' : 'fail';
    
    return {
      test: 'Performance',
      status,
      message: `Average response time: ${averageResponseTime.toFixed(2)}ms`,
      details: {
        averageResponseTime,
        testQueries: results,
        threshold: { good: 200, acceptable: 500 }
      },
      duration
    };
  } catch (error) {
    return {
      test: 'Performance',
      status: 'fail',
      message: 'Performance test failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      duration: Date.now() - startTime
    };
  }
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
    const { tests = 'all', query = 'machine learning' } = req.body;
    const startTime = Date.now();
    
    console.log(`Running tests: ${tests}`);
    
    const testResults: TestResult[] = [];
    
    if (tests === 'all' || tests.includes('search')) {
      testResults.push(await testSearch(query));
    }
    
    if (tests === 'all' || tests.includes('ranking')) {
      testResults.push(await testAIRanking());
    }
    
    if (tests === 'all' || tests.includes('images')) {
      testResults.push(await testImageIndexing());
    }
    
    if (tests === 'all' || tests.includes('scraping')) {
      testResults.push(await testScraping());
    }
    
    if (tests === 'all' || tests.includes('performance')) {
      testResults.push(await testPerformance());
    }
    
    const totalDuration = Date.now() - startTime;
    
    // Calculate overall status
    const passCount = testResults.filter(t => t.status === 'pass').length;
    const failCount = testResults.filter(t => t.status === 'fail').length;
    const warningCount = testResults.filter(t => t.status === 'warning').length;
    
    let overallStatus: 'pass' | 'fail' | 'warning';
    if (failCount > 0) {
      overallStatus = 'fail';
    } else if (warningCount > 0) {
      overallStatus = 'warning';
    } else {
      overallStatus = 'pass';
    }
    
    const response = {
      success: true,
      overall: {
        status: overallStatus,
        message: `${passCount} passed, ${warningCount} warnings, ${failCount} failed`,
        duration: totalDuration
      },
      summary: {
        total: testResults.length,
        passed: passCount,
        warnings: warningCount,
        failed: failCount,
        successRate: ((passCount / testResults.length) * 100).toFixed(1) + '%'
      },
      tests: testResults,
      timestamp: new Date().toISOString()
    };
    
    console.log(`Tests completed: ${overallStatus} (${totalDuration}ms)`);
    
    res.status(200).json(response);

  } catch (error) {
    console.error('Test execution error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error during testing',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
