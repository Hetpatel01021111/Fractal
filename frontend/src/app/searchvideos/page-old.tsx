"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { VideoCard } from "@/components/VideoCard";
import { StaticShaderBackground } from "@/components/ui/static-shader-background";
import { AnimatedLoading } from "@/components/ui/animated-loading";

function SearchVideosContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Get the search query from URL parameters
  const query = searchParams.get('q') || '';
  const [searchQuery, setSearchQuery] = useState(query);
  const activeFilter = 'videos';
  const [showAnimatedLoading, setShowAnimatedLoading] = useState(true);

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
    <div className="min-h-screen relative overflow-hidden">
      {/* Static Shader Background */}
      <div className="absolute inset-0">
        <StaticShaderBackground />
      </div>
      
      {/* Professional overlay */}
      <div className="absolute inset-0 bg-black/20"></div>

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
      <div className="relative z-10 px-6 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="max-w-4xl mx-auto"
        >
          {/* Video search results */}
          <div className="space-y-6">
            {[
              {
                id: "1",
                title: "Amazing Nature Documentary - Wildlife in 4K",
                url: "https://youtube.com/watch?v=example1",
                thumbnailUrl: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400&h=225&fit=crop",
                source: "YouTube",
                duration: "15:32",
                views: "2.3M views",
                publishedAt: "2 days ago",
                description: "Explore the breathtaking beauty of wildlife in this stunning 4K documentary featuring rare animals in their natural habitat."
              },
              {
                id: "2",
                title: "Cooking Masterclass: Italian Pasta Techniques",
                url: "https://youtube.com/watch?v=example2",
                thumbnailUrl: "https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=400&h=225&fit=crop",
                source: "YouTube",
                duration: "8:45",
                views: "856K views",
                publishedAt: "1 week ago",
                description: "Learn authentic Italian pasta making techniques from a master chef in this comprehensive cooking tutorial."
              },
              {
                id: "3",
                title: "Space Exploration: Journey to Mars",
                url: "https://youtube.com/watch?v=example3",
                thumbnailUrl: "https://images.unsplash.com/photo-1446776877081-d282a0f896e2?w=400&h=225&fit=crop",
                source: "YouTube",
                duration: "22:15",
                views: "5.1M views",
                publishedAt: "3 days ago",
                description: "Discover the latest developments in Mars exploration and what the future holds for human space travel."
              },
              {
                id: "4",
                title: "Music Production Tutorial: Electronic Beats",
                url: "https://youtube.com/watch?v=example4",
                thumbnailUrl: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=225&fit=crop",
                source: "YouTube",
                duration: "12:30",
                views: "1.2M views",
                publishedAt: "5 days ago",
                description: "Step-by-step guide to creating professional electronic music using modern production techniques and software."
              },
              {
                id: "5",
                title: "Travel Vlog: Hidden Gems of Japan",
                url: "https://youtube.com/watch?v=example5",
                thumbnailUrl: "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=400&h=225&fit=crop",
                source: "YouTube",
                duration: "18:42",
                views: "3.7M views",
                publishedAt: "1 week ago",
                description: "Join us on an incredible journey through Japan's most beautiful and lesser-known destinations."
              },
              {
                id: "6",
                title: "Photography Tips: Mastering Natural Light",
                url: "https://youtube.com/watch?v=example6",
                thumbnailUrl: "https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=400&h=225&fit=crop",
                source: "YouTube",
                duration: "14:20",
                views: "1.8M views",
                publishedAt: "4 days ago",
                description: "Professional photography techniques for capturing stunning images using natural light and composition."
              },
              {
                id: "7",
                title: "Fitness Workout: High-Intensity Training",
                url: "https://youtube.com/watch?v=example7",
                thumbnailUrl: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=225&fit=crop",
                source: "YouTube",
                duration: "25:15",
                views: "4.2M views",
                publishedAt: "6 days ago",
                description: "Complete high-intensity workout routine for building strength and endurance at home or gym."
              },
              {
                id: "8",
                title: "Tech Review: Latest Smartphone Comparison",
                url: "https://youtube.com/watch?v=example8",
                thumbnailUrl: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400&h=225&fit=crop",
                source: "YouTube",
                duration: "18:45",
                views: "2.9M views",
                publishedAt: "1 week ago",
                description: "Comprehensive review and comparison of the latest flagship smartphones from major manufacturers."
              },
              {
                id: "9",
                title: "Art Tutorial: Digital Painting Techniques",
                url: "https://youtube.com/watch?v=example9",
                thumbnailUrl: "https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=400&h=225&fit=crop",
                source: "YouTube",
                duration: "32:10",
                views: "1.5M views",
                publishedAt: "3 days ago",
                description: "Learn advanced digital painting techniques using professional software and tools for creating stunning artwork."
              },
              {
                id: "10",
                title: "Gaming: Epic Boss Battle Walkthrough",
                url: "https://youtube.com/watch?v=example10",
                thumbnailUrl: "https://images.unsplash.com/photo-1493711662062-fa541adb3fc8?w=400&h=225&fit=crop",
                source: "YouTube",
                duration: "28:30",
                views: "6.7M views",
                publishedAt: "2 days ago",
                description: "Complete walkthrough and strategy guide for defeating the most challenging boss in the latest action RPG."
              }
            ].map((video, index) => (
              <VideoCard
                key={video.id}
                {...video}
                index={index}
              />
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export default function SearchVideos() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    }>
      <SearchVideosContent />
    </Suspense>
  );
}
