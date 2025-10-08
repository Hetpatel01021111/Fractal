#!/usr/bin/env node

/**
 * Web Crawler Usage Examples
 * 
 * This file demonstrates various ways to use the web crawler
 * for different types of websites and content.
 */

const WebCrawler = require('../web-crawler');
const path = require('path');

// Example configurations for different use cases
const examples = {
  // Example 1: Crawl news websites
  async crawlNews() {
    console.log('🗞️  Example 1: Crawling News Websites');
    
    const crawler = new WebCrawler();
    const newsUrls = [
      'https://techcrunch.com/sitemap.xml',
      'https://www.bbc.com/news',
      'https://www.reuters.com/technology',
      'https://arstechnica.com'
    ];

    try {
      const stats = await crawler.crawl(newsUrls);
      console.log('News crawling completed:', stats);
    } catch (error) {
      console.error('News crawling failed:', error.message);
    }
  },

  // Example 2: Crawl blog content
  async crawlBlogs() {
    console.log('📝 Example 2: Crawling Blog Content');
    
    const crawler = new WebCrawler();
    const blogUrls = [
      'https://blog.openai.com',
      'https://ai.googleblog.com',
      'https://www.deepmind.com/blog',
      'https://blog.anthropic.com'
    ];

    try {
      const stats = await crawler.crawl(blogUrls);
      console.log('Blog crawling completed:', stats);
    } catch (error) {
      console.error('Blog crawling failed:', error.message);
    }
  },

  // Example 3: Crawl documentation sites
  async crawlDocs() {
    console.log('📚 Example 3: Crawling Documentation');
    
    const crawler = new WebCrawler();
    const docUrls = [
      'https://docs.python.org/3/',
      'https://nodejs.org/en/docs/',
      'https://reactjs.org/docs/',
      'https://www.elastic.co/guide/'
    ];

    try {
      const stats = await crawler.crawl(docUrls);
      console.log('Documentation crawling completed:', stats);
    } catch (error) {
      console.error('Documentation crawling failed:', error.message);
    }
  },

  // Example 4: Crawl from sitemap
  async crawlFromSitemap() {
    console.log('🗺️  Example 4: Crawling from Sitemap');
    
    const crawler = new WebCrawler();
    const sitemapUrl = 'https://example.com/sitemap.xml';

    try {
      const stats = await crawler.crawl(sitemapUrl);
      console.log('Sitemap crawling completed:', stats);
    } catch (error) {
      console.error('Sitemap crawling failed:', error.message);
    }
  },

  // Example 5: Crawl from URL file
  async crawlFromFile() {
    console.log('📄 Example 5: Crawling from URL File');
    
    // Create sample URL file
    const urlFile = path.join(__dirname, 'sample-urls.txt');
    const fs = require('fs').promises;
    
    const sampleUrls = [
      'https://example.com/page1',
      'https://example.com/page2',
      'https://example.com/page3',
      'https://another-site.com/article1',
      'https://another-site.com/article2'
    ].join('\n');

    try {
      await fs.writeFile(urlFile, sampleUrls);
      
      const crawler = new WebCrawler();
      const stats = await crawler.crawl({ file: urlFile });
      
      console.log('File-based crawling completed:', stats);
      
      // Clean up
      await fs.unlink(urlFile);
    } catch (error) {
      console.error('File-based crawling failed:', error.message);
    }
  },

  // Example 6: Custom configuration crawling
  async crawlWithCustomConfig() {
    console.log('⚙️  Example 6: Custom Configuration Crawling');
    
    // Set custom environment variables
    process.env.CRAWLER_CONCURRENT = '3';
    process.env.CRAWLER_DELAY = '2000';
    process.env.CRAWLER_MAX_PAGES = '50';
    process.env.CRAWLER_RESPECT_ROBOTS = 'true';
    process.env.LOG_LEVEL = 'debug';

    const crawler = new WebCrawler();
    const urls = [
      'https://example.com',
      'https://test-site.com'
    ];

    try {
      const stats = await crawler.crawl(urls);
      console.log('Custom config crawling completed:', stats);
    } catch (error) {
      console.error('Custom config crawling failed:', error.message);
    }
  },

  // Example 7: E-commerce product crawling
  async crawlEcommerce() {
    console.log('🛒 Example 7: E-commerce Product Crawling');
    
    const crawler = new WebCrawler();
    const ecommerceUrls = [
      'https://www.amazon.com/s?k=laptops',
      'https://www.ebay.com/sch/i.html?_nkw=smartphones',
      'https://www.etsy.com/search?q=handmade'
    ];

    try {
      const stats = await crawler.crawl(ecommerceUrls);
      console.log('E-commerce crawling completed:', stats);
    } catch (error) {
      console.error('E-commerce crawling failed:', error.message);
    }
  },

  // Example 8: Academic content crawling
  async crawlAcademic() {
    console.log('🎓 Example 8: Academic Content Crawling');
    
    const crawler = new WebCrawler();
    const academicUrls = [
      'https://arxiv.org/list/cs.AI/recent',
      'https://scholar.google.com/scholar?q=machine+learning',
      'https://www.nature.com/subjects/machine-learning'
    ];

    try {
      const stats = await crawler.crawl(academicUrls);
      console.log('Academic crawling completed:', stats);
    } catch (error) {
      console.error('Academic crawling failed:', error.message);
    }
  },

  // Example 9: Incremental crawling (only new/updated content)
  async incrementalCrawl() {
    console.log('🔄 Example 9: Incremental Crawling');
    
    const crawler = new WebCrawler();
    const urls = [
      'https://example.com/news',
      'https://example.com/blog'
    ];

    try {
      console.log('First crawl (full)...');
      let stats = await crawler.crawl(urls);
      console.log('First crawl completed:', stats);

      console.log('Second crawl (incremental)...');
      // The crawler automatically detects unchanged content
      stats = await crawler.crawl(urls);
      console.log('Incremental crawl completed:', stats);
    } catch (error) {
      console.error('Incremental crawling failed:', error.message);
    }
  },

  // Example 10: Batch processing with monitoring
  async batchCrawlWithMonitoring() {
    console.log('📊 Example 10: Batch Crawling with Monitoring');
    
    const crawler = new WebCrawler();
    
    // Large batch of URLs
    const batchUrls = [];
    for (let i = 1; i <= 100; i++) {
      batchUrls.push(`https://example.com/page${i}`);
    }

    try {
      // Monitor progress
      const startTime = Date.now();
      
      const stats = await crawler.crawl(batchUrls);
      
      const endTime = Date.now();
      const duration = (endTime - startTime) / 1000;
      
      console.log('Batch crawling completed:');
      console.log(`  Duration: ${duration}s`);
      console.log(`  Pages/second: ${(stats.processed / duration).toFixed(2)}`);
      console.log(`  Success rate: ${((stats.indexed / stats.processed) * 100).toFixed(1)}%`);
      console.log('  Stats:', stats);
    } catch (error) {
      console.error('Batch crawling failed:', error.message);
    }
  }
};

// CLI interface for running examples
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log(`
🕷️  Web Crawler Examples

Available examples:
  1. news         - Crawl news websites
  2. blogs        - Crawl blog content
  3. docs         - Crawl documentation sites
  4. sitemap      - Crawl from sitemap
  5. file         - Crawl from URL file
  6. custom       - Custom configuration
  7. ecommerce    - E-commerce products
  8. academic     - Academic content
  9. incremental  - Incremental crawling
  10. batch       - Batch processing with monitoring

Usage:
  node crawl-examples.js <example-name>
  node crawl-examples.js news
  node crawl-examples.js all    # Run all examples

Environment variables:
  ELASTICSEARCH_URL=http://localhost:9200
  ELASTICSEARCH_API_KEY=your-api-key
  CRAWLER_INDEX=web-content
    `);
    process.exit(1);
  }

  const exampleName = args[0];

  try {
    if (exampleName === 'all') {
      console.log('🚀 Running all examples...\n');
      for (const [name, func] of Object.entries(examples)) {
        console.log(`\n${'='.repeat(50)}`);
        await func();
        console.log(`${'='.repeat(50)}\n`);
        
        // Wait between examples
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    } else {
      const exampleMap = {
        'news': examples.crawlNews,
        'blogs': examples.crawlBlogs,
        'docs': examples.crawlDocs,
        'sitemap': examples.crawlFromSitemap,
        'file': examples.crawlFromFile,
        'custom': examples.crawlWithCustomConfig,
        'ecommerce': examples.crawlEcommerce,
        'academic': examples.crawlAcademic,
        'incremental': examples.incrementalCrawl,
        'batch': examples.batchCrawlWithMonitoring
      };

      const exampleFunc = exampleMap[exampleName];
      if (!exampleFunc) {
        console.error(`❌ Unknown example: ${exampleName}`);
        process.exit(1);
      }

      await exampleFunc();
    }

    console.log('\n✅ Examples completed successfully!');
  } catch (error) {
    console.error('❌ Example failed:', error.message);
    process.exit(1);
  }
}

// Export examples for use as module
module.exports = examples;

// Run CLI if called directly
if (require.main === module) {
  main();
}
