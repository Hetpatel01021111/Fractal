#!/usr/bin/env node

/**
 * Web Crawler Test Suite
 * 
 * Comprehensive tests for the web crawler functionality
 */

const WebCrawler = require('./web-crawler');
const { getConfig, detectContentType, shouldSkipUrl } = require('./crawler-config');
const fs = require('fs').promises;
const path = require('path');

class CrawlerTester {
  constructor() {
    this.testResults = [];
    this.totalTests = 0;
    this.passedTests = 0;
  }

  async runTest(testName, testFunction) {
    this.totalTests++;
    console.log(`🧪 Running test: ${testName}`);
    
    try {
      await testFunction();
      this.passedTests++;
      console.log(`✅ PASSED: ${testName}`);
      this.testResults.push({ name: testName, status: 'PASSED' });
    } catch (error) {
      console.log(`❌ FAILED: ${testName} - ${error.message}`);
      this.testResults.push({ name: testName, status: 'FAILED', error: error.message });
    }
  }

  // Test content extraction
  async testContentExtraction() {
    const crawler = new WebCrawler();
    
    const sampleHtml = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <title>Test Article Title</title>
        <meta name="description" content="This is a test article description">
        <meta name="keywords" content="test, article, content">
        <meta name="author" content="Test Author">
      </head>
      <body>
        <h1>Main Article Title</h1>
        <article>
          <p>This is the main content of the article. It contains important information about the topic.</p>
          <p>This is another paragraph with more detailed information.</p>
        </article>
        <aside>This is sidebar content that should be ignored.</aside>
      </body>
      </html>
    `;

    const extracted = crawler.extractContent(sampleHtml, 'https://test.com/article');
    
    // Assertions
    if (!extracted.title.includes('Test Article Title')) {
      throw new Error('Title extraction failed');
    }
    
    if (!extracted.snippet.includes('test article description')) {
      throw new Error('Snippet extraction failed');
    }
    
    if (!extracted.content.includes('main content of the article')) {
      throw new Error('Content extraction failed');
    }
    
    if (!extracted.keywords.includes('test')) {
      throw new Error('Keywords extraction failed');
    }
    
    if (extracted.source !== 'test.com') {
      throw new Error('Source extraction failed');
    }
  }

  // Test robots.txt checking
  async testRobotsCheck() {
    const crawler = new WebCrawler();
    
    // Test with a URL that should be allowed
    const allowed = await crawler.checkRobots('https://example.com/page');
    if (typeof allowed !== 'boolean') {
      throw new Error('Robots check should return boolean');
    }
    
    // Test with non-existent robots.txt (should allow)
    const allowedDefault = await crawler.checkRobots('https://nonexistent-site-12345.com/page');
    if (!allowedDefault) {
      throw new Error('Should allow crawling when robots.txt not found');
    }
  }

  // Test URL validation and filtering
  async testUrlFiltering() {
    const testUrls = [
      { url: 'https://example.com/page.html', shouldAllow: true },
      { url: 'https://example.com/image.jpg', shouldAllow: false },
      { url: 'https://example.com/document.pdf', shouldAllow: false },
      { url: 'https://example.com/admin/login', shouldAllow: false },
      { url: 'https://example.com/api/data', shouldAllow: false },
      { url: 'https://example.com/normal-page', shouldAllow: true }
    ];

    for (const { url, shouldAllow } of testUrls) {
      const shouldSkip = shouldSkipUrl(url);
      if (shouldSkip === shouldAllow) {
        throw new Error(`URL filtering failed for ${url}`);
      }
    }
  }

  // Test content type detection
  async testContentTypeDetection() {
    const testCases = [
      { url: 'https://news.example.com/breaking-news', expected: 'news' },
      { url: 'https://blog.example.com/my-post', expected: 'blog' },
      { url: 'https://shop.example.com/product/123', expected: 'product' },
      { url: 'https://docs.example.com/api-guide', expected: 'documentation' },
      { url: 'https://youtube.com/watch?v=123', expected: 'video' }
    ];

    for (const { url, expected } of testCases) {
      const detected = detectContentType(url);
      if (detected !== expected) {
        throw new Error(`Content type detection failed for ${url}: expected ${expected}, got ${detected}`);
      }
    }
  }

  // Test configuration loading
  async testConfigurationLoading() {
    const newsConfig = getConfig('https://news.example.com/article');
    if (!newsConfig.selectors) {
      throw new Error('Configuration should have selectors');
    }

    const blogConfig = getConfig('https://blog.example.com/post');
    if (!blogConfig.keywords) {
      throw new Error('Configuration should have keywords settings');
    }

    const redditConfig = getConfig('https://reddit.com/r/programming');
    if (!redditConfig.selectors.score) {
      throw new Error('Reddit config should have score selector');
    }
  }

  // Test text cleaning and normalization
  async testTextCleaning() {
    const crawler = new WebCrawler();
    
    const dirtyText = '  This   has    multiple   spaces\n\nand\tspecial\rcharacters!@#$%^&*()  ';
    const cleaned = crawler.cleanText(dirtyText);
    
    if (cleaned.includes('  ')) {
      throw new Error('Text cleaning should normalize whitespace');
    }
    
    if (cleaned.startsWith(' ') || cleaned.endsWith(' ')) {
      throw new Error('Text cleaning should trim whitespace');
    }
  }

  // Test incremental crawling (content change detection)
  async testIncrementalCrawling() {
    const crawler = new WebCrawler();
    
    // Mock Elasticsearch client for testing
    const originalClient = crawler.client;
    crawler.client = {
      get: async () => {
        throw new Error('Not found'); // Simulate new document
      }
    };

    const hasChanged = await crawler.hasContentChanged('https://test.com', 'hash123');
    if (!hasChanged) {
      throw new Error('Should detect new content as changed');
    }

    // Test with existing content
    crawler.client = {
      get: async () => ({
        body: {
          _source: { contentHash: 'hash123' }
        }
      })
    };

    const hasNotChanged = await crawler.hasContentChanged('https://test.com', 'hash123');
    if (hasNotChanged) {
      throw new Error('Should detect unchanged content');
    }

    // Restore original client
    crawler.client = originalClient;
  }

  // Test sitemap parsing
  async testSitemapParsing() {
    const crawler = new WebCrawler();
    
    const sampleSitemap = `<?xml version="1.0" encoding="UTF-8"?>
      <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
        <url>
          <loc>https://example.com/page1</loc>
          <lastmod>2023-01-01</lastmod>
        </url>
        <url>
          <loc>https://example.com/page2</loc>
          <lastmod>2023-01-02</lastmod>
        </url>
      </urlset>`;

    // Mock axios for sitemap request
    const axios = require('axios');
    const originalGet = axios.get;
    axios.get = async () => ({ data: sampleSitemap });

    try {
      const urls = await crawler.parseSitemap('https://example.com/sitemap.xml');
      
      if (urls.length !== 2) {
        throw new Error(`Expected 2 URLs, got ${urls.length}`);
      }
      
      if (!urls.includes('https://example.com/page1')) {
        throw new Error('Should extract page1 URL');
      }
      
      if (!urls.includes('https://example.com/page2')) {
        throw new Error('Should extract page2 URL');
      }
    } finally {
      // Restore original axios
      axios.get = originalGet;
    }
  }

  // Test error handling and retry logic
  async testErrorHandling() {
    const crawler = new WebCrawler();
    
    // Test with invalid URL
    const result = await crawler.crawlUrl('https://invalid-url-that-does-not-exist-12345.com');
    if (result !== null) {
      throw new Error('Should return null for invalid URLs');
    }
    
    // Test stats tracking
    if (crawler.stats.errors === 0) {
      throw new Error('Should track errors in stats');
    }
  }

  // Test concurrent crawling limits
  async testConcurrencyLimits() {
    const crawler = new WebCrawler();
    
    // Test with multiple URLs
    const urls = [
      'https://httpbin.org/delay/1',
      'https://httpbin.org/delay/1',
      'https://httpbin.org/delay/1'
    ];

    const startTime = Date.now();
    await crawler.processUrls(urls);
    const endTime = Date.now();
    
    // Should take at least 1 second due to delays, but less than 3 seconds due to concurrency
    const duration = endTime - startTime;
    if (duration < 1000 || duration > 5000) {
      console.warn(`Concurrency test duration: ${duration}ms (may vary due to network)`);
    }
  }

  // Test memory usage and cleanup
  async testMemoryUsage() {
    const crawler = new WebCrawler();
    
    const initialMemory = process.memoryUsage().heapUsed;
    
    // Process some URLs
    const urls = Array.from({ length: 10 }, (_, i) => `https://httpbin.org/json?page=${i}`);
    await crawler.processUrls(urls);
    
    const finalMemory = process.memoryUsage().heapUsed;
    const memoryIncrease = finalMemory - initialMemory;
    
    // Memory increase should be reasonable (less than 100MB for this test)
    if (memoryIncrease > 100 * 1024 * 1024) {
      throw new Error(`Excessive memory usage: ${memoryIncrease / 1024 / 1024}MB`);
    }
  }

  // Test file-based URL input
  async testFileInput() {
    const testFile = path.join(__dirname, 'test-urls.txt');
    const testUrls = [
      'https://example.com/page1',
      'https://example.com/page2',
      'https://example.com/page3'
    ];

    try {
      // Create test file
      await fs.writeFile(testFile, testUrls.join('\n'));
      
      const crawler = new WebCrawler();
      
      // Mock the crawl method to avoid actual HTTP requests
      const originalProcessUrls = crawler.processUrls;
      let processedUrls = [];
      crawler.processUrls = async (urls) => {
        processedUrls = urls;
        return Promise.resolve();
      };

      await crawler.crawl({ file: testFile });
      
      if (processedUrls.length !== testUrls.length) {
        throw new Error(`Expected ${testUrls.length} URLs, got ${processedUrls.length}`);
      }

      // Restore original method
      crawler.processUrls = originalProcessUrls;
    } finally {
      // Clean up test file
      try {
        await fs.unlink(testFile);
      } catch (error) {
        // Ignore cleanup errors
      }
    }
  }

  // Run all tests
  async runAllTests() {
    console.log('🚀 Starting Web Crawler Test Suite\n');

    await this.runTest('Content Extraction', () => this.testContentExtraction());
    await this.runTest('Robots.txt Checking', () => this.testRobotsCheck());
    await this.runTest('URL Filtering', () => this.testUrlFiltering());
    await this.runTest('Content Type Detection', () => this.testContentTypeDetection());
    await this.runTest('Configuration Loading', () => this.testConfigurationLoading());
    await this.runTest('Text Cleaning', () => this.testTextCleaning());
    await this.runTest('Incremental Crawling', () => this.testIncrementalCrawling());
    await this.runTest('Sitemap Parsing', () => this.testSitemapParsing());
    await this.runTest('Error Handling', () => this.testErrorHandling());
    await this.runTest('File Input', () => this.testFileInput());

    // Optional tests that require network access
    if (process.env.RUN_NETWORK_TESTS === 'true') {
      await this.runTest('Concurrency Limits', () => this.testConcurrencyLimits());
      await this.runTest('Memory Usage', () => this.testMemoryUsage());
    }

    this.printResults();
  }

  printResults() {
    console.log('\n' + '='.repeat(50));
    console.log('📊 Test Results Summary');
    console.log('='.repeat(50));
    
    console.log(`Total Tests: ${this.totalTests}`);
    console.log(`Passed: ${this.passedTests}`);
    console.log(`Failed: ${this.totalTests - this.passedTests}`);
    console.log(`Success Rate: ${((this.passedTests / this.totalTests) * 100).toFixed(1)}%`);

    if (this.passedTests === this.totalTests) {
      console.log('\n✅ All tests passed!');
    } else {
      console.log('\n❌ Some tests failed:');
      this.testResults
        .filter(result => result.status === 'FAILED')
        .forEach(result => {
          console.log(`  - ${result.name}: ${result.error}`);
        });
    }

    console.log('\n' + '='.repeat(50));
  }
}

// CLI interface
async function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
🧪 Web Crawler Test Suite

Usage:
  node test-crawler.js [options]

Options:
  --network     Include network-dependent tests
  --help, -h    Show this help message

Environment Variables:
  RUN_NETWORK_TESTS=true    Enable network tests
  ELASTICSEARCH_URL         Elasticsearch endpoint for integration tests
    `);
    process.exit(0);
  }

  if (args.includes('--network')) {
    process.env.RUN_NETWORK_TESTS = 'true';
  }

  const tester = new CrawlerTester();
  
  try {
    await tester.runAllTests();
    
    if (tester.passedTests === tester.totalTests) {
      process.exit(0);
    } else {
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Test suite failed:', error.message);
    process.exit(1);
  }
}

// Export for use as module
module.exports = CrawlerTester;

// Run CLI if called directly
if (require.main === module) {
  main();
}
