"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { Search } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";

// Dynamic import for Three.js component to avoid SSR issues
const InteractiveShaderAnimation = dynamic(
  () => import("@/components/ui/interactive-shader-animation").then(mod => ({ default: mod.InteractiveShaderAnimation })),
  { 
    ssr: false,
    loading: () => <div className="fixed inset-0 bg-gradient-to-br from-purple-900 via-black to-blue-900" />
  }
);

export default function FractalSearch() {
  const [searchQuery, setSearchQuery] = useState("");
  const router = useRouter();

  const handleSearch = () => {
    if (searchQuery.trim()) {
      router.push(`/searchall?q=${searchQuery}`);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Interactive Shader Animation Background */}
      <div className="absolute inset-0">
        <InteractiveShaderAnimation />
      </div>
      
      {/* Professional overlay */}
      <div className="absolute inset-0 bg-black/10"></div>
      
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4">
        {/* Brand */}
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="text-center mb-8"
        >
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-6xl md:text-8xl font-bold text-white mb-4 tracking-tight drop-shadow-2xl"
          >
            Fractal
          </motion.h1>
        </motion.div>

        {/* Search Container */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="w-full max-w-2xl"
        >
          <div className="relative">
            {/* Search Input */}
            <motion.div
              whileFocus={{ scale: 1.02 }}
              transition={{ duration: 0.2 }}
              className="relative mb-4"
            >
              <Input
                type="text"
                placeholder="Search the web..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={handleKeyPress}
                className="w-full h-16 px-6 pr-20 text-lg bg-black/40 border-white/20 text-white placeholder:text-white/60 focus:border-white/60 focus:ring-2 focus:ring-white/20 rounded-full backdrop-blur-md transition-all duration-300 shadow-2xl"
              />
            </motion.div>
              
            {/* Search Button */}
            <div className="flex items-center justify-center gap-4">
              <Button
                size="lg"
                className="bg-white/20 hover:bg-white/30 border-white/30 text-white backdrop-blur-md transition-all duration-300"
                onClick={handleSearch}
              >
                <Search className="w-5 h-5 mr-2" />
                Search
              </Button>
            
              {/* Admin Link */}
              <Button
                size="sm"
                variant="outline"
                className="bg-white/10 hover:bg-white/20 border-white/20 text-white backdrop-blur-md transition-all duration-300"
                onClick={() => router.push('/admin')}
              >
                Admin Panel
              </Button>
            </div>

            {/* Search Suggestions */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.8 }}
              className="mt-6 flex flex-wrap justify-center gap-3"
            >
              {["AI & Machine Learning", "Web Development", "Design Patterns", "Quantum Computing"].map((suggestion, index) => (
                <motion.button
                  key={suggestion}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 1.0 + index * 0.1 }}
                  whileHover={{ scale: 1.05, backgroundColor: "rgba(59, 130, 246, 0.1)" }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    setSearchQuery(suggestion);
                    setTimeout(() => {
                      router.push(`/searchall?q=${encodeURIComponent(suggestion)}`);
                    }, 100);
                  }}
                  className="px-4 py-2 bg-white/10 border border-white/30 text-white rounded-full text-sm hover:border-white/60 hover:bg-white/20 transition-all duration-300 backdrop-blur-sm"
                >
                  {suggestion}
                </motion.button>
              ))}
            </motion.div>
          </div>
        </motion.div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 1.2 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 text-center"
        >
          <div className="flex items-center justify-center gap-2 text-white/60">
            <span className="text-sm">Powered by</span>
            <motion.div
              whileHover={{ scale: 1.1 }}
              transition={{ duration: 0.2 }}
              className="flex items-center gap-2"
            >
              <Image
                src="/gemini-removebg-preview.png"
                alt="Gemini Logo"
                width={20}
                height={20}
                className="w-5 h-5"
              />
              <span className="text-sm font-medium text-white">Gemini AI</span>
            </motion.div>
          </div>
        </motion.div>

      </div>
    </div>
  );
}
