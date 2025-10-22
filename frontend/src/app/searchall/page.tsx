"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, ChevronLeft, ChevronRight, Loader2, AlertCircle } from "lucide-react";
import { useState, Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { SearchResultCard } from "@/components/SearchResultCard";
// Removed old API imports - now using direct fetch to bulk search API
import { AnimatedLoading } from "@/components/ui/animated-loading";
import { SafeShaderBackground } from "@/components/SafeShaderBackground";

function SearchAllContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Get the search query from URL parameters
  const query = searchParams.get('q') || '';
  const [searchQuery, setSearchQuery] = useState(query);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchInfo, setSearchInfo] = useState<any>(null);
  const [showAnimatedLoading, setShowAnimatedLoading] = useState(true);
  
  // Pagination state
  const currentPage = parseInt(searchParams.get('page') || '1');
  const resultsPerPage = 10;

  // Perform search when query changes
  useEffect(() => {
    if (query) {
      performSearch(query);
    }
  }, [query]);

  const performSearch = async (searchTerm: string) => {
    if (!searchTerm.trim()) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // Use individual APIs for reliable results
      const [webResponse, imageResponse, videoResponse] = await Promise.all([
        fetch(`/api/search?q=${encodeURIComponent(searchTerm)}&limit=${Math.ceil(resultsPerPage / 3)}`),
        fetch(`/api/searchimages?q=${encodeURIComponent(searchTerm)}&limit=${Math.ceil(resultsPerPage / 3)}`),
        fetch(`/api/searchvideos?q=${encodeURIComponent(searchTerm)}&limit=${Math.ceil(resultsPerPage / 3)}`)
      ]);
      
      const [webData, imageData, videoData] = await Promise.all([
        webResponse.ok ? webResponse.json() : { results: [] },
        imageResponse.ok ? imageResponse.json() : { images: [] },
        videoResponse.ok ? videoResponse.json() : { videos: [] }
      ]);
      
      // Combine all results
      const data = {
        success: true,
        web: webData.results || [],
        images: imageData.images || [],
        videos: videoData.videos || [],
        searchInfo: {
          totalWeb: (webData.results || []).length,
          totalImages: (imageData.images || []).length,
          totalVideos: (videoData.videos || []).length,
          bulkSearch: {
            totalFetched: (webData.results || []).length + (imageData.images || []).length + (videoData.videos || []).length,
            elasticsearchSaved: false,
            searchSource: 'individual_apis'
          }
        }
      };
      
      if (data.success) {
        // Combine all result types into a single array for display
        const allResults = [
          ...(data.web || []).map((result: any) => ({
            id: result.id,
            title: result.title,
            content: result.content || result.snippet,
            url: result.url,
            metadata: {
              ...result.metadata,
              type: 'web',
              source: 'Google Search',
              rankingScore: result.ranking?.finalScore || result.finalScore || 0
            }
          })),
          ...(data.images || []).map((result: any) => ({
            id: result.id,
            title: result.title,
            content: result.snippet || result.description,
            url: result.contextLink || result.url,
            imageUrl: result.url,
            metadata: {
              ...result.metadata,
              type: 'image',
              source: 'Google Images',
              rankingScore: result.ranking?.finalScore || result.finalScore || 0
            }
          })),
          ...(data.videos || []).map((result: any) => ({
            id: result.id,
            title: result.title,
            content: result.description || result.snippet,
            url: result.url,
            thumbnailUrl: result.thumbnailUrl,
            metadata: {
              ...result.metadata,
              type: 'video',
              source: 'YouTube',
              rankingScore: result.ranking?.finalScore || result.finalScore || 0
            }
          }))
        ];
        
        // Sort by ranking score (highest first)
        allResults.sort((a, b) => (b.metadata.rankingScore || 0) - (a.metadata.rankingScore || 0));
        
        setSearchResults(allResults);
        setSearchInfo({
          ...data.searchInfo,
          totalResults: allResults.length,
          bulkSearchEnabled: true,
          realGoogleResults: true
        });
      } else {
        setError(data.error || 'Search failed');
      }
    } catch (err) {
      console.error('Search error:', err);
      setError('Failed to connect to search service');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    if (searchQuery.trim()) {
      router.push(`/searchall?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const goHome = () => {
    router.push('/');
  };

  const navigateToFilter = (filter: string) => {
    if (searchQuery.trim()) {
      if (filter === 'images') {
        router.push(`/searchimages?q=${encodeURIComponent(searchQuery)}`);
      } else if (filter === 'videos') {
        router.push(`/searchvideos?q=${encodeURIComponent(searchQuery)}`);
      } else {
        router.push(`/searchall?q=${encodeURIComponent(searchQuery)}`);
      }
    }
  };

  const totalPages = Math.ceil((searchResults.length || 0) / resultsPerPage);

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams);
    params.set('page', page.toString());
    router.push(`/searchall?${params.toString()}`);
  };

  // Handle animation completion
  const handleAnimationComplete = () => {
    setShowAnimatedLoading(false);
  };

  // Show animated loading on first load
  if (showAnimatedLoading) {
    return <AnimatedLoading onComplete={handleAnimationComplete} />;
  }

  return (
    <div className="min-h-screen relative">
      {/* Static Shader Background - Extended to cover all content */}
      <div className="fixed inset-0 w-full h-full">
        <SafeShaderBackground />
      </div>
      
      {/* Professional overlay - Extended to cover all content */}
      <div className="fixed inset-0 w-full h-full bg-black/20"></div>
      
      <div className="relative z-10">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="bg-gray-900/95 backdrop-blur-sm border-b border-gray-700/50"
        >
          <div className="max-w-7xl mx-auto px-4 py-4">
            <div className="flex items-center gap-6">
              {/* Logo */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={goHome}
                className="text-2xl font-bold text-white tracking-tight"
              >
                Fractal
              </motion.button>

              {/* Search Bar */}
              <div className="flex-1 max-w-2xl">
                <div className="relative">
                  <Input
                    type="text"
                    placeholder="Search the web..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="w-full h-12 px-4 pr-12 bg-gray-800/80 border-gray-600/50 text-white placeholder:text-gray-400 focus:border-gray-500 focus:ring-2 focus:ring-gray-500/20 rounded-lg backdrop-blur-sm transition-all duration-200"
                  />
                  <Button
                    onClick={handleSearch}
                    disabled={loading}
                    className="absolute right-1 top-1 h-10 px-4 bg-gray-700/80 hover:bg-gray-600/90 text-white border border-gray-600/50 backdrop-blur-sm transition-all duration-200"
                  >
                    {loading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Search className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex gap-6 mt-4">
              {['all', 'images', 'videos'].map((filter) => (
                <button
                  key={filter}
                  onClick={() => navigateToFilter(filter)}
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                    filter === 'all'
                      ? 'bg-gray-700/80 text-white border border-gray-600/50'
                      : 'text-gray-300 hover:text-white hover:bg-gray-800/60 border border-gray-700/40'
                  }`}
                >
                  {filter.charAt(0).toUpperCase() + filter.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 py-8 pb-16">
          <div className="flex gap-8">
            {/* Search Results */}
            <div className="flex-1">
              {/* Search Info */}
              {searchInfo && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-6 p-4 bg-gray-900/80 rounded-lg border border-gray-700/50 backdrop-blur-sm"
                >
                  <h3 className="text-lg font-semibold text-white mb-2">Search Results</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div className="text-slate-300">
                      <span className="text-blue-400 font-medium">Total Results:</span> {searchInfo.totalResults || 0}
                    </div>
                    <div className="text-slate-300">
                      <span className="text-green-400 font-medium">Web:</span> {searchInfo.totalWeb || 0}
                    </div>
                    <div className="text-slate-300">
                      <span className="text-purple-400 font-medium">Images:</span> {searchInfo.totalImages || 0}
                    </div>
                    <div className="text-slate-300">
                      <span className="text-red-400 font-medium">Videos:</span> {searchInfo.totalVideos || 0}
                    </div>
                  </div>
                  {searchInfo.bulkSearch && (
                    <div className="mt-3 pt-3 border-t border-gray-700/50">
                      <div className="flex items-center gap-4 text-xs text-slate-400">
                        <span>📊 Fetched: {searchInfo.bulkSearch.totalFetched} results</span>
                        <span>🔍 Source: Google APIs</span>
                        <span>⚡ Ranked by AI</span>
                        {searchInfo.bulkSearch.elasticsearchSaved && <span>💾 Saved to DB</span>}
                      </div>
                    </div>
                  )}
                </motion.div>
              )}

              {/* Error State */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-6 p-4 bg-red-900/30 border border-red-700/60 rounded-lg flex items-center gap-3 backdrop-blur-sm"
                >
                  <AlertCircle className="w-5 h-5 text-red-400" />
                  <p className="text-red-300">{error}</p>
                </motion.div>
              )}

              {/* Loading State */}
              {loading && (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
                  <span className="ml-3 text-slate-300">Searching...</span>
                </div>
              )}

              {/* Results */}
              {!loading && searchResults.length > 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.6 }}
                  className="space-y-4"
                >
                  {searchResults.map((result, index) => (
                    <SearchResultCard
                      key={result.id}
                      index={index}
                      {...result}
                    />
                  ))}
                </motion.div>
              )}

              {/* No Results */}
              {!loading && !error && query && searchResults.length === 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-center py-12"
                >
                  <p className="text-gray-300 text-lg">No results found for "{query}"</p>
                  <p className="text-gray-400 text-sm mt-2">Try different keywords or check your spelling</p>
                </motion.div>
              )}

              {/* Pagination */}
              {searchResults.length > 0 && totalPages > 1 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="flex items-center justify-center gap-4 mt-12"
                >
                  <Button
                    variant="outline"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage <= 1}
                    className="bg-gray-800/80 border-gray-600/50 text-white hover:bg-gray-700/90 backdrop-blur-sm transition-all duration-200"
                  >
                    <ChevronLeft className="w-4 h-4 mr-2" />
                    Previous
                  </Button>
                  
                  <span className="text-gray-300">
                    Page {currentPage} of {totalPages}
                  </span>
                  
                  <Button
                    variant="outline"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage >= totalPages}
                    className="bg-gray-800/80 border-gray-600/50 text-white hover:bg-gray-700/90 backdrop-blur-sm transition-all duration-200"
                  >
                    Next
                    <ChevronRight className="w-4 h-4 ml-2" />
                  </Button>
                </motion.div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SearchAllPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-400" />
      </div>
    }>
      <SearchAllContent />
    </Suspense>
  );
}
