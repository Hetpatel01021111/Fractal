'use client';

interface ErrorStateProps {
  error: string;
  onRetry: () => void;
}

export default function ErrorState({ error, onRetry }: ErrorStateProps) {
  const isNetworkError = error.toLowerCase().includes('fetch') || error.toLowerCase().includes('network');
  const isServerError = error.toLowerCase().includes('500') || error.toLowerCase().includes('server');

  return (
    <div className="mt-8 max-w-2xl mx-auto">
      <div className="bg-white rounded-xl shadow-sm border border-red-200 p-8 text-center">
        {/* Error Icon */}
        <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-6">
          <svg className="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>

        {/* Error Title */}
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          {isNetworkError ? 'Connection Error' : 
           isServerError ? 'Server Error' : 
           'Search Error'}
        </h3>

        {/* Error Message */}
        <p className="text-gray-600 mb-6 leading-relaxed">
          {isNetworkError ? 
            'Unable to connect to the search service. Please check your internet connection and try again.' :
           isServerError ?
            'The search service is temporarily unavailable. Our team has been notified and is working on a fix.' :
            error}
        </p>

        {/* Error Details */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <p className="text-sm text-gray-500 font-mono">
            {error}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={onRetry}
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
          >
            <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Try Again
          </button>
          
          <button
            onClick={() => window.location.reload()}
            className="inline-flex items-center px-6 py-3 border border-gray-300 text-base font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
          >
            <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh Page
          </button>
        </div>

        {/* Help Text */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <p className="text-sm text-gray-500">
            If the problem persists, please try:
          </p>
          <ul className="text-sm text-gray-500 mt-2 space-y-1">
            <li>• Checking your internet connection</li>
            <li>• Refreshing the page</li>
            <li>• Trying a different search query</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
