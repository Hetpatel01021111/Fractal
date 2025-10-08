#!/usr/bin/env ts-node

import { Command } from 'commander';
import dotenv from 'dotenv';
import path from 'path';
import axios from 'axios';
import * as cheerio from 'cheerio';
import { URL } from 'url';
import { ElasticsearchService, SearchDocument } from './services/ElasticsearchService';
import { GeminiService } from './services/GeminiService';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../.env') });

const program = new Command();

// Interfaces for different data sources
interface NewsAPIArticle {
  title: string;
  description: string;
  content: string;
  url: string;
  urlToImage?: string;
  publishedAt: string;
  source: {
    id: string;
    name: string;
  };
  author?: string;
}

interface WebPageData {
  title: string;
  content: string;
  url: string;
  author?: string;
  publishDate?: string;
  description?: string;
  keywords?: string[];
}

interface IngestionSource {
  type: 'url' | 'newsapi' | 'rss' | 'json';
  source: string;
  options?: {
    apiKey?: string;
    category?: string;
    country?: string;
    language?: string;
    query?: string;
  };
}

interface IngestionStats {
  processed: number;
  successful: number;
  failed: number;
  startTime: Date;
  endTime?: Date;
  sources: string[];
}

class DataIngestionService {
  private elasticsearchService: ElasticsearchService;
  private geminiService: GeminiService;
  private stats: IngestionStats;

  constructor() {
    this.elasticsearchService = new ElasticsearchService();
    this.geminiService = new GeminiService();
    this.stats = {
      processed: 0,
      successful: 0,
      failed: 0,
      startTime: new Date(),
      sources: [],
    };
  }

  async initialize(): Promise<void> {
    console.log('🚀 Initializing Data Ingestion Service...');
    
    try {
      await this.elasticsearchService.initialize();
      console.log('✅ Elasticsearch connected');
      
      await this.geminiService.initialize();
      console.log('✅ Gemini AI initialized');
      
      console.log('✅ All services initialized successfully\n');
    } catch (error) {
      console.error('❌ Failed to initialize services:', error);
      throw error;
    }
  }

  /**
   * Ingest data from NewsAPI
   */
  async ingestFromNewsAPI(options: {
    apiKey: string;
    query?: string;
    category?: string;
    country?: string;
    language?: string;
    pageSize?: number;
  }): Promise<void> {
    console.log('📰 Fetching data from NewsAPI...');
    
    try {
      const params: any = {
        apiKey: options.apiKey,
        pageSize: options.pageSize || 20,
        sortBy: 'publishedAt',
      };

      let endpoint = 'https://newsapi.org/v2/everything';
      
      if (options.query) {
        params.q = options.query;
      } else {
        endpoint = 'https://newsapi.org/v2/top-headlines';
        if (options.category) params.category = options.category;
        if (options.country) params.country = options.country;
        if (options.language) params.language = options.language;
      }

      const response = await axios.get(endpoint, { params });
      const articles: NewsAPIArticle[] = response.data.articles;

      console.log(`📄 Found ${articles.length} articles from NewsAPI`);
      
      for (const article of articles) {
        await this.processNewsArticle(article);
      }

      this.stats.sources.push(`NewsAPI (${articles.length} articles)`);
    } catch (error) {
      console.error('❌ Failed to fetch from NewsAPI:', error);
      throw error;
    }
  }

  /**
   * Ingest data from URLs (web scraping)
   */
  async ingestFromURLs(urls: string[]): Promise<void> {
    console.log(`🌐 Scraping ${urls.length} URLs...`);
    
    for (const url of urls) {
      try {
        console.log(`🔍 Scraping: ${url}`);
        const webPageData = await this.scrapeWebPage(url);
        await this.processWebPage(webPageData);
        this.stats.sources.push(`URL: ${url}`);
      } catch (error) {
        console.error(`❌ Failed to scrape ${url}:`, error);
        this.stats.failed++;
      }
    }
  }

  /**
   * Ingest data from RSS feeds
   */
  async ingestFromRSS(rssUrl: string): Promise<void> {
    console.log(`📡 Fetching RSS feed: ${rssUrl}`);
    
    try {
      const response = await axios.get(rssUrl);
      const $ = cheerio.load(response.data, { xmlMode: true });
      
      const items = $('item');
      console.log(`📄 Found ${items.length} items in RSS feed`);
      
      for (let i = 0; i < items.length; i++) {
        const item = $(items[i]);
        const title = item.find('title').text();
        const link = item.find('link').text();
        const description = item.find('description').text();
        const pubDate = item.find('pubDate').text();
        const author = item.find('author').text() || item.find('dc\\:creator').text();
        
        if (title && description) {
          const webPageData: WebPageData = {
            title: this.cleanText(title),
            content: this.cleanText(description),
            url: link,
            author: author || undefined,
            publishDate: pubDate || undefined,
          };
          
          await this.processWebPage(webPageData);
        }
      }
      
      this.stats.sources.push(`RSS: ${rssUrl} (${items.length} items)`);
    } catch (error) {
      console.error(`❌ Failed to fetch RSS feed ${rssUrl}:`, error);
      throw error;
    }
  }

  /**
   * Ingest data from JSON file or API endpoint
   */
  async ingestFromJSON(source: string): Promise<void> {
    console.log(`📋 Processing JSON source: ${source}`);
    
    try {
      let data: any;
      
      if (source.startsWith('http')) {
        // Fetch from API endpoint
        const response = await axios.get(source);
        data = response.data;
      } else {
        // Read from local file
        const fs = await import('fs-extra');
        const content = await fs.readFile(source, 'utf-8');
        data = JSON.parse(content);
      }
      
      // Handle different JSON structures
      let documents: any[] = [];
      
      if (Array.isArray(data)) {
        documents = data;
      } else if (data.articles) {
        documents = data.articles; // NewsAPI format
      } else if (data.items) {
        documents = data.items; // Generic items format
      } else if (data.data) {
        documents = data.data; // Generic data format
      } else {
        documents = [data]; // Single document
      }
      
      console.log(`📄 Found ${documents.length} documents in JSON`);
      
      for (const doc of documents) {
        await this.processJSONDocument(doc);
      }
      
      this.stats.sources.push(`JSON: ${source} (${documents.length} documents)`);
    } catch (error) {
      console.error(`❌ Failed to process JSON source ${source}:`, error);
      throw error;
    }
  }

  /**
   * Process a single NewsAPI article
   */
  private async processNewsArticle(article: NewsAPIArticle): Promise<void> {
    try {
      this.stats.processed++;
      
      // Clean and preprocess text
      const title = this.cleanText(article.title);
      const content = this.cleanText(article.content || article.description || '');
      
      if (!title || !content) {
        console.warn(`⚠️  Skipping article with missing title or content: ${article.url}`);
        return;
      }
      
      // Generate embedding (with fallback if quota exceeded)
      let embedding: number[] | undefined;
      try {
        const embeddingText = `${title} ${content}`.substring(0, 2000);
        embedding = await this.geminiService.generateEmbedding(embeddingText);
      } catch (error) {
        console.warn(`⚠️  Embedding generation failed, indexing without embeddings: ${error}`);
        embedding = undefined;
      }
      
      // Create document
      const document: SearchDocument = {
        id: this.generateDocumentId(article.url),
        title,
        content,
        url: article.url,
        embedding,
        metadata: {
          author: article.author || article.source.name,
          date: article.publishedAt,
          category: 'News',
          source: article.source.name,
          tags: this.extractTags(content),
          language: 'en',
        },
      };
      
      // Index document
      await this.elasticsearchService.indexDocument(document);
      this.stats.successful++;
      
      console.log(`✅ Indexed: ${title.substring(0, 50)}...`);
    } catch (error) {
      console.error(`❌ Failed to process article: ${article.title}`, error);
      this.stats.failed++;
    }
  }

  /**
   * Process a scraped web page
   */
  private async processWebPage(webPageData: WebPageData): Promise<void> {
    try {
      this.stats.processed++;
      
      const { title, content, url, author, publishDate, description } = webPageData;
      
      if (!title || !content) {
        console.warn(`⚠️  Skipping page with missing title or content: ${url}`);
        return;
      }
      
      // Generate embedding (with fallback if quota exceeded)
      let embedding: number[] | undefined;
      try {
        const embeddingText = `${title} ${content}`.substring(0, 2000);
        embedding = await this.geminiService.generateEmbedding(embeddingText);
      } catch (error) {
        console.warn(`⚠️  Embedding generation failed, indexing without embeddings: ${error}`);
        embedding = undefined;
      }
      
      // Create document
      const document: SearchDocument = {
        id: this.generateDocumentId(url),
        title,
        content,
        url,
        embedding,
        metadata: {
          author,
          date: publishDate || new Date().toISOString(),
          category: 'Web',
          source: new URL(url).hostname,
          tags: this.extractTags(content),
          description,
        },
      };
      
      // Index document
      await this.elasticsearchService.indexDocument(document);
      this.stats.successful++;
      
      console.log(`✅ Indexed: ${title.substring(0, 50)}...`);
    } catch (error) {
      console.error(`❌ Failed to process web page: ${webPageData.url}`, error);
      this.stats.failed++;
    }
  }

  /**
   * Process a JSON document
   */
  private async processJSONDocument(doc: any): Promise<void> {
    try {
      this.stats.processed++;
      
      // Extract fields with flexible mapping
      const title = doc.title || doc.name || doc.headline || 'Untitled';
      const content = doc.content || doc.body || doc.text || doc.description || '';
      const url = doc.url || doc.link || doc.id || `json-doc-${Date.now()}`;
      
      if (!title || !content) {
        console.warn(`⚠️  Skipping document with missing title or content`);
        return;
      }
      
      // Clean text
      const cleanTitle = this.cleanText(title);
      const cleanContent = this.cleanText(content);
      
      // Generate embedding (with fallback if quota exceeded)
      let embedding: number[] | undefined;
      try {
        const embeddingText = `${cleanTitle} ${cleanContent}`.substring(0, 2000);
        embedding = await this.geminiService.generateEmbedding(embeddingText);
      } catch (error) {
        console.warn(`⚠️  Embedding generation failed, indexing without embeddings: ${error}`);
        embedding = undefined;
      }
      
      // Create document
      const document: SearchDocument = {
        id: this.generateDocumentId(url),
        title: cleanTitle,
        content: cleanContent,
        url: typeof url === 'string' ? url : undefined,
        embedding,
        metadata: {
          author: doc.author || doc.creator,
          date: doc.date || doc.publishedAt || doc.created || new Date().toISOString(),
          category: doc.category || doc.type || 'JSON',
          source: doc.source || 'JSON Import',
          tags: doc.tags || this.extractTags(cleanContent),
          language: doc.language || 'en',
        },
      };
      
      // Index document
      await this.elasticsearchService.indexDocument(document);
      this.stats.successful++;
      
      console.log(`✅ Indexed: ${cleanTitle.substring(0, 50)}...`);
    } catch (error) {
      console.error(`❌ Failed to process JSON document:`, error);
      this.stats.failed++;
    }
  }

  /**
   * Scrape a web page and extract content
   */
  private async scrapeWebPage(url: string): Promise<WebPageData> {
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; AI-Search-Bot/1.0)',
      },
      timeout: 10000,
    });
    
    const $ = cheerio.load(response.data);
    
    // Remove unwanted elements
    $('script, style, nav, header, footer, aside, .advertisement, .ads').remove();
    
    // Extract title
    const title = $('title').text() || 
                 $('h1').first().text() || 
                 $('meta[property="og:title"]').attr('content') || 
                 'No Title';
    
    // Extract main content
    let content = '';
    const contentSelectors = [
      'main', 'article', '.content', '#content', '.post', '.entry-content',
      '.article-body', '.story-body', '.post-content'
    ];
    
    for (const selector of contentSelectors) {
      const element = $(selector);
      if (element.length > 0 && element.text().trim().length > 100) {
        content = element.text();
        break;
      }
    }
    
    // Fallback to body content
    if (!content || content.length < 100) {
      content = $('body').text();
    }
    
    // Extract metadata
    const author = $('meta[name="author"]').attr('content') || 
                  $('meta[property="article:author"]').attr('content') ||
                  $('.author').first().text();
    
    const publishDate = $('meta[property="article:published_time"]').attr('content') ||
                       $('meta[name="date"]').attr('content') ||
                       $('time').attr('datetime');
    
    const description = $('meta[name="description"]').attr('content') ||
                       $('meta[property="og:description"]').attr('content');
    
    const keywords = $('meta[name="keywords"]').attr('content');
    
    return {
      title: this.cleanText(title),
      content: this.cleanText(content),
      url,
      author: author ? this.cleanText(author) : undefined,
      publishDate: publishDate || undefined,
      description: description ? this.cleanText(description) : undefined,
      keywords: keywords ? keywords.split(',').map(k => k.trim()) : undefined,
    };
  }

  /**
   * Clean and preprocess text
   */
  private cleanText(text: string): string {
    if (!text) return '';
    
    return text
      .replace(/\s+/g, ' ') // Replace multiple whitespace with single space
      .replace(/\n\s*\n/g, '\n') // Remove empty lines
      .replace(/[^\w\s\-.,!?;:()"']/g, '') // Remove special characters except basic punctuation
      .trim();
  }

  /**
   * Extract relevant tags from content
   */
  private extractTags(content: string): string[] {
    const text = content.toLowerCase();
    const tags: string[] = [];
    
    // Common technology and topic keywords
    const keywords = [
      'artificial intelligence', 'ai', 'machine learning', 'ml', 'deep learning',
      'neural network', 'blockchain', 'cryptocurrency', 'bitcoin', 'ethereum',
      'climate change', 'renewable energy', 'solar', 'wind power', 'sustainability',
      'space exploration', 'mars', 'nasa', 'spacex', 'satellite',
      'quantum computing', 'quantum', 'cybersecurity', 'privacy', 'data protection',
      'covid', 'pandemic', 'vaccine', 'health', 'medicine', 'research',
      'economy', 'finance', 'stock market', 'inflation', 'recession',
      'politics', 'election', 'government', 'policy', 'regulation',
      'technology', 'innovation', 'startup', 'venture capital', 'funding',
      'social media', 'facebook', 'twitter', 'instagram', 'tiktok',
      'apple', 'google', 'microsoft', 'amazon', 'tesla', 'meta'
    ];
    
    for (const keyword of keywords) {
      if (text.includes(keyword)) {
        tags.push(keyword);
      }
    }
    
    // Extract hashtags if present
    const hashtags = content.match(/#[\w]+/g);
    if (hashtags) {
      tags.push(...hashtags.map(tag => tag.substring(1).toLowerCase()));
    }
    
    return [...new Set(tags)]; // Remove duplicates
  }

  /**
   * Generate a consistent document ID from URL or content
   */
  private generateDocumentId(url: string): string {
    // Create a hash-like ID from URL
    return Buffer.from(url).toString('base64').replace(/[^a-zA-Z0-9]/g, '').substring(0, 20);
  }

  /**
   * Print ingestion statistics
   */
  printStats(): void {
    this.stats.endTime = new Date();
    const duration = this.stats.endTime.getTime() - this.stats.startTime.getTime();
    
    console.log('\n📊 Ingestion Statistics:');
    console.log(`   Total Processed: ${this.stats.processed}`);
    console.log(`   Successful: ${this.stats.successful}`);
    console.log(`   Failed: ${this.stats.failed}`);
    console.log(`   Duration: ${Math.round(duration / 1000)}s`);
    console.log(`   Rate: ${Math.round(this.stats.processed / (duration / 1000))} docs/sec`);
    console.log('\n📋 Sources:');
    this.stats.sources.forEach(source => console.log(`   - ${source}`));
  }

  async close(): Promise<void> {
    await this.elasticsearchService.close();
  }
}

// CLI Configuration
program
  .name('ingestData')
  .description('Advanced data ingestion tool for AI-powered search engine')
  .version('1.0.0');

program
  .command('newsapi')
  .description('Ingest articles from NewsAPI')
  .requiredOption('-k, --api-key <key>', 'NewsAPI API key')
  .option('-q, --query <query>', 'Search query')
  .option('-c, --category <category>', 'News category (business, entertainment, general, health, science, sports, technology)')
  .option('--country <country>', 'Country code (us, gb, etc.)')
  .option('--language <language>', 'Language code (en, es, etc.)')
  .option('-s, --page-size <size>', 'Number of articles to fetch', '20')
  .action(async (options) => {
    const service = new DataIngestionService();
    try {
      await service.initialize();
      await service.ingestFromNewsAPI({
        apiKey: options.apiKey,
        query: options.query,
        category: options.category,
        country: options.country,
        language: options.language,
        pageSize: parseInt(options.pageSize),
      });
      service.printStats();
    } catch (error) {
      console.error('❌ NewsAPI ingestion failed:', error);
      process.exit(1);
    } finally {
      await service.close();
    }
  });

program
  .command('urls')
  .description('Ingest content from URLs (web scraping)')
  .argument('<urls...>', 'URLs to scrape')
  .action(async (urls) => {
    const service = new DataIngestionService();
    try {
      await service.initialize();
      await service.ingestFromURLs(urls);
      service.printStats();
    } catch (error) {
      console.error('❌ URL ingestion failed:', error);
      process.exit(1);
    } finally {
      await service.close();
    }
  });

program
  .command('rss')
  .description('Ingest content from RSS feeds')
  .argument('<rss-url>', 'RSS feed URL')
  .action(async (rssUrl) => {
    const service = new DataIngestionService();
    try {
      await service.initialize();
      await service.ingestFromRSS(rssUrl);
      service.printStats();
    } catch (error) {
      console.error('❌ RSS ingestion failed:', error);
      process.exit(1);
    } finally {
      await service.close();
    }
  });

program
  .command('json')
  .description('Ingest content from JSON file or API endpoint')
  .argument('<source>', 'JSON file path or API URL')
  .action(async (source) => {
    const service = new DataIngestionService();
    try {
      await service.initialize();
      await service.ingestFromJSON(source);
      service.printStats();
    } catch (error) {
      console.error('❌ JSON ingestion failed:', error);
      process.exit(1);
    } finally {
      await service.close();
    }
  });

program
  .command('mixed')
  .description('Ingest from multiple sources')
  .option('--newsapi-key <key>', 'NewsAPI key')
  .option('--newsapi-query <query>', 'NewsAPI search query')
  .option('--urls <urls>', 'Comma-separated URLs')
  .option('--rss <rss-urls>', 'Comma-separated RSS URLs')
  .option('--json <json-sources>', 'Comma-separated JSON sources')
  .action(async (options) => {
    const service = new DataIngestionService();
    try {
      await service.initialize();
      
      if (options.newsapiKey) {
        await service.ingestFromNewsAPI({
          apiKey: options.newsapiKey,
          query: options.newsapiQuery,
        });
      }
      
      if (options.urls) {
        const urls = options.urls.split(',').map((url: string) => url.trim());
        await service.ingestFromURLs(urls);
      }
      
      if (options.rss) {
        const rssUrls = options.rss.split(',').map((url: string) => url.trim());
        for (const rssUrl of rssUrls) {
          await service.ingestFromRSS(rssUrl);
        }
      }
      
      if (options.json) {
        const jsonSources = options.json.split(',').map((source: string) => source.trim());
        for (const jsonSource of jsonSources) {
          await service.ingestFromJSON(jsonSource);
        }
      }
      
      service.printStats();
    } catch (error) {
      console.error('❌ Mixed ingestion failed:', error);
      process.exit(1);
    } finally {
      await service.close();
    }
  });

// Parse command line arguments
if (require.main === module) {
  program.parse();
}
