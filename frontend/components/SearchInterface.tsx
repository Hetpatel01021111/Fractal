'use client';

import { useState, useRef, useEffect } from 'react';

interface SearchFilters {
  category?: string;
  dateRange?: {
    from: string;
    to: string;
  };
  author?: string;
  tags?: string[];
}

interface SearchInterfaceProps {
  onSearch: (query: string, filters?: SearchFilters, includeReasoning?: boolean) => void;
  isLoading: boolean;
  compact?: boolean;
}

export default function SearchInterface({ onSearch, isLoading, compact = false }: SearchInterfaceProps) {
  const [query, setQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [filters, setFilters] = useState<SearchFilters>({});
  const [isClient, setIsClient] = useState(false);
  const recognitionRef = useRef<any>(null);

  // Initialize client-side rendering and speech recognition
  useEffect(() => {
    setIsClient(true);
    
    if (typeof window !== 'undefined' && 'webkitSpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setQuery(transcript);
        setIsListening(false);
      };

      recognitionRef.current.onerror = () => {
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      onSearch(query.trim(), filters, true);
    }
  };

  const handleVoiceSearch = () => {
    if (recognitionRef.current && !isListening) {
      setIsListening(true);
      recognitionRef.current.start();
    }
  };

  const handleFilterChange = (key: keyof SearchFilters, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const clearFilters = () => {
    setFilters({});
  };

  const hasActiveFilters = Object.values(filters).some(value => 
    value && (typeof value === 'string' ? value.length > 0 : 
              Array.isArray(value) ? value.length > 0 : 
              typeof value === 'object' ? Object.values(value).some(v => v) : false)
  );

  return (
    <div className={`w-full mx-auto transition-all duration-500 ${compact ? 'max-w-4xl' : 'max-w-5xl'}`}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Main Search Bar */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <svg className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search with AI-powered hybrid search..."
            className={`block w-full pl-14 pr-32 py-4 text-lg border border-gray-200 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-lg hover:shadow-xl transition-all duration-200 ${
              compact ? 'text-base py-3' : 'text-lg py-4'
            }`}
            disabled={isLoading}
          />
          
          {/* Voice Search Button */}
          <div className="absolute inset-y-0 right-20 flex items-center">
            {isClient && typeof window !== 'undefined' && 'webkitSpeechRecognition' in window && (
              <button
                type="button"
                onClick={handleVoiceSearch}
                disabled={isLoading || isListening}
                className={`p-2 rounded-full transition-all duration-200 ${
                  isListening 
                    ? 'bg-red-100 text-red-600 animate-pulse' 
                    : 'text-gray-400 hover:text-blue-600 hover:bg-blue-50'
                }`}
                title="Voice search"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
                </svg>
              </button>
            )}
          </div>
          
          {/* Search Button */}
          <div className="absolute inset-y-0 right-2 flex items-center">
            <button
              type="submit"
              disabled={isLoading || !query.trim()}
              className="inline-flex items-center px-6 py-2 border border-transparent text-sm font-medium rounded-xl text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            >
              {isLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Searching...
                </>
              ) : (
                'Search'
              )}
            </button>
          </div>
        </div>

        {/* Filter Toggle and Status */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              className={`inline-flex items-center px-3 py-1.5 text-sm font-medium rounded-lg transition-all duration-200 ${
                showFilters || hasActiveFilters
                  ? 'bg-blue-100 text-blue-700 border border-blue-200'
                  : 'bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200'
              }`}
            >
              <svg className="w-4 h-4 mr-1.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.414A1 1 0 013 6.707V4z" />
              </svg>
              Filters
              {hasActiveFilters && (
                <span className="ml-1.5 inline-flex items-center justify-center px-2 py-0.5 rounded-full text-xs bg-blue-600 text-white">
                  {Object.values(filters).filter(v => v && (typeof v === 'string' ? v.length > 0 : Array.isArray(v) ? v.length > 0 : true)).length}
                </span>
              )}
            </button>
            
            {hasActiveFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
              >
                Clear filters
              </button>
            )}
          </div>
          
          {isListening && (
            <div className="flex items-center space-x-2 text-red-600">
              <div className="w-2 h-2 bg-red-600 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium">Listening...</span>
            </div>
          )}
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Category Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category
                </label>
                <select
                  value={filters.category || ''}
                  onChange={(e) => handleFilterChange('category', e.target.value || undefined)}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">All categories</option>
                  <option value="News">News</option>
                  <option value="Web">Web</option>
                  <option value="Technology">Technology</option>
                  <option value="Science">Science</option>
                  <option value="Business">Business</option>
                  <option value="Research">Research</option>
                </select>
              </div>

              {/* Author Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Author
                </label>
                <input
                  type="text"
                  value={filters.author || ''}
                  onChange={(e) => handleFilterChange('author', e.target.value || undefined)}
                  placeholder="Filter by author..."
                  className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Date Range Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date Range
                </label>
                <div className="space-y-2">
                  <input
                    type="date"
                    value={filters.dateRange?.from || ''}
                    onChange={(e) => handleFilterChange('dateRange', {
                      ...filters.dateRange,
                      from: e.target.value
                    })}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  />
                  <input
                    type="date"
                    value={filters.dateRange?.to || ''}
                    onChange={(e) => handleFilterChange('dateRange', {
                      ...filters.dateRange,
                      to: e.target.value
                    })}
                    className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </form>

      {/* Quick Search Suggestions */}
      {!compact && (
        <div className="mt-8">
          <p className="text-sm text-gray-600 mb-4">Popular searches:</p>
          <div className="flex flex-wrap gap-3">
            {[
              'artificial intelligence breakthroughs',
              'machine learning algorithms',
              'quantum computing advances',
              'neural network architectures',
              'deep learning applications',
              'OpenAI latest research'
            ].map((suggestion) => (
              <button
                key={suggestion}
                onClick={() => {
                  setQuery(suggestion);
                  onSearch(suggestion, filters, true);
                }}
                className="px-4 py-2 text-sm bg-white hover:bg-blue-50 text-gray-700 hover:text-blue-700 rounded-full border border-gray-200 hover:border-blue-300 transition-all duration-200 shadow-sm hover:shadow-md"
                disabled={isLoading}
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
