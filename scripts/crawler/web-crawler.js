#!/usr/bin/env node

/**
 * AI-Powered Search Engine - Web Crawler
 * 
 * A comprehensive web crawler that extracts and indexes web content
 * into Elasticsearch with support for incremental crawling.
 * 
 * Features:
 * - URL list and sitemap support
 * - Content extraction and normalization
 * - Incremental crawling with change detection
 * - Rate limiting and politeness
 * - Error handling and retry logic
 * - Multiple content types support
 */

const axios = require('axios');
const cheerio = require('cheerio');
const { URL } = require('url');
const fs = require('fs').promises;
const path = require('path');
const crypto = require('crypto');
const { Client } = require('@elastic/elasticsearch');
const robotsParser = require('robots-parser');
const sitemap = require('sitemap-stream-parser');
const { createReadStream } = require('fs');
const { pipeline } = require('stream/promises');

// Configuration
const CONFIG = {
  // Elasticsearch configuration
  elasticsearch: {
    node: process.env.ELASTICSEARCH_URL || 'http://localhost:9200',
    auth: process.env.ELASTICSEARCH_API_KEY ? {
      apiKey: process.env.ELASTICSEARCH_API_KEY
    } : undefined,
    index: process.env.CRAWLER_INDEX || 'web-content'
  },
  
  // Crawler settings
  crawler: {
    maxConcurrent: parseInt(process.env.CRAWLER_CONCURRENT) || 5,
    delayMs: parseInt(process.env.CRAWLER_DELAY) || 1000,
    timeout: parseInt(process.env.CRAWLER_TIMEOUT) || 30000,
    maxRetries: parseInt(process.env.CRAWLER_RETRIES) || 3,
    userAgent: process.env.CRAWLER_USER_AGENT || 'AI-Search-Crawler/1.0',
    respectRobots: process.env.CRAWLER_RESPECT_ROBOTS !== 'false',
    maxDepth: parseInt(process.env.CRAWLER_MAX_DEPTH) || 3,
    maxPages: parseInt(process.env.CRAWLER_MAX_PAGES) || 1000
  },
  
  // Content extraction
  content: {
    maxContentLength: parseInt(process.env.CRAWLER_MAX_CONTENT) || 50000,
    minContentLength: parseInt(process.env.CRAWLER_MIN_CONTENT) || 100,
    snippetLength: parseInt(process.env.CRAWLER_SNIPPET_LENGTH) || 300,
    keywordLimit: parseInt(process.env.CRAWLER_KEYWORD_LIMIT) || 20
  },
  
  // Storage
  storage: {
    cacheDir: process.env.CRAWLER_CACHE_DIR || './crawler-cache',
    logLevel: process.env.LOG_LEVEL || 'info'
  }
};

class WebCrawler {
  constructor() {
    this.client = new Client(CONFIG.elasticsearch);
    this.visitedUrls = new Set();
    this.robotsCache = new Map();
    this.urlQueue = [];
    this.stats = {
      processed: 0,
      indexed: 0,
      skipped: 0,
      errors: 0,
      startTime: Date.now()
    };
    
    this.setupCache();
  }

  async setupCache() {
    try {
      await fs.mkdir(CONFIG.storage.cacheDir, { recursive: true });
      this.log('info', `Cache directory created: ${CONFIG.storage.cacheDir}`);
    } catch (error) {
      this.log('error', `Failed to create cache directory: ${error.message}`);
    }
  }

  log(level, message, data = {}) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      message,
      ...data
    };
    
    if (level === 'error' || CONFIG.storage.logLevel === 'debug') {
      console.log(JSON.stringify(logEntry, null, 2));
    } else if (level === 'info' && CONFIG.storage.logLevel !== 'silent') {
      console.log(`[${timestamp}] ${message}`);
    }
  }

  /**
   * Initialize Elasticsearch index with optimized mappings
   */
  async initializeIndex() {
    try {
      const indexExists = await this.client.indices.exists({
        index: CONFIG.elasticsearch.index
      });

      if (!indexExists) {
        await this.client.indices.create({
          index: CONFIG.elasticsearch.index,
          body: {
            settings: {
              number_of_shards: 1,
              number_of_replicas: 0,
              analysis: {
                analyzer: {
                  content_analyzer: {
                    type: 'custom',
                    tokenizer: 'standard',
                    filter: ['lowercase', 'stop', 'stemmer', 'keyword_filter']
                  },
                  keyword_analyzer: {
                    type: 'custom',
                    tokenizer: 'keyword',
                    filter: ['lowercase', 'trim']
                  }
                },
                filter: {
                  keyword_filter: {
                    type: 'keyword_marker',
                    keywords: ['AI', 'API', 'URL', 'HTML', 'CSS', 'JS']
                  }
                }
              }
            },
            mappings: {
              properties: {
                title: {
                  type: 'text',
                  analyzer: 'content_analyzer',
                  fields: {
                    keyword: { type: 'keyword' },
                    suggest: { type: 'completion' }
                  }
                },
                url: { type: 'keyword' },
                snippet: {
                  type: 'text',
                  analyzer: 'content_analyzer'
                },
                keywords: {
                  type: 'keyword',
                  fields: {
                    text: { type: 'text', analyzer: 'keyword_analyzer' }
                  }
                },
                content: {
                  type: 'text',
                  analyzer: 'content_analyzer'
                },
                source: { type: 'keyword' },
                domain: { type: 'keyword' },
                contentType: { type: 'keyword' },
                language: { type: 'keyword' },
                publishDate: { type: 'date' },
                lastModified: { type: 'date' },
                crawledAt: { type: 'date' },
                contentHash: { type: 'keyword' },
                wordCount: { type: 'integer' },
                readingTime: { type: 'integer' },
                metadata: {
                  type: 'object',
                  properties: {
                    author: { type: 'text' },
                    description: { type: 'text' },
                    image: { type: 'keyword' },
                    canonical: { type: 'keyword' },
                    robots: { type: 'keyword' }
                  }
                }
              }
            }
          }
        });
        
        this.log('info', `Created Elasticsearch index: ${CONFIG.elasticsearch.index}`);
      }
    } catch (error) {
      this.log('error', 'Failed to initialize Elasticsearch index', { error: error.message });
      throw error;
    }
  }

  /**
   * Check if URL should be crawled based on robots.txt
   */
  async checkRobots(url) {
    if (!CONFIG.crawler.respectRobots) return true;

    try {
      const urlObj = new URL(url);
      const robotsUrl = `${urlObj.protocol}//${urlObj.host}/robots.txt`;
      
      if (!this.robotsCache.has(robotsUrl)) {
        const response = await axios.get(robotsUrl, {
          timeout: 5000,
          validateStatus: status => status < 500
        });
        
        if (response.status === 200) {
          const robots = robotsParser(robotsUrl, response.data);
          this.robotsCache.set(robotsUrl, robots);
        } else {
          this.robotsCache.set(robotsUrl, null); // Allow crawling if robots.txt not found
        }
      }

      const robots = this.robotsCache.get(robotsUrl);
      if (!robots) return true;

      return robots.isAllowed(url, CONFIG.crawler.userAgent);
    } catch (error) {
      this.log('debug', 'Robots.txt check failed, allowing crawl', { url, error: error.message });
      return true; // Allow crawling if robots.txt check fails
    }
  }

  /**
   * Extract content from HTML
   */
  extractContent(html, url) {
    const $ = cheerio.load(html);
    
    // Remove unwanted elements
    $('script, style, nav, header, footer, aside, .advertisement, .ads, .social-share').remove();
    
    // Extract basic information
    const title = this.extractTitle($);
    const snippet = this.extractSnippet($);
    const keywords = this.extractKeywords($);
    const content = this.extractMainContent($);
    const metadata = this.extractMetadata($, url);
    
    // Calculate additional metrics
    const wordCount = content.split(/\s+/).length;
    const readingTime = Math.ceil(wordCount / 200); // Average reading speed
    
    // Generate content hash for change detection
    const contentHash = crypto
      .createHash('md5')
      .update(title + content + snippet)
      .digest('hex');

    return {
      title: this.cleanText(title),
      url,
      snippet: this.cleanText(snippet),
      keywords: keywords.map(k => this.cleanText(k)),
      content: this.cleanText(content),
      source: new URL(url).hostname,
      domain: new URL(url).hostname,
      contentType: this.detectContentType($, url),
      language: this.detectLanguage($),
      publishDate: this.extractPublishDate($),
      lastModified: new Date().toISOString(),
      crawledAt: new Date().toISOString(),
      contentHash,
      wordCount,
      readingTime,
      metadata
    };
  }

  extractTitle($) {
    return $('title').text() ||
           $('h1').first().text() ||
           $('meta[property="og:title"]').attr('content') ||
           $('meta[name="twitter:title"]').attr('content') ||
           'Untitled';
  }

  extractSnippet($) {
    const metaDescription = $('meta[name="description"]').attr('content') ||
                           $('meta[property="og:description"]').attr('content') ||
                           $('meta[name="twitter:description"]').attr('content');
    
    if (metaDescription) {
      return metaDescription.substring(0, CONFIG.content.snippetLength);
    }

    // Extract from first paragraph
    const firstParagraph = $('p').first().text();
    if (firstParagraph) {
      return firstParagraph.substring(0, CONFIG.content.snippetLength);
    }

    // Fallback to body text
    const bodyText = $('body').text().replace(/\s+/g, ' ').trim();
    return bodyText.substring(0, CONFIG.content.snippetLength);
  }

  extractKeywords($) {
    const keywords = new Set();
    
    // Meta keywords
    const metaKeywords = $('meta[name="keywords"]').attr('content');
    if (metaKeywords) {
      metaKeywords.split(',').forEach(keyword => {
        keywords.add(keyword.trim().toLowerCase());
      });
    }

    // Extract from headings
    $('h1, h2, h3').each((_, element) => {
      const text = $(element).text().trim();
      if (text.length > 2 && text.length < 50) {
        keywords.add(text.toLowerCase());
      }
    });

    // Extract from strong/em tags
    $('strong, em, b').each((_, element) => {
      const text = $(element).text().trim();
      if (text.length > 2 && text.length < 30) {
        keywords.add(text.toLowerCase());
      }
    });

    return Array.from(keywords).slice(0, CONFIG.content.keywordLimit);
  }

  extractMainContent($) {
    // Try to find main content area
    const contentSelectors = [
      'article',
      'main',
      '.content',
      '.post-content',
      '.entry-content',
      '.article-content',
      '#content',
      '.main-content'
    ];

    for (const selector of contentSelectors) {
      const content = $(selector).text();
      if (content && content.length > CONFIG.content.minContentLength) {
        return content.substring(0, CONFIG.content.maxContentLength);
      }
    }

    // Fallback to body content
    const bodyContent = $('body').text();
    return bodyContent.substring(0, CONFIG.content.maxContentLength);
  }

  extractMetadata($, url) {
    return {
      author: $('meta[name="author"]').attr('content') ||
              $('meta[property="article:author"]').attr('content') ||
              $('.author').first().text() || null,
      
      description: $('meta[name="description"]').attr('content') || null,
      
      image: $('meta[property="og:image"]').attr('content') ||
             $('meta[name="twitter:image"]').attr('content') || null,
      
      canonical: $('link[rel="canonical"]').attr('href') || url,
      
      robots: $('meta[name="robots"]').attr('content') || null
    };
  }

  detectContentType($, url) {
    // Check for specific content types
    if ($('article').length > 0) return 'article';
    if ($('.product, .product-page').length > 0) return 'product';
    if ($('.blog-post, .post').length > 0) return 'blog';
    if (url.includes('youtube.com') || url.includes('youtu.be')) return 'video';
    if ($('nav, .navigation').length > 5) return 'navigation';
    
    return 'webpage';
  }

  detectLanguage($) {
    return $('html').attr('lang') || 
           $('meta[http-equiv="content-language"]').attr('content') || 
           'en';
  }

  extractPublishDate($) {
    const dateSelectors = [
      'meta[property="article:published_time"]',
      'meta[name="date"]',
      'meta[name="publish-date"]',
      'time[datetime]',
      '.publish-date',
      '.date'
    ];

    for (const selector of dateSelectors) {
      const dateStr = $(selector).attr('content') || $(selector).attr('datetime') || $(selector).text();
      if (dateStr) {
        const date = new Date(dateStr);
        if (!isNaN(date.getTime())) {
          return date.toISOString();
        }
      }
    }

    return null;
  }

  cleanText(text) {
    if (!text) return '';
    
    return text
      .replace(/\s+/g, ' ')           // Normalize whitespace
      .replace(/[^\w\s\-.,!?]/g, '')  // Remove special characters
      .trim()
      .substring(0, text.length > 1000 ? 1000 : text.length);
  }

  /**
   * Check if content has changed since last crawl
   */
  async hasContentChanged(url, contentHash) {
    try {
      const response = await this.client.get({
        index: CONFIG.elasticsearch.index,
        id: Buffer.from(url).toString('base64')
      });

      return response.body._source.contentHash !== contentHash;
    } catch (error) {
      // Document doesn't exist, so it's new content
      return true;
    }
  }

  /**
   * Crawl a single URL
   */
  async crawlUrl(url, depth = 0) {
    if (this.visitedUrls.has(url) || depth > CONFIG.crawler.maxDepth) {
      return null;
    }

    this.visitedUrls.add(url);

    try {
      // Check robots.txt
      const robotsAllowed = await this.checkRobots(url);
      if (!robotsAllowed) {
        this.log('info', 'Blocked by robots.txt', { url });
        this.stats.skipped++;
        return null;
      }

      // Add delay for politeness
      if (this.stats.processed > 0) {
        await new Promise(resolve => setTimeout(resolve, CONFIG.crawler.delayMs));
      }

      this.log('info', `Crawling: ${url}`);

      const response = await axios.get(url, {
        timeout: CONFIG.crawler.timeout,
        headers: {
          'User-Agent': CONFIG.crawler.userAgent,
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
          'Accept-Encoding': 'gzip, deflate',
          'Connection': 'keep-alive'
        },
        maxRedirects: 5,
        validateStatus: status => status < 400
      });

      if (!response.headers['content-type']?.includes('text/html')) {
        this.log('info', 'Skipping non-HTML content', { url, contentType: response.headers['content-type'] });
        this.stats.skipped++;
        return null;
      }

      const extractedData = this.extractContent(response.data, url);
      
      // Check if content has changed
      const hasChanged = await this.hasContentChanged(url, extractedData.contentHash);
      if (!hasChanged) {
        this.log('info', 'Content unchanged, skipping', { url });
        this.stats.skipped++;
        return null;
      }

      // Index the document
      await this.indexDocument(extractedData);
      
      this.stats.processed++;
      this.stats.indexed++;
      
      this.log('info', `Successfully crawled and indexed: ${url}`);
      
      return extractedData;

    } catch (error) {
      this.stats.errors++;
      this.log('error', `Failed to crawl ${url}`, { error: error.message });
      return null;
    }
  }

  /**
   * Index document in Elasticsearch
   */
  async indexDocument(document) {
    try {
      const documentId = Buffer.from(document.url).toString('base64');
      
      await this.client.index({
        index: CONFIG.elasticsearch.index,
        id: documentId,
        body: document
      });

      this.log('debug', 'Document indexed', { url: document.url, id: documentId });
    } catch (error) {
      this.log('error', 'Failed to index document', { 
        url: document.url, 
        error: error.message 
      });
      throw error;
    }
  }

  /**
   * Parse sitemap and extract URLs
   */
  async parseSitemap(sitemapUrl) {
    const urls = [];
    
    try {
      this.log('info', `Parsing sitemap: ${sitemapUrl}`);
      
      const response = await axios.get(sitemapUrl, {
        timeout: CONFIG.crawler.timeout,
        headers: { 'User-Agent': CONFIG.crawler.userAgent }
      });

      const $ = cheerio.load(response.data, { xmlMode: true });
      
      $('url > loc').each((_, element) => {
        const url = $(element).text().trim();
        if (url) {
          urls.push(url);
        }
      });

      // Handle sitemap index files
      $('sitemap > loc').each((_, element) => {
        const sitemapUrl = $(element).text().trim();
        if (sitemapUrl) {
          urls.push(sitemapUrl);
        }
      });

      this.log('info', `Found ${urls.length} URLs in sitemap`);
      return urls;
    } catch (error) {
      this.log('error', `Failed to parse sitemap: ${sitemapUrl}`, { error: error.message });
      return [];
    }
  }

  /**
   * Process URLs with concurrency control
   */
  async processUrls(urls) {
    const semaphore = new Array(CONFIG.crawler.maxConcurrent).fill(null);
    let urlIndex = 0;

    const processNext = async () => {
      while (urlIndex < urls.length && urlIndex < CONFIG.crawler.maxPages) {
        const url = urls[urlIndex++];
        
        try {
          await this.crawlUrl(url);
        } catch (error) {
          this.log('error', `Error processing URL: ${url}`, { error: error.message });
        }

        // Progress update
        if (urlIndex % 10 === 0) {
          this.printProgress();
        }
      }
    };

    // Start concurrent workers
    await Promise.all(semaphore.map(() => processNext()));
  }

  /**
   * Print crawling progress
   */
  printProgress() {
    const elapsed = (Date.now() - this.stats.startTime) / 1000;
    const rate = this.stats.processed / elapsed;
    
    console.log(`\n📊 Crawling Progress:`);
    console.log(`   Processed: ${this.stats.processed}`);
    console.log(`   Indexed: ${this.stats.indexed}`);
    console.log(`   Skipped: ${this.stats.skipped}`);
    console.log(`   Errors: ${this.stats.errors}`);
    console.log(`   Rate: ${rate.toFixed(2)} pages/sec`);
    console.log(`   Elapsed: ${elapsed.toFixed(0)}s\n`);
  }

  /**
   * Main crawling method
   */
  async crawl(input) {
    try {
      await this.initializeIndex();
      
      let urls = [];

      if (Array.isArray(input)) {
        // Direct URL list
        urls = input;
      } else if (typeof input === 'string') {
        if (input.includes('sitemap') || input.endsWith('.xml')) {
          // Sitemap URL
          urls = await this.parseSitemap(input);
        } else {
          // Single URL
          urls = [input];
        }
      } else if (input.file) {
        // URL file
        const fileContent = await fs.readFile(input.file, 'utf8');
        urls = fileContent.split('\n').filter(url => url.trim());
      }

      if (urls.length === 0) {
        throw new Error('No URLs to crawl');
      }

      this.log('info', `Starting crawl of ${urls.length} URLs`);
      this.stats.startTime = Date.now();

      await this.processUrls(urls);

      this.printProgress();
      this.log('info', 'Crawling completed successfully');

      return this.stats;
    } catch (error) {
      this.log('error', 'Crawling failed', { error: error.message });
      throw error;
    }
  }
}

// CLI Interface
async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log(`
🕷️  AI-Powered Search Engine - Web Crawler

Usage:
  node web-crawler.js <urls|sitemap|file>

Examples:
  # Single URL
  node web-crawler.js "https://example.com"
  
  # Multiple URLs
  node web-crawler.js "https://site1.com" "https://site2.com"
  
  # Sitemap
  node web-crawler.js "https://example.com/sitemap.xml"
  
  # URL file
  node web-crawler.js --file urls.txt

Environment Variables:
  ELASTICSEARCH_URL          - Elasticsearch endpoint
  ELASTICSEARCH_API_KEY      - Elasticsearch API key
  CRAWLER_CONCURRENT         - Max concurrent requests (default: 5)
  CRAWLER_DELAY             - Delay between requests in ms (default: 1000)
  CRAWLER_MAX_PAGES         - Maximum pages to crawl (default: 1000)
  CRAWLER_RESPECT_ROBOTS    - Respect robots.txt (default: true)
  LOG_LEVEL                 - Logging level (debug|info|silent)
    `);
    process.exit(1);
  }

  const crawler = new WebCrawler();
  
  try {
    let input;
    
    if (args[0] === '--file') {
      input = { file: args[1] };
    } else if (args.length === 1) {
      input = args[0];
    } else {
      input = args;
    }

    const stats = await crawler.crawl(input);
    
    console.log('\n✅ Crawling completed!');
    console.log(`📊 Final Stats:`, stats);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Crawling failed:', error.message);
    process.exit(1);
  }
}

// Export for use as module
module.exports = WebCrawler;

// Run CLI if called directly
if (require.main === module) {
  main();
}
