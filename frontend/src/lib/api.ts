// API utility functions for connecting to the backend

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || (
  typeof window !== 'undefined' 
    ? window.location.origin 
    : 'http://localhost:3001'
);

export interface SearchResult {
  id: string;
  title: string;
  content: string;
  url?: string;
  metadata?: {
    author?: string;
    date?: string;
    category?: string;
    source?: string;
    tags?: string[];
    language?: string;
  };
  score?: number;
  explanation?: string;
}

export interface SearchResponse {
  success: boolean;
  results: SearchResult[];
  total: number;
  took: number;
  searchInfo?: {
    bm25Results?: number;
    vectorResults?: number;
    combinedResults?: number;
    query?: {
      original: string;
      enhanced?: string;
      embedding?: boolean;
    };
    reasoning?: {
      summary: string;
      keyPoints: string[];
      confidence: number;
    };
    intent?: {
      type: string;
      confidence: number;
      entities: string[];
    };
    suggestions?: string[];
  };
  pagination: {
    size: number;
    from: number;
    hasMore: boolean;
    totalPages: number;
    currentPage: number;
  };
  timestamp: string;
  error?: string;
  message?: string;
}

export interface SearchFilters {
  category?: string;
  tags?: string[];
  dateRange?: {
    from?: string;
    to?: string;
  };
  author?: string;
}

export interface SearchParams {
  query: string;
  filters?: SearchFilters;
  size?: number;
  from?: number;
  includeReasoning?: boolean;
  includeExplanation?: boolean;
}

export class ApiService {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  async search(params: SearchParams): Promise<SearchResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/api/search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(params),
      });

      if (!response.ok) {
        throw new Error(`Search failed: ${response.status} ${response.statusText}`);
      }

      const data: SearchResponse = await response.json();
      return data;
    } catch (error) {
      console.error('Search API error:', error);
      throw error;
    }
  }

  async healthCheck(): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/api/health`);
      
      if (!response.ok) {
        throw new Error(`Health check failed: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Health check API error:', error);
      throw error;
    }
  }

  async getAnalytics(days: number = 30, includeRecent: boolean = false): Promise<any> {
    try {
      const params = new URLSearchParams({
        days: days.toString(),
        recent: includeRecent.toString(),
      });

      const response = await fetch(`${this.baseUrl}/api/analytics?${params}`);
      
      if (!response.ok) {
        throw new Error(`Analytics failed: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Analytics API error:', error);
      throw error;
    }
  }

  // Helper method to convert SearchResult to the format expected by the UI
  static convertToUIFormat(result: SearchResult): any {
    return {
      id: result.id,
      title: result.title,
      description: result.content.substring(0, 200) + (result.content.length > 200 ? '...' : ''),
      url: result.url || '#',
      websiteName: result.metadata?.source || 'Unknown Source',
      favicon: `https://www.google.com/s2/favicons?domain=${result.url ? new URL(result.url).hostname : 'example.com'}`,
      imageUrl: `https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=400&h=300&fit=crop`, // Default image
      metadata: result.metadata,
      score: result.score,
      explanation: result.explanation,
    };
  }
}

// Create a singleton instance
export const apiService = new ApiService();

// Helper function for easy searching
export async function searchDocuments(
  query: string,
  options: {
    page?: number;
    size?: number;
    filters?: SearchFilters;
    includeReasoning?: boolean;
  } = {}
): Promise<SearchResponse> {
  const {
    page = 1,
    size = 10,
    filters,
    includeReasoning = true,
  } = options;

  const searchParams: SearchParams = {
    query,
    size,
    from: (page - 1) * size,
    filters,
    includeReasoning,
    includeExplanation: false,
  };

  return apiService.search(searchParams);
}
