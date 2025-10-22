"use client";

// Removed framer-motion to fix Vercel HTML import error
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Loader2, AlertCircle } from "lucide-react";
import { useState, Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { VideoCard } from "@/components/VideoCard";
import { AnimatedLoading } from "@/components/ui/animated-loading";
import { SafeShaderBackground } from "@/components/SafeShaderBackground";

function SearchVideosContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Get the search query from URL parameters
  const query = searchParams.get('q') || '';
  const [searchQuery, setSearchQuery] = useState(query);
  const [videos, setVideos] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchInfo, setSearchInfo] = useState<any>(null);
  const [showAnimatedLoading, setShowAnimatedLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const resultsPerPage = 20;

  // Perform search when query changes
  useEffect(() => {
    if (query) {
      performSearch(query);
    }
  }, [query]);

  const performSearch = async (searchTerm: string, isLoadMore = false) => {
    if (!searchTerm.trim()) return;
    
    if (isLoadMore) {
      setLoadingMore(true);
    } else {
      setLoading(true);
      setVideos([]);
      setCurrentPage(1);
      setHasMore(true);
    }
    setError(null);
    
    try {
      const response = await fetch(`/api/searchvideos?q=${encodeURIComponent(searchTerm)}&limit=${resultsPerPage}&page=${isLoadMore ? currentPage + 1 : 1}`);
      
      if (!response.ok) {
        throw new Error(`Search failed: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        const newVideos = (data.videos || []).map((result: any, index: number) => ({
          id: result.id,
          title: result.title,
          url: result.url,
          thumbnailUrl: result.thumbnail || result.thumbnailUrl,
          source: result.channel || result.source || 'YouTube',
          duration: result.duration,
          views: result.views,
          publishedAt: result.uploadTime || result.publishedAt,
          description: result.description || result.snippet,
          index: index,
          metadata: {
            ...result.metadata,
            type: 'video',
            source: result.channel || result.source || 'YouTube',
            rankingScore: result.ranking?.finalScore || result.finalScore || 0
          }
        }));
        
        if (isLoadMore) {
          setVideos(prev => [...prev, ...newVideos]);
          setCurrentPage(prev => prev + 1);
        } else {
          setVideos(newVideos);
        }
        
        setSearchInfo({
          ...data.searchInfo,
          totalResults: newVideos.length,
          totalVideos: newVideos.length,
          totalWeb: 0,
          totalImages: 0,
          realGoogleResults: true
        });
        setHasMore(newVideos.length === resultsPerPage);
      } else {
        setError(data.error || 'Search failed');
      }
    } catch (err) {
      console.error('Search error:', err);
      setError('Failed to connect to search service');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const handleSearch = () => {
    if (searchQuery.trim()) {
      router.push(`/searchvideos?q=${encodeURIComponent(searchQuery)}`);
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

  const loadMoreResults = () => {
    if (query && hasMore && !loadingMore) {
      performSearch(query, true);
    }
  };

  // Infinite scroll effect
  useEffect(() => {
    const handleScroll = () => {
      if (window.innerHeight + document.documentElement.scrollTop !== document.documentElement.offsetHeight || loadingMore || !hasMore) {
        return;
      }
      loadMoreResults();
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [query, hasMore, loadingMore]);

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
      <div className="fixed inset-0 w-full h-full bg-black/20 pointer-events-none"></div>
      
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
                    placeholder="Search for videos..."
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
                    filter === 'videos'
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
                  <div className="mt-3 pt-3 border-t border-gray-700/50">
                    <div className="flex items-center gap-4 text-xs text-slate-400">
                      <span>🔍 Source: Google APIs</span>
                      <span>⚡ Ranked by AI</span>
                      <span>🎥 Video Search</span>
                    </div>
                  </div>
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
                  <Loader2 className="w-8 h-8 animate-spin text-red-400" />
                  <span className="ml-3 text-slate-300">Searching for videos...</span>
                </div>
              )}

              {/* Results */}
              {!loading && videos.length > 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.6 }}
                  className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                >
                  {videos.map((video, index) => (
                    <VideoCard
                      key={video.id}
                      {...video}
                    />
                  ))}
                </motion.div>
              )}

              {/* Load More Indicator */}
              {loadingMore && (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-red-400 mr-3" />
                  <span className="text-slate-300">Loading more videos...</span>
                </div>
              )}
              
              {/* End of Results */}
              {!hasMore && videos.length > 0 && (
                <div className="text-center py-8">
                  <p className="text-gray-400 text-sm">
                    🎉 You've watched all videos! Showing {videos.length} results.
                  </p>
                </div>
              )}

              {/* No Results */}
              {!loading && !error && query && videos.length === 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-center py-12"
                >
                  <p className="text-gray-300 text-lg">No videos found for "{query}"</p>
                  <p className="text-gray-400 text-sm mt-2">Try different keywords or check your spelling</p>
                </motion.div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function SearchVideosPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-red-400" />
      </div>
    }>
      <SearchVideosContent />
    </Suspense>
  );
}
