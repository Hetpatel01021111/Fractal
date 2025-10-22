"use client";

import { motion, useInView } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { WobbleCard } from "@/components/ui/wobble-card";
import { ExternalLink, Download, Heart } from "lucide-react";
import { useRef, useState } from "react";

interface ImageCardProps {
  id: string;
  title: string;
  url: string;
  thumbnailUrl: string;
  source: string;
  dimensions?: string;
  size?: string;
  alt?: string;
  index: number;
}

export function ImageCard({ 
  id, 
  title, 
  url, 
  thumbnailUrl, 
  source, 
  dimensions, 
  size, 
  alt,
  index 
}: ImageCardProps) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });
  const [imageError, setImageError] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);
  const [currentImageUrl, setCurrentImageUrl] = useState(thumbnailUrl);
  const [fallbackIndex, setFallbackIndex] = useState(-1);
  
  // Fallback image URLs
  const fallbackUrls = [
    `https://picsum.photos/300/200?random=${Math.floor(Math.random() * 1000)}`,
    `https://picsum.photos/300/200?random=${Math.floor(Math.random() * 1000) + 500}`,
    `https://via.placeholder.com/300x200/4a5568/ffffff?text=Image`
  ];

  const handleImageClick = () => {
    window.open(url, '_blank');
  };

  const handleDownload = (e: React.MouseEvent) => {
    e.stopPropagation();
    // In a real implementation, this would trigger a download
    console.log('Downloading image:', url);
  };

  const handleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    // In a real implementation, this would save to favorites
    console.log('Liked image:', id);
  };

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, x: 100 }}
      animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: 100 }}
      transition={{ duration: 0.6, delay: index * 0.1 }}
      className="group"
    >
      <div onClick={handleImageClick}>
        <WobbleCard
          containerClassName="bg-transparent border-gray-700/30 backdrop-blur-sm hover:bg-white/5 hover:border-gray-600/50 hover:shadow-xl transition-all duration-300 cursor-pointer overflow-hidden shadow-lg"
          className="!p-0 !px-0 !py-0 relative h-full"
        >
          {/* Full-sized Image Container */}
          <div className="relative aspect-square overflow-hidden w-full h-full">
            {/* Loading placeholder */}
            {imageLoading && (
              <div className="w-full h-full bg-gray-800 animate-pulse flex items-center justify-center">
                <div className="text-gray-400 text-sm">Loading...</div>
              </div>
            )}
            
            {/* Error fallback */}
            {imageError && (
              <div className="w-full h-full bg-gray-800 flex items-center justify-center">
                <div className="text-center text-gray-400">
                  <div className="text-4xl mb-2">🖼️</div>
                  <div className="text-sm">Image not available</div>
                </div>
              </div>
            )}
            
            {/* Actual image */}
            {!imageError && (
              <img
                src={currentImageUrl}
                alt={alt || title}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                loading="lazy"
                onLoad={() => setImageLoading(false)}
                onError={() => {
                  // Try fallback URLs before giving up
                  if (fallbackIndex < fallbackUrls.length - 1) {
                    const nextIndex = fallbackIndex + 1;
                    setFallbackIndex(nextIndex);
                    setCurrentImageUrl(fallbackUrls[nextIndex]);
                    setImageLoading(true);
                  } else {
                    setImageError(true);
                    setImageLoading(false);
                  }
                }}
              />
            )}
            
            {/* Info Overlay - Only visible on hover */}
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-between p-4">
              {/* Top section with action buttons */}
              <div className="flex items-center justify-end gap-2">
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={handleDownload}
                  className="p-2 bg-white/20 rounded-full backdrop-blur-sm hover:bg-white/30 transition-colors"
                >
                  <Download className="w-4 h-4 text-white" />
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={handleLike}
                  className="p-2 bg-white/20 rounded-full backdrop-blur-sm hover:bg-white/30 transition-colors"
                >
                  <Heart className="w-4 h-4 text-white" />
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={handleImageClick}
                  className="p-2 bg-white/20 rounded-full backdrop-blur-sm hover:bg-white/30 transition-colors"
                >
                  <ExternalLink className="w-4 h-4 text-white" />
                </motion.button>
              </div>

              {/* Bottom section with image info */}
              <div className="space-y-2">
                <h3 className="text-white text-sm font-medium line-clamp-2 group-hover:text-blue-300 transition-colors">
                  {title}
                </h3>
                
                <div className="flex items-center justify-between text-xs text-slate-300">
                  <span className="truncate">{source}</span>
                  {dimensions && (
                    <span className="ml-2 flex-shrink-0">{dimensions}</span>
                  )}
                </div>
                
                {size && (
                  <div className="text-xs text-slate-400">
                    {size}
                  </div>
                )}
              </div>
            </div>
          </div>
        </WobbleCard>
      </div>
    </motion.div>
  );
}
