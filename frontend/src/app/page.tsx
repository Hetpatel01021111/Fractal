"use client";

// Removed framer-motion to fix Vercel HTML import error
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { Search } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { SafeInteractiveShader } from "@/components/SafeInteractiveShader";

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
        <SafeInteractiveShader />
      </div>
      
      {/* Professional overlay */}
      <div className="absolute inset-0 bg-black/10"></div>
      
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4">
        {/* Brand */}
        <div className="text-center mb-8 animate-fade-in-up">
          <h1 className="text-6xl md:text-8xl font-bold text-white mb-4 tracking-tight drop-shadow-2xl animate-fade-in-up-delay">
            Fractal
          </h1>
        </div>

        {/* Search Container */}
        <div className="w-full max-w-2xl animate-fade-in-up-delay-2">
          <div className="relative">
            {/* Search Input */}
            <div className="relative mb-4 hover:scale-105 transition-transform duration-200">
              <Input
                type="text"
                placeholder="Search the web..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={handleKeyPress}
                className="w-full h-16 px-6 pr-20 text-lg bg-black/40 border-white/20 text-white placeholder:text-white/60 focus:border-white/60 focus:ring-2 focus:ring-white/20 rounded-full backdrop-blur-md transition-all duration-300 shadow-2xl"
              />
            </div>
              
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
            <div className="mt-6 flex flex-wrap justify-center gap-3 animate-fade-in-up-delay-3">
              {["AI & Machine Learning", "Web Development", "Design Patterns", "Quantum Computing"].map((suggestion, index) => (
                <button
                  key={suggestion}
                  className="hover:scale-105 active:scale-95 transition-transform duration-200"
                  onClick={() => {
                    setSearchQuery(suggestion);
                    setTimeout(() => {
                      router.push(`/searchall?q=${encodeURIComponent(suggestion)}`);
                    }, 100);
                  }}
                  className="px-4 py-2 bg-white/10 border border-white/30 text-white rounded-full text-sm hover:border-white/60 hover:bg-white/20 hover:bg-blue-500/10 transition-all duration-300 backdrop-blur-sm"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 text-center animate-fade-in-delay-4">
          <div className="flex items-center justify-center gap-2 text-white/60">
            <span className="text-sm">Powered by</span>
            <div className="flex items-center gap-2 hover:scale-110 transition-transform duration-200">
              <Image
                src="/gemini-removebg-preview.png"
                alt="Gemini Logo"
                width={20}
                height={20}
                className="w-5 h-5"
              />
              <span className="text-sm font-medium text-white">Gemini AI</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
