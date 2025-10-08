import { Client } from '@elastic/elasticsearch';

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
    fastQueries: number; // < 1s
    mediumQueries: number; // 1-3s
    slowQueries: number; // > 3s
  };
  errorStats: {
    totalErrors: number;
    errorTypes: Array<{ error: string; count: number }>;
  };
}

export class AnalyticsService {
  private client: Client;
  private indexName: string = 'search-analytics';

  constructor(client: Client) {
    this.client = client;
  }

  async initialize(): Promise<void> {
    try {
      // Check if analytics index exists
      const exists = await this.client.indices.exists({
        index: this.indexName
      });

      if (!exists) {
        // Create analytics index with proper mapping
        await this.client.indices.create({
          index: this.indexName,
          body: {
            mappings: {
              properties: {
                id: { type: 'keyword' },
                query: { 
                  type: 'text',
                  fields: {
                    keyword: { type: 'keyword' }
                  }
                },
                timestamp: { type: 'date' },
                resultsCount: { type: 'integer' },
                responseLatency: { type: 'float' },
                searchType: { type: 'keyword' },
                filters: {
                  properties: {
                    category: { type: 'keyword' },
                    author: { type: 'keyword' },
                    dateRange: {
                      properties: {
                        from: { type: 'date' },
                        to: { type: 'date' }
                      }
                    }
                  }
                },
                userAgent: { type: 'text' },
                ipAddress: { type: 'ip' },
                success: { type: 'boolean' },
                errorMessage: { type: 'text' },
                searchInfo: {
                  properties: {
                    bm25Results: { type: 'integer' },
                    vectorResults: { type: 'integer' },
                    combinedResults: { type: 'integer' },
                    embeddingGenerated: { type: 'boolean' }
                  }
                }
              }
            }
          }
        });
        console.log('✅ Analytics index created successfully');
      }
    } catch (error) {
      console.error('❌ Failed to initialize analytics index:', error);
      throw error;
    }
  }

  async logQuery(queryLog: QueryLog): Promise<void> {
    try {
      await this.client.index({
        index: this.indexName,
        id: queryLog.id,
        body: queryLog
      });
    } catch (error) {
      console.error('❌ Failed to log query:', error);
      // Don't throw error to avoid breaking search functionality
    }
  }

  async getAnalytics(days: number = 30): Promise<AnalyticsStats> {
    try {
      const fromDate = new Date();
      fromDate.setDate(fromDate.getDate() - days);

      // Get basic stats
      const basicStatsResponse = await this.client.search({
        index: this.indexName,
        body: {
          query: {
            range: {
              timestamp: {
                gte: fromDate.toISOString()
              }
            }
          },
          aggs: {
            total_queries: { value_count: { field: 'query.keyword' } },
            unique_queries: { cardinality: { field: 'query.keyword' } },
            avg_latency: { avg: { field: 'responseLatency' } },
            success_rate: {
              filters: {
                filters: {
                  success: { term: { success: true } },
                  total: { match_all: {} }
                }
              }
            },
            search_types: {
              terms: { field: 'searchType', size: 10 }
            },
            performance_buckets: {
              range: {
                field: 'responseLatency',
                ranges: [
                  { to: 1000 },
                  { from: 1000, to: 3000 },
                  { from: 3000 }
                ]
              }
            }
          },
          size: 0
        }
      });

      // Get top queries
      const topQueriesResponse = await this.client.search({
        index: this.indexName,
        body: {
          query: {
            bool: {
              must: [
                { range: { timestamp: { gte: fromDate.toISOString() } } },
                { term: { success: true } }
              ]
            }
          },
          aggs: {
            top_queries: {
              terms: { 
                field: 'query.keyword', 
                size: 20,
                order: { _count: 'desc' }
              },
              aggs: {
                avg_latency: { avg: { field: 'responseLatency' } },
                last_searched: { max: { field: 'timestamp' } }
              }
            }
          },
          size: 0
        }
      });

      // Get daily trends
      const trendsResponse = await this.client.search({
        index: this.indexName,
        body: {
          query: {
            range: {
              timestamp: {
                gte: fromDate.toISOString()
              }
            }
          },
          aggs: {
            daily_trends: {
              date_histogram: {
                field: 'timestamp',
                calendar_interval: 'day',
                format: 'yyyy-MM-dd'
              },
              aggs: {
                avg_latency: { avg: { field: 'responseLatency' } }
              }
            }
          },
          size: 0
        }
      });

      // Get popular filters
      const filtersResponse = await this.client.search({
        index: this.indexName,
        body: {
          query: {
            bool: {
              must: [
                { range: { timestamp: { gte: fromDate.toISOString() } } },
                { exists: { field: 'filters' } }
              ]
            }
          },
          aggs: {
            categories: {
              terms: { field: 'filters.category', size: 10 }
            },
            authors: {
              terms: { field: 'filters.author', size: 10 }
            }
          },
          size: 0
        }
      });

      // Get error stats
      const errorStatsResponse = await this.client.search({
        index: this.indexName,
        body: {
          query: {
            bool: {
              must: [
                { range: { timestamp: { gte: fromDate.toISOString() } } },
                { term: { success: false } }
              ]
            }
          },
          aggs: {
            error_types: {
              terms: { field: 'errorMessage.keyword', size: 10 }
            }
          },
          size: 0
        }
      });

      // Parse results
      const basicStats = (basicStatsResponse as any).aggregations;
      const topQueries = (topQueriesResponse as any).aggregations.top_queries.buckets;
      const trends = (trendsResponse as any).aggregations.daily_trends.buckets;
      const filters = (filtersResponse as any).aggregations;
      const errorStats = (errorStatsResponse as any).aggregations;

      const totalQueries = basicStats.total_queries.value;
      const successCount = basicStats.success_rate.buckets.success.doc_count;

      return {
        totalQueries,
        totalUniqueQueries: basicStats.unique_queries.value,
        averageLatency: Math.round(basicStats.avg_latency.value || 0),
        successRate: totalQueries > 0 ? (successCount / totalQueries) * 100 : 0,
        topQueries: topQueries.map((bucket: any) => ({
          query: bucket.key,
          count: bucket.doc_count,
          averageLatency: Math.round(bucket.avg_latency.value || 0),
          lastSearched: bucket.last_searched.value_as_string
        })),
        queryTrends: trends.map((bucket: any) => ({
          date: bucket.key_as_string,
          count: bucket.doc_count,
          averageLatency: Math.round(bucket.avg_latency.value || 0)
        })),
        searchTypes: {
          hybrid: basicStats.search_types.buckets.find((b: any) => b.key === 'hybrid')?.doc_count || 0,
          bm25: basicStats.search_types.buckets.find((b: any) => b.key === 'bm25')?.doc_count || 0,
          vector: basicStats.search_types.buckets.find((b: any) => b.key === 'vector')?.doc_count || 0
        },
        popularFilters: {
          categories: filters.categories?.buckets.map((bucket: any) => ({
            category: bucket.key,
            count: bucket.doc_count
          })) || [],
          authors: filters.authors?.buckets.map((bucket: any) => ({
            author: bucket.key,
            count: bucket.doc_count
          })) || []
        },
        performanceMetrics: {
          fastQueries: basicStats.performance_buckets.buckets[0]?.doc_count || 0,
          mediumQueries: basicStats.performance_buckets.buckets[1]?.doc_count || 0,
          slowQueries: basicStats.performance_buckets.buckets[2]?.doc_count || 0
        },
        errorStats: {
          totalErrors: (errorStatsResponse as any).hits.total.value,
          errorTypes: errorStats.error_types?.buckets.map((bucket: any) => ({
            error: bucket.key,
            count: bucket.doc_count
          })) || []
        }
      };
    } catch (error) {
      console.error('❌ Failed to get analytics:', error);
      throw error;
    }
  }

  async getRecentQueries(limit: number = 50): Promise<QueryLog[]> {
    try {
      const response = await this.client.search({
        index: this.indexName,
        body: {
          query: { match_all: {} },
          sort: [{ timestamp: { order: 'desc' } }],
          size: limit
        }
      });

      return (response as any).hits.hits.map((hit: any) => hit._source);
    } catch (error) {
      console.error('❌ Failed to get recent queries:', error);
      throw error;
    }
  }

  async searchQueries(searchTerm: string, limit: number = 20): Promise<QueryLog[]> {
    try {
      const response = await this.client.search({
        index: this.indexName,
        body: {
          query: {
            multi_match: {
              query: searchTerm,
              fields: ['query', 'errorMessage']
            }
          },
          sort: [{ timestamp: { order: 'desc' } }],
          size: limit
        }
      });

      return (response as any).hits.hits.map((hit: any) => hit._source);
    } catch (error) {
      console.error('❌ Failed to search queries:', error);
      throw error;
    }
  }

  generateQueryId(): string {
    return `query_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
