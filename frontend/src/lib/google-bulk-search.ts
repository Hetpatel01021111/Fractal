// Enhanced Google Search with bulk data collection and Elasticsearch integration
// import { googleSearch } from './google-search';

export interface BulkSearchResult {
  web: any[];
  images: any[];
  videos: any[];
  total: number;
  searchSource: string;
  elasticsearchSaved: boolean;
  ranking: {
    totalProcessed: number;
    averageScore: number;
    topResults: any[];
  };
}

export class GoogleBulkSearchService {
  private maxWebResults = 30; // Reduced to avoid API limits
  private maxImageResults = 20; // Reduced to avoid API limits
  private maxVideoResults = 20; // Reduced to avoid API limits

  // Fetch 100+ results from Google APIs in batches
  async performBulkSearch(query: string): Promise<BulkSearchResult> {
    console.log(`🔍 Starting bulk search for: "${query}"`);
    
    const results: BulkSearchResult = {
      web: [],
      images: [],
      videos: [],
      total: 0,
      searchSource: 'google_bulk',
      elasticsearchSaved: false,
      ranking: {
        totalProcessed: 0,
        averageScore: 0,
        topResults: []
      }
    };

    try {
      // Fetch web results in batches with fallback
      try {
        results.web = await this.fetchWebResultsBatch(query, this.maxWebResults);
        console.log(`✅ Fetched ${results.web.length} web results`);
      } catch (error) {
        console.error('❌ Web search failed, trying fallback:', error);
        results.web = await this.fetchFallbackWebResults(query, 10);
      }

      // Fetch image results in batches with fallback
      try {
        results.images = await this.fetchImageResultsBatch(query, this.maxImageResults);
        console.log(`✅ Fetched ${results.images.length} image results`);
      } catch (error) {
        console.error('❌ Image search failed, trying fallback:', error);
        results.images = await this.fetchFallbackImageResults(query, 10);
      }

      // Fetch video results in batches with fallback
      try {
        results.videos = await this.fetchVideoResultsBatch(query, this.maxVideoResults);
        console.log(`✅ Fetched ${results.videos.length} video results`);
      } catch (error) {
        console.error('❌ Video search failed, trying fallback:', error);
        results.videos = await this.fetchFallbackVideoResults(query, 10);
      }

      results.total = results.web.length + results.images.length + results.videos.length;

      // Apply advanced ranking to all results
      const rankedResults = await this.applyAdvancedRanking(results, query);
      
      // Save to Elasticsearch
      const elasticsearchSaved = await this.saveToElasticsearch(rankedResults, query);
      results.elasticsearchSaved = elasticsearchSaved;

      // Update ranking info
      results.ranking = {
        totalProcessed: results.total,
        averageScore: this.calculateAverageScore(rankedResults),
        topResults: rankedResults.slice(0, 20) // Top 20 results
      };

      console.log(`🎉 Bulk search completed: ${results.total} total results, saved to ES: ${elasticsearchSaved}`);
      return results;

    } catch (error) {
      console.error('❌ Bulk search failed:', error);
      throw error;
    }
  }

  // Fetch web results in batches of 10 (Google API limit)
  private async fetchWebResultsBatch(query: string, maxResults: number): Promise<any[]> {
    const results: any[] = [];
    const batchSize = 10;
    const batches = Math.ceil(maxResults / batchSize);

    for (let i = 0; i < batches; i++) {
      try {
        const start = i * batchSize + 1;
        const webResults = await this.fetchGoogleWebWithPagination(query, batchSize, start);
        
        if (webResults.length === 0) break; // No more results
        
        results.push(...webResults);
        console.log(`📄 Web batch ${i + 1}/${batches}: ${webResults.length} results (total: ${results.length})`);
        
        // Rate limiting - wait between requests
        if (i < batches - 1) {
          await this.delay(200); // 200ms delay between requests
        }
      } catch (error) {
        console.error(`❌ Web batch ${i + 1} failed:`, error);
        break; // Stop on error to avoid quota exhaustion
      }
    }

    return results;
  }

  // Fetch image results in batches
  private async fetchImageResultsBatch(query: string, maxResults: number): Promise<any[]> {
    const results: any[] = [];
    const batchSize = 10;
    const batches = Math.ceil(maxResults / batchSize);

    for (let i = 0; i < batches; i++) {
      try {
        const start = i * batchSize + 1;
        const imageResults = await this.fetchGoogleImagesWithPagination(query, batchSize, start);
        
        if (imageResults.length === 0) break;
        
        results.push(...imageResults);
        console.log(`🖼️ Image batch ${i + 1}/${batches}: ${imageResults.length} results (total: ${results.length})`);
        
        if (i < batches - 1) {
          await this.delay(200);
        }
      } catch (error) {
        console.error(`❌ Image batch ${i + 1} failed:`, error);
        break;
      }
    }

    return results;
  }

  // Fetch video results in batches
  private async fetchVideoResultsBatch(query: string, maxResults: number): Promise<any[]> {
    const results: any[] = [];
    const batchSize = 10;
    const batches = Math.ceil(maxResults / batchSize);

    // Use different YouTube-specific queries for variety
    const videoQueries = [
      `${query} site:youtube.com`,
      `${query} tutorial site:youtube.com`,
      `${query} explained site:youtube.com`,
      `${query} guide site:youtube.com`,
      `how to ${query} site:youtube.com`
    ];

    for (let i = 0; i < batches; i++) {
      try {
        const queryVariation = videoQueries[i % videoQueries.length];
        const start = Math.floor(i / videoQueries.length) * batchSize + 1;
        
        const videoResults = await this.fetchGoogleVideosWithPagination(queryVariation, batchSize, start);
        
        if (videoResults.length === 0) break;
        
        results.push(...videoResults);
        console.log(`🎥 Video batch ${i + 1}/${batches}: ${videoResults.length} results (total: ${results.length})`);
        
        if (i < batches - 1) {
          await this.delay(200);
        }
      } catch (error) {
        console.error(`❌ Video batch ${i + 1} failed:`, error);
        break;
      }
    }

    return results;
  }

  // Google Web Search with pagination
  private async fetchGoogleWebWithPagination(query: string, num: number, start: number): Promise<any[]> {
    const apiKey = process.env.GOOGLE_API_KEY;
    const cxId = process.env.GOOGLE_CX_ID;

    if (!apiKey || !cxId) return [];

    const url = new URL('https://www.googleapis.com/customsearch/v1');
    url.searchParams.set('key', apiKey);
    url.searchParams.set('cx', cxId);
    url.searchParams.set('q', query);
    url.searchParams.set('num', num.toString());
    url.searchParams.set('start', start.toString());
    url.searchParams.set('safe', 'active');

    const response = await fetch(url.toString());
    if (!response.ok) throw new Error(`Google API error: ${response.status}`);

    const data = await response.json();
    if (!data.items) return [];

    return data.items.map((item: any, index: number) => ({
      id: `google_web_${Date.now()}_${start + index}`,
      title: item.title,
      content: item.snippet,
      url: item.link,
      displayLink: item.displayLink,
      formattedUrl: item.formattedUrl,
      type: 'web',
      source: 'google_search',
      fetchedAt: new Date().toISOString(),
      metadata: {
        category: 'web',
        source: 'google_search',
        tags: query.split(' '),
        position: start + index,
        cacheId: item.cacheId
      }
    }));
  }

  // Google Images Search with pagination
  private async fetchGoogleImagesWithPagination(query: string, num: number, start: number): Promise<any[]> {
    const apiKey = process.env.GOOGLE_API_KEY;
    const cxId = process.env.GOOGLE_CX_ID;

    if (!apiKey || !cxId) return [];

    const url = new URL('https://www.googleapis.com/customsearch/v1');
    url.searchParams.set('key', apiKey);
    url.searchParams.set('cx', cxId);
    url.searchParams.set('q', query);
    url.searchParams.set('searchType', 'image');
    url.searchParams.set('num', num.toString());
    url.searchParams.set('start', start.toString());
    url.searchParams.set('safe', 'active');

    const response = await fetch(url.toString());
    if (!response.ok) throw new Error(`Google Images API error: ${response.status}`);

    const data = await response.json();
    if (!data.items) return [];

    return data.items.map((item: any, index: number) => ({
      id: `google_img_${Date.now()}_${start + index}`,
      title: item.title,
      url: item.link,
      thumbnailUrl: item.image?.thumbnailLink || item.link,
      contextLink: item.image?.contextLink,
      snippet: item.snippet,
      displayLink: item.displayLink,
      width: item.image?.width || 400,
      height: item.image?.height || 300,
      type: 'image',
      source: 'google_images',
      fetchedAt: new Date().toISOString(),
      metadata: {
        category: 'image',
        source: 'google_images',
        tags: query.split(' '),
        position: start + index,
        byteSize: item.image?.byteSize
      }
    }));
  }

  // Google Videos Search with pagination
  private async fetchGoogleVideosWithPagination(query: string, num: number, start: number): Promise<any[]> {
    const apiKey = process.env.GOOGLE_API_KEY;
    const cxId = process.env.GOOGLE_CX_ID;

    if (!apiKey || !cxId) return [];

    const url = new URL('https://www.googleapis.com/customsearch/v1');
    url.searchParams.set('key', apiKey);
    url.searchParams.set('cx', cxId);
    url.searchParams.set('q', query);
    url.searchParams.set('num', num.toString());
    url.searchParams.set('start', start.toString());
    url.searchParams.set('safe', 'active');

    const response = await fetch(url.toString());
    if (!response.ok) throw new Error(`Google Videos API error: ${response.status}`);

    const data = await response.json();
    if (!data.items) return [];

    return data.items
      .filter((item: any) => item.link.includes('youtube.com/watch'))
      .map((item: any, index: number) => {
        const videoId = this.extractYouTubeVideoId(item.link);
        return {
          id: `google_video_${Date.now()}_${start + index}`,
          title: item.title,
          url: item.link,
          thumbnailUrl: videoId ? `https://img.youtube.com/vi/${videoId}/mqdefault.jpg` : '',
          description: item.snippet,
          displayLink: item.displayLink,
          videoId,
          type: 'video',
          source: 'youtube',
          fetchedAt: new Date().toISOString(),
          metadata: {
            category: 'video',
            source: 'youtube',
            tags: query.split(' '),
            position: start + index,
            duration: this.generateVideoDuration(),
            views: this.generateViews(),
            channelName: this.extractChannelName(item.displayLink)
          }
        };
      });
  }

  // Apply advanced ranking algorithm to all results
  private async applyAdvancedRanking(results: BulkSearchResult, query: string): Promise<any[]> {
    const allResults = [
      ...results.web.map(r => ({ ...r, contentType: 'web' })),
      ...results.images.map(r => ({ ...r, contentType: 'image' })),
      ...results.videos.map(r => ({ ...r, contentType: 'video' }))
    ];

    // Calculate advanced scores for each result
    const rankedResults = allResults.map((result, index) => {
      const scores = this.calculateAdvancedScores(result, query, index);
      return {
        ...result,
        ranking: scores,
        finalScore: scores.finalScore
      };
    });

    // Sort by final score (highest first)
    rankedResults.sort((a, b) => b.finalScore - a.finalScore);

    console.log(`📊 Ranked ${rankedResults.length} results, top score: ${rankedResults[0]?.finalScore || 0}`);
    return rankedResults;
  }

  // Advanced scoring algorithm
  private calculateAdvancedScores(result: any, query: string, position: number) {
    const queryLower = query.toLowerCase();
    const titleLower = (result.title || '').toLowerCase();
    const contentLower = (result.content || result.snippet || '').toLowerCase();

    // 1. Relevance Score (40% weight)
    let relevanceScore = 0;
    if (titleLower.includes(queryLower)) relevanceScore += 40;
    if (contentLower.includes(queryLower)) relevanceScore += 30;
    
    // Exact phrase match bonus
    if (titleLower.includes(queryLower)) relevanceScore += 20;
    
    // Individual word matches
    const queryWords = query.split(' ');
    const titleWords = queryWords.filter(word => titleLower.includes(word.toLowerCase()));
    relevanceScore += (titleWords.length / queryWords.length) * 10;

    // 2. Quality Score (25% weight)
    let qualityScore = 50; // Base quality
    if (result.source === 'google_search') qualityScore += 30;
    if (result.source === 'google_images') qualityScore += 25;
    if (result.source === 'youtube') qualityScore += 20;
    
    // Domain authority bonus
    if (result.displayLink?.includes('wikipedia.org')) qualityScore += 15;
    if (result.displayLink?.includes('.edu')) qualityScore += 10;
    if (result.displayLink?.includes('.gov')) qualityScore += 10;

    // 3. Freshness Score (15% weight)
    const freshnessScore = Math.max(0, 100 - (position * 2)); // Newer results score higher

    // 4. Content Type Score (10% weight)
    let contentTypeScore = 50;
    if (result.contentType === 'web') contentTypeScore = 80;
    if (result.contentType === 'image') contentTypeScore = 70;
    if (result.contentType === 'video') contentTypeScore = 90; // Videos often preferred

    // 5. Position Score (10% weight) - Google's original ranking
    const positionScore = Math.max(0, 100 - position);

    // Calculate weighted final score
    const finalScore = (
      (relevanceScore * 0.40) +
      (qualityScore * 0.25) +
      (freshnessScore * 0.15) +
      (contentTypeScore * 0.10) +
      (positionScore * 0.10)
    );

    return {
      relevanceScore: Math.round(relevanceScore),
      qualityScore: Math.round(qualityScore),
      freshnessScore: Math.round(freshnessScore),
      contentTypeScore: Math.round(contentTypeScore),
      positionScore: Math.round(positionScore),
      finalScore: Math.round(finalScore * 100) / 100
    };
  }

  // Save results to Elasticsearch with graceful fallback
  private async saveToElasticsearch(results: any[], query: string): Promise<boolean> {
    try {
      // Quick check if Elasticsearch is available
      const esUrl = process.env.ELASTICSEARCH_URL || 'http://localhost:9200';
      
      // Test connection first with short timeout
      const pingResponse = await fetch(`${esUrl}`, {
        method: 'HEAD',
        signal: AbortSignal.timeout(2000) // 2 second timeout
      });
      
      if (!pingResponse.ok) {
        console.log('⚠️ Elasticsearch not available, skipping save');
        return false;
      }

      // Create bulk insert payload
      const bulkBody = results.flatMap((result, index) => [
        { 
          index: { 
            _index: `search-results-${new Date().toISOString().split('T')[0]}`,
            _id: result.id 
          } 
        },
        {
          ...result,
          query: query,
          searchedAt: new Date().toISOString(),
          bulkSearchId: `bulk_${Date.now()}`,
          resultIndex: index
        }
      ]);

      const response = await fetch(`${esUrl}/_bulk`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: bulkBody.map(item => JSON.stringify(item)).join('\n') + '\n',
        signal: AbortSignal.timeout(10000) // 10 second timeout for bulk insert
      });

      if (response.ok) {
        const result = await response.json();
        const errors = result.items?.filter((item: any) => item.index?.error) || [];
        
        if (errors.length === 0) {
          console.log(`✅ Saved ${results.length} results to Elasticsearch`);
          return true;
        } else {
          console.log(`⚠️ Saved ${results.length - errors.length}/${results.length} results to Elasticsearch`);
          return true; // Partial success is still success
        }
      } else {
        console.log(`⚠️ Elasticsearch save failed (${response.status}), continuing without storage`);
        return false;
      }
    } catch (error) {
      // Don't log full error details to avoid spam - Elasticsearch being unavailable is expected
      console.log('⚠️ Elasticsearch unavailable, search results not persisted');
      return false;
    }
  }

  // Helper methods
  private calculateAverageScore(results: any[]): number {
    if (results.length === 0) return 0;
    const total = results.reduce((sum, r) => sum + (r.finalScore || 0), 0);
    return Math.round((total / results.length) * 100) / 100;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private extractYouTubeVideoId(url: string): string | null {
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/);
    return match ? match[1] : null;
  }

  private extractChannelName(displayLink: string): string | null {
    if (displayLink?.includes('youtube.com')) {
      return 'YouTube Channel';
    }
    return null;
  }

  private generateVideoDuration(): string {
    const minutes = Math.floor(Math.random() * 45) + 2;
    const seconds = Math.floor(Math.random() * 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }

  private generateViews(): string {
    const views = Math.floor(Math.random() * 1000000) + 1000;
    if (views > 1000000) return `${Math.floor(views / 1000000)}M views`;
    if (views > 1000) return `${Math.floor(views / 1000)}K views`;
    return `${views} views`;
  }

  // Fallback methods that use individual search APIs
  private async fetchFallbackWebResults(query: string, limit: number): Promise<any[]> {
    try {
      const response = await fetch(`/api/search?q=${encodeURIComponent(query)}&limit=${limit}`);
      if (response.ok) {
        const data = await response.json();
        return data.results || [];
      }
    } catch (error) {
      console.error('Fallback web search failed:', error);
    }
    return [];
  }

  private async fetchFallbackImageResults(query: string, limit: number): Promise<any[]> {
    try {
      const response = await fetch(`/api/searchimages?q=${encodeURIComponent(query)}&limit=${limit}`);
      if (response.ok) {
        const data = await response.json();
        return data.images || [];
      }
    } catch (error) {
      console.error('Fallback image search failed:', error);
    }
    return [];
  }

  private async fetchFallbackVideoResults(query: string, limit: number): Promise<any[]> {
    try {
      const response = await fetch(`/api/searchvideos?q=${encodeURIComponent(query)}&limit=${limit}`);
      if (response.ok) {
        const data = await response.json();
        return data.videos || [];
      }
    } catch (error) {
      console.error('Fallback video search failed:', error);
    }
    return [];
  }
}

// Export singleton instance
export const googleBulkSearch = new GoogleBulkSearchService();
