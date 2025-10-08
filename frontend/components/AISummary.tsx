'use client';

interface AISummaryProps {
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
  onSuggestionClick: (suggestion: string) => void;
}

export default function AISummary({ searchInfo, onSuggestionClick }: AISummaryProps) {
  if (!searchInfo) return null;

  const { reasoning, intent, suggestions, query } = searchInfo;

  return (
    <div className="space-y-6">
      {/* AI Summary */}
      {reasoning && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center space-x-2 mb-4">
            <div className="w-6 h-6 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
              <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900">AI Summary</h3>
            <div className="ml-auto">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                reasoning.confidence > 0.8 ? 'bg-green-100 text-green-800' :
                reasoning.confidence > 0.6 ? 'bg-yellow-100 text-yellow-800' :
                'bg-red-100 text-red-800'
              }`}>
                {Math.round(reasoning.confidence * 100)}% confident
              </span>
            </div>
          </div>
          
          <div className="prose prose-sm max-w-none">
            <p className="text-gray-700 leading-relaxed mb-4">
              {reasoning.summary}
            </p>
            
            {reasoning.keyPoints && reasoning.keyPoints.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-2">Key Points:</h4>
                <ul className="space-y-1">
                  {reasoning.keyPoints.map((point, index) => (
                    <li key={index} className="flex items-start space-x-2">
                      <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                      <span className="text-sm text-gray-600">{point}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Search Intent */}
      {intent && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center space-x-2 mb-3">
            <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
            <h3 className="text-lg font-semibold text-gray-900">Search Intent</h3>
          </div>
          
          <div className="flex items-center space-x-3">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 capitalize">
              {intent.type}
            </span>
            <div className="flex-1 bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${intent.confidence * 100}%` }}
              ></div>
            </div>
            <span className="text-sm text-gray-500">
              {Math.round(intent.confidence * 100)}%
            </span>
          </div>
        </div>
      )}

      {/* Search Suggestions */}
      {suggestions && suggestions.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center space-x-2 mb-4">
            <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <h3 className="text-lg font-semibold text-gray-900">Related Searches</h3>
          </div>
          
          <div className="space-y-2">
            {suggestions.map((suggestion, index) => (
              <button
                key={index}
                onClick={() => onSuggestionClick(suggestion)}
                className="w-full text-left px-4 py-3 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-all duration-200 group"
              >
                <div className="flex items-center space-x-3">
                  <svg className="w-4 h-4 text-gray-400 group-hover:text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <span className="text-sm text-gray-700 group-hover:text-blue-700">
                    {suggestion}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Search Stats */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center space-x-2 mb-4">
          <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <h3 className="text-lg font-semibold text-gray-900">Search Details</h3>
        </div>
        
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Original Query:</span>
            <span className="text-sm font-medium text-gray-900 max-w-32 truncate">
              "{query.original}"
            </span>
          </div>
          
          {query.enhanced && query.enhanced !== query.original && (
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Enhanced Query:</span>
              <span className="text-sm font-medium text-blue-700 max-w-32 truncate">
                "{query.enhanced}"
              </span>
            </div>
          )}
          
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">BM25 Results:</span>
            <span className="text-sm font-medium text-gray-900">
              {searchInfo.bm25Results}
            </span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Vector Results:</span>
            <span className="text-sm font-medium text-gray-900">
              {searchInfo.vectorResults}
            </span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Combined Results:</span>
            <span className="text-sm font-medium text-blue-700">
              {searchInfo.combinedResults}
            </span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-600">Embeddings:</span>
            <span className={`text-sm font-medium ${query.embedding ? 'text-green-700' : 'text-yellow-700'}`}>
              {query.embedding ? 'Generated' : 'Fallback'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
