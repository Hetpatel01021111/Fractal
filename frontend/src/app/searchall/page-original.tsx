"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, ChevronLeft, ChevronRight, Loader2, AlertCircle } from "lucide-react";
import { useState, Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { SearchResultCard } from "@/components/SearchResultCard";
import { searchDocuments, SearchResponse, ApiService } from "@/lib/api";

function SearchAllContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Get the search query from URL parameters
  const query = searchParams.get('q') || '';
  const [searchQuery, setSearchQuery] = useState(query);
  const activeFilter = 'all';
  
  // Pagination state
  const currentPage = parseInt(searchParams.get('page') || '1');
  const resultsPerPage = 10;

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

  // All search results data
  const allResults = [
    {
      id: "1",
      title: "Complete Guide to Web Development in 2024",
      description: "Learn the latest web development technologies, frameworks, and best practices for building modern applications.",
      url: "https://example.com/web-development-guide",
      websiteName: "Example.com",
      favicon: "https://www.google.com/s2/favicons?domain=example.com",
      imageUrl: "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?w=400&h=300&fit=crop"
    },
    {
      id: "2",
      title: "React vs Vue: Which Framework Should You Choose?",
      description: "A comprehensive comparison of React and Vue.js frameworks, including performance metrics, learning curves, and use cases.",
      url: "https://techblog.com/react-vs-vue",
      websiteName: "TechBlog",
      favicon: "https://www.google.com/s2/favicons?domain=techblog.com",
      imageUrl: "https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=400&h=300&fit=crop"
    },
    {
      id: "3",
      title: "Understanding TypeScript: Advanced Types and Patterns",
      description: "Deep dive into TypeScript's advanced type system, including generics, conditional types, and utility types.",
      url: "https://typescript-guide.com/advanced-types",
      websiteName: "TypeScript Guide",
      favicon: "https://www.google.com/s2/favicons?domain=typescript-guide.com",
      imageUrl: "https://images.unsplash.com/photo-1516116216624-53e697fedbea?w=400&h=300&fit=crop"
    },
    {
      id: "4",
      title: "Modern CSS Techniques for Responsive Design",
      description: "Explore the latest CSS features including Grid, Flexbox, and custom properties for creating beautiful, responsive layouts.",
      url: "https://css-tricks.com/modern-techniques",
      websiteName: "CSS-Tricks",
      favicon: "https://www.google.com/s2/favicons?domain=css-tricks.com",
      imageUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=300&fit=crop"
    },
    {
      id: "5",
      title: "Node.js Performance Optimization Best Practices",
      description: "Learn how to optimize your Node.js applications for better performance, including memory management and async patterns.",
      url: "https://nodejs.org/performance-guide",
      websiteName: "Node.js",
      favicon: "https://www.google.com/s2/favicons?domain=nodejs.org",
      imageUrl: "https://images.unsplash.com/photo-1627398242454-45a1465c2479?w=400&h=300&fit=crop"
    },
    {
      id: "6",
      title: "JavaScript ES2024: New Features and Improvements",
      description: "Discover the latest JavaScript features including new array methods, pattern matching, and performance enhancements.",
      url: "https://javascript.info/es2024-features",
      websiteName: "JavaScript.info",
      favicon: "https://www.google.com/s2/favicons?domain=javascript.info",
      imageUrl: "https://images.unsplash.com/photo-1579468118864-1b9ea3c0db4a?w=400&h=300&fit=crop"
    },
    {
      id: "7",
      title: "Database Design Patterns for Scalable Applications",
      description: "Learn essential database design patterns and optimization techniques for building scalable web applications.",
      url: "https://dbpatterns.com/scalable-design",
      websiteName: "DB Patterns",
      favicon: "https://www.google.com/s2/favicons?domain=dbpatterns.com",
      imageUrl: "https://images.unsplash.com/photo-1544383835-bda2bc66a55d?w=400&h=300&fit=crop"
    },
    {
      id: "8",
      title: "Microservices Architecture: Best Practices and Patterns",
      description: "Comprehensive guide to microservices architecture, including service communication, data management, and deployment strategies.",
      url: "https://microservices.io/patterns",
      websiteName: "Microservices.io",
      favicon: "https://www.google.com/s2/favicons?domain=microservices.io",
      imageUrl: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=400&h=300&fit=crop"
    },
    {
      id: "9",
      title: "API Security: Authentication and Authorization",
      description: "Essential security practices for API development, including JWT tokens, OAuth 2.0, and rate limiting techniques.",
      url: "https://apisecurity.com/authentication",
      websiteName: "API Security",
      favicon: "https://www.google.com/s2/favicons?domain=apisecurity.com",
      imageUrl: "https://images.unsplash.com/photo-1555949963-aa79dcee981c?w=400&h=300&fit=crop"
    },
    {
      id: "10",
      title: "Cloud Computing: AWS vs Azure vs Google Cloud",
      description: "Detailed comparison of major cloud platforms, their services, pricing models, and use cases for different applications.",
      url: "https://cloudcomparison.com/aws-azure-gcp",
      websiteName: "Cloud Comparison",
      favicon: "https://www.google.com/s2/favicons?domain=cloudcomparison.com",
      imageUrl: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=400&h=300&fit=crop"
    },
    {
      id: "11",
      title: "Machine Learning Fundamentals for Developers",
      description: "Comprehensive guide to machine learning concepts, algorithms, and implementation for software developers.",
      url: "https://ml-guide.com/fundamentals",
      websiteName: "ML Guide",
      favicon: "https://www.google.com/s2/favicons?domain=ml-guide.com",
      imageUrl: "https://images.unsplash.com/photo-1555949963-aa79dcee981c?w=400&h=300&fit=crop"
    },
    {
      id: "12",
      title: "DevOps Best Practices: CI/CD Pipeline Setup",
      description: "Learn how to set up efficient CI/CD pipelines and implement DevOps best practices for modern development teams.",
      url: "https://devops-tutorial.com/cicd-setup",
      websiteName: "DevOps Tutorial",
      favicon: "https://www.google.com/s2/favicons?domain=devops-tutorial.com",
      imageUrl: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=400&h=300&fit=crop"
    },
    {
      id: "13",
      title: "GraphQL vs REST API: Complete Comparison",
      description: "Detailed comparison between GraphQL and REST APIs, including performance, flexibility, and use cases.",
      url: "https://api-comparison.com/graphql-vs-rest",
      websiteName: "API Comparison",
      favicon: "https://www.google.com/s2/favicons?domain=api-comparison.com",
      imageUrl: "https://images.unsplash.com/photo-1555949963-aa79dcee981c?w=400&h=300&fit=crop"
    },
    {
      id: "14",
      title: "Docker Containerization: From Basics to Production",
      description: "Complete guide to Docker containerization, from basic concepts to production deployment strategies.",
      url: "https://docker-guide.com/production",
      websiteName: "Docker Guide",
      favicon: "https://www.google.com/s2/favicons?domain=docker-guide.com",
      imageUrl: "https://images.unsplash.com/photo-1555949963-aa79dcee981c?w=400&h=300&fit=crop"
    },
    {
      id: "15",
      title: "Kubernetes Orchestration: Advanced Deployment",
      description: "Advanced Kubernetes concepts including orchestration, scaling, and production deployment strategies.",
      url: "https://k8s-advanced.com/orchestration",
      websiteName: "K8s Advanced",
      favicon: "https://www.google.com/s2/favicons?domain=k8s-advanced.com",
      imageUrl: "https://images.unsplash.com/photo-1555949963-aa79dcee981c?w=400&h=300&fit=crop"
    },
    {
      id: "16",
      title: "Blockchain Development: Smart Contracts Guide",
      description: "Learn blockchain development fundamentals and smart contract programming for decentralized applications.",
      url: "https://blockchain-dev.com/smart-contracts",
      websiteName: "Blockchain Dev",
      favicon: "https://www.google.com/s2/favicons?domain=blockchain-dev.com",
      imageUrl: "https://images.unsplash.com/photo-1555949963-aa79dcee981c?w=400&h=300&fit=crop"
    },
    {
      id: "17",
      title: "Cybersecurity Fundamentals for Developers",
      description: "Essential cybersecurity practices and secure coding techniques for modern software development.",
      url: "https://cyber-security.com/developer-guide",
      websiteName: "Cyber Security",
      favicon: "https://www.google.com/s2/favicons?domain=cyber-security.com",
      imageUrl: "https://images.unsplash.com/photo-1555949963-aa79dcee981c?w=400&h=300&fit=crop"
    },
    {
      id: "18",
      title: "Mobile App Development: React Native vs Flutter",
      description: "Comprehensive comparison between React Native and Flutter for cross-platform mobile app development.",
      url: "https://mobile-dev.com/react-native-vs-flutter",
      websiteName: "Mobile Dev",
      favicon: "https://www.google.com/s2/favicons?domain=mobile-dev.com",
      imageUrl: "https://images.unsplash.com/photo-1555949963-aa79dcee981c?w=400&h=300&fit=crop"
    },
    {
      id: "19",
      title: "WebAssembly: High-Performance Web Applications",
      description: "Learn WebAssembly for building high-performance web applications with near-native speed.",
      url: "https://webassembly-guide.com/performance",
      websiteName: "WebAssembly Guide",
      favicon: "https://www.google.com/s2/favicons?domain=webassembly-guide.com",
      imageUrl: "https://images.unsplash.com/photo-1555949963-aa79dcee981c?w=400&h=300&fit=crop"
    },
    {
      id: "20",
      title: "Progressive Web Apps: Complete Development Guide",
      description: "Build Progressive Web Apps (PWAs) with offline capabilities, push notifications, and native app-like experience.",
      url: "https://pwa-guide.com/complete-development",
      websiteName: "PWA Guide",
      favicon: "https://www.google.com/s2/favicons?domain=pwa-guide.com",
      imageUrl: "https://images.unsplash.com/photo-1555949963-aa79dcee981c?w=400&h=300&fit=crop"
    }
  ];

  // Pagination logic
  const totalPages = Math.ceil(allResults.length / resultsPerPage);
  const startIndex = (currentPage - 1) * resultsPerPage;
  const endIndex = startIndex + resultsPerPage;
  const currentResults = allResults.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams);
    params.set('page', page.toString());
    router.push(`/searchall?${params.toString()}`);
  };

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/10 via-purple-900/10 to-cyan-900/10"></div>
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,rgba(59,130,246,0.1),transparent_50%)]"></div>
      </div>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 flex items-center justify-center p-6 border-b border-slate-700/50"
      >
        {/* Centered - Fractal logo and search bar */}
        <div className="flex items-center gap-6 w-full max-w-4xl">
          {/* Fractal Logo */}
          <motion.button
            onClick={goHome}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="text-2xl font-bold bg-gradient-to-r from-blue-800 via-blue-600 to-blue-500 bg-clip-text text-transparent tracking-tight hover:from-blue-900 hover:via-blue-700 hover:to-blue-600 transition-all duration-300"
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
              className="w-full h-12 px-4 pr-12 bg-slate-700/60 border-slate-500 text-white placeholder:text-slate-300 focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20 rounded-full backdrop-blur-sm transition-all duration-300"
            />
            
            {/* Search Icon */}
            <Button
              onClick={handleSearch}
              className="absolute right-1 top-1/2 -translate-y-1/2 h-10 w-10 p-0 bg-gradient-to-r from-blue-800 via-blue-600 to-blue-500 hover:from-blue-900 hover:via-blue-700 hover:to-blue-600 rounded-full shadow-lg hover:shadow-blue-500/25 transition-all duration-300"
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
                  ? 'bg-gradient-to-r from-blue-800 via-blue-600 to-blue-500 text-white shadow-lg'
                  : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
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
          {/* Search results */}
          <div className="space-y-6">
            {currentResults.map((result, index) => (
              <SearchResultCard
                key={result.id}
                {...result}
                index={index}
              />
            ))}
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-center mt-12 mb-8">
            <div className="flex items-center gap-4">
              {/* Previous Button - Before 'f' */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="flex items-center gap-1 px-3 py-2 text-blue-400 hover:text-blue-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
                <span className="text-sm">Previous</span>
              </motion.button>

              {/* Fractal Branding with Page Numbers */}
              <div className="flex items-center">
                <span className="text-white text-2xl font-normal">
                  fr
                  {Array.from({ length: totalPages }, (_, i) => (
                    <motion.span
                      key={i}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => handlePageChange(i + 1)}
                      className={`cursor-pointer transition-all duration-300 ${
                        currentPage === i + 1
                          ? 'text-blue-400'
                          : 'text-white hover:text-blue-300'
                      }`}
                    >
                      a
                    </motion.span>
                  ))}
                  ctal
                </span>
              </div>

              {/* Next Button - After 'l' */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="flex items-center gap-1 px-3 py-2 text-blue-400 hover:text-blue-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="text-sm">Next</span>
                <ChevronRight className="w-4 h-4" />
              </motion.button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export default function SearchAll() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    }>
      <SearchAllContent />
    </Suspense>
  );
}
