'use client';

import { useState, useEffect } from 'react';

interface AnalyticsData {
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

interface QueryLog {
  id: string;
  query: string;
  timestamp: string;
  resultsCount: number;
  responseLatency: number;
  searchType: string;
  success: boolean;
  errorMessage?: string;
}

export default function AdminDashboard() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [recentQueries, setRecentQueries] = useState<QueryLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState(30);

  useEffect(() => {
    fetchAnalytics();
  }, [selectedPeriod]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:3001/api/analytics?days=${selectedPeriod}&recent=true`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch analytics: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        setAnalytics(data.analytics);
        setRecentQueries(data.recentQueries || []);
        setError(null);
      } else {
        throw new Error(data.message || 'Failed to load analytics');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      console.error('Analytics fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatLatency = (ms: number) => {
    return ms < 1000 ? `${ms}ms` : `${(ms / 1000).toFixed(1)}s`;
  };

  const getPerformanceColor = (type: 'fast' | 'medium' | 'slow') => {
    switch (type) {
      case 'fast': return 'text-green-600 bg-green-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'slow': return 'text-red-600 bg-red-100';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md">
          <div className="text-red-600 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Analytics Unavailable</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={fetchAnalytics}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-600">No analytics data available</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Search Analytics</h1>
              <p className="text-gray-600 mt-1">Monitor search performance and user behavior</p>
            </div>
            <div className="flex items-center space-x-4">
              <select
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(parseInt(e.target.value))}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value={7}>Last 7 days</option>
                <option value={30}>Last 30 days</option>
                <option value={90}>Last 90 days</option>
              </select>
              <button
                onClick={fetchAnalytics}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Queries</p>
                <p className="text-2xl font-bold text-gray-900">{analytics.totalQueries.toLocaleString()}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Success Rate</p>
                <p className="text-2xl font-bold text-gray-900">{analytics.successRate.toFixed(1)}%</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <svg className="w-6 h-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Avg Latency</p>
                <p className="text-2xl font-bold text-gray-900">{formatLatency(analytics.averageLatency)}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <svg className="w-6 h-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Unique Queries</p>
                <p className="text-2xl font-bold text-gray-900">{analytics.totalUniqueQueries.toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Top Queries */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Search Queries</h3>
            <div className="space-y-3">
              {analytics.topQueries.slice(0, 10).map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900 truncate">{item.query}</p>
                    <p className="text-xs text-gray-500">
                      {item.count} searches • Avg: {formatLatency(item.averageLatency)}
                    </p>
                  </div>
                  <div className="ml-4 text-right">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      #{index + 1}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Performance Distribution */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Distribution</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
                  <span className="text-sm text-gray-700">Fast (&lt; 1s)</span>
                </div>
                <div className="flex items-center">
                  <span className="text-sm font-medium text-gray-900 mr-2">
                    {analytics.performanceMetrics.fastQueries}
                  </span>
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getPerformanceColor('fast')}`}>
                    {((analytics.performanceMetrics.fastQueries / analytics.totalQueries) * 100).toFixed(1)}%
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-yellow-500 rounded-full mr-3"></div>
                  <span className="text-sm text-gray-700">Medium (1-3s)</span>
                </div>
                <div className="flex items-center">
                  <span className="text-sm font-medium text-gray-900 mr-2">
                    {analytics.performanceMetrics.mediumQueries}
                  </span>
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getPerformanceColor('medium')}`}>
                    {((analytics.performanceMetrics.mediumQueries / analytics.totalQueries) * 100).toFixed(1)}%
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-red-500 rounded-full mr-3"></div>
                  <span className="text-sm text-gray-700">Slow (&gt; 3s)</span>
                </div>
                <div className="flex items-center">
                  <span className="text-sm font-medium text-gray-900 mr-2">
                    {analytics.performanceMetrics.slowQueries}
                  </span>
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getPerformanceColor('slow')}`}>
                    {((analytics.performanceMetrics.slowQueries / analytics.totalQueries) * 100).toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Search Types */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Search Types</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-700">Hybrid</span>
                <span className="text-sm font-medium text-gray-900">{analytics.searchTypes.hybrid}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-700">BM25</span>
                <span className="text-sm font-medium text-gray-900">{analytics.searchTypes.bm25}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-700">Vector</span>
                <span className="text-sm font-medium text-gray-900">{analytics.searchTypes.vector}</span>
              </div>
            </div>
          </div>

          {/* Popular Categories */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Popular Categories</h3>
            <div className="space-y-3">
              {analytics.popularFilters.categories.slice(0, 5).map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">{item.category}</span>
                  <span className="text-sm font-medium text-gray-900">{item.count}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Error Stats */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Error Statistics</h3>
            <div className="mb-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-700">Total Errors</span>
                <span className="text-sm font-medium text-red-600">{analytics.errorStats.totalErrors}</span>
              </div>
            </div>
            <div className="space-y-2">
              {analytics.errorStats.errorTypes.slice(0, 3).map((item, index) => (
                <div key={index} className="text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 truncate">{item.error}</span>
                    <span className="text-gray-900 font-medium">{item.count}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Queries */}
        {recentQueries.length > 0 && (
          <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Queries</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Query</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Time</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Results</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Latency</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {recentQueries.slice(0, 10).map((query) => (
                    <tr key={query.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 max-w-xs truncate">
                        {query.query}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(query.timestamp).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {query.resultsCount}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatLatency(query.responseLatency)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          query.success 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {query.success ? 'Success' : 'Error'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
