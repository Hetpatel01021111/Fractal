// Mock Analytics Service for demonstration when Elasticsearch is not available
export interface QueryLog {
  id: string;
  query: string;
  timestamp: string;
  resultsCount: number;
  responseLatency: number;
  searchType: 'hybrid' | 'bm25' | 'vector';
  filters?: {
    category?: string;
    author?: string;
    dateRange?: {
      from: string;
      to: string;
    };
  };
  userAgent?: string;
  ipAddress?: string;
  success: boolean;
  errorMessage?: string;
  searchInfo?: {
    bm25Results: number;
    vectorResults: number;
    combinedResults: number;
    embeddingGenerated: boolean;
  };
}

export interface AnalyticsStats {
  totalQueries: number;
  totalUniqueQueries: number;
  averageLatency: number;
  successRate: number;
  topQueries: Array<{
    query: string;
    count: number;
    averageLatency: number;
    lastSearched: string;
  }>;
  queryTrends: Array<{
    date: string;
    count: number;
    averageLatency: number;
  }>;
  searchTypes: {
    hybrid: number;
    bm25: number;
    vector: number;
  };
  popularFilters: {
    categories: Array<{ category: string; count: number }>;
    authors: Array<{ author: string; count: number }>;
  };
  performanceMetrics: {
    fastQueries: number;
    mediumQueries: number;
    slowQueries: number;
  };
  errorStats: {
    totalErrors: number;
    errorTypes: Array<{ error: string; count: number }>;
  };
}

export class MockAnalyticsService {
  private queryLogs: QueryLog[] = [];
  private isInitialized = false;

  async initialize(): Promise<void> {
    // Generate some mock data for demonstration
    this.generateMockData();
    this.isInitialized = true;
    console.log('✅ Mock Analytics service initialized with sample data');
  }

  async logQuery(queryLog: QueryLog): Promise<void> {
    // Store in memory (in production this would go to Elasticsearch)
    this.queryLogs.push(queryLog);
    
    // Keep only last 1000 queries to prevent memory issues
    if (this.queryLogs.length > 1000) {
      this.queryLogs = this.queryLogs.slice(-1000);
    }
  }

  async getAnalytics(days: number = 30): Promise<AnalyticsStats> {
    const fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - days);

    // Filter logs by date range
    const filteredLogs = this.queryLogs.filter(log => 
      new Date(log.timestamp) >= fromDate
    );

    // Calculate statistics
    const totalQueries = filteredLogs.length;
    const successfulQueries = filteredLogs.filter(log => log.success);
    const uniqueQueries = new Set(filteredLogs.map(log => log.query.toLowerCase()));
    
    const averageLatency = totalQueries > 0 
      ? filteredLogs.reduce((sum, log) => sum + log.responseLatency, 0) / totalQueries 
      : 0;

    const successRate = totalQueries > 0 
      ? (successfulQueries.length / totalQueries) * 100 
      : 100;

    // Top queries
    const queryCount = new Map<string, { count: number; totalLatency: number; lastSearched: string }>();
    filteredLogs.forEach(log => {
      const query = log.query.toLowerCase();
      const existing = queryCount.get(query) || { count: 0, totalLatency: 0, lastSearched: log.timestamp };
      queryCount.set(query, {
        count: existing.count + 1,
        totalLatency: existing.totalLatency + log.responseLatency,
        lastSearched: log.timestamp > existing.lastSearched ? log.timestamp : existing.lastSearched
      });
    });

    const topQueries = Array.from(queryCount.entries())
      .map(([query, data]) => ({
        query,
        count: data.count,
        averageLatency: Math.round(data.totalLatency / data.count),
        lastSearched: data.lastSearched
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 20);

    // Daily trends
    const dailyStats = new Map<string, { count: number; totalLatency: number }>();
    filteredLogs.forEach(log => {
      const date = new Date(log.timestamp).toISOString().split('T')[0];
      const existing = dailyStats.get(date) || { count: 0, totalLatency: 0 };
      dailyStats.set(date, {
        count: existing.count + 1,
        totalLatency: existing.totalLatency + log.responseLatency
      });
    });

    const queryTrends = Array.from(dailyStats.entries())
      .map(([date, data]) => ({
        date,
        count: data.count,
        averageLatency: Math.round(data.totalLatency / data.count)
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    // Search types
    const searchTypes = {
      hybrid: filteredLogs.filter(log => log.searchType === 'hybrid').length,
      bm25: filteredLogs.filter(log => log.searchType === 'bm25').length,
      vector: filteredLogs.filter(log => log.searchType === 'vector').length
    };

    // Popular filters
    const categoryCount = new Map<string, number>();
    const authorCount = new Map<string, number>();
    
    filteredLogs.forEach(log => {
      if (log.filters?.category) {
        const category = log.filters.category;
        categoryCount.set(category, (categoryCount.get(category) || 0) + 1);
      }
      if (log.filters?.author) {
        const author = log.filters.author;
        authorCount.set(author, (authorCount.get(author) || 0) + 1);
      }
    });

    const popularFilters = {
      categories: Array.from(categoryCount.entries())
        .map(([category, count]) => ({ category, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10),
      authors: Array.from(authorCount.entries())
        .map(([author, count]) => ({ author, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10)
    };

    // Performance metrics
    const performanceMetrics = {
      fastQueries: filteredLogs.filter(log => log.responseLatency < 1000).length,
      mediumQueries: filteredLogs.filter(log => log.responseLatency >= 1000 && log.responseLatency < 3000).length,
      slowQueries: filteredLogs.filter(log => log.responseLatency >= 3000).length
    };

    // Error stats
    const errorLogs = filteredLogs.filter(log => !log.success);
    const errorTypeCount = new Map<string, number>();
    errorLogs.forEach(log => {
      const error = log.errorMessage || 'Unknown error';
      errorTypeCount.set(error, (errorTypeCount.get(error) || 0) + 1);
    });

    const errorStats = {
      totalErrors: errorLogs.length,
      errorTypes: Array.from(errorTypeCount.entries())
        .map(([error, count]) => ({ error, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10)
    };

    return {
      totalQueries,
      totalUniqueQueries: uniqueQueries.size,
      averageLatency: Math.round(averageLatency),
      successRate: Math.round(successRate * 100) / 100,
      topQueries,
      queryTrends,
      searchTypes,
      popularFilters,
      performanceMetrics,
      errorStats
    };
  }

  async getRecentQueries(limit: number = 50): Promise<QueryLog[]> {
    return this.queryLogs
      .slice(-limit)
      .reverse(); // Most recent first
  }

  async searchQueries(searchTerm: string, limit: number = 20): Promise<QueryLog[]> {
    const filtered = this.queryLogs.filter(log => 
      log.query.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.errorMessage && log.errorMessage.toLowerCase().includes(searchTerm.toLowerCase()))
    );
    
    return filtered
      .slice(-limit)
      .reverse();
  }

  generateQueryId(): string {
    return `query_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateMockData(): void {
    // Generate sample query logs for demonstration
    const sampleQueries = [
      'artificial intelligence',
      'machine learning algorithms',
      'quantum computing',
      'neural networks',
      'deep learning',
      'OpenAI research',
      'natural language processing',
      'computer vision',
      'robotics automation',
      'blockchain technology'
    ];

    const categories = ['Technology', 'Science', 'News', 'Research', 'Business'];
    const authors = ['Dr. Smith', 'John Doe', 'Jane Wilson', 'Prof. Johnson', 'Alex Chen'];

    // Generate logs for the past 30 days
    for (let i = 0; i < 150; i++) {
      const daysAgo = Math.floor(Math.random() * 30);
      const timestamp = new Date();
      timestamp.setDate(timestamp.getDate() - daysAgo);
      timestamp.setHours(Math.floor(Math.random() * 24));
      timestamp.setMinutes(Math.floor(Math.random() * 60));

      const query = sampleQueries[Math.floor(Math.random() * sampleQueries.length)];
      const success = Math.random() > 0.1; // 90% success rate
      const responseLatency = Math.floor(Math.random() * 5000) + 500; // 500-5500ms
      const resultsCount = success ? Math.floor(Math.random() * 50) + 1 : 0;

      const queryLog: QueryLog = {
        id: this.generateQueryId(),
        query,
        timestamp: timestamp.toISOString(),
        resultsCount,
        responseLatency,
        searchType: ['hybrid', 'bm25', 'vector'][Math.floor(Math.random() * 3)] as any,
        filters: Math.random() > 0.7 ? (() => {
          const category = categories[Math.floor(Math.random() * categories.length)];
          const author = Math.random() > 0.5 ? authors[Math.floor(Math.random() * authors.length)] : undefined;
          return author ? { category, author } : { category };
        })() : undefined,
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        ipAddress: `192.168.1.${Math.floor(Math.random() * 255)}`,
        success,
        errorMessage: success ? undefined : 'Search timeout',
        searchInfo: {
          bm25Results: Math.floor(Math.random() * 20),
          vectorResults: Math.floor(Math.random() * 15),
          combinedResults: resultsCount,
          embeddingGenerated: Math.random() > 0.3
        }
      };

      this.queryLogs.push(queryLog);
    }

    console.log(`📊 Generated ${this.queryLogs.length} sample query logs for demonstration`);
  }
}
