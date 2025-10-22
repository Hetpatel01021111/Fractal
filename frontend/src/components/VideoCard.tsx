"use client";

// Removed framer-motion to fix Vercel HTML import error
import { Card, CardContent } from "@/components/ui/card";
import { ExternalLink, Play, Clock, Eye } from "lucide-react";
import { useRef } from "react";

interface VideoCardProps {
  id: string;
  title: string;
  url: string;
  thumbnailUrl: string;
  source: string;
  duration?: string;
  views?: string;
  publishedAt?: string;
  description?: string;
  index: number;
}

export function VideoCard({ 
  id, 
  title, 
  url, 
  thumbnailUrl, 
  source, 
  duration,
  views,
  publishedAt,
  description,
  index 
}: VideoCardProps) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  const handleVideoClick = () => {
    window.open(url, '_blank');
  };

  const handlePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    // In a real implementation, this might open a modal or redirect
    console.log('Playing video:', url);
  };

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, x: 100 }}
      animate={isInView ? { opacity: 1, x: 0 } : { opacity: 0, x: 100 }}
      transition={{ duration: 0.6, delay: index * 0.1 }}
      whileHover={{ scale: 1.01 }}
      className="group"
    >
      <Card 
        className="bg-transparent border-gray-700/30 backdrop-blur-sm hover:bg-white/5 hover:border-gray-600/50 hover:shadow-xl transition-all duration-300 cursor-pointer shadow-lg"
        onClick={handleVideoClick}
      >
        <CardContent className="p-0">
          <div className="flex gap-4 p-6">
            {/* Thumbnail Container */}
            <div className="relative w-48 h-32 flex-shrink-0 overflow-hidden rounded-lg bg-gray-800">
              {thumbnailUrl ? (
                <img
                  src={thumbnailUrl}
                  alt={title}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  loading="lazy"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.style.display = 'none';
                    target.nextElementSibling?.classList.remove('hidden');
                  }}
                />
              ) : null}
              
              {/* Fallback thumbnail */}
              <div className={`${thumbnailUrl ? 'hidden' : ''} w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-700 to-gray-800`}>
                <Play className="w-12 h-12 text-gray-400" />
              </div>
              
              {/* Play Button Overlay */}
              <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={handlePlay}
                  className="p-3 bg-white/20 rounded-full backdrop-blur-sm hover:bg-white/30 transition-colors"
                >
                  <Play className="w-6 h-6 text-white ml-1" />
                </motion.button>
              </div>

              {/* Duration Badge */}
              {duration && (
                <div className="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-2 py-1 rounded">
                  {duration}
                </div>
              )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between mb-2">
                <h3 className="text-xl text-white font-medium line-clamp-2 group-hover:text-blue-300 transition-colors">
                  {title}
                </h3>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={handleVideoClick}
                  className="p-2 text-slate-400 hover:text-white transition-colors flex-shrink-0 ml-2"
                >
                  <ExternalLink className="w-4 h-4" />
                </motion.button>
              </div>

              {description && (
                <p className="text-slate-400 mb-3 line-clamp-2">
                  {description}
                </p>
              )}

              <div className="flex items-center gap-4 text-sm text-slate-500">
                <span className="font-medium text-slate-300">{source}</span>
                {publishedAt && (
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {publishedAt}
                  </span>
                )}
                {views && (
                  <span className="flex items-center gap-1">
                    <Eye className="w-3 h-3" />
                    {views}
                  </span>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
