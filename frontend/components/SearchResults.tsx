'use client';

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
  };
  pagination: {
    size: number;
    from: number;
    hasMore: boolean;
    totalPages: number;
    currentPage: number;
  };
}

interface SearchResultsProps {
  results: SearchResponse;
  isLoading: boolean;
}

export default function SearchResults({ results, isLoading }: SearchResultsProps) {
  if (isLoading) {
    return null; // Loading is handled by LoadingState component
  }

  if (!results || !results.results || results.results.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="mx-auto h-24 w-24 text-gray-300 mb-6">
          <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-full h-full">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 20a7.962 7.962 0 01-5-1.709M15 3H9a2 2 0 00-2 2v1.586a1 1 0 01-.293.707L3.414 10.586A2 2 0 003 12v6a2 2 0 002 2h14a2 2 0 002-2v-6a2 2 0 00-.586-1.414L17.707 7.293A1 1 0 0117 6.586V5a2 2 0 00-2-2z" />
          </svg>
        </div>
        <h3 className="text-xl font-medium text-gray-900 mb-3">No results found</h3>
        <p className="text-gray-600 mb-6 max-w-md mx-auto">
          We couldn't find any documents matching your search. Try different keywords or check your filters.
        </p>
        <div className="space-y-2 text-sm text-gray-500">
          <p>💡 <strong>Tips for better results:</strong></p>
          <ul className="space-y-1">
            <li>• Try broader or more specific terms</li>
            <li>• Check spelling and try synonyms</li>
            <li>• Remove filters to expand your search</li>
            <li>• Use quotes for exact phrases</li>
          </ul>
        </div>
      </div>
    );
  }

  const formatScore = (score: number) => {
    return score > 1 ? score.toFixed(1) : (score * 100).toFixed(0) + '%';
  };

  const getScoreColor = (score: number) => {
    if (score > 0.8 || score > 8) return 'bg-green-100 text-green-800';
    if (score > 0.5 || score > 5) return 'bg-yellow-100 text-yellow-800';
    return 'bg-gray-100 text-gray-800';
  };

  const truncateContent = (content: string, maxLength: number = 300) => {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength).trim() + '...';
  };

  return (
    <div className="space-y-6">
      {/* Search Info Header */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h2 className="text-lg font-semibold text-gray-900">
              {results.total.toLocaleString()} results
            </h2>
            <span className="text-sm text-gray-500">
              ({results.took}ms)
            </span>
            {results.searchInfo && (
              <div className="flex items-center space-x-2 text-xs text-gray-500">
                <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                  BM25: {results.searchInfo.bm25Results}
                </span>
                <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded-full">
                  Vector: {results.searchInfo.vectorResults}
                </span>
                <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full">
                  Combined: {results.searchInfo.combinedResults}
                </span>
              </div>
            )}
          </div>
          
          {results.searchInfo?.query.enhanced && results.searchInfo.query.enhanced !== results.searchInfo.query.original && (
            <div className="text-sm text-blue-600">
              <span className="font-medium">Enhanced:</span> "{results.searchInfo.query.enhanced}"
            </div>
          )}
        </div>
      </div>

      {/* Results List */}
      <div className="space-y-4">
        {results.results.map((result, index) => (
          <div key={result.id} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all duration-200 group">
            {/* Result Header */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <h3 className="text-xl font-medium text-gray-900 group-hover:text-blue-700 transition-colors mb-1">
                  {result.url ? (
                    <a 
                      href={result.url} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="flex items-center hover:underline"
                    >
                      {result.title}
                      <svg className="ml-2 h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </a>
                  ) : (
                    result.title
                  )}
                </h3>
                
                {/* URL Display */}
                {result.url && (
                  <div className="text-sm text-green-700 mb-2">
                    {new URL(result.url).hostname}
                  </div>
                )}
              </div>
              
              {/* Relevance Score */}
              <div className="flex flex-col items-end space-y-1 ml-4">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getScoreColor(result.score)}`}>
                  {formatScore(result.score)}
                </span>
                <span className="text-xs text-gray-400">#{index + 1}</span>
              </div>
            </div>

            {/* Content Snippet */}
            <div className="mb-4">
              {result.highlights && result.highlights.length > 0 ? (
                <div 
                  className="text-gray-700 leading-relaxed"
                  dangerouslySetInnerHTML={{ 
                    __html: result.highlights.join(' ... ').replace(/<mark>/g, '<mark class="bg-yellow-200 px-1 rounded">').replace(/<\/mark>/g, '</mark>')
                  }} 
                />
              ) : (
                <p className="text-gray-700 leading-relaxed">
                  {truncateContent(result.content)}
                </p>
              )}
            </div>

            {/* Metadata */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4 text-sm text-gray-500">
                {result.metadata?.author && (
                  <div className="flex items-center">
                    <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    {result.metadata.author}
                  </div>
                )}
                
                {result.metadata?.date && (
                  <div className="flex items-center">
                    <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {new Date(result.metadata.date).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric'
                    })}
                  </div>
                )}
                
                {result.metadata?.category && (
                  <div className="flex items-center">
                    <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                    </svg>
                    {result.metadata.category}
                  </div>
                )}
                
                {result.metadata?.source && (
                  <div className="text-blue-600 font-medium">
                    {result.metadata.source}
                  </div>
                )}
              </div>

              {/* Advanced Scoring (if available) */}
              {result.scores && (
                <div className="flex items-center space-x-2">
                  <div className="text-xs text-gray-400">
                    BM25: {result.scores.bm25.toFixed(2)}
                  </div>
                  {result.scores.vector > 0 && (
                    <div className="text-xs text-gray-400">
                      Vector: {result.scores.vector.toFixed(2)}
                    </div>
                  )}
                  {result.scores.rrf > 0 && (
                    <div className="text-xs text-gray-400">
                      RRF: {result.scores.rrf.toFixed(4)}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Tags */}
            {result.metadata?.tags && result.metadata.tags.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {result.metadata.tags.slice(0, 5).map((tag, tagIndex) => (
                  <span key={tagIndex} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors">
                    #{tag}
                  </span>
                ))}
                {result.metadata.tags.length > 5 && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs bg-gray-100 text-gray-500">
                    +{result.metadata.tags.length - 5} more
                  </span>
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Pagination Info */}
      {results.pagination.hasMore && (
        <div className="text-center py-6">
          <div className="text-sm text-gray-500 mb-4">
            Showing {results.pagination.from + 1}-{Math.min(results.pagination.from + results.pagination.size, results.total)} of {results.total.toLocaleString()} results
          </div>
          <div className="text-xs text-gray-400">
            Page {results.pagination.currentPage} of {results.pagination.totalPages}
          </div>
        </div>
      )}
    </div>
  );
}
