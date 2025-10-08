'use client';

export default function LoadingState() {
  return (
    <div className="mt-8 space-y-6">
      {/* Search Info Loading */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center space-x-3 mb-4">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
          <div className="h-4 bg-gray-200 rounded animate-pulse w-48"></div>
        </div>
        <div className="space-y-2">
          <div className="h-3 bg-gray-200 rounded animate-pulse w-full"></div>
          <div className="h-3 bg-gray-200 rounded animate-pulse w-3/4"></div>
        </div>
      </div>

      {/* Results Loading */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Results Loading */}
        <div className="lg:col-span-2 space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="animate-pulse">
                <div className="flex items-start justify-between mb-3">
                  <div className="h-6 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-16"></div>
                </div>
                <div className="space-y-2 mb-4">
                  <div className="h-4 bg-gray-200 rounded w-full"></div>
                  <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                  <div className="h-4 bg-gray-200 rounded w-4/6"></div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="h-3 bg-gray-200 rounded w-20"></div>
                  <div className="h-3 bg-gray-200 rounded w-24"></div>
                  <div className="h-3 bg-gray-200 rounded w-16"></div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Sidebar Loading */}
        <div className="lg:col-span-1 space-y-6">
          {/* AI Summary Loading */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="animate-pulse">
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-5 h-5 bg-gray-200 rounded"></div>
                <div className="h-5 bg-gray-200 rounded w-24"></div>
              </div>
              <div className="space-y-3">
                <div className="h-4 bg-gray-200 rounded w-full"></div>
                <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                <div className="h-4 bg-gray-200 rounded w-4/6"></div>
              </div>
            </div>
          </div>

          {/* Suggestions Loading */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="animate-pulse">
              <div className="h-5 bg-gray-200 rounded w-32 mb-4"></div>
              <div className="space-y-2">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-8 bg-gray-200 rounded-lg w-full"></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Loading Text */}
      <div className="text-center py-8">
        <div className="inline-flex items-center space-x-3 text-gray-600">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          <span className="text-lg font-medium">Searching with AI...</span>
        </div>
        <p className="text-sm text-gray-500 mt-2">
          Analyzing content with hybrid search and generating insights
        </p>
      </div>
    </div>
  );
}
