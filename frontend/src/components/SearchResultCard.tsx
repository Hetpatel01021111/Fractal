"use client";

import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { ExternalLink, Download, Heart, Play, Clock, Eye, Image as ImageIcon, Video } from "lucide-react";

interface SearchResultCardProps {
  id: string;
  title: string;
  url: string;
  description?: string;
  websiteName?: string;
  favicon?: string;
  imageUrl?: string;
  index: number;
}

export function SearchResultCard({ 
  id, 
  title, 
  url, 
  description,
  websiteName,
  favicon,
  imageUrl,
  index 
}: SearchResultCardProps) {
  const handleClick = () => {
    window.open(url, '_blank');
  };

  const handleMenuClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    console.log('Menu clicked for:', id);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className="group w-full"
    >
      <Card 
        className="bg-transparent border-gray-700/30 backdrop-blur-sm hover:bg-white/5 hover:border-gray-600/50 hover:shadow-xl transition-all duration-300 cursor-pointer w-full shadow-lg h-[140px] flex-shrink-0"
        onClick={handleClick}
      >
        <CardContent className="p-4 h-full">
          <div className="flex gap-4 h-full">
                  {/* Left Content */}
                  <div className="flex-1 min-w-0 flex flex-col justify-between h-full">
                    {/* Top Section - Favicon, Website Name, URL */}
                    <div className="flex items-center gap-3 mb-2">
                      {/* Favicon */}
                      <div className="w-5 h-5 flex-shrink-0">
                        {favicon ? (
                          <img 
                            src={favicon} 
                            alt={websiteName || 'Website'} 
                            className="w-5 h-5 rounded-full"
                          />
                        ) : (
                          <div className="w-5 h-5 bg-white rounded-full flex items-center justify-center">
                            <span className="text-black text-xs font-bold">W</span>
                          </div>
                        )}
                      </div>
                      
                      {/* Website Name and URL */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <div className="min-w-0">
                            <div className="text-slate-300 text-sm font-medium truncate">
                              {websiteName || 'Website'}
                            </div>
                            <div className="text-slate-400 text-xs truncate">
                              {url}
                            </div>
                          </div>
                          
                          {/* Three-dot menu */}
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={handleMenuClick}
                            className="p-1 text-slate-400 hover:text-white transition-colors flex-shrink-0"
                          >
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                            </svg>
                          </motion.button>
                        </div>
                      </div>
                    </div>

                    {/* Title and Description Section */}
                    <div className="flex-1 min-h-0">
                      {/* Title */}
                      <h3 className="text-gray-200 text-base font-bold mb-1 line-clamp-2 group-hover:text-white transition-colors">
                        {title}
                      </h3>

                      {/* Description */}
                      {description && (
                        <p className="text-slate-300 text-sm line-clamp-2">
                          {description}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Right Side - Image Placeholder */}
                  <div className="w-28 h-20 flex-shrink-0 self-center">
                    {imageUrl ? (
                      <img
                        src={imageUrl}
                        alt={title}
                        className="w-full h-full object-cover rounded-lg"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full bg-slate-700 rounded-lg flex items-center justify-center">
                        <ImageIcon className="w-8 h-8 text-slate-500" />
                      </div>
                    )}
                  </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
