"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Search, 
  Database, 
  Image, 
  TestTube, 
  TrendingUp, 
  AlertCircle, 
  CheckCircle, 
  Clock,
  Globe,
  Brain,
  BarChart3,
  Loader2
} from "lucide-react";

interface ScrapeResult {
  success: boolean;
  query: string;
  results: {
    documents: any[];
    images: any[];
    indexing: any;
    summary: any;
  };
}

interface TestResult {
  test: string;
  status: 'pass' | 'fail' | 'warning';
  message: string;
  duration?: number;
}

interface IndexStats {
  totalDocuments: number;
  totalImages: number;
  categories: { [key: string]: number };
  averageAIScore: number;
  searchPerformance: {
    averageResponseTime: number;
    totalSearches: number;
    popularQueries: string[];
  };
}

export default function AdminPage() {
  const [query, setQuery] = useState("");
  const [maxResults, setMaxResults] = useState(10);
  const [includeImages, setIncludeImages] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [scrapeResults, setScrapeResults] = useState<ScrapeResult | null>(null);
  const [testResults, setTestResults] = useState<any>(null);
  const [indexStats, setIndexStats] = useState<IndexStats | null>(null);
  const [activeTab, setActiveTab] = useState('scrape');

  // Load index statistics
  useEffect(() => {
    loadIndexStats();
  }, []);

  const loadIndexStats = async () => {
    try {
      const response = await fetch('/api/admin/index');
      const data = await response.json();
      if (data.success) {
        setIndexStats(data.stats);
      }
    } catch (error) {
      console.error('Failed to load index stats:', error);
    }
  };

  const handleScrape = async () => {
    if (!query.trim()) return;
    
    setIsLoading(true);
    try {
      const response = await fetch('/api/admin/real-scrape', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query,
          maxResults,
          includeImages,
          categories: ['general']
        })
      });
      
      const data = await response.json();
      setScrapeResults(data);
      
      if (data.success) {
        // Index the scraped data
        await fetch('/api/admin/index', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            documents: data.results.documents,
            images: data.results.images
          })
        });
        
        // Reload stats
        await loadIndexStats();
      }
    } catch (error) {
      console.error('Scraping failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const runTests = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/admin/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tests: 'all',
          query: query || 'machine learning'
        })
      });
      
      const data = await response.json();
      setTestResults(data);
    } catch (error) {
      console.error('Testing failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pass': return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'fail': return <AlertCircle className="w-5 h-5 text-red-500" />;
      case 'warning': return <AlertCircle className="w-5 h-5 text-yellow-500" />;
      default: return <Clock className="w-5 h-5 text-gray-500" />;
    }
  };

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
            Fractal Search Admin
          </h1>
          <p className="text-gray-400">
            Scrape, index, and manage your AI-powered search engine
          </p>
        </motion.div>

        {/* Navigation Tabs */}
        <div className="flex space-x-4 mb-8">
          {[
            { id: 'scrape', label: 'Data Scraping', icon: Globe },
            { id: 'index', label: 'Index Management', icon: Database },
            { id: 'test', label: 'System Testing', icon: TestTube }
          ].map(({ id, label, icon: Icon }) => (
            <Button
              key={id}
              variant={activeTab === id ? "default" : "outline"}
              onClick={() => setActiveTab(id)}
              className="flex items-center space-x-2"
            >
              <Icon className="w-4 h-4" />
              <span>{label}</span>
            </Button>
          ))}
        </div>

        {/* Scraping Tab */}
        {activeTab === 'scrape' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-6"
          >
            {/* Scraping Form */}
            <Card className="bg-gray-900 border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Search className="w-5 h-5" />
                  <span>Web Scraping & Indexing</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-2">Search Query</label>
                    <Input
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="e.g., machine learning, AI, deep learning"
                      className="bg-gray-800 border-gray-600"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Max Results</label>
                    <Input
                      type="number"
                      value={maxResults}
                      onChange={(e) => setMaxResults(parseInt(e.target.value))}
                      min="1"
                      max="50"
                      className="bg-gray-800 border-gray-600"
                    />
                  </div>
                </div>
                
                <div className="flex items-center space-x-4">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={includeImages}
                      onChange={(e) => setIncludeImages(e.target.checked)}
                      className="rounded"
                    />
                    <span>Include Images</span>
                  </label>
                </div>

                <Button
                  onClick={handleScrape}
                  disabled={isLoading || !query.trim()}
                  className="w-full"
                >
                  {isLoading ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Scraping...</>
                  ) : (
                    <><Globe className="w-4 h-4 mr-2" /> Start Scraping</>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Scraping Results */}
            {scrapeResults && (
              <Card className="bg-gray-900 border-gray-700">
                <CardHeader>
                  <CardTitle>Scraping Results</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-400">
                        {scrapeResults.results.summary.documentsFound}
                      </div>
                      <div className="text-sm text-gray-400">Documents</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-400">
                        {scrapeResults.results.summary.imagesFound}
                      </div>
                      <div className="text-sm text-gray-400">Images</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-400">
                        {scrapeResults.results.summary.averageRelevance?.toFixed(1)}
                      </div>
                      <div className="text-sm text-gray-400">Avg AI Score</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-yellow-400">
                        {scrapeResults.results.summary.processingTimeMs}ms
                      </div>
                      <div className="text-sm text-gray-400">Processing Time</div>
                    </div>
                  </div>

                  {/* Document Preview */}
                  <div className="space-y-3">
                    <h4 className="font-semibold">Top Documents:</h4>
                    {scrapeResults.results.documents.slice(0, 3).map((doc, idx) => (
                      <div key={idx} className="bg-gray-800 p-3 rounded border-l-4 border-blue-500">
                        <div className="font-medium">{doc.title}</div>
                        <div className="text-sm text-gray-400 mt-1">
                          AI Score: {doc.metadata.aiScore} | Source: {doc.metadata.source}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </motion.div>
        )}

        {/* Index Management Tab */}
        {activeTab === 'index' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-6"
          >
            {indexStats && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Stats Cards */}
                <Card className="bg-gray-900 border-gray-700">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Database className="w-5 h-5" />
                      <span>Index Statistics</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between">
                      <span>Documents:</span>
                      <span className="font-bold">{indexStats.totalDocuments}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Images:</span>
                      <span className="font-bold">{indexStats.totalImages}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Avg AI Score:</span>
                      <span className="font-bold">{indexStats.averageAIScore.toFixed(1)}</span>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gray-900 border-gray-700">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <BarChart3 className="w-5 h-5" />
                      <span>Performance</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between">
                      <span>Total Searches:</span>
                      <span className="font-bold">{indexStats.searchPerformance.totalSearches}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Avg Response:</span>
                      <span className="font-bold">{indexStats.searchPerformance.averageResponseTime}ms</span>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gray-900 border-gray-700">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <TrendingUp className="w-5 h-5" />
                      <span>Popular Queries</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {indexStats.searchPerformance.popularQueries.map((query, idx) => (
                        <div key={idx} className="text-sm bg-gray-800 px-2 py-1 rounded">
                          {query}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </motion.div>
        )}

        {/* Testing Tab */}
        {activeTab === 'test' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-6"
          >
            <Card className="bg-gray-900 border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <TestTube className="w-5 h-5" />
                  <span>System Testing</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Button
                  onClick={runTests}
                  disabled={isLoading}
                  className="w-full mb-6"
                >
                  {isLoading ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Running Tests...</>
                  ) : (
                    <><TestTube className="w-4 h-4 mr-2" /> Run All Tests</>
                  )}
                </Button>

                {testResults && (
                  <div className="space-y-4">
                    {/* Overall Status */}
                    <div className="flex items-center justify-between p-4 bg-gray-800 rounded">
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(testResults.overall.status)}
                        <span className="font-semibold">Overall Status</span>
                      </div>
                      <div className="text-right">
                        <div className="font-bold">{testResults.overall.message}</div>
                        <div className="text-sm text-gray-400">
                          Success Rate: {testResults.summary.successRate}
                        </div>
                      </div>
                    </div>

                    {/* Individual Tests */}
                    <div className="space-y-2">
                      {testResults.tests.map((test: TestResult, idx: number) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-3 bg-gray-800 rounded"
                        >
                          <div className="flex items-center space-x-3">
                            {getStatusIcon(test.status)}
                            <span className="font-medium">{test.test}</span>
                          </div>
                          <div className="text-right">
                            <div className="text-sm">{test.message}</div>
                            {test.duration && (
                              <div className="text-xs text-gray-400">{test.duration}ms</div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>
    </div>
  );
}
