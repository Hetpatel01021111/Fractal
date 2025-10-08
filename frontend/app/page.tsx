'use client';

import { useState } from 'react';
import SearchInterface from '../components/SearchInterface';
import SearchResults from '../components/SearchResults';
import AISummary from '../components/AISummary';
import LoadingState from '../components/LoadingState';
import ErrorState from '../components/ErrorState';

interface SearchResult {
  id: string;
  title: string;
  content: string;
  url?: string;
  score: number;
  highlights?: string[];
  metadata?: {
    author?: string;
    date?: string;
    category?: string;
    source?: string;
    tags?: string[];
  };
  scores?: {
    bm25: number;
    vector: number;
    rrf: number;
    final: number;
  };
}

interface SearchFilters {
  category?: string;
  dateRange?: {
    from: string;
    to: string;
  };
  author?: string;
  tags?: string[];
}

interface SearchResponse {
  success: boolean;
  results: SearchResult[];
  total: number;
  took: number;
  searchInfo?: {
    bm25Results: number;
    vectorResults: number;
    combinedResults: number;
    query: {
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
}

export default function Home() {
  const [searchResults, setSearchResults] = useState<SearchResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async (
    query: string, 
    filters: SearchFilters = {},
    includeReasoning: boolean = true
  ) => {
    if (!query.trim()) return;

    setIsLoading(true);
    setError(null);
    setHasSearched(true);

    try {
      const response = await fetch('http://localhost:3001/api/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query,
          filters,
          size: 10,
          from: 0,
          includeReasoning,
          includeExplanation: true,
        }),
      });

      if (!response.ok) {
        throw new Error(`Search failed: ${response.statusText}`);
      }

      const data = await response.json();
      setSearchResults(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRetry = () => {
    setError(null);
    setSearchResults(null);
    setHasSearched(false);
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="container mx-auto px-4 py-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className={`text-center transition-all duration-500 ${hasSearched ? 'mb-6' : 'mb-16 mt-20'}`}>
            <h1 className={`font-bold text-gray-900 transition-all duration-500 ${
              hasSearched ? 'text-2xl mb-2' : 'text-5xl mb-4'
            }`}>
              AI Search Engine
            </h1>
            {!hasSearched && (
              <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                Powered by hybrid search technology combining BM25, vector similarity, and AI reasoning
              </p>
            )}
          </div>
          
          {/* Search Interface */}
          <SearchInterface 
            onSearch={handleSearch} 
            isLoading={isLoading}
            compact={hasSearched}
          />
          
          {/* Loading State */}
          {isLoading && <LoadingState />}
          
          {/* Error State */}
          {error && (
            <ErrorState 
              error={error} 
              onRetry={handleRetry}
            />
          )}
          
          {/* Results */}
          {searchResults && !isLoading && (
            <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Main Results */}
              <div className="lg:col-span-2">
                <SearchResults 
                  results={searchResults} 
                  isLoading={isLoading}
                />
              </div>
              
              {/* AI Summary Sidebar */}
              <div className="lg:col-span-1">
                <AISummary 
                  searchInfo={searchResults.searchInfo}
                  onSuggestionClick={(suggestion: string) => handleSearch(suggestion)}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
