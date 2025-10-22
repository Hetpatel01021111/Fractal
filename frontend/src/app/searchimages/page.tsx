"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { useState, Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ImageCard } from "@/components/ImageCard";
import { AnimatedLoading } from "@/components/ui/animated-loading";
import { SafeShaderBackground } from "@/components/SafeShaderBackground";

function SearchImagesContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Get the search query from URL parameters
  const query = searchParams.get('q') || '';
  const [searchQuery, setSearchQuery] = useState(query);
  const activeFilter = 'images';
  const [showAnimatedLoading, setShowAnimatedLoading] = useState(true);
  const [images, setImages] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchInfo, setSearchInfo] = useState<any>(null);

  const handleSearch = () => {
    if (searchQuery.trim()) {
      router.push(`/searchimages?q=${encodeURIComponent(searchQuery)}`);
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

  // Handle animation completion
  const handleAnimationComplete = () => {
    setShowAnimatedLoading(false);
  };

  // Fetch images from API
  const fetchImages = async (searchQuery: string) => {
    if (!searchQuery.trim()) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`/api/searchimages?q=${encodeURIComponent(searchQuery)}&limit=20`);
      if (!response.ok) {
        throw new Error('Failed to fetch images');
      }
      
      const data = await response.json();
      if (data.success && data.images) {
        const formattedImages = (data.images || []).map((result: any) => ({
          id: result.id,
          title: result.title,
          content: result.snippet || result.description,
          url: result.contextLink || result.url,
          imageUrl: result.url,
          metadata: {
            ...result.metadata,
            type: 'image',
            source: result.source || 'Google Images',
            rankingScore: result.ranking?.finalScore || result.finalScore || 0
          }
        }));
        
        setImages(formattedImages);
        setSearchInfo({
          totalResults: formattedImages.length,
          totalImages: formattedImages.length,
          totalWeb: 0,
          totalVideos: 0,
          realGoogleResults: true,
          searchSource: data.searchInfo?.searchSource || 'google_images'
        });
      } else {
        setError('No images found');
      }
    } catch (err) {
      setError('Failed to load images');
      console.error('Error fetching images:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch images when query changes
  useEffect(() => {
    if (query && !showAnimatedLoading) {
      fetchImages(query);
    }
  }, [query, showAnimatedLoading]);

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

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 bg-gray-900/95 backdrop-blur-sm border-b border-gray-700/50 p-6"
      >
        {/* Centered - Fractal logo and search bar */}
        <div className="flex items-center gap-6 w-full max-w-4xl">
          {/* Fractal Logo */}
          <motion.button
            onClick={goHome}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="text-2xl font-bold text-white tracking-tight"
          >
            Fractal
          </motion.button>

          {/* Search Bar */}
          <div className="flex-1 relative">
            <Input
              type="text"
              placeholder="Search the web..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={handleKeyPress}
              className="w-full h-12 px-4 pr-12 bg-gray-800/80 border-gray-600/50 text-white placeholder:text-gray-400 focus:border-gray-500 focus:ring-2 focus:ring-gray-500/20 rounded-full backdrop-blur-sm transition-all duration-200"
            />
            
            {/* Search Icon */}
            <Button
              onClick={handleSearch}
              className="absolute right-1 top-1/2 -translate-y-1/2 h-10 w-10 p-0 bg-gray-700/80 hover:bg-gray-600/90 text-white border border-gray-600/50 backdrop-blur-sm rounded-full transition-all duration-200"
            >
              <Search className="w-4 h-4 text-white" />
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Filter Tabs */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.3 }}
        className="relative z-10 flex items-center justify-center p-4 border-b border-slate-700/30"
      >
        <div className="flex items-center gap-1 bg-slate-800/30 rounded-full p-1 backdrop-blur-sm">
          {[
            { id: 'all', label: 'all' },
            { id: 'images', label: 'images' },
            { id: 'videos', label: 'videos' }
          ].map((filter) => (
            <motion.button
              key={filter.id}
              onClick={() => navigateToFilter(filter.id)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`px-6 py-2 rounded-full text-sm font-medium transition-all duration-300 capitalize ${
                activeFilter === filter.id
                  ? 'bg-gray-700/80 text-white border border-gray-600/50'
                  : 'text-gray-300 hover:text-white hover:bg-gray-800/60 border border-gray-700/40'
              }`}
            >
              {filter.label}
            </motion.button>
          ))}
        </div>
      </motion.div>

      {/* Search Results Content */}
      <div className="relative z-10 px-6 py-8 pb-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="max-w-6xl mx-auto"
        >
          {/* Loading State */}
          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="text-white text-lg">Loading images...</div>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="flex items-center justify-center py-12">
              <div className="text-red-400 text-lg">{error}</div>
            </div>
          )}

          {/* No Query State */}
          {!query && !loading && (
            <div className="flex items-center justify-center py-12">
              <div className="text-gray-400 text-lg">Enter a search query to find images</div>
            </div>
          )}

          {/* Image search results */}
          {images.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {images.map((image, index) => (
                <ImageCard
                  key={image.id}
                  id={image.id}
                  title={image.title}
                  url={image.url}
                  thumbnailUrl={image.thumbnailUrl || image.url}
                  source={image.source}
                  dimensions={image.dimensions}
                  size={image.fileSize}
                  alt={image.alt}
                  index={index}
                />
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}

export default function SearchImages() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    }>
      <SearchImagesContent />
    </Suspense>
  );
}
